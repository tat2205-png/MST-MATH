import { createHash } from "node:crypto";
import { Resvg } from "@resvg/resvg-js";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import type { ContentBlock, FigureRecord } from "../document-engine/document-ir.js";
import { renderDocumentToDocx } from "../document-export/docx/renderer.js";
import { lessonIrToDocumentIR, validateP01LessonIR } from "./pipeline.js";
import { P01_ICON_AUTHORITY, type P01LessonIR, type P01OutputBundle, type P01RenderedArtifact } from "./types.js";

const encoder = new TextEncoder();
const digest = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");

function htmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function latexEscape(value: string): string {
  return value
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([#$%&_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

function normalizedLatex(block: Extract<ContentBlock, { type: "math" }>): string {
  const source = block.math.latex?.trim();
  if (!source) throw new Error(`P01_MATH_LATEX_REQUIRED:${block.math.id ?? block.math.sourceLocation}`);
  return source.replace(/\\right\s*$/, "\\right.");
}

function figureById(lesson: P01LessonIR, id: string): FigureRecord {
  const figure = lesson.document.figures.find((candidate) => candidate.id === id);
  if (!figure?.bytes?.length || !figure.mimeType) throw new Error(`P01_FIGURE_BYTES_REQUIRED:${id}`);
  return figure;
}

function htmlBlocks(lesson: P01LessonIR, blocks: ContentBlock[]): string {
  return blocks.map((block) => {
    if (block.type === "text") return `<span class="p01-text">${htmlEscape(block.value)}</span>`;
    if (block.type === "math") {
      const latex = normalizedLatex(block);
      return `<span class="p01-math" data-latex="${htmlEscape(latex)}" aria-label="Biểu thức toán học: ${htmlEscape(latex)}">\\(${htmlEscape(latex)}\\)</span>`;
    }
    if (block.type === "figure") {
      const figure = figureById(lesson, block.figureId);
      const alt = figure.caption?.trim() || `Hình minh họa từ nguồn ${figure.id}`;
      const src = `data:${figure.mimeType};base64,${Buffer.from(figure.bytes!).toString("base64")}`;
      return `<figure data-figure-id="${htmlEscape(figure.id)}"><img src="${src}" alt="${htmlEscape(alt)}"/>${figure.caption ? `<figcaption>${htmlEscape(figure.caption)}</figcaption>` : ""}</figure>`;
    }
    const cells = block.cells.map((cell) => `<td>${htmlBlocks(lesson, cell)}</td>`).join("");
    return `<table class="p01-table"><tbody><tr>${cells}</tr></tbody></table>`;
  }).join("");
}

export function renderP01Html(lesson: P01LessonIR): P01RenderedArtifact {
  const qa = validateP01LessonIR(lesson);
  if (qa.state !== "PASS") throw new Error(`P01_HTML_QA_BLOCKED:${qa.state}`);
  const sections = lesson.contentModel.units.map((unit) => {
    const tag = unit.kind === "SECTION" ? "section" : "div";
    return `<${tag} class="p01-unit" data-unit-id="${htmlEscape(unit.id)}" data-source-block-id="${htmlEscape(unit.sourceBlockId)}">${htmlBlocks(lesson, unit.content)}</${tag}>`;
  }).join("\n");
  const html = `<!doctype html>\n<html lang="vi"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="p01-profile" content="P01_LEARNING_MATERIAL"/><meta name="p01-icon-authority" content="${P01_ICON_AUTHORITY}"/><meta name="p01-semantic-signature" content="${lesson.semanticSignature}"/><title>${htmlEscape(lesson.source.document)}</title><style>body{font-family:system-ui,sans-serif;max-width:900px;margin:0 auto;padding:2rem;line-height:1.6}.p01-unit{margin:0 0 1rem}.p01-math{font-family:serif}.p01-table{border-collapse:collapse;width:100%;margin:.75rem 0}.p01-table td{border:1px solid #888;padding:.4rem;vertical-align:top}figure{margin:1rem auto}img{max-width:100%;height:auto}figcaption{font-size:.9rem}</style></head><body><main aria-label="Tài liệu học tập MST-MATH">${sections}</main></body></html>`;
  return { format: "HTML", bytes: encoder.encode(html), semanticSignature: lesson.semanticSignature, warnings: [] };
}

export function renderP01Docx(lesson: P01LessonIR): P01RenderedArtifact {
  const document = lessonIrToDocumentIR(lesson);
  const figureMetadata = Object.fromEntries(document.figures.map((figure) => [figure.id, {
    title: figure.caption || figure.id,
    altText: figure.caption?.trim() || `Hình minh họa từ nguồn ${figure.id}`,
    semanticFigureId: figure.id,
    semanticFlags: ["P01_SOURCE_FIGURE"],
  }]));
  const result = renderDocumentToDocx(document, {
    profileId: "P01_LEARNING_MATERIAL",
    outputIdentity: "learning_material",
    title: lesson.source.document,
    creator: "MST-MATH",
    generatedAt: new Date(0),
    figureMetadata,
  });
  return { format: "DOCX", bytes: result.bytes, semanticSignature: lesson.semanticSignature, warnings: result.warnings };
}

function latexBlocks(lesson: P01LessonIR, blocks: ContentBlock[], assets: Map<string, string>): string {
  return blocks.map((block) => {
    if (block.type === "text") return latexEscape(block.value);
    if (block.type === "math") return `\\(${normalizedLatex(block)}\\)`;
    if (block.type === "figure") {
      const asset = assets.get(block.figureId);
      if (!asset) throw new Error(`P01_PDF_FIGURE_ASSET_MISSING:${block.figureId}`);
      return `\\begin{center}\\includegraphics[width=0.88\\linewidth]{${latexEscape(asset)}}\\end{center}`;
    }
    const cells = block.cells.map((cell) => latexBlocks(lesson, cell, assets));
    const columns = Math.max(1, cells.length);
    return `\\begin{center}\\begin{tabular}{|${"l|".repeat(columns)}}\\hline ${cells.join(" & ")} \\\\ \\hline\\end{tabular}\\end{center}`;
  }).join("");
}

export interface PdfFigureEvidence { figureId: string; originalSha256: string; derivedSha256?: string; warning?: string }

export function transcodeSvgFigureToPng(figure: FigureRecord): { bytes: Uint8Array; evidence: PdfFigureEvidence } {
  if (figure.mimeType !== "image/svg+xml" || !figure.bytes?.length) throw new Error(`P01_PDF_SVG_TRANSCODE_FAILED:${figure.id}`);
  const svg = new TextDecoder().decode(figure.bytes);
  if (/<(?:script|iframe|object|embed)\b/i.test(svg) || /(?:href|xlink:href)\s*=\s*["']\s*(?:https?:|file:|\/\/)/i.test(svg) || /url\(\s*(?:https?:|file:|\/\/)/i.test(svg)) throw new Error(`P01_PDF_SVG_TRANSCODE_FAILED:${figure.id}`);
  try {
    const bytes = new Uint8Array(new Resvg(svg, { fitTo: { mode: "width", value: 1600 } }).render().asPng());
    if (!bytes.length) throw new Error("EMPTY_PNG");
    const originalSha256 = digest(figure.bytes);
    const derivedSha256 = digest(bytes);
    return { bytes, evidence: { figureId: figure.id, originalSha256, derivedSha256, warning: `P01_PDF_FIGURE_TRANSCODED:${figure.id}:SVG_TO_PNG:${derivedSha256}` } };
  } catch (error) {
    throw new Error(`P01_PDF_SVG_TRANSCODE_FAILED:${figure.id}:${error instanceof Error ? error.message : String(error)}`);
  }
}

function figureExtension(figure: FigureRecord): "png" | "jpg" | "pdf" {
  if (figure.mimeType === "image/png") return "png";
  if (figure.mimeType === "image/jpeg") return "jpg";
  if (figure.mimeType === "image/pdf") return "pdf";
  if (figure.mimeType === "image/svg+xml") return "png";
  throw new Error(`P01_PDF_FIGURE_FORMAT_UNSUPPORTED:${figure.id}:${figure.mimeType ?? "unknown"}`);
}

export function renderP01Pdf(lesson: P01LessonIR): P01RenderedArtifact {
  const document = lessonIrToDocumentIR(lesson);
  const directory = mkdtempSync(join(tmpdir(), "mst-math-p01-pdf-"));
  try {
    const assets = new Map<string, string>();
    const warnings: string[] = [];
    for (const figure of document.figures) {
      if (!figure.bytes?.length) continue;
      const extension = figureExtension(figure);
      const transcoded = figure.mimeType === "image/svg+xml" ? transcodeSvgFigureToPng(figure) : undefined;
      const bytes = transcoded?.bytes ?? figure.bytes;
      if (transcoded?.evidence.warning) warnings.push(transcoded.evidence.warning);
      const filename = `figure-${digest(bytes).slice(0, 16)}.${extension}`;
      writeFileSync(join(directory, filename), bytes);
      assets.set(figure.id, filename);
    }
    const body = lesson.contentModel.units.map((unit) => {
      const content = latexBlocks(lesson, unit.content, assets);
      return unit.kind === "SECTION" ? `\\section*{${content}}` : `${content}\\par\n`;
    }).join("\n");
    const tex = `\\documentclass[12pt,a4paper]{article}\n\\usepackage{fontspec}\n\\usepackage{amsmath,amssymb,graphicx,array}\n\\usepackage[margin=20mm]{geometry}\n\\setmainfont{Latin Modern Roman}\n\\setlength{\\parindent}{0pt}\n\\setlength{\\parskip}{5pt}\n\\begin{document}\n${body}\n\\end{document}\n`;
    const texPath = join(directory, "p01.tex");
    writeFileSync(texPath, tex, "utf8");
    const run = spawnSync("xelatex", ["-interaction=nonstopmode", "-halt-on-error", "-output-directory", directory, texPath], { cwd: directory, encoding: "utf8" });
    if (run.error || run.status !== 0) throw new Error(`P01_PDF_XELATEX_FAILED:${run.error?.message ?? run.stderr ?? run.stdout}`);
    const pdfPath = join(directory, "p01.pdf");
    const bytes = new Uint8Array(readFileSync(pdfPath));
    if (!Buffer.from(bytes.subarray(0, 4)).equals(Buffer.from("%PDF"))) throw new Error("P01_PDF_SIGNATURE_INVALID");
    return { format: "PDF", bytes, semanticSignature: lesson.semanticSignature, warnings };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

export function renderP01OutputBundle(lesson: P01LessonIR): P01OutputBundle {
  const qa = validateP01LessonIR(lesson);
  if (qa.state !== "PASS") throw new Error(`P01_OUTPUT_QA_BLOCKED:${qa.state}`);
  const artifacts = [renderP01Html(lesson), renderP01Docx(lesson), renderP01Pdf(lesson)];
  if (artifacts.some((artifact) => artifact.semanticSignature !== lesson.semanticSignature)) throw new Error("P01_CROSS_OUTPUT_SEMANTIC_SIGNATURE_MISMATCH");
  return { lesson, qa, artifacts };
}

export function writeP01OutputBundle(bundle: P01OutputBundle, outputDirectory: string, fileBase = "mst-math-p01"): Array<{ format: P01RenderedArtifact["format"]; path: string; bytes: number; sha256: string }> {
  const directory = resolve(outputDirectory);
  mkdirSync(directory, { recursive: true });
  const safeBase = basename(fileBase).replace(/[^A-Za-z0-9._-]+/g, "-") || "mst-math-p01";
  const paths: Array<{ format: P01RenderedArtifact["format"]; path: string; bytes: number; sha256: string }> = [];
  for (const artifact of bundle.artifacts) {
    const extension = artifact.format.toLowerCase();
    const path = join(directory, `${safeBase}.${extension}`);
    writeFileSync(path, artifact.bytes);
    paths.push({ format: artifact.format, path, bytes: artifact.bytes.length, sha256: digest(artifact.bytes) });
  }
  const manifestPath = join(directory, `${safeBase}.manifest.json`);
  writeFileSync(manifestPath, JSON.stringify({ profileId: bundle.lesson.profileId, iconAuthority: bundle.lesson.iconAuthority, semanticSignature: bundle.lesson.semanticSignature, source: bundle.lesson.source, qa: bundle.qa, artifacts: paths }, null, 2), "utf8");
  return paths;
}
