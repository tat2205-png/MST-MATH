export type StudioTask = "math.solve" | "geometry.visualize" | "animation.scene" | "video.plan" | "video.render";

export type StudioPlannedCapability =
  | "math.solve"
  | "geometry.2d"
  | "geometry.luadraw"
  | "animation.manim"
  | "animation.image"
  | "animation.image.segmentation"
  | "video.plan"
  | "video.render";

export interface StudioVideoOptions {
  readonly resolution?: "480p" | "720p";
  readonly fps?: 24 | 30;
}

export interface StudioTaskRequest {
  readonly task: StudioTask;
  readonly input: { readonly text: string; readonly video?: StudioVideoOptions } | { readonly fixture: "linear_equation" | "triangle_area" };
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

export type StudioTraceStage =
  | "REQUEST" | "VALIDATE" | "PLAN" | "ROUTE" | "ROUTE_MATH" | "PARSE" | "SOLVE" | "EXECUTE" | "VERIFY"
  | "REAL_MATH_PARSE" | "REAL_MATH_SOLVE" | "REAL_MATH_VERIFY" | "GEOMETRY_ROUTE" | "SCENE_GRAPH"
  | "MOTION_TIMELINE" | "MANIM_TOOLKIT" | "MANIM_COMPILE" | "EDGE_TTS" | "RENDERER_ROUTE"
  | "LOCAL_BRIDGE" | "MANIM_RENDER" | "FFMPEG_COMPOSE" | "FRAME_QA" | "OVERLAP_QA"
  | "FINAL_MATH_QA" | "ARTIFACT_QA" | "RESULT";

export interface StudioVideoArtifact {
  readonly artifactId: string;
  readonly type: "video/mp4";
  readonly status: "READY";
  readonly size: number;
  readonly duration: number;
  readonly videoCodec: string;
  readonly audioCodec: string;
  readonly width: number;
  readonly height: number;
  readonly qaState: "PASS";
}

export interface StudioFullVideoQa {
  readonly frame: "PASS";
  readonly overlap: "PASS";
  readonly finalMath: "PASS";
  readonly artifact: "PASS";
}

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
  readonly verifiedMathResult?: Readonly<{ value: string; latex: string }>;
  readonly sceneSummary?: Readonly<{ sceneCount: number; nodeCount: number; timelineEventCount: number }>;
  readonly finalArtifact?: StudioVideoArtifact;
  readonly fullVideoQa?: StudioFullVideoQa;
  readonly error?: Readonly<{ code: StudioTaskErrorCode; message: string }>;
}
