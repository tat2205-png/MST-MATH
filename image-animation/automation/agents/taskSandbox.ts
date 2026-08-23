import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { TaskSpec } from "../orchestrator/orchestrator.ts";
import { evaluateRepositoryGuard, type RepositoryGuardResult } from "../gates/repositoryGuard.ts";
import { parseGitPorcelain } from "../gates/gitStatusParser.ts";
import { buildAgentInstructions } from "./instructionBuilder.ts";
import type { CodingAgent, CodingAgentMode, CodingAgentRequest, CodingAgentResult } from "./codingAgent.ts";

export interface GitSnapshot { head: string; branch: string; status: string; changedFiles: string[]; fingerprints: Record<string, string>; }
export interface SandboxEvidence { before: GitSnapshot; after: GitSnapshot; result: CodingAgentResult; repositoryGuard: RepositoryGuardResult; blockers: string[]; }
function git(root: string, args: string[]): string { return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim(); }
function files(status: string): string[] { return parseGitPorcelain(status).map((entry) => entry.path); }
export function captureGitSnapshot(root: string): GitSnapshot {
  const status = git(root, ["status", "--short", "--untracked-files=all"]);
  const changedFiles = files(status);
  const fingerprints = Object.fromEntries(changedFiles.map((file) => {
    const absolute = path.join(root, file);
    return [file, existsSync(absolute) ? createHash("sha256").update(readFileSync(absolute)).digest("hex") : "MISSING"];
  }));
  return { head: git(root, ["rev-parse", "HEAD"]), branch: git(root, ["branch", "--show-current"]), status, changedFiles, fingerprints };
}

export class TaskExecutionSandbox {
  constructor(private readonly root: string, private readonly expectedBranch: string, private readonly spec: TaskSpec, private readonly snapshot = captureGitSnapshot) {}
  execute(agent: CodingAgent, taskId: string, attempt: number, evidence: CodingAgentRequest["failureEvidence"] = [], mode: CodingAgentMode = "REPAIR"): SandboxEvidence {
    if (path.resolve(this.root).toLowerCase() !== path.resolve("D:\\math-ai-image-animation").toLowerCase()) throw new Error("Workspace is outside the project root");
    const before = this.snapshot(this.root);
    if (before.branch !== this.expectedBranch) return this.blocked(before, "Wrong branch before agent execution");
    const request: CodingAgentRequest = { taskId, taskSpec: this.spec, goal: this.spec.goal, workspace: this.root, allowedPaths: this.spec.allowedPaths, forbiddenPaths: this.spec.forbiddenPaths, architectureLocked: !this.spec.architectureChangeAllowed, attempt, failureEvidence: evidence, instructions: buildAgentInstructions(this.spec, evidence, attempt, mode), mode };
    const result = agent.execute(request); const after = this.snapshot(this.root); const blockers: string[] = [];
    if (before.branch !== after.branch) blockers.push("Branch changed during agent execution");
    if (before.head !== after.head) blockers.push("HEAD changed during agent execution");
    const changedFiles = after.changedFiles.filter((file) => before.fingerprints[file] !== after.fingerprints[file]);
    const guard = evaluateRepositoryGuard(changedFiles, this.spec); if (guard.status === "FAIL") blockers.push(...guard.violations);
    const protectedPaths = [...(this.spec.protectedPaths ?? []), ...(this.spec.architectureProtectedPaths ?? [])];
    for (const file of changedFiles) if (protectedPaths.some((pattern) => pattern.endsWith("/**") ? file.replaceAll("\\", "/").startsWith(pattern.slice(0, -3)) : file === pattern)) blockers.push(`${file}: protected path modification`);
    return { before, after, result, repositoryGuard: guard, blockers };
  }
  async executeAsync(agent: { executeAsync: (request: CodingAgentRequest) => Promise<CodingAgentResult> }, taskId: string, attempt: number, evidence: CodingAgentRequest["failureEvidence"] = [], mode: CodingAgentMode = "IMPLEMENT", mutationMode: CodingAgentRequest["mutationMode"] = "AUTO"): Promise<SandboxEvidence> {
    if (path.resolve(this.root).toLowerCase() !== path.resolve("D:\\math-ai-image-animation").toLowerCase()) throw new Error("Workspace is outside the project root");
    const before = this.snapshot(this.root);
    if (before.branch !== this.expectedBranch) return this.blocked(before, "Wrong branch before agent execution");
    const baselineHashes = Object.entries(before.fingerprints).map(([file, hash]) => `${file}=${hash}`).join("; ");
    const request: CodingAgentRequest = { taskId, taskSpec: this.spec, goal: this.spec.goal, workspace: this.root, allowedPaths: this.spec.allowedPaths, forbiddenPaths: this.spec.forbiddenPaths, architectureLocked: !this.spec.architectureChangeAllowed, attempt, failureEvidence: evidence, instructions: `${buildAgentInstructions(this.spec, evidence, attempt, mode)}\nHOST_BASELINE_SHA256=${baselineHashes}`, mode, mutationMode };
    const result = await agent.executeAsync(request); const after = this.snapshot(this.root); const blockers: string[] = [];
    if (before.branch !== after.branch) blockers.push("Branch changed during agent execution");
    if (before.head !== after.head) blockers.push("HEAD changed during agent execution");
    const changedFiles = after.changedFiles.filter((file) => before.fingerprints[file] !== after.fingerprints[file]);
    const guard = evaluateRepositoryGuard(changedFiles, this.spec); if (guard.status === "FAIL") blockers.push(...guard.violations);
    const protectedPaths = [...(this.spec.protectedPaths ?? []), ...(this.spec.architectureProtectedPaths ?? [])];
    for (const file of changedFiles) if (protectedPaths.some((pattern) => pattern.endsWith("/**") ? file.replaceAll("\\", "/").startsWith(pattern.slice(0, -3)) : file === pattern)) blockers.push(`${file}: protected path modification`);
    return { before, after, result, repositoryGuard: guard, blockers };
  }
  private blocked(before: GitSnapshot, reason: string): SandboxEvidence { return { before, after: before, result: { status: "BLOCKED", provider: "sandbox", exitCode: null, changedFiles: [], stdoutSummary: "", stderrSummary: reason, startedAt: new Date().toISOString(), finishedAt: new Date().toISOString() }, repositoryGuard: { status: "FAIL", checkedFiles: [], violations: [reason] }, blockers: [reason] }; }
}