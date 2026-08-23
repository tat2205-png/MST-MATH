import type { SceneGraph } from "../../core/scene-graph/index.ts";

export interface ImageUnderstandingRequest {
  readonly id: string;
  readonly image: {
    readonly source: string;
    readonly mediaType?: string;
  };
  readonly context?: Readonly<Record<string, unknown>>;
}

export interface SceneGraphCandidateInput {
  readonly graph: SceneGraph;
  readonly confidence?: number;
  readonly rationale?: string;
}

export interface ImageUnderstandingProvider {
  readonly id: string;
  propose(request: ImageUnderstandingRequest): Promise<readonly SceneGraphCandidateInput[]>;
}

export type CandidateReviewStatus = "proposed" | "approved" | "rejected";

export interface HumanApproval {
  readonly actorType: "human";
  readonly actorId: string;
  readonly approvedAt: string;
}

export interface SceneGraphCandidate {
  readonly id: string;
  readonly providerId: string;
  readonly graph: SceneGraph;
  readonly confidence?: number;
  readonly rationale?: string;
  readonly status: CandidateReviewStatus;
  readonly approval?: HumanApproval;
}

export interface SceneGraphReview {
  readonly requestId: string;
  readonly candidates: readonly SceneGraphCandidate[];
  readonly approvedCandidateId?: string;
}
