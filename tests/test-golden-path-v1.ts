import assert from "node:assert/strict";
import { deterministicLinearSystemVerifier } from "../server/services/deterministicLinearSystemVerifier.js";
import { buildGoldenPath, finalizeGoldenPath } from "../server/services/goldenPathService.js";

const problem = (latex: string, status = "PASS") => ({
  status,
  problem: latex,
  originalText: latex,
  normalizedText: latex,
  latex,
  domain: "Đại số & Giải tích",
  topic: "Hệ phương trình bậc nhất hai ẩn",
  grade: "Lớp 10",
  given: [],
  find: ["x", "y"],
  entities: [],
  constraints: [],
  ambiguities: [],
  confidence: 1,
} as any);
const solution = (x = "3", y = "2") => ({ verification_data: { systemSolution: { type: "POINT", x, y } } } as any);
const providerReport = (deterministic: any) => ({
  verification_seal: "CONFIRMED_VALID",
  status: "PASS",
  verificationSource: "HYBRID",
  checks: [{ id: "math", name: "Math", status: "PASS", details: "deterministic" }],
  discrepancies: [],
  deterministicVerification: deterministic,
} as any);

const goldenProblem = problem("x+y=5;x-y=1");
const goldenSolution = solution();
const deterministic = deterministicLinearSystemVerifier.verify(goldenProblem, goldenSolution);
const golden = buildGoldenPath(goldenProblem, goldenSolution, providerReport(deterministic));

assert.equal(golden.mathGate.allowed, true);
assert.equal(golden.finalStatus, "RENDER_PENDING");
assert.equal(golden.scenePlan.status, "PASS");
assert.deepEqual(golden.scenePlan.value?.verifiedValues, { x: "3", y: "2" });
assert.equal(golden.scenePlan.value?.scenes.length, 7);
assert.ok(golden.scenePlan.value?.scenes.every((scene) => scene.math.includes("3") || scene.math.includes("2") || scene.index <= 3));
assert.equal(golden.narrationPlan.value?.cues.length, 7);
assert.ok(golden.narrationPlan.value?.cues.every((cue) => cue.expectedVisual.length > 0));
assert.equal(golden.renderTask.value?.entryFile, "main.py");
assert.equal(golden.renderTask.value?.outputFormat, "mp4");
assert.equal(golden.renderTask.value?.requiredFrameNames.join(","), "START,KEY,END");
assert.equal(golden.renderTask.value?.manifest?.files.length, 1);
assert.equal(golden.renderTask.value?.videoSpec.scenes.length, 7);
assert.ok(golden.renderTask.value?.files?.[0].content.includes("x=3"));
assert.deepEqual(golden.frameQaInput.value?.requiredFrames, ["START", "KEY", "END"]);
assert.deepEqual(golden.frameQaInput.value?.finalAnswer, { x: "3", y: "2" });

for (const invalid of [
  buildGoldenPath(problem("x+y=5;x-y=1", "NEED_MORE_INFORMATION"), goldenSolution, providerReport(deterministic)),
  buildGoldenPath(problem("x^2+y=2;x-y=0"), solution(), providerReport(deterministic)),
  buildGoldenPath(problem("x+y=5;x-y=2"), goldenSolution, providerReport(deterministic)),
  buildGoldenPath(problem("x+y=5"), goldenSolution, providerReport(deterministic)),
]) {
  assert.equal(invalid.scenePlan.status, "BLOCKED");
  assert.equal(invalid.renderTask.status, "BLOCKED");
  assert.equal(invalid.finalStatus, "MATH_REVIEW_REQUIRED");
}

const failedRender = finalizeGoldenPath(golden, { status: "FAILED", jobId: "failed" }, { status: "PASS" });
assert.equal(failedRender.finalStatus, "RENDER_FAILED");
const failedFrameQa = finalizeGoldenPath(golden, { status: "COMPLETED", jobId: "job", mp4Path: "out.mp4" }, { status: "FAIL" });
assert.equal(failedFrameQa.finalStatus, "FRAME_QA_PENDING");
const finalPass = finalizeGoldenPath(golden, { status: "COMPLETED", jobId: "job", mp4Path: "out.mp4" }, { status: "PASS" });
assert.equal(finalPass.finalStatus, "FINAL_PASS");
const blockedFinal = finalizeGoldenPath({ ...golden, mathGate: { allowed: false, status: "BLOCKED", reasons: ["blocked"] } }, { status: "COMPLETED", jobId: "job", mp4Path: "out.mp4" }, { status: "PASS" });
assert.equal(blockedFinal.finalStatus, "MATH_REVIEW_REQUIRED");

console.log("GOLDEN_PATH_V1: all contract tests passed");
