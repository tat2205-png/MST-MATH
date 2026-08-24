import assert from "node:assert/strict";
import { createSceneGraph, serializeSceneGraph } from "../image-animation/core/scene-graph/index.js";
import { createStudio } from "../server/studio/createStudio.js";

const graph = createSceneGraph([
  {
    identity: { id: "triangle" },
    geometry: { kind: "polygon", points: [{ x: -2, y: -1 }, { x: 2, y: -1 }, { x: 0, y: 2 }] },
    style: { stroke: "#2563eb", strokeWidth: 2 },
    placement: { layer: 1, order: 0 },
    relations: {},
    metadata: { geometryLocked: true, problem: "Find the area of a triangle with base 4 and height 3." },
  },
  {
    identity: { id: "answer" },
    geometry: { kind: "label", position: { x: 0, y: -2 }, text: "Area = 6" },
    style: {},
    placement: { layer: 2, order: 0 },
    relations: {},
    metadata: { authority: "exact" },
  },
]);
const before = serializeSceneGraph(graph);
const studio = createStudio({
  integrationCanary: true,
  imageAnimation: true,
  luaDraw: false,
  depthTwoPointFiveD: false,
  blender: false,
  generativeMotion: false,
});
const result = await studio.execute({ task: "geometry.2d", input: graph, output: "manim.source" });
assert.equal(result.status, "COMPLETED");
if (result.status !== "COMPLETED") throw new Error("Studio integration canary did not complete.");
const serialized = JSON.stringify(result.output);
assert.match(serialized, /StudioIntegrationCanary/);
assert.match(serialized, /EXACT_GEOMETRY_REQUIRES_DETERMINISTIC_RENDERER/);
assert.match(serialized, /Area = 6/);
assert.equal(serializeSceneGraph(graph), before, "Studio canary must not mutate the source Scene Graph");

console.log("STUDIO_INTEGRATION_CANARY_QA=PASS");
