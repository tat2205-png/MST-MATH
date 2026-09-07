import { adaptQuestionBankRecord, validateQuestion, type NormalizedExamQuestion, type QuestionQAResult } from "../../src/modules/exam-qa/index.js";
import type { ContentBlock, QuestionObject } from "../../src/modules/question-bank/types.js";

export interface CorrectionProposal {
  issueId: string;
  questionId: string;
  sourceLocations: string[];
  kind: "STRUCTURAL" | "MATHEMATICAL" | "FIGURE" | "PEDAGOGICAL_REVIEW";
  severity: "INFO" | "WARNING" | "ERROR" | "BLOCKER";
  evidence: string[];
  before: unknown;
  after?: unknown;
  rationale: string;
  verificationStatus: "NOT_VERIFIED";
  teacherDecision: "PENDING" | "ACCEPTED" | "REJECTED";
}

export interface ExamAnalysisResult {
  questionId: string;
  sourceHash: string;
  qa: QuestionQAResult;
  proposals: CorrectionProposal[];
  publicationStatus: "REVIEW_REQUIRED" | "BLOCKED" | "READY";
}

function textOf(blocks: ContentBlock[]): string {
  return blocks.map((block) => block.type === "text" ? block.value : block.type === "math" ? block.math.latex ?? block.math.sourceRaw : block.type === "figure" ? `[figure:${block.figureId}]` : block.cells.flatMap(textOf).join(" ")).join(" ");
}

function toExamQuestion(question: QuestionObject): NormalizedExamQuestion {
  return adaptQuestionBankRecord({ id: question.id, sourceId: question.source.document, index: question.index, type: question.type === "MULTIPLE_CHOICE" ? "SINGLE_CHOICE" : question.type, stem: textOf(question.stem), options: question.options.map((option) => ({ key: option.label, text: textOf(option.content) })), answer: question.answer ? textOf(question.answer) : undefined, metadata: { source: question.source, figures: question.figureAssociations } });
}

export function analyzeExamQuestion(question: QuestionObject): ExamAnalysisResult {
  const normalized = toExamQuestion(question);
  const qa = validateQuestion(normalized, { warningsRequireReview: true, languageValidation: true, logicValidation: true });
  const proposals = qa.issues.map((issue, index): CorrectionProposal => ({
    issueId: `proposal-${question.id}-${index + 1}`,
    questionId: question.id,
    sourceLocations: question.source.sourceLocations,
    kind: issue.category === "MATH" || issue.category === "ANSWER" ? "MATHEMATICAL" : issue.category === "STRUCTURE" ? "STRUCTURAL" : issue.category === "QUESTION" && question.figures.length ? "FIGURE" : "PEDAGOGICAL_REVIEW",
    severity: issue.severity,
    evidence: [issue.code, issue.message],
    before: issue.location ?? question.source,
    rationale: issue.suggestion ?? "Cần giáo viên xem xét; hệ thống không tự sửa nội dung nguồn.",
    verificationStatus: "NOT_VERIFIED",
    teacherDecision: "PENDING",
  }));
  return { questionId: question.id, sourceHash: question.source.sourceHash, qa, proposals, publicationStatus: qa.status === "BLOCKED" || qa.status === "NOT_TESTED" ? "BLOCKED" : qa.status === "REVIEW_REQUIRED" ? "REVIEW_REQUIRED" : "READY" };
}

export function acceptCorrectionProposal(result: ExamAnalysisResult, proposalId: string, after: unknown): ExamAnalysisResult {
  const proposal = result.proposals.find((item) => item.issueId === proposalId);
  if (!proposal) throw new Error("CORRECTION_PROPOSAL_NOT_FOUND");
  if (after === undefined) throw new Error("CORRECTION_REQUIRES_EXPLICIT_AFTER_VALUE");
  const proposals = result.proposals.map((item) => item.issueId === proposalId ? { ...item, after, teacherDecision: "ACCEPTED" as const } : item);
  return { ...result, proposals, publicationStatus: "REVIEW_REQUIRED" };
}

export function rejectCorrectionProposal(result: ExamAnalysisResult, proposalId: string): ExamAnalysisResult {
  if (!result.proposals.some((item) => item.issueId === proposalId)) throw new Error("CORRECTION_PROPOSAL_NOT_FOUND");
  return { ...result, proposals: result.proposals.map((item) => item.issueId === proposalId ? { ...item, teacherDecision: "REJECTED" as const } : item) };
}
