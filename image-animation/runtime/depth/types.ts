import type {
  DepthEstimationRequest,
  DepthProvider,
} from "../../adapters/depth/index.ts";
import type { SceneGraph } from "../../core/scene-graph/index.ts";
import type { TwoPointFiveDScene } from "../../renderers/two-point-five-d/index.ts";

export type DepthCapabilityStatus = "AVAILABLE" | "NOT_AVAILABLE" | "NOT_TESTED";

export interface DepthRuntimeCapability {
  readonly providerId: string;
  readonly status: DepthCapabilityStatus;
  readonly runtime?: string;
  readonly reason?: string;
}

export interface DepthLayerInput {
  readonly layer: number;
  readonly depth: number;
}

export interface DepthCameraMotionInput {
  readonly deltaX: number;
  readonly deltaY: number;
  readonly zoom: number;
}

export interface ObjectPlaneTransformInput {
  readonly nodeId: string;
  readonly depthOffset?: number;
  readonly translateX?: number;
  readonly translateY?: number;
  readonly scale?: number;
}

export interface DepthMotionInput {
  readonly layerDepths: readonly DepthLayerInput[];
  readonly parallaxStrength: number;
  readonly separation: number;
  readonly camera: DepthCameraMotionInput;
  readonly objectPlanes?: readonly ObjectPlaneTransformInput[];
}

export interface DepthLayerMotion {
  readonly layer: number;
  readonly depth: number;
  readonly separatedDepth: number;
  readonly parallaxX: number;
  readonly parallaxY: number;
}

export interface ObjectPlaneTransform {
  readonly nodeId: string;
  readonly depthOffset: number;
  readonly translateX: number;
  readonly translateY: number;
  readonly scale: number;
}

export interface DepthMotionPlan {
  readonly scene: TwoPointFiveDScene;
  readonly camera: DepthCameraMotionInput;
  readonly layers: readonly DepthLayerMotion[];
  readonly objectPlanes: readonly ObjectPlaneTransform[];
}

export interface DepthRuntimeRequest {
  readonly provider: DepthProvider;
  readonly request: DepthEstimationRequest;
  readonly sceneId: string;
  readonly exactGeometry: SceneGraph;
  readonly motion: DepthMotionInput;
}

export type DepthRuntimeResult =
  | {
      readonly status: "COMPLETED";
      readonly capability: DepthRuntimeCapability & {
        readonly status: "AVAILABLE";
        readonly runtime: string;
      };
      readonly plan: DepthMotionPlan;
    }
  | {
      readonly status: "SKIPPED";
      readonly capability: DepthRuntimeCapability & {
        readonly status: "NOT_AVAILABLE" | "NOT_TESTED";
      };
    };
