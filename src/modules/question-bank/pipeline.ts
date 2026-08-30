import { parseDocx } from "./document.js"; import { normalizeCandidate } from "./extraction.js"; import { associateFigures } from "./figures.js"; import { segmentQuestions } from "./segmentation.js";
import { deriveBrowserSafeFigures } from "./wmf.js";
import type { DocumentIR, DocumentQuestionCandidate } from "./types.js";
export function canonicalizeCompositeAnchors(candidate: DocumentQuestionCandidate, document: DocumentIR): DocumentQuestionCandidate {
  const composites = candidate.figureAnchors.map((id) => document.figures.find((f) => f.id === id)).filter((f) => f?.componentIds?.length);
  const discarded = new Set<string>();
  for (const left of composites) for (const right of composites) {
    if (left === right) continue;
    const shared = left!.componentIds!.filter((id) => right!.componentIds!.includes(id));
    const sourceIdentityMatch = shared.length / Math.min(left!.componentIds!.length, right!.componentIds!.length) >= 0.9;
    if (sourceIdentityMatch) {
    const loser = left!.componentIds!.length < right!.componentIds!.length ? left! : right!; discarded.add(loser.id);
    }
  }
  return discarded.size ? { ...candidate, figureAnchors: candidate.figureAnchors.filter((id) => !discarded.has(id)), parseWarnings: [...candidate.parseWarnings, "OVERLAPPING_VML_GROUP_DEDUPLICATED"] } : candidate;
}
function finish(document: DocumentIR) { const candidates = segmentQuestions(document).map((c) => canonicalizeCompositeAnchors(c, document)); const questions = candidates.map((c) => normalizeCandidate(c, document)); const figureAssociations = associateFigures(document, questions); return { document, candidates, questions, figureAssociations, warnings: [...document.warnings, ...candidates.flatMap((c) => c.parseWarnings)] }; }
export function ingestDocxQuestions(bytes: Uint8Array, name: string) { return finish(parseDocx(bytes, name)); }
export async function ingestDocxQuestionsForRuntime(bytes: Uint8Array, name: string) { return finish(await deriveBrowserSafeFigures(parseDocx(bytes, name, { canonicalVml: true }))); }
