import { createHash } from "node:crypto";
import type { DuplicateResult, QuestionObject } from "./types.js";
export const canonicalizeForRelation = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalizeForRelation) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).filter(([key]) => key !== "sourceLocation" && key !== "bytes").map(([key, item]) => [key, canonicalizeForRelation(item)])) : value;
export const canonicalQuestionPayload = (question: QuestionObject, includeAnswers = false) => ({ type: question.type, stem: question.stem, options: question.options, trueFalseItems: question.trueFalseItems, shortAnswer: question.shortAnswer, subquestions: question.subquestions, ...(includeAnswers ? { answer: question.answer, solution: question.solution } : {}) });
export function questionFingerprint(question: QuestionObject): string { return createHash("sha256").update(JSON.stringify(canonicalizeForRelation(canonicalQuestionPayload(question))).normalize("NFC")).digest("hex"); }
export function detectDuplicate(question: QuestionObject, existing: QuestionObject[]): DuplicateResult {
  const exact = existing.find((item) => item.id === question.id || (item.source.sourceHash === question.source.sourceHash && item.index === question.index)); if (exact) return { status: "DUPLICATE", matchedId: exact.id, evidence: ["STABLE_SOURCE_IDENTITY"] };
  const fingerprint = questionFingerprint(question); const possible = existing.find((item) => questionFingerprint(item) === fingerprint); return possible ? { status: "POSSIBLE_DUPLICATE", matchedId: possible.id, evidence: ["CANONICAL_CONTENT_MATCH_DIFFERENT_SOURCE"] } : { status: "UNIQUE", evidence: [] };
}
