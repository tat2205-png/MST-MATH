import type { SceneGraph } from "../../core/scene-graph/index.ts";
import type { AnimationTimeline } from "../../core/timeline/index.ts";

export type BlenderRoutingMode = "disabled" | "optional" | "required";

export type BlenderRuntimeStatus =
  | {
      readonly available: true;
      readonly runtime: string;
      readonly version?: string;
    }
  | {
      readonly available: false;
      readonly runtime: string;
      readonly reason: string;
    };

export interface BlenderRuntime {
  readonly id: string;
  runtimeStatus(): BlenderRuntimeStatus | Promise<BlenderRuntimeStatus>;
}

export interface BlenderArtifactOptions {
  readonly rootDirectory?: string;
  readonly fileStem?: string;
  readonly videoExtension?: "mp4" | "webm";
}

export interface BlenderArtifactContract {
  readonly contractVersion: 1;
  readonly requestId: string;
  readonly rootDirectory: string;
  readonly sceneGraphPath: string;
  readonly timelinePath: string;
  readonly blendPath: string;
  readonly videoPath: string;
  readonly sceneGraphJson: string;
  readonly timelineJson: string;
}

export interface BlenderRouteRequest {
  readonly id: string;
  readonly mode?: BlenderRoutingMode;
  readonly sceneGraph: SceneGraph;
  readonly timeline: AnimationTimeline;
  readonly artifacts?: BlenderArtifactOptions;
}

export interface BlenderDisabledRoute {
  readonly status: "disabled";
  readonly requestId: string;
  readonly reason: "blender-disabled";
}

export interface BlenderUnavailableRoute {
  readonly status: "unavailable";
  readonly requestId: string;
  readonly mode: "optional" | "required";
  readonly runtimeId: string;
  readonly runtime: string;
  readonly reason: string;
}

export interface BlenderReadyRoute {
  readonly status: "ready";
  readonly requestId: string;
  readonly mode: "optional" | "required";
  readonly runtimeId: string;
  readonly runtime: string;
  readonly version?: string;
  readonly artifacts: BlenderArtifactContract;
}

export type BlenderRoute =
  | BlenderDisabledRoute
  | BlenderUnavailableRoute
  | BlenderReadyRoute;
