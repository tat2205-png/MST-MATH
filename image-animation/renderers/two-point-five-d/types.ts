import type { SceneGraph } from "../../core/scene-graph/index.ts";
import type { DepthSourceImage, EstimatedDepthMap } from "../../adapters/depth/index.ts";

export interface TwoPointFiveDSceneInput {
  readonly id: string;
  readonly sourceImage: DepthSourceImage;
  readonly exactGeometry: SceneGraph;
  readonly estimatedDepth?: EstimatedDepthMap;
}

export interface TwoPointFiveDScene {
  readonly id: string;
  readonly sourceImage: DepthSourceImage;
  readonly exactGeometry: SceneGraph;
  readonly estimatedDepth?: EstimatedDepthMap;
}

export type TwoPointFiveDRenderMode = "source-image" | "exact-geometry" | "estimated-depth";

export interface TwoPointFiveDRenderer {
  readonly id: string;
  readonly modes: readonly TwoPointFiveDRenderMode[];
}

export interface RendererRouteRequest {
  readonly mode?: TwoPointFiveDRenderMode | "auto";
  readonly preferredRendererId?: string;
}

export interface RendererRoute {
  readonly rendererId: string;
  readonly mode: TwoPointFiveDRenderMode;
  readonly reason: "preferred" | "canonical";
}
