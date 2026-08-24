export type CapabilityStatus =
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "OPTIONAL_RUNTIME_MISSING"
  | "CORE_AVAILABLE"
  | "ROUTER_AVAILABLE";

export interface EngineCapabilityRecord {
  engine: string;
  capability: string;
  status: CapabilityStatus;
  source: string;
  notes: string;
}

export class StudioEngineRegistry {
  private readonly capabilityMap = new Map<string, EngineCapabilityRecord>([
    ["math.solve", { engine: "math-engine", capability: "math.solve", status: "AVAILABLE", source: "ProblemParserService + SolutionGeneratorService + SolutionVerifierService", notes: "Deterministic math pipeline remains the production math path." }],
    ["math.analyze", { engine: "math-engine", capability: "math.analyze", status: "AVAILABLE", source: "Math verification gate and deterministic analysis services", notes: "Used for algebraic and solution validation without rewriting the math core." }],
    ["geometry.2d", { engine: "geometry-router", capability: "geometry.2d", status: "AVAILABLE", source: "server/geometry/geometryRouter.ts + validated geometry contracts", notes: "Production geometry path remains authoritative; router selects the appropriate backend." }],
    ["geometry.3d", { engine: "geometry-router", capability: "geometry.3d", status: "AVAILABLE", source: "geometry contracts and visual planning services", notes: "3D geometry remains behind existing geometry validation and router flow." }],
    ["geometry.luadraw", { engine: "luadraw", capability: "geometry.luadraw", status: "AVAILABLE", source: "server/geometry/luadrawEngine.ts", notes: "LuaDraw is registered as a supported route, not a replacement for the geometry engine." }],
    ["visual.manim", { engine: "manim-compiler", capability: "visual.manim", status: "AVAILABLE", source: "VideoPlannerService + existing Manim video path", notes: "Manim remains the current visual compiler path for educational scenes." }],
    ["animation.image", { engine: "image-animation-engine", capability: "animation.image", status: "AVAILABLE", source: "video pipeline adapters and scene planning", notes: "Image animation remains additive and optional to the core path." }],
    ["animation.motion", { engine: "motion-timeline", capability: "animation.motion", status: "AVAILABLE", source: "motion timeline planning layer", notes: "Motion timeline is routed through the existing planning stack." }],
    ["animation.depth25d", { engine: "depth-engine", capability: "animation.depth25d", status: "OPTIONAL_RUNTIME_MISSING", source: "Depth 2.5D adapter", notes: "Depth remains optional; explicit capability status is reported when runtime is unavailable." }],
    ["animation.segmentation", { engine: "segmentation-engine", capability: "animation.segmentation", status: "CORE_AVAILABLE", source: "segmentation integration layer", notes: "Core segmentation support is available in the studio abstraction, but runtime dependencies may still be missing." }],
    ["animation.blender", { engine: "blender-router", capability: "animation.blender", status: "ROUTER_AVAILABLE", source: "Blender routing layer", notes: "The Blender route is available in the orchestrator while the host runtime may still be absent." }],
    ["animation.generative", { engine: "generative-motion", capability: "animation.generative", status: "OPTIONAL_RUNTIME_MISSING", source: "Generative motion adapters", notes: "Optional generative work remains off-path unless the runtime is explicitly present." }],
    ["render.video", { engine: "renderer-router", capability: "render.video", status: "AVAILABLE", source: "server/adapters/rendererAdapter.ts + existing render pipeline", notes: "Renderer routing stays behind the existing adapter contracts." }],
  ]);

  static featureFlagEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
    return env.STUDIO_ORCHESTRATOR_V1 === "true";
  }

  getCapability(capability: string): EngineCapabilityRecord | undefined {
    return this.capabilityMap.get(capability);
  }

  getCapabilityStatus(capability: string): CapabilityStatus {
    return this.getCapability(capability)?.status ?? "UNAVAILABLE";
  }

  snapshot(): EngineCapabilityRecord[] {
    return [...this.capabilityMap.values()];
  }
}

export const studioEngineRegistry = new StudioEngineRegistry();
