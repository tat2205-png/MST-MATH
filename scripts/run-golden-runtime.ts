import { LocalBridgeClient } from "../src/services/localBridgeClient.js";
import { deterministicLinearSystemVerifier } from "../server/services/deterministicLinearSystemVerifier.js";
import { buildGoldenPath, evaluateGoldenRuntimeGate, finalizeGoldenPath } from "../server/services/goldenPathService.js";
import { VisualFrameQAService } from "../server/services/visualFrameQAService.js";

const problem: any = {
  status: "PASS", problem: "x + y = 5; x - y = 1", originalText: "x + y = 5; x - y = 1", normalizedText: "x + y = 5; x - y = 1", latex: "x+y=5;x-y=1", domain: "Đại số & Giải tích", topic: "Hệ phương trình bậc nhất hai ẩn", grade: "Lớp 10", given: [], find: ["x", "y"], entities: [], constraints: [], ambiguities: [], confidence: 1,
};
const solution: any = { verification_data: { systemSolution: { type: "POINT", x: "3", y: "2" } } };
const deterministic = deterministicLinearSystemVerifier.verify(problem, solution);
const verification: any = { verification_seal: "CONFIRMED_VALID", status: "PASS", verificationSource: "HYBRID", checks: [{ id: "math", name: "Math", status: "PASS", details: "deterministic" }], discrepancies: [], deterministicVerification: deterministic };
const golden = buildGoldenPath(problem, solution, verification);
if (!golden.renderTask.value) throw new Error(`Golden Path did not produce a render task: ${golden.mathGate.reasons.join(" ")}`);

const client = new LocalBridgeClient("http://127.0.0.1:8765");
const task: any = golden.renderTask.value;
const job = await client.createRenderJob(task);
console.log(JSON.stringify({ event: "JOB_CREATED", jobId: job.jobId, status: job.status }, null, 2));
let current = job;
for (let attempt = 0; attempt < 120 && current.status !== "COMPLETED" && current.status !== "FAILED" && current.status !== "CANCELLED"; attempt++) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  current = await client.getRenderJob(job.jobId);
}
const artifacts = await client.getRenderArtifacts(job.jobId);
const video = artifacts.find((artifact) => artifact.type === "preview_video" || artifact.type === "final_video");
const frames = Object.fromEntries(["start_frame", "key_frame", "end_frame"].map((type) => [type, artifacts.find((artifact) => artifact.type === type)]));
console.log(JSON.stringify({ event: "JOB_RESULT", status: current.status, exitCode: current.exitCode, artifacts: artifacts.map(({ type, name, pathOrUrl, sizeBytes }) => ({ type, name, pathOrUrl, sizeBytes })), video, frames }, null, 2));
if (current.status !== "COMPLETED" || current.exitCode !== 0 || !video || !video.sizeBytes || !frames.start_frame?.sizeBytes || !frames.key_frame?.sizeBytes || !frames.end_frame?.sizeBytes) process.exit(2);
const downloaded = await Promise.all(["start_frame", "key_frame", "end_frame"].map(async (type) => {
  const artifact: any = frames[type];
  const response = await fetch(`http://127.0.0.1:8765${artifact.pathOrUrl}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  return { type, bytes, mime: response.headers.get("content-type") };
}));
if (downloaded.some(({ bytes, mime }) => bytes.length === 0 || mime !== "image/png" || bytes[0] !== 0x89 || bytes[1] !== 0x50)) process.exit(3);
const frameQa = await new VisualFrameQAService().runJobFrameQA({ jobId: job.jobId, bridgeUrl: "http://127.0.0.1:8765", problemIR: problem, solution, videoSpec: task.videoSpec, rawFrames: Object.fromEntries(downloaded.map(({ type, bytes, mime }) => [type.replace("_frame", ""), { base64: Buffer.from(bytes).toString("base64"), mimeType: mime || "image/png" }])) as any });
const gate = evaluateGoldenRuntimeGate({ mathGate: golden.mathGate.allowed ? "PASS" : "FAIL", sceneContract: golden.scenePlan.status === "PASS" ? "PASS" : "FAIL", renderTask: golden.renderTask.status === "PASS" ? "PASS" : "FAIL", localBridge: "PASS", actualManim: current.status === "COMPLETED" && current.exitCode === 0 ? "PASS" : "FAIL", mp4Artifact: video?.sizeBytes ? "PASS" : "FAIL", frameArtifact: downloaded.every(({ bytes }) => bytes.length > 0) ? "PASS" : "FAIL", frameStructural: frameQa.qaMetrics.frameStructuralQa, mathProvenance: frameQa.qaMetrics.mathProvenanceQa, optionalAiVisualQa: frameQa.qaMetrics.optionalAiVisualQa });
console.log(JSON.stringify({ event: "FRAME_QA", overallStatus: frameQa.overallStatus, finalStatus: frameQa.finalStatus, optionalAiVisualQa: gate.optionalAiVisualQa, frameStructuralQa: frameQa.qaMetrics.frameStructuralQa, mathProvenanceQa: frameQa.qaMetrics.mathProvenanceQa, frameStatuses: { start: frameQa.frames.start.status, key: frameQa.frames.key.status, end: frameQa.frames.end.status }, notes: [frameQa.frames.start.notes, frameQa.frames.key.notes, frameQa.frames.end.notes] }, null, 2));
const finalized = finalizeGoldenPath(golden, { status: "COMPLETED", jobId: job.jobId, mp4Path: video.pathOrUrl }, { status: gate.finalGate === "PASS" ? "PASS" : "FAIL" });
console.log(JSON.stringify({ event: "FINAL_STATUS", finalStatus: finalized.finalStatus }, null, 2));
if (gate.finalGate !== "PASS" || finalized.finalStatus !== "FINAL_PASS") process.exit(4);
