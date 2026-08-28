export type MotionRendererId = "manim" | "blender" | "generative";
export type DeterministicMotionRendererId = Exclude<MotionRendererId, "generative">;
export type MotionGeometryAuthority = "exact" | "non-authoritative";

export interface MotionRoutingPolicy {
  readonly deterministicRenderer: DeterministicMotionRendererId;
  readonly generativeEnabled: boolean;
}

export interface MotionRouteRequest {
  readonly id: string;
  readonly geometryAuthority: MotionGeometryAuthority;
  readonly requestedRenderer?: MotionRendererId | "auto";
}

export interface DeterministicMotionRoute {
  readonly status: "ready";
  readonly requestId: string;
  readonly renderer: DeterministicMotionRendererId;
  readonly authoritative: true;
  readonly reason: "EXACT_GEOMETRY_REQUIRES_DETERMINISTIC_RENDERER";
}

export interface GenerativeMotionRoute {
  readonly status: "ready";
  readonly requestId: string;
  readonly renderer: "generative";
  readonly authoritative: false;
  readonly reason: "POLICY_ALLOWS_NON_AUTHORITATIVE_GENERATION";
  readonly warning: "GENERATIVE_OUTPUT_IS_NON_AUTHORITATIVE";
}

export interface DeniedMotionRoute {
  readonly status: "denied";
  readonly requestId: string;
  readonly authoritative: false;
  readonly reason: "GENERATIVE_RENDERING_DISABLED";
}

export type MotionRoute = DeterministicMotionRoute | GenerativeMotionRoute | DeniedMotionRoute;
