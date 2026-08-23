import assert from "node:assert/strict";
import { deterministicLinearSystemVerifier } from "../server/services/deterministicLinearSystemVerifier.js";
import { evaluateMathGate } from "../server/services/mathVerificationGate.js";

const problem = (latex: string) => ({
  status: "PASS",
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
const solution = (systemSolution: Record<string, string>) => ({ verification_data: { systemSolution } } as any);

assert.deepEqual(deterministicLinearSystemVerifier.verify(problem("x+y=5;x-y=1"), solution({ type: "POINT", x: "3", y: "2" })).systemSolution, { type: "POINT", x: "3", y: "2" });
assert.equal(deterministicLinearSystemVerifier.verify(problem("x+y=5;x-y=1"), solution({ type: "POINT", x: "3", y: "2" })).status, "DETERMINISTIC_PASS");
assert.equal(deterministicLinearSystemVerifier.verify(problem("2x+3y=1;5x-2y=8"), solution({ type: "POINT", x: "26/19", y: "-11/19" })).status, "DETERMINISTIC_PASS");
assert.equal(deterministicLinearSystemVerifier.verify(problem("3x+2y=1;5x-4y=7"), solution({ type: "POINT", x: "9/11", y: "-8/11" })).status, "DETERMINISTIC_PASS");
assert.equal(deterministicLinearSystemVerifier.verify(problem("x+y=-1;2x-y=-5"), solution({ type: "POINT", x: "-2", y: "1" })).status, "DETERMINISTIC_PASS");
assert.equal(deterministicLinearSystemVerifier.verify(problem("2x+y=2;x-y=0"), solution({ type: "POINT", x: "2/3", y: "2/3" })).status, "DETERMINISTIC_PASS");
assert.equal(deterministicLinearSystemVerifier.verify(problem("0x+y=4;x+0y=3"), solution({ type: "POINT", x: "3", y: "4" })).status, "DETERMINISTIC_PASS");
assert.equal(deterministicLinearSystemVerifier.verify(problem("0x+2y=6;3x+0y=9"), solution({ type: "POINT", x: "3", y: "3" })).status, "DETERMINISTIC_PASS");
assert.equal(deterministicLinearSystemVerifier.verify(problem("0x+0y=0;x+0y=3"), solution({ type: "INFINITE_SOLUTIONS" })).status, "DETERMINISTIC_PASS");
assert.equal(deterministicLinearSystemVerifier.verify(problem("0x+0y=4;0x+0y=0"), solution({ type: "NO_SOLUTION" })).status, "DETERMINISTIC_PASS");
assert.equal(deterministicLinearSystemVerifier.verify(problem("0=0;0=0"), solution({ type: "INFINITE_SOLUTIONS" })).status, "DETERMINISTIC_PASS");
assert.equal(deterministicLinearSystemVerifier.verify(problem("x+y=2;2x+2y=5"), solution({ type: "NO_SOLUTION" })).status, "DETERMINISTIC_PASS");
assert.equal(deterministicLinearSystemVerifier.verify(problem("x+y=2;2x+2y=4"), solution({ type: "INFINITE_SOLUTIONS" })).status, "DETERMINISTIC_PASS");
assert.equal(deterministicLinearSystemVerifier.verify(problem("2x+2y=4;x+y=2"), solution({ type: "INFINITE_SOLUTIONS" })).status, "DETERMINISTIC_PASS");
assert.equal(deterministicLinearSystemVerifier.verify(problem("2x+2y=4;4x+4y=9"), solution({ type: "NO_SOLUTION" })).status, "DETERMINISTIC_PASS");
assert.equal(deterministicLinearSystemVerifier.verify(problem("x=3;y=4"), solution({ type: "POINT", x: "3", y: "4" })).status, "DETERMINISTIC_PASS");
assert.equal(deterministicLinearSystemVerifier.verify(problem("x+y=5;x-y=1"), solution({ type: "POINT", x: "2", y: "3" })).status, "DETERMINISTIC_FAIL");
assert.equal(deterministicLinearSystemVerifier.verify(problem("x+y=5;x-y=1"), solution({ type: "POINT", x: "3", y: "2", extra: "0" })).status, "DETERMINISTIC_FAIL");
assert.equal(deterministicLinearSystemVerifier.verify(problem("x+y=5;x-y=1"), solution({ type: "NO_SOLUTION" })).status, "DETERMINISTIC_FAIL");
assert.equal(deterministicLinearSystemVerifier.verify(problem("x+y=5;x-y=1"), solution({ type: "POINT", x: "4", y: "1" })).status, "DETERMINISTIC_FAIL");
assert.equal(deterministicLinearSystemVerifier.verify(problem("x+y=5;x-y=1"), solution({ type: "POINT", x: "2", y: "1" })).status, "DETERMINISTIC_FAIL");
assert.equal(deterministicLinearSystemVerifier.verify(problem("x+y=5;x-y=1"), solution({ type: "POINT", x: "3", y: "3" })).status, "DETERMINISTIC_FAIL");
assert.equal(deterministicLinearSystemVerifier.verify(problem("x+y=5;x-y=1"), solution({ type: "POINT", x: "3", y: "2/1" })).status, "DETERMINISTIC_PASS");
for (const source of ["x^2+y=2;x-y=0", "x+y+z=2;x-y=0", "mx+y=2;x-y=0", "x+y=2", "x+y=2;;x-y=0", "x+y==2;x-y=0"]) {
  assert.equal(deterministicLinearSystemVerifier.verify(problem(source), solution({ type: "NO_SOLUTION" })).status, "UNSUPPORTED");
}
assert.equal(deterministicLinearSystemVerifier.verify({ latex: "" } as any, solution({ type: "NO_SOLUTION" })).status, "INVALID_INPUT");

const deterministic = deterministicLinearSystemVerifier.verify(problem("x+y=5;x-y=1"), solution({ type: "POINT", x: "3", y: "2" }));
const report = {
  verification_seal: "CONFIRMED_VALID",
  status: "PASS",
  checks: [{ id: "math", name: "Math", status: "PASS", details: "ok" }],
  discrepancies: [],
  deterministicVerification: deterministic,
} as any;
assert.equal(evaluateMathGate(problem("x+y=5;x-y=1"), solution({ type: "POINT", x: "3", y: "2" }), report).allowed, true);
assert.equal(evaluateMathGate(problem("x+y=5;x-y=2"), solution({ type: "POINT", x: "3", y: "2" }), report).allowed, false);
assert.equal(evaluateMathGate(problem("x+y=5;x-y=1"), solution({ type: "POINT", x: "3", y: "2" }), { ...report, deterministicVerification: { ...deterministic, provenance: [{ id: "source_equation_1", kind: "SOURCE_LITERAL", value: "wrong", sourceField: "problemIR.latex", trustedForAutomation: true }, ...deterministic.provenance!.slice(1)] } }).allowed, false);
assert.equal(evaluateMathGate(problem("x+y=5;x-y=1"), solution({ type: "POINT", x: "3", y: "2" }), { ...report, deterministicVerification: { ...deterministic, status: "DETERMINISTIC_PASS", systemSolution: { type: "POINT", x: "99", y: "99" } } }).allowed, false);
assert.equal(evaluateMathGate(problem("x+y=5;x-y=1"), solution({ type: "POINT", x: "3", y: "2" }), { ...report, deterministicVerification: { ...deterministic, status: "INVALID_INPUT" } }).allowed, false);
assert.equal(evaluateMathGate(problem("x+y=5;x-y=1"), solution({ type: "POINT", x: "3", y: "2" }), { ...report, deterministicVerification: { ...deterministic, status: "UNSUPPORTED" } }).allowed, false);

console.log("PHASE 4C.2 deterministic 2x2 linear system tests passed");
