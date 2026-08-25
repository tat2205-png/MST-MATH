import type { DocumentIR, ImportCandidate } from "../types.js";
import { groupQuestionCandidates, provenance } from "./common.js";
import { segmentDocument } from "../segmentation.js";
export type PdfClassification = "DIGITAL_TEXT" | "SCANNED" | "MIXED";
export interface PdfImportResult { classification: PdfClassification; candidates: ImportCandidate[]; routing?: "OCR_REQUIRED" }
function decodePdfText(bytes: Uint8Array): { page: number; lines: string[] }[] {
  const raw = new TextDecoder("latin1").decode(bytes); const pages = raw.split(/\/Type\s*\/Page\b/).slice(1);
  return pages.map((page, i) => ({ page: i + 1, lines: [...page.matchAll(/\(([^()]*)\)\s*Tj/g)].map((m) => m[1].replace(/\\([()\\])/g, "$1")) })).filter((p) => p.lines.length);
}
export function importPdf(bytes: Uint8Array, originalFileName: string): PdfImportResult {
  if (!new TextDecoder("latin1").decode(bytes.slice(0, 8)).startsWith("%PDF-")) throw new Error("Invalid PDF signature");
  const pages = decodePdfText(bytes); const raw = new TextDecoder("latin1").decode(bytes); const pageCount = Math.max(1, (raw.match(/\/Type\s*\/Page\b/g) ?? []).length); const classification: PdfClassification = !pages.length ? "SCANNED" : pages.length < pageCount ? "MIXED" : "DIGITAL_TEXT";
  if (classification === "SCANNED") return { classification, routing: "OCR_REQUIRED", candidates: [{ content: [{ type: "text", value: "OCR_REQUIRED" }], source: provenance(originalFileName, "PDF", bytes), status: "QUARANTINED", assetIds: [], notes: ["OCR_REQUIRED: no selectable text detected"] }] };
  const document: DocumentIR = { sourceName: originalFileName, blocks: pages.flatMap((page) => page.lines.map((line, index) => ({ type: "paragraph" as const, order: page.page * 100000 + index, paragraphIndex: page.page * 100000 + index, sourcePosition: `pdf:page:${page.page}:line:${index}`, content: [{ type: "text" as const, value: line }] }))), warnings: classification === "MIXED" ? ["OCR_REQUIRED_FOR_UNRESOLVED_PAGES"] : [], mathObjects: 0, mathConverted: 0, assetsFound: 0 };
  const segmented = segmentDocument(document); const candidates = segmented.length ? segmented.map((question) => ({ content: question.content, source: provenance(originalFileName, "PDF", bytes, pages.find((page) => page.lines.some((line) => line.includes(`Câu ${question.questionNumber}`)))?.page, question.questionNumber), status: "DRAFT" as const, assetIds: question.assetIds, notes: question.warnings, questionType: question.questionType, options: question.options, statements: question.statements, answer: question.answer, solution: question.solution, confidence: question.confidence, evidence: question.evidence, sourcePosition: question.sourcePosition })) : pages.flatMap((p) => groupQuestionCandidates(p.lines).map((g) => ({ content: g.blocks, source: provenance(originalFileName, "PDF", bytes, p.page, g.number), status: "DRAFT" as const, assetIds: [], notes: classification === "MIXED" ? ["Some pages require OCR"] : [] })));
  return { classification, candidates, routing: classification === "MIXED" ? "OCR_REQUIRED" : undefined };
}
