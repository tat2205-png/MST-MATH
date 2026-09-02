import { createHash } from "node:crypto";
import type { QuestionObject, QuestionRelation, QuestionRelationType, QuestionBankRelations } from "./types.js";
import { canonicalQuestionPayload, canonicalizeForRelation, questionFingerprint } from "./duplicate.js";
const content = (q: QuestionObject, answers = false) => JSON.stringify(canonicalizeForRelation(canonicalQuestionPayload(q, answers))).normalize("NFC");
export const relationFingerprint = (q: QuestionObject) => questionFingerprint(q);
export function relationTypesForQuestion(index: QuestionBankRelations | undefined, id: string): QuestionRelationType[] { return [...new Set((index?.relations ?? []).filter(r => r.sourceQuestionId === id || r.targetQuestionId === id).flatMap(r => r.relations))]; }
export const structureFingerprint = (q: QuestionObject) => createHash("sha256").update(JSON.stringify({ type: q.type, options: q.options.map(x => x.label), trueFalse: q.trueFalseItems.map(x => x.label), subquestions: q.subquestions.map(x => x.label) }).normalize("NFC")).digest("hex");
const stem = (q: QuestionObject) => JSON.stringify({ type: q.type, stem: q.stem, options: q.options.map(x => x.label), trueFalseItems: q.trueFalseItems.map(x => x.label) });
const withoutOptions = (q: QuestionObject) => JSON.stringify({ type: q.type, stem: q.stem, shortAnswer: q.shortAnswer, subquestions: q.subquestions, trueFalseItems: q.trueFalseItems.map(x => x.label) });
const figures = (q: QuestionObject) => q.figureAssociations.filter(x => x.status === "CONFIRMED").map(x => x.figureId).sort().join("|");
const mathStructure = (block: Extract<QuestionObject["stem"][number], { type: "math" }>) => (block.math.latex ?? block.math.normalized ?? block.math.sourceRaw).replace(/[0-9]+(?:\.[0-9]+)?/gu, "#");
const parameterStructure = (q: QuestionObject) => JSON.stringify(canonicalizeForRelation({ type: q.type, stem: q.stem.map(block => block.type === "math" ? { type: "math", sourceType: block.math.sourceType, parseStatus: block.math.parseStatus, structure: mathStructure(block) } : block), options: q.options.map(x => ({ label: x.label, content: x.content.map(block => block.type === "math" ? { type: "math", sourceType: block.math.sourceType, parseStatus: block.math.parseStatus, structure: mathStructure(block) } : block) })), trueFalseItems: q.trueFalseItems, shortAnswer: q.shortAnswer, subquestions: q.subquestions }));
export const variantStructureFingerprint = (q: QuestionObject) => createHash("sha256").update(parameterStructure(q).normalize("NFC")).digest("hex");
export function analyzeRelation(a: QuestionObject, b: QuestionObject): QuestionRelation {
  if (a.source.sourceHash === b.source.sourceHash && a.index !== undefined && a.index === b.index && content(a) !== content(b)) return { sourceQuestionId: a.id, targetQuestionId: b.id, relations: ["SOURCE_CONFLICT"], evidence: ["STABLE_SOURCE_IDENTITY_CONTENT_CONFLICT"], reviewRequired: true };
  const sameCore = content(a) === content(b), sameFull = content(a, true) === content(b, true);
  if (sameCore && sameFull) return { sourceQuestionId: a.id, targetQuestionId: b.id, relations: ["EXACT_DUPLICATE"], evidence: ["DETERMINISTIC_CANONICAL_CONTENT_MATCH"] };
  if (sameCore && !sameFull) return { sourceQuestionId: a.id, targetQuestionId: b.id, relations: ["SOURCE_CONFLICT", "POSSIBLE_DUPLICATE"], evidence: ["CANONICAL_QUESTION_MATCH_ANSWER_OR_SOLUTION_CONFLICT"], reviewRequired: true };
  if (withoutOptions(a) === withoutOptions(b) && JSON.stringify(a.options) !== JSON.stringify(b.options)) return { sourceQuestionId: a.id, targetQuestionId: b.id, relations: ["SOURCE_CONFLICT", "POSSIBLE_DUPLICATE"], evidence: ["CANONICAL_QUESTION_MATCH_OPTION_CONFLICT"], reviewRequired: true };
  if (parameterStructure(a) === parameterStructure(b) && relationFingerprint(a) !== relationFingerprint(b)) return { sourceQuestionId: a.id, targetQuestionId: b.id, relations: ["PARAMETRIC_VARIANT"], evidence: ["SAME_CANONICAL_STRUCTURE_DIFFERENT_CANONICAL_MATH"] };
  if (figures(a) && figures(a) === figures(b)) return { sourceQuestionId: a.id, targetQuestionId: b.id, relations: ["SHARED_FIGURE"], evidence: ["CONFIRMED_FIGURE_ID_MATCH"] };
  return { sourceQuestionId: a.id, targetQuestionId: b.id, relations: ["NONE"], evidence: [] };
}
export function familyIdFor(q: QuestionObject, _peer: QuestionObject) { return `FAMILY_${variantStructureFingerprint(q).slice(0, 16)}`; }
