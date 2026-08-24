import { planStudioTask } from "./capabilityPlanner.js";
import type { StudioPlannedCapability, StudioTask, StudioTaskRequest } from "./taskContracts.js";

const MAX_STUDIO_REQUEST_BYTES = 4096;
const tasks = new Set<StudioTask>(["math.solve", "geometry.visualize", "animation.scene", "video.plan"]);
const capabilities = new Set<StudioPlannedCapability>([
  "math.solve", "geometry.2d", "geometry.luadraw", "animation.manim",
  "animation.image", "animation.image.segmentation", "video.plan",
]);

function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const sorted = [...expected].sort();
  return actual.length === sorted.length && actual.every((key, index) => key === sorted[index]);
}

export function validateStudioTaskRequest(value: unknown): StudioTaskRequest {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError("Studio request must be an object.");
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new TypeError("Studio request must be JSON serializable.");
  }
  if (Buffer.byteLength(serialized, "utf8") > MAX_STUDIO_REQUEST_BYTES) throw new TypeError("Studio request is too large.");
  const request = value as Record<string, unknown>;
  if (!exactKeys(request, ["input", "requestedCapabilities", "task"])) throw new TypeError("Studio request fields are invalid.");
  if (typeof request.task !== "string" || !tasks.has(request.task as StudioTask)) throw new TypeError("Unknown Studio task.");
  if (!Array.isArray(request.requestedCapabilities) || request.requestedCapabilities.length === 0 ||
      request.requestedCapabilities.some((item) => typeof item !== "string" || !capabilities.has(item as StudioPlannedCapability))) {
    throw new TypeError("Studio requestedCapabilities are invalid.");
  }
  if (new Set(request.requestedCapabilities).size !== request.requestedCapabilities.length) throw new TypeError("Studio capabilities must be unique.");
  const input = request.input;
  if (input === null || typeof input !== "object" || Array.isArray(input) || !exactKeys(input as Record<string, unknown>, ["fixture"])) {
    throw new TypeError("Studio input must contain only a deterministic fixture.");
  }
  const fixture = (input as Record<string, unknown>).fixture;
  if (fixture !== "linear_equation" && fixture !== "triangle_area") throw new TypeError("Unknown Studio fixture.");
  const validated = Object.freeze({
    task: request.task as StudioTask,
    input: Object.freeze({ fixture }),
    requestedCapabilities: Object.freeze([...(request.requestedCapabilities as StudioPlannedCapability[])]),
  });
  planStudioTask(validated);
  return validated;
}
