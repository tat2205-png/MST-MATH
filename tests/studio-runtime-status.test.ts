import assert from "node:assert/strict";
import { buildStudioRuntimeStatus } from "../server/studio/runtimeStatus.js";

const flags = {
  integrationCanary: false,
  imageAnimation: false,
  luaDraw: false,
  depthTwoPointFiveD: false,
  blender: false,
  generativeMotion: false,
};
const ready = buildStudioRuntimeStatus(flags, { luaDrawReady: () => true, manimReady: () => true });
const missing = buildStudioRuntimeStatus(flags, { luaDrawReady: () => false, manimReady: () => false });
assert.equal(ready.find((engine) => engine.id === "luadraw")?.status, "READY");
assert.equal(missing.find((engine) => engine.id === "luadraw")?.status, "CORE_READY_RUNTIME_MISSING");
assert.equal(ready.find((engine) => engine.id === "manim-2d")?.status, "READY");
assert.equal(missing.find((engine) => engine.id === "manim-2d")?.status, "CORE_READY_RUNTIME_MISSING");
assert.ok(ready.every((engine) => engine.executionEnabled === false));
console.log("STUDIO_RUNTIME_STATUS_QA=PASS");
