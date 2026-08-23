import { execFileSync } from "node:child_process";
import type { TaskSpec } from "../orchestrator/orchestrator.ts";
import { evaluateRepositoryGuard, type RepositoryGuardResult } from "../gates/repositoryGuard.ts";
import { buildAgentInstructions } from "./instructionBuilder.ts";
import type { CodingAgent, CodingAgentMode, CodingAgentRequest, CodingAgentResult } from "./codingAgent.ts";

export interface GitSnapshot { head: string; branch: string; status: string; changedFiles: string[]; }
export interface SandboxEvidence { before: GitSnapshot; after: GitSnapshot; result: CodingAgentResult; repositoryGuard: RepositoryGuardResult; blockers: string[]; }
function git(root: string, args: string[]): string { return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim(); }
function files(status: string): string[] { return status.split(/\r?\n/).filter(Boolean).map((line) => line.slice(3).trim().split(" -> ").at(-1)!); }
export function captureGitSnapshot(root: string): GitSnapshot { const status = git(root, ["status", "--short", "--untracked-files=all"]); return { head: git(root, ["rev-parse", "HEAD"]), branch: git(root, ["branch", "--show-current"]), status, changedFiles: files(status) }; }

export class TaskExecutionSandbox {
  constructor(private readonly root: string, private readonly expectedBranch: string, private readonly spec: TaskSpec, private readonly snapshot = captureGitSnapshot) {}
  execute(agent: CodingAgent, taskId: string, attempt: number, evidence: CodingAgentRequest["failureEvidence"] = [], mode: CodingAgentMode = "REPAIR"): SandboxEvidence {
    if (!this.root.toLowerCase().startsWith("d:\\math-ai-image-animation")) throw new Error("Workspace is outside the project root");
    const before = this.snapshot(this.root);
    if (before.branch !== this.expectedBranch) return this.blocked(before, "Wrong branch before agent execution");
    const request: CodingAgentRequest = { taskId, taskSpec: this.spec, goal: this.spec.goal, workspace: this.root, allowedPaths: this.spec.allowedPaths, forbiddenPaths: this.spec.forbiddenPaths, architectureLocked: !this.spec.architectureChangeAllowed, attempt, failureEvidence: evidence, instructions: buildAgentInstructions(this.spec, evidence, attempt, mode), mode };
    const result = agent.execute(request); const after = this.snapshot(this.root); const blockers: string[] = [];
    if (before.branch !== after.branch) blockers.push("Branch changed during agent execution");
    if (before.head !== after.head) blockers.push("HEAD changed during agent execution");
    const changedFiles = result.changedFiles.length > 0 ? result.changedFiles : after.changedFiles.filter((file) => !before.changedFiles.includes(file));
    const guard = evaluateRepositoryGuard(changedFiles, this.spec); if (guard.status === "FAIL") blockers.push(...guard.violations);
    const protectedPaths = [...(this.spec.protectedPaths ?? []), ...(this.spec.architectureProtectedPaths ?? [])];
    for (const file of changedFiles) if (protectedPaths.some((pattern) => pattern.endsWith("/**") ? file.replaceAll("\\", "/").startsWith(pattern.slice(0, -3)) : file === pattern)) blockers.push(`${file}: protected path modification`);
    return { before, after, result, repositoryGuard: guard, blockers };
  }
  private blocked(before: GitSnapshot, reason: string): SandboxEvidence { return { before, after: before, result: { status: "FAIL", provider: "sandbox", exitCode: null, changedFiles: [], stdoutSummary: "", stderrSummary: reason, startedAt: new Date().toISOString(), finishedAt: new Date().toISOString() }, repositoryGuard: { status: "FAIL", checkedFiles: [], violations: [reason] }, blockers: [reason] }; }
}