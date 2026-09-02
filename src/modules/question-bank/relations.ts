import { createHash } from "node:crypto";
import type { QuestionObject, QuestionRelation, QuestionRelationType, QuestionBankRelations } from "./types.js";
import { questionFingerprint } from "./duplicate.js";

const content = (q: QuestionObject, includeAnswers = false) => JSON.stringify({ type: q.type, stem: q.stem, options: q.options, trueFalseItems: q.trueFalseItems, shortAnswer: q.shortAnswer, subquestions: q.subquestions, ...(includeAnswers ? { answer: q.answer, solution: q.solution } : {}) }, (_k, v) => typeof v === "object" && v !== null && "sourceLocation" in v ? undefined : v);
const stable = (s: string) => s.normalize("NFC");
export const relationFingerprint = (q: QuestionObject) => questionFingerprint(q);
export function relationTypesForQuestion(index: QuestionBankRelations | undefined, questionId: string): QuestionRelationType[] {
  return [...new Set((index?.relations ?? []).filter(r => r.sourceQuestionId === questionId || r.targetQuestionId === questionId).flatMap(r => r.relations))];
}
export const structureFingerprint = (q: QuestionObject) => createHash("sha256").update(stable(JSON.stringify({ type: q.type, options: q.options.map(x => x.label), trueFalse: q.trueFalseItems.map(x => x.label), subquestions: q.subquestions.map(x => x.label) }))).digest("hex");
const stem = (q: QuestionObject) => JSON.stringify({ type: q.type, stem: q.stem, options: q.options.map(x => x.label), trueFalseItems: q.trueFalseItems.map(x => x.label) });
const withoutOptions = (q: QuestionObject) => JSON.stringify({ type: q.type, stem: q.stem, shortAnswer: q.shortAnswer, subquestions: q.subquestions, trueFalseItems: q.trueFalseItems.map(x => x.label) });
const figures = (q: QuestionObject) => q.figureAssociations.filter(x => x.status === "CONFIRMED").map(x => x.figureId).sort().join("|");
export function analyzeRelation(a: QuestionObject, b: QuestionObject): QuestionRelation {
  const sameCore = content(a) === content(b), sameFull = content(a, true) === content(b, true);
  if (sameCore && sameFull) return { sourceQuestionId: a.id, targetQuestionId: b.id, relations: ["EXACT_DUPLICATE"], evidence: ["DETERMINISTIC_CANONICAL_CONTENT_MATCH"] };
  if (sameCore && !sameFull) return { sourceQuestionId: a.id, targetQuestionId: b.id, relations: ["SOURCE_CONFLICT", "POSSIBLE_DUPLICATE"], evidence: ["CANONICAL_QUESTION_MATCH_ANSWER_OR_SOLUTION_CONFLICT"], reviewRequired: true };
  if (withoutOptions(a) === withoutOptions(b) && JSON.stringify(a.options) !== JSON.stringify(b.options)) return { sourceQuestionId: a.id, targetQuestionId: b.id, relations: ["SOURCE_CONFLICT", "POSSIBLE_DUPLICATE"], evidence: ["CANONICAL_QUESTION_MATCH_OPTION_CONFLICT"], reviewRequired: true };
  if (stem(a) === stem(b) && relationFingerprint(a) !== relationFingerprint(b)) return { sourceQuestionId: a.id, targetQuestionId: b.id, relations: ["PARAMETRIC_VARIANT"], evidence: ["SAME_STRUCTURE_TASK_DIFFERENT_CANONICAL_DATA"] };
  if (figures(a) && figures(a) === figures(b)) return { sourceQuestionId: a.id, targetQuestionId: b.id, relations: ["SHARED_FIGURE"], evidence: ["CONFIRMED_FIGURE_ID_MATCH"] };
  return { sourceQuestionId: a.id, targetQuestionId: b.id, relations: ["NONE"], evidence: [] };
}
export function familyIdFor(q: QuestionObject, peer: QuestionObject) { return `FAMILY_${structureFingerprint(q).slice(0, 16)}`; }
