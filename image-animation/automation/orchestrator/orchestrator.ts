import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { evaluateRepositoryGuard, type RepositoryGuardResult } from "../gates/repositoryGuard.ts";

export type OrchestratorState = "PENDING" | "PREFLIGHT" | "RUNNING" | "QA_RUNNING" | "REPAIR_PENDING" | "REPAIR_RUNNING" | "REPAIR_VALIDATING" | "PASS" | "FAIL" | "BLOCKED" | "REPAIR_EXHAUSTED";
export type GateStatus = "PASS" | "FAIL" | "NOT_AVAILABLE";
export interface TaskSpec { id: string; title: string; phase: string; goal: string; allowedPaths: string[]; forbiddenPaths: string[]; requirements: string[]; requiredTests: string[]; requiredGates?: string[]; protectedPaths?: string[]; architectureProtectedPaths?: string[]; maxRepairAttempts: number; architectureChangeAllowed: boolean; expectedBranch: string; }
export interface FailureEvidence { gateId: string; command: string; exitCode: number | null; stdoutSummary: string; stderrSummary: string; failedTests: string[]; changedFiles: string[]; timestamp: string; }
export interface RepairRequest { taskId: string; attempt: number; failureEvidence: FailureEvidence[]; allowedPaths: string[]; forbiddenPaths: string[]; architectureLocked: boolean; }
export interface RepairResult { status: "CHANGED" | "NO_CHANGE" | "FAILED"; changedFiles: string[]; summary: string; }
export interface RepairExecutor { execute(request: RepairRequest): RepairResult; }
export interface RepairAttemptReport { attempt: number; triggerGate: string; failureEvidence: FailureEvidence[]; changedFiles: string[]; repositoryGuard: RepositoryGuardResult; qaAfterRepair: Record<string, GateStatus>; result: RepairResult["status"]; }
export interface OrchestratorReport { TASK: string; STATUS: OrchestratorState; FILES_ADDED: string[]; FILES_MODIFIED: string[]; GATES: Record<string, GateStatus>; REPAIR_ENGINE: string; REPAIR_ALLOWED: boolean; REPAIR_COUNT: number; MAX_AUTO_REPAIR: number; LAST_FAILURE: string | null; REPAIR_ATTEMPTS: RepairAttemptReport[]; repairEngine: string; repairAllowed: boolean; repairCount: number; maxRepairAttempts: number; repairAttempts: RepairAttemptReport[]; BLOCKERS: string[]; FINAL: OrchestratorState; DRY_RUN: boolean; }

const transitions: Record<OrchestratorState, OrchestratorState[]> = {
  PENDING: ["PREFLIGHT", "BLOCKED"], PREFLIGHT: ["RUNNING", "FAIL", "BLOCKED"], RUNNING: ["QA_RUNNING", "FAIL", "BLOCKED"],
  QA_RUNNING: ["PASS", "FAIL", "REPAIR_PENDING", "BLOCKED"], REPAIR_PENDING: ["REPAIR_RUNNING", "REPAIR_EXHAUSTED", "BLOCKED"],
  REPAIR_RUNNING: ["REPAIR_VALIDATING", "BLOCKED"], REPAIR_VALIDATING: ["QA_RUNNING", "PASS", "FAIL", "REPAIR_PENDING", "REPAIR_EXHAUSTED", "BLOCKED"],
  PASS: [], FAIL: [], BLOCKED: [], REPAIR_EXHAUSTED: [],
};

export class StateMachine {
  public state: OrchestratorState = "PENDING";
  transition(next: OrchestratorState): void { if (!transitions[this.state].includes(next)) throw new Error(`Invalid orchestrator transition: ${this.state} -> ${next}`); this.state = next; }
}

export function loadTaskSpec(root: string, taskId: string): TaskSpec {
  if (!/^IA-[A-Za-z0-9.-]+$/.test(taskId)) throw new Error(`Invalid task ID: ${taskId}`);
  let value: unknown;
  try { value = JSON.parse(readFileSync(path.join(root, "image-animation", "automation", "specs", `${taskId}.json`), "utf8")); } catch { throw new Error(`Task spec not found or invalid JSON: ${taskId}`); }
  validateTaskSpec(value); if ((value as TaskSpec).id !== taskId) throw new Error(`Task spec ID mismatch: ${taskId}`); return value as TaskSpec;
}

export function validateTaskSpec(value: unknown): asserts value is TaskSpec {
  const spec = value as Partial<TaskSpec> | null;
  const required = ["id", "title", "phase", "goal", "allowedPaths", "forbiddenPaths", "requirements", "requiredTests", "maxRepairAttempts", "architectureChangeAllowed", "expectedBranch"];
  if (!spec || required.some((key) => !(key in spec))) throw new Error("Task spec is missing required fields");
  if (spec.maxRepairAttempts !== 3) throw new Error("maxRepairAttempts must be exactly 3");
  if (spec.architectureChangeAllowed !== false) throw new Error("Architecture changes require explicit human approval");
  for (const key of ["allowedPaths", "forbiddenPaths", "requirements", "requiredTests"] as const) if (!Array.isArray(spec[key]) || spec[key].some((entry) => typeof entry !== "string" || entry.length === 0)) throw new Error(`${key} must be a non-empty string array`);
}

export interface OrchestratorOptions { root: string; taskId: string; branch: string; changedFiles: string[]; dryRun?: boolean; runGates: () => Record<string, GateStatus>; repairExecutor?: RepairExecutor; getRepairFiles?: (attempt: number, result: RepairResult) => string[]; }
function evidenceFor(gateId: string, changedFiles: string[], status: GateStatus): FailureEvidence { return { gateId, command: gateId, exitCode: status === "FAIL" ? 1 : null, stdoutSummary: "", stderrSummary: status === "FAIL" ? `${gateId} failed` : "", failedTests: [], changedFiles, timestamp: new Date().toISOString() }; }
function protectedViolation(files: string[], spec: TaskSpec): string | null {
  const protectedPaths = [...(spec.protectedPaths ?? []), ...(spec.architectureProtectedPaths ?? [])];
  const normalized = files.map((file) => file.replaceAll("\\", "/"));
  const match = normalized.find((file) => protectedPaths.some((pattern) => pattern.endsWith("/**") ? file.startsWith(pattern.slice(0, -3)) : file === pattern));
  return match ? `${match}: protected path modification` : null;
}

export function runOrchestrator(options: OrchestratorOptions): OrchestratorReport {
  const machine = new StateMachine(); const spec = loadTaskSpec(options.root, options.taskId);
  const repairEngine = options.repairExecutor ? "INJECTED" : "NOT_IMPLEMENTED";
  const repairAllowed = Boolean(options.repairExecutor) && !options.dryRun;
  const repairAttempts: RepairAttemptReport[] = [];
  const report: OrchestratorReport = { TASK: spec.id, STATUS: "PENDING", FILES_ADDED: options.changedFiles, FILES_MODIFIED: [], GATES: {}, REPAIR_ENGINE: repairEngine, REPAIR_ALLOWED: repairAllowed, REPAIR_COUNT: 0, MAX_AUTO_REPAIR: 3, LAST_FAILURE: null, REPAIR_ATTEMPTS: repairAttempts, repairEngine, repairAllowed, repairCount: 0, maxRepairAttempts: 3, repairAttempts, BLOCKERS: [], FINAL: "PENDING", DRY_RUN: options.dryRun === true };
  const fail = (state: "FAIL" | "BLOCKED" | "REPAIR_EXHAUSTED", reason: string): OrchestratorReport => { machine.transition(state); report.STATUS = state; report.FINAL = state; report.LAST_FAILURE = reason; report.BLOCKERS.push(reason); return report; };
  machine.transition("PREFLIGHT"); report.STATUS = "PREFLIGHT";
  if (options.branch !== spec.expectedBranch) return fail("BLOCKED", `Wrong branch: expected ${spec.expectedBranch}, got ${options.branch}`);
  const initialGuard = evaluateRepositoryGuard(options.changedFiles, spec); report.GATES["IA-G0"] = initialGuard.status;
  if (initialGuard.status === "FAIL") return fail("BLOCKED", initialGuard.violations.join("; "));
  machine.transition("RUNNING"); report.STATUS = "RUNNING";
  const requiredGates = spec.requiredGates ?? ["IA-G0"];
  const executeQa = () => { machine.transition("QA_RUNNING"); report.STATUS = "QA_RUNNING"; report.GATES = { ...report.GATES, ...options.runGates() }; };
  executeQa();
  while (true) {
    const failedGate = requiredGates.find((gate) => report.GATES[gate] !== "PASS");
    if (!failedGate) { machine.transition("PASS"); report.STATUS = "PASS"; report.FINAL = "PASS"; return report; }
    const evidence = [evidenceFor(failedGate, options.changedFiles, report.GATES[failedGate])];
    if (options.dryRun || !options.repairExecutor) return fail("FAIL", `${failedGate}=${report.GATES[failedGate] ?? "NOT_AVAILABLE"}`);
    if (report.REPAIR_COUNT >= spec.maxRepairAttempts) return fail("REPAIR_EXHAUSTED", "AUTO_REPAIR_EXHAUSTED");
    if (machine.state !== "REPAIR_PENDING") { machine.transition("REPAIR_PENDING"); report.STATUS = "REPAIR_PENDING"; }
    const attempt = report.REPAIR_COUNT + 1; machine.transition("REPAIR_RUNNING"); report.STATUS = "REPAIR_RUNNING";
    const request: RepairRequest = { taskId: spec.id, attempt, failureEvidence: evidence, allowedPaths: spec.allowedPaths, forbiddenPaths: spec.forbiddenPaths, architectureLocked: !spec.architectureChangeAllowed };
    const result = options.repairExecutor.execute(request); const changedFiles = options.getRepairFiles?.(attempt, result) ?? result.changedFiles;
    report.REPAIR_COUNT = attempt; report.repairCount = attempt; machine.transition("REPAIR_VALIDATING"); report.STATUS = "REPAIR_VALIDATING";
    const afterGuard = evaluateRepositoryGuard(changedFiles, spec); const protectionFailure = protectedViolation(changedFiles, spec);
    const qaAfterRepair = options.runGates();
    report.REPAIR_ATTEMPTS.push({ attempt, triggerGate: failedGate, failureEvidence: evidence, changedFiles, repositoryGuard: afterGuard, qaAfterRepair, result: result.status });
    if (protectionFailure) return fail("BLOCKED", protectionFailure);
    if (afterGuard.status === "FAIL") return fail("BLOCKED", afterGuard.violations.join("; "));
    report.GATES = { ...report.GATES, ...qaAfterRepair };
    if (!requiredGates.some((gate) => report.GATES[gate] !== "PASS")) { machine.transition("PASS"); report.STATUS = "PASS"; report.FINAL = "PASS"; return report; }
    if (report.REPAIR_COUNT >= spec.maxRepairAttempts) return fail("REPAIR_EXHAUSTED", "AUTO_REPAIR_EXHAUSTED");
    machine.transition("REPAIR_PENDING"); report.STATUS = "REPAIR_PENDING";
  }
}

export function writeReport(root: string, report: OrchestratorReport): void {
  writeFileSync(path.join(root, "image-animation", "automation", "reports", `${report.TASK}.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync(path.join(root, "image-animation", "automation", "state", `${report.TASK}.json`), `${JSON.stringify({ state: report.STATUS, task: report.TASK }, null, 2)}\n`, "utf8");
}