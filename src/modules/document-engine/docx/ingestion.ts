import { createHash } from "node:crypto";
import { parseDocx } from "./parser.js";
import type { DocxBlockNode, DocxInlineNode, DocumentEngineIssue } from "../types.js";
import type { ContentBlock, DocumentBlock, DocumentIR, ExtractionIssue, FigureRecord, MathLedgerEntry, PreservationStatus, Provenance, SourceAnchor } from "../document-ir.js";
import { documentLedger, evaluatePreservationStatus, type AssetLedgerEntry, type MathAssetLedger } from "../../question-bank/contracts.js";

export interface DocxIngestionSource { name: string; bytes: Uint8Array }
export interface DocxIngestionDiagnostics {
  sourceFile: string; sourceSha256: string; paragraphCount: number; textBlockCount: number; tableCount: number;
  sourceMathCount: number; extractedMathCount: number; documentIrMathCount: number;
  sourceAssetCount: number; extractedAssetCount: number; documentIrAssetCount: number;
  issueCount: number; unsupportedCount: number; reviewCount: number; quarantinedCount: number; qaStatus: PreservationStatus;
}
export interface DocxIngestionResult { document?: DocumentIR; mathLedger: MathAssetLedger; assetLedger: MathAssetLedger; issues: ExtractionIssue[]; diagnostics: DocxIngestionDiagnostics; qaStatus: PreservationStatus; provenance: Provenance }

const hashBytes = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const issueStatus = (issue: DocumentEngineIssue): PreservationStatus => issue.severity === "error" ? "QUARANTINED" : issue.code.startsWith("UNSUPPORTED") || issue.code.includes("UNSUPPORTED") || issue.code.includes("FALLBACK") ? "UNSUPPORTED" : "REVIEW";
const anchor = (sourceDocumentId: string, partName: string, objectIndex: number, paragraphIndex?: number, tableIndex?: number, relationshipId?: string): SourceAnchor => ({ sourceDocumentId, partName, objectIndex, ...(paragraphIndex === undefined ? {} : { paragraphIndex }), ...(tableIndex === undefined ? {} : { tableIndex }), ...(relationshipId ? { relationshipId } : {}) });

function content(inline: DocxInlineNode[], sourceDocumentId: string, paragraphIndex: number, math: MathLedgerEntry[], assets: AssetLedgerEntry[], issues: ExtractionIssue[]): ContentBlock[] {
  return inline.flatMap((item, runIndex): ContentBlock[] => {
    const sourceAnchor = anchor(sourceDocumentId, "word/document.xml", runIndex, paragraphIndex);
    if (item.type === "text") return item.text ? [{ type: "text", value: item.text, sourceLocation: `word/document.xml/paragraph[${paragraphIndex}]/run[${runIndex}]` }] : [];
    if (item.type === "math") {
      const id = item.expression.id;
      math.push({ mathObjectId: id, sourceAnchor, sourceType: "OMML", status: "PASS" });
      return [{ type: "math", math: { id, sourceType: "OMML", sourceRaw: item.expression.raw, ...(item.expression.latex ? { latex: item.expression.latex, normalized: item.expression.latex } : {}), parseStatus: item.expression.latex ? "PARSED" : "UNRESOLVED", warnings: [], sourceLocation: item.sourcePath } }];
    }
    if (item.type === "image") {
      if (!item.assetId) return [{ type: "figure", figureId: `missing-${item.relationshipId}`, sourceLocation: item.sourcePath }];
      assets.push({ assetId: item.assetId, kind: "IMAGE", relationshipId: item.relationshipId, sourceAnchor: { ...sourceAnchor, relationshipId: item.relationshipId }, status: "PASS" });
      return [{ type: "figure", figureId: item.assetId, sourceLocation: item.sourcePath }];
    }
    if (item.type === "legacy_object") {
      const status: PreservationStatus = "UNSUPPORTED";
      issues.push({ code: item.reason, severity: "ERROR", objectId: item.relationshipId, sourceAnchor, message: "Embedded legacy object was preserved as evidence but not decoded.", status });
      return [{ type: "text", value: `[${item.reason}]`, sourceLocation: item.sourcePath }];
    }
    if (item.type === "page_break") return [];
    return [];
  });
}

function tableContent(block: Extract<DocxBlockNode, { type: "table" }>, sourceDocumentId: string, math: MathLedgerEntry[], assets: AssetLedgerEntry[], issues: ExtractionIssue[]): ContentBlock[][] {
  return block.rows.flatMap(row => row.cells.map(cell => cell.blocks.flatMap(child => child.type === "paragraph" ? content(child.children, sourceDocumentId, child.index, math, assets, issues) : [])));
}

export function ingestDocx(source: DocxIngestionSource): DocxIngestionResult {
  const sourceSha256 = hashBytes(source.bytes);
  const sourceDocumentId = `docx-${sourceSha256.slice(0, 16)}`;
  const provenance: Provenance = { sourceFile: source.name, sourceSha256, sourceKind: "DOCX", parser: "document-engine/docx/parser", parserVersion: "1", transformationHistory: ["SOURCE_FINGERPRINT", "DOCX_PACKAGE_READ", "EXISTING_DOCX_PARSER", "DOCUMENT_IR_ADAPTER"] };
  const parsed = parseDocx(source.bytes, { sourceName: source.name });
  const issues: ExtractionIssue[] = parsed.report.errors.concat(parsed.report.warnings, parsed.report.unsupported).map(issue => ({ code: issue.code, severity: issue.severity === "error" ? "ERROR" : "WARNING", message: issue.message, status: issueStatus(issue), sourceAnchor: { sourceDocumentId, partName: issue.path ?? "word/document.xml" } }));
  const math: MathLedgerEntry[] = [], assets: AssetLedgerEntry[] = [];
  if (!parsed.ast) {
    const diagnostics = { sourceFile: source.name, sourceSha256, paragraphCount: 0, textBlockCount: 0, tableCount: 0, sourceMathCount: 0, extractedMathCount: 0, documentIrMathCount: 0, sourceAssetCount: 0, extractedAssetCount: 0, documentIrAssetCount: 0, issueCount: issues.length, unsupportedCount: issues.filter(i => i.status === "UNSUPPORTED").length, reviewCount: issues.filter(i => i.status === "REVIEW").length, quarantinedCount: issues.filter(i => i.status === "QUARANTINED").length, qaStatus: "QUARANTINED" as const };
    const ledger = { diagnostics: { ...diagnostics, questionIrMathCount: 0, questionPackageMathCount: 0, questionPackageAssetCount: 0 }, math, assets, status: "QUARANTINED" as const, issues };
    return { mathLedger: ledger, assetLedger: ledger, issues, diagnostics, qaStatus: "QUARANTINED", provenance };
  }
  const blocks: DocumentBlock[] = parsed.ast.blocks.map((block, index) => {
    if (block.type === "paragraph") return { id: `paragraph-${block.index}`, kind: "PARAGRAPH", order: index, paragraphIndex: block.index, style: block.styleId, numbering: block.list?.numberingId, content: content(block.children, sourceDocumentId, block.index, math, assets, issues), sourceLocation: `word/document.xml/body/p[${block.index}]` };
    if (block.type === "table") return { id: `table-${block.index}`, kind: "TABLE", order: index, content: [{ type: "table", cells: tableContent(block, sourceDocumentId, math, assets, issues), sourceLocation: `word/document.xml/body/tbl[${block.index}]` }], sourceLocation: `word/document.xml/body/tbl[${block.index}]` };
    return { id: `section-${block.index}`, kind: "SECTION", order: index, content: [], sourceLocation: `word/document.xml/body/sectPr[${block.index}]` };
  });
  const figures: FigureRecord[] = parsed.ast.assets.map(asset => ({ id: asset.id, relationshipId: asset.relationshipId, mediaPath: asset.packagePath, mimeType: asset.mediaType, bytes: asset.bytes, sourceLocation: `relationship:${asset.relationshipId}`, sourceAnchor: anchor(sourceDocumentId, asset.packagePath, 0, undefined, undefined, asset.relationshipId), provenance, status: "PASS" }));
  const document: DocumentIR = { id: sourceDocumentId, sourceDocumentId, sourceDocument: source.name, sourceHash: sourceSha256, blocks, figures, warnings: parsed.report.warnings.map(i => i.message), provenance, extractionIssues: issues, mathObjects: math, assetObjects: assets };
  const ledger = documentLedger(document);
  const qaStatus = evaluatePreservationStatus(issues, { sourceMathCount: parsed.report.statistics.equations, extractedMathCount: math.length, documentIrMathCount: math.length, questionIrMathCount: 0, questionPackageMathCount: math.length, sourceAssetCount: parsed.report.statistics.images, extractedAssetCount: assets.length, documentIrAssetCount: assets.length, questionPackageAssetCount: assets.length });
  const diagnostics = { sourceFile: source.name, sourceSha256, paragraphCount: parsed.report.statistics.paragraphs, textBlockCount: blocks.filter(block => block.kind === "PARAGRAPH").length, tableCount: parsed.report.statistics.tables, sourceMathCount: parsed.report.statistics.equations, extractedMathCount: math.length, documentIrMathCount: math.length, sourceAssetCount: parsed.report.statistics.images, extractedAssetCount: assets.length, documentIrAssetCount: assets.length, issueCount: issues.length, unsupportedCount: issues.filter(i => i.status === "UNSUPPORTED").length, reviewCount: issues.filter(i => i.status === "REVIEW").length, quarantinedCount: issues.filter(i => i.status === "QUARANTINED").length, qaStatus };
  return { document, mathLedger: { ...ledger, diagnostics: { ...diagnostics, questionIrMathCount: 0, questionPackageMathCount: math.length, questionPackageAssetCount: assets.length }, status: qaStatus, issues }, assetLedger: { ...ledger, diagnostics: { ...diagnostics, questionIrMathCount: 0, questionPackageMathCount: math.length, questionPackageAssetCount: assets.length }, status: qaStatus, issues }, issues, diagnostics, qaStatus, provenance };
}
