export type BoundaryState = "CONFIRMED" | "REVIEW" | "REJECTED_FALSE" | "MERGE_PREVIOUS" | "MERGE_NEXT";
export interface CandidateState { candidateId: string; state: BoundaryState; decisionSource: string; provenance?: unknown; }
export interface ComposedBoundaryState { candidates: CandidateState[]; counts: Record<BoundaryState, number>; invariants: { total: boolean; noBaseConfirmedLost: boolean; noNewReview: boolean; noDuplicate: boolean; noCandidateLost: boolean; reviewPartition: boolean }; }
export function composeBoundaryState(base: CandidateState[], reviewIds: Set<string>, decisions: Map<string, CandidateState>): ComposedBoundaryState {
  const ids = new Set(base.map(x => x.candidateId));
  const baseReview = new Set(base.filter(x => x.state === "REVIEW").map(x => x.candidateId));
  if (reviewIds.size !== baseReview.size || [...reviewIds].some(id => !baseReview.has(id))) throw new Error("REVIEW_PARTITION_INVALID");
  for (const [id, decision] of decisions) if (!reviewIds.has(id) || decision.candidateId !== id) throw new Error(`ADJUDICATION_OUTSIDE_BASE_REVIEW:${id}`);
  const output = base.map(x => reviewIds.has(x.candidateId) ? decisions.get(x.candidateId) ?? x : x);
  const counts = { CONFIRMED: 0, REVIEW: 0, REJECTED_FALSE: 0, MERGE_PREVIOUS: 0, MERGE_NEXT: 0 } as Record<BoundaryState, number>;
  output.forEach(x => counts[x.state]++);
  const baseConfirmed = new Set(base.filter(x => x.state === "CONFIRMED").map(x => x.candidateId));
  const decisionIds = new Set(decisions.keys());
  return { candidates: output, counts, invariants: { total: output.length === base.length, noBaseConfirmedLost: [...baseConfirmed].every(id => output.find(x => x.candidateId === id)?.state === "CONFIRMED"), noNewReview: output.filter(x => x.state === "REVIEW").every(x => baseReview.has(x.candidateId)), noDuplicate: output.length === new Set(output.map(x => x.candidateId)).size, noCandidateLost: [...ids].every(id => output.some(x => x.candidateId === id)), reviewPartition: [...decisionIds].every(id => baseReview.has(id)) } };
}
