// Canonical PiMath generic document interchange contracts.
// Extracted without schema mutation from the legacy Question Bank ownership.

export type ParseStatus = "PARSED" | "UNRESOLVED" | "UNSUPPORTED";
export type DocumentObjectId = string;
export interface SourceAnchor {
  sourceDocumentId: string;
  partName?: string;
  paragraphIndex?: number;
  runIndex?: number;
  tableIndex?: number;
  relationshipId?: string;
  objectIndex?: number;
}
export type PreservationStatus = "PASS" | "REVIEW" | "QUARANTINED" | "UNSUPPORTED";
export interface Provenance {
  sourceFile: string;
  sourceSha256?: string;
  sourceKind: string;
  parser: string;
  parserVersion?: string;
  transformationHistory: string[];
}
export interface ExtractionIssue {
  code: string;
  severity: "INFO" | "WARNING" | "ERROR";
  objectId?: DocumentObjectId;
  sourceAnchor?: SourceAnchor;
  message: string;
  status: PreservationStatus;
}
export type ContentBlock =
  | { type: "text"; value: string; sourceLocation?: string }
  | { type: "math"; math: MathNode; sourceLocation?: string }
  | { type: "figure"; figureId: string; sourceLocation?: string }
  | { type: "table"; cells: ContentBlock[][]; sourceLocation?: string };
export interface MathNode { id?: DocumentObjectId; sourceType: "OMML" | "LATEX" | "TEXT"; sourceRaw: string; latex?: string; normalized?: string; parseStatus: ParseStatus; warnings: string[]; sourceLocation: string }
export type AssetSemanticRole = "REAL_FIGURE" | "MATHTYPE_PREVIEW" | "OLE_PREVIEW" | "EQUATION_PREVIEW" | "RASTER_FIGURE" | "RASTER_MATH" | "UNKNOWN";
export interface VmlLayout { groupId: string; componentOrder: number; x: number; y: number; width: number; height: number; rotation?: number; zOrder?: number; crop?: { left?: number; top?: number; right?: number; bottom?: number } }
export interface AssetDerivation { sourceAssetId: string; sourceMediaPath?: string; sourceFormat: string; sourceMime?: string; sourceSha256?: string; semanticRole: AssetSemanticRole; converter?: { name: "emf-converter"; version: "2.0.2"; canvasVersion: "3.2.3" }; derivedAssetId?: string; derivedFormat?: "PNG"; derivedMime?: "image/png"; derivedSha256?: string; status: "SOURCE" | "DERIVED" | "FAILED" | "REVIEW_REQUIRED"; error?: string }
export interface FigureRecord { id: string; relationshipId: string; mediaPath?: string; mimeType?: string; bytes?: Uint8Array; sourceLocation: string; paragraphIndex?: number; tableCell?: string; dimensions?: { widthEmu?: number; heightEmu?: number; widthPx?: number; heightPx?: number }; caption?: string; semanticRole?: AssetSemanticRole; layout?: VmlLayout; derivation?: AssetDerivation; componentIds?: string[]; groupId?: string; vmlGroupXml?: string; sourceAnchor?: SourceAnchor; provenance?: Provenance; status?: PreservationStatus; issues?: ExtractionIssue[] }
export interface WordNumberingMeta { numId: string; level: number; format?: string; levelText?: string; start?: number; ordinal?: number; label?: string }
export interface DocumentBlock { id: string; kind: "PARAGRAPH" | "TABLE" | "SECTION"; order: number; paragraphIndex?: number; style?: string; numbering?: string; numberingMeta?: WordNumberingMeta; boldLabel?: boolean; section?: string; content: ContentBlock[]; sourceLocation: string }
export interface DocumentIR { sourceDocument: string; sourceHash: string; blocks: DocumentBlock[]; figures: FigureRecord[]; warnings: string[]; id?: DocumentObjectId; sourceDocumentId?: string; provenance?: Provenance; extractionIssues?: ExtractionIssue[] }
