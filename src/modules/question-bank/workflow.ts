import type { QAResult, QuestionRecord, QuestionStatus } from "./types.js";
import { validateQuestion } from "./schema.js";
const allowed: Record<QuestionStatus, QuestionStatus[]> = { DRAFT: ["REVIEW", "QUARANTINED"], REVIEW: ["DRAFT", "APPROVED", "REJECTED", "QUARANTINED"], APPROVED: ["REVIEW"], REJECTED: ["DRAFT", "REVIEW"], QUARANTINED: ["DRAFT"] };
export function transitionQuestion(question: QuestionRecord, next: QuestionStatus, teacherApproved = false): QuestionRecord {
  if (!allowed[question.status].includes(next)) throw new Error(`Illegal status transition ${question.status} -> ${next}`);
  const qa = validateQuestion(question);
  if (next === "APPROVED" && (!teacherApproved || qa.some((x) => x.level === "FAIL"))) throw new Error("APPROVED requires explicit teacher approval and passing validation");
  return { ...question, status: next, updatedAt: new Date().toISOString() };
}
export function runQuestionQA(question: QuestionRecord): QAResult[] { return validateQuestion(question); }
