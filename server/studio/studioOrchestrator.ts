import { StudioEngineRegistry, type CapabilityStatus } from "./engineRegistry.js";

export interface StudioRequest {
  intent?: string;
  taskType?: "math" | "geometry" | "visual" | "image" | "render" | "unknown";
  problemType?: string;
  geometryType?: string;
  source?: string;
  outputFormat?: "mp4" | "png" | "gif" | "json";
}

export interface StudioPlanStep {
  capability: string;
  engine: string;
  status: CapabilityStatus;
  rationale: string;
}

export interface StudioExecutionPlan {
  featureEnabled: boolean;
  routeId: "MATH" | "MANIM" | "LUADRAW" | "IMAGE_ANIMATION" | "RENDER_ONLY" | "UNKNOWN";
  selectedCapabilities: string[];
  selectedEngines: string[];
  steps: StudioPlanStep[];
  rationale: string;
  outputFormat: "mp4" | "png" | "gif" | "json";
}

export class StudioOrchestrator {
  constructor(private readonly registry: StudioEngineRegistry = new StudioEngineRegistry()) {}

  plan(request: StudioRequest): StudioExecutionPlan {
    const intent = (request.intent || "").toLowerCase();
    const taskType = request.taskType || "unknown";
    const geometryType = (request.geometryType || "").toUpperCase();
    const outputFormat = request.outputFormat || "mp4";

    const featureEnabled = StudioEngineRegistry.featureFlagEnabled();

    if (!featureEnabled) {
      return {
        featureEnabled: false,
        routeId: "UNKNOWN",
        selectedCapabilities: [],
        selectedEngines: [],
        steps: [],
        rationale: "Studio Orchestrator is disabled by default. Enable STUDIO_ORCHESTRATOR_V1=true to route through the orchestration layer.",
        outputFormat,
      };
    }

    if (/(cube|polyhedron|net|tetra|prism|pyramid|octa)/.test(intent) || geometryType.includes("POLYHEDRON")) {
      return this.buildPlan({
        routeId: "LUADRAW",
        selectedCapabilities: ["geometry.2d", "geometry.luadraw", "render.video"],
        rationale: "Deterministic geometry request resolved to the existing Geometry Router and LuaDraw route. This preserves the production geometry contract and routes through the verified LuaDraw backend.",
        outputFormat,
      });
    }

    if (/(triangle|right triangle|circle|line|shape|geometry|diagram)/.test(intent) || taskType === "geometry") {
      return this.buildPlan({
        routeId: "MANIM",
        selectedCapabilities: ["geometry.2d", "visual.manim", "render.video"],
        rationale: "The request resolves to the geometry + visual Manim path. The route stays on the current geometry router and Manim compiler while the toolkit provides composition helpers only.",
        outputFormat,
      });
    }

    if (/(equation|solve|algebra|system|inequality|function)/.test(intent) || taskType === "math") {
      return this.buildPlan({
        routeId: "MATH",
        selectedCapabilities: ["math.solve", "math.analyze", "render.video"],
        rationale: "Math-first requests are routed through the existing deterministic math engine and remain separate from the visual renderer path.",
        outputFormat,
      });
    }

    if (/(image|animate|motion|depth|segmentation|blender|generative)/.test(intent) || taskType === "image") {
      return this.buildPlan({
        routeId: "IMAGE_ANIMATION",
        selectedCapabilities: ["animation.image", "animation.motion", "animation.depth25d", "render.video"],
        rationale: "Image-driven animation requests route through the image animation engine and renderer, while optional runtimes report explicit missing availability instead of silently failing.",
        outputFormat,
      });
    }

    return this.buildPlan({
      routeId: "UNKNOWN",
      selectedCapabilities: ["math.solve"],
      rationale: "No explicit rule matched. Request is left in a fail-closed unknown state rather than silently routing to an incorrect engine.",
      outputFormat,
    });
  }

  private buildPlan({
    routeId,
    selectedCapabilities,
    rationale,
    outputFormat,
  }: {
    routeId: StudioExecutionPlan["routeId"];
    selectedCapabilities: string[];
    rationale: string;
    outputFormat: "mp4" | "png" | "gif" | "json";
  }): StudioExecutionPlan {
    const selectedEngines = selectedCapabilities.map((capability) => this.registry.getCapability(capability)?.engine ?? "unknown-engine");
    const uniqueEngines = [...new Set(selectedEngines)];

    const steps: StudioPlanStep[] = selectedCapabilities.map((capability) => {
      const record = this.registry.getCapability(capability);
      return {
        capability,
        engine: record?.engine ?? "unknown-engine",
        status: record?.status ?? "UNAVAILABLE",
        rationale: record?.notes ?? "Capability not registered in the safe Studio registry.",
      };
    });

    return {
      featureEnabled: true,
      routeId,
      selectedCapabilities,
      selectedEngines: uniqueEngines,
      steps,
      rationale,
      outputFormat,
    };
  }
}

export const studioOrchestrator = new StudioOrchestrator();
