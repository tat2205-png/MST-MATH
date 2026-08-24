import assert from "node:assert/strict";
import {
  createOfflineSegmentationProvider,
  requestSegmentation,
  type SegmentationProvider,
} from "../../adapters/segmentation/index.ts";
import {
  probeSegmentationRuntime,
  runSegmentationSmoke,
} from "../../runtime/segmentation/index.ts";
import {
  createSceneGraph,
  serializeSceneGraph,
  type SceneGraph,
} from "../../core/scene-graph/index.ts";

function fixtureGraph(): SceneGraph {
  return createSceneGraph([
    {
      identity: { id: "locked-circle" },
      geometry: { kind: "circle", center: { x: 10, y: 20 }, radius: 5 },
      style: {},
      placement: { layer: 2, order: 0 },
      relations: {},
      metadata: { geometryLocked: true },
    },
    {
      identity: { id: "image-layer" },
      geometry: {
        kind: "image_layer",
        position: { x: 0, y: 0 },
        width: 4,
        height: 2,
        source: "fixture://image",
      },
      style: {},
      placement: { layer: 4, order: 0 },
      relations: {},
      metadata: {},
    },
  ]);
}

const graph = fixtureGraph();
const graphBefore = serializeSceneGraph(graph);
const fixtureProvider = createOfflineSegmentationProvider("fixture-provider", {
  runtime: "deterministic-fixture-v1",
  attachments: [
    {
      id: "circle-mask",
      target: { kind: "object", nodeId: "locked-circle" },
      label: "circle",
      confidence: 1,
      mask: {
        encoding: "binary-rle",
        width: 4,
        height: 2,
        startsWith: 0,
        runs: [1, 2, 3, 2],
      },
    },
    {
      id: "layer-mask",
      target: { kind: "layer", layer: 4 },
      mask: {
        encoding: "binary-rle",
        width: 2,
        height: 2,
        startsWith: 1,
        runs: [4],
      },
    },
  ],
});

const first = await requestSegmentation(fixtureProvider, {
  id: "fixture-request",
  image: { source: "fixture://image", mediaType: "image/png" },
  sceneGraph: graph,
});
const second = await requestSegmentation(fixtureProvider, {
  id: "fixture-request",
  image: { source: "fixture://image", mediaType: "image/png" },
  sceneGraph: graph,
});
assert.deepEqual(first, second, "offline fixture output must be deterministic");
assert.equal(first.status, "available");
if (first.status === "available") {
  assert.equal(first.output.attachments[0]?.target.kind, "object");
  assert.equal(first.output.attachments[1]?.target.kind, "layer");
  assert.equal(serializeSceneGraph(first.output.sceneGraph), graphBefore);
}
assert.equal(serializeSceneGraph(graph), graphBefore);

let unavailableSegmentCalls = 0;
const unavailableProvider: SegmentationProvider = {
  id: "missing-runtime",
  runtimeStatus() {
    return {
      available: false,
      runtime: "optional-real-runtime",
      reason: "Optional runtime is not installed.",
    };
  },
  async segment() {
    unavailableSegmentCalls += 1;
    return [];
  },
};
const unavailableSmoke = await runSegmentationSmoke({
  provider: unavailableProvider,
  request: {
    id: "unavailable-smoke",
    image: { source: "fixture://image" },
    sceneGraph: graph,
  },
});
assert.equal(unavailableSmoke.status, "SKIPPED");
assert.equal(unavailableSmoke.capability.status, "NOT_AVAILABLE");
assert.equal(unavailableSegmentCalls, 0, "smoke must not call an unavailable runtime");

let availableSegmentCalls = 0;
const availableProvider: SegmentationProvider = {
  id: "available-runtime",
  runtimeStatus() {
    return { available: true, runtime: "real-runtime-fixture" };
  },
  async segment(request) {
    availableSegmentCalls += 1;
    const mutable = request.sceneGraph as unknown as {
      nodes: Array<{ geometry: { radius?: number } }>;
    };
    try {
      mutable.nodes[0]!.geometry.radius = 999;
    } catch (error) {
      assert.ok(
        error instanceof TypeError,
        "an immutable provider Scene Graph must reject geometry mutation with TypeError",
      );
    }
    return [{
      id: "real-smoke-mask",
      target: { kind: "object", nodeId: "locked-circle" },
      mask: {
        encoding: "binary-rle",
        width: 1,
        height: 1,
        startsWith: 1,
        runs: [1],
      },
    }];
  },
};
const completedSmoke = await runSegmentationSmoke({
  provider: availableProvider,
  request: {
    id: "available-smoke",
    image: { source: "fixture://image" },
    sceneGraph: graph,
  },
});
assert.equal(completedSmoke.status, "COMPLETED");
assert.equal(completedSmoke.capability.status, "AVAILABLE");
assert.equal(availableSegmentCalls, 1);
assert.equal(serializeSceneGraph(graph), graphBefore, "provider mutation must not redefine locked geometry");
if (completedSmoke.status === "COMPLETED") {
  assert.equal(
    serializeSceneGraph(completedSmoke.result.output.sceneGraph),
    graphBefore,
    "segmentation output must retain the original Scene Graph geometry",
  );
}

const failedProbeProvider: SegmentationProvider = {
  id: "failed-probe",
  runtimeStatus() {
    throw new Error("probe executable missing");
  },
  async segment() {
    throw new Error("segment must not execute after a failed probe");
  },
};
const failedProbe = await probeSegmentationRuntime(failedProbeProvider);
assert.equal(failedProbe.status, "NOT_TESTED");
assert.match(failedProbe.reason ?? "", /probe executable missing/);
const failedSmoke = await runSegmentationSmoke({
  provider: failedProbeProvider,
  request: {
    id: "failed-probe-smoke",
    image: { source: "fixture://image" },
    sceneGraph: graph,
  },
});
assert.equal(failedSmoke.status, "SKIPPED");

const malformedProvider = {
  id: "malformed-status",
  runtimeStatus() {
    return { available: true, runtime: "" };
  },
  async segment() {
    return [];
  },
} as SegmentationProvider;
const malformedCapability = await probeSegmentationRuntime(malformedProvider);
assert.equal(malformedCapability.status, "NOT_TESTED");
assert.match(malformedCapability.reason ?? "", /invalid runtime name/);

await assert.rejects(
  () => requestSegmentation(fixtureProvider, {
    id: "missing-object",
    image: { source: "fixture://image" },
    sceneGraph: createSceneGraph([]),
  }),
  /target node does not exist/,
);

console.log("Segmentation runtime tests: PASS");
