import type {
  AssetDerivation,
  AssetSemanticRole,
  ContentBlock,
  DocumentBlock,
  DocumentIR,
  FigureRecord,
  MathNode,
  ParseStatus,
  VmlLayout,
} from "../document-engine/document-ir.js";

export type {
  AssetDerivation,
  AssetSemanticRole,
  ContentBlock,
  DocumentBlock,
  DocumentIR,
  FigureRecord,
  MathNode,
  ParseStatus,
  VmlLayout,
} from "../document-engine/document-ir.js";

export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "UNKNOWN";
export interface DocumentQuestionCandidate { id: string; questionIndex?: number; questionLabel?: string; section?: string; rawBlocks: DocumentBlock[]; textBlocks: ContentBlock[]; mathBlocks: MathNode[]; figureAnchors: string[]; questionTypeCandidate: QuestionType; sourceLocations: string[]; parseWarnings: string[] }
export interface QuestionOption { label: string; content: ContentBlock[] }
export interface TrueFalseItem { label: string; content: ContentBlock[] }
export interface SourceProvenance { document: string; sourceHash: string; blockIds: string[]; sourceLocations: string[] }
export interface FigureAssociation { figureId: string; questionId?: string; status: "CONFIRMED" | "AMBIGUOUS" | "UNASSIGNED"; confidence: 0 | 1; evidence: string[] }
export type QuestionBankStatus = "REVIEW" | "QUARANTINED" | "APPROVED";
export interface QuestionObject { schemaVersion?: 1; id: string; source: SourceProvenance; section?: string; index?: number; type: QuestionType; stem: ContentBlock[]; options: QuestionOption[]; trueFalseItems: TrueFalseItem[]; shortAnswer?: ContentBlock[]; answer?: ContentBlock[]; solution?: ContentBlock[]; subquestions: Array<{ label: string; content: ContentBlock[] }>; figures: FigureRecord[]; figureAssociations: FigureAssociation[]; metadata: Record<string, string>; warnings: string[]; validationStatus: "VALID" | "REVIEW_REQUIRED" | "INVALID"; bankStatus?: QuestionBankStatus; duplicateState?: "UNIQUE" | "DUPLICATE" | "POSSIBLE_DUPLICATE"; examQa?: { status: "READY" | "REVIEW_REQUIRED" | "BLOCKED" | "NOT_TESTED"; issueCodes: string[] } }
export interface QAResult { level: "PASS" | "WARNING" | "FAIL"; code: string; message: string }
export interface DuplicateResult { status: "UNIQUE" | "DUPLICATE" | "POSSIBLE_DUPLICATE"; matchedId?: string; evidence: string[] }
export type QuestionRelationType = "EXACT_DUPLICATE" | "POSSIBLE_DUPLICATE" | "PARAMETRIC_VARIANT" | "SHARED_STEM" | "SHARED_DATA" | "SHARED_FIGURE" | "DEPENDENT_ON" | "DERIVED_FROM" | "SOURCE_CONFLICT" | "NONE";
export interface QuestionRelation { sourceQuestionId: string; targetQuestionId: string; relations: QuestionRelationType[]; evidence: string[]; reviewRequired?: boolean; sourceQuestionIdForDependency?: string }
export interface QuestionFamily { familyId: string; memberQuestionIds: string[]; relationEvidence: string[]; schemaVersion: 1 }
export interface DuplicateAuditRecord { removedQuestionId: string; keptQuestionId: string; relation: "EXACT_DUPLICATE"; sourceDocument: string; sourceHash: string; sourceLocations: string[]; evidence: string[]; policyVersion: string }
export interface QuestionBankRelations { schemaVersion: 1; relations: QuestionRelation[]; families: QuestionFamily[]; duplicateAudit: DuplicateAuditRecord[] }
export interface QuestionBankSnapshot { schemaVersion: 1; questions: QuestionObject[]; orphanFigures: FigureRecord[]; relations?: QuestionBankRelations }
export interface QuestionBankRepository { load(): QuestionBankSnapshot; replace(snapshot: QuestionBankSnapshot): void }
export type QuestionSortField = "ID" | "INDEX" | "SOURCE_DOCUMENT" | "TYPE" | "STATUS";
export interface QuestionSearchQuery { text?: string; ids?: string[]; types?: QuestionType[]; statuses?: QuestionBankStatus[]; sourceDocuments?: string[]; sourceIndices?: number[]; hasFigures?: boolean; duplicateStates?: Array<"UNIQUE" | "DUPLICATE" | "POSSIBLE_DUPLICATE">; relationTypes?: QuestionRelationType[]; familyIds?: string[]; relatedToQuestionId?: string; metadata?: Record<string, string>; sort?: { field: QuestionSortField; direction?: "ASC" | "DESC" }; limit?: number; offset?: number; includeQuarantined?: boolean }
export interface QueryDiagnostic { code: "UNKNOWN_FILTER" | "INVALID_SORT" | "INVALID_PAGINATION" | "NO_RESULTS"; message: string }
export interface QuestionQueryResult { items: QuestionObject[]; total: number; query: QuestionSearchQuery; warnings: QueryDiagnostic[] }
