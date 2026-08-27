import { createHash } from "node:crypto";
import type { ContentBlock, DuplicateResult, QuestionObject } from "./types.js";
const canonical = (blocks: ContentBlock[]) => JSON.stringify(blocks, (key, value) => key === "sourceLocation" || key === "bytes" ? undefined : value);
export function questionFingerprint(question: QuestionObject): string { return createHash("sha256").update(JSON.stringify({ type: question.type, stem: canonical(question.stem), options: question.options.map((x) => [x.label, canonical(x.content)]), statements: question.trueFalseItems.map((x) => [x.label, canonical(x.content)]), subquestions: question.subquestions.map((x) => [x.label, canonical(x.content)]) })).digest("hex"); }
export function detectDuplicate(question: QuestionObject, existing: QuestionObject[]): DuplicateResult {
  const exact = existing.find((item) => item.id === question.id || (item.source.sourceHash === question.source.sourceHash && item.index === question.index)); if (exact) return { status: "DUPLICATE", matchedId: exact.id, evidence: ["STABLE_SOURCE_IDENTITY"] };
  const fingerprint = questionFingerprint(question); const possible = existing.find((item) => questionFingerprint(item) === fingerprint); return possible ? { status: "POSSIBLE_DUPLICATE", matchedId: possible.id, evidence: ["CANONICAL_CONTENT_MATCH_DIFFERENT_SOURCE"] } : { status: "UNIQUE", evidence: [] };
}
