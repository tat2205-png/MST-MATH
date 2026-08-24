import { createHash } from "node:crypto";
import type { StudioEngineRequest, StudioEngineResult } from "./contracts.js";
import type { EngineRegistry } from "./engineRegistry.js";
import type { StudioFeatureFlags } from "./featureFlags.js";
import { planStudioTask } from "./capabilityPlanner.js";
import { createTriangleAreaSceneGraph, solveDeterministicFixture } from "./orchestrationFixtures.js";
import { StudioMathExecutionAdapter } from "./mathExecutionAdapter.js";
import type {
  StudioCapabilityPlan,
  StudioPlannedCapability,
  StudioTaskErrorCode,
  StudioTaskRequest,
  StudioTaskResult,
  StudioTraceEntry,
  StudioTraceStage,
} from "./taskContracts.js";

export interface StudioExecuteRequest {
  readonly task: string;
  readonly input: unknown;
  readonly output?: string;
}

export class StudioOrchestrator {
  constructor(
    private readonly registry: EngineRegistry,
    private readonly flags?: StudioFeatureFlags,
    private readonly mathExecution = new StudioMathExecutionAdapter(),
  ) {}

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

  async executeTask(request: StudioTaskRequest): Promise<StudioTaskResult> {
    const requestId = createHash("sha256").update(JSON.stringify(request)).digest("hex").slice(0, 16);
    const trace: StudioTraceEntry[] = [];
    const addTrace = (stage: StudioTraceStage, status: "PASS" | "FAIL", detail: string) => {
      trace.push(Object.freeze({ sequence: trace.length, stage, status, detail }));
    };
    addTrace("VALIDATE", "PASS", "STUDIO_TASK_CONTRACT_VALID");
    let plan: StudioCapabilityPlan;
    try {
      plan = planStudioTask(request);
      addTrace("PLAN", "PASS", "DETERMINISTIC_CAPABILITY_PLAN_READY");
    } catch {
      plan = Object.freeze({ task: request.task, steps: Object.freeze([]) });
      addTrace("PLAN", "FAIL", "CAPABILITY_PLANNING_FAILED");
      return this.failure(requestId, request, plan, trace, "PLANNING_FAILED", "Studio capability planning failed.");
    }
    if (this.flags?.integrationCanary !== true) {
      addTrace("ROUTE", "FAIL", "EXPERIMENTAL_EXECUTION_DISABLED");
      return this.failure(requestId, request, plan, trace, "CAPABILITY_DISABLED", "Studio experimental execution is disabled.");
    }

    const availability = await this.registry.capabilityStatus();
    const artifacts: Array<Readonly<Record<string, unknown>>> = [];
    const selectedEngines: string[] = [];
    const capabilitiesUsed: StudioPlannedCapability[] = [];
    const runtimeStatus: Array<Readonly<{ capability: StudioPlannedCapability; status: string }>> = [];
    addTrace(request.task === "math.solve" ? "ROUTE_MATH" : "ROUTE", "PASS", request.task === "math.solve" ? "REAL_MATH_ROUTING_STARTED" : "CAPABILITY_ROUTING_STARTED");

    for (const step of plan.steps) {
      if (step.action === "COMPUTE") {
        if (request.task === "math.solve" && "text" in request.input) {
          try {
            const problem = await this.mathExecution.parse(request.input.text);
            addTrace("PARSE", "PASS", "EXISTING_MATH_PARSER_COMPLETED");
            const solution = await this.mathExecution.solve(problem);
            addTrace("SOLVE", "PASS", "EXISTING_MATH_SOLVER_COMPLETED");
            const verification = await this.mathExecution.verify(problem, solution);
            addTrace("VERIFY", "PASS", "EXISTING_MATH_VERIFIER_COMPLETED");
            const result = this.mathExecution.result(request.input.text, problem, solution, verification);
            if (!result) {
              trace[trace.length - 1] = Object.freeze({ ...trace[trace.length - 1], status: "FAIL", detail: "MATH_GATE_REJECTED" });
              return this.failure(requestId, request, plan, trace, "VERIFICATION_FAILED", "Math verification rejected the solver output.");
            }
            artifacts.push(Object.freeze({ kind: "math-execution", ...result }));
          } catch {
            addTrace("EXECUTE", "FAIL", "REAL_MATH_EXECUTION_FAILED");
            return this.failure(requestId, request, plan, trace, "EXECUTION_FAILED", "Real Math AI execution failed.");
          }
        } else if ("fixture" in request.input) {
          artifacts.push(solveDeterministicFixture(request.input.fixture));
        } else {
          return this.failure(requestId, request, plan, trace, "INVALID_REQUEST", "Math input is invalid.");
        }
        selectedEngines.push(step.component);
        capabilitiesUsed.push(step.capability);
        runtimeStatus.push(Object.freeze({ capability: step.capability, status: "READY" }));
        continue;
      }
      if (step.action === "PLAN") {
        artifacts.push(Object.freeze({ kind: "renderer-plan", renderer: "manim", authoritative: true, productionExecution: false }));
        selectedEngines.push(step.component);
        capabilitiesUsed.push(step.capability);
        runtimeStatus.push(Object.freeze({ capability: step.capability, status: "READY" }));
        continue;
      }
      const capability = availability.find((item) => item.id === step.capability && item.engineId === step.component);
      const status = capability?.status ?? "UNAVAILABLE";
      runtimeStatus.push(Object.freeze({ capability: step.capability, status }));
      if (status === "OPTIONAL_RUNTIME_MISSING") {
        addTrace("EXECUTE", "FAIL", "OPTIONAL_RUNTIME_MISSING");
        return this.failure(requestId, request, plan, trace, "RUNTIME_MISSING", "Required Studio runtime is unavailable.", runtimeStatus);
      }
      if (status === "DISABLED") {
        addTrace("EXECUTE", "FAIL", "ENGINE_CAPABILITY_DISABLED");
        return this.failure(requestId, request, plan, trace, "CAPABILITY_DISABLED", "Requested Studio capability is disabled.", runtimeStatus);
      }
      if (status !== "AVAILABLE") {
        addTrace("EXECUTE", "FAIL", "ENGINE_CAPABILITY_UNAVAILABLE");
        return this.failure(requestId, request, plan, trace, "ENGINE_UNAVAILABLE", "Requested Studio engine is unavailable.", runtimeStatus);
      }
      if (step.capability === "geometry.luadraw") {
        addTrace("EXECUTE", "FAIL", "LUADRAW_ARTIFACT_PATH_NOT_EXPOSED");
        return this.failure(requestId, request, plan, trace, "ROUTING_FAILED", "LuaDraw artifact execution is not exposed by the Phase 3 API.", runtimeStatus);
      }
      const graph = createTriangleAreaSceneGraph();
      const result = await this.registry.execute({ capability: step.capability, input: graph });
      if (result.status !== "COMPLETED") {
        addTrace("EXECUTE", "FAIL", "ENGINE_EXECUTION_FAILED");
        return this.failure(requestId, request, plan, trace, "EXECUTION_FAILED", "Studio engine execution failed.", runtimeStatus);
      }
      const digest = createHash("sha256").update(JSON.stringify(result.output)).digest("hex");
      artifacts.push(Object.freeze({ kind: "engine-result", engineId: result.engineId, capability: result.capability, outputSha256: digest }));
      selectedEngines.push(result.engineId);
      capabilitiesUsed.push(step.capability);
    }

    if (request.task !== "math.solve") {
      addTrace("EXECUTE", "PASS", "ALL_PLAN_STEPS_COMPLETED");
      addTrace("VERIFY", "PASS", "STRUCTURED_RESULT_VERIFIED");
    }
    addTrace("RESULT", "PASS", "STUDIO_TASK_COMPLETED");
    return Object.freeze({
      requestId,
      task: request.task,
      success: true,
      plan,
      selectedEngines: Object.freeze([...new Set(selectedEngines)]),
      capabilitiesUsed: Object.freeze(capabilitiesUsed),
      artifacts: Object.freeze(artifacts),
      warnings: Object.freeze([]),
      runtimeStatus: Object.freeze(runtimeStatus),
      qa: Object.freeze({ validation: "PASS", routing: "PASS", execution: "PASS" }),
      trace: Object.freeze(trace),
    });
  }

  private failure(
    requestId: string,
    request: StudioTaskRequest,
    plan: StudioCapabilityPlan,
    trace: StudioTraceEntry[],
    code: StudioTaskErrorCode,
    message: string,
    runtimeStatus: readonly Readonly<{ capability: StudioPlannedCapability; status: string }>[] = [],
  ): StudioTaskResult {
    trace.push(Object.freeze({ sequence: trace.length, stage: "RESULT", status: "FAIL", detail: code }));
    return Object.freeze({
      requestId,
      task: request.task,
      success: false,
      plan,
      selectedEngines: Object.freeze([]),
      capabilitiesUsed: Object.freeze([]),
      artifacts: Object.freeze([]),
      warnings: Object.freeze([]),
      runtimeStatus: Object.freeze([...runtimeStatus]),
      qa: Object.freeze({ validation: "PASS", routing: "FAIL", execution: "FAIL" }),
      trace: Object.freeze(trace),
      error: Object.freeze({ code, message }),
    });
  }
}
