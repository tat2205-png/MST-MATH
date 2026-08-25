export type Grade = 10 | 11 | 12;
export type QuestionType = "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY";
export type QuestionStatus = "DRAFT" | "REVIEW" | "APPROVED" | "REJECTED" | "QUARANTINED";
export type CognitiveLevel = "RECOGNITION" | "COMPREHENSION" | "APPLICATION";
export type SourceFileType = "DOCX" | "PDF" | "IMAGE";
export type AssetType = "IMAGE" | "SVG" | "TIKZ" | "GEOGEBRA" | "PDF_VECTOR" | "GENERATED";

export type ContentBlock =
  | { type: "text"; value: string }
  | { type: "math"; latex: string }
  | { type: "image"; assetId: string; alt?: string }
  | { type: "table"; rows: ContentBlock[][][] };

export interface SourceProvenance {
  fileId: string;
  originalFileName: string;
  fileType: SourceFileType;
  sourceHash: string;
  page?: number;
  questionNumber?: string;
  importedAt: string;
}

export interface QuestionOption { id: "A" | "B" | "C" | "D"; content: ContentBlock[] }
export interface TrueFalseStatement { id: string; content: ContentBlock[]; answer: boolean }

export type QuestionAnswer =
  | { type: "MCQ"; optionId: "A" | "B" | "C" | "D" }
  | { type: "TRUE_FALSE"; statements: TrueFalseStatement[] }
  | { type: "SHORT_ANSWER"; content: ContentBlock[] }
  | { type: "ESSAY"; content?: ContentBlock[] };

export interface QuestionRecord {
  id: string;
  grade: Grade;
  subject: "MATH";
  curriculum: "GDPT_2018";
  bookSeries?: string;
  chapter: string;
  lesson: string;
  topic: string;
  knowledgeUnit: string;
  questionType: QuestionType;
  cognitiveLevel: CognitiveLevel;
  difficulty: 1 | 2 | 3 | 4 | 5;
  content: ContentBlock[];
  options?: QuestionOption[];
  answer?: QuestionAnswer;
  solution?: ContentBlock[];
  assets: string[];
  tags: string[];
  searchText: string;
  source: SourceProvenance;
  status: QuestionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AssetRecord {
  assetId: string;
  type: AssetType;
  sourcePath: string;
  previewPath?: string;
  mimeType: string;
  hash: string;
  createdAt: string;
}

export interface QuestionSearchFilters {
  query?: string; grade?: Grade; chapter?: string; lesson?: string; topic?: string;
  knowledgeUnit?: string; questionType?: QuestionType; cognitiveLevel?: CognitiveLevel;
  difficulty?: 1 | 2 | 3 | 4 | 5; status?: QuestionStatus; tags?: string[];
}

export interface QuestionBankRepository {
  saveQuestion(question: QuestionRecord): void;
  getQuestion(id: string): QuestionRecord | undefined;
  updateQuestion(question: QuestionRecord): void;
  deleteQuestion(id: string): boolean;
  searchQuestions(filters: QuestionSearchFilters): QuestionRecord[];
}

export interface ImportCandidate {
  content: ContentBlock[];
  source: SourceProvenance;
  status: "DRAFT" | "QUARANTINED";
  assetIds: string[];
  notes: string[];
}

export interface QAResult { level: "PASS" | "WARNING" | "FAIL"; code: string; message: string }

export type ImportSourceKind = "DOCX" | "DIGITAL_TEXT" | "SCANNED" | "MIXED";
export interface QuestionBankImportResult {
  success: boolean;
  duplicate: boolean;
  source: SourceProvenance;
  sourceKind: ImportSourceKind;
  candidatesCreated: number;
  questionsSaved: number;
  reviewRequired: number;
  quarantined: number;
  warnings: string[];
}

export interface QuestionBankUploadRequest {
  originalFileName: string;
  mimeType: string;
  dataBase64: string;
}
