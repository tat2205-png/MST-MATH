import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import express from "express";
import { registerStudioRoutes } from "../server/studio/api.js";

const enabledFlags = { integrationCanary: true, imageAnimation: false, luaDraw: false, depthTwoPointFiveD: false, blender: false, generativeMotion: false };
let enabled = true;
const app = express();
app.use(express.json());
registerStudioRoutes(app, { flags: () => enabled ? enabledFlags : { ...enabledFlags, integrationCanary: false } });
const server = app.listen(0, "127.0.0.1");
try {
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;
  const execute = (body: unknown) => fetch(`http://127.0.0.1:${port}/api/studio/execute`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
  const valid = await execute({ task: "geometry.visualize", input: { fixture: "triangle_area" }, requestedCapabilities: ["geometry.2d"] });
  assert.equal(valid.status, 200);
  const validBody = await valid.json() as { result: { success: boolean; selectedEngines: string[] } };
  assert.equal(validBody.result.success, true);
  assert.deepEqual(validBody.result.selectedEngines, ["studio.manim"]);
  const invalid = await execute({ task: "shell", input: { fixture: "triangle_area" }, requestedCapabilities: ["geometry.2d"] });
  assert.equal(invalid.status, 400);
  enabled = false;
  const disabled = await execute({ task: "math.solve", input: { text: "2x-4=0" }, requestedCapabilities: ["math.solve"] });
  assert.equal(disabled.status, 403);
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
console.log("STUDIO_EXECUTE_API_QA=PASS");
