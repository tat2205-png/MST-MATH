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
