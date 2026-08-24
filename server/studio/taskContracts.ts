export type StudioTask = "math.solve" | "geometry.visualize" | "animation.scene" | "video.plan";

export type StudioPlannedCapability =
  | "math.solve"
  | "geometry.2d"
  | "geometry.luadraw"
  | "animation.manim"
  | "animation.image"
  | "animation.image.segmentation"
  | "video.plan";

export interface StudioTaskRequest {
  readonly task: StudioTask;
  readonly input: { readonly text: string } | { readonly fixture: "linear_equation" | "triangle_area" };
  readonly requestedCapabilities: readonly StudioPlannedCapability[];
}

export interface StudioPlanStep {
  readonly sequence: number;
  readonly capability: StudioPlannedCapability;
  readonly component: string;
  readonly action: "COMPUTE" | "EXECUTE" | "PLAN";
}

export interface StudioCapabilityPlan {
  readonly task: StudioTask;
  readonly steps: readonly StudioPlanStep[];
}

export type StudioTraceStage = "VALIDATE" | "PLAN" | "ROUTE" | "ROUTE_MATH" | "PARSE" | "SOLVE" | "EXECUTE" | "VERIFY" | "RESULT";

export interface StudioTraceEntry {
  readonly sequence: number;
  readonly stage: StudioTraceStage;
  readonly status: "PASS" | "FAIL";
  readonly detail: string;
}

export type StudioTaskErrorCode =
  | "INVALID_REQUEST"
  | "CAPABILITY_DISABLED"
  | "ENGINE_UNAVAILABLE"
  | "RUNTIME_MISSING"
  | "PLANNING_FAILED"
  | "ROUTING_FAILED"
  | "EXECUTION_FAILED"
  | "VERIFICATION_FAILED"
  | "VALIDATION_FAILED";

export interface StudioTaskResult {
  readonly requestId: string;
  readonly task: StudioTask;
  readonly success: boolean;
  readonly plan: StudioCapabilityPlan;
  readonly selectedEngines: readonly string[];
  readonly capabilitiesUsed: readonly StudioPlannedCapability[];
  readonly artifacts: readonly Readonly<Record<string, unknown>>[];
  readonly warnings: readonly string[];
  readonly runtimeStatus: readonly Readonly<{ capability: StudioPlannedCapability; status: string }>[];
  readonly qa: Readonly<{ validation: "PASS"; routing: "PASS" | "FAIL"; execution: "PASS" | "FAIL" }>;
  readonly trace: readonly StudioTraceEntry[];
  readonly error?: Readonly<{ code: StudioTaskErrorCode; message: string }>;
}
