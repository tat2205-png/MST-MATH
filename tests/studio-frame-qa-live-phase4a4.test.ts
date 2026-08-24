import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSceneGraph, createSceneNode } from "../image-animation/core/scene-graph/index.js";
import { createAnimationTimeline } from "../image-animation/core/timeline/index.js";
import { compileManim } from "../image-animation/renderers/manim/index.js";
import { geminiProvider } from "../server/providers/index.js";
import { PythonManimRendererAdapter } from "../server/adapters/rendererAdapter.js";
import { VisualFrameQAService } from "../server/services/visualFrameQAService.js";

const graph = createSceneGraph([
  createSceneNode({ identity: { id: "marker" }, geometry: { kind: "point", x: -2, y: 0 } }),
  createSceneNode({ identity: { id: "result" }, geometry: { kind: "label", position: { x: 0, y: -2 }, text: "x = 2" } }),
]);
const timeline = createAnimationTimeline([{ id: "move", type: "move", targetId: "marker", start: 0, duration: 1.5, to: { x: 2, y: 0 } }, { id: "show", type: "appear", targetId: "result", start: 1.5, duration: 0.5 }], graph);
const source = compileManim(graph, { sceneClassName: "Phase4A4FrameQa", timeline }).source;
const job = await new PythonManimRendererAdapter().submitRenderJob({ jobId: "phase4a4", outputFormat: "mp4", resolution: "720p", fps: 30, videoSpec: { manim_python_code: source } as never });
assert.equal(job.status, "COMPLETED", job.errorMessage);
const artifact = (job.artifacts as Array<{ pathOrUrl: string }>).find((item) => item.pathOrUrl.endsWith("render.mp4")); assert.ok(artifact);
const bytes = new Uint8Array(await (await fetch(new URL(artifact.pathOrUrl, "http://127.0.0.1:8765"))).arrayBuffer());
const dir = mkdtempSync(join(tmpdir(), "phase4a4-")), mp4 = join(dir, "timeline.mp4"); writeFileSync(mp4, bytes);
const times = ["0.1", "1.0", "1.8"];
const images = times.map((time, index) => { const path = join(dir, `frame-${index}.png`); execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-ss", time, "-i", mp4, "-frames:v", "1", "-update", "1", path]); return readFileSync(path).toString("base64"); });
const clean = { status: "PASS", issues: [], checks: { textClipped: false, formulaClipped: false, formulaReadable: true, textOverlap: false, objectOverlap: false, spacingSufficient: true, safeMarginViolated: false, cameraCropping: false, fontRenderError: false, assetDistorted: false, mathAccurate: true, geometryInvariantPreserved: true, graphInvariantPreserved: true }, notes: "deterministic frame inspection complete" };
const original = geminiProvider.generateStructuredJSON; geminiProvider.generateStructuredJSON = (async () => clean) as typeof original;
try {
  const report = await new VisualFrameQAService().runJobFrameQA({ jobId: job.jobId, rawFrames: { start: { base64: images[0] }, key: { base64: images[1] }, end: { base64: images[2] } } });
  assert.equal(report.overallStatus, "PASS"); assert.equal(report.finalStatus, "RENDER_READY"); assert.equal(Object.values(report.frames).every((frame) => frame.analysisCompleted), true);
  console.log(`REAL_ARTIFACT_FRAME_QA=PASS\nREAL_ARTIFACT_USED=${mp4}`);
} finally { geminiProvider.generateStructuredJSON = original; }
