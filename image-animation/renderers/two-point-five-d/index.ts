import {
  deserializeSceneGraph,
  serializeSceneGraph,
} from "../../core/scene-graph/index.ts";
import {
  createEstimatedDepthMap,
  type DepthSourceImage,
  type EstimatedDepthMap,
} from "../../adapters/depth/index.ts";
import type {
  RendererRoute,
  RendererRouteRequest,
  TwoPointFiveDRenderer,
  TwoPointFiveDRenderMode,
  TwoPointFiveDScene,
  TwoPointFiveDSceneInput,
} from "./types.ts";

export * from "./types.ts";

function requireNonEmpty(value: string, name: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${name} must be a non-empty string.`);
  }
}

function copySourceImage(image: DepthSourceImage): DepthSourceImage {
  requireNonEmpty(image.source, "2.5D source image");
  if (!Number.isSafeInteger(image.width) || image.width <= 0 ||
      !Number.isSafeInteger(image.height) || image.height <= 0) {
    throw new TypeError("2.5D source image dimensions must be positive safe integers.");
  }
  return Object.freeze({
    source: image.source,
    width: image.width,
    height: image.height,
    ...(image.mediaType === undefined ? {} : { mediaType: image.mediaType }),
  });
}

function copyEstimatedDepth(depth: EstimatedDepthMap): EstimatedDepthMap {
  if (depth.kind !== "estimated-depth" || depth.provenance.kind !== "estimated" ||
      depth.provenance.groundTruth !== false) {
    throw new TypeError("2.5D depth must be explicitly marked as estimated and never as ground truth.");
  }
  return createEstimatedDepthMap(depth.provenance.providerId, {
    width: depth.width,
    height: depth.height,
    values: depth.values,
    ...(depth.confidence === undefined ? {} : { confidence: depth.confidence }),
    ...(depth.provenance.model === undefined ? {} : { model: depth.provenance.model }),
  });
}

export function createTwoPointFiveDScene(input: TwoPointFiveDSceneInput): TwoPointFiveDScene {
  requireNonEmpty(input.id, "2.5D scene ID");
  const sourceImage = copySourceImage(input.sourceImage);
  const exactGeometry = deserializeSceneGraph(serializeSceneGraph(input.exactGeometry));
  const estimatedDepth = input.estimatedDepth === undefined
    ? undefined
    : copyEstimatedDepth(input.estimatedDepth);
  if (estimatedDepth !== undefined &&
      (estimatedDepth.width !== sourceImage.width || estimatedDepth.height !== sourceImage.height)) {
    throw new TypeError("2.5D estimated depth dimensions must match the source image dimensions.");
  }
  return Object.freeze({
    id: input.id,
    sourceImage,
    exactGeometry,
    ...(estimatedDepth === undefined ? {} : { estimatedDepth }),
  });
}

function resolveMode(scene: TwoPointFiveDScene, requested: RendererRouteRequest["mode"]): TwoPointFiveDRenderMode {
  const mode = requested ?? "auto";
  if (mode === "auto") {
    if (scene.estimatedDepth !== undefined) return "estimated-depth";
    if (scene.exactGeometry.nodes.length > 0) return "exact-geometry";
    return "source-image";
  }
  if (mode === "estimated-depth" && scene.estimatedDepth === undefined) {
    throw new RangeError("Estimated-depth rendering requires an estimated depth map.");
  }
  return mode;
}

function normalizeRenderer(renderer: TwoPointFiveDRenderer): TwoPointFiveDRenderer {
  requireNonEmpty(renderer.id, "2.5D renderer ID");
  if (!Array.isArray(renderer.modes) || renderer.modes.length === 0) {
    throw new TypeError(`2.5D renderer ${renderer.id} must support at least one mode.`);
  }
  const allowed = new Set<TwoPointFiveDRenderMode>(["source-image", "exact-geometry", "estimated-depth"]);
  if (renderer.modes.some((mode) => !allowed.has(mode))) {
    throw new TypeError(`2.5D renderer ${renderer.id} declares an unknown mode.`);
  }
  const modes = [...new Set(renderer.modes)].sort();
  return Object.freeze({ id: renderer.id, modes: Object.freeze(modes) });
}

export function routeTwoPointFiveDRenderer(
  scene: TwoPointFiveDScene,
  renderers: readonly TwoPointFiveDRenderer[],
  request: RendererRouteRequest = {},
): RendererRoute {
  if (!Array.isArray(renderers) || renderers.length === 0) {
    throw new RangeError("At least one 2.5D renderer is required.");
  }
  const mode = resolveMode(scene, request.mode);
  const normalized = renderers.map(normalizeRenderer);
  const ids = new Set<string>();
  for (const renderer of normalized) {
    if (ids.has(renderer.id)) throw new TypeError(`Duplicate 2.5D renderer ID: ${renderer.id}`);
    ids.add(renderer.id);
  }
  const compatible = normalized
    .filter((renderer) => renderer.modes.includes(mode))
    .sort((left, right) => left.id.localeCompare(right.id, "en"));
  if (compatible.length === 0) throw new RangeError(`No 2.5D renderer supports mode: ${mode}`);

  if (request.preferredRendererId !== undefined) {
    requireNonEmpty(request.preferredRendererId, "Preferred 2.5D renderer ID");
    const preferred = compatible.find((renderer) => renderer.id === request.preferredRendererId);
    if (preferred === undefined) {
      throw new RangeError(`Preferred 2.5D renderer does not support mode ${mode}: ${request.preferredRendererId}`);
    }
    return Object.freeze({ rendererId: preferred.id, mode, reason: "preferred" as const });
  }
  return Object.freeze({ rendererId: compatible[0].id, mode, reason: "canonical" as const });
}
