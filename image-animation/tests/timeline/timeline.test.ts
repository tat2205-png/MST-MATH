import assert from "node:assert/strict";
import { createSceneGraph, createSceneNode } from "../../core/scene-graph/index.ts";
import {
  assertValidAnimationTimeline,
  createAnimationTimeline,
  deserializeAnimationTimeline,
  serializeAnimationTimeline,
  validateAnimationTimeline,
  type AnimationEvent,
  type AnimationTimeline,
} from "../../core/timeline/index.ts";

const graph = createSceneGraph([
  createSceneNode({ identity: { id: "point-a" }, geometry: { kind: "point", x: 0, y: 0 } }),
  createSceneNode({
    identity: { id: "segment-ab" },
    geometry: { kind: "segment", start: { x: 0, y: 0 }, end: { x: 2, y: 0 } },
  }),
]);

const events: readonly AnimationEvent[] = [
  { id: "appear-a", type: "appear", targetId: "point-a", start: 0, duration: 0.25 },
  { id: "move-a", type: "move", targetId: "point-a", start: 0.25, duration: 1, to: { x: 2, y: 3 } },
  { id: "highlight-a", type: "highlight", targetId: "point-a", start: 0.25, duration: 1, color: "#ff0" },
  { id: "draw-ab", type: "draw", targetId: "segment-ab", start: 0.5, duration: 1 },
  { id: "fade-ab", type: "fade", targetId: "segment-ab", start: 1.5, duration: 0.5, from: 1, to: 0.4 },
  { id: "scale-a", type: "scale", targetId: "point-a", start: 2, duration: 0.5, from: 1, to: 1.5 },
  { id: "focus-a", type: "camera_focus", targetId: "point-a", start: 2.5, duration: 0.5, zoom: 2, padding: 12 },
  { id: "disappear-a", type: "disappear", targetId: "point-a", start: 3, duration: 0.25 },
];

const timeline = createAnimationTimeline(events, graph, { title: "proof" });
assert.equal(validateAnimationTimeline(timeline, { sceneGraph: graph }).valid, true);
assert.doesNotThrow(() => assertValidAnimationTimeline(timeline, { sceneGraph: graph }));
assert.deepEqual(timeline.events.map((event) => event.type), [
  "appear",
  "move",
  "highlight",
  "draw",
  "fade",
  "scale",
  "camera_focus",
  "disappear",
]);

const serialized = serializeAnimationTimeline(timeline, graph);
assert.equal(serializeAnimationTimeline(deserializeAnimationTimeline(serialized, graph), graph), serialized);

const missingReference: AnimationTimeline = {
  version: 1,
  metadata: {},
  events: [{ id: "missing", type: "appear", targetId: "not-in-graph", start: 0, duration: 1 }],
};
assert.ok(
  validateAnimationTimeline(missingReference, { sceneGraph: graph }).issues.some(
    (issue) => issue.code === "MISSING_REFERENCE",
  ),
);

const negativeDuration: AnimationTimeline = {
  version: 1,
  metadata: {},
  events: [{ id: "negative", type: "draw", targetId: "segment-ab", start: 0, duration: -1 }],
};
assert.ok(
  validateAnimationTimeline(negativeDuration, { sceneGraph: graph }).issues.some(
    (issue) => issue.code === "NEGATIVE_DURATION",
  ),
);

const badlyOrdered: AnimationTimeline = {
  version: 1,
  metadata: {},
  events: [
    { id: "later", type: "draw", targetId: "segment-ab", start: 2, duration: 1 },
    { id: "earlier", type: "highlight", targetId: "segment-ab", start: 1, duration: 1, color: "red" },
  ],
};
assert.ok(
  validateAnimationTimeline(badlyOrdered, { sceneGraph: graph }).issues.some(
    (issue) => issue.code === "BAD_ORDERING",
  ),
);

const conflict: AnimationTimeline = {
  version: 1,
  metadata: {},
  events: [
    { id: "fade-one", type: "fade", targetId: "point-a", start: 0, duration: 2, from: 0, to: 1 },
    { id: "hide", type: "disappear", targetId: "point-a", start: 1, duration: 1, },
  ],
};
assert.ok(
  validateAnimationTimeline(conflict, { sceneGraph: graph }).issues.some(
    (issue) => issue.code === "EVENT_CONFLICT",
  ),
);
assert.throws(
  () => createAnimationTimeline(conflict.events, graph),
  /EVENT_CONFLICT/,
);

const touching: AnimationTimeline = {
  version: 1,
  metadata: {},
  events: [
    { id: "show", type: "appear", targetId: "point-a", start: 0, duration: 1 },
    { id: "fade", type: "fade", targetId: "point-a", start: 1, duration: 1, from: 1, to: 0.5 },
  ],
};
assert.equal(
  validateAnimationTimeline(touching, { sceneGraph: graph }).valid,
  true,
  "events touching at an endpoint do not overlap",
);

const independentChannels: AnimationTimeline = {
  version: 1,
  metadata: {},
  events: [
    { id: "move", type: "move", targetId: "point-a", start: 0, duration: 2, to: { x: 4, y: 5 } },
    { id: "highlight", type: "highlight", targetId: "point-a", start: 0, duration: 2, color: "yellow" },
  ],
};
assert.equal(
  validateAnimationTimeline(independentChannels, { sceneGraph: graph }).valid,
  true,
  "independent animation channels may run concurrently",
);

const invalidPayload = {
  version: 1,
  metadata: {},
  events: [
    { id: "bad-fade", type: "fade", targetId: "point-a", start: 0, duration: 1, from: -1, to: 2 },
    { id: "bad-scale", type: "scale", targetId: "point-a", start: 1, duration: 1, to: 0 },
    { id: "bad-camera", type: "camera_focus", targetId: "point-a", start: 2, duration: 1, zoom: 0 },
  ],
};
const invalidCodes = new Set(
  validateAnimationTimeline(invalidPayload, { sceneGraph: graph }).issues.map((issue) => issue.code),
);
for (const code of ["INVALID_OPACITY", "INVALID_SCALE", "INVALID_CAMERA_ZOOM"]) {
  assert.ok(invalidCodes.has(code), `expected validation code ${code}`);
}

const duplicateIds: AnimationTimeline = {
  version: 1,
  metadata: {},
  events: [
    { id: "same", type: "appear", targetId: "point-a", start: 0, duration: 0 },
    { id: "same", type: "draw", targetId: "segment-ab", start: 0, duration: 0 },
  ],
};
assert.ok(
  validateAnimationTimeline(duplicateIds, { sceneGraph: graph }).issues.some(
    (issue) => issue.code === "DUPLICATE_EVENT_ID",
  ),
);

const firstEvidence = validateAnimationTimeline(conflict, { sceneGraph: graph }).issues;
const secondEvidence = validateAnimationTimeline(conflict, { sceneGraph: graph }).issues;
assert.deepEqual(firstEvidence, secondEvidence, "validation evidence is deterministic");
assert.deepEqual(
  firstEvidence.map((issue) => issue.path),
  [...firstEvidence].map((issue) => issue.path).sort(),
  "validation evidence is ordered by path",
);

console.log("Animation Timeline tests: PASS");
