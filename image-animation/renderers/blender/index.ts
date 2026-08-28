import {
  deserializeSceneGraph,
  serializeSceneGraph,
  type SceneGraph,
} from "../../core/scene-graph/index.ts";
import {
  deserializeAnimationTimeline,
  serializeAnimationTimeline,
  type AnimationTimeline,
} from "../../core/timeline/index.ts";
import type {
  BlenderArtifactContract,
  BlenderArtifactOptions,
  BlenderRoute,
  BlenderRouteRequest,
  BlenderRoutingMode,
  BlenderRuntime,
  BlenderRuntimeStatus,
} from "./types.ts";

export * from "./types.ts";

const DEFAULT_ROOT_DIRECTORY = "artifacts/blender";
const DEFAULT_FILE_STEM = "scene";

function requireNonEmpty(value: string, name: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${name} must be a non-empty string.`);
  }
  return value;
}

function normalizeRelativePath(value: string, name: string): string {
  const normalized = requireNonEmpty(value, name).replaceAll("\\", "/");
  if (
    normalized.startsWith("/") ||
    /^[A-Za-z]:\//.test(normalized) ||
    normalized.split("/").some((part) => part === "..")
  ) {
    throw new TypeError(`${name} must be a relative path without parent traversal.`);
  }

  const parts = normalized.split("/").filter((part) => part.length > 0 && part !== ".");
  if (parts.length === 0) {
    throw new TypeError(`${name} must contain a path component.`);
  }
  return parts.join("/");
}

function normalizeFileStem(value: string): string {
  const stem = requireNonEmpty(value, "Blender artifact file stem");
  if (stem === "." || stem === ".." || stem.includes("/") || stem.includes("\\")) {
    throw new TypeError("Blender artifact file stem must be a single safe path component.");
  }
  return stem;
}

function joinPath(root: string, fileName: string): string {
  return `${root}/${fileName}`;
}

function normalizeRuntimeStatus(status: BlenderRuntimeStatus): BlenderRuntimeStatus {
  if (typeof status !== "object" || status === null || typeof status.available !== "boolean") {
    throw new TypeError("Blender runtime status must report whether the runtime is available.");
  }

  const runtime = requireNonEmpty(status.runtime, "Blender runtime name");
  if (status.available === false) {
    const reason = requireNonEmpty(status.reason, "Unavailable Blender runtime reason");
    return Object.freeze({ available: false as const, runtime, reason });
  }

  if (status.version !== undefined) {
    const version = requireNonEmpty(status.version, "Blender runtime version");
    return Object.freeze({ available: true as const, runtime, version });
  }
  return Object.freeze({ available: true as const, runtime });
}

function normalizeMode(mode: BlenderRoutingMode | undefined): BlenderRoutingMode {
  const normalized = mode ?? "optional";
  if (normalized !== "disabled" && normalized !== "optional" && normalized !== "required") {
    throw new TypeError("Blender routing mode must be disabled, optional, or required.");
  }
  return normalized;
}

function canonicalInputs(
  sceneGraph: SceneGraph,
  timeline: AnimationTimeline,
): {
  readonly sceneGraph: SceneGraph;
  readonly timeline: AnimationTimeline;
  readonly sceneGraphJson: string;
  readonly timelineJson: string;
} {
  const serializedSceneGraph = serializeSceneGraph(sceneGraph);
  const canonicalGraph = deserializeSceneGraph(serializedSceneGraph);
  const sceneGraphJson = JSON.stringify(canonicalGraph);
  const timelineJson = serializeAnimationTimeline(timeline, canonicalGraph);
  const canonicalTimeline = deserializeAnimationTimeline(timelineJson, canonicalGraph);
  return {
    sceneGraph: canonicalGraph,
    timeline: canonicalTimeline,
    sceneGraphJson,
    timelineJson,
  };
}

export function createBlenderArtifactContract(
  requestId: string,
  sceneGraph: SceneGraph,
  timeline: AnimationTimeline,
  options: BlenderArtifactOptions = {},
): BlenderArtifactContract {
  const normalizedRequestId = requireNonEmpty(requestId, "Blender request ID");
  const rootDirectory = normalizeRelativePath(
    options.rootDirectory ?? DEFAULT_ROOT_DIRECTORY,
    "Blender artifact root directory",
  );
  const fileStem = normalizeFileStem(options.fileStem ?? DEFAULT_FILE_STEM);
  const videoExtension = options.videoExtension ?? "mp4";
  if (videoExtension !== "mp4" && videoExtension !== "webm") {
    throw new TypeError("Blender video extension must be mp4 or webm.");
  }

  const canonical = canonicalInputs(sceneGraph, timeline);
  return Object.freeze({
    contractVersion: 1 as const,
    requestId: normalizedRequestId,
    rootDirectory,
    sceneGraphPath: joinPath(rootDirectory, `${fileStem}.scene-graph.json`),
    timelinePath: joinPath(rootDirectory, `${fileStem}.timeline.json`),
    blendPath: joinPath(rootDirectory, `${fileStem}.blend`),
    videoPath: joinPath(rootDirectory, `${fileStem}.${videoExtension}`),
    sceneGraphJson: canonical.sceneGraphJson,
    timelineJson: canonical.timelineJson,
  });
}

export async function routeBlenderRender(
  runtime: BlenderRuntime,
  request: BlenderRouteRequest,
): Promise<BlenderRoute> {
  requireNonEmpty(request.id, "Blender request ID");
  const mode = normalizeMode(request.mode);

  if (mode === "disabled") {
    return Object.freeze({
      status: "disabled" as const,
      requestId: request.id,
      reason: "blender-disabled" as const,
    });
  }

  requireNonEmpty(runtime.id, "Blender runtime ID");
  const status = normalizeRuntimeStatus(await runtime.runtimeStatus());
  if (status.available === false) {
    return Object.freeze({
      status: "unavailable" as const,
      requestId: request.id,
      mode,
      runtimeId: runtime.id,
      runtime: status.runtime,
      reason: status.reason,
    });
  }

  const artifacts = createBlenderArtifactContract(
    request.id,
    request.sceneGraph,
    request.timeline,
    request.artifacts,
  );
  return Object.freeze({
    status: "ready" as const,
    requestId: request.id,
    mode,
    runtimeId: runtime.id,
    runtime: status.runtime,
    ...(status.version === undefined ? {} : { version: status.version }),
    artifacts,
  });
}
