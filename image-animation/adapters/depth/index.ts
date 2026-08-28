import type {
  DepthEstimationRequest,
  DepthEstimationResult,
  DepthProvider,
  DepthRuntimeStatus,
  DepthSourceImage,
  EstimatedDepthMap,
  EstimatedDepthMapInput,
  OfflineDepthFixture,
} from "./types.ts";

export * from "./types.ts";

function requireNonEmpty(value: string, name: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${name} must be a non-empty string.`);
  }
}

function positiveDimension(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`${name} must be a positive safe integer.`);
  }
  return value;
}

function copySourceImage(image: DepthSourceImage): DepthSourceImage {
  requireNonEmpty(image.source, "Depth source image");
  positiveDimension(image.width, "Depth source image width");
  positiveDimension(image.height, "Depth source image height");
  if (image.mediaType !== undefined) requireNonEmpty(image.mediaType, "Depth source image media type");
  return Object.freeze({
    source: image.source,
    width: image.width,
    height: image.height,
    ...(image.mediaType === undefined ? {} : { mediaType: image.mediaType }),
  });
}

function normalizeRuntimeStatus(status: DepthRuntimeStatus): DepthRuntimeStatus {
  if (typeof status !== "object" || status === null || typeof status.available !== "boolean") {
    throw new TypeError("Depth runtime status must report whether the runtime is available.");
  }
  requireNonEmpty(status.runtime, "Depth runtime name");
  if (status.available === false) {
    requireNonEmpty(status.reason, "Unavailable depth runtime reason");
    return Object.freeze({ available: false as const, runtime: status.runtime, reason: status.reason });
  }
  return Object.freeze({ available: true as const, runtime: status.runtime });
}

function copyInput(input: EstimatedDepthMapInput): EstimatedDepthMapInput {
  return Object.freeze({
    width: input.width,
    height: input.height,
    values: Object.freeze([...input.values]),
    ...(input.confidence === undefined ? {} : { confidence: input.confidence }),
    ...(input.model === undefined ? {} : { model: input.model }),
  });
}

export function createEstimatedDepthMap(
  providerId: string,
  input: EstimatedDepthMapInput,
): EstimatedDepthMap {
  requireNonEmpty(providerId, "Depth provider ID");
  const width = positiveDimension(input.width, "Estimated depth width");
  const height = positiveDimension(input.height, "Estimated depth height");
  const area = width * height;
  if (!Number.isSafeInteger(area)) throw new TypeError("Estimated depth dimensions are too large.");
  if (!Array.isArray(input.values) || input.values.length !== area) {
    throw new TypeError("Estimated depth values must contain exactly width times height samples.");
  }
  if (input.values.some((value) => !Number.isFinite(value) || value < 0 || value > 1)) {
    throw new TypeError("Estimated depth samples must be finite normalized values between 0 and 1.");
  }
  if (input.confidence !== undefined &&
      (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1)) {
    throw new TypeError("Estimated depth confidence must be between 0 and 1.");
  }
  if (input.model !== undefined) requireNonEmpty(input.model, "Estimated depth model");

  return Object.freeze({
    kind: "estimated-depth" as const,
    encoding: "normalized-f32-row-major" as const,
    width,
    height,
    values: Object.freeze([...input.values]),
    ...(input.confidence === undefined ? {} : { confidence: input.confidence }),
    provenance: Object.freeze({
      kind: "estimated" as const,
      groundTruth: false as const,
      providerId,
      ...(input.model === undefined ? {} : { model: input.model }),
    }),
  });
}

export async function requestEstimatedDepth(
  provider: DepthProvider,
  request: DepthEstimationRequest,
): Promise<DepthEstimationResult> {
  requireNonEmpty(provider.id, "Depth provider ID");
  requireNonEmpty(request.id, "Depth request ID");
  const sourceImage = copySourceImage(request.image);
  const status = normalizeRuntimeStatus(await provider.runtimeStatus());
  if (status.available === false) {
    return Object.freeze({
      status: "unavailable" as const,
      requestId: request.id,
      providerId: provider.id,
      runtime: status.runtime,
      reason: status.reason,
      sourceImage,
    });
  }

  const providerRequest: DepthEstimationRequest = Object.freeze({
    ...request,
    image: sourceImage,
  });
  const input = await provider.estimate(providerRequest);
  if (input.width !== sourceImage.width || input.height !== sourceImage.height) {
    throw new TypeError("Estimated depth dimensions must match the source image dimensions.");
  }
  return Object.freeze({
    status: "available" as const,
    requestId: request.id,
    providerId: provider.id,
    runtime: status.runtime,
    sourceImage,
    estimatedDepth: createEstimatedDepthMap(provider.id, input),
  });
}

export function createOfflineDepthProvider(id: string, fixture: OfflineDepthFixture): DepthProvider {
  requireNonEmpty(id, "Offline depth provider ID");
  const runtime = fixture.runtime ?? "offline-fixture";
  requireNonEmpty(runtime, "Offline depth runtime name");
  const copied = copyInput(fixture);
  return Object.freeze({
    id,
    runtimeStatus(): DepthRuntimeStatus {
      return Object.freeze({ available: true as const, runtime });
    },
    async estimate(): Promise<EstimatedDepthMapInput> {
      return copyInput(copied);
    },
  });
}
