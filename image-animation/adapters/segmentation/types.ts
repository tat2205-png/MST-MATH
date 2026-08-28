import type { SceneGraph } from "../../core/scene-graph/index.ts";

export interface SegmentationImage {
  readonly source: string;
  readonly mediaType?: string;
}

export type SegmentationTarget =
  | {
      readonly kind: "object";
      readonly nodeId: string;
    }
  | {
      readonly kind: "layer";
      readonly layer: number;
    };

export interface BinaryRunLengthMask {
  readonly encoding: "binary-rle";
  readonly width: number;
  readonly height: number;
  readonly startsWith: 0 | 1;
  readonly runs: readonly number[];
}

export interface SegmentationAttachmentInput {
  readonly id: string;
  readonly target: SegmentationTarget;
  readonly mask: BinaryRunLengthMask;
  readonly label?: string;
  readonly confidence?: number;
}

export interface SegmentationAttachment {
  readonly id: string;
  readonly providerId: string;
  readonly target: SegmentationTarget;
  readonly mask: BinaryRunLengthMask;
  readonly label?: string;
  readonly confidence?: number;
}

export interface SegmentationRequest {
  readonly id: string;
  readonly image: SegmentationImage;
  readonly sceneGraph: SceneGraph;
  readonly context?: Readonly<Record<string, unknown>>;
}

export type SegmentationRuntimeStatus =
  | {
      readonly available: true;
      readonly runtime: string;
    }
  | {
      readonly available: false;
      readonly runtime: string;
      readonly reason: string;
    };

export interface SegmentationProvider {
  readonly id: string;
  runtimeStatus(): SegmentationRuntimeStatus | Promise<SegmentationRuntimeStatus>;
  segment(request: SegmentationRequest): Promise<readonly SegmentationAttachmentInput[]>;
}

export interface SegmentedSceneGraph {
  readonly sceneGraph: SceneGraph;
  readonly attachments: readonly SegmentationAttachment[];
}

export type SegmentationResult =
  | {
      readonly status: "available";
      readonly requestId: string;
      readonly providerId: string;
      readonly runtime: string;
      readonly output: SegmentedSceneGraph;
    }
  | {
      readonly status: "unavailable";
      readonly requestId: string;
      readonly providerId: string;
      readonly runtime: string;
      readonly reason: string;
    };

export interface OfflineSegmentationFixture {
  readonly runtime?: string;
  readonly attachments: readonly SegmentationAttachmentInput[];
}
