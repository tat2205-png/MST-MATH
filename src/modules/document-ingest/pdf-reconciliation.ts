export type PageGeometry = { width: number; height: number; rotation?: 0 | 90 | 180 | 270; cropX?: number; cropY?: number };
export type Box = [number, number, number, number];
export type CandidateKind = "TEXT" | "MATH" | "FIGURE" | "OTHER";
export type SemanticCandidate = { page: number; bbox: Box; kind: CandidateKind; content?: string; source: "PDF_NATIVE" | "OCR" | "FORMULA_RECOGNIZER" | "EMBEDDED_IMAGE" | "LAYOUT"; confidence?: number; order?: number; reference?: string };

export function rasterPointToPage(x: number, y: number, rasterWidth: number, rasterHeight: number, page: PageGeometry): [number, number] {
  const px = (x / rasterWidth) * page.width + (page.cropX ?? 0);
  const py = (y / rasterHeight) * page.height + (page.cropY ?? 0);
  switch (page.rotation ?? 0) {
    case 90: return [page.height - py, px];
    case 180: return [page.width - px, page.height - py];
    case 270: return [py, page.width - px];
    default: return [px, py];
  }
}

export function rasterBoxToPage(box: Box, rasterWidth: number, rasterHeight: number, page: PageGeometry): Box {
  const points = [[box[0], box[1]], [box[2], box[1]], [box[2], box[3]], [box[0], box[3]]].map(([x, y]) => rasterPointToPage(x, y, rasterWidth, rasterHeight, page));
  return [Math.min(...points.map(p => p[0])), Math.min(...points.map(p => p[1])), Math.max(...points.map(p => p[0])), Math.max(...points.map(p => p[1]))];
}

export function normalizeText(value: string): string { return value.normalize("NFC").replace(/\s+/g, " ").trim(); }
export function intersectionOverUnion(a: Box, b: Box): number {
  const x1 = Math.max(a[0], b[0]), y1 = Math.max(a[1], b[1]), x2 = Math.min(a[2], b[2]), y2 = Math.min(a[3], b[3]);
  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = Math.max(0, a[2] - a[0]) * Math.max(0, a[3] - a[1]); const areaB = Math.max(0, b[2] - b[0]) * Math.max(0, b[3] - b[1]);
  return intersection / Math.max(1, areaA + areaB - intersection);
}

function similar(a: string, b: string): boolean { const left = normalizeText(a), right = normalizeText(b); if (!left || !right) return false; if (left === right) return true; let same = 0; for (let i = 0; i < Math.min(left.length, right.length); i++) if (left[i] === right[i]) same++; return same / Math.max(left.length, right.length) >= 0.90; }
function priority(candidate: SemanticCandidate): number { return candidate.source === "FORMULA_RECOGNIZER" ? 4 : candidate.source === "PDF_NATIVE" ? 3 : candidate.source === "EMBEDDED_IMAGE" ? 3 : candidate.source === "OCR" ? 2 : 1; }

export function reconcileCandidates(candidates: SemanticCandidate[]): SemanticCandidate[] {
  const output: SemanticCandidate[] = [];
  for (const candidate of [...candidates].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))) {
    const matchIndex = output.findIndex(existing => existing.page === candidate.page && intersectionOverUnion(existing.bbox, candidate.bbox) >= 0.50 && (
      existing.kind === candidate.kind && (candidate.kind === "FIGURE" || similar(existing.content ?? "", candidate.content ?? "")) ||
      (candidate.kind === "MATH" && existing.kind === "TEXT") || (candidate.kind === "TEXT" && existing.kind === "MATH")
    ));
    if (matchIndex < 0) { output.push(candidate); continue; }
    const existing = output[matchIndex];
    if (candidate.kind === "MATH" && existing.kind !== "MATH") output[matchIndex] = { ...candidate, source: candidate.source };
    else if (candidate.kind === existing.kind && priority(candidate) > priority(existing)) output[matchIndex] = { ...candidate, reference: candidate.reference ?? existing.reference };
    else if (candidate.kind === existing.kind && !existing.content && candidate.content) output[matchIndex] = { ...existing, content: candidate.content };
  }
  return output.sort((a, b) => a.page - b.page || (a.bbox[1] - b.bbox[1]) || (a.bbox[0] - b.bbox[0]));
}
