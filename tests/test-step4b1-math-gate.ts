import assert from "node:assert/strict";
import { evaluateMathGate } from "../server/services/mathVerificationGate.js";

const problemIR = { status: "PASS" } as any;
const solution = {} as any;
const validVerification = {
  verification_seal: "CONFIRMED_VALID",
  status: "PASS",
  verificationSource: "PROVIDER",
  checks: [{ id: "math", name: "Math", status: "PASS", details: "ok" }],
  discrepancies: [],
  deterministicVerification: {
    status: "DETERMINISTIC_PASS",
    engine: "DETERMINISTIC_V1",
    problemType: "LINEAR_EQUATION",
    checks: [{ type: "ROOT_SET_COMPARISON", passed: true, detail: "ok" }],
    reasons: [],
    provenance: [{ id: "source", kind: "SOURCE_LITERAL", value: "2x-4=0", trustedForAutomation: true }],
  },
} as any;

assert.equal(evaluateMathGate(problemIR, solution, validVerification).allowed, true);
assert.equal(evaluateMathGate(problemIR, solution, { ...validVerification, status: "FAIL" }).allowed, false);
assert.equal(evaluateMathGate(problemIR, solution, { ...validVerification, status: "WARNING" }).allowed, false);
assert.equal(evaluateMathGate(problemIR, solution, { ...validVerification, status: undefined }).allowed, false);
assert.equal(evaluateMathGate(problemIR, solution, null).allowed, false);
assert.equal(evaluateMathGate({ status: "NEED_MORE_INFORMATION" } as any, solution, validVerification).allowed, false);

const unverifiedRealWorld = evaluateMathGate(
  {
    status: "PASS",
    domain: "Bài toán tối ưu & Ứng dụng thực tế",
    problem: "Một bể chứa có chi phí phụ thuộc kích thước thực tế.",
  } as any,
  solution,
  validVerification
);
assert.equal(unverifiedRealWorld.allowed, false);
assert.equal(unverifiedRealWorld.status, "HUMAN_REVIEW_REQUIRED");
assert.equal(unverifiedRealWorld.reasons.some((reason) => reason.includes("REAL_WORLD_UNVERIFIED")), true);

async function runGatedPlanning(verification: any, onVisual: () => void, onVideo: () => void) {
  const gate = evaluateMathGate(problemIR, solution, verification);
  if (!gate.allowed) return gate;
  onVisual();
  onVideo();
  return gate;
}

let visualCalls = 0;
let videoCalls = 0;
await runGatedPlanning({ ...validVerification, status: "FAIL" }, () => visualCalls++, () => videoCalls++);
assert.equal(visualCalls, 0);
assert.equal(videoCalls, 0);

await runGatedPlanning(validVerification, () => visualCalls++, () => videoCalls++);
assert.equal(visualCalls, 1);
assert.equal(videoCalls, 1);

console.log("PHASE 4B.1 math gate tests passed");