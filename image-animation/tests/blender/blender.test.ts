import assert from "node:assert/strict";
import {
  createSceneGraph,
  createSceneNode,
} from "../../core/scene-graph/index.ts";
import { createAnimationTimeline } from "../../core/timeline/index.ts";
import {
  createBlenderArtifactContract,
  routeBlenderRender,
  type BlenderRuntime,
} from "../../renderers/blender/index.ts";

const point = createSceneNode({
  identity: { id: "point-a" },
  geometry: { kind: "point", x: 1, y: 2 },
  placement: { layer: 1, order: 0 },
});
const segment = createSceneNode({
  identity: { id: "segment-ab" },
  geometry: {
    kind: "segment",
    start: { x: 1, y: 2 },
    end: { x: 3, y: 2 },
  },
  placement: { layer: 0, order: 0 },
});
const graph = createSceneGraph([point, segment], { approved: true });
const timeline = createAnimationTimeline([
  { id: "show-a", type: "appear", targetId: "point-a", start: 0, duration: 0.25 },
  { id: "draw-ab", type: "draw", targetId: "segment-ab", start: 0.25, duration: 1 },
], graph, { fps: 30 });

const firstContract = createBlenderArtifactContract("render-1", graph, timeline);
const secondContract = createBlenderArtifactContract(
  "render-1",
  createSceneGraph([...graph.nodes].reverse(), { approved: true }),
  timeline,
);
assert.deepEqual(secondContract, firstContract, "canonical graph ordering produces identical artifacts");
assert.deepEqual(firstContract, {
  contractVersion: 1,
  requestId: "render-1",
  rootDirectory: "artifacts/blender",
  sceneGraphPath: "artifacts/blender/scene.scene-graph.json",
  timelinePath: "artifacts/blender/scene.timeline.json",
  blendPath: "artifacts/blender/scene.blend",
  videoPath: "artifacts/blender/scene.mp4",
  sceneGraphJson: JSON.stringify(graph),
  timelineJson: JSON.stringify(timeline),
});

const customContract = createBlenderArtifactContract("render-2", graph, timeline, {
  rootDirectory: "output\\proof",
  fileStem: "geometry",
  videoExtension: "webm",
});
assert.equal(customContract.rootDirectory, "output/proof");
assert.equal(customContract.videoPath, "output/proof/geometry.webm");
assert.equal(customContract.blendPath, "output/proof/geometry.blend");
assert.throws(
  () => createBlenderArtifactContract("bad", graph, timeline, { rootDirectory: "../outside" }),
  /without parent traversal/,
);
assert.throws(
  () => createBlenderArtifactContract("bad", graph, timeline, { fileStem: "nested/scene" }),
  /single safe path component/,
);

let disabledStatusCalls = 0;
const disabledRuntime: BlenderRuntime = {
  id: "must-not-run",
  runtimeStatus() {
    disabledStatusCalls += 1;
    throw new Error("disabled routing queried Blender");
  },
};
const disabled = await routeBlenderRender(disabledRuntime, {
  id: "disabled-render",
  mode: "disabled",
  sceneGraph: graph,
  timeline,
});
assert.deepEqual(disabled, {
  status: "disabled",
  requestId: "disabled-render",
  reason: "blender-disabled",
});
assert.equal(disabledStatusCalls, 0, "Blender remains optional when routing is disabled");

let renderCalls = 0;
const unavailableRuntime: BlenderRuntime = {
  id: "local-blender",
  runtimeStatus() {
    renderCalls += 1;
    return {
      available: false,
      runtime: "blender",
      reason: "Executable was not found.",
    };
  },
};
const optionalUnavailable = await routeBlenderRender(unavailableRuntime, {
  id: "optional-render",
  sceneGraph: graph,
  timeline,
});
assert.deepEqual(optionalUnavailable, {
  status: "unavailable",
  requestId: "optional-render",
  mode: "optional",
  runtimeId: "local-blender",
  runtime: "blender",
  reason: "Executable was not found.",
});
assert.equal(renderCalls, 1);

const requiredUnavailable = await routeBlenderRender(unavailableRuntime, {
  id: "required-render",
  mode: "required",
  sceneGraph: graph,
  timeline,
});
assert.equal(requiredUnavailable.status, "unavailable");
if (requiredUnavailable.status === "unavailable") {
  assert.equal(requiredUnavailable.mode, "required");
  assert.equal(requiredUnavailable.reason, "Executable was not found.");
}

const availableRuntime: BlenderRuntime = {
  id: "local-blender",
  async runtimeStatus() {
    return { available: true, runtime: "blender", version: "4.2.1" };
  },
};
const ready = await routeBlenderRender(availableRuntime, {
  id: "ready-render",
  mode: "required",
  sceneGraph: graph,
  timeline,
  artifacts: { rootDirectory: "renders", fileStem: "proof" },
});
assert.equal(ready.status, "ready");
if (ready.status === "ready") {
  assert.equal(ready.runtime, "blender");
  assert.equal(ready.version, "4.2.1");
  assert.equal(ready.artifacts.videoPath, "renders/proof.mp4");
}

const malformedRuntime = {
  id: "dishonest-runtime",
  runtimeStatus() {
    return { runtime: "blender" };
  },
} as unknown as BlenderRuntime;
await assert.rejects(
  () => routeBlenderRender(malformedRuntime, {
    id: "malformed",
    sceneGraph: graph,
    timeline,
  }),
  /must report whether the runtime is available/,
);

const unavailableWithoutReason = {
  id: "dishonest-runtime",
  runtimeStatus() {
    return { available: false, runtime: "blender", reason: "" };
  },
} satisfies BlenderRuntime;
await assert.rejects(
  () => routeBlenderRender(unavailableWithoutReason, {
    id: "missing-reason",
    sceneGraph: graph,
    timeline,
  }),
  /reason must be a non-empty string/,
);

const invalidTimeline = {
  version: 1,
  metadata: {},
  events: [{ id: "missing", type: "appear", targetId: "unknown", start: 0, duration: 1 }],
} as unknown as typeof timeline;
await assert.rejects(
  () => routeBlenderRender(availableRuntime, {
    id: "invalid-input",
    sceneGraph: graph,
    timeline: invalidTimeline,
  }),
  /MISSING_REFERENCE/,
  "ready routing rejects an invalid graph/timeline contract",
);

console.log("Blender router tests: PASS");
