import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { ContentBlock, DocumentBlock, DocumentIR, FigureRecord } from "../document-engine/document-ir.js";
import { rasterBoxToPage, reconcileCandidates, type SemanticCandidate } from "./pdf-reconciliation.js";

export type PdfSemanticRegion = { type: "TEXT" | "MATH" | "FIGURE" | "OTHER"; bbox: number[]; text?: string; order: number; confidence?: number; source: string; page: number };
export type PdfSemanticPage = { page: number; width: number; height: number; dpi: number; regions: PdfSemanticRegion[] };
export type PdfSemanticOutput = { file: string; pages: PdfSemanticPage[]; provider: string; model_reuse: boolean };

const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const mstRoot = process.env.MST_MATH_ROOT || "D:\\MST-MATH";
const python = process.env.MST_MATH_INPUT_VISION_PYTHON || [
  join(mstRoot, "06_RUNTIME", "MST-MATH-LOCAL-RUNTIME", "uv-python", "python.exe"),
  join(process.cwd(), ".venv", "Scripts", "python.exe"),
].find(existsSync) || "python";

function runSemanticPdf(file: string): PdfSemanticOutput {
  const checkpointDir = process.env.MST_MATH_INPUT_PDF_CHECKPOINT_DIR || join(process.cwd(), "artifacts", "input-real-golden-v7-pc", "checkpoints");
  const suffix = process.env.MST_MATH_INPUT_PDF_CHECKPOINT_SUFFIX || "full";
  const checkpoint = join(checkpointDir, `${createHash("sha256").update(readFileSync(file)).digest("hex")}-${suffix}.json`);
  const env = { ...process.env, PYTHONPATH: process.env.MST_MATH_INPUT_PADDLE_PACKAGES || join(process.cwd(), ".paddle-v4-packages"), MST_MATH_INPUT_PDF_CHECKPOINT: checkpoint };
  return JSON.parse(execFileSync(python, [join(process.cwd(), "scripts", "local-semantic-pdf.py"), file], { encoding: "utf8", windowsHide: true, env, maxBuffer: 64 * 1024 * 1024 })) as PdfSemanticOutput;
}

function content(region: PdfSemanticRegion, source: string, figureId?: string): ContentBlock[] {
  if (region.type === "TEXT" && region.text?.trim()) return [{ type: "text", value: region.text.trim(), sourceLocation: `${source}:page=${region.page}:bbox=${region.bbox.join(",")}` }];
  if (region.type === "MATH" && region.text?.trim()) return [{ type: "math", math: { sourceType: "LATEX", sourceRaw: region.text, latex: region.text.trim(), normalized: region.text.trim(), parseStatus: "PARSED", warnings: ["SOURCE_FORMULA_RECOGNIZER"], sourceLocation: `${source}:page=${region.page}` }, sourceLocation: `${source}:page=${region.page}` }];
  if (region.type === "FIGURE" && figureId) return [{ type: "figure", figureId, sourceLocation: `${source}:page=${region.page}` }];
  return [];
}

function xmlText(value: string): string { return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">" ).replace(/&#x27;/g, "'").replace(/&quot;/g, '"'); }
function nativeCandidates(file: string, page: number, width: number, height: number): SemanticCandidate[] {
  let xml = "";
  try { xml = execFileSync("pdftotext", ["-f", String(page), "-l", String(page), "-bbox", "-enc", "UTF-8", file, "-"], { encoding: "utf8", windowsHide: true, maxBuffer: 8 * 1024 * 1024 }); } catch { return []; }
  const words = [...xml.matchAll(/<word\s+([^>]+)>([\s\S]*?)<\/word>/g)].map(match => {
    const attrs = match[1]; const get = (key: string) => Number(attrs.match(new RegExp(`${key}="([0-9.]+)"`))?.[1] ?? 0);
    return { x1: get("xMin"), y1: get("yMin"), x2: get("xMax"), y2: get("yMax"), text: xmlText(match[2]) };
  }).filter(word => word.text.trim());
  const lines: SemanticCandidate[] = [];
  for (const word of words) {
    const existing = lines.find(line => Math.abs(line.bbox[1] - word.y1) <= 4 && word.x1 <= line.bbox[2] + 18);
    if (existing) { existing.bbox[2] = Math.max(existing.bbox[2], word.x2); existing.bbox[3] = Math.max(existing.bbox[3], word.y2); existing.content = `${existing.content ?? ""} ${word.text}`; }
    else lines.push({ page, bbox: [word.x1, word.y1, word.x2, word.y2], kind: "TEXT", content: word.text, source: "PDF_NATIVE", order: word.y1 * 10000 + word.x1 });
  }
  return lines;
}
function pdfPageGeometry(file: string): { width: number; height: number; rotation: 0 | 90 | 180 | 270 } {
  const info = execFileSync("pdfinfo", [file], { encoding: "utf8", windowsHide: true });
  const size = info.match(/Page size:\s+([0-9.]+)\s+x\s+([0-9.]+)/);
  const rotation = Number(info.match(/Page rot:\s+([0-9]+)/)?.[1] ?? 0) as 0 | 90 | 180 | 270;
  if (!size) throw new Error("PDF_PAGE_GEOMETRY_UNAVAILABLE");
  return { width: Number(size[1]), height: Number(size[2]), rotation: [0, 90, 180, 270].includes(rotation) ? rotation : 0 };
}

function documentFromCandidates(name: string, bytes: Uint8Array, candidates: SemanticCandidate[]): DocumentIR {
  const figures: FigureRecord[] = []; const blocks: DocumentBlock[] = [];
  for (const [order, candidate] of candidates.entries()) {
    const source = `${name}:page=${candidate.page}:bbox=${candidate.bbox.join(",")}:${candidate.source}`;
    let mapped: ContentBlock[] = [];
    if (candidate.kind === "TEXT" && candidate.content?.trim()) mapped = [{ type: "text", value: candidate.content.trim(), sourceLocation: source }];
    if (candidate.kind === "MATH" && candidate.content?.trim()) mapped = [{ type: "math", math: { sourceType: "LATEX", sourceRaw: candidate.content, latex: candidate.content.trim(), normalized: candidate.content.trim(), parseStatus: "PARSED", warnings: ["SOURCE_FORMULA_RECOGNIZER"], sourceLocation: source }, sourceLocation: source }];
    if (candidate.kind === "FIGURE") { const id = candidate.reference ?? `pdf-figure-${figures.length + 1}`; figures.push({ id, relationshipId: id, sourceLocation: source, mimeType: "application/octet-stream", semanticRole: "RASTER_FIGURE", dimensions: { widthPx: Math.max(0, candidate.bbox[2] - candidate.bbox[0]), heightPx: Math.max(0, candidate.bbox[3] - candidate.bbox[1]) } }); mapped = [{ type: "figure", figureId: id, sourceLocation: source }]; }
    if (mapped.length) blocks.push({ id: `pdf-block-${order}`, kind: "PARAGRAPH", order, content: mapped, sourceLocation: source });
  }
  return { sourceDocument: name, sourceHash: sha256(bytes), blocks, figures, warnings: [] };
}

export function ingestSemanticPdf(bytes: Uint8Array, name: string): { output: PdfSemanticOutput; document: DocumentIR } {
  const temp = join(tmpdir(), `mst-semantic-${process.pid}-${Date.now()}.pdf`);
  mkdirSync(join(tmpdir(), "mst-math-input"), { recursive: true });
  writeFileSync(temp, bytes);
  try {
    const output = runSemanticPdf(temp);
    const figures: FigureRecord[] = [];
    const blocks: DocumentBlock[] = [];
    let order = 0;
    for (const page of output.pages) for (const region of [...page.regions].sort((a, b) => a.order - b.order)) {
      const figureId = region.type === "FIGURE" ? `pdf-figure-${figures.length + 1}` : undefined;
      if (figureId) figures.push({ id: figureId, relationshipId: figureId, sourceLocation: `${name}:page=${page.page}`, mimeType: "application/octet-stream", semanticRole: "RASTER_FIGURE", dimensions: { widthPx: Math.max(0, region.bbox[2] - region.bbox[0]), heightPx: Math.max(0, region.bbox[3] - region.bbox[1]) } });
      const mapped = content(region, name, figureId);
      if (!mapped.length) continue;
      blocks.push({ id: `pdf-page-${page.page}-region-${order}`, kind: region.type === "FIGURE" ? "PARAGRAPH" : "PARAGRAPH", order: order++, content: mapped, sourceLocation: `${name}:page=${page.page}:bbox=${region.bbox.join(",")}` });
    }
    return { output, document: { sourceDocument: name, sourceHash: sha256(bytes), blocks, figures, warnings: [] } };
  } finally { rmSync(temp, { force: true }); }
}

export function ingestHybridPdf(bytes: Uint8Array, name: string): { output: PdfSemanticOutput; document: DocumentIR; reconciliation: { native: number; raster: number; final: number; coordinateMapping: boolean } } {
  const temp = join(tmpdir(), `mst-hybrid-${process.pid}-${Date.now()}.pdf`); writeFileSync(temp, bytes);
  try {
    const output = runSemanticPdf(temp); const candidates: SemanticCandidate[] = []; const geometry = pdfPageGeometry(temp);
    for (const page of output.pages) {
      const width = page.width || 1; const height = page.height || 1;
      for (const region of page.regions) {
        const bbox = rasterBoxToPage([region.bbox[0], region.bbox[1], region.bbox[2], region.bbox[3]], width, height, geometry);
        const kind = region.type === "MATH" ? "MATH" : region.type === "FIGURE" ? "FIGURE" : region.type === "TEXT" ? "TEXT" : "OTHER";
        if (kind !== "OTHER") candidates.push({ page: page.page, bbox, kind, content: region.text, source: kind === "MATH" ? "FORMULA_RECOGNIZER" : kind === "FIGURE" ? "LAYOUT" : "OCR", order: region.order });
      }
      candidates.push(...nativeCandidates(temp, page.page, geometry.width, geometry.height));
    }
    const final = reconcileCandidates(candidates);
    return { output, document: documentFromCandidates(name, bytes, final), reconciliation: { native: candidates.filter(candidate => candidate.source === "PDF_NATIVE").length, raster: candidates.filter(candidate => candidate.source !== "PDF_NATIVE").length, final: final.length, coordinateMapping: true } };
  } finally { rmSync(temp, { force: true }); }
}
