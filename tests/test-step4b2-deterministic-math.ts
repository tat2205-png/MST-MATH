import assert from "node:assert/strict";
import { deterministicMathVerifier } from "../server/services/deterministicMathVerifier.js";
import { evaluateMathGate } from "../server/services/mathVerificationGate.js";

const problem = (latex: string) => ({
  status: "PASS",
  problem: latex,
  originalText: latex,
  normalizedText: latex,
  latex,
  domain: "Đại số & Giải tích",
  topic: "Phương trình",
  grade: "Lớp 10",
  given: [],
  find: ["x"],
  entities: [],
  constraints: ["x \\in \\mathbb{R}"],
  ambiguities: [],
  confidence: 1,
} as any);
const solution = (roots: string[], noRealRoots = false) => ({ verification_data: { roots, noRealRoots } } as any);

assert.equal(deterministicMathVerifier.verify(problem("2x-4=0"), solution(["2"])).status, "DETERMINISTIC_PASS");
assert.equal(deterministicMathVerifier.verify(problem("2x-1=0"), solution(["1/2"])).status, "DETERMINISTIC_PASS");
assert.equal(deterministicMathVerifier.verify(problem("2x^2-5x+2=0"), solution(["1/2", "2"])).status, "DETERMINISTIC_PASS");
assert.equal(deterministicMathVerifier.verify(problem("2x^2-5x+2=0"), solution(["1", "2"])).status, "DETERMINISTIC_FAIL");
assert.equal(deterministicMathVerifier.verify(problem("x^2-5x+6=0"), solution(["2"])).status, "DETERMINISTIC_FAIL");
assert.equal(deterministicMathVerifier.verify(problem("x^2-5x+6=0"), solution(["2", "3", "4"])).status, "DETERMINISTIC_FAIL");
assert.equal(deterministicMathVerifier.verify(problem("x^2+1=0"), solution([], true)).status, "DETERMINISTIC_PASS");
assert.equal(deterministicMathVerifier.verify(problem("sin(x)=0"), solution(["0"])).status, "UNSUPPORTED");
assert.equal(deterministicMathVerifier.verify(problem("1/(x-1)=2"), solution(["3/2"])).status, "UNSUPPORTED");
assert.equal(deterministicMathVerifier.verify(problem("2x-4=0"), {} as any).status, "HUMAN_REVIEW_REQUIRED");

const providerPass = {
  verification_seal: "CONFIRMED_VALID",
  status: "PASS",
  verificationSource: "PROVIDER",
  checks: [{ id: "math", name: "Math", status: "PASS", details: "ok" }],
  discrepancies: [],
} as any;
const validSolution = solution(["1/2", "2"]);
const gateWithFail = evaluateMathGate(problem("2x^2-5x+2=0"), validSolution, {
  ...providerPass,
  deterministicVerification: {
    status: "DETERMINISTIC_FAIL",
    engine: "DETERMINISTIC_V1",
    problemType: "QUADRATIC_EQUATION",
    checks: [],
    reasons: ["wrong"],
  },
} as any);
assert.equal(gateWithFail.allowed, false);
const gateUnsupported = evaluateMathGate(problem("sin(x)=0"), solution(["0"]), {
  ...providerPass,
  deterministicVerification: {
    status: "UNSUPPORTED",
    engine: "DETERMINISTIC_V1",
    problemType: "UNSUPPORTED",
    checks: [{ type: "SUPPORTED_EQUATION", passed: false, detail: "unsupported" }],
    reasons: ["unsupported"],
  },
} as any);
assert.equal(gateUnsupported.allowed, false);
assert.equal(evaluateMathGate(problem("2x-4=0"), solution(["2"]), {
  ...providerPass,
  deterministicVerification: { status: "DETERMINISTIC_PASS" },
} as any).allowed, false);

console.log("PHASE 4B.2 deterministic math tests passed");
