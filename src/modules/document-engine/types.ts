import type { MathDocument, MathExpression } from "../math-ir/index.js";

export type DocumentEngineStatus = "PASS" | "PARTIAL" | "FAIL";
export type DocumentIssueSeverity = "warning" | "error";

export interface DocumentEngineIssue {
  code: string;
  severity: DocumentIssueSeverity;
  path?: string;
  message: string;
}

export interface DocumentStatistics {
  paragraphs: number;
  equations: number;
  images: number;
  tables: number;
}

export interface ExtractedDocxAsset {
  id: string;
  relationshipId: string;
  filename: string;
  packagePath: string;
  mediaType: string;
  widthEmu?: number;
  heightEmu?: number;
  bytes: Uint8Array;
}

export interface DocumentConversionReport {
  status: DocumentEngineStatus;
  warnings: DocumentEngineIssue[];
  unsupported: DocumentEngineIssue[];
  errors: DocumentEngineIssue[];
  assets: Array<Omit<ExtractedDocxAsset, "bytes">>;
  statistics: DocumentStatistics;
}

export interface DocxTextRunNode { type: "text"; text: string; }
export interface DocxMathNode { type: "math"; expression: MathExpression; display: boolean; sourcePath: string; }
export interface DocxImageNode { type: "image"; relationshipId: string; assetId?: string; widthEmu?: number; heightEmu?: number; sourcePath: string; }
export interface DocxLegacyObjectNode {
  type: "legacy_object";
  relationshipId?: string;
  reason: "LEGACY_MATHTYPE_REQUIRES_SEMANTIC_DECODE" | "LEGACY_MATHTYPE_UNSUPPORTED" | "EMBEDDED_OBJECT_UNSUPPORTED";
  sourcePath: string;
}
export interface DocxPageBreakNode { type: "page_break"; }
export type DocxInlineNode = DocxTextRunNode | DocxMathNode | DocxImageNode | DocxLegacyObjectNode | DocxPageBreakNode;

export interface DocxParagraphNode {
  type: "paragraph";
  index: number;
  styleId?: string;
  headingLevel?: number;
  list?: { level: number; numberingId: string; ordered: boolean };
  children: DocxInlineNode[];
}

export interface DocxTableCellNode { index: number; blocks: DocxBlockNode[]; }
export interface DocxTableRowNode { index: number; cells: DocxTableCellNode[]; }
export interface DocxTableNode { type: "table"; index: number; rows: DocxTableRowNode[]; }
export interface DocxSectionBreakNode { type: "section_break"; index: number; }
export type DocxBlockNode = DocxParagraphNode | DocxTableNode | DocxSectionBreakNode;

export interface DocxAst {
  type: "document";
  blocks: DocxBlockNode[];
  assets: ExtractedDocxAsset[];
  issues: DocumentEngineIssue[];
  sourceName?: string;
}

export interface ParsedDocxResult {
  status: DocumentEngineStatus;
  ast?: DocxAst;
  report: DocumentConversionReport;
}

export interface DocxToMathIRResult {
  status: DocumentEngineStatus;
  document?: MathDocument;
  ast?: DocxAst;
  report: DocumentConversionReport;
}

export interface LatexSerializationResult {
  status: DocumentEngineStatus;
  latex?: string;
  report: DocumentConversionReport;
}

export interface DocxConversionResult extends DocxToMathIRResult {
  latex?: string;
}