import type { QuestionRecord } from "./types.js";
import { canonicalContentFingerprint } from "./normalization.js";
export type DuplicateResult = { kind: "EXACT_DUPLICATE" | "LIKELY_DUPLICATE" | "NOT_DUPLICATE"; matchedId?: string };
export function detectDuplicate(candidate: QuestionRecord, existing: QuestionRecord[]): DuplicateResult {
  const exact = existing.find((q) => q.source.sourceHash === candidate.source.sourceHash || canonicalContentFingerprint(q.content) === canonicalContentFingerprint(candidate.content));
  if (exact) return { kind: "EXACT_DUPLICATE", matchedId: exact.id };
  const likely = existing.find((q) => q.searchText.trim().toLocaleLowerCase("vi") === candidate.searchText.trim().toLocaleLowerCase("vi"));
  return likely ? { kind: "LIKELY_DUPLICATE", matchedId: likely.id } : { kind: "NOT_DUPLICATE" };
}
