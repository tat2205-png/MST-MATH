import type {
  MotionRoute,
  MotionRouteRequest,
  MotionRoutingPolicy,
} from "./types.ts";

export * from "./types.ts";

function requireNonEmpty(value: string, name: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${name} must be a non-empty string.`);
  }
}

export function routeMotion(
  request: MotionRouteRequest,
  policy: MotionRoutingPolicy,
): MotionRoute {
  requireNonEmpty(request.id, "Motion request ID");
  if (request.geometryAuthority !== "exact" && request.geometryAuthority !== "non-authoritative") {
    throw new TypeError("Geometry authority must be exact or non-authoritative.");
  }
  if (policy.deterministicRenderer !== "manim" && policy.deterministicRenderer !== "blender") {
    throw new TypeError("Deterministic renderer must be manim or blender.");
  }
  if (typeof policy.generativeEnabled !== "boolean") {
    throw new TypeError("Generative policy flag must be boolean.");
  }

  if (request.geometryAuthority === "exact") {
    return Object.freeze({
      status: "ready" as const,
      requestId: request.id,
      renderer: policy.deterministicRenderer,
      authoritative: true as const,
      reason: "EXACT_GEOMETRY_REQUIRES_DETERMINISTIC_RENDERER" as const,
    });
  }

  const requested = request.requestedRenderer ?? "auto";
  if (requested === "manim" || requested === "blender") {
    return Object.freeze({
      status: "ready" as const,
      requestId: request.id,
      renderer: requested,
      authoritative: true as const,
      reason: "EXACT_GEOMETRY_REQUIRES_DETERMINISTIC_RENDERER" as const,
    });
  }
  if (!policy.generativeEnabled) {
    return Object.freeze({
      status: "denied" as const,
      requestId: request.id,
      authoritative: false as const,
      reason: "GENERATIVE_RENDERING_DISABLED" as const,
    });
  }
  return Object.freeze({
    status: "ready" as const,
    requestId: request.id,
    renderer: "generative" as const,
    authoritative: false as const,
    reason: "POLICY_ALLOWS_NON_AUTHORITATIVE_GENERATION" as const,
    warning: "GENERATIVE_OUTPUT_IS_NON_AUTHORITATIVE" as const,
  });
}

export const routeMotionRenderer = routeMotion;
