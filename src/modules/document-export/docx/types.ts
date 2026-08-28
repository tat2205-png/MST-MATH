import type { NaMathOutputIdentity } from "../../../config/naMathStandardV26.js";

export interface DocxRenderOptions {
  outputIdentity?: NaMathOutputIdentity;
  title?: string;
  creator?: string;
  pageBreakAfterBlockIds?: string[];
  generatedAt?: Date;
}

export interface DocxQaMetadata {
  format: "docx";
  packageParts: string[];
  standardId: "NA_MATH_STANDARD_V2_6";
  outputIdentity: NaMathOutputIdentity;
}

export interface DocxRenderResult {
  bytes: Uint8Array;
  outputPath?: string;
  warnings: string[];
  qa: DocxQaMetadata;
  rendererVersion: "DOCX_EXPORT_V1";
  standardVersion: "NA_MATH_STANDARD_V2_6";
}

export class DocxRenderError extends Error {
  constructor(public readonly code: string, message: string, public readonly causeDetail?: unknown) {
    super(message);
    this.name = "DocxRenderError";
  }
}
