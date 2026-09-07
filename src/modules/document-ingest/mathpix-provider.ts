import { createHash } from "node:crypto";
import path from "node:path";
import { createCanvas, loadImage } from "canvas";
import type { ContentBlock, FigureRecord } from "../document-engine/document-ir.js";
import type { RecognitionOutput, RecognitionRegion, StemRecognitionProvider, UnifiedInputSource } from "./unified.js";

export interface MathpixProviderOptions {
  readonly appId: string;
  readonly appKey: string;
  readonly endpoint?: string;
  readonly pollIntervalMs?: number;
  readonly maxPolls?: number;
  /** Keep false by default: user content is not silently donated for model improvement. */
  readonly improveMathpix?: boolean;
  /** Delete remote PDF job after the MMD and figure crops have been copied locally. Defaults to true. */
  readonly deleteRemoteAfterRead?: boolean;
}

interface PendingImage {
  readonly order: number;
  readonly sourceLocation: string;
  readonly url: string;
  readonly alt: string;
}

interface MathpixLineData {
  readonly id?: string;
  readonly type?: string;
  readonly subtype?: string;
  readonly cnt?: number[][];
  readonly text?: string;
  readonly confidence?: number;
  readonly confidence_rate?: number;
  readonly conversion_output?: boolean;
  readonly data?: Array<{ type?: string; value?: string }>;
}

interface MathpixImageResponse {
  readonly text?: string;
  readonly line_data?: MathpixLineData[];
  readonly confidence?: number;
  readonly error?: string;
  readonly error_info?: unknown;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

function cleanLatex(value: string): string {
  return value.trim().replace(/^\\\(\s*/, "").replace(/\s*\\\)$/, "").replace(/^\\\[\s*/, "").replace(/\s*\\\]$/, "").replace(/^\$\$\s*/, "").replace(/\s*\$\$$/, "").trim();
}

function parseInlineContent(value: string, sourceLocation: string): ContentBlock[] {
  const content: ContentBlock[] = [];
  const pattern = /\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(value)) !== null) {
    const before = value.slice(cursor, match.index);
    if (before) content.push({ type: "text", value: before, sourceLocation });
    const latex = cleanLatex(match[1] ?? match[2] ?? match[3] ?? "");
    if (latex) content.push({ type: "math", math: { sourceType: "LATEX", sourceRaw: latex, latex, normalized: latex, parseStatus: "PARSED", warnings: ["OCR_PROVIDER:MATHPIX"], sourceLocation }, sourceLocation });
    cursor = match.index + match[0].length;
  }
  const tail = value.slice(cursor);
  if (tail) content.push({ type: "text", value: tail, sourceLocation });
  return content;
}

function markdownTable(block: string, sourceLocation: string): ContentBlock[][] | undefined {
  const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2 || !lines[0].includes("|") || !/^\|?\s*:?-{3,}/.test(lines[1])) return undefined;
  const dataLines = [lines[0], ...lines.slice(2)];
  const cells: ContentBlock[][] = [];
  for (const line of dataLines) {
    const rawCells = line.replace(/^\|/, "").replace(/\|$/, "").split("|");
    for (const cell of rawCells) cells.push(parseInlineContent(cell.trim(), sourceLocation));
  }
  return cells;
}

function pushTextAndMath(regions: RecognitionRegion[], text: string, sourceLocation: string, orderRef: { value: number }, confidence?: number): void {
  const pattern = /\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const before = text.slice(cursor, match.index);
    if (before.trim()) regions.push({ id: `ocr-region-${orderRef.value}`, kind: "text", order: orderRef.value++, sourceLocation: `${sourceLocation}:text:${cursor}`, text: before, confidence });
    const latex = cleanLatex(match[1] ?? match[2] ?? match[3] ?? "");
    if (latex) regions.push({ id: `ocr-region-${orderRef.value}`, kind: "math", order: orderRef.value++, sourceLocation: `${sourceLocation}:math:${match.index}`, latex, confidence });
    cursor = match.index + match[0].length;
  }
  const tail = text.slice(cursor);
  if (tail.trim()) regions.push({ id: `ocr-region-${orderRef.value}`, kind: "text", order: orderRef.value++, sourceLocation: `${sourceLocation}:text:${cursor}`, text: tail, confidence });
}

function parseMmdSkeleton(mmd: string): { regions: RecognitionRegion[]; images: PendingImage[] } {
  const regions: RecognitionRegion[] = [];
  const images: PendingImage[] = [];
  const orderRef = { value: 0 };
  let blockIndex = 0;
  for (const block of mmd.split(/\n\s*\n/)) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const sourceLocation = `mathpix:mmd:block:${blockIndex++}`;
    const cells = markdownTable(trimmed, sourceLocation);
    if (cells) {
      regions.push({ id: `ocr-region-${orderRef.value}`, kind: "table", order: orderRef.value++, sourceLocation, cells });
      continue;
    }
    const token = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)(?:\s+"[^"]*")?\)/g;
    let cursor = 0;
    let match: RegExpExecArray | null;
    while ((match = token.exec(trimmed)) !== null) {
      const before = trimmed.slice(cursor, match.index);
      if (before.trim()) pushTextAndMath(regions, before, `${sourceLocation}:segment:${cursor}`, orderRef);
      images.push({ order: orderRef.value++, sourceLocation: `${sourceLocation}:figure:${match.index}`, url: match[2], alt: match[1] ?? "" });
      cursor = match.index + match[0].length;
    }
    const tail = trimmed.slice(cursor);
    if (tail.trim()) pushTextAndMath(regions, tail, `${sourceLocation}:segment:${cursor}`, orderRef);
  }
  return { regions, images };
}

async function downloadFigure(image: PendingImage): Promise<RecognitionRegion> {
  const response = await fetch(image.url);
  if (!response.ok) throw new Error(`MATHPIX_FIGURE_DOWNLOAD_FAILED:${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const mimeType = response.headers.get("content-type")?.split(";")[0] || "application/octet-stream";
  const extension = mimeType === "image/png" ? ".png" : mimeType === "image/jpeg" ? ".jpg" : path.extname(new URL(image.url).pathname) || ".bin";
  const id = `mathpix-figure-${hash(bytes).slice(0, 16)}`;
  const figure: Omit<FigureRecord, "id" | "sourceLocation"> & { id?: string } = {
    id,
    relationshipId: id,
    mediaPath: `recognized/${id}${extension}`,
    mimeType,
    bytes,
    caption: image.alt || undefined,
    semanticRole: "REAL_FIGURE",
    derivation: {
      sourceAssetId: id,
      sourceFormat: extension.replace(/^\./, "").toUpperCase() || "UNKNOWN",
      sourceMime: mimeType,
      sourceSha256: hash(bytes),
      semanticRole: "REAL_FIGURE",
      status: "DERIVED",
      derivedAssetId: id,
      derivedFormat: mimeType === "image/png" ? "PNG" : undefined,
      derivedMime: mimeType === "image/png" ? "image/png" : undefined,
      derivedSha256: hash(bytes),
    },
  };
  return { id: `ocr-region-${image.order}`, kind: "figure", order: image.order, sourceLocation: image.sourceLocation, figure };
}

function contourBox(cnt: number[][] | undefined): { x: number; y: number; width: number; height: number } | undefined {
  if (!cnt?.length) return undefined;
  const xs = cnt.map((point) => Number(point[0])).filter(Number.isFinite);
  const ys = cnt.map((point) => Number(point[1])).filter(Number.isFinite);
  if (!xs.length || !ys.length) return undefined;
  const minX = Math.floor(Math.min(...xs));
  const maxX = Math.ceil(Math.max(...xs));
  const minY = Math.floor(Math.min(...ys));
  const maxY = Math.ceil(Math.max(...ys));
  if (maxX <= minX || maxY <= minY) return undefined;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

async function cropImageFigure(source: UnifiedInputSource, line: MathpixLineData, order: number, sourceLocation: string): Promise<RecognitionRegion | undefined> {
  const box = contourBox(line.cnt);
  if (!box) return undefined;
  const image = await loadImage(Buffer.from(source.bytes));
  const x = Math.max(0, Math.min(box.x, image.width - 1));
  const y = Math.max(0, Math.min(box.y, image.height - 1));
  const width = Math.max(1, Math.min(box.width, image.width - x));
  const height = Math.max(1, Math.min(box.height, image.height - y));
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  context.drawImage(image, x, y, width, height, 0, 0, width, height);
  const bytes = new Uint8Array(canvas.toBuffer("image/png"));
  const id = `image-figure-${hash(bytes).slice(0, 16)}`;
  return {
    id: `ocr-region-${order}`,
    kind: "figure",
    order,
    sourceLocation,
    confidence: line.confidence,
    figure: {
      id,
      relationshipId: id,
      mediaPath: `recognized/${id}.png`,
      mimeType: "image/png",
      bytes,
      semanticRole: "REAL_FIGURE",
      dimensions: { widthPx: width, heightPx: height },
      derivation: {
        sourceAssetId: `source-${hash(source.bytes).slice(0, 16)}`,
        sourceMediaPath: source.name,
        sourceFormat: path.extname(source.name).replace(/^\./, "").toUpperCase(),
        sourceMime: source.mimeType,
        sourceSha256: hash(source.bytes),
        semanticRole: "REAL_FIGURE",
        status: "DERIVED",
        derivedAssetId: id,
        derivedFormat: "PNG",
        derivedMime: "image/png",
        derivedSha256: hash(bytes),
      },
    },
  };
}

export class MathpixStemRecognizer implements StemRecognitionProvider {
  readonly id = "MATHPIX_STEM_V3";
  private readonly endpoint: string;
  constructor(private readonly options: MathpixProviderOptions) {
    if (!options.appId || !options.appKey) throw new Error("MATHPIX_CREDENTIALS_REQUIRED");
    this.endpoint = (options.endpoint ?? "https://api.mathpix.com").replace(/\/$/, "");
  }

  private headers(): Record<string, string> { return { app_id: this.options.appId, app_key: this.options.appKey }; }
  private metadata() { return { improve_mathpix: this.options.improveMathpix ?? false }; }

  private async recognizeImage(source: UnifiedInputSource): Promise<RecognitionOutput> {
    const form = new FormData();
    form.append("file", new Blob([source.bytes as BlobPart], { type: source.mimeType || "application/octet-stream" }), source.name);
    form.append("options_json", JSON.stringify({
      formats: ["text", "data"],
      include_line_data: true,
      enable_document_layout: true,
      math_inline_delimiters: ["\\(", "\\)"],
      math_display_delimiters: ["\\[", "\\]"],
      rm_spaces: true,
      metadata: this.metadata(),
    }));
    const response = await fetch(`${this.endpoint}/v3/text`, { method: "POST", headers: this.headers(), body: form });
    if (!response.ok) throw new Error(`MATHPIX_IMAGE_SUBMIT_FAILED:${response.status}:${await response.text()}`);
    const data = await response.json() as MathpixImageResponse;
    if (data.error) throw new Error(`MATHPIX_IMAGE_RECOGNITION_FAILED:${data.error}`);
    const regions: RecognitionRegion[] = [];
    const diagnostics: RecognitionOutput["diagnostics"] = [];
    const orderRef = { value: 0 };
    const lines = data.line_data ?? [];
    if (!lines.length && data.text) pushTextAndMath(regions, data.text, "mathpix:image:text", orderRef, data.confidence);
    for (const [index, line] of lines.entries()) {
      const type = line.type ?? "text";
      const location = `mathpix:image:line:${index}:${line.id ?? "unknown"}`;
      if (type === "diagram" || type === "chart") {
        const figure = await cropImageFigure(source, line, orderRef.value++, location);
        if (figure) regions.push(figure);
        else diagnostics.push({ code: "IMAGE_FIGURE_CROP_FAILED", severity: "warning", message: `Detected ${type} region could not be cropped.`, sourceLocation: location });
        continue;
      }
      if (type === "table" && line.text) {
        const cells = markdownTable(line.text, location);
        if (cells) regions.push({ id: `ocr-region-${orderRef.value}`, kind: "table", order: orderRef.value++, sourceLocation: location, cells, confidence: line.confidence });
        else pushTextAndMath(regions, line.text, location, orderRef, line.confidence);
        continue;
      }
      if (type === "math") {
        const latex = cleanLatex(line.data?.find((entry) => entry.type === "latex")?.value ?? line.text ?? "");
        if (latex) regions.push({ id: `ocr-region-${orderRef.value}`, kind: "math", order: orderRef.value++, sourceLocation: location, latex, confidence: line.confidence });
        else diagnostics.push({ code: "IMAGE_MATH_UNRESOLVED", severity: "warning", message: "Math region detected but no LaTeX was returned.", sourceLocation: location });
        continue;
      }
      if (line.text) pushTextAndMath(regions, line.text, location, orderRef, line.confidence);
    }
    return { provider: `${this.id}:IMAGE_TEXT`, regions, diagnostics };
  }

  private async recognizePdf(source: UnifiedInputSource): Promise<RecognitionOutput> {
    const form = new FormData();
    form.append("file", new Blob([source.bytes as BlobPart], { type: source.mimeType || "application/pdf" }), source.name);
    form.append("options_json", JSON.stringify({ rm_spaces: true, metadata: this.metadata() }));
    const submit = await fetch(`${this.endpoint}/v3/pdf`, { method: "POST", headers: this.headers(), body: form });
    if (!submit.ok) throw new Error(`MATHPIX_PDF_SUBMIT_FAILED:${submit.status}:${await submit.text()}`);
    const submitted = await submit.json() as { pdf_id?: string; error?: string };
    if (!submitted.pdf_id) throw new Error(`MATHPIX_PDF_ID_MISSING:${submitted.error ?? "unknown error"}`);
    const pdfId = submitted.pdf_id;
    try {
      const maxPolls = this.options.maxPolls ?? 120;
      const interval = this.options.pollIntervalMs ?? 750;
      let completed = false;
      for (let attempt = 0; attempt < maxPolls; attempt++) {
        const statusResponse = await fetch(`${this.endpoint}/v3/pdf/${encodeURIComponent(pdfId)}`, { headers: this.headers() });
        if (!statusResponse.ok) throw new Error(`MATHPIX_PDF_STATUS_FAILED:${statusResponse.status}`);
        const status = await statusResponse.json() as { status?: string; error?: string };
        if (status.status === "completed") { completed = true; break; }
        if (["error", "failed"].includes(status.status ?? "")) throw new Error(`MATHPIX_PDF_PROCESSING_FAILED:${status.error ?? status.status}`);
        await sleep(interval);
      }
      if (!completed) throw new Error("MATHPIX_PDF_PROCESSING_TIMEOUT");
      const result = await fetch(`${this.endpoint}/v3/pdf/${encodeURIComponent(pdfId)}.mmd`, { headers: this.headers() });
      if (!result.ok) throw new Error(`MATHPIX_PDF_MMD_DOWNLOAD_FAILED:${result.status}`);
      const mmd = await result.text();
      const parsed = parseMmdSkeleton(mmd);
      const figureRegions = await Promise.all(parsed.images.map(downloadFigure));
      return { provider: `${this.id}:PDF_DOCUMENT`, regions: [...parsed.regions, ...figureRegions].sort((a, b) => a.order - b.order), diagnostics: [] };
    } finally {
      if (this.options.deleteRemoteAfterRead ?? true) {
        try { await fetch(`${this.endpoint}/v3/pdf/${encodeURIComponent(pdfId)}`, { method: "DELETE", headers: this.headers() }); }
        catch { /* privacy cleanup is best-effort; OCR result remains locally captured */ }
      }
    }
  }

  async recognize(source: UnifiedInputSource): Promise<RecognitionOutput> {
    const extension = path.extname(source.name).toLowerCase();
    if ([".png", ".jpg", ".jpeg"].includes(extension) || source.mimeType?.startsWith("image/")) return this.recognizeImage(source);
    if (extension === ".pdf" || source.mimeType === "application/pdf") return this.recognizePdf(source);
    throw new Error(`MATHPIX_UNSUPPORTED_SOURCE:${source.name}`);
  }
}

export function createMathpixRecognizerFromEnv(env: NodeJS.ProcessEnv = process.env): MathpixStemRecognizer | undefined {
  const appId = env.MATHPIX_APP_ID?.trim();
  const appKey = env.MATHPIX_APP_KEY?.trim();
  if (!appId || !appKey) return undefined;
  return new MathpixStemRecognizer({ appId, appKey });
}
