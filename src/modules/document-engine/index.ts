export * from "./document-ir.js";
import type { DocxConversionResult, DocxToMathIRResult } from "./types.js";
import { parseDocx } from "./docx/parser.js";
import { docxAstToMathIR } from "./normalize/math-ir-mapper.js";
import { mathIRToLatex } from "./latex/serializer.js";

export * from "./types.js";
export * from "./docx/parser.js";
export * from "./omml/omml.js";
export * from "./normalize/math-ir-mapper.js";
export * from "./latex/serializer.js";
export * from "./student-workspace.js";
export * from "./document-components.js";
export * from "./workspace-planner.js";
export * from "./docx/ingestion.js";

export function docxToMathIR(input: Uint8Array, options: { sourceName?: string } = {}): DocxToMathIRResult {
  const parsed = parseDocx(input, options);
  return parsed.ast ? docxAstToMathIR(parsed.ast) : { status: "FAIL", report: parsed.report };
}

export function convertDocxToLatex(input: Uint8Array, options: { sourceName?: string; profileId?: string } = {}): DocxConversionResult {
  const mapped = docxToMathIR(input, options);
  if (!mapped.document) return mapped;
  const serialized = mathIRToLatex(mapped.document, options);
  const status = mapped.status === "FAIL" || serialized.status === "FAIL" ? "FAIL" : mapped.status === "PARTIAL" || serialized.status === "PARTIAL" ? "PARTIAL" : "PASS";
  return {
    ...mapped, status, ...(serialized.latex ? { latex: serialized.latex } : {}),
    report: {
      ...mapped.report, status,
      warnings: [...mapped.report.warnings, ...serialized.report.warnings],
      unsupported: [...mapped.report.unsupported, ...serialized.report.unsupported],
      errors: [...mapped.report.errors, ...serialized.report.errors],
    },
  };
}
