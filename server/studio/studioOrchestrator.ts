import type { StudioEngineRequest, StudioEngineResult } from "./contracts.js";
import type { EngineRegistry } from "./engineRegistry.js";

export interface StudioExecuteRequest {
  readonly task: string;
  readonly input: unknown;
  readonly output?: string;
}

export class StudioOrchestrator {
  constructor(private readonly registry: EngineRegistry) {}

  availability() {
    return this.registry.capabilityStatus();
  }

  execute(request: StudioExecuteRequest): Promise<StudioEngineResult> {
    if (typeof request.task !== "string" || request.task.length === 0) {
      return Promise.resolve(Object.freeze({ status: "FAILED", engineId: "studio.orchestrator", capability: "unknown", error: "Studio task must be a non-empty capability." }));
    }
    const engineRequest: StudioEngineRequest = { capability: request.task, input: request.input };
    return this.registry.execute(engineRequest);
  }
}
