import { validateMathIR, type MathDocument, type MathExpression, type MathMetadata } from "../../math-ir/index.js";
import type { DocumentConversionReport, DocumentEngineIssue, LatexSerializationResult } from "../types.js";
import { resolvePdfLatexAuthority } from "../../../config/naMathBrandRoot.js";

interface Fragment { type: "text" | "math"; text?: string; expressionId?: string; }

function escapeText(value: string): string {
  const replacements: Record<string, string> = { "\\": "\\textbackslash{}", "#": "\\#", "$": "\\$", "%": "\\%", "&": "\\&", "_": "\\_", "{": "\\{", "}": "\\}", "~": "\\textasciitilde{}", "^": "\\textasciicircum{}" };
  return value.replace(/[\\#$%&_{}~^]/g, (character) => replacements[character]);
}

function escapePath(value: string): string { return value.replace(/\\/g, "/").replace(/[{}%#]/g, (char) => `\\${char}`); }

function expressionLatex(expression: MathExpression | undefined, issues: DocumentEngineIssue[], path: string): string {
  if (expression?.latex) return expression.latex;
  issues.push({ code: "UNSUPPORTED_EXPRESSION_SERIALIZATION", severity: "warning", path, message: "Expression has no deterministic LaTeX representation." });
  return `\\text{[unsupported expression: ${escapeText(expression?.raw ?? "unknown")}]}`;
}

function fragmentsFrom(metadata: MathMetadata | undefined): Fragment[] | undefined {
  const fragments = metadata?.adapterMetadata?.fragments;
  if (!Array.isArray(fragments)) return undefined;
  return fragments.filter((item): item is Fragment => typeof item === "object" && item !== null && ["text", "math"].includes(String((item as Fragment).type)));
}

function renderMixed(text: string, expressionIds: string[] | undefined, metadata: MathMetadata | undefined, expressions: Map<string, MathExpression>, issues: DocumentEngineIssue[], path: string): string {
  const fragments = fragmentsFrom(metadata);
  if (fragments) return fragments.map((fragment) => fragment.type === "text" ? escapeText(fragment.text ?? "") : `$${expressionLatex(expressions.get(fragment.expressionId ?? ""), issues, path)}$`).join("");
  return `${escapeText(text)}${(expressionIds ?? []).map((id) => ` $${expressionLatex(expressions.get(id), issues, path)}$`).join("")}`;
}

function tableLatex(metadata: MathMetadata | undefined, expressions: Map<string, MathExpression>, issues: DocumentEngineIssue[], path: string): string {
  const rows = metadata?.adapterMetadata?.rows;
  if (!Array.isArray(rows) || !rows.every(Array.isArray)) {
    issues.push({ code: "LATEX_SERIALIZATION_FAILURE", severity: "error", path, message: "Table data is missing or malformed." });
    return "";
  }
  const width = Math.max(1, ...rows.map((row) => row.length));
  const rendered = rows.map((row) => row.map((cell: unknown) => {
    if (!Array.isArray(cell)) return "";
    return cell.map((paragraph: unknown) => {
      if (typeof paragraph !== "object" || paragraph === null) return "";
      const record = paragraph as { text?: string; fragments?: Fragment[] };
      return renderMixed(record.text ?? "", undefined, { adapterMetadata: { fragments: record.fragments ?? [] } }, expressions, issues, path);
    }).join(" ");
  }).concat(Array(Math.max(0, width - row.length)).fill("")).join(" & ")).join(" \\\\ \n");
  return `\\begin{center}\n\\begin{tabular}{|${"c|".repeat(width)}}\n\\hline\n${rendered} \\\\ \n\\hline\n\\end{tabular}\n\\end{center}`;
}

export function mathIRToLatex(document: MathDocument, options: { profileId?: string } = {}): LatexSerializationResult {
  const authority = resolvePdfLatexAuthority(options.profileId);
  const issues: DocumentEngineIssue[] = [];
  const validation = validateMathIR(document);
  if (validation.status === "FAIL") {
    validation.issues.forEach((issue) => issues.push({ code: "INVALID_MATH_IR_OUTPUT", severity: "error", path: issue.path, message: issue.message }));
    return { status: "FAIL", report: report(document, "FAIL", issues) };
  }
  const expressions = new Map(document.expressions.map((expression) => [expression.id, expression]));
  const assets = new Map((document.assets ?? []).map((asset) => [asset.id, asset]));
  const body: string[] = [];
  let openList: "enumerate" | "itemize" | undefined;
  const closeList = () => { if (openList) { body.push(`\\end{${openList}}`); openList = undefined; } };
  for (const section of document.sections) for (const block of section.blocks) {
    const path = `section:${section.id}/block:${block.id}`;
    if (block.type !== "list_item") closeList();
    switch (block.type) {
      case "paragraph": body.push(`${renderMixed(block.text, block.expressionIds, block.metadata, expressions, issues, path)}\n`); break;
      case "heading": {
        const command = block.level <= 1 ? "section" : block.level === 2 ? "subsection" : "subsubsection";
        body.push(`\\${command}{${renderMixed(block.text, block.expressionIds, block.metadata, expressions, issues, path)}}`); break;
      }
      case "equation": body.push(block.display ? `\\[\n${expressionLatex(expressions.get(block.expressionId), issues, path)}\n\\]` : `$${expressionLatex(expressions.get(block.expressionId), issues, path)}$`); break;
      case "list_item": {
        const environment = block.ordered ? "enumerate" : "itemize";
        if (openList !== environment) { closeList(); openList = environment; body.push(`\\begin{${environment}}`); }
        body.push(`\\item ${renderMixed(block.text, block.expressionIds, block.metadata, expressions, issues, path)}`); break;
      }
      case "page_break": body.push("\\newpage"); break;
      case "image_reference": {
        const asset = assets.get(block.assetId);
        if (!asset?.uri) { issues.push({ code: "MISSING_MEDIA", severity: "warning", path, message: `Image asset is missing: ${block.assetId}` }); body.push(`\\textit{[missing image: ${escapeText(block.assetId)}]}`); }
        else body.push(`\\begin{center}\n\\includegraphics[width=0.9\\linewidth]{${escapePath(asset.uri)}}\n\\end{center}`);
        break;
      }
      case "table_reference": body.push(tableLatex(assets.get(block.tableId)?.metadata, expressions, issues, path)); break;
      case "problem_reference": body.push(`\\textit{[Problem reference: ${escapeText(block.problemId)}]}`); break;
    }
  }
  closeList();
  body.unshift(`% MST-MATH / ${authority.brand.standardId} / ${authority.profile.profileId}`);
  body.unshift(`% Canonical references: ${authority.layout}, ${authority.typography}, ${authority.color}`);
  const latex = `\\documentclass[12pt,a4paper]{article}\n\n\\usepackage[utf8]{inputenc}\n\\usepackage[T5]{fontenc}\n\\usepackage[vietnamese]{babel}\n\\usepackage{amsmath,amssymb}\n\\usepackage{graphicx}\n\\usepackage{array}\n\n\\title{${escapeText(document.title ?? "Math AI Studio Document")}}\n\n\\begin{document}\n\\maketitle\n\n${body.join("\n\n")}\n\n\\end{document}\n`;
  const status = issues.some((issue) => issue.severity === "error") ? "FAIL" : issues.length ? "PARTIAL" : "PASS";
  return { status, ...(status !== "FAIL" ? { latex } : {}), report: report(document, status, issues) };
}

function report(document: MathDocument, status: "PASS" | "PARTIAL" | "FAIL", issues: DocumentEngineIssue[]): DocumentConversionReport {
  return { status, warnings: issues.filter((issue) => issue.severity === "warning" && !issue.code.startsWith("UNSUPPORTED")), unsupported: issues.filter((issue) => issue.code.startsWith("UNSUPPORTED")), errors: issues.filter((issue) => issue.severity === "error"), assets: [], statistics: { paragraphs: document.sections.flatMap((section) => section.blocks).filter((block) => ["paragraph", "heading", "list_item"].includes(block.type)).length, equations: document.expressions.length, images: (document.assets ?? []).filter((asset) => asset.kind === "image").length, tables: (document.assets ?? []).filter((asset) => asset.kind === "table").length } };
}
