import assert from "node:assert/strict";
import { deterministicMathVerifier } from "../server/services/deterministicMathVerifier.js";
import { evaluateMathGate } from "../server/services/mathVerificationGate.js";

const problem = (latex: string) => ({
  status: "PASS", problem: latex, originalText: latex, normalizedText: latex, latex,
  domain: "Đại số & Giải tích", topic: "Phương trình", grade: "Lớp 10",
  given: [], find: ["x"], entities: [], constraints: ["x \\in \\mathbb{R}"], ambiguities: [], confidence: 1,
} as any);
const solution = (roots: string[], noRealRoots = false) => ({ verification_data: { roots, noRealRoots } } as any);

const rationalPass = deterministicMathVerifier.verify(problem("(x+1)/(x-1)=2"), solution(["3"]));
assert.equal(rationalPass.status, "DETERMINISTIC_PASS");
assert.deepEqual(rationalPass.verifiedSolutions, ["3"]);
assert.deepEqual(rationalPass.excludedValues, ["1"]);
assert.equal(rationalPass.transformations?.[0].type, "CLEAR_DENOMINATOR");

const canceledPass = deterministicMathVerifier.verify(problem("(x^2-1)/(x-1)=0"), solution(["-1"]));
assert.equal(canceledPass.status, "DETERMINISTIC_PASS");
assert.deepEqual(canceledPass.verifiedSolutions, ["-1"]);
assert.deepEqual(canceledPass.excludedValues, ["1"]);
assert.equal(deterministicMathVerifier.verify(problem("(x^2-1)/(x-1)=0"), solution(["1"])).status, "DETERMINISTIC_FAIL");

const radicalPass = deterministicMathVerifier.verify(problem("sqrt(x+6)=x"), solution(["3"]));
assert.equal(radicalPass.status, "DETERMINISTIC_PASS");
assert.deepEqual(radicalPass.verifiedSolutions, ["3"]);
assert.deepEqual(radicalPass.extraneousSolutions, ["-2"]);
assert.equal(radicalPass.transformations?.[0].mayIntroduceExtraneousRoots, true);

const radicalBoth = deterministicMathVerifier.verify(problem("sqrt(x+6)=x"), solution(["3", "-2"]));
assert.equal(radicalBoth.status, "DETERMINISTIC_FAIL");
assert.deepEqual(radicalBoth.extraneousSolutions, ["-2"]);
assert.equal(deterministicMathVerifier.verify(problem("sqrt(x+6)=x"), solution(["-2"])).status, "DETERMINISTIC_FAIL");
assert.equal(deterministicMathVerifier.verify(problem("sqrt(x+6)=x"), solution([])).status, "DETERMINISTIC_FAIL");

assert.equal(deterministicMathVerifier.verify(problem("sqrt(x)+sqrt(x+1)=3"), solution(["2"])).status, "UNSUPPORTED");
assert.equal(deterministicMathVerifier.verify(problem("1/(1/(x-1))=2"), solution(["3/2"])).status, "UNSUPPORTED");

const providerPass = {
  verification_seal: "CONFIRMED_VALID", status: "PASS", verificationSource: "PROVIDER",
  checks: [{ id: "math", name: "Math", status: "PASS", details: "ok" }], discrepancies: [],
} as any;
const blocked = evaluateMathGate(problem("sqrt(x+6)=x"), solution(["-2"]), {
  ...providerPass,
  deterministicVerification: radicalBoth,
} as any);
assert.equal(blocked.allowed, false);

console.log("PHASE 4B.3 domain and extraneous-root tests passed");