import assert from "node:assert/strict";
import { deterministicInequalityVerifier } from "../server/services/deterministicInequalityVerifier.js";
import { evaluateMathGate } from "../server/services/mathVerificationGate.js";

const problem = (latex: string) => ({
  status: "PASS", problem: latex, originalText: latex, normalizedText: latex, latex,
  domain: "Đại số & Giải tích", topic: "Bất phương trình", grade: "Lớp 10",
  given: [], find: ["x"], entities: [], constraints: ["x \\in \\mathbb{R}"], ambiguities: [], confidence: 1,
  provenance: [{ id: "source", kind: "SOURCE_LITERAL", value: latex, sourceField: "text", trustedForAutomation: true }],
} as any);
const candidate = (intervals: any[]) => ({ verification_data: { solutionSet: { intervals } } } as any);
const openLeft = (right: string, rightClosed = false) => ({ left: "-INF", right, leftClosed: false, rightClosed });
const openRight = (left: string, leftClosed = false) => ({ left, right: "+INF", leftClosed, rightClosed: false });

assert.equal(deterministicInequalityVerifier.verify(problem("2x-4>0"), candidate([openRight("2")])).status, "DETERMINISTIC_PASS");
assert.equal(deterministicInequalityVerifier.verify(problem("-2x+4>0"), candidate([openLeft("2")])).status, "DETERMINISTIC_PASS");
assert.equal(deterministicInequalityVerifier.verify(problem("-2x+4>0"), candidate([openRight("2")])).status, "DETERMINISTIC_FAIL");
assert.equal(deterministicInequalityVerifier.verify(problem("x^2-5x+6>0"), candidate([openLeft("2"), openRight("3")])).status, "DETERMINISTIC_PASS");
assert.equal(deterministicInequalityVerifier.verify(problem("x^2-5x+6<=0"), candidate([{ left: "2", right: "3", leftClosed: true, rightClosed: true }])).status, "DETERMINISTIC_PASS");
assert.equal(deterministicInequalityVerifier.verify(problem("x^2-5x+6<0"), candidate([{ left: "2", right: "3", leftClosed: true, rightClosed: true }])).status, "DETERMINISTIC_FAIL");
assert.equal(deterministicInequalityVerifier.verify(problem("x^2+1>0"), candidate([{ left: "-INF", right: "+INF", leftClosed: false, rightClosed: false }])).status, "DETERMINISTIC_PASS");
assert.equal(deterministicInequalityVerifier.verify(problem("x^2+1<0"), candidate([])).status, "DETERMINISTIC_PASS");
assert.equal(deterministicInequalityVerifier.verify(problem("(x+1)/(x-2)>0"), candidate([openLeft("-1"), openRight("2")])).status, "DETERMINISTIC_PASS");
assert.equal(deterministicInequalityVerifier.verify(problem("(x+1)/(x-2)>0"), candidate([openLeft("-1"), { left: "2", right: "+INF", leftClosed: true, rightClosed: false }])).status, "DETERMINISTIC_FAIL");
assert.equal(deterministicInequalityVerifier.verify(problem("(x+1)/(x-2)>=0"), candidate([openLeft("-1", true), openRight("2")])).status, "DETERMINISTIC_PASS");
assert.equal(deterministicInequalityVerifier.verify(problem("sin(x)>0"), candidate([openLeft("0")])).status, "UNSUPPORTED");
assert.equal(deterministicInequalityVerifier.verify(problem("x^2-m*x+1>0"), candidate([openLeft("0")])).status, "UNSUPPORTED");

const providerPass = { verification_seal: "CONFIRMED_VALID", status: "PASS", checks: [{ id: "x", name: "x", status: "PASS", details: "ok" }], discrepancies: [] } as any;
const failed = deterministicInequalityVerifier.verify(problem("2x-4>0"), candidate([openLeft("2")]));
assert.equal(evaluateMathGate(problem("2x-4>0"), candidate([openLeft("2")]), { ...providerPass, deterministicVerification: failed } as any).allowed, false);

console.log("PHASE 4C.1 inequality tests passed");
