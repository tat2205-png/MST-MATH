import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { StudioFeatureFlags } from "./featureFlags.js";

export type StudioRuntimeState =
  | "READY"
  | "CORE_READY_RUNTIME_MISSING"
  | "ROUTER_READY_RUNTIME_MISSING"
  | "UNAVAILABLE";

export interface StudioRuntimeProbe {
  luaDrawReady(): boolean;
  manimReady?(): boolean;
}

export interface StudioRuntimeStatus {
  readonly id: string;
  readonly name: string;
  readonly status: StudioRuntimeState;
  readonly executionEnabled: boolean;
}

export function resolveCanonicalPythonExecutable(cwd = process.cwd(), platform = process.platform): string {
  return platform === "win32"
    ? join(cwd, ".venv", "Scripts", "python.exe")
    : join(cwd, ".venv", "bin", "python");
}

export const systemRuntimeProbe: StudioRuntimeProbe = {
  luaDrawReady() {
    return ["lualatex", "dvisvgm"].every((command) => {
      const result = spawnSync(command, ["--version"], { shell: false, windowsHide: true });
      return result.status === 0 && result.error === undefined;
    });
  },
  manimReady() {
    // README/setup contract: `uv sync --group test` owns the repo-local .venv.
    // Runtime status must not accidentally probe an unrelated system Python.
    const pythonExecutable = resolveCanonicalPythonExecutable();
    if (!existsSync(pythonExecutable)) return false;
    const python = spawnSync(pythonExecutable, ["-c", "import manim"], { shell: false, windowsHide: true });
    const ffmpeg = spawnSync("ffmpeg", ["-version"], { shell: false, windowsHide: true });
    return python.status === 0 && python.error === undefined && ffmpeg.status === 0 && ffmpeg.error === undefined;
  },
};

export function buildStudioRuntimeStatus(
  flags: StudioFeatureFlags,
  probe: StudioRuntimeProbe = systemRuntimeProbe,
): readonly StudioRuntimeStatus[] {
  return Object.freeze([
    { id: "math-ai", name: "Math AI", status: "READY", executionEnabled: false },
    { id: "luadraw", name: "LuaDraw", status: probe.luaDrawReady() ? "READY" : "CORE_READY_RUNTIME_MISSING", executionEnabled: flags.integrationCanary && flags.luaDraw },
    { id: "manim-2d", name: "Manim 2D", status: probe.manimReady?.() === true ? "READY" : "CORE_READY_RUNTIME_MISSING", executionEnabled: flags.integrationCanary },
    { id: "manim-3d", name: "Native deterministic Manim 3D", status: "UNAVAILABLE", executionEnabled: false },
    { id: "image-animation", name: "Image Animation core", status: "READY", executionEnabled: flags.integrationCanary && flags.imageAnimation },
    { id: "segmentation", name: "Segmentation", status: "CORE_READY_RUNTIME_MISSING", executionEnabled: false },
    { id: "depth-2-5d", name: "Depth 2.5D", status: "CORE_READY_RUNTIME_MISSING", executionEnabled: false },
    { id: "blender", name: "Blender", status: "ROUTER_READY_RUNTIME_MISSING", executionEnabled: false },
    { id: "generative", name: "Generative motion", status: "ROUTER_READY_RUNTIME_MISSING", executionEnabled: false },
  ]);
}
