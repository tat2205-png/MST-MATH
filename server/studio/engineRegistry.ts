import type {
  StudioCapability,
  StudioEngine,
  StudioEngineFactory,
  StudioEngineRequest,
  StudioEngineResult,
} from "./contracts.js";

interface Registration {
  readonly id: string;
  readonly factory: StudioEngineFactory;
  instance?: StudioEngine;
}

export class EngineRegistry {
  private readonly registrations = new Map<string, Registration>();

  register(id: string, factory: StudioEngineFactory): void {
    if (!/^[a-z0-9][a-z0-9.-]*$/.test(id)) throw new TypeError("Studio engine ID is invalid.");
    if (this.registrations.has(id)) throw new TypeError(`Duplicate Studio engine ID: ${id}`);
    this.registrations.set(id, { id, factory });
  }

  engineIds(): readonly string[] {
    return Object.freeze([...this.registrations.keys()].sort((left, right) => left.localeCompare(right, "en")));
  }

  private async load(registration: Registration): Promise<StudioEngine> {
    if (registration.instance === undefined) {
      const engine = await registration.factory();
      if (engine.id !== registration.id) throw new TypeError(`Studio engine factory ID mismatch: ${registration.id}`);
      registration.instance = engine;
    }
    return registration.instance;
  }

  async capabilityStatus(): Promise<readonly (StudioCapability & { readonly engineId: string })[]> {
    const result: Array<StudioCapability & { readonly engineId: string }> = [];
    for (const id of this.engineIds()) {
      const registration = this.registrations.get(id);
      if (registration === undefined) continue;
      const engine = await this.load(registration);
      for (const capability of await engine.capabilities()) result.push({ ...capability, engineId: id });
    }
    return Object.freeze(result.sort((left, right) =>
      left.id.localeCompare(right.id, "en") || left.engineId.localeCompare(right.engineId, "en")));
  }

  async execute(request: StudioEngineRequest): Promise<StudioEngineResult> {
    for (const id of this.engineIds()) {
      const registration = this.registrations.get(id);
      if (registration === undefined) continue;
      const engine = await this.load(registration);
      const capability = (await engine.capabilities()).find((item) => item.id === request.capability);
      if (capability?.status === "AVAILABLE") return engine.execute(request);
    }
    return Object.freeze({
      status: "UNAVAILABLE" as const,
      engineId: "studio.registry",
      capability: request.capability,
      error: `No available Studio engine provides capability: ${request.capability}`,
    });
  }
}

export type CapabilityStatus = "AVAILABLE" | "UNAVAILABLE" | "OPTIONAL_RUNTIME_MISSING" | "CORE_AVAILABLE" | "ROUTER_AVAILABLE";

export interface EngineCapabilityRecord {
  engine: string;
  capability: string;
  status: CapabilityStatus;
  source: string;
  notes: string;
}

/** Compatibility registry for the established planning API, alongside executable Phase 4 engines. */
export class StudioEngineRegistry extends EngineRegistry {
  private readonly capabilityMap = new Map<string, EngineCapabilityRecord>([
    ["math.solve", { engine: "math-engine", capability: "math.solve", status: "AVAILABLE", source: "ProblemParserService + SolutionGeneratorService + SolutionVerifierService", notes: "Deterministic math pipeline remains authoritative." }],
    ["math.analyze", { engine: "math-engine", capability: "math.analyze", status: "AVAILABLE", source: "Math verification gate", notes: "Deterministic analysis and verification." }],
    ["geometry.2d", { engine: "geometry-router", capability: "geometry.2d", status: "AVAILABLE", source: "server/geometry/geometryRouter.ts", notes: "Validated production geometry route." }],
    ["geometry.3d", { engine: "geometry-router", capability: "geometry.3d", status: "AVAILABLE", source: "geometry contracts", notes: "Validated 3D geometry route." }],
    ["geometry.luadraw", { engine: "luadraw", capability: "geometry.luadraw", status: "AVAILABLE", source: "server/geometry/luadrawEngine.ts", notes: "Verified LuaDraw backend." }],
    ["visual.manim", { engine: "manim-compiler", capability: "visual.manim", status: "AVAILABLE", source: "Manim compiler and toolkit", notes: "Deterministic educational scene compiler." }],
    ["animation.image", { engine: "image-animation-engine", capability: "animation.image", status: "AVAILABLE", source: "image-animation", notes: "Additive image animation engine." }],
    ["animation.motion", { engine: "motion-timeline", capability: "animation.motion", status: "AVAILABLE", source: "motion timeline", notes: "Validated motion timeline." }],
    ["animation.depth25d", { engine: "depth-engine", capability: "animation.depth25d", status: "OPTIONAL_RUNTIME_MISSING", source: "Depth 2.5D adapter", notes: "Optional runtime is fail-closed." }],
    ["animation.segmentation", { engine: "segmentation-engine", capability: "animation.segmentation", status: "CORE_AVAILABLE", source: "segmentation integration", notes: "Core support; runtime may be absent." }],
    ["animation.blender", { engine: "blender-router", capability: "animation.blender", status: "ROUTER_AVAILABLE", source: "Blender router", notes: "Router present; host runtime optional." }],
    ["animation.generative", { engine: "generative-motion", capability: "animation.generative", status: "OPTIONAL_RUNTIME_MISSING", source: "generative adapter", notes: "Optional runtime is fail-closed." }],
    ["render.video", { engine: "renderer-router", capability: "render.video", status: "AVAILABLE", source: "server/adapters/rendererAdapter.ts", notes: "Existing renderer adapter contract." }],
  ]);

  static featureFlagEnabled(env: NodeJS.ProcessEnv = process.env): boolean { return env.STUDIO_ORCHESTRATOR_V1 === "true"; }
  getCapability(capability: string): EngineCapabilityRecord | undefined { return this.capabilityMap.get(capability); }
  getCapabilityStatus(capability: string): CapabilityStatus { return this.getCapability(capability)?.status ?? "UNAVAILABLE"; }
  snapshot(): EngineCapabilityRecord[] { return [...this.capabilityMap.values()]; }
}

export const studioEngineRegistry = new StudioEngineRegistry();
