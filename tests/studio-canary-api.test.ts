import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import express from "express";
import { executeStudioCanary, registerStudioRoutes } from "../server/studio/api.js";

const flags = {
  integrationCanary: true,
  imageAnimation: false,
  luaDraw: false,
  depthTwoPointFiveD: false,
  blender: false,
  generativeMotion: false,
};
const result = await executeStudioCanary(
  { task: "geometry_visual", input: { fixture: "triangle_area" } },
  flags,
);
assert.equal(result.status, "PASS");
assert.equal(result.selectedEngine, "studio.manim");
assert.equal(result.rendererDecision, "manim");
assert.deepEqual(result.sceneGraph.nodeIds, ["triangle", "answer"]);
assert.equal(result.outputSha256.length, 64);

const app = express();
app.use(express.json());
registerStudioRoutes(app, { flags: () => flags });
const server = app.listen(0, "127.0.0.1");
try {
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as AddressInfo;
  const response = await fetch(`http://127.0.0.1:${address.port}/api/studio/canary`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ task: "geometry_visual", input: { fixture: "triangle_area" } }),
  });
  assert.equal(response.status, 200);
  const body = await response.json() as { success: boolean; result: { status: string } };
  assert.equal(body.success, true);
  assert.equal(body.result.status, "PASS");
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
console.log("STUDIO_CANARY_API_QA=PASS");
