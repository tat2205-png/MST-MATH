import { createHash } from "node:crypto";
import type { Express, Request, Response } from "express";
import { createSceneGraph } from "../../image-animation/core/scene-graph/index.js";
import { StudioApiError } from "./apiErrors.js";
import { createStudio } from "./createStudio.js";
import { readStudioFeatureFlags, type StudioFeatureFlags } from "./featureFlags.js";
import { buildStudioRuntimeStatus, systemRuntimeProbe, type StudioRuntimeProbe } from "./runtimeStatus.js";

const MAX_CANARY_BYTES = 4096;
const CANARY_TASK = "geometry_visual";
const CANARY_FIXTURE = "triangle_area";

interface StudioApiDependencies {
  readonly flags?: () => StudioFeatureFlags;
  readonly runtimeProbe?: StudioRuntimeProbe;
}

function ownKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value).sort();
  return keys.length === expected.length && keys.every((key, index) => key === [...expected].sort()[index]);
}

export function validateStudioCanaryRequest(value: unknown): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new StudioApiError("INVALID_REQUEST", "Canary request must be an object.", 400);
  }
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new StudioApiError("INVALID_REQUEST", "Canary request must be JSON serializable.", 400);
  }
  if (Buffer.byteLength(serialized, "utf8") > MAX_CANARY_BYTES) {
    throw new StudioApiError("INVALID_REQUEST", "Canary request is too large.", 413);
  }
  const request = value as Record<string, unknown>;
  if (!ownKeys(request, ["input", "task"]) || request.task !== CANARY_TASK) {
    throw new StudioApiError("INVALID_REQUEST", "Unsupported canary request.", 400);
  }
  const input = request.input;
  if (input === null || typeof input !== "object" || Array.isArray(input) ||
      !ownKeys(input as Record<string, unknown>, ["fixture"]) ||
      (input as Record<string, unknown>).fixture !== CANARY_FIXTURE) {
    throw new StudioApiError("INVALID_REQUEST", "Unsupported canary fixture.", 400);
  }
}

export function getStudioStatus(flags: StudioFeatureFlags, probe: StudioRuntimeProbe = systemRuntimeProbe) {
  return Object.freeze({
    status: "READY" as const,
    experimental: true,
    productionPipelineChanged: false,
    executionDefault: "OFF" as const,
    engines: buildStudioRuntimeStatus(flags, probe),
  });
}

export async function executeStudioCanary(value: unknown, flags: StudioFeatureFlags) {
  validateStudioCanaryRequest(value);
  if (!flags.integrationCanary) {
    throw new StudioApiError("CAPABILITY_DISABLED", "Studio experimental execution is disabled.", 403);
  }
  const graph = createSceneGraph([
    {
      identity: { id: "triangle" },
      geometry: { kind: "polygon", points: [{ x: -2, y: -1 }, { x: 2, y: -1 }, { x: 0, y: 2 }] },
      style: { stroke: "#2563eb", strokeWidth: 2 },
      placement: { layer: 1, order: 0 },
      relations: {},
      metadata: { geometryLocked: true },
    },
    {
      identity: { id: "answer" },
      geometry: { kind: "label", position: { x: 0, y: -2 }, text: "Area = 6" },
      style: {},
      placement: { layer: 2, order: 0 },
      relations: {},
      metadata: { authority: "exact" },
    },
  ]);
  const result = await createStudio(flags).execute({ task: "geometry.2d", input: graph, output: "manim.source" });
  if (result.status === "UNAVAILABLE") throw new StudioApiError("ENGINE_UNAVAILABLE", "No deterministic engine is available.", 503);
  if (result.status !== "COMPLETED") throw new StudioApiError("EXECUTION_FAILED", "Studio canary execution failed.", 500);
  const digest = createHash("sha256").update(JSON.stringify(result.output)).digest("hex");
  return Object.freeze({
    status: "PASS" as const,
    task: CANARY_TASK,
    fixture: CANARY_FIXTURE,
    selectedEngine: result.engineId,
    capability: result.capability,
    sceneGraph: Object.freeze({ version: graph.version, nodeCount: graph.nodes.length, nodeIds: graph.nodes.map((node) => node.identity.id) }),
    rendererDecision: "manim",
    outputSha256: digest,
  });
}

function sendError(response: Response, error: unknown): void {
  const safe = error instanceof StudioApiError
    ? error
    : new StudioApiError("EXECUTION_FAILED", "Studio request failed.", 500);
  response.status(safe.httpStatus).json({ success: false, error: { code: safe.code, message: safe.message } });
}

export function registerStudioRoutes(app: Pick<Express, "get" | "post">, dependencies: StudioApiDependencies = {}): void {
  const flagsProvider = dependencies.flags ?? (() => readStudioFeatureFlags());
  const probe = dependencies.runtimeProbe ?? systemRuntimeProbe;
  app.get("/api/studio/status", (_request: Request, response: Response) => {
    try {
      response.json({ success: true, ...getStudioStatus(flagsProvider(), probe) });
    } catch (error) {
      sendError(response, error);
    }
  });
  app.post("/api/studio/canary", async (request: Request, response: Response) => {
    try {
      response.json({ success: true, result: await executeStudioCanary(request.body, flagsProvider()) });
    } catch (error) {
      sendError(response, error);
    }
  });
}
