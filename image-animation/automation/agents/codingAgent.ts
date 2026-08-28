import { spawnSync } from "node:child_process";
import type { FailureEvidence, TaskSpec } from "../orchestrator/orchestrator.ts";

export type CodingAgentMode = "IMPLEMENT" | "REPAIR" | "REVIEW";
export interface FileEdit { path: string; operation: "CREATE" | "UPDATE" | "DELETE"; beforeSha256: string | null; content?: string; }
export interface CodingAgentRequest { taskId: string; taskSpec: TaskSpec; goal: string; workspace: string; allowedPaths: string[]; forbiddenPaths: string[]; architectureLocked: boolean; attempt: number; failureEvidence: FailureEvidence[]; instructions: string; mode: CodingAgentMode; mutationMode?: "DIRECT_WRITE" | "HOST_APPLIED_PATCH" | "AUTO"; }
export interface CodingAgentResult { status: "DISABLED" | "NOT_AVAILABLE" | "STARTING" | "RUNNING" | "COMPLETED" | "PASS" | "FAIL" | "TIMEOUT" | "BLOCKED"; provider: string; exitCode: number | null; changedFiles: string[]; stdoutSummary: string; stderrSummary: string; startedAt: string; finishedAt: string; fileEdits?: FileEdit[]; executionEvidence?: Record<string, unknown>; }
export interface CodingAgent { execute(request: CodingAgentRequest): CodingAgentResult; }

export class LocalProcessAgentAdapter implements CodingAgent {
  constructor(private readonly executable: string, private readonly args: string[] = []) {}
  execute(request: CodingAgentRequest): CodingAgentResult {
    const startedAt = new Date().toISOString();
    const result = spawnSync(this.executable, this.args, { cwd: request.workspace, encoding: "utf8", shell: false, input: request.instructions });
    const finishedAt = new Date().toISOString();
    return { status: result.error ? "NOT_AVAILABLE" : result.status === 0 ? "PASS" : "FAIL", provider: this.executable, exitCode: result.error ? null : result.status, changedFiles: [], stdoutSummary: String(result.stdout ?? "").slice(-2000), stderrSummary: String(result.stderr ?? result.error?.message ?? "").slice(-2000), startedAt, finishedAt };
  }
}

export class FakeCodingAgent implements CodingAgent {
  public calls = 0;
  constructor(public readonly result: CodingAgentResult) {}
  execute(): CodingAgentResult { this.calls += 1; return { ...this.result, startedAt: new Date().toISOString(), finishedAt: new Date().toISOString() }; }
}