import type {
  StudioCapabilityPlan,
  StudioPlanStep,
  StudioPlannedCapability,
  StudioTask,
  StudioTaskRequest,
} from "./taskContracts.js";

const taskCapabilities = {
  "math.solve": ["math.solve"],
  "geometry.visualize": ["geometry.2d", "geometry.luadraw"],
  "animation.scene": ["animation.manim", "animation.image", "animation.image.segmentation"],
  "video.plan": ["math.solve", "geometry.2d", "video.plan"],
} as const satisfies Readonly<Record<StudioTask, readonly StudioPlannedCapability[]>>;

function step(capability: StudioPlannedCapability, sequence: number): StudioPlanStep {
  if (capability === "math.solve") return Object.freeze({ sequence, capability, component: "math-ai", action: "COMPUTE" });
  if (capability === "video.plan") return Object.freeze({ sequence, capability, component: "renderer-router", action: "PLAN" });
  if (capability === "geometry.luadraw") return Object.freeze({ sequence, capability, component: "studio.luadraw", action: "EXECUTE" });
  if (capability === "animation.image" || capability === "animation.image.segmentation") {
    return Object.freeze({ sequence, capability, component: "studio.image-animation", action: "EXECUTE" });
  }
  return Object.freeze({ sequence, capability, component: "studio.manim", action: "EXECUTE" });
}

export function planStudioTask(request: StudioTaskRequest): StudioCapabilityPlan {
  const allowed: readonly StudioPlannedCapability[] = taskCapabilities[request.task];
  if (allowed === undefined) throw new TypeError("Unknown Studio task.");
  if (request.requestedCapabilities.some((capability) => !allowed.includes(capability))) {
    throw new TypeError("Requested capability is not valid for the Studio task.");
  }
  let capabilities: readonly StudioPlannedCapability[] = request.requestedCapabilities;
  if (request.task === "math.solve" && !capabilities.includes("math.solve")) throw new TypeError("math.solve requires the math.solve capability.");
  if (request.task === "geometry.visualize" && capabilities.length !== 1) throw new TypeError("geometry.visualize requires exactly one geometry capability.");
  if (request.task === "animation.scene" && capabilities.length !== 1) throw new TypeError("animation.scene requires exactly one animation capability.");
  if (request.task === "video.plan") {
    const required: readonly StudioPlannedCapability[] = ["math.solve", "geometry.2d", "video.plan"];
    if (required.some((capability) => !capabilities.includes(capability)) || capabilities.length !== required.length) {
      throw new TypeError("video.plan requires math.solve, geometry.2d, and video.plan.");
    }
    capabilities = required;
  }
  return Object.freeze({ task: request.task, steps: Object.freeze(capabilities.map(step)) });
}
