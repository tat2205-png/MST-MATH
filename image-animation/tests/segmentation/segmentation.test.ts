import assert from "node:assert/strict";
import { createSceneGraph, createSceneNode, serializeSceneGraph } from "../../core/scene-graph/index.ts";
import {
  attachSegmentation,
  createOfflineSegmentationProvider,
  requestSegmentation,
  type SegmentationProvider,
} from "../../adapters/segmentation/index.ts";

const graph = createSceneGraph([
  createSceneNode({
    identity: { id: "triangle" },
    geometry: {
      kind: "polygon",
      points: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 3 }],
    },
    placement: { layer: 2, order: 0 },
  }),
  createSceneNode({
    identity: { id: "caption" },
    geometry: { kind: "label", position: { x: 1, y: 1 }, text: "ABC" },
    placement: { layer: 3, order: 0 },
  }),
]);
const serializedGeometry = serializeSceneGraph(graph);

const fixtureProvider = createOfflineSegmentationProvider("offline-test", {
  attachments: [
    {
      id: "triangle-mask",
      target: { kind: "object", nodeId: "triangle" },
      mask: { encoding: "binary-rle", width: 4, height: 2, startsWith: 0, runs: [1, 3, 2, 2] },
      label: "triangle",
      confidence: 1,
    },
    {
      id: "labels-layer-mask",
      target: { kind: "layer", layer: 3 },
      mask: { encoding: "binary-rle", width: 2, height: 2, startsWith: 1, runs: [4] },
    },
  ],
});

const request = {
  id: "segmentation-request-1",
  image: { source: "fixtures/diagram.png", mediaType: "image/png" },
  sceneGraph: graph,
};
const first = await requestSegmentation(fixtureProvider, request);
const second = await requestSegmentation(fixtureProvider, request);
assert.deepEqual(first, second, "offline fixture output is deterministic");
assert.equal(first.status, "available");
if (first.status === "available") {
  assert.equal(first.runtime, "offline-fixture");
  assert.deepEqual(first.output.attachments.map((item) => item.providerId), ["offline-test", "offline-test"]);
  assert.deepEqual(first.output.attachments[0].target, { kind: "object", nodeId: "triangle" });
  assert.deepEqual(first.output.attachments[1].target, { kind: "layer", layer: 3 });
  assert.equal(serializeSceneGraph(first.output.sceneGraph), serializedGeometry);
}
assert.equal(serializeSceneGraph(graph), serializedGeometry, "segmentation does not redefine Scene Graph geometry");

let unavailableSegmentCalled = false;
const unavailableProvider: SegmentationProvider = {
  id: "model-runtime",
  runtimeStatus() {
    return {
      available: false,
      runtime: "local-segmentation-model",
      reason: "Model weights are not installed.",
    };
  },
  async segment() {
    unavailableSegmentCalled = true;
    return [];
  },
};
const unavailable = await requestSegmentation(unavailableProvider, request);
assert.deepEqual(unavailable, {
  status: "unavailable",
  requestId: "segmentation-request-1",
  providerId: "model-runtime",
  runtime: "local-segmentation-model",
  reason: "Model weights are not installed.",
});
assert.equal(unavailableSegmentCalled, false, "an unavailable runtime is reported without invoking the model");

const mutatingProvider: SegmentationProvider = {
  id: "isolated-provider",
  runtimeStatus() {
    return { available: true, runtime: "test-runtime" };
  },
  async segment(providerRequest) {
    const mutable = providerRequest.sceneGraph.nodes[0].geometry as { kind: "polygon"; points: Array<{ x: number; y: number }> };
    mutable.points[0].x = 999;
    return [{
      id: "isolated-mask",
      target: { kind: "object", nodeId: "triangle" },
      mask: { encoding: "binary-rle", width: 1, height: 1, startsWith: 1, runs: [1] },
    }];
  },
};
const isolated = await requestSegmentation(mutatingProvider, request);
assert.equal(serializeSceneGraph(graph), serializedGeometry, "provider mutations are isolated from locked input geometry");
assert.equal(isolated.status, "available");
if (isolated.status === "available") {
  assert.equal(
    serializeSceneGraph(isolated.output.sceneGraph),
    serializedGeometry,
    "provider mutations cannot redefine returned Scene Graph geometry",
  );
}

assert.throws(
  () => attachSegmentation(graph, "fixture", [{
    id: "missing-object",
    target: { kind: "object", nodeId: "missing" },
    mask: { encoding: "binary-rle", width: 1, height: 1, startsWith: 0, runs: [1] },
  }]),
  /target node does not exist/,
);
assert.throws(
  () => attachSegmentation(graph, "fixture", [{
    id: "missing-layer",
    target: { kind: "layer", layer: 99 },
    mask: { encoding: "binary-rle", width: 1, height: 1, startsWith: 0, runs: [1] },
  }]),
  /target layer does not exist/,
);
assert.throws(
  () => attachSegmentation(graph, "fixture", [{
    id: "invalid-mask",
    target: { kind: "object", nodeId: "triangle" },
    mask: { encoding: "binary-rle", width: 2, height: 2, startsWith: 0, runs: [3] },
  }]),
  /cover exactly width times height pixels/,
);
assert.throws(
  () => attachSegmentation(graph, "fixture", [
    {
      id: "duplicate",
      target: { kind: "object", nodeId: "triangle" },
      mask: { encoding: "binary-rle", width: 1, height: 1, startsWith: 1, runs: [1] },
    },
    {
      id: "duplicate",
      target: { kind: "layer", layer: 2 },
      mask: { encoding: "binary-rle", width: 1, height: 1, startsWith: 1, runs: [1] },
    },
  ]),
  /Duplicate segmentation attachment ID/,
);

const dishonestStatusProvider: SegmentationProvider = {
  id: "invalid-runtime-status",
  runtimeStatus() {
    return { available: false, runtime: "model", reason: "" };
  },
  async segment() {
    return [];
  },
};
await assert.rejects(
  requestSegmentation(dishonestStatusProvider, request),
  /Unavailable runtime reason must be a non-empty string/,
);

console.log("Segmentation tests: PASS");
