import assert from "node:assert/strict";
import { createStudio } from "../server/studio/createStudio.js";

const studio = createStudio({
  integrationCanary: true,
  imageAnimation: true,
  luaDraw: false,
  depthTwoPointFiveD: false,
  blender: false,
  generativeMotion: false,
});
const result = await studio.executeTask({
  task: "animation.scene",
  input: { fixture: "triangle_area" },
  requestedCapabilities: ["animation.image.segmentation"],
});
assert.equal(result.success, false);
assert.equal(result.error?.code, "RUNTIME_MISSING");
assert.equal(result.runtimeStatus[0].status, "OPTIONAL_RUNTIME_MISSING");
assert.equal(result.artifacts.length, 0);
console.log("STUDIO_RUNTIME_FALLBACK_QA=PASS");
