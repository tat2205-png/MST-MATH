import type { NaMathOutputIdentity } from "../../../config/naMathStandardV26.js";

export interface DocxRenderOptions {
  profileId?: string;
  outputIdentity?: NaMathOutputIdentity;
  title?: string;
  creator?: string;
  pageBreakAfterBlockIds?: string[];
  generatedAt?: Date;
  figureMetadata?: Record<string, DocxFigureMetadata>;
  headerText?: string;
  footerText?: string;
}

export interface DocxFigureMetadata {
  title?: string;
  altText?: string;
  geometryProfileId?: string;
  semanticFigureId?: string;
  semanticFlags?: string[];
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
