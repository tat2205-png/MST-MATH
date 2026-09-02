import { createHash } from "node:crypto";
import type { ContentBlock, DuplicateResult, QuestionObject } from "./types.js";
const canonical = (value: unknown) => JSON.stringify(value, (key, item) => key === "sourceLocation" || key === "bytes" ? undefined : item).normalize("NFC");
export function questionFingerprint(question: QuestionObject): string { return createHash("sha256").update(canonical({ type: question.type, stem: question.stem, options: question.options, statements: question.trueFalseItems, shortAnswer: question.shortAnswer, subquestions: question.subquestions })).digest("hex"); }
export function detectDuplicate(question: QuestionObject, existing: QuestionObject[]): DuplicateResult {
  const exact = existing.find((item) => item.id === question.id || (item.source.sourceHash === question.source.sourceHash && item.index === question.index)); if (exact) return { status: "DUPLICATE", matchedId: exact.id, evidence: ["STABLE_SOURCE_IDENTITY"] };
  const fingerprint = questionFingerprint(question); const possible = existing.find((item) => questionFingerprint(item) === fingerprint); return possible ? { status: "POSSIBLE_DUPLICATE", matchedId: possible.id, evidence: ["CANONICAL_CONTENT_MATCH_DIFFERENT_SOURCE"] } : { status: "UNIQUE", evidence: [] };
}
