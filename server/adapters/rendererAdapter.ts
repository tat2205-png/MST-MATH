import { VideoSpecification } from "../../src/types/mathSchema.js";

export type LocalRendererState = "READY" | "UNAVAILABLE" | "CONTRACT_MISMATCH";
export interface LocalRendererCapabilities { readonly status: LocalRendererState; readonly rendererId: string; readonly manimAvailable: boolean; readonly ffmpegAvailable: boolean; readonly supportedOutputTypes: readonly string[]; readonly runtimeReady: boolean; }
export interface RenderJobRequest { jobId: string; videoSpec: VideoSpecification; outputFormat: "mp4" | "webm" | "gif"; resolution: "1080p" | "720p" | "480p"; fps: number; }
export interface RenderJobStatus { jobId: string; status: "IDLE" | "QUEUED" | "RENDERING" | "COMPLETED" | "FAILED"; progress: number; videoUrl?: string; logs: string[]; errorMessage?: string; startedAt: string; completedAt?: string; exitCode?: number | null; artifacts?: unknown[]; rendererMode: "REAL_LOCAL"; }

const unavailable = (status: LocalRendererState): LocalRendererCapabilities => ({ status, rendererId: "local.manim", manimAvailable: false, ffmpegAvailable: false, supportedOutputTypes: [], runtimeReady: false });

export class PythonManimRendererAdapter {
  constructor(private readonly serviceUrl = process.env.LOCAL_RENDER_BRIDGE_URL || "http://127.0.0.1:8765") {}

  async capabilities(): Promise<LocalRendererCapabilities> {
    try {
      const response = await fetch(`${this.serviceUrl}/api/capabilities`, { signal: AbortSignal.timeout(3000) });
      if (!response.ok) return unavailable(response.status === 404 ? "CONTRACT_MISMATCH" : "UNAVAILABLE");
      const data = await response.json() as Record<string, unknown>;
      if (data.rendererId !== "local.manim" || typeof data.runtimeReady !== "boolean" || !Array.isArray(data.supportedOutputTypes)) return unavailable("CONTRACT_MISMATCH");
      const outputs = (data.supportedOutputTypes as unknown[]).filter((item): item is string => typeof item === "string");
      const ready = data.status === "READY" && data.runtimeReady === true && data.manimAvailable === true && data.ffmpegAvailable === true && outputs.includes("video/mp4");
      return { status: ready ? "READY" : "UNAVAILABLE", rendererId: "local.manim", manimAvailable: data.manimAvailable === true, ffmpegAvailable: data.ffmpegAvailable === true, supportedOutputTypes: Object.freeze(outputs), runtimeReady: ready };
    } catch { return unavailable("UNAVAILABLE"); }
  }

  async isServiceAvailable(): Promise<boolean> { return (await this.capabilities()).status === "READY"; }

  async submitRenderJob(request: RenderJobRequest): Promise<RenderJobStatus> {
    const capability = await this.capabilities();
    if (capability.status !== "READY") throw new Error(capability.status === "CONTRACT_MISMATCH" ? "CONTRACT_MISMATCH" : "RUNTIME_MISSING");
    if (request.outputFormat !== "mp4") throw new Error("ENGINE_UNAVAILABLE");
    const source = request.videoSpec?.manim_python_code;
    const scene = typeof source === "string" ? source.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*Scene\s*\)/)?.[1] : undefined;
    if (!source || source.length > 500_000 || !scene) throw new TypeError("Invalid Manim render request.");
    const body = { manifest: { projectId: request.jobId, projectName: "Studio Local Render", entryFile: "main.py", sceneName: scene, quality: "preview", action: "render", files: [{ path: "main.py", content: source }], metadata: { resolution: request.resolution, fps: request.fps } } };
    const response = await fetch(`${this.serviceUrl}/api/jobs`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(210_000) });
    if (!response.ok) throw new Error("REAL_RENDER_SUBMISSION_FAILED");
    return this.normalize(await response.json() as Record<string, unknown>, request.jobId);
  }

  async getJobStatus(jobId: string): Promise<RenderJobStatus> {
    if (!/^[A-Za-z0-9_-]+$/.test(jobId)) throw new TypeError("Invalid render job ID.");
    const response = await fetch(`${this.serviceUrl}/api/jobs/${encodeURIComponent(jobId)}`, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error("ENGINE_UNAVAILABLE");
    return this.normalize(await response.json() as Record<string, unknown>, jobId);
  }

  private normalize(data: Record<string, unknown>, fallbackId: string): RenderJobStatus {
    const known = ["IDLE", "QUEUED", "RENDERING", "COMPLETED", "FAILED"];
    const status = known.includes(String(data.status)) ? data.status as RenderJobStatus["status"] : "FAILED";
    return { jobId: typeof data.jobId === "string" ? data.jobId : fallbackId, status, progress: typeof data.progress === "number" ? data.progress : 0, logs: Array.isArray(data.logs) ? data.logs.filter((item): item is string => typeof item === "string") : [], errorMessage: typeof data.error === "string" ? data.error : undefined, startedAt: new Date().toISOString(), exitCode: typeof data.exitCode === "number" ? data.exitCode : null, artifacts: Array.isArray(data.artifacts) ? data.artifacts : [], rendererMode: "REAL_LOCAL" };
  }
}
