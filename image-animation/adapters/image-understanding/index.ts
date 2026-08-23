import {
  deserializeSceneGraph,
  serializeSceneGraph,
  type SceneGraph,
} from "../../core/scene-graph/index.ts";
import type {
  HumanApproval,
  ImageUnderstandingProvider,
  ImageUnderstandingRequest,
  SceneGraphCandidate,
  SceneGraphCandidateInput,
  SceneGraphReview,
} from "./types.ts";

export * from "./types.ts";

function requireNonEmpty(value: string, name: string): void {
  if (value.trim().length === 0) throw new TypeError(`${name} must be a non-empty string.`);
}

function normalizeCandidate(
  input: SceneGraphCandidateInput,
  providerId: string,
  requestId: string,
  index: number,
): SceneGraphCandidate {
  if (input.confidence !== undefined &&
      (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1)) {
    throw new TypeError(`Candidate ${index + 1} confidence must be between 0 and 1.`);
  }
  if (input.rationale !== undefined && typeof input.rationale !== "string") {
    throw new TypeError(`Candidate ${index + 1} rationale must be a string.`);
  }

  // Canonical round-tripping validates and defensively copies provider-owned output.
  const graph = deserializeSceneGraph(serializeSceneGraph(input.graph));
  return Object.freeze({
    id: `${requestId}:candidate:${index + 1}`,
    providerId,
    graph,
    ...(input.confidence === undefined ? {} : { confidence: input.confidence }),
    ...(input.rationale === undefined ? {} : { rationale: input.rationale }),
    status: "proposed" as const,
  });
}

function freezeReview(
  requestId: string,
  candidates: readonly SceneGraphCandidate[],
  approvedCandidateId?: string,
): SceneGraphReview {
  return Object.freeze({
    requestId,
    candidates: Object.freeze([...candidates]),
    ...(approvedCandidateId === undefined ? {} : { approvedCandidateId }),
  });
}

export async function requestSceneGraphProposals(
  provider: ImageUnderstandingProvider,
  request: ImageUnderstandingRequest,
): Promise<SceneGraphReview> {
  requireNonEmpty(provider.id, "Provider ID");
  requireNonEmpty(request.id, "Request ID");
  requireNonEmpty(request.image.source, "Image source");

  const output = await provider.propose(request);
  if (!Array.isArray(output)) throw new TypeError("Image-understanding provider must return an array of candidates.");

  const candidates = output.map((candidate, index) =>
    normalizeCandidate(candidate, provider.id, request.id, index));
  return freezeReview(request.id, candidates);
}

function validateApproval(approval: HumanApproval): void {
  if (approval.actorType !== "human") {
    throw new TypeError("Scene Graph candidates may only be approved by a human actor.");
  }
  requireNonEmpty(approval.actorId, "Approval actor ID");
  requireNonEmpty(approval.approvedAt, "Approval timestamp");
}

export function approveSceneGraphCandidate(
  review: SceneGraphReview,
  candidateId: string,
  approval: HumanApproval,
): SceneGraphReview {
  validateApproval(approval);
  if (!review.candidates.some((candidate) => candidate.id === candidateId)) {
    throw new RangeError(`Unknown Scene Graph candidate: ${candidateId}`);
  }

  const candidates = review.candidates.map((candidate): SceneGraphCandidate => {
    if (candidate.id === candidateId) {
      return Object.freeze({ ...candidate, status: "approved" as const, approval: Object.freeze({ ...approval }) });
    }
    if (candidate.status !== "approved") return candidate;
    const { approval: _approval, ...rest } = candidate;
    return Object.freeze({ ...rest, status: "proposed" as const });
  });
  return freezeReview(review.requestId, candidates, candidateId);
}

export function rejectSceneGraphCandidate(
  review: SceneGraphReview,
  candidateId: string,
): SceneGraphReview {
  if (!review.candidates.some((candidate) => candidate.id === candidateId)) {
    throw new RangeError(`Unknown Scene Graph candidate: ${candidateId}`);
  }

  const candidates = review.candidates.map((candidate): SceneGraphCandidate => {
    if (candidate.id !== candidateId) return candidate;
    const { approval: _approval, ...rest } = candidate;
    return Object.freeze({ ...rest, status: "rejected" as const });
  });
  return freezeReview(
    review.requestId,
    candidates,
    review.approvedCandidateId === candidateId ? undefined : review.approvedCandidateId,
  );
}

export function getApprovedSceneGraph(review: SceneGraphReview): SceneGraph | undefined {
  if (review.approvedCandidateId === undefined) return undefined;
  return review.candidates.find((candidate) =>
    candidate.id === review.approvedCandidateId && candidate.status === "approved")?.graph;
}
