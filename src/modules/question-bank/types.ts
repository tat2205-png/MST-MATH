export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "UNKNOWN";
export type ParseStatus = "PARSED" | "UNRESOLVED" | "UNSUPPORTED";
export type ContentBlock =
  | { type: "text"; value: string; sourceLocation?: string }
  | { type: "math"; math: MathNode; sourceLocation?: string }
  | { type: "figure"; figureId: string; sourceLocation?: string }
  | { type: "table"; cells: ContentBlock[][]; sourceLocation?: string };
export interface MathNode { sourceType: "OMML" | "LATEX" | "TEXT"; sourceRaw: string; latex?: string; normalized?: string; parseStatus: ParseStatus; warnings: string[]; sourceLocation: string }
export interface FigureRecord { id: string; relationshipId: string; mediaPath?: string; mimeType?: string; bytes?: Uint8Array; sourceLocation: string; paragraphIndex?: number; tableCell?: string; dimensions?: { widthEmu?: number; heightEmu?: number }; caption?: string }
export interface DocumentBlock { id: string; kind: "PARAGRAPH" | "TABLE" | "SECTION"; order: number; paragraphIndex?: number; style?: string; numbering?: string; boldLabel?: boolean; section?: string; content: ContentBlock[]; sourceLocation: string }
export interface DocumentIR { sourceDocument: string; sourceHash: string; blocks: DocumentBlock[]; figures: FigureRecord[]; warnings: string[] }
export interface DocumentQuestionCandidate { id: string; questionIndex?: number; questionLabel?: string; section?: string; rawBlocks: DocumentBlock[]; textBlocks: ContentBlock[]; mathBlocks: MathNode[]; figureAnchors: string[]; questionTypeCandidate: QuestionType; sourceLocations: string[]; parseWarnings: string[] }
export interface QuestionOption { label: string; content: ContentBlock[] }
export interface TrueFalseItem { label: string; content: ContentBlock[] }
export interface SourceProvenance { document: string; sourceHash: string; blockIds: string[]; sourceLocations: string[] }
export interface FigureAssociation { figureId: string; questionId?: string; status: "CONFIRMED" | "AMBIGUOUS" | "UNASSIGNED"; confidence: 0 | 1; evidence: string[] }
export interface QuestionObject { id: string; source: SourceProvenance; section?: string; index?: number; type: QuestionType; stem: ContentBlock[]; options: QuestionOption[]; trueFalseItems: TrueFalseItem[]; shortAnswer?: ContentBlock[]; solution?: ContentBlock[]; subquestions: Array<{ label: string; content: ContentBlock[] }>; figures: FigureRecord[]; figureAssociations: FigureAssociation[]; metadata: Record<string, string>; warnings: string[]; validationStatus: "VALID" | "REVIEW_REQUIRED" | "INVALID" }
export interface QAResult { level: "PASS" | "WARNING" | "FAIL"; code: string; message: string }
