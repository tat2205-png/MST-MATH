import assert from "node:assert/strict";
import { createStudio } from "../server/studio/createStudio.js";

const request = { task: "video.plan" as const, input: { fixture: "triangle_area" as const }, requestedCapabilities: ["video.plan", "geometry.2d", "math.solve"] as const };
const studio = createStudio({ integrationCanary: true, imageAnimation: false, luaDraw: false, depthTwoPointFiveD: false, blender: false, generativeMotion: false });
const first = await studio.executeTask(request);
const second = await studio.executeTask(request);
assert.equal(first.success, true);
assert.deepEqual(first.selectedEngines, ["math-ai", "studio.manim", "renderer-router"]);
assert.equal(first.artifacts.length, 3);
assert.equal(first.requestId, second.requestId);
assert.deepEqual(first.plan, second.plan);
assert.deepEqual(first.artifacts, second.artifacts);
console.log("STUDIO_MULTI_ENGINE_CANARY_QA=PASS");
