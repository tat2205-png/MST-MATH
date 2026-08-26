import { normalizeMarkerAnswer, type MarkerAnswer, type MarkerCompatibility } from "./answer-model.js";
import { EXAM_QA_ISSUE_CODES } from "./issue-codes.js";
import type { ExamQAIssueCode } from "./issue-codes.js";
import type { NormalizedExamQuestion, QAIssue, QuestionValidationConfig, ValidatorExecution } from "./types.js";

export const QUESTION_VALIDATORS = { ID_NUMBER: "QUESTION_ID_NUMBER", STEM: "QUESTION_STEM", TYPE_STRUCTURE: "QUESTION_TYPE_STRUCTURE", MARKER: "MARKER_COMPATIBILITY" } as const;
const requiredByDefault = Object.values(QUESTION_VALIDATORS);

const issue = (question: NormalizedExamQuestion, code: ExamQAIssueCode, severity: QAIssue["severity"], message: string, field?: string, details?: Record<string, unknown>): QAIssue => ({
  code, category: code.startsWith("MARKER") || code.startsWith("SHORT_ANSWER") ? "MARKER" : "QUESTION", severity, message,
  questionId: question.id, location: { field, sectionId: question.section, sourcePage: question.sourcePage, sourceIndex: question.sourceIndex }, details,
});

export interface QuestionValidationOutput { issues: QAIssue[]; validators: ValidatorExecution[]; markerCompatibility: MarkerCompatibility; markerAnswer?: MarkerAnswer }

export function runQuestionValidators(question: NormalizedExamQuestion, config: QuestionValidationConfig = {}): QuestionValidationOutput {
  const issues: QAIssue[] = [];
  const executions: ValidatorExecution[] = [];
  const required = new Set(config.requiredValidators ?? requiredByDefault);
  const skipped = new Set(config.unexecutedValidators ?? []);
  let markerCompatibility: MarkerCompatibility = { status: "NOT_TESTED" };
  let markerAnswer: MarkerAnswer | undefined;

  const run = (validatorId: string, validate: () => QAIssue[]) => {
    if (skipped.has(validatorId)) { executions.push({ validatorId, status: "NOT_TESTED", required: required.has(validatorId), issues: [] }); return; }
    const found = validate(); issues.push(...found);
    executions.push({ validatorId, status: found.some((item) => item.severity === "ERROR" || item.severity === "BLOCKER") ? "FAILED" : "PASSED", required: required.has(validatorId), issues: found.map((item) => item.code) });
  };

  run(QUESTION_VALIDATORS.ID_NUMBER, () => {
    const found: QAIssue[] = [];
    if (!question.id?.trim()) found.push(issue(question, EXAM_QA_ISSUE_CODES.QUESTION_ID_MISSING, "BLOCKER", "Question id is required.", "id"));
    if (!Number.isInteger(question.questionNumber) || Number(question.questionNumber) <= 0) found.push(issue(question, EXAM_QA_ISSUE_CODES.QUESTION_NUMBER_INVALID, "BLOCKER", "Question number must be a positive integer.", "questionNumber"));
    return found;
  });
  run(QUESTION_VALIDATORS.STEM, () => question.stem?.trim() ? [] : [issue(question, EXAM_QA_ISSUE_CODES.QUESTION_MISSING_STEM, "BLOCKER", "A scorable question must have a non-empty stem.", "stem")]);
  run(QUESTION_VALIDATORS.TYPE_STRUCTURE, () => {
    if (question.type === "UNKNOWN") return [issue(question, EXAM_QA_ISSUE_CODES.QUESTION_TYPE_UNKNOWN, "ERROR", "Question type is unknown.", "type")];
    if (question.type === "SINGLE_CHOICE") {
      const found: QAIssue[] = []; const options = question.options ?? []; const expectedCount = config.expectedOptionCount ?? 4;
      if (options.length !== expectedCount) found.push(issue(question, EXAM_QA_ISSUE_CODES.MCQ_OPTION_COUNT_INVALID, "ERROR", `Expected ${expectedCount} options but found ${options.length}.`, "options", { expectedCount, actualCount: options.length }));
      const keys = options.map((option) => option.key.trim());
      if (new Set(keys).size !== keys.length) found.push(issue(question, EXAM_QA_ISSUE_CODES.MCQ_OPTION_KEY_DUPLICATE, "BLOCKER", "Option keys must be unique.", "options"));
      if (Array.isArray(question.expectedAnswer)) found.push(issue(question, EXAM_QA_ISSUE_CODES.MCQ_MULTIPLE_EXPECTED_ANSWERS, "BLOCKER", "Single-choice questions require exactly one expected answer key.", "expectedAnswer"));
      else if (typeof question.expectedAnswer !== "string" || !question.expectedAnswer.trim()) found.push(issue(question, EXAM_QA_ISSUE_CODES.MCQ_NO_EXPECTED_ANSWER, "ERROR", "Single-choice expected answer is missing.", "expectedAnswer"));
      else if (!keys.includes(question.expectedAnswer.trim())) found.push(issue(question, EXAM_QA_ISSUE_CODES.MCQ_EXPECTED_ANSWER_NOT_FOUND, "BLOCKER", "Expected answer key does not exist in the available options.", "expectedAnswer"));
      return found;
    }
    if (question.type === "TRUE_FALSE") {
      const statements = question.trueFalseStatements ?? []; const expectedCount = config.expectedStatementCount;
      const found: QAIssue[] = [];
      if (expectedCount !== undefined && statements.length !== expectedCount) found.push(issue(question, EXAM_QA_ISSUE_CODES.TRUE_FALSE_STATEMENT_COUNT_INVALID, "ERROR", `Expected ${expectedCount} statements but found ${statements.length}.`, "trueFalseStatements", { expectedCount, actualCount: statements.length }));
      if (!statements.length || statements.some((statement) => !statement.text?.trim() || typeof statement.expected !== "boolean")) found.push(issue(question, EXAM_QA_ISSUE_CODES.TRUE_FALSE_STATEMENT_INVALID, "BLOCKER", "Each true/false statement needs text and a boolean expected value.", "trueFalseStatements"));
      return found;
    }
    return [];
  });
  run(QUESTION_VALIDATORS.MARKER, () => {
    if (question.type === "ESSAY" || question.type === "UNKNOWN") { markerCompatibility = { status: "UNSUPPORTED", reason: `${question.type} is not supported by the marker foundation.` }; return [issue(question, EXAM_QA_ISSUE_CODES.MARKER_UNSUPPORTED_TYPE, "WARNING", markerCompatibility.reason, "type")]; }
    const raw = question.type === "TRUE_FALSE" ? question.trueFalseStatements?.map((item) => item.expected) : question.expectedAnswer;
    const normalized = normalizeMarkerAnswer(question.type, raw);
    if ("reason" in normalized) { markerCompatibility = { status: "INVALID", reason: normalized.reason }; return [issue(question, question.type === "SHORT_ANSWER" ? EXAM_QA_ISSUE_CODES.SHORT_ANSWER_FORMAT_INVALID : EXAM_QA_ISSUE_CODES.MARKER_UNSUPPORTED_TYPE, "ERROR", normalized.reason, "expectedAnswer")]; }
    markerCompatibility = { status: "SUPPORTED" }; markerAnswer = normalized.answer; return [];
  });
  return { issues, validators: executions, markerCompatibility, markerAnswer };
}
