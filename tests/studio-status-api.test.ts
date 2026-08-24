import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import express from "express";
import { getStudioStatus, registerStudioRoutes } from "../server/studio/api.js";
import type { StudioFeatureFlags } from "../server/studio/featureFlags.js";

const flags: StudioFeatureFlags = {
  integrationCanary: false,
  imageAnimation: false,
  luaDraw: false,
  depthTwoPointFiveD: false,
  blender: false,
  generativeMotion: false,
};
const status = getStudioStatus(flags, { luaDrawReady: () => true });
assert.equal(status.productionPipelineChanged, false);
assert.equal(status.executionDefault, "OFF");
assert.deepEqual(status.engines.map((engine) => [engine.name, engine.status]), [
  ["Math AI", "READY"],
  ["LuaDraw", "READY"],
  ["Manim 2D", "READY"],
  ["Native deterministic Manim 3D", "UNAVAILABLE"],
  ["Image Animation core", "READY"],
  ["Segmentation", "CORE_READY_RUNTIME_MISSING"],
  ["Depth 2.5D", "CORE_READY_RUNTIME_MISSING"],
  ["Blender", "ROUTER_READY_RUNTIME_MISSING"],
  ["Generative motion", "ROUTER_READY_RUNTIME_MISSING"],
]);
assert.equal(JSON.stringify(status).includes("API_KEY"), false);
assert.equal(JSON.stringify(status).includes(":\\"), false);

const app = express();
app.use(express.json());
registerStudioRoutes(app, { flags: () => flags, runtimeProbe: { luaDrawReady: () => true } });
const server = app.listen(0, "127.0.0.1");
try {
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as AddressInfo;
  const response = await fetch(`http://127.0.0.1:${address.port}/api/studio/status`);
  assert.equal(response.status, 200);
  const body = await response.json() as { success: boolean; engines: unknown[] };
  assert.equal(body.success, true);
  assert.equal(body.engines.length, 9);
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
console.log("STUDIO_STATUS_API_QA=PASS");
