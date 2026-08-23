import type { RepairExecutor, RepairRequest, RepairResult } from "./orchestrator.ts";
import type { CodingAgent } from "../agents/codingAgent.ts";
import { TaskExecutionSandbox } from "../agents/taskSandbox.ts";

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
}