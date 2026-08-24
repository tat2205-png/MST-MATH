import {
  requestSegmentation,
  type SegmentationProvider,
  type SegmentationRuntimeStatus,
} from "../../adapters/segmentation/index.ts";
import type {
  SegmentationRuntimeCapability,
  SegmentationSmokeRequest,
  SegmentationSmokeResult,
} from "./types.ts";

export * from "./types.ts";

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function freezeCapability(
  capability: SegmentationRuntimeCapability,
): SegmentationRuntimeCapability {
  return Object.freeze(capability);
}

function validateAvailableStatus(
  providerId: string,
  status: SegmentationRuntimeStatus,
): SegmentationRuntimeCapability {
  if (!nonEmpty(status.runtime)) {
    return freezeCapability({
      providerId,
      status: "NOT_TESTED",
      reason: "Segmentation runtime returned an invalid runtime name.",
    });
  }
  if (status.available === true) {
    return freezeCapability({
      providerId,
      status: "AVAILABLE",
      runtime: status.runtime,
    });
  }
  if (!nonEmpty(status.reason)) {
    return freezeCapability({
      providerId,
      status: "NOT_TESTED",
      runtime: status.runtime,
      reason: "Segmentation runtime returned an invalid unavailability reason.",
    });
  }
  return freezeCapability({
    providerId,
    status: "NOT_AVAILABLE",
    runtime: status.runtime,
    reason: status.reason,
  });
}

export async function probeSegmentationRuntime(
  provider: SegmentationProvider,
): Promise<SegmentationRuntimeCapability> {
  if (!nonEmpty(provider?.id)) {
    throw new TypeError("Segmentation provider ID must be a non-empty string.");
  }
  if (typeof provider.runtimeStatus !== "function") {
    return freezeCapability({
      providerId: provider.id,
      status: "NOT_TESTED",
      reason: "Segmentation provider does not expose a runtime status probe.",
    });
  }

  try {
    const status = await provider.runtimeStatus();
    if (typeof status !== "object" || status === null ||
        typeof status.available !== "boolean") {
      return freezeCapability({
        providerId: provider.id,
        status: "NOT_TESTED",
        reason: "Segmentation runtime returned a malformed capability status.",
      });
    }
    return validateAvailableStatus(provider.id, status);
  } catch (error) {
    return freezeCapability({
      providerId: provider.id,
      status: "NOT_TESTED",
      reason: `Segmentation runtime probe failed: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

export async function runSegmentationSmoke(
  input: SegmentationSmokeRequest,
): Promise<SegmentationSmokeResult> {
  const capability = await probeSegmentationRuntime(input.provider);
  if (capability.status === "NOT_AVAILABLE") {
    return Object.freeze({
      status: "SKIPPED" as const,
      capability: Object.freeze({
        ...capability,
        status: "NOT_AVAILABLE" as const,
      }),
    });
  }
  if (capability.status === "NOT_TESTED" || capability.runtime === undefined) {
    return Object.freeze({
      status: "SKIPPED" as const,
      capability: Object.freeze({
        ...capability,
        status: "NOT_TESTED" as const,
      }),
    });
  }

  const cachedProvider: SegmentationProvider = Object.freeze({
    id: input.provider.id,
    runtimeStatus(): SegmentationRuntimeStatus {
      return Object.freeze({
        available: true as const,
        runtime: capability.runtime!,
      });
    },
    segment: input.provider.segment.bind(input.provider),
  });
  const result = await requestSegmentation(cachedProvider, input.request);
  if (result.status !== "available") {
    throw new Error("Available segmentation runtime unexpectedly skipped smoke execution.");
  }

  return Object.freeze({
    status: "COMPLETED" as const,
    capability: Object.freeze({
      providerId: capability.providerId,
      status: "AVAILABLE" as const,
      runtime: capability.runtime,
    }),
    result,
  });
}
