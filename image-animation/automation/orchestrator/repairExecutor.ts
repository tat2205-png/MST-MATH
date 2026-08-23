import type { RepairExecutor, RepairRequest, RepairResult } from "./orchestrator.ts";
import type { CodingAgent } from "../agents/codingAgent.ts";
import { TaskExecutionSandbox } from "../agents/taskSandbox.ts";
import { applyPatchTransaction, validatePatch } from "../gates/patchTransaction.ts";

export class DeterministicFakeRepairExecutor implements RepairExecutor {
  public readonly requests: RepairRequest[] = [];
  private readonly results: RepairResult[];

  constructor(results: RepairResult[]) {
    this.results = results;
  }

  execute(request: RepairRequest): RepairResult {
    this.requests.push(request);
    return this.results[request.attempt - 1] ?? { status: "FAILED", changedFiles: [], summary: "No fake result configured" };
  }
}

export class CodingAgentRepairExecutor implements RepairExecutor {
  constructor(private readonly agent: CodingAgent, private readonly sandbox: TaskExecutionSandbox) {}
  execute(request: RepairRequest): RepairResult {
    const evidence = this.sandbox.execute(this.agent, request.taskId, request.attempt, request.failureEvidence, "REPAIR");
    return { status: evidence.blockers.length === 0 && evidence.result.status === "PASS" ? "CHANGED" : "FAILED", changedFiles: evidence.result.changedFiles, summary: evidence.blockers.join("; ") || evidence.result.stdoutSummary || "Coding agent completed" };
  }

  async executeAsync(request: RepairRequest): Promise<RepairResult> {
    if (!("executeAsync" in this.agent) || typeof this.agent.executeAsync !== "function") return this.execute(request);
    const evidence = await this.sandbox.executeAsync(this.agent as CodingAgent & { executeAsync: (request: Parameters<CodingAgent["execute"]>[0]) => Promise<import("../agents/codingAgent.ts").CodingAgentResult> }, request.taskId, request.attempt, request.failureEvidence, "REPAIR", "HOST_APPLIED_PATCH");
    const validation = validatePatch(this.sandbox.rootPath, this.sandbox.taskSpec, evidence.result.fileEdits);
    const application = validation.status === "PASS" ? applyPatchTransaction(this.sandbox.rootPath, validation.edits) : { status: "FAIL" as const, changedFiles: [], error: validation.violations.join("; ") };
    return { status: evidence.blockers.length === 0 && evidence.result.status === "COMPLETED" && application.status === "PASS" ? "CHANGED" : "FAILED", changedFiles: application.changedFiles, summary: evidence.blockers.join("; ") || application.error || "Coding agent repair completed" };
  }
}