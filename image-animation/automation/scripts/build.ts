import process from "node:process";
import { selectAgent } from "../agents/providerSelection.ts";

const taskId = process.argv[2];
const repairMode = process.argv.includes("--repair");
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { CodexCodingAgentAdapter } from "../agents/codexAgent.ts";
import { TaskExecutionSandbox } from "../agents/taskSandbox.ts";
import { loadTaskSpec } from "../orchestrator/orchestrator.ts";
import { applyPatchTransaction, validatePatch } from "../gates/patchTransaction.ts";
import { captureGitSnapshot } from "../agents/taskSandbox.ts";
import { evaluateRepositoryGuard } from "../gates/repositoryGuard.ts";

const root = process.cwd();
const provider = process.env.IA_AGENT_PROVIDER ?? "none";
if (!taskId) { console.error("Usage: npm run ia:build -- <TASK_ID>"); process.exit(2); }

const spec = loadTaskSpec(root, taskId);
const branch = execFileSync("git", ["branch", "--show-current"], { cwd: root, encoding: "utf8" }).trim();
if (branch !== spec.expectedBranch) { console.log(JSON.stringify({ TASK: taskId, AGENT_EXECUTION: "BLOCKED", FINAL: "BLOCKED", BLOCKERS: ["Wrong branch"] })); process.exit(1); }
if (provider === "none") { console.log(JSON.stringify({ TASK: taskId, PROVIDER: "none", AGENT_EXECUTION: "DISABLED", FINAL: "BLOCKED" })); process.exit(1); }
if (provider !== "codex") { console.log(JSON.stringify({ TASK: taskId, PROVIDER: provider, AGENT_EXECUTION: "BLOCKED", FINAL: "BLOCKED" })); process.exit(1); }

const selected = selectAgent("codex");
if (!(selected instanceof CodexCodingAgentAdapter)) { console.log(JSON.stringify({ TASK: taskId, PROVIDER: provider, AGENT_EXECUTION: "NOT_AVAILABLE", FINAL: "BLOCKED" })); process.exit(1); }
const sandbox = new TaskExecutionSandbox(root, spec.expectedBranch, spec);
const mutationMode = "HOST_APPLIED_PATCH";
const attemptValue = repairMode ? Number(process.argv[process.argv.indexOf("--repair") + 1] ?? "1") : 1;
const evidence = await sandbox.executeAsync(selected, taskId, attemptValue, [], repairMode ? "REPAIR" : "IMPLEMENT", mutationMode);
const proposal = validatePatch(root, spec, evidence.result.fileEdits);
const patchApplication = proposal.status === "PASS" ? applyPatchTransaction(root, proposal.edits) : { status: "FAIL" as const, changedFiles: [], error: proposal.violations.join("; ") };
const appliedAfter = captureGitSnapshot(root);
const actualAgentDelta = appliedAfter.changedFiles.filter((file) => evidence.before.fingerprints[file] !== appliedAfter.fingerprints[file]);
const postApplyGuard = evaluateRepositoryGuard(actualAgentDelta, spec);
const canaryPath = path.join(root, "image-animation", "fixtures", "agent-canary", "canary.txt");
const canaryPass = taskId !== "IA-CANARY-001" || readFileSync(canaryPath, "utf8").trim() === "AFTER";
const final = evidence.blockers.length === 0 && evidence.result.status === "COMPLETED" && proposal.status === "PASS" && patchApplication.status === "PASS" && postApplyGuard.status === "PASS" && canaryPass ? "PASS" : "FAIL";
console.log(JSON.stringify({ TASK: taskId, PROVIDER: provider, AGENT_EXECUTION: evidence.result.status, AGENT_MUTATION_MODE: mutationMode, FINAL: final, BEFORE: evidence.before, AFTER: appliedAfter, REPOSITORY_GUARD: postApplyGuard.status, PATCH_VALIDATION: proposal.status, PATCH_APPLICATION: patchApplication.status, ACTUAL_AGENT_DELTA: actualAgentDelta, BLOCKERS: [...evidence.blockers, ...postApplyGuard.violations], CANARY_ASSERTION: canaryPass, EXECUTION_EVIDENCE: evidence.result.executionEvidence }, null, 2));
process.exit(final === "PASS" ? 0 : 1);
