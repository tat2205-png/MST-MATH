import { createHash } from "node:crypto";
import path from "node:path";
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
}

interface PendingImage {
  readonly order: number;
  readonly sourceLocation: string;
  readonly url: string;
  readonly alt: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

function cleanLatex(value: string): string {
  return value.trim().replace(/^\$\$\s*/, "").replace(/\s*\$\$$/, "").trim();
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

function parseMmdSkeleton(mmd: string): { regions: RecognitionRegion[]; images: PendingImage[] } {
  const regions: RecognitionRegion[] = [];
  const images: PendingImage[] = [];
  let order = 0;
  let blockIndex = 0;
  for (const block of mmd.split(/\n\s*\n/)) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const sourceLocation = `mathpix:mmd:block:${blockIndex++}`;
    const cells = markdownTable(trimmed, sourceLocation);
    if (cells) {
      regions.push({ id: `ocr-region-${order}`, kind: "table", order: order++, sourceLocation, cells });
      continue;
    }
    const token = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)(?:\s+"[^"]*")?\)|\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$/g;
    let cursor = 0;
    let match: RegExpExecArray | null;
    while ((match = token.exec(trimmed)) !== null) {
      const before = trimmed.slice(cursor, match.index);
      if (before.trim()) regions.push({ id: `ocr-region-${order}`, kind: "text", order: order++, sourceLocation: `${sourceLocation}:text:${cursor}`, text: before });
      if (match[2]) {
        images.push({ order: order++, sourceLocation: `${sourceLocation}:figure:${match.index}`, url: match[2], alt: match[1] ?? "" });
      } else {
        const latex = cleanLatex(match[3] ?? match[4] ?? match[5] ?? "");
        if (latex) regions.push({ id: `ocr-region-${order}`, kind: "math", order: order++, sourceLocation: `${sourceLocation}:math:${match.index}`, latex });
      }
      cursor = match.index + match[0].length;
    }
    const tail = trimmed.slice(cursor);
    if (tail.trim()) regions.push({ id: `ocr-region-${order}`, kind: "text", order: order++, sourceLocation: `${sourceLocation}:text:${cursor}`, text: tail });
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

export class MathpixStemRecognizer implements StemRecognitionProvider {
  readonly id = "MATHPIX_DOCUMENT_V3";
  private readonly endpoint: string;
  constructor(private readonly options: MathpixProviderOptions) {
    if (!options.appId || !options.appKey) throw new Error("MATHPIX_CREDENTIALS_REQUIRED");
    this.endpoint = (options.endpoint ?? "https://api.mathpix.com").replace(/\/$/, "");
  }

  private headers(): Record<string, string> { return { app_id: this.options.appId, app_key: this.options.appKey }; }

  async recognize(source: UnifiedInputSource): Promise<RecognitionOutput> {
    const form = new FormData();
    form.append("file", new Blob([source.bytes], { type: source.mimeType || "application/octet-stream" }), source.name);
    form.append("options_json", JSON.stringify({
      math_inline_delimiters: ["\\(", "\\)"],
      math_display_delimiters: ["\\[", "\\]"],
      rm_spaces: true,
      improve_mathpix: this.options.improveMathpix ?? false,
    }));
    const submit = await fetch(`${this.endpoint}/v3/pdf`, { method: "POST", headers: this.headers(), body: form });
    if (!submit.ok) throw new Error(`MATHPIX_SUBMIT_FAILED:${submit.status}:${await submit.text()}`);
    const submitted = await submit.json() as { pdf_id?: string; error?: string };
    if (!submitted.pdf_id) throw new Error(`MATHPIX_PDF_ID_MISSING:${submitted.error ?? "unknown error"}`);
    const pdfId = submitted.pdf_id;
    const maxPolls = this.options.maxPolls ?? 120;
    const interval = this.options.pollIntervalMs ?? 750;
    let completed = false;
    for (let attempt = 0; attempt < maxPolls; attempt++) {
      const statusResponse = await fetch(`${this.endpoint}/v3/pdf/${encodeURIComponent(pdfId)}`, { headers: this.headers() });
      if (!statusResponse.ok) throw new Error(`MATHPIX_STATUS_FAILED:${statusResponse.status}`);
      const status = await statusResponse.json() as { status?: string; error?: string };
      if (status.status === "completed") { completed = true; break; }
      if (["error", "failed"].includes(status.status ?? "")) throw new Error(`MATHPIX_PROCESSING_FAILED:${status.error ?? status.status}`);
      await sleep(interval);
    }
    if (!completed) throw new Error("MATHPIX_PROCESSING_TIMEOUT");
    const result = await fetch(`${this.endpoint}/v3/pdf/${encodeURIComponent(pdfId)}.mmd`, { headers: this.headers() });
    if (!result.ok) throw new Error(`MATHPIX_MMD_DOWNLOAD_FAILED:${result.status}`);
    const mmd = await result.text();
    const parsed = parseMmdSkeleton(mmd);
    const figureRegions = await Promise.all(parsed.images.map(downloadFigure));
    const regions = [...parsed.regions, ...figureRegions].sort((a, b) => a.order - b.order);
    return {
      provider: this.id,
      regions,
      diagnostics: regions.some((r) => r.kind === "figure") ? [] : [{ code: "MATHPIX_NO_FIGURE_REGION", severity: "warning", message: "No figure region was returned. This is only a warning because the source may legitimately contain no illustration." }],
    };
  }
}

export function createMathpixRecognizerFromEnv(env: NodeJS.ProcessEnv = process.env): MathpixStemRecognizer | undefined {
  const appId = env.MATHPIX_APP_ID?.trim();
  const appKey = env.MATHPIX_APP_KEY?.trim();
  if (!appId || !appKey) return undefined;
  return new MathpixStemRecognizer({ appId, appKey });
}
