import {
  requestEstimatedDepth,
  type DepthProvider,
  type DepthRuntimeStatus,
} from "../../adapters/depth/index.ts";
import { createTwoPointFiveDScene } from "../../renderers/two-point-five-d/index.ts";
import type {
  DepthCameraMotionInput,
  DepthLayerMotion,
  DepthMotionInput,
  DepthRuntimeCapability,
  DepthRuntimeRequest,
  DepthRuntimeResult,
  ObjectPlaneTransform,
} from "./types.ts";

export * from "./types.ts";

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function finite(value: number, name: string): number {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite.`);
  return value;
}

function normalizedDepth(value: number, name: string): number {
  finite(value, name);
  if (value < 0 || value > 1) throw new RangeError(`${name} must be between 0 and 1.`);
  return value;
}

function freezeCapability(capability: DepthRuntimeCapability): DepthRuntimeCapability {
  return Object.freeze(capability);
}

function normalizeCapability(providerId: string, status: DepthRuntimeStatus): DepthRuntimeCapability {
  if (!nonEmpty(status.runtime)) {
    return freezeCapability({
      providerId,
      status: "NOT_TESTED",
      reason: "Depth runtime returned an invalid runtime name.",
    });
  }
  if (status.available === true) {
    return freezeCapability({ providerId, status: "AVAILABLE", runtime: status.runtime });
  }
  if (!nonEmpty(status.reason)) {
    return freezeCapability({
      providerId,
      status: "NOT_TESTED",
      runtime: status.runtime,
      reason: "Depth runtime returned an invalid unavailability reason.",
    });
  }
  return freezeCapability({
    providerId,
    status: "NOT_AVAILABLE",
    runtime: status.runtime,
    reason: status.reason,
  });
}

export async function probeDepthRuntime(provider: DepthProvider): Promise<DepthRuntimeCapability> {
  if (!nonEmpty(provider?.id)) throw new TypeError("Depth provider ID must be a non-empty string.");
  if (typeof provider.runtimeStatus !== "function") {
    return freezeCapability({
      providerId: provider.id,
      status: "NOT_TESTED",
      reason: "Depth provider does not expose a runtime status probe.",
    });
  }
  try {
    const status = await provider.runtimeStatus();
    if (typeof status !== "object" || status === null || typeof status.available !== "boolean") {
      return freezeCapability({
        providerId: provider.id,
        status: "NOT_TESTED",
        reason: "Depth runtime returned a malformed capability status.",
      });
    }
    return normalizeCapability(provider.id, status);
  } catch (error) {
    return freezeCapability({
      providerId: provider.id,
      status: "NOT_TESTED",
      reason: `Depth runtime probe failed: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

function copyCamera(camera: DepthCameraMotionInput): DepthCameraMotionInput {
  const zoom = finite(camera.zoom, "Depth camera zoom");
  if (zoom <= 0) throw new RangeError("Depth camera zoom must be greater than zero.");
  return Object.freeze({
    deltaX: finite(camera.deltaX, "Depth camera deltaX"),
    deltaY: finite(camera.deltaY, "Depth camera deltaY"),
    zoom,
  });
}

function buildLayerMotion(motion: DepthMotionInput): readonly DepthLayerMotion[] {
  const strength = finite(motion.parallaxStrength, "Depth parallax strength");
  const separation = finite(motion.separation, "Depth separation");
  if (strength < 0) throw new RangeError("Depth parallax strength must be non-negative.");
  if (separation < 0) throw new RangeError("Depth separation must be non-negative.");
  const layers = new Set<number>();
  const normalized = motion.layerDepths.map((input) => {
    if (!Number.isSafeInteger(input.layer)) throw new TypeError("Depth layer must be a safe integer.");
    if (layers.has(input.layer)) throw new TypeError(`Duplicate depth layer: ${input.layer}`);
    layers.add(input.layer);
    const depth = normalizedDepth(input.depth, `Depth for layer ${input.layer}`);
    return Object.freeze({
      layer: input.layer,
      depth,
      separatedDepth: depth * separation,
      parallaxX: -motion.camera.deltaX * depth * strength,
      parallaxY: -motion.camera.deltaY * depth * strength,
    });
  });
  return Object.freeze(normalized.sort((left, right) => left.layer - right.layer));
}

function buildObjectPlanes(
  input: DepthMotionInput,
  nodeIds: ReadonlySet<string>,
): readonly ObjectPlaneTransform[] {
  const seen = new Set<string>();
  const planes = (input.objectPlanes ?? []).map((plane) => {
    if (!nonEmpty(plane.nodeId)) throw new TypeError("Object-plane node ID must be a non-empty string.");
    if (!nodeIds.has(plane.nodeId)) throw new RangeError(`Object-plane node does not exist: ${plane.nodeId}`);
    if (seen.has(plane.nodeId)) throw new TypeError(`Duplicate object-plane node ID: ${plane.nodeId}`);
    seen.add(plane.nodeId);
    const scale = finite(plane.scale ?? 1, `Object-plane ${plane.nodeId} scale`);
    if (scale <= 0) throw new RangeError(`Object-plane ${plane.nodeId} scale must be greater than zero.`);
    return Object.freeze({
      nodeId: plane.nodeId,
      depthOffset: finite(plane.depthOffset ?? 0, `Object-plane ${plane.nodeId} depth offset`),
      translateX: finite(plane.translateX ?? 0, `Object-plane ${plane.nodeId} translateX`),
      translateY: finite(plane.translateY ?? 0, `Object-plane ${plane.nodeId} translateY`),
      scale,
    });
  });
  return Object.freeze(planes.sort((left, right) => left.nodeId.localeCompare(right.nodeId, "en")));
}

export async function runDepthRuntime(input: DepthRuntimeRequest): Promise<DepthRuntimeResult> {
  if (!nonEmpty(input.sceneId)) throw new TypeError("Depth runtime scene ID must be a non-empty string.");
  const capability = await probeDepthRuntime(input.provider);
  if (capability.status !== "AVAILABLE" || capability.runtime === undefined) {
    const status = capability.status === "NOT_AVAILABLE" ? "NOT_AVAILABLE" : "NOT_TESTED";
    return Object.freeze({
      status: "SKIPPED" as const,
      capability: Object.freeze({ ...capability, status }),
    });
  }

  const runtime = capability.runtime;
  const cachedProvider: DepthProvider = Object.freeze({
    id: input.provider.id,
    runtimeStatus(): DepthRuntimeStatus {
      return Object.freeze({ available: true as const, runtime });
    },
    estimate: input.provider.estimate.bind(input.provider),
  });
  const result = await requestEstimatedDepth(cachedProvider, input.request);
  if (result.status !== "available") {
    throw new Error("Available depth runtime unexpectedly skipped depth estimation.");
  }
  const scene = createTwoPointFiveDScene({
    id: input.sceneId,
    sourceImage: result.sourceImage,
    exactGeometry: input.exactGeometry,
    estimatedDepth: result.estimatedDepth,
  });
  const camera = copyCamera(input.motion.camera);
  const layers = buildLayerMotion({ ...input.motion, camera });
  const nodeIds = new Set(scene.exactGeometry.nodes.map((node) => node.identity.id));
  const objectPlanes = buildObjectPlanes(input.motion, nodeIds);

  return Object.freeze({
    status: "COMPLETED" as const,
    capability: Object.freeze({ providerId: capability.providerId, status: "AVAILABLE" as const, runtime }),
    plan: Object.freeze({ scene, camera, layers, objectPlanes }),
  });
}
