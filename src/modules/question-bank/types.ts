export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "UNKNOWN";
export type ParseStatus = "PARSED" | "UNRESOLVED" | "UNSUPPORTED";
export type ContentBlock =
  | { type: "text"; value: string; sourceLocation?: string }
  | { type: "math"; math: MathNode; sourceLocation?: string }
  | { type: "figure"; figureId: string; sourceLocation?: string }
  | { type: "table"; cells: ContentBlock[][]; sourceLocation?: string };
export interface MathNode { sourceType: "OMML" | "LATEX" | "TEXT"; sourceRaw: string; latex?: string; normalized?: string; parseStatus: ParseStatus; warnings: string[]; sourceLocation: string }
export type AssetSemanticRole = "REAL_FIGURE" | "MATHTYPE_PREVIEW" | "OLE_PREVIEW" | "EQUATION_PREVIEW" | "RASTER_FIGURE" | "RASTER_MATH" | "UNKNOWN";
export interface VmlLayout { groupId: string; componentOrder: number; x: number; y: number; width: number; height: number; rotation?: number; zOrder?: number; crop?: { left?: number; top?: number; right?: number; bottom?: number } }
export interface AssetDerivation { sourceAssetId: string; sourceMediaPath?: string; sourceFormat: string; sourceMime?: string; sourceSha256?: string; semanticRole: AssetSemanticRole; converter?: { name: "emf-converter"; version: "2.0.2"; canvasVersion: "3.2.3" }; derivedAssetId?: string; derivedFormat?: "PNG"; derivedMime?: "image/png"; derivedSha256?: string; status: "SOURCE" | "DERIVED" | "FAILED" | "REVIEW_REQUIRED"; error?: string }
export interface FigureRecord { id: string; relationshipId: string; mediaPath?: string; mimeType?: string; bytes?: Uint8Array; sourceLocation: string; paragraphIndex?: number; tableCell?: string; dimensions?: { widthEmu?: number; heightEmu?: number; widthPx?: number; heightPx?: number }; caption?: string; semanticRole?: AssetSemanticRole; layout?: VmlLayout; derivation?: AssetDerivation; componentIds?: string[]; groupId?: string; vmlGroupXml?: string }
export interface DocumentBlock { id: string; kind: "PARAGRAPH" | "TABLE" | "SECTION"; order: number; paragraphIndex?: number; style?: string; numbering?: string; boldLabel?: boolean; section?: string; content: ContentBlock[]; sourceLocation: string }
export interface DocumentIR { sourceDocument: string; sourceHash: string; blocks: DocumentBlock[]; figures: FigureRecord[]; warnings: string[] }
export interface DocumentQuestionCandidate { id: string; questionIndex?: number; questionLabel?: string; section?: string; rawBlocks: DocumentBlock[]; textBlocks: ContentBlock[]; mathBlocks: MathNode[]; figureAnchors: string[]; questionTypeCandidate: QuestionType; sourceLocations: string[]; parseWarnings: string[] }
export interface QuestionOption { label: string; content: ContentBlock[] }
export interface TrueFalseItem { label: string; content: ContentBlock[] }
export interface SourceProvenance { document: string; sourceHash: string; blockIds: string[]; sourceLocations: string[] }
export interface FigureAssociation { figureId: string; questionId?: string; status: "CONFIRMED" | "AMBIGUOUS" | "UNASSIGNED"; confidence: 0 | 1; evidence: string[] }
export type QuestionBankStatus = "REVIEW" | "QUARANTINED" | "APPROVED";
export interface QuestionObject { schemaVersion?: 1; id: string; source: SourceProvenance; section?: string; index?: number; type: QuestionType; stem: ContentBlock[]; options: QuestionOption[]; trueFalseItems: TrueFalseItem[]; shortAnswer?: ContentBlock[]; answer?: ContentBlock[]; solution?: ContentBlock[]; subquestions: Array<{ label: string; content: ContentBlock[] }>; figures: FigureRecord[]; figureAssociations: FigureAssociation[]; metadata: Record<string, string>; warnings: string[]; validationStatus: "VALID" | "REVIEW_REQUIRED" | "INVALID"; bankStatus?: QuestionBankStatus; duplicateState?: "UNIQUE" | "DUPLICATE" | "POSSIBLE_DUPLICATE"; examQa?: { status: "READY" | "REVIEW_REQUIRED" | "BLOCKED" | "NOT_TESTED"; issueCodes: string[] } }
export interface QAResult { level: "PASS" | "WARNING" | "FAIL"; code: string; message: string }
export interface DuplicateResult { status: "UNIQUE" | "DUPLICATE" | "POSSIBLE_DUPLICATE"; matchedId?: string; evidence: string[] }
export interface QuestionBankSnapshot { schemaVersion: 1; questions: QuestionObject[]; orphanFigures: FigureRecord[] }
export interface QuestionBankRepository { load(): QuestionBankSnapshot; replace(snapshot: QuestionBankSnapshot): void }
export type QuestionSortField = "ID" | "INDEX" | "SOURCE_DOCUMENT" | "TYPE" | "STATUS";
export interface QuestionSearchQuery { text?: string; ids?: string[]; types?: QuestionType[]; statuses?: QuestionBankStatus[]; sourceDocuments?: string[]; sourceIndices?: number[]; hasFigures?: boolean; duplicateStates?: Array<"UNIQUE" | "DUPLICATE" | "POSSIBLE_DUPLICATE">; metadata?: Record<string, string>; sort?: { field: QuestionSortField; direction?: "ASC" | "DESC" }; limit?: number; offset?: number; includeQuarantined?: boolean }
export interface QueryDiagnostic { code: "UNKNOWN_FILTER" | "INVALID_SORT" | "INVALID_PAGINATION" | "NO_RESULTS"; message: string }
export interface QuestionQueryResult { items: QuestionObject[]; total: number; query: QuestionSearchQuery; warnings: QueryDiagnostic[] }
