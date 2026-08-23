import assert from "node:assert/strict";
import { createSceneGraph, createSceneNode } from "../../core/scene-graph/index.ts";
import {
  approveSceneGraphCandidate,
  getApprovedSceneGraph,
  rejectSceneGraphCandidate,
  requestSceneGraphProposals,
  type ImageUnderstandingProvider,
} from "../../adapters/image-understanding/index.ts";

const pointGraph = createSceneGraph([
  createSceneNode({ identity: { id: "point-a" }, geometry: { kind: "point", x: 10, y: 20 } }),
]);
const circleGraph = createSceneGraph([
  createSceneNode({ identity: { id: "circle-a" }, geometry: { kind: "circle", center: { x: 5, y: 5 }, radius: 3 } }),
]);

const firstProvider: ImageUnderstandingProvider = {
  id: "fixture-local-a",
  async propose() {
    return [
      { graph: pointGraph, confidence: 0.75, rationale: "Detected a point." },
      { graph: circleGraph, confidence: 0.6 },
    ];
  },
};

const review = await requestSceneGraphProposals(firstProvider, {
  id: "request-1",
  image: { source: "fixture.png", mediaType: "image/png" },
});
assert.deepEqual(review.candidates.map((candidate) => candidate.status), ["proposed", "proposed"]);
assert.deepEqual(review.candidates.map((candidate) => candidate.providerId), ["fixture-local-a", "fixture-local-a"]);
assert.equal(review.approvedCandidateId, undefined);
assert.equal(getApprovedSceneGraph(review), undefined, "AI output is unavailable as approved geometry before review");

const approval = { actorType: "human" as const, actorId: "reviewer-1", approvedAt: "2026-08-23T09:00:00.000Z" };
const approved = approveSceneGraphCandidate(review, "request-1:candidate:2", approval);
assert.equal(approved.approvedCandidateId, "request-1:candidate:2");
assert.equal(approved.candidates[1].status, "approved");
assert.deepEqual(approved.candidates[1].approval, approval);
assert.deepEqual(getApprovedSceneGraph(approved), circleGraph);
assert.equal(review.candidates[1].status, "proposed", "review transitions do not mutate prior state");

const switched = approveSceneGraphCandidate(approved, "request-1:candidate:1", approval);
assert.equal(switched.candidates[0].status, "approved");
assert.equal(switched.candidates[1].status, "proposed", "only one candidate is approved at a time");
assert.equal(switched.candidates[1].approval, undefined);

const rejected = rejectSceneGraphCandidate(switched, "request-1:candidate:1");
assert.equal(rejected.candidates[0].status, "rejected");
assert.equal(rejected.approvedCandidateId, undefined);
assert.equal(getApprovedSceneGraph(rejected), undefined);

assert.throws(
  () => approveSceneGraphCandidate(review, "missing", approval),
  /Unknown Scene Graph candidate/,
);
assert.throws(
  () => approveSceneGraphCandidate(review, review.candidates[0].id, {
    actorType: "ai",
    actorId: "model",
    approvedAt: "2026-08-23T09:00:00.000Z",
  } as never),
  /only be approved by a human/,
);

const secondProvider: ImageUnderstandingProvider = {
  id: "fixture-local-b",
  async propose() {
    return [{ graph: circleGraph }];
  },
};
const alternateReview = await requestSceneGraphProposals(secondProvider, {
  id: "request-2",
  image: { source: "fixture.png" },
});
assert.equal(alternateReview.candidates[0].providerId, "fixture-local-b", "providers are replaceable through the interface");
assert.equal(alternateReview.candidates[0].status, "proposed");

const invalidConfidenceProvider: ImageUnderstandingProvider = {
  id: "fixture-invalid-confidence",
  async propose() {
    return [{ graph: pointGraph, confidence: 2 }];
  },
};
await assert.rejects(
  requestSceneGraphProposals(invalidConfidenceProvider, {
    id: "request-3",
    image: { source: "fixture.png" },
  }),
  /confidence must be between 0 and 1/,
);

const invalidGraphProvider: ImageUnderstandingProvider = {
  id: "fixture-invalid-graph",
  async propose() {
    return [{ graph: { version: 1, nodes: [], metadata: { invalid: Number.NaN } } as never }];
  },
};
await assert.rejects(
  requestSceneGraphProposals(invalidGraphProvider, {
    id: "request-4",
    image: { source: "fixture.png" },
  }),
  /INVALID_METADATA/,
);

console.log("Image understanding tests: PASS");
