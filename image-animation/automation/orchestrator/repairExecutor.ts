import type { RepairExecutor, RepairRequest, RepairResult } from "./orchestrator.ts";

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