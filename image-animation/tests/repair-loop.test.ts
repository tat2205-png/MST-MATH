import assert from "node:assert/strict";
import { DeterministicFakeRepairExecutor } from "../automation/orchestrator/repairExecutor.ts";
import { runOrchestrator, StateMachine, validateTaskSpec, type GateStatus, type RepairResult } from "../automation/orchestrator/orchestrator.ts";

const root = process.cwd();
const changedFiles = ["image-animation/automation/repair-target.ts"];
const pass = { "IA-G1": "PASS", "IA-G2": "PASS", "IA-G9": "PASS" } as Record<string, GateStatus>;
const fail = { "IA-G1": "FAIL", "IA-G2": "PASS", "IA-G9": "PASS" } as Record<string, GateStatus>;
function scenario(results: RepairResult[], gateResults: Record<string, GateStatus>[]) {
  let qaRuns = 0;
  const executor = new DeterministicFakeRepairExecutor(results);
  const report = runOrchestrator({
    root, taskId: "IA-0A.3", branch: "feature/image-animation-foundation", changedFiles,
    repairExecutor: executor, runGates: () => gateResults[Math.min(qaRuns++, gateResults.length - 1)],
  });
  return { report, executor, qaRuns };
}
const changed: RepairResult = { status: "CHANGED", changedFiles, summary: "scoped deterministic test repair" };
const failed: RepairResult = { status: "FAILED", changedFiles: [], summary: "repair failed" };

assert.equal(scenario([], [pass]).report.REPAIR_COUNT, 0, "PASS task performs zero repairs");
let result = scenario([changed], [fail, pass]);
assert.equal(result.executor.requests.length, 1, "failed gate triggers repair attempt 1");
assert.equal(result.report.FINAL, "PASS", "repair succeeds on attempt 1");
assert.equal(result.report.REPAIR_ATTEMPTS[0].failureEvidence[0].gateId, "IA-G1", "failure evidence propagates");
assert.equal(result.qaRuns, 2, "QA reruns after repair");
result = scenario([failed, changed], [fail, fail, pass]);
assert.equal(result.report.FINAL, "PASS", "attempt 2 can succeed");
result = scenario([failed, failed, changed], [fail, fail, fail, pass]);
assert.equal(result.report.FINAL, "PASS", "attempt 3 can succeed");
result = scenario([failed, failed, failed, changed], [fail, fail, fail, fail]);
assert.equal(result.report.FINAL, "REPAIR_EXHAUSTED", "three failures exhaust repair");
assert.equal(result.executor.requests.length, 3, "attempt 4 can never execute");
assert.equal(result.report.REPAIR_COUNT, 3, "repair count is accurate");
assert.equal(result.report.REPAIR_ATTEMPTS.length, 3, "every attempt is reported");
result = scenario([changed], [fail, pass]);
assert.equal(result.report.REPAIR_ATTEMPTS[0].repositoryGuard.status, "PASS", "guard runs after repair");
assert.equal(result.report.REPAIR_ATTEMPTS[0].qaAfterRepair["IA-G1"], "PASS", "QA result is recorded after repair");
result = scenario([{ status: "CHANGED", changedFiles: ["server/index.ts"], summary: "fixed" }], [fail]);
assert.equal(result.report.FINAL, "BLOCKED", "forbidden path blocks");
result = scenario([{ status: "CHANGED", changedFiles: ["image-animation/core/scene.ts"], summary: "fixed" }], [fail]);
assert.equal(result.report.FINAL, "BLOCKED", "architecture path blocks");
result = scenario([{ status: "CHANGED", changedFiles: ["image-animation/tests/repair-loop.test.ts"], summary: "weakened" }], [fail]);
assert.equal(result.report.FINAL, "BLOCKED", "protected test mutation blocks");
result = scenario([{ status: "CHANGED", changedFiles, summary: "claims fixed" }], [fail, fail, fail, fail]);
assert.equal(result.report.FINAL, "REPAIR_EXHAUSTED", "executor cannot declare final PASS");
const dryExecutor = new DeterministicFakeRepairExecutor([changed]);
const dry = runOrchestrator({ root, taskId: "IA-0A.3", branch: "feature/image-animation-foundation", changedFiles, dryRun: true, repairExecutor: dryExecutor, runGates: () => fail });
assert.equal(dryExecutor.requests.length, 0, "dry run executes zero repairs");
assert.equal(dry.REPAIR_COUNT, 0, "dry run repair count is zero");
assert.throws(() => validateTaskSpec({}), /missing required fields/, "invalid task is rejected");
assert.throws(() => validateTaskSpec({ id: "IA-X", title: "x", phase: "x", goal: "x", allowedPaths: ["x"], forbiddenPaths: [], requirements: ["x"], requiredTests: ["x"], maxRepairAttempts: 4, architectureChangeAllowed: false, expectedBranch: "x" }), /exactly 3/);
assert.throws(() => validateTaskSpec({ id: "IA-X", title: "x", phase: "x", goal: "x", allowedPaths: ["x"], forbiddenPaths: [], requirements: ["x"], requiredTests: ["x"], maxRepairAttempts: 3, architectureChangeAllowed: true, expectedBranch: "x" }), /approval/);
const machine = new StateMachine();
assert.throws(() => machine.transition("PASS"), /Invalid orchestrator transition/);
assert.deepEqual(Object.keys(scenario([], [pass]).report), ["TASK", "STATUS", "FILES_ADDED", "FILES_MODIFIED", "GATES", "REPAIR_ENGINE", "REPAIR_ALLOWED", "REPAIR_COUNT", "MAX_AUTO_REPAIR", "LAST_FAILURE", "REPAIR_ATTEMPTS", "repairEngine", "repairAllowed", "repairCount", "maxRepairAttempts", "repairAttempts", "BLOCKERS", "FINAL", "DRY_RUN"]);
console.log("Repair loop tests: 19/19 passed");