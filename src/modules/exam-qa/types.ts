import type { ExamQAIssueCode } from "./issue-codes.js";
import type { MarkerAnswer, MarkerCompatibility } from "./answer-model.js";
import type { QASeverity } from "./severity.js";

export const EXAM_QUESTION_TYPES = ["SINGLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY", "UNKNOWN"] as const;
export type ExamQuestionType = (typeof EXAM_QUESTION_TYPES)[number];
export type QuestionQAStatus = "READY" | "REVIEW_REQUIRED" | "BLOCKED" | "NOT_TESTED";
export type ValidatorStatus = "PASSED" | "FAILED" | "NOT_TESTED";

export interface ExamQuestionOption { key: string; text: string; metadata?: Record<string, unknown> }
export interface TrueFalseStatement { key?: string; text: string; expected?: boolean; metadata?: Record<string, unknown> }
export interface MathExpression { source: string; format?: "LATEX" | "OMML" | "MATHML" | "TEXT" | "UNKNOWN"; metadata?: Record<string, unknown> }
export interface QuestionAsset { id?: string; type?: string; uri?: string; altText?: string; metadata?: Record<string, unknown> }

export interface NormalizedExamQuestion {
  id?: string;
  sourceId?: string;
  sourcePage?: number;
  sourceIndex?: number;
  section?: string;
  questionNumber?: number;
  type: ExamQuestionType;
  stem?: string;
  options?: ExamQuestionOption[];
  trueFalseStatements?: TrueFalseStatement[];
  expectedAnswer?: unknown;
  mathExpressions?: MathExpression[];
  assets?: QuestionAsset[];
  metadata?: Record<string, unknown>;
}

export type MarkerMode = "SINGLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "NONE";
export interface ExamSectionDefinition {
  sectionId: string;
  label?: string;
  questionStart?: number;
  questionEnd?: number;
  expectedQuestionCount?: number;
  allowedQuestionTypes: ExamQuestionType[];
  markerMode: MarkerMode;
  expectedOptionCount?: number;
  expectedStatementCount?: number;
}
export interface NormalizedExam { id?: string; title?: string; questions: NormalizedExamQuestion[]; sections: ExamSectionDefinition[]; metadata?: Record<string, unknown> }

export interface QAIssue {
  code: ExamQAIssueCode;
  category: "SCHEMA" | "STRUCTURE" | "QUESTION" | "ANSWER" | "MATH" | "LANGUAGE" | "MARKER" | "VALIDATION";
  severity: QASeverity;
  message: string;
  questionId?: string;
  location?: { field?: string; sectionId?: string; sourcePage?: number; sourceIndex?: number };
  details?: Record<string, unknown>;
  suggestion?: string;
}
export interface ValidatorExecution { validatorId: string; status: ValidatorStatus; required: boolean; issues: ExamQAIssueCode[] }
export interface AnswerVerification { status: "VERIFIED" | "FAILED" | "REVIEW_REQUIRED" | "NOT_TESTED"; details?: Record<string, unknown> }
export interface QuestionQAResult {
  questionId?: string;
  status: QuestionQAStatus;
  issues: QAIssue[];
  answerVerification: AnswerVerification;
  markerCompatibility: MarkerCompatibility;
  markerAnswer?: MarkerAnswer;
  validators: ValidatorExecution[];
  metadata?: Record<string, unknown>;
}
export interface ExamQAResult { examId?: string; status: QuestionQAStatus; issues: QAIssue[]; questionResults: QuestionQAResult[]; metadata?: Record<string, unknown> }

export interface QuestionValidationConfig {
  expectedOptionCount?: number;
  expectedStatementCount?: number;
  requiredValidators?: string[];
  unexecutedValidators?: string[];
  warningsRequireReview?: boolean;
  languageValidation?: boolean;
  logicValidation?: boolean;
}
