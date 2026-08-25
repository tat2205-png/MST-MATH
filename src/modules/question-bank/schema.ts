import { isValidQuestionId } from "./id.js";
import type { ContentBlock, QAResult, QuestionRecord } from "./types.js";

function validateBlocks(blocks: ContentBlock[] | undefined, field: string): QAResult[] {
  if (!blocks?.length) return [{ level: "FAIL", code: "EMPTY_CONTENT", message: `${field} must not be empty` }];
  const results: QAResult[] = [];
  const walk = (items: ContentBlock[]) => items.forEach((block) => {
    if (block.type === "text" && !block.value.trim()) results.push({ level: "FAIL", code: "EMPTY_TEXT", message: `${field} contains empty text` });
    if (block.type === "math" && (!block.latex.trim() || /\\documentclass|\\begin\{document\}/.test(block.latex))) results.push({ level: "FAIL", code: "INVALID_LATEX", message: `${field} contains invalid canonical LaTeX` });
    if (block.type === "image" && !block.assetId.trim()) results.push({ level: "FAIL", code: "EMPTY_ASSET_ID", message: `${field} contains an empty assetId` });
    if (block.type === "table") block.rows.flat().forEach(walk);
  });
  walk(blocks);
  return results;
}

export function validateQuestion(question: QuestionRecord): QAResult[] {
  const r: QAResult[] = [];
  if (!isValidQuestionId(question.id)) r.push({ level: "FAIL", code: "INVALID_ID", message: "Malformed question ID" });
  if (![10, 11, 12].includes(question.grade)) r.push({ level: "FAIL", code: "INVALID_GRADE", message: "Grade must be 10, 11, or 12" });
  if (question.difficulty < 1 || question.difficulty > 5) r.push({ level: "FAIL", code: "INVALID_DIFFICULTY", message: "Difficulty must be 1..5" });
  if (!question.source?.fileId || !question.source.originalFileName || !question.source.sourceHash || !question.source.importedAt) r.push({ level: "FAIL", code: "INVALID_SOURCE", message: "Source provenance is incomplete" });
  if (!["DRAFT", "REVIEW", "APPROVED", "REJECTED", "QUARANTINED"].includes(question.status)) r.push({ level: "FAIL", code: "INVALID_STATUS", message: "Invalid status" });
  r.push(...validateBlocks(question.content, "content"));
  if (question.questionType === "MCQ") {
    const ids = question.options?.map((o) => o.id) ?? [];
    if (ids.length !== 4 || new Set(ids).size !== 4 || "ABCD".split("").some((id) => !ids.includes(id as never))) r.push({ level: "FAIL", code: "MCQ_OPTIONS", message: "MCQ requires unique A/B/C/D options" });
    question.options?.forEach((o) => r.push(...validateBlocks(o.content, `option ${o.id}`)));
    if (question.answer?.type !== "MCQ" || !ids.includes(question.answer.optionId)) r.push({ level: question.status === "APPROVED" ? "FAIL" : "WARNING", code: "MCQ_ANSWER", message: "MCQ answer is unresolved" });
  } else if (question.questionType === "TRUE_FALSE") {
    if (!question.statements?.length && (question.answer?.type !== "TRUE_FALSE" || !question.answer.statements.length)) r.push({ level: "FAIL", code: "TF_STATEMENTS", message: "TRUE_FALSE requires semantic statements" });
    if (question.answer?.type !== "TRUE_FALSE") r.push({ level: question.status === "APPROVED" ? "FAIL" : "WARNING", code: "TF_ANSWER", message: "TRUE_FALSE answers are unresolved" });
    question.answer?.type === "TRUE_FALSE" && question.answer.statements.forEach((s) => r.push(...validateBlocks(s.content, `statement ${s.id}`)));
    question.statements?.forEach((s) => r.push(...validateBlocks(s.content, `statement ${s.id}`)));
  } else if (question.questionType === "SHORT_ANSWER" && (question.answer?.type !== "SHORT_ANSWER" || validateBlocks(question.answer.content, "answer").some((x) => x.level === "FAIL"))) {
    r.push({ level: question.status === "APPROVED" ? "FAIL" : "WARNING", code: "SHORT_ANSWER_REQUIRED", message: "Canonical short answer is unresolved" });
  }
  if (question.questionType === "ESSAY" && question.status !== "DRAFT" && !question.solution?.length) r.push({ level: "WARNING", code: "ESSAY_SOLUTION_MISSING", message: "Essay solution is missing" });
  return r.length ? r : [{ level: "PASS", code: "VALID", message: "Question is valid" }];
}
export function assertValidQuestion(question: QuestionRecord): QuestionRecord {
  const failures = validateQuestion(question).filter((x) => x.level === "FAIL");
  if (failures.length) throw new Error(failures.map((x) => `${x.code}: ${x.message}`).join("; "));
  return question;
}
