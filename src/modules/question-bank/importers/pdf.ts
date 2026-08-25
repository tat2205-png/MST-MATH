import type { ImportCandidate } from "../types.js";
import { groupQuestionCandidates, provenance } from "./common.js";
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
  const candidates = pages.flatMap((p) => groupQuestionCandidates(p.lines).map((g) => ({ content: g.blocks, source: provenance(originalFileName, "PDF", bytes, p.page, g.number), status: "DRAFT" as const, assetIds: [], notes: classification === "MIXED" ? ["Some pages require OCR"] : [] })));
  return { classification, candidates, routing: classification === "MIXED" ? "OCR_REQUIRED" : undefined };
}
