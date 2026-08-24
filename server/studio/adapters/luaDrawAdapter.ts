import path from "node:path";
import { spawnSync } from "node:child_process";
import type { GeometryEngine } from "../../geometry/geometryEngine.js";
import { LuaDrawEngine } from "../../geometry/luadrawEngine.js";
import { routeGeometry } from "../../geometry/geometryRouter.js";
import { validateGeometrySpec } from "../../geometry/geometryValidator.js";
import type { GeometrySpec } from "../../../src/types/geometrySpec.js";
import type { StudioEngine, StudioEngineRequest, StudioEngineResult } from "../contracts.js";

export type StudioGeometryRouter = (spec: GeometrySpec, engine: GeometryEngine) => GeometryEngine | null;

function localLuaDrawRuntimeAvailable(): boolean {
  const options = { stdio: "ignore" as const, shell: false, windowsHide: true };
  return spawnSync("lualatex", ["--version"], options).status === 0 &&
    spawnSync("dvisvgm", ["--version"], options).status === 0;
}

function geometryRequest(value: unknown): { readonly spec: GeometrySpec; readonly outputDir: string } {
  if (typeof value !== "object" || value === null || !("spec" in value) || !("outputDir" in value)) {
    throw new TypeError("LuaDraw Studio input must contain spec and outputDir.");
  }
  const request = value as { readonly spec: GeometrySpec; readonly outputDir: unknown };
  if (typeof request.outputDir !== "string") throw new TypeError("LuaDraw Studio outputDir must be a string.");
  return { spec: request.spec, outputDir: path.resolve(request.outputDir) };
}

export class LuaDrawStudioAdapter implements StudioEngine {
  readonly id = "studio.luadraw";

  constructor(
    private readonly enabled: boolean,
    private readonly engine: GeometryEngine = new LuaDrawEngine(),
    private readonly router: StudioGeometryRouter = routeGeometry,
    private readonly runtimeAvailable: () => boolean = localLuaDrawRuntimeAvailable,
  ) {}

  capabilities() {
    const runtimeReady = this.enabled && this.runtimeAvailable();
    return Object.freeze([
      Object.freeze({
        id: "geometry.luadraw",
        status: !this.enabled ? "DISABLED" as const : runtimeReady ? "AVAILABLE" as const : "OPTIONAL_RUNTIME_MISSING" as const,
        reason: !this.enabled ? "STUDIO_LUADRAW is disabled." : runtimeReady ? undefined : "LuaLaTeX or dvisvgm is unavailable.",
      }),
    ]);
  }

  async execute(request: StudioEngineRequest): Promise<StudioEngineResult> {
    if (request.capability !== "geometry.luadraw" || !this.enabled || !this.runtimeAvailable()) {
      return Object.freeze({ status: "DENIED", engineId: this.id, capability: request.capability, error: "LuaDraw Studio integration is disabled." });
    }
    try {
      const input = geometryRequest(request.input);
      const validation = validateGeometrySpec(input.spec);
      if (validation.status !== "PASS") throw new TypeError(validation.errors.join(" "));
      const selected = this.router(input.spec, this.engine);
      if (selected === null) return Object.freeze({ status: "UNAVAILABLE", engineId: this.id, capability: request.capability, error: "LuaDraw router declined the request." });
      const artifact = await selected.render(input.spec, input.outputDir);
      return artifact.status === "PASS"
        ? Object.freeze({ status: "COMPLETED", engineId: this.id, capability: request.capability, output: artifact })
        : Object.freeze({ status: "FAILED", engineId: this.id, capability: request.capability, error: artifact.error ?? "LuaDraw render failed." });
    } catch (error) {
      return Object.freeze({ status: "FAILED", engineId: this.id, capability: request.capability, error: error instanceof Error ? error.message : String(error) });
    }
  }
}
