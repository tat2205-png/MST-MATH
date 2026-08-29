import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { runOrchestrator, StateMachine, validateTaskSpec, type GateStatus } from "../automation/orchestrator/orchestrator.ts";

const root = process.cwd();
const allowed = ["image-animation/automation/new.ts"];
const gates = (status: GateStatus) => () => ({ "IA-G1": status, "IA-G2": status, "IA-G9": status });
const run = (overrides: Partial<Parameters<typeof runOrchestrator>[0]> = {}) => runOrchestrator({
  root, taskId: "IA-0A.2", branch: "feature/image-animation-foundation", changedFiles: allowed, runGates: gates("PASS"), ...overrides,
});

assert.equal(run().FINAL, "PASS", "valid task loads and allowed paths proceed");
assert.throws(() => validateTaskSpec({}), /missing required fields/, "invalid task fails");
assert.throws(() => runOrchestrator({ root, taskId: "IA-0A.99", branch: "feature/image-animation-foundation", changedFiles: [], runGates: gates("PASS") }), /not found/, "missing task fails");
assert.equal(run({ branch: "main" }).FINAL, "BLOCKED", "wrong branch blocks");
assert.equal(run({ changedFiles: ["server/index.ts"] }).FINAL, "BLOCKED", "forbidden path blocks");
assert.equal(run({ runGates: gates("FAIL") }).FINAL, "FAIL", "failed gate gives FAIL");
assert.equal(run().FINAL, "PASS", "successful gates give PASS");
const dry = run({ dryRun: true });
assert.equal(dry.DRY_RUN, true, "dry run is marked and does not write source");
assert.throws(() => validateTaskSpec({ ...JSON.parse(readFileSync(path.join(root, "image-animation/automation/specs/IA-0A.2.json"), "utf8")), maxRepairAttempts: 4 }), /exactly 3/);
assert.throws(() => validateTaskSpec({ ...JSON.parse(readFileSync(path.join(root, "image-animation/automation/specs/IA-0A.2.json"), "utf8")), architectureChangeAllowed: true }), /approval/);
const machine = new StateMachine();
assert.throws(() => machine.transition("PASS"), /Invalid orchestrator transition/);
assert.equal(run({ runGates: gates("FAIL") }).FINAL, "FAIL");
assert.equal(run().FINAL, "PASS");
assert.deepEqual(Object.keys(run()), ["TASK", "STATUS", "FILES_ADDED", "FILES_MODIFIED", "GATES", "REPAIR_ENGINE", "REPAIR_ALLOWED", "REPAIR_COUNT", "MAX_AUTO_REPAIR", "LAST_FAILURE", "REPAIR_ATTEMPTS", "repairEngine", "repairAllowed", "repairCount", "maxRepairAttempts", "repairAttempts", "BLOCKERS", "FINAL", "DRY_RUN"]);
const temp = mkdtempSync(path.join(os.tmpdir(), "ia-orchestrator-"));
writeFileSync(path.join(temp, "marker"), "unchanged");
assert.equal(readFileSync(path.join(temp, "marker"), "utf8"), "unchanged", "dry run leaves source unchanged");
console.log("Orchestrator tests: 14/14 passed");