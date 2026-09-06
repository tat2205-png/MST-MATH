import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { ContentBlock, DocumentBlock, DocumentIR, FigureRecord } from "../document-engine/document-ir.js";

export type PdfSemanticRegion = { type: "TEXT" | "MATH" | "FIGURE" | "OTHER"; bbox: number[]; text?: string; order: number; confidence?: number; source: string; page: number };
export type PdfSemanticPage = { page: number; width: number; height: number; dpi: number; regions: PdfSemanticRegion[] };
export type PdfSemanticOutput = { file: string; pages: PdfSemanticPage[]; provider: string; model_reuse: boolean };

const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const python = process.env.MST_MATH_INPUT_VISION_PYTHON || [
  "D:\\math-ai-video-studio\\mst-input-local-paddle-clean-v1\\tools\\mst-local-ocr\\.venv\\Scripts\\python.exe",
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
