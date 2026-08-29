import type { NodeMetadata, SceneGraph, Vec2 } from "../scene-graph/index.ts";

export type AnimationActionType =
  | "appear"
  | "disappear"
  | "move"
  | "highlight"
  | "draw"
  | "fade"
  | "scale"
  | "camera_focus";

export interface AnimationEventBase {
  readonly id: string;
  readonly targetId: string;
  readonly start: number;
  readonly duration: number;
}

export interface AppearEvent extends AnimationEventBase {
  readonly type: "appear";
}

export interface DisappearEvent extends AnimationEventBase {
  readonly type: "disappear";
}

export interface MoveEvent extends AnimationEventBase {
  readonly type: "move";
  readonly from?: Vec2;
  readonly to: Vec2;
}

export interface HighlightEvent extends AnimationEventBase {
  readonly type: "highlight";
  readonly color: string;
}

export interface DrawEvent extends AnimationEventBase {
  readonly type: "draw";
}

export interface FadeEvent extends AnimationEventBase {
  readonly type: "fade";
  readonly from: number;
  readonly to: number;
}

export interface ScaleEvent extends AnimationEventBase {
  readonly type: "scale";
  readonly from?: number;
  readonly to: number;
}

export interface CameraFocusEvent extends AnimationEventBase {
  readonly type: "camera_focus";
  readonly zoom?: number;
  readonly padding?: number;
}

export type AnimationEvent =
  | AppearEvent
  | DisappearEvent
  | MoveEvent
  | HighlightEvent
  | DrawEvent
  | FadeEvent
  | ScaleEvent
  | CameraFocusEvent;

export interface AnimationTimeline {
  readonly version: 1;
  readonly events: readonly AnimationEvent[];
  readonly metadata: NodeMetadata;
}

export interface TimelineValidationIssue {
  readonly path: string;
  readonly code: string;
  readonly message: string;
}

export interface TimelineValidationResult {
  readonly valid: boolean;
  readonly issues: readonly TimelineValidationIssue[];
}

export interface TimelineValidationContext {
  readonly sceneGraph: SceneGraph;
}
