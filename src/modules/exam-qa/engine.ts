import { EXAM_QA_ISSUE_CODES } from "./issue-codes.js";
import { validateExamStructure } from "./exam-structure-validator.js";
import { runQuestionValidators } from "./question-validator.js";
import type { ExamQAResult, NormalizedExam, NormalizedExamQuestion, QAIssue, QuestionQAResult, QuestionQAStatus, QuestionValidationConfig, ValidatorExecution } from "./types.js";

export interface ApprovalPolicy { warningsRequireReview?: boolean; errorsBlock?: boolean }
export function evaluateQuestionQAStatus(issues: QAIssue[], validators: ValidatorExecution[], policy: ApprovalPolicy = {}): QuestionQAStatus {
  if (validators.some((validator) => validator.required && validator.status === "NOT_TESTED")) return "NOT_TESTED";
  if (issues.some((item) => item.severity === "BLOCKER")) return "BLOCKED";
  if (issues.some((item) => item.severity === "ERROR")) return policy.errorsBlock ? "BLOCKED" : "REVIEW_REQUIRED";
  if (issues.some((item) => item.severity === "WARNING") && policy.warningsRequireReview !== false) return "REVIEW_REQUIRED";
  return "READY";
}

export function validateQuestion(question: NormalizedExamQuestion, config: QuestionValidationConfig = {}): QuestionQAResult {
  const output = runQuestionValidators(question, config);
  const missing = output.validators.filter((item) => item.required && item.status === "NOT_TESTED");
  const issues = [...output.issues, ...missing.map((validator): QAIssue => ({ code: EXAM_QA_ISSUE_CODES.REQUIRED_VALIDATOR_NOT_TESTED, category: "VALIDATION", severity: "BLOCKER", message: `Required validator ${validator.validatorId} was not executed.`, questionId: question.id, details: { validatorId: validator.validatorId } }))];
  return { questionId: question.id, status: evaluateQuestionQAStatus(issues, output.validators, { warningsRequireReview: config.warningsRequireReview }), issues, answerVerification: { status: "NOT_TESTED", details: { scope: "Deferred to EXAM-QA-3" } }, markerCompatibility: output.markerCompatibility, markerAnswer: output.markerAnswer, validators: output.validators };
}

export function validateExam(exam: NormalizedExam): ExamQAResult {
  const structureIssues = validateExamStructure(exam);
  const questionResults = exam.questions.map((question) => {
    const section = exam.sections.find((item) => item.sectionId === question.section);
    const result = validateQuestion(question, { expectedOptionCount: section?.expectedOptionCount, expectedStatementCount: section?.expectedStatementCount });
    const relevant = structureIssues.filter((item) => item.questionId === question.id);
    if (!relevant.length) return result;
    const issues = [...result.issues, ...relevant];
    return { ...result, issues, status: evaluateQuestionQAStatus(issues, result.validators) };
  });
  const statuses = questionResults.map((item) => item.status);
  const status: QuestionQAStatus = structureIssues.some((item) => item.severity === "BLOCKER") || statuses.includes("BLOCKED") ? "BLOCKED" : statuses.includes("NOT_TESTED") ? "NOT_TESTED" : structureIssues.some((item) => item.severity === "ERROR") || statuses.includes("REVIEW_REQUIRED") ? "REVIEW_REQUIRED" : "READY";
  return { examId: exam.id, status, issues: structureIssues, questionResults };
}

