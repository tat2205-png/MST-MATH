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
assert.deepEqual(result.trace.map((entry) => entry.stage), ["VALIDATE", "PLAN", "ROUTE", "EXECUTE", "VERIFY", "RESULT"]);
assert.ok(result.trace.every((entry, index) => entry.sequence === index && entry.status === "PASS"));
assert.equal(JSON.stringify(result.trace).includes(":\\"), false);
console.log("STUDIO_EXECUTION_TRACE_QA=PASS");
