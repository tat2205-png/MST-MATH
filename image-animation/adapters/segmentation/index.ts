import {
  deserializeSceneGraph,
  serializeSceneGraph,
  type SceneGraph,
} from "../../core/scene-graph/index.ts";
import type {
  BinaryRunLengthMask,
  OfflineSegmentationFixture,
  SegmentationAttachment,
  SegmentationAttachmentInput,
  SegmentationProvider,
  SegmentationRequest,
  SegmentationResult,
  SegmentationRuntimeStatus,
  SegmentationTarget,
  SegmentedSceneGraph,
} from "./types.ts";

export * from "./types.ts";

function requireNonEmpty(value: string, name: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${name} must be a non-empty string.`);
  }
}

function copySceneGraph(graph: SceneGraph): SceneGraph {
  return deserializeSceneGraph(serializeSceneGraph(graph));
}

function normalizeRuntimeStatus(status: SegmentationRuntimeStatus): SegmentationRuntimeStatus {
  if (typeof status !== "object" || status === null || typeof status.available !== "boolean") {
    throw new TypeError("Segmentation runtime status must report whether the runtime is available.");
  }
  requireNonEmpty(status.runtime, "Segmentation runtime name");
  if (status.available === false) {
    requireNonEmpty(status.reason, "Unavailable runtime reason");
    return Object.freeze({ available: false as const, runtime: status.runtime, reason: status.reason });
  }
  return Object.freeze({ available: true as const, runtime: status.runtime });
}

function normalizeTarget(target: SegmentationTarget, graph: SceneGraph): SegmentationTarget {
  if (typeof target !== "object" || target === null) {
    throw new TypeError("Segmentation target must be an object or layer target.");
  }
  if (target.kind === "object") {
    requireNonEmpty(target.nodeId, "Segmentation target node ID");
    if (!graph.nodes.some((node) => node.identity.id === target.nodeId)) {
      throw new RangeError(`Segmentation target node does not exist: ${target.nodeId}`);
    }
    return Object.freeze({ kind: "object" as const, nodeId: target.nodeId });
  }
  if (target.kind === "layer") {
    if (!Number.isSafeInteger(target.layer)) {
      throw new TypeError("Segmentation target layer must be a safe integer.");
    }
    if (!graph.nodes.some((node) => node.placement.layer === target.layer)) {
      throw new RangeError(`Segmentation target layer does not exist: ${target.layer}`);
    }
    return Object.freeze({ kind: "layer" as const, layer: target.layer });
  }
  throw new TypeError("Segmentation target kind must be object or layer.");
}

function normalizeMask(mask: BinaryRunLengthMask): BinaryRunLengthMask {
  if (typeof mask !== "object" || mask === null || mask.encoding !== "binary-rle") {
    throw new TypeError("Segmentation mask encoding must be binary-rle.");
  }
  if (!Number.isSafeInteger(mask.width) || mask.width <= 0 ||
      !Number.isSafeInteger(mask.height) || mask.height <= 0) {
    throw new TypeError("Segmentation mask dimensions must be positive safe integers.");
  }
  if (mask.startsWith !== 0 && mask.startsWith !== 1) {
    throw new TypeError("Segmentation mask startsWith must be 0 or 1.");
  }
  if (!Array.isArray(mask.runs) || mask.runs.length === 0 ||
      mask.runs.some((run) => !Number.isSafeInteger(run) || run <= 0)) {
    throw new TypeError("Segmentation mask runs must be a non-empty array of positive safe integers.");
  }
  const area = mask.width * mask.height;
  if (!Number.isSafeInteger(area) || mask.runs.reduce((sum, run) => sum + run, 0) !== area) {
    throw new TypeError("Segmentation mask runs must cover exactly width times height pixels.");
  }
  return Object.freeze({
    encoding: "binary-rle" as const,
    width: mask.width,
    height: mask.height,
    startsWith: mask.startsWith,
    runs: Object.freeze([...mask.runs]),
  });
}

function normalizeAttachment(
  input: SegmentationAttachmentInput,
  providerId: string,
  graph: SceneGraph,
): SegmentationAttachment {
  requireNonEmpty(input.id, "Segmentation attachment ID");
  if (input.label !== undefined && typeof input.label !== "string") {
    throw new TypeError(`Segmentation attachment ${input.id} label must be a string.`);
  }
  if (input.confidence !== undefined &&
      (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1)) {
    throw new TypeError(`Segmentation attachment ${input.id} confidence must be between 0 and 1.`);
  }
  return Object.freeze({
    id: input.id,
    providerId,
    target: normalizeTarget(input.target, graph),
    mask: normalizeMask(input.mask),
    ...(input.label === undefined ? {} : { label: input.label }),
    ...(input.confidence === undefined ? {} : { confidence: input.confidence }),
  });
}

export function attachSegmentation(
  sceneGraph: SceneGraph,
  providerId: string,
  inputs: readonly SegmentationAttachmentInput[],
): SegmentedSceneGraph {
  requireNonEmpty(providerId, "Segmentation provider ID");
  if (!Array.isArray(inputs)) {
    throw new TypeError("Segmentation provider must return an array of attachments.");
  }

  const graph = copySceneGraph(sceneGraph);
  const ids = new Set<string>();
  const attachments = inputs.map((input) => {
    const attachment = normalizeAttachment(input, providerId, graph);
    if (ids.has(attachment.id)) {
      throw new TypeError(`Duplicate segmentation attachment ID: ${attachment.id}`);
    }
    ids.add(attachment.id);
    return attachment;
  });

  return Object.freeze({
    sceneGraph: graph,
    attachments: Object.freeze(attachments),
  });
}

export async function requestSegmentation(
  provider: SegmentationProvider,
  request: SegmentationRequest,
): Promise<SegmentationResult> {
  requireNonEmpty(provider.id, "Segmentation provider ID");
  requireNonEmpty(request.id, "Segmentation request ID");
  requireNonEmpty(request.image.source, "Segmentation image source");

  const status = normalizeRuntimeStatus(await provider.runtimeStatus());
  if (status.available === false) {
    return Object.freeze({
      status: "unavailable" as const,
      requestId: request.id,
      providerId: provider.id,
      runtime: status.runtime,
      reason: status.reason,
    });
  }

  const providerGraph = copySceneGraph(request.sceneGraph);
  const attachments = await provider.segment(Object.freeze({
    ...request,
    image: Object.freeze({ ...request.image }),
    sceneGraph: providerGraph,
  }));

  return Object.freeze({
    status: "available" as const,
    requestId: request.id,
    providerId: provider.id,
    runtime: status.runtime,
    output: attachSegmentation(request.sceneGraph, provider.id, attachments),
  });
}

function copyFixtureAttachment(input: SegmentationAttachmentInput): SegmentationAttachmentInput {
  const target = input.target.kind === "object"
    ? Object.freeze({ kind: "object" as const, nodeId: input.target.nodeId })
    : Object.freeze({ kind: "layer" as const, layer: input.target.layer });
  return Object.freeze({
    id: input.id,
    target,
    mask: Object.freeze({
      ...input.mask,
      runs: Object.freeze([...input.mask.runs]),
    }),
    ...(input.label === undefined ? {} : { label: input.label }),
    ...(input.confidence === undefined ? {} : { confidence: input.confidence }),
  });
}

export function createOfflineSegmentationProvider(
  id: string,
  fixture: OfflineSegmentationFixture,
): SegmentationProvider {
  requireNonEmpty(id, "Offline segmentation provider ID");
  const runtime = fixture.runtime ?? "offline-fixture";
  requireNonEmpty(runtime, "Offline segmentation runtime name");
  if (!Array.isArray(fixture.attachments)) {
    throw new TypeError("Offline segmentation fixture attachments must be an array.");
  }
  const attachments = Object.freeze(fixture.attachments.map(copyFixtureAttachment));

  return Object.freeze({
    id,
    runtimeStatus(): SegmentationRuntimeStatus {
      return Object.freeze({ available: true as const, runtime });
    },
    async segment(): Promise<readonly SegmentationAttachmentInput[]> {
      return attachments.map(copyFixtureAttachment);
    },
  });
}
