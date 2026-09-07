import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import type { ContentBlock, DocumentBlock, DocumentIR, FigureRecord, MathNode } from "../document-engine/document-ir.js";
import type { DocxBlockNode, DocxInlineNode, ExtractedDocxAsset } from "../document-engine/types.js";
import { parseDocx } from "../document-engine/docx/parser.js";
import { readSafeZip } from "../document-engine/docx/zip.js";
import { descendants, getAttribute, parseXml } from "../document-engine/xml.js";

export type UnifiedInputKind = "WORD" | "PDF" | "IMAGE";
export type UnifiedInputStatus = "PASS" | "REVIEW_REQUIRED" | "FAIL";
export type SemanticKind = "text" | "math" | "figure" | "table";

export interface UnifiedInputSource {
  readonly name: string;
  readonly bytes: Uint8Array;
  readonly mimeType?: string;
}

export interface UnifiedInputDiagnostic {
  readonly code: string;
  readonly severity: "warning" | "error";
  readonly message: string;
  readonly sourceLocation?: string;
}

export interface RecognitionRegion {
  readonly id: string;
  readonly kind: SemanticKind;
  readonly order: number;
  readonly sourceLocation: string;
  readonly text?: string;
  readonly latex?: string;
  readonly cells?: ContentBlock[][];
  readonly figure?: Omit<FigureRecord, "id" | "sourceLocation"> & { id?: string };
  readonly confidence?: number;
}

export interface RecognitionOutput {
  readonly provider: string;
  readonly regions: RecognitionRegion[];
  readonly diagnostics?: UnifiedInputDiagnostic[];
}

export interface StemRecognitionProvider {
  readonly id: string;
  recognize(source: UnifiedInputSource): Promise<RecognitionOutput>;
}

export interface UnifiedInputOptions {
  readonly recognizer?: StemRecognitionProvider;
  /** Minimum confidence for probabilistic OCR regions. Defaults to 0.80. */
  readonly minConfidence?: number;
  /** If true, PDF/image inputs must use a semantic recognizer. Defaults to true. */
  readonly requireSemanticRecognition?: boolean;
  /** Classify standalone raster images inside Word as math/page-image/figure. Defaults to true. */
  readonly classifyWordRasterAssets?: boolean;
}

export interface UnifiedInputResult {
  readonly ok: boolean;
  readonly status: UnifiedInputStatus;
  readonly kind?: UnifiedInputKind;
  readonly document?: DocumentIR;
  readonly diagnostics: UnifiedInputDiagnostic[];
  readonly classification: Record<SemanticKind, number>;
  readonly provider?: string;
  /** Sidecar recognition evidence keeps probabilistic region/confidence data outside canonical DocumentIR. */
  readonly evidence?: RecognitionRegion[];
}

interface MtefBridgeItem { id: string; bytes: Uint8Array }
interface MtefBridgeResult { id: string; ok: boolean; latex?: string; error?: string }
interface RecognizedWordAsset {
  readonly content: ContentBlock[];
  readonly figures: FigureRecord[];
  readonly diagnostics: UnifiedInputDiagnostic[];
  readonly evidence: RecognitionRegion[];
}

const zeroClassification = (): Record<SemanticKind, number> => ({ text: 0, math: 0, figure: 0, table: 0 });
const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const ext = (name: string) => path.extname(name).toLowerCase();

function fail(code: string, message: string): UnifiedInputResult {
  return { ok: false, status: "FAIL", diagnostics: [{ code, severity: "error", message }], classification: zeroClassification() };
}

function sniffKind(source: UnifiedInputSource): UnifiedInputKind | "LEGACY_DOC" | undefined {
  const extension = ext(source.name);
  const b = source.bytes;
  const zip = b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;
  const pdf = b.length >= 5 && Buffer.from(b.subarray(0, 5)).toString("ascii") === "%PDF-";
  const png = b.length >= 8 && Buffer.from(b.subarray(0, 8)).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = b.length >= 4 && b[0] === 0xff && b[1] === 0xd8 && b[b.length - 2] === 0xff && b[b.length - 1] === 0xd9;
  const ole = b.length >= 8 && Buffer.from(b.subarray(0, 8)).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  if (extension === ".docx" && zip) return "WORD";
  if (extension === ".doc" && ole) return "LEGACY_DOC";
  if (extension === ".pdf" && pdf) return "PDF";
  if ([".png", ".jpg", ".jpeg"].includes(extension) && (png || jpeg)) return "IMAGE";
  return undefined;
}

function mediaType(asset: ExtractedDocxAsset): string {
  return asset.mediaType || (asset.filename.match(/\.png$/i) ? "image/png" : asset.filename.match(/\.jpe?g$/i) ? "image/jpeg" : asset.filename.match(/\.wmf$/i) ? "image/wmf" : asset.filename.match(/\.emf$/i) ? "image/emf" : "application/octet-stream");
}

function isRasterAsset(asset: ExtractedDocxAsset): boolean {
  const mime = mediaType(asset);
  return mime === "image/png" || mime === "image/jpeg" || /\.(?:png|jpe?g)$/i.test(asset.filename);
}

function figureFromAsset(asset: ExtractedDocxAsset, sourceLocation: string, semanticRole: "REAL_FIGURE" | "RASTER_FIGURE" = /(?:wmf|emf)/i.test(mediaType(asset)) || /\.(?:wmf|emf)$/i.test(asset.filename) ? "REAL_FIGURE" : "RASTER_FIGURE"): FigureRecord {
  const mime = mediaType(asset);
  return {
    id: asset.id,
    relationshipId: asset.relationshipId,
    mediaPath: asset.packagePath,
    mimeType: mime,
    bytes: new Uint8Array(asset.bytes),
    sourceLocation,
    dimensions: { widthEmu: asset.widthEmu, heightEmu: asset.heightEmu },
    semanticRole,
    derivation: {
      sourceAssetId: asset.id,
      sourceMediaPath: asset.packagePath,
      sourceFormat: path.extname(asset.filename).replace(/^\./, "").toUpperCase() || "UNKNOWN",
      sourceMime: mime,
      sourceSha256: sha256(asset.bytes),
      semanticRole,
      status: "SOURCE",
    },
  };
}

function normalizeLatex(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  const withoutDisplay = trimmed.replace(/^\$\$\s*/, "").replace(/\s*\$\$$/, "").trim();
  return withoutDisplay || undefined;
}

function extractOleRelationships(docx: Uint8Array): Map<string, Uint8Array> {
  const result = new Map<string, Uint8Array>();
  const pkg = readSafeZip(docx);
  const relBytes = pkg.entries.get("word/_rels/document.xml.rels");
  if (!relBytes) return result;
  const root = parseXml(new TextDecoder("utf-8").decode(relBytes));
  for (const rel of descendants(root, "Relationship")) {
    const id = getAttribute(rel, "Id");
    const target = getAttribute(rel, "Target");
    const type = getAttribute(rel, "Type") ?? "";
    if (!id || !target || !/\/oleObject$/i.test(type)) continue;
    const packagePath = path.posix.normalize(path.posix.join("word", target));
    if (!packagePath.startsWith("word/") || packagePath.includes("../")) continue;
    const bytes = pkg.entries.get(packagePath);
    if (bytes) result.set(id, bytes);
  }
  return result;
}

function decodeMtef(items: MtefBridgeItem[]): MtefBridgeResult[] {
  if (!items.length) return [];
  const payload = JSON.stringify({ items: items.map((item) => ({ id: item.id, base64: Buffer.from(item.bytes).toString("base64") })) });
  try {
    const stdout = execFileSync("uv", ["run", "python", "scripts/mtef_decode_bridge.py"], {
      input: payload,
      encoding: "utf8",
      windowsHide: true,
      maxBuffer: 16 * 1024 * 1024,
    });
    const parsed = JSON.parse(stdout) as { items?: MtefBridgeResult[] };
    return Array.isArray(parsed.items) ? parsed.items : items.map(({ id }) => ({ id, ok: false, error: "MTEF_BRIDGE_INVALID_RESPONSE" }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return items.map(({ id }) => ({ id, ok: false, error: `MTEF_BRIDGE_FAILED: ${message}` }));
  }
}

function mathNodeFromOmml(child: Extract<DocxInlineNode, { type: "math" }>): MathNode {
  const latex = normalizeLatex(child.expression.latex ?? child.expression.normalized);
  return {
    sourceType: "OMML",
    sourceRaw: child.expression.raw ?? "",
    ...(latex ? { latex, normalized: latex } : {}),
    parseStatus: latex ? "PARSED" : "UNRESOLVED",
    warnings: latex ? [] : ["OMML_MATH_UNRESOLVED"],
    sourceLocation: child.sourcePath,
  };
}

function classify(document: DocumentIR): Record<SemanticKind, number> {
  const out = zeroClassification();
  const visit = (content: ContentBlock[]) => {
    for (const block of content) {
      if (block.type === "text") out.text++;
      else if (block.type === "math") out.math++;
      else if (block.type === "figure") out.figure++;
      else if (block.type === "table") { out.table++; for (const cell of block.cells) visit(cell); }
    }
  };
  for (const block of document.blocks) visit(block.content);
  return out;
}

function unresolvedMath(document: DocumentIR): number {
  let count = 0;
  const visit = (content: ContentBlock[]) => {
    for (const block of content) {
      if (block.type === "math" && block.math.parseStatus !== "PARSED") count++;
      else if (block.type === "table") for (const cell of block.cells) visit(cell);
    }
  };
  for (const block of document.blocks) visit(block.content);
  return count;
}

function documentFromRecognition(source: UnifiedInputSource, output: RecognitionOutput, minConfidence: number): { document: DocumentIR; diagnostics: UnifiedInputDiagnostic[] } {
  const diagnostics: UnifiedInputDiagnostic[] = [...(output.diagnostics ?? [])];
  const figures: FigureRecord[] = [];
  const blocks: DocumentBlock[] = [];
  for (const region of [...output.regions].sort((a, b) => a.order - b.order)) {
    if (region.confidence !== undefined && region.confidence < minConfidence) diagnostics.push({ code: "LOW_RECOGNITION_CONFIDENCE", severity: "warning", message: `${region.kind} region ${region.id} confidence ${region.confidence.toFixed(3)} is below ${minConfidence.toFixed(3)}.`, sourceLocation: region.sourceLocation });
    let content: ContentBlock[] = [];
    if (region.kind === "text" && region.text) content = [{ type: "text", value: region.text, sourceLocation: region.sourceLocation }];
    else if (region.kind === "math" && region.latex) {
      const latex = normalizeLatex(region.latex)!;
      content = [{ type: "math", math: { sourceType: "LATEX", sourceRaw: region.latex, latex, normalized: latex, parseStatus: "PARSED", warnings: [`OCR_PROVIDER:${output.provider}`], sourceLocation: region.sourceLocation }, sourceLocation: region.sourceLocation }];
    } else if (region.kind === "figure" && region.figure) {
      const figureId = region.figure.id ?? `recognized-figure-${figures.length + 1}`;
      const figure: FigureRecord = { ...region.figure, id: figureId, sourceLocation: region.sourceLocation, semanticRole: region.figure.semanticRole ?? "RASTER_FIGURE" };
      figures.push(figure);
      content = [{ type: "figure", figureId, sourceLocation: region.sourceLocation }];
    } else if (region.kind === "table" && region.cells) content = [{ type: "table", cells: region.cells, sourceLocation: region.sourceLocation }];
    else {
      diagnostics.push({ code: "RECOGNITION_REGION_INCOMPLETE", severity: "warning", message: `Recognizer returned incomplete ${region.kind} region ${region.id}.`, sourceLocation: region.sourceLocation });
      continue;
    }
    blocks.push({ id: region.id, kind: region.kind === "table" ? "TABLE" : "PARAGRAPH", order: blocks.length, content, sourceLocation: region.sourceLocation });
  }
  const document: DocumentIR = { sourceDocument: source.name, sourceHash: sha256(source.bytes), blocks, figures, warnings: diagnostics.map((d) => d.code) };
  return { document, diagnostics };
}

async function recognizeWordAsset(asset: ExtractedDocxAsset, recognizer: StemRecognitionProvider, minConfidence: number): Promise<RecognizedWordAsset> {
  const source: UnifiedInputSource = { name: asset.filename, bytes: asset.bytes, mimeType: mediaType(asset) };
  const output = await recognizer.recognize(source);
  const mapped = documentFromRecognition(source, output, minConfidence);
  const classes = classify(mapped.document);
  const evidence = [...output.regions];
  const semanticContent = mapped.document.blocks.flatMap((block) => block.content);
  const mixedPage = classes.figure > 0 && (classes.text > 0 || classes.math > 0 || classes.table > 0);

  if (mixedPage) {
    return {
      content: semanticContent,
      figures: mapped.document.figures,
      diagnostics: mapped.diagnostics,
      evidence,
    };
  }

  if (classes.figure > 0) {
    const original = figureFromAsset(asset, `word/asset:${asset.packagePath}`, "REAL_FIGURE");
    return { content: [{ type: "figure", figureId: original.id, sourceLocation: `word/asset:${asset.packagePath}` }], figures: [original], diagnostics: mapped.diagnostics, evidence };
  }

  if (classes.math > 0 || classes.text > 0 || classes.table > 0) {
    return { content: semanticContent, figures: mapped.document.figures, diagnostics: mapped.diagnostics, evidence };
  }

  const original = figureFromAsset(asset, `word/asset:${asset.packagePath}`, "RASTER_FIGURE");
  return {
    content: [{ type: "figure", figureId: original.id, sourceLocation: `word/asset:${asset.packagePath}` }],
    figures: [original],
    diagnostics: [...mapped.diagnostics, { code: "WORD_RASTER_ASSET_AMBIGUOUS", severity: "warning", message: `Raster asset ${asset.filename} contained no confidently detected text, math, table, or figure region; preserved as a figure for review.`, sourceLocation: asset.packagePath }],
    evidence,
  };
}

function mapInline(
  child: DocxInlineNode,
  assetById: Map<string, ExtractedDocxAsset>,
  recognizedAssets: Map<string, RecognizedWordAsset>,
  oleLatex: Map<string, string>,
  figures: FigureRecord[],
  diagnostics: UnifiedInputDiagnostic[],
): ContentBlock[] {
  if (child.type === "text") return child.text ? [{ type: "text", value: child.text }] : [];
  if (child.type === "math") return [{ type: "math", math: mathNodeFromOmml(child), sourceLocation: child.sourcePath }];
  if (child.type === "image") {
    const asset = child.assetId ? assetById.get(child.assetId) : undefined;
    if (!asset) {
      diagnostics.push({ code: "WORD_FIGURE_ASSET_MISSING", severity: "warning", message: `Figure asset is missing for ${child.relationshipId}.`, sourceLocation: child.sourcePath });
      return [];
    }
    const recognized = recognizedAssets.get(asset.id);
    if (recognized) {
      for (const figure of recognized.figures) if (!figures.some((f) => f.id === figure.id)) figures.push(figure);
      return recognized.content;
    }
    if (!figures.some((f) => f.id === asset.id)) figures.push(figureFromAsset(asset, child.sourcePath));
    return [{ type: "figure", figureId: asset.id, sourceLocation: child.sourcePath }];
  }
  if (child.type === "legacy_object") {
    const rid = child.relationshipId;
    const latex = rid ? oleLatex.get(rid) : undefined;
    if (latex) {
      const math: MathNode = {
        sourceType: "LATEX",
        sourceRaw: `MTEF/OLE:${rid}`,
        latex,
        normalized: latex,
        parseStatus: "PARSED",
        warnings: ["SOURCE_FORMAT_MTEF"],
        sourceLocation: child.sourcePath,
      };
      return [{ type: "math", math, sourceLocation: child.sourcePath }];
    }
    diagnostics.push({ code: "LEGACY_MATHTYPE_UNRESOLVED", severity: "warning", message: `Legacy MathType/OLE equation ${rid ?? "without relationship id"} could not be decoded.`, sourceLocation: child.sourcePath });
    return [];
  }
  return [];
}

function mapDocxBlock(
  block: DocxBlockNode,
  order: number,
  assetById: Map<string, ExtractedDocxAsset>,
  recognizedAssets: Map<string, RecognizedWordAsset>,
  oleLatex: Map<string, string>,
  figures: FigureRecord[],
  diagnostics: UnifiedInputDiagnostic[],
): DocumentBlock | undefined {
  if (block.type === "section_break") return undefined;
  if (block.type === "paragraph") {
    const content = block.children.flatMap((child) => mapInline(child, assetById, recognizedAssets, oleLatex, figures, diagnostics));
    if (!content.length) return undefined;
    return {
      id: `word-block-${order}`,
      kind: block.headingLevel ? "SECTION" : "PARAGRAPH",
      order,
      paragraphIndex: block.index,
      style: block.styleId,
      numbering: block.list?.numberingId,
      content,
      sourceLocation: `word/document.xml:p:${block.index}`,
    };
  }
  const cells = block.rows.flatMap((row) => row.cells.map((cell) => cell.blocks.flatMap((cellBlock) => cellBlock.type === "paragraph" ? cellBlock.children.flatMap((child) => mapInline(child, assetById, recognizedAssets, oleLatex, figures, diagnostics)) : [])));
  return {
    id: `word-table-${order}`,
    kind: "TABLE",
    order,
    paragraphIndex: block.index,
    content: [{ type: "table", cells, sourceLocation: `word/document.xml:tbl:${block.index}` }],
    sourceLocation: `word/document.xml:tbl:${block.index}`,
  };
}

async function ingestWord(source: UnifiedInputSource, options: UnifiedInputOptions): Promise<UnifiedInputResult> {
  const parsed = parseDocx(source.bytes, { sourceName: source.name });
  if (!parsed.ast || parsed.status === "FAIL") {
    return { ok: false, status: "FAIL", kind: "WORD", diagnostics: parsed.report.errors.map((issue) => ({ code: issue.code, severity: "error", message: issue.message, sourceLocation: issue.path })), classification: zeroClassification() };
  }
  const diagnostics: UnifiedInputDiagnostic[] = [];
  const evidence: RecognitionRegion[] = [];
  const ole = extractOleRelationships(source.bytes);
  const legacyIds = new Set<string>();
  for (const block of parsed.ast.blocks) {
    if (block.type === "paragraph") for (const child of block.children) if (child.type === "legacy_object" && child.relationshipId) legacyIds.add(child.relationshipId);
    if (block.type === "table") for (const row of block.rows) for (const cell of row.cells) for (const cellBlock of cell.blocks) if (cellBlock.type === "paragraph") for (const child of cellBlock.children) if (child.type === "legacy_object" && child.relationshipId) legacyIds.add(child.relationshipId);
  }
  const bridgeItems = [...legacyIds].flatMap((id) => ole.get(id) ? [{ id, bytes: ole.get(id)! }] : []);
  const decoded = decodeMtef(bridgeItems);
  const oleLatex = new Map(decoded.filter((x) => x.ok && normalizeLatex(x.latex)).map((x) => [x.id, normalizeLatex(x.latex)!]));
  for (const id of legacyIds) {
    if (!ole.has(id)) diagnostics.push({ code: "MATHTYPE_OLE_RELATIONSHIP_MISSING", severity: "warning", message: `OLE payload was not found for ${id}.` });
    else if (!oleLatex.has(id)) diagnostics.push({ code: "MATHTYPE_MTEF_DECODE_FAILED", severity: "warning", message: decoded.find((x) => x.id === id)?.error ?? `MTEF decode failed for ${id}.` });
  }

  const assetById = new Map(parsed.ast.assets.map((asset) => [asset.id, asset]));
  const recognizedAssets = new Map<string, RecognizedWordAsset>();
  const classifyRaster = options.classifyWordRasterAssets ?? true;
  const rasterAssets = parsed.ast.assets.filter(isRasterAsset);
  if (classifyRaster && rasterAssets.length) {
    if (!options.recognizer) diagnostics.push({ code: "WORD_RASTER_ASSET_CLASSIFICATION_SKIPPED", severity: "warning", message: `${rasterAssets.length} standalone raster Word asset(s) were preserved, but no semantic recognizer was configured to distinguish formula images from real figures.` });
    else {
      for (const asset of rasterAssets) {
        try {
          const recognized = await recognizeWordAsset(asset, options.recognizer, options.minConfidence ?? 0.80);
          recognizedAssets.set(asset.id, recognized);
          diagnostics.push(...recognized.diagnostics);
          evidence.push(...recognized.evidence);
        } catch (error) {
          diagnostics.push({ code: "WORD_RASTER_ASSET_RECOGNIZER_FAILED", severity: "warning", message: error instanceof Error ? error.message : String(error), sourceLocation: asset.packagePath });
        }
      }
    }
  }

  const figures: FigureRecord[] = [];
  const blocks = parsed.ast.blocks.map((block, index) => mapDocxBlock(block, index, assetById, recognizedAssets, oleLatex, figures, diagnostics)).filter((block): block is DocumentBlock => Boolean(block));
  const document: DocumentIR = { sourceDocument: source.name, sourceHash: sha256(source.bytes), blocks, figures, warnings: diagnostics.map((d) => d.code) };
  const ignoredWhenResolved = new Set(["LEGACY_MATHTYPE_NEEDS_FALLBACK", "IMAGE_MATH_NOT_PARSED"]);
  for (const issue of [...parsed.report.unsupported, ...parsed.report.warnings]) {
    if (ignoredWhenResolved.has(issue.code)) continue;
    diagnostics.push({ code: issue.code, severity: "warning", message: issue.message, sourceLocation: issue.path });
  }
  if (unresolvedMath(document)) diagnostics.push({ code: "WORD_MATH_UNRESOLVED", severity: "warning", message: "One or more Word equations could not be normalized to LaTeX." });
  const status: UnifiedInputStatus = diagnostics.some((d) => d.severity === "error") ? "FAIL" : diagnostics.length ? "REVIEW_REQUIRED" : "PASS";
  return { ok: status !== "FAIL", status, kind: "WORD", document: { ...document, warnings: diagnostics.map((d) => d.code) }, diagnostics, classification: classify(document), provider: [legacyIds.size ? "MTEF" : undefined, options.recognizer && rasterAssets.length ? options.recognizer.id : undefined, "OMML"].filter(Boolean).join("+") || "OMML", evidence };
}

async function ingestRecognized(source: UnifiedInputSource, kind: "PDF" | "IMAGE", options: UnifiedInputOptions): Promise<UnifiedInputResult> {
  const recognizer = options.recognizer;
  const requireSemantic = options.requireSemanticRecognition ?? true;
  if (!recognizer) {
    if (requireSemantic) return { ok: false, status: "FAIL", kind, diagnostics: [{ code: "SEMANTIC_RECOGNIZER_REQUIRED", severity: "error", message: `${kind} input requires a STEM semantic recognizer so text, math, and figures are not silently conflated.` }], classification: zeroClassification() };
    return { ok: true, status: "REVIEW_REQUIRED", kind, document: { sourceDocument: source.name, sourceHash: sha256(source.bytes), blocks: [], figures: [], warnings: ["SEMANTIC_RECOGNITION_SKIPPED"] }, diagnostics: [{ code: "SEMANTIC_RECOGNITION_SKIPPED", severity: "warning", message: "Semantic recognition was explicitly skipped." }], classification: zeroClassification() };
  }
  try {
    const output = await recognizer.recognize(source);
    const { document, diagnostics } = documentFromRecognition(source, output, options.minConfidence ?? 0.80);
    const classes = classify(document);
    if (classes.math === 0) diagnostics.push({ code: "NO_MATH_DETECTED", severity: "warning", message: "No mathematical region was detected; review if the source is expected to contain formulas." });
    const status: UnifiedInputStatus = diagnostics.some((d) => d.severity === "error") ? "FAIL" : diagnostics.length ? "REVIEW_REQUIRED" : "PASS";
    return { ok: status !== "FAIL", status, kind, document: { ...document, warnings: diagnostics.map((d) => d.code) }, diagnostics, classification: classes, provider: output.provider, evidence: output.regions };
  } catch (error) {
    return { ok: false, status: "FAIL", kind, diagnostics: [{ code: "SEMANTIC_RECOGNIZER_FAILED", severity: "error", message: error instanceof Error ? error.message : String(error) }], classification: zeroClassification(), provider: recognizer.id };
  }
}

export async function ingestUnifiedSource(source: UnifiedInputSource, options: UnifiedInputOptions = {}): Promise<UnifiedInputResult> {
  if (!source || typeof source.name !== "string" || !source.name.trim()) return fail("SOURCE_METADATA_REQUIRED", "A source filename is required.");
  if (!(source.bytes instanceof Uint8Array) || source.bytes.length === 0) return fail("EMPTY_SOURCE", "The input source is empty.");
  const kind = sniffKind(source);
  if (kind === "LEGACY_DOC") return fail("LEGACY_DOC_CONVERSION_REQUIRED", "Binary .doc must be converted by the controlled Word/LibreOffice adapter to .docx before canonical semantic ingest.");
  if (!kind) return fail("UNSUPPORTED_OR_MISMATCHED_INPUT", "Supported canonical inputs are valid DOCX, PDF, PNG, and JPEG files whose signatures match their extensions.");
  if (kind === "WORD") return ingestWord(source, options);
  return ingestRecognized(source, kind, options);
}
