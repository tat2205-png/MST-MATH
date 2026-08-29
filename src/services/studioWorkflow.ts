export type StudioUiCapabilityStatus =
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "OPTIONAL_RUNTIME_MISSING"
  | "CORE_AVAILABLE"
  | "ROUTER_AVAILABLE";

export interface StudioRuntimeStatusItem {
  capability: string;
  status: StudioUiCapabilityStatus;
  engine: string;
  label: string;
}

export interface StudioUiPlanSummary {
  routeLabel: string;
  capabilitySummary: string;
  engineSummary: string;
  fallbackSummary: string;
  outputSummary: string;
}

export interface StudioUiPlanRequest {
  intent?: string;
  taskType?: "math" | "geometry" | "visual" | "image" | "render" | "unknown";
  geometryType?: string;
  outputFormat?: "mp4" | "png" | "gif" | "json";
}

export function normalizeRuntimeStatus(items: Array<{ capability: string; status: StudioUiCapabilityStatus; engine: string }>): StudioRuntimeStatusItem[] {
  const labels: Record<string, string> = {
    "math.solve": "Math Engine",
    "math.analyze": "Math Engine",
    "geometry.2d": "Geometry Router",
    "geometry.3d": "Geometry Router",
    "geometry.luadraw": "LuaDraw",
    "visual.manim": "Manim",
    "animation.image": "Image Animation",
    "animation.motion": "Generative Motion",
    "animation.depth25d": "Depth 2.5D",
    "animation.segmentation": "Segmentation",
    "animation.blender": "Blender",
    "render.video": "Renderer",
  };

  return items.map((item) => ({
    capability: item.capability,
    status: item.status,
    engine: item.engine,
    label: labels[item.capability] || item.capability,
  }));
}

export function deriveTaskType(input: { problem?: string; domain?: string; taskType?: string; geometryType?: string }): "math" | "geometry" | "visual" | "image" | "render" | "unknown" {
  const text = `${input.problem || ""} ${input.domain || ""} ${input.geometryType || ""}`.toLowerCase();
  if (/equation|solve|algebra|system|inequality|function|derivative|integral/.test(text)) return "math";
  if (/triangle|circle|geometry|polygon|cube|pyramid|prism|net|diagram/.test(text)) return "geometry";
  if (/image|motion|depth|segmentation|blender|generative/.test(text)) return "image";
  if (input.taskType) return input.taskType as any;
  return "unknown";
}

export function buildStudioUiPlanSummary(plan: {
  featureEnabled?: boolean;
  routeId: string;
  selectedCapabilities: string[];
  selectedEngines: string[];
  steps: Array<{ capability: string; engine: string; status: StudioUiCapabilityStatus; rationale: string }>;
  rationale: string;
  outputFormat: string;
}): StudioUiPlanSummary {
  const routeLabel = plan.routeId || "UNKNOWN";
  const capabilitySummary = plan.selectedCapabilities.map((capability) => {
    const label = capability.includes("geometry") ? "Geometry" : capability.includes("math") ? "Math" : capability.includes("render") ? "Renderer" : capability.includes("visual") ? "Manim" : capability.includes("animation") ? "Animation" : capability;
    return label;
  }).join(", ");

  const engineSummary = plan.selectedEngines.join(", ");
  const fallbackSummary = plan.steps.filter((step) => step.status !== "AVAILABLE").map((step) => `${step.engine}:${step.status}`).join("; ") || "None";
  const outputSummary = plan.outputFormat ? `Output: ${plan.outputFormat.toUpperCase()}` : "Output: MP4";

  return {
    routeLabel,
    capabilitySummary,
    engineSummary,
    fallbackSummary,
    outputSummary,
  };
}

export async function requestStudioPlan(request: StudioUiPlanRequest): Promise<{
  routeId: string;
  selectedCapabilities: string[];
  selectedEngines: string[];
  steps: Array<{ capability: string; engine: string; status: StudioUiCapabilityStatus; rationale: string }>;
  rationale: string;
  outputFormat: string;
}> {
  const response = await fetch("/api/studio/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: request.intent || "",
      taskType: request.taskType || "unknown",
      geometryType: request.geometryType || "",
      outputFormat: request.outputFormat || "mp4",
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to request orchestration plan.");
  }

  const data = await response.json();
  if (!data.success || !data.plan) {
    throw new Error(data.error || "Studio plan unavailable.");
  }

  return data.plan;
}
