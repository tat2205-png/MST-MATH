export interface DepthSourceImage {
  readonly source: string;
  readonly width: number;
  readonly height: number;
  readonly mediaType?: string;
}

export interface EstimatedDepthProvenance {
  readonly kind: "estimated";
  readonly groundTruth: false;
  readonly providerId: string;
  readonly model?: string;
}

export interface EstimatedDepthMapInput {
  readonly width: number;
  readonly height: number;
  readonly values: readonly number[];
  readonly confidence?: number;
  readonly model?: string;
}

export interface EstimatedDepthMap {
  readonly kind: "estimated-depth";
  readonly encoding: "normalized-f32-row-major";
  readonly width: number;
  readonly height: number;
  readonly values: readonly number[];
  readonly confidence?: number;
  readonly provenance: EstimatedDepthProvenance;
}

export interface DepthEstimationRequest {
  readonly id: string;
  readonly image: DepthSourceImage;
  readonly context?: Readonly<Record<string, unknown>>;
}

export type DepthRuntimeStatus =
  | {
      readonly available: true;
      readonly runtime: string;
    }
  | {
      readonly available: false;
      readonly runtime: string;
      readonly reason: string;
    };

export interface DepthProvider {
  readonly id: string;
  runtimeStatus(): DepthRuntimeStatus | Promise<DepthRuntimeStatus>;
  estimate(request: DepthEstimationRequest): Promise<EstimatedDepthMapInput>;
}

export type DepthEstimationResult =
  | {
      readonly status: "available";
      readonly requestId: string;
      readonly providerId: string;
      readonly runtime: string;
      readonly sourceImage: DepthSourceImage;
      readonly estimatedDepth: EstimatedDepthMap;
    }
  | {
      readonly status: "unavailable";
      readonly requestId: string;
      readonly providerId: string;
      readonly runtime: string;
      readonly reason: string;
      readonly sourceImage: DepthSourceImage;
    };

export interface OfflineDepthFixture extends EstimatedDepthMapInput {
  readonly runtime?: string;
}
