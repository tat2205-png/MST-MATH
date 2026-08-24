import assert from "node:assert/strict";
import { createStudio } from "../server/studio/createStudio.js";

const result = await createStudio({
  integrationCanary: true,
  imageAnimation: false,
  luaDraw: false,
  depthTwoPointFiveD: false,
  blender: false,
  generativeMotion: false,
}).executeTask({ task: "geometry.visualize", input: { fixture: "triangle_area" }, requestedCapabilities: ["geometry.2d"] });

assert.equal(result.success, true);
assert.equal(result.requestId.length, 16);
assert.deepEqual(result.selectedEngines, ["studio.manim"]);
assert.deepEqual(result.capabilitiesUsed, ["geometry.2d"]);
assert.deepEqual(result.qa, { validation: "PASS", routing: "PASS", execution: "PASS" });
assert.equal(result.artifacts[0].kind, "engine-result");
console.log("STUDIO_ORCHESTRATOR_QA=PASS");
