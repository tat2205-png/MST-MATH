import assert from "node:assert/strict";
import { EngineRegistry } from "../server/studio/engineRegistry.js";
import { StudioMathExecutionAdapter, type StudioMathServices } from "../server/studio/mathExecutionAdapter.js";
import { StudioOrchestrator } from "../server/studio/studioOrchestrator.js";
import type { MathProblemIR, MathSolution, MathVerification } from "../src/types/mathSchema.js";

const flags = { integrationCanary: true, imageAnimation: false, luaDraw: false, depthTwoPointFiveD: false, blender: false, generativeMotion: false };
const problem = { status: "PASS", latex: "2x-4=0", topic: "Linear equation" } as MathProblemIR;
const solution = { final_answer: { value: "x=2", latex: "x=2" } } as MathSolution;
const verification = { status: "PASS", verification_seal: "CONFIRMED_VALID", deterministicVerification: { status: "DETERMINISTIC_PASS" } } as MathVerification;
let parsed = 0;
let solved = 0;
let verified = 0;
const services: StudioMathServices = {
  async parse() { parsed += 1; return problem; },
  async solve() { solved += 1; return solution; },
  async verify() { verified += 1; return verification; },
  gate() { return { allowed: true, status: "VERIFIED_PASS", reasons: [] }; },
};
const execute = (adapter: StudioMathExecutionAdapter) => new StudioOrchestrator(new EngineRegistry(), flags, adapter)
  .executeTask({ task: "math.solve", input: { text: "2x-4=0" }, requestedCapabilities: ["math.solve"] });

const result = await execute(new StudioMathExecutionAdapter(services));
assert.equal(result.success, true);
assert.deepEqual([parsed, solved, verified], [1, 1, 1]);
assert.deepEqual(result.trace.map((entry) => entry.stage), ["VALIDATE", "PLAN", "ROUTE_MATH", "PARSE", "SOLVE", "VERIFY", "RESULT"]);
assert.equal(result.artifacts[0].kind, "math-execution");
assert.equal(result.artifacts[0].input, "2x-4=0");
assert.deepEqual(result.artifacts[0].result, { value: "x=2", latex: "x=2" });
assert.equal(JSON.stringify(result).includes("2x + 3 = 7"), false);

const rejected = await execute(new StudioMathExecutionAdapter({ ...services, gate: () => ({ allowed: false, status: "BLOCKED", reasons: ["rejected"] }) }));
assert.equal(rejected.success, false);
assert.equal(rejected.error?.code, "VERIFICATION_FAILED");
assert.equal(rejected.trace.some((entry) => entry.stage === "VERIFY" && entry.status === "FAIL"), true);
console.log("MATH_SOLVER_INVOKED_QA=PASS");
console.log("MATH_VERIFIER_INVOKED_QA=PASS");
console.log("NO_FIXTURE_RESULT_QA=PASS");
console.log("MATH_RESULT_CONTRACT_QA=PASS");
console.log("VERIFIER_REJECTION_QA=PASS");
