import type { ContentBlock, DocumentBlock, DocumentIR, ImportCandidate } from "../types.js";
import { segmentDocument } from "../segmentation.js";
import { recognitionStatus } from "./router.js";
import type { BoundingBox, OrderedPageBlock, RecognitionResult, ScannedDocumentResult, ScannedPageInput } from "./types.js";

export function filterRepeatedMargins(pages: Map<number, OrderedPageBlock[]>): Map<number, OrderedPageBlock[]> {
  const counts = new Map<string, number>(); for (const blocks of pages.values()) for (const block of blocks) { const key = block.content.map((x) => x.type === "text" ? x.value.trim().toLocaleLowerCase("vi") : "").join(""); if (key) counts.set(key, (counts.get(key) ?? 0) + 1); }
  const output = new Map<number, OrderedPageBlock[]>(); for (const [page, blocks] of pages) output.set(page, blocks.map((block) => { const text = block.content.map((x) => x.type === "text" ? x.value : "").join(""); const repeated = (counts.get(text.trim().toLocaleLowerCase("vi")) ?? 0) >= 2; const margin = block.boundingBox.y <= 0.1 || block.boundingBox.y + block.boundingBox.height >= 0.9; return repeated && margin ? { ...block, role: block.boundingBox.y <= 0.1 ? "HEADER" : "FOOTER", confidence: Math.min(block.confidence, 0.8) } : block; })); return output;
}
export function reconstructPageBlocks(page: number, blocks: OrderedPageBlock[]): DocumentBlock[] { return [...blocks].sort((a, b) => a.order - b.order || a.boundingBox.y - b.boundingBox.y || a.boundingBox.x - b.boundingBox.x).filter((block) => block.role !== "HEADER" && block.role !== "FOOTER").map((block, index) => ({ type: "paragraph" as const, order: page * 100000 + index, paragraphIndex: page * 100000 + index, sourcePosition: `pdf:page:${page}:bbox:${boxKey(block.boundingBox)}`, content: block.content })); }
const boxKey = (box: BoundingBox) => [box.x, box.y, box.width, box.height].map((n) => n.toFixed(4)).join(",");
export function buildScannedDocument(sourceName: string, pageBlocks: Map<number, OrderedPageBlock[]>, recognition: RecognitionResult[]): ScannedDocumentResult {
  const filtered = filterRepeatedMargins(pageBlocks); const blocks = [...filtered].flatMap(([page, pageItems]) => reconstructPageBlocks(page, pageItems)); const document: DocumentIR = { sourceName, blocks, warnings: recognition.flatMap((x) => x.warnings), mathObjects: recognition.filter((x) => x.latex).length, mathConverted: recognition.filter((x) => x.latex && x.confidence >= 0.55).length, assetsFound: new Set(recognition.map((x) => x.sourceAssetId).filter(Boolean)).size };
  const candidates: ImportCandidate[] = segmentDocument(document).map((question) => { const confidence = Math.min(question.confidence.segmentation, question.confidence.type, question.confidence.math); return { ...question, source: { fileId: sourceName, originalFileName: sourceName, fileType: "PDF", sourceHash: "scanned-document", page: document.blocks[question.sourcePosition.blockStart]?.paragraphIndex ? Math.floor(document.blocks[question.sourcePosition.blockStart].paragraphIndex! / 100000) : undefined, questionNumber: question.questionNumber, importedAt: new Date(0).toISOString() }, status: recognitionStatus(confidence) === "REVIEW" ? "DRAFT" : "QUARANTINED", notes: question.warnings } as ImportCandidate; });
  return { document, candidates, recognition };
}
export type PageRasterizer = (pdf: Uint8Array) => Promise<ScannedPageInput[]>;

