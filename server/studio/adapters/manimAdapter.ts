import { assertValidSceneGraph, type SceneGraph } from "../../../image-animation/core/scene-graph/index.js";
import { compileManim } from "../../../image-animation/renderers/manim/index.js";
import { routeMotion } from "../../../image-animation/renderers/router/index.js";
import type { StudioEngine, StudioEngineRequest, StudioEngineResult } from "../contracts.js";

function sceneGraphInput(value: unknown): SceneGraph {
  assertValidSceneGraph(value);
  return value;
}

export class ManimStudioAdapter implements StudioEngine {
  readonly id = "studio.manim";

  capabilities() {
    return Object.freeze([
      Object.freeze({ id: "geometry.2d", status: "AVAILABLE" as const }),
      Object.freeze({ id: "geometry.3d", status: "UNAVAILABLE" as const, reason: "The current Scene Graph Manim compiler supports deterministic 2D geometry." }),
      Object.freeze({ id: "animation.manim", status: "AVAILABLE" as const }),
    ]);
  }

  async execute(request: StudioEngineRequest): Promise<StudioEngineResult> {
    if (!["geometry.2d", "geometry.3d", "animation.manim"].includes(request.capability)) {
      return Object.freeze({ status: "DENIED", engineId: this.id, capability: request.capability, error: "Unsupported Manim Studio capability." });
    }
    try {
      const graph = sceneGraphInput(request.input);
      const compilation = compileManim(graph, { sceneClassName: "StudioIntegrationCanary" });
      const rendererRoute = routeMotion(
        { id: "studio-integration-canary", geometryAuthority: "exact", requestedRenderer: "auto" },
        { deterministicRenderer: "manim", generativeEnabled: false },
      );
      return Object.freeze({
        status: "COMPLETED",
        engineId: this.id,
        capability: request.capability,
        output: Object.freeze({ graph, compilation, rendererRoute }),
      });
    } catch (error) {
      return Object.freeze({ status: "FAILED", engineId: this.id, capability: request.capability, error: error instanceof Error ? error.message : String(error) });
    }
  }
}
