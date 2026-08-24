import assert from "node:assert/strict";
import { createStudio } from "../server/studio/createStudio.js";

const result = await createStudio({
  integrationCanary: true,
  imageAnimation: false,
  luaDraw: false,
  depthTwoPointFiveD: false,
  blender: false,
  generativeMotion: false,
}).executeTask({ task: "math.solve", input: { fixture: "linear_equation" }, requestedCapabilities: ["math.solve"] });

assert.equal(result.success, true);
assert.equal(result.requestId.length, 16);
assert.deepEqual(result.selectedEngines, ["math-ai"]);
assert.deepEqual(result.capabilitiesUsed, ["math.solve"]);
assert.deepEqual(result.qa, { validation: "PASS", routing: "PASS", execution: "PASS" });
assert.equal(result.artifacts[0].value, 2);
console.log("STUDIO_ORCHESTRATOR_QA=PASS");
