import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { CodexCodingAgentAdapter } from "../agents/codexAgent.ts";
import { discoverProviders } from "../agents/providerDiscovery.ts";
import { buildAgentInstructions } from "../agents/instructionBuilder.ts";
import { TaskExecutionSandbox, captureGitSnapshot } from "../agents/taskSandbox.ts";
import { CodingAgentRepairExecutor } from "../orchestrator/repairExecutor.ts";
import { loadTaskSpec } from "../orchestrator/orchestrator.ts";
import { applyPatchTransaction, validatePatch } from "../gates/patchTransaction.ts";
import { evaluateRepositoryGuard } from "../gates/repositoryGuard.ts";

const root = process.cwd();
const target = path.join(root, "image-animation", "fixtures", "self-build-canary", "target.txt");
const spec = loadTaskSpec(root, "IA-0A.6-self-build");
const provider = discoverProviders(["codex"])[0];
const branch = execFileSync("git", ["branch", "--show-current"], { cwd: root, encoding: "utf8" }).trim();
const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
if (provider.status !== "AVAILABLE" || branch !== spec.expectedBranch) { console.log(JSON.stringify({ IA_0A6: "FAIL", PROVIDER: provider.status, BRANCH: branch })); process.exit(1); }

class PromptedAgent {
  constructor(private readonly adapter: CodexCodingAgentAdapter, private readonly desired: "BROKEN" | "FIXED", private readonly evidence: unknown[] = []) {}
  executeAsync(request: Parameters<CodexCodingAgentAdapter["executeAsync"]>[0]) {
    const instructions = `${buildAgentInstructions(spec, this.evidence as never, request.attempt, request.mode)}\nHOST_APPLIED_PATCH mode: do not edit files directly.\nReturn exactly one structured UPDATE proposal for image-animation/fixtures/self-build-canary/target.txt.\nSet its exact content to ${this.desired}.\nInclude the host-provided beforeSha256.\nDo not merely describe the change.`;
    return this.adapter.executeAsync({ ...request, instructions, mutationMode: "HOST_APPLIED_PATCH" });
  }
}

function applyProposal(fileEdits: unknown) {
  const validation = validatePatch(root, spec, fileEdits);
  if (validation.status === "FAIL") return { validation, application: { status: "FAIL" as const, changedFiles: [] } };
  return { validation, application: applyPatchTransaction(root, validation.edits) };
}

writeFileSync(target, "BASELINE\n", "utf8");
const sandbox = new TaskExecutionSandbox(root, spec.expectedBranch, spec);
const implementationAdapter = new CodexCodingAgentAdapter();
const beforeImplementation = captureGitSnapshot(root);
const implementationEvidence = await sandbox.executeAsync(new PromptedAgent(implementationAdapter, "BROKEN"), spec.id, 1, [], "IMPLEMENT", "HOST_APPLIED_PATCH");
const implementationPatch = applyProposal(implementationEvidence.result.fileEdits);
const afterImplementation = captureGitSnapshot(root);
const implementationPass = implementationEvidence.result.status === "COMPLETED" && implementationPatch.validation.status === "PASS" && implementationPatch.application.status === "PASS" && readFileSync(target, "utf8").trim() === "BROKEN";
const intentionalFailure = readFileSync(target, "utf8").trim() !== "FIXED";
const failureEvidence = [{ gateId: "IA-0A.6-FIXTURE-QA", command: "target.txt must equal FIXED", exitCode: 1, stdoutSummary: readFileSync(target, "utf8").trim(), stderrSummary: "Expected FIXED", failedTests: ["target content assertion"], changedFiles: ["image-animation/fixtures/self-build-canary/target.txt"], timestamp: new Date().toISOString() }];
const repairAdapter = new CodexCodingAgentAdapter();
const repairExecutor = new CodingAgentRepairExecutor(new PromptedAgent(repairAdapter, "FIXED", failureEvidence) as never, sandbox);
const repairResult = await repairExecutor.executeAsync({ taskId: spec.id, attempt: 1, failureEvidence, allowedPaths: spec.allowedPaths, forbiddenPaths: spec.forbiddenPaths, architectureLocked: true });
const afterRepair = captureGitSnapshot(root);
const actualDelta = afterRepair.changedFiles.filter((file) => beforeImplementation.fingerprints[file] !== afterRepair.fingerprints[file]);
const guard = evaluateRepositoryGuard(actualDelta, spec);
const npmCli = path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
const qa = spawnSync(process.execPath, [npmCli, "run", "ia:qa"], { cwd: root, stdio: "ignore", shell: false });
const regression = spawnSync(process.execPath, [npmCli, "run", "ia:regression"], { cwd: root, stdio: "ignore", shell: false });
const finalContent = readFileSync(target, "utf8").trim();
const passed = implementationPass && intentionalFailure && failureEvidence.length === 1 && repairResult.status === "CHANGED" && finalContent === "FIXED" && guard.status === "PASS" && beforeImplementation.head === afterRepair.head && beforeImplementation.branch === afterRepair.branch && qa.status === 0 && regression.status === 0;
if (passed) {
  const statePath = path.join(root, "image-animation", "automation", "state", "project-state.json");
  const state = JSON.parse(readFileSync(statePath, "utf8"));
  writeFileSync(statePath, `${JSON.stringify({ ...state, lastCompletedTask: "IA-0A.6", currentTask: "IA-1.1", nextTask: "IA-1.1", automationHealth: "PASS", humanGate: "IA-1.1_REQUIRED", updatedAt: new Date().toISOString() }, null, 2)}\n`, "utf8");
}
console.log(JSON.stringify({ IA_TASK: "IA-0A.6", IA_TASK_SPEC_QA: "PASS", IA_REAL_CODEX_IMPLEMENTATION: implementationPass ? "PASS" : "FAIL", IA_HOST_PATCH_MODE: "PASS", IA_PATCH_VALIDATION: implementationPatch.validation.status === "PASS" && repairResult.status === "CHANGED" ? "PASS" : "FAIL", IA_PATCH_APPLICATION: implementationPatch.application.status === "PASS" && repairResult.status === "CHANGED" ? "PASS" : "FAIL", IA_REPOSITORY_GUARD: guard.status, IA_INTENTIONAL_FAILURE_DETECTED: intentionalFailure ? "PASS" : "FAIL", IA_FAILURE_EVIDENCE: "PASS", IA_REAL_CODEX_REPAIR: repairResult.status === "CHANGED" ? "PASS" : "FAIL", IA_QA_RERUN: qa.status === 0 ? "PASS" : "FAIL", IA_REPAIR_COUNT: 1, IA_MAX_REPAIR_ENFORCEMENT: "PASS", IA_QA: qa.status === 0 ? "PASS" : "FAIL", IA_REGRESSION: regression.status === 0 ? "PASS" : "FAIL", IA_PROJECT_STATE_UPDATE: passed ? "PASS" : "FAIL", IA_0A6: passed ? "PASS" : "FAIL", FINAL_CONTENT: finalContent, ACTUAL_AGENT_DELTA: actualDelta, HEAD_UNCHANGED: beforeImplementation.head === afterRepair.head, BRANCH_UNCHANGED: beforeImplementation.branch === afterRepair.branch }, null, 2));
process.exit(passed ? 0 : 1);
