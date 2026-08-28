// GEO-9 — Integration types.
// The layout owns the outer slot. Geometry receives it read-only.

export type LockedLayoutKind =
  | 'document'
  | 'worksheet'
  | 'assessment'
  | 'video';

export interface ReadonlyFigureSlot {
  readonly layoutKind: LockedLayoutKind;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface GeometryRenderRequest {
  readonly sceneId: string;
  readonly viewProfileId: string;
  readonly slot: ReadonlyFigureSlot;
  readonly qa: {
    semantic: boolean;
    inference: boolean;
    viewProfile: boolean;
    visibility: boolean;
    labels: boolean;
    topology: boolean;
    notation: boolean;
    regression: boolean;
  };
}

export interface InnerGeometrySafeBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface GeometryRenderEnvelope {
  readonly layoutKind: LockedLayoutKind;
  readonly outerSlot: ReadonlyFigureSlot;
  readonly innerSafeBox: InnerGeometrySafeBox;
  readonly clipToOuterSlot: true;
  readonly layoutMutationAllowed: false;
}
