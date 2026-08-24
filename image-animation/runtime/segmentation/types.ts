import type {
  SegmentationProvider,
  SegmentationRequest,
  SegmentationResult,
} from "../../adapters/segmentation/index.ts";

export type SegmentationCapabilityStatus =
  | "AVAILABLE"
  | "NOT_AVAILABLE"
  | "NOT_TESTED";

export interface SegmentationRuntimeCapability {
  readonly providerId: string;
  readonly status: SegmentationCapabilityStatus;
  readonly runtime?: string;
  readonly reason?: string;
}

export type SegmentationSmokeResult =
  | {
      readonly status: "COMPLETED";
      readonly capability: SegmentationRuntimeCapability & {
        readonly status: "AVAILABLE";
        readonly runtime: string;
      };
      readonly result: SegmentationResult & { readonly status: "available" };
    }
  | {
      readonly status: "SKIPPED";
      readonly capability: SegmentationRuntimeCapability & {
        readonly status: "NOT_AVAILABLE" | "NOT_TESTED";
      };
    };

export interface SegmentationSmokeRequest {
  readonly provider: SegmentationProvider;
  readonly request: SegmentationRequest;
}
