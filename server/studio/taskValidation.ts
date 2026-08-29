import { planStudioTask } from "./capabilityPlanner.js";
import type { StudioPlannedCapability, StudioTask, StudioTaskRequest } from "./taskContracts.js";

const MAX_STUDIO_REQUEST_BYTES = 4096;
const tasks = new Set<StudioTask>(["math.solve", "geometry.visualize", "animation.scene", "video.plan", "video.render"]);
const capabilities = new Set<StudioPlannedCapability>([
  "math.solve", "geometry.2d", "geometry.luadraw", "animation.manim",
  "animation.image", "animation.image.segmentation", "video.plan", "video.render",
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
  if (input === null || typeof input !== "object" || Array.isArray(input)) throw new TypeError("Studio input must be an object.");
  let validatedInput: StudioTaskRequest["input"];
  if (request.task === "math.solve" || request.task === "video.render") {
    const inputRecord = input as Record<string, unknown>;
    const keys = Object.keys(inputRecord);
    if (!keys.includes("text") || keys.some((key) => key !== "text" && key !== "video")) throw new TypeError("Studio real execution input fields are invalid.");
    const text = (input as Record<string, unknown>).text;
    if (typeof text !== "string" || text.trim().length === 0 || text.length > 1024) throw new TypeError("Studio math text is invalid.");
    const video = inputRecord.video;
    if (video !== undefined) {
      if (video === null || typeof video !== "object" || Array.isArray(video) || !Object.keys(video).every((key) => key === "resolution" || key === "fps")) throw new TypeError("Studio video options are invalid.");
      const options = video as Record<string, unknown>;
      if (options.resolution !== undefined && options.resolution !== "480p" && options.resolution !== "720p") throw new TypeError("Studio video resolution is invalid.");
      if (options.fps !== undefined && options.fps !== 24 && options.fps !== 30) throw new TypeError("Studio video fps is invalid.");
      const resolution = options.resolution as "480p" | "720p" | undefined;
      const fps = options.fps as 24 | 30 | undefined;
      validatedInput = Object.freeze({ text: text.trim(), video: Object.freeze({ ...(resolution === undefined ? {} : { resolution }), ...(fps === undefined ? {} : { fps }) }) });
    } else validatedInput = Object.freeze({ text: text.trim() });
  } else {
    if (!exactKeys(input as Record<string, unknown>, ["fixture"])) throw new TypeError("Studio input must contain only a deterministic fixture.");
    const fixture = (input as Record<string, unknown>).fixture;
    if (fixture !== "linear_equation" && fixture !== "triangle_area") throw new TypeError("Unknown Studio fixture.");
    validatedInput = Object.freeze({ fixture });
  }
  const validated = Object.freeze({
    task: request.task as StudioTask,
    input: validatedInput,
    requestedCapabilities: Object.freeze([...(request.requestedCapabilities as StudioPlannedCapability[])]),
  });
  planStudioTask(validated);
  return validated;
}
