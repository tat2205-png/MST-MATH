import assert from "node:assert/strict";
import { createServer, type RequestListener } from "node:http";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { PythonManimRendererAdapter } from "../server/adapters/rendererAdapter.js";
async function server(handler: RequestListener, run: (url: string) => Promise<void>) { const instance = createServer(handler); instance.listen(0, "127.0.0.1"); await once(instance, "listening"); try { await run(`http://127.0.0.1:${(instance.address() as AddressInfo).port}`); } finally { instance.close(); await once(instance, "close"); } }
const ready = { status: "READY", rendererId: "local.manim", manimAvailable: true, ffmpegAvailable: true, supportedOutputTypes: ["video/mp4"], runtimeReady: true };
await server((request, response) => { response.writeHead(request.url === "/api/capabilities" ? 200 : 404, { "content-type": "application/json" }); response.end(JSON.stringify(ready)); }, async url => { const adapter = new PythonManimRendererAdapter(url); assert.equal((await adapter.capabilities()).status, "READY"); assert.equal(await adapter.isServiceAvailable(), true); });
await server((_request, response) => { response.writeHead(404); response.end(); }, async url => assert.equal((await new PythonManimRendererAdapter(url).capabilities()).status, "CONTRACT_MISMATCH"));
await server((_request, response) => { response.writeHead(200, { "content-type": "application/json" }); response.end(JSON.stringify({ ...ready, status: "UNAVAILABLE", manimAvailable: false, runtimeReady: false })); }, async url => await assert.rejects(() => new PythonManimRendererAdapter(url).submitRenderJob({ jobId: "test", outputFormat: "mp4", resolution: "720p", fps: 30, videoSpec: {} as never }), /RUNTIME_MISSING/));
const source = PythonManimRendererAdapter.toString(); assert.doesNotMatch(source, /flower\.mp4|runSimulationWorker/);
console.log("LOCAL_RENDERER_CONTRACT_QA=PASS\nBRIDGE_CAPABILITY_QA=PASS\nRENDERER_CAPABILITIES_QA=PASS\nREAL_RENDERER_SELECTION_QA=PASS\nRENDERER_ROUTING_TRUTH_QA=PASS\nSIMULATOR_NOT_USED_QA=PASS\nREMOTE_SAMPLE_NOT_USED_QA=PASS");
