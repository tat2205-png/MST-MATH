import assert from "node:assert/strict";
import {
  createOfflineDepthProvider,
  type DepthProvider,
} from "../../adapters/depth/index.ts";
import {
  createSceneGraph,
  createSceneNode,
  serializeSceneGraph,
} from "../../core/scene-graph/index.ts";
import {
  probeDepthRuntime,
  runDepthRuntime,
} from "../../runtime/depth/index.ts";

const geometry = createSceneGraph([
  createSceneNode({
    identity: { id: "foreground" },
    geometry: { kind: "circle", center: { x: 2, y: 3 }, radius: 1 },
    placement: { layer: 3, order: 0 },
    metadata: { geometryLocked: true },
  }),
  createSceneNode({
    identity: { id: "background" },
    geometry: { kind: "image_layer", position: { x: 0, y: 0 }, width: 2, height: 2, source: "fixture://depth" },
    placement: { layer: 1, order: 0 },
  }),
]);
const geometryBefore = serializeSceneGraph(geometry);
const provider = createOfflineDepthProvider("fixture-depth", {
  runtime: "deterministic-depth-fixture-v1",
  width: 2,
  height: 2,
  values: [0, 0.25, 0.75, 1],
  confidence: 0.9,
  model: "fixture-model",
});
const request = {
  provider,
  request: {
    id: "depth-runtime-request",
    image: { source: "fixture://depth", width: 2, height: 2, mediaType: "image/png" },
  },
  sceneId: "depth-runtime-scene",
  exactGeometry: geometry,
  motion: {
    layerDepths: [{ layer: 3, depth: 0.25 }, { layer: 1, depth: 0.75 }],
    parallaxStrength: 2,
    separation: 4,
    camera: { deltaX: 10, deltaY: -6, zoom: 1.2 },
    objectPlanes: [
      { nodeId: "foreground", depthOffset: 0.1, translateX: 2, translateY: -1, scale: 1.1 },
      { nodeId: "background" },
    ],
  },
} as const;

const first = await runDepthRuntime(request);
const second = await runDepthRuntime(request);
assert.deepEqual(first, second, "depth runtime plans must be deterministic");
assert.equal(first.status, "COMPLETED");
if (first.status !== "COMPLETED") throw new Error("Expected deterministic depth runtime completion.");
assert.equal(first.capability.status, "AVAILABLE");
assert.equal(first.plan.scene.estimatedDepth?.provenance.groundTruth, false);
assert.deepEqual(first.plan.layers, [
  { layer: 1, depth: 0.75, separatedDepth: 3, parallaxX: -15, parallaxY: 9 },
  { layer: 3, depth: 0.25, separatedDepth: 1, parallaxX: -5, parallaxY: 3 },
]);
assert.deepEqual(first.plan.objectPlanes, [
  { nodeId: "background", depthOffset: 0, translateX: 0, translateY: 0, scale: 1 },
  { nodeId: "foreground", depthOffset: 0.1, translateX: 2, translateY: -1, scale: 1.1 },
]);
assert.equal(serializeSceneGraph(first.plan.scene.exactGeometry), geometryBefore);
assert.equal(serializeSceneGraph(geometry), geometryBefore, "depth motion must never rewrite exact geometry");
assert.notStrictEqual(first.plan.scene.sourceImage, first.plan.scene.estimatedDepth);
assert.notStrictEqual(first.plan.scene.exactGeometry, first.plan.scene.estimatedDepth);

let unavailableEstimateCalls = 0;
const unavailableProvider: DepthProvider = {
  id: "missing-depth-runtime",
  runtimeStatus() {
    return { available: false, runtime: "optional-depth-model", reason: "Model weights are unavailable." };
  },
  async estimate() {
    unavailableEstimateCalls += 1;
    return { width: 2, height: 2, values: [0, 0, 0, 0] };
  },
};
const skipped = await runDepthRuntime({ ...request, provider: unavailableProvider });
assert.equal(skipped.status, "SKIPPED");
assert.equal(skipped.capability.status, "NOT_AVAILABLE");
assert.equal(unavailableEstimateCalls, 0, "an unavailable depth runtime must never execute");

const failedProbeProvider: DepthProvider = {
  id: "failed-depth-probe",
  runtimeStatus() {
    throw new Error("depth executable missing");
  },
  async estimate() {
    throw new Error("estimate must not run after failed probe");
  },
};
const failedProbe = await probeDepthRuntime(failedProbeProvider);
assert.equal(failedProbe.status, "NOT_TESTED");
assert.match(failedProbe.reason ?? "", /depth executable missing/);
assert.equal((await runDepthRuntime({ ...request, provider: failedProbeProvider })).status, "SKIPPED");

await assert.rejects(
  () => runDepthRuntime({
    ...request,
    motion: { ...request.motion, layerDepths: [{ layer: 1, depth: 1.1 }] },
  }),
  /between 0 and 1/,
);
await assert.rejects(
  () => runDepthRuntime({
    ...request,
    motion: { ...request.motion, objectPlanes: [{ nodeId: "missing" }] },
  }),
  /does not exist/,
);
await assert.rejects(
  () => runDepthRuntime({
    ...request,
    motion: { ...request.motion, layerDepths: [{ layer: 1, depth: 0.2 }, { layer: 1, depth: 0.4 }] },
  }),
  /Duplicate depth layer/,
);

console.log("Depth runtime tests: PASS");
