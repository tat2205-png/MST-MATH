import assert from "node:assert/strict";
import { createSceneGraph, createSceneNode, serializeSceneGraph } from "../../core/scene-graph/index.ts";
import {
  createEstimatedDepthMap,
  createOfflineDepthProvider,
  requestEstimatedDepth,
  type DepthProvider,
} from "../../adapters/depth/index.ts";
import {
  createTwoPointFiveDScene,
  routeTwoPointFiveDRenderer,
  type TwoPointFiveDRenderer,
} from "../../renderers/two-point-five-d/index.ts";

const sourceImage = {
  source: "fixtures/triangle.png",
  width: 2,
  height: 2,
  mediaType: "image/png",
};
const geometry = createSceneGraph([
  createSceneNode({
    identity: { id: "triangle" },
    geometry: {
      kind: "polygon",
      points: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 2 }],
    },
    placement: { layer: 1, order: 0 },
  }),
]);
const serializedGeometry = serializeSceneGraph(geometry);
const provider = createOfflineDepthProvider("offline-depth", {
  runtime: "fixture-runtime",
  width: 2,
  height: 2,
  values: [0, 0.25, 0.5, 1],
  confidence: 0.8,
  model: "fixture-v1",
});

const request = { id: "depth-request", image: sourceImage };
const first = await requestEstimatedDepth(provider, request);
const second = await requestEstimatedDepth(provider, request);
assert.deepEqual(first, second, "offline estimated depth is deterministic");
assert.equal(first.status, "available");
if (first.status !== "available") throw new Error("Expected fixture depth to be available.");
assert.deepEqual(first.sourceImage, sourceImage);
assert.deepEqual(first.estimatedDepth.provenance, {
  kind: "estimated",
  groundTruth: false,
  providerId: "offline-depth",
  model: "fixture-v1",
});
assert.equal(first.estimatedDepth.kind, "estimated-depth");
assert.notStrictEqual(first.sourceImage, sourceImage, "source image is defensively copied");

const scene = createTwoPointFiveDScene({
  id: "scene-1",
  sourceImage,
  exactGeometry: geometry,
  estimatedDepth: first.estimatedDepth,
});
assert.deepEqual(scene.sourceImage, sourceImage);
assert.equal(serializeSceneGraph(scene.exactGeometry), serializedGeometry);
assert.deepEqual(scene.estimatedDepth?.values, [0, 0.25, 0.5, 1]);
assert.notStrictEqual(scene.sourceImage, scene.estimatedDepth, "source pixels and estimated depth remain distinct");
assert.notStrictEqual(scene.exactGeometry, scene.estimatedDepth, "exact geometry and estimated depth remain distinct");
assert.equal(serializeSceneGraph(geometry), serializedGeometry, "2.5D construction does not alter exact geometry");

const renderers: TwoPointFiveDRenderer[] = [
  { id: "z-depth", modes: ["estimated-depth"] },
  { id: "geometry", modes: ["exact-geometry"] },
  { id: "a-depth", modes: ["estimated-depth", "source-image"] },
];
assert.deepEqual(routeTwoPointFiveDRenderer(scene, renderers), {
  rendererId: "a-depth",
  mode: "estimated-depth",
  reason: "canonical",
});
assert.deepEqual(routeTwoPointFiveDRenderer(scene, [...renderers].reverse()), {
  rendererId: "a-depth",
  mode: "estimated-depth",
  reason: "canonical",
}, "renderer input order cannot affect routing");
assert.deepEqual(routeTwoPointFiveDRenderer(scene, renderers, { preferredRendererId: "z-depth" }), {
  rendererId: "z-depth",
  mode: "estimated-depth",
  reason: "preferred",
});
assert.deepEqual(routeTwoPointFiveDRenderer(scene, renderers, { mode: "exact-geometry" }), {
  rendererId: "geometry",
  mode: "exact-geometry",
  reason: "canonical",
});

const geometryOnly = createTwoPointFiveDScene({
  id: "geometry-only",
  sourceImage,
  exactGeometry: geometry,
});
assert.deepEqual(routeTwoPointFiveDRenderer(geometryOnly, renderers), {
  rendererId: "geometry",
  mode: "exact-geometry",
  reason: "canonical",
});
assert.throws(
  () => routeTwoPointFiveDRenderer(geometryOnly, renderers, { mode: "estimated-depth" }),
  /requires an estimated depth map/,
);

const imageOnly = createTwoPointFiveDScene({
  id: "image-only",
  sourceImage,
  exactGeometry: createSceneGraph([]),
});
assert.deepEqual(routeTwoPointFiveDRenderer(imageOnly, renderers), {
  rendererId: "a-depth",
  mode: "source-image",
  reason: "canonical",
});

assert.throws(
  () => createEstimatedDepthMap("provider", { width: 2, height: 2, values: [0, 1, 0] }),
  /exactly width times height/,
);
assert.throws(
  () => createEstimatedDepthMap("provider", { width: 1, height: 1, values: [1.1] }),
  /between 0 and 1/,
);
assert.throws(
  () => createTwoPointFiveDScene({
    id: "mismatch",
    sourceImage,
    exactGeometry: geometry,
    estimatedDepth: createEstimatedDepthMap("provider", { width: 1, height: 1, values: [0.5] }),
  }),
  /dimensions must match/,
);
assert.throws(
  () => createTwoPointFiveDScene({
    id: "false-ground-truth",
    sourceImage,
    exactGeometry: geometry,
    estimatedDepth: {
      ...first.estimatedDepth,
      provenance: { ...first.estimatedDepth.provenance, groundTruth: true },
    } as never,
  }),
  /never as ground truth/,
);
assert.throws(
  () => routeTwoPointFiveDRenderer(scene, [
    { id: "duplicate", modes: ["estimated-depth"] },
    { id: "duplicate", modes: ["estimated-depth"] },
  ]),
  /Duplicate 2.5D renderer ID/,
);

let estimateCalled = false;
const unavailableProvider: DepthProvider = {
  id: "unavailable",
  runtimeStatus() {
    return { available: false, runtime: "local-model", reason: "Weights are not installed." };
  },
  async estimate() {
    estimateCalled = true;
    return { width: 2, height: 2, values: [0, 0, 0, 0] };
  },
};
assert.deepEqual(await requestEstimatedDepth(unavailableProvider, request), {
  status: "unavailable",
  requestId: "depth-request",
  providerId: "unavailable",
  runtime: "local-model",
  reason: "Weights are not installed.",
  sourceImage,
});
assert.equal(estimateCalled, false, "unavailable providers are never invoked");

const wrongDimensions = createOfflineDepthProvider("wrong-size", {
  width: 1,
  height: 1,
  values: [0.5],
});
await assert.rejects(requestEstimatedDepth(wrongDimensions, request), /dimensions must match/);

console.log("Depth and 2.5D tests: PASS");
