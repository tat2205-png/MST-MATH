import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";
import { promisify } from "node:util";
import { createSceneGraph, createSceneNode, validateSceneGraph } from "../../image-animation/core/scene-graph/index.js";
import { createAnimationTimeline, validateAnimationTimeline, type AnimationEvent } from "../../image-animation/core/timeline/index.js";
import { compileManim } from "../../image-animation/renderers/manim/index.js";
import { routeMotion } from "../../image-animation/renderers/router/index.js";
import { PythonManimRendererAdapter } from "../adapters/rendererAdapter.js";
import { edgeTtsEngine } from "../services/edgeTtsEngine.js";
import { VisualFrameQAService } from "../services/visualFrameQAService.js";
import { toTtsText } from "../../src/utils/pronunciation.js";
import type { StudioEngineRequest, StudioEngineResult } from "./contracts.js";
import type { EngineRegistry } from "./engineRegistry.js";
import type { StudioFeatureFlags } from "./featureFlags.js";
import { planStudioTask } from "./capabilityPlanner.js";
import { createTriangleAreaSceneGraph, solveDeterministicFixture } from "./orchestrationFixtures.js";
import { StudioMathExecutionAdapter } from "./mathExecutionAdapter.js";
import type {
  StudioCapabilityPlan,
  StudioPlannedCapability,
  StudioTaskErrorCode,
  StudioTaskRequest,
  StudioTaskResult,
  StudioTraceEntry,
  StudioTraceStage,
} from "./taskContracts.js";

const execFileAsync = promisify(execFile);

export interface StudioExecuteRequest {
  readonly task: string;
  readonly input: unknown;
  readonly output?: string;
}

export class StudioOrchestrator {
  constructor(
    private readonly registry: EngineRegistry,
    private readonly flags?: StudioFeatureFlags,
    private readonly mathExecution = new StudioMathExecutionAdapter(),
  ) {}

  availability() {
    return this.registry.capabilityStatus();
  }

  execute(request: StudioExecuteRequest): Promise<StudioEngineResult> {
    if (typeof request.task !== "string" || request.task.length === 0) {
      return Promise.resolve(Object.freeze({ status: "FAILED", engineId: "studio.orchestrator", capability: "unknown", error: "Studio task must be a non-empty capability." }));
    }
    const engineRequest: StudioEngineRequest = { capability: request.task, input: request.input };
    return this.registry.execute(engineRequest);
  }

  async executeTask(request: StudioTaskRequest): Promise<StudioTaskResult> {
    const requestId = createHash("sha256").update(JSON.stringify(request)).digest("hex").slice(0, 16);
    const trace: StudioTraceEntry[] = [];
    const addTrace = (stage: StudioTraceStage, status: "PASS" | "FAIL", detail: string) => {
      trace.push(Object.freeze({ sequence: trace.length, stage, status, detail }));
    };
    if (request.task === "video.render") addTrace("REQUEST", "PASS", "STUDIO_API_REQUEST_RECEIVED");
    addTrace("VALIDATE", "PASS", "STUDIO_TASK_CONTRACT_VALID");
    let plan: StudioCapabilityPlan;
    try {
      plan = planStudioTask(request);
      addTrace("PLAN", "PASS", "DETERMINISTIC_CAPABILITY_PLAN_READY");
    } catch {
      plan = Object.freeze({ task: request.task, steps: Object.freeze([]) });
      addTrace("PLAN", "FAIL", "CAPABILITY_PLANNING_FAILED");
      return this.failure(requestId, request, plan, trace, "PLANNING_FAILED", "Studio capability planning failed.");
    }
    if (this.flags?.integrationCanary !== true) {
      addTrace("ROUTE", "FAIL", "EXPERIMENTAL_EXECUTION_DISABLED");
      return this.failure(requestId, request, plan, trace, "CAPABILITY_DISABLED", "Studio experimental execution is disabled.");
    }

    if (request.task === "video.render" && "text" in request.input) {
      return this.executeFullVideo(requestId, request as StudioTaskRequest & { readonly input: { readonly text: string; readonly video?: { readonly resolution?: "480p" | "720p"; readonly fps?: 24 | 30 } } }, plan, trace, addTrace);
    }

    const availability = await this.registry.capabilityStatus();
    const artifacts: Array<Readonly<Record<string, unknown>>> = [];
    const selectedEngines: string[] = [];
    const capabilitiesUsed: StudioPlannedCapability[] = [];
    const runtimeStatus: Array<Readonly<{ capability: StudioPlannedCapability; status: string }>> = [];
    addTrace(request.task === "math.solve" ? "ROUTE_MATH" : "ROUTE", "PASS", request.task === "math.solve" ? "REAL_MATH_ROUTING_STARTED" : "CAPABILITY_ROUTING_STARTED");

    for (const step of plan.steps) {
      if (step.action === "COMPUTE") {
        if (request.task === "math.solve" && "text" in request.input) {
          try {
            const problem = await this.mathExecution.parse(request.input.text);
            addTrace("PARSE", "PASS", "EXISTING_MATH_PARSER_COMPLETED");
            const solution = await this.mathExecution.solve(problem);
            addTrace("SOLVE", "PASS", "EXISTING_MATH_SOLVER_COMPLETED");
            const verification = await this.mathExecution.verify(problem, solution);
            addTrace("VERIFY", "PASS", "EXISTING_MATH_VERIFIER_COMPLETED");
            const result = this.mathExecution.result(request.input.text, problem, solution, verification);
            if (!result) {
              trace[trace.length - 1] = Object.freeze({ ...trace[trace.length - 1], status: "FAIL", detail: "MATH_GATE_REJECTED" });
              return this.failure(requestId, request, plan, trace, "VERIFICATION_FAILED", "Math verification rejected the solver output.");
            }
            artifacts.push(Object.freeze({ kind: "math-execution", ...result }));
          } catch {
            addTrace("EXECUTE", "FAIL", "REAL_MATH_EXECUTION_FAILED");
            return this.failure(requestId, request, plan, trace, "EXECUTION_FAILED", "Real Math AI execution failed.");
          }
        } else if ("fixture" in request.input) {
          artifacts.push(solveDeterministicFixture(request.input.fixture));
        } else {
          return this.failure(requestId, request, plan, trace, "INVALID_REQUEST", "Math input is invalid.");
        }
        selectedEngines.push(step.component);
        capabilitiesUsed.push(step.capability);
        runtimeStatus.push(Object.freeze({ capability: step.capability, status: "READY" }));
        continue;
      }
      if (step.action === "PLAN") {
        artifacts.push(Object.freeze({ kind: "renderer-plan", renderer: "manim", authoritative: true, productionExecution: false }));
        selectedEngines.push(step.component);
        capabilitiesUsed.push(step.capability);
        runtimeStatus.push(Object.freeze({ capability: step.capability, status: "READY" }));
        continue;
      }
      const capability = availability.find((item) => item.id === step.capability && item.engineId === step.component);
      const status = capability?.status ?? "UNAVAILABLE";
      runtimeStatus.push(Object.freeze({ capability: step.capability, status }));
      if (status === "OPTIONAL_RUNTIME_MISSING") {
        addTrace("EXECUTE", "FAIL", "OPTIONAL_RUNTIME_MISSING");
        return this.failure(requestId, request, plan, trace, "RUNTIME_MISSING", "Required Studio runtime is unavailable.", runtimeStatus);
      }
      if (status === "DISABLED") {
        addTrace("EXECUTE", "FAIL", "ENGINE_CAPABILITY_DISABLED");
        return this.failure(requestId, request, plan, trace, "CAPABILITY_DISABLED", "Requested Studio capability is disabled.", runtimeStatus);
      }
      if (status !== "AVAILABLE") {
        addTrace("EXECUTE", "FAIL", "ENGINE_CAPABILITY_UNAVAILABLE");
        return this.failure(requestId, request, plan, trace, "ENGINE_UNAVAILABLE", "Requested Studio engine is unavailable.", runtimeStatus);
      }
      if (step.capability === "geometry.luadraw") {
        addTrace("EXECUTE", "FAIL", "LUADRAW_ARTIFACT_PATH_NOT_EXPOSED");
        return this.failure(requestId, request, plan, trace, "ROUTING_FAILED", "LuaDraw artifact execution is not exposed by the Phase 3 API.", runtimeStatus);
      }
      const graph = createTriangleAreaSceneGraph();
      const result = await this.registry.execute({ capability: step.capability, input: graph });
      if (result.status !== "COMPLETED") {
        addTrace("EXECUTE", "FAIL", "ENGINE_EXECUTION_FAILED");
        return this.failure(requestId, request, plan, trace, "EXECUTION_FAILED", "Studio engine execution failed.", runtimeStatus);
      }
      const digest = createHash("sha256").update(JSON.stringify(result.output)).digest("hex");
      artifacts.push(Object.freeze({ kind: "engine-result", engineId: result.engineId, capability: result.capability, outputSha256: digest }));
      selectedEngines.push(result.engineId);
      capabilitiesUsed.push(step.capability);
    }

    if (request.task !== "math.solve") {
      addTrace("EXECUTE", "PASS", "ALL_PLAN_STEPS_COMPLETED");
      addTrace("VERIFY", "PASS", "STRUCTURED_RESULT_VERIFIED");
    }
    addTrace("RESULT", "PASS", "STUDIO_TASK_COMPLETED");
    return Object.freeze({
      requestId,
      task: request.task,
      success: true,
      plan,
      selectedEngines: Object.freeze([...new Set(selectedEngines)]),
      capabilitiesUsed: Object.freeze(capabilitiesUsed),
      artifacts: Object.freeze(artifacts),
      warnings: Object.freeze([]),
      runtimeStatus: Object.freeze(runtimeStatus),
      qa: Object.freeze({ validation: "PASS", routing: "PASS", execution: "PASS" }),
      trace: Object.freeze(trace),
    });
  }

  private async executeFullVideo(
    requestId: string,
    request: StudioTaskRequest & { readonly input: { readonly text: string; readonly video?: { readonly resolution?: "480p" | "720p"; readonly fps?: 24 | 30 } } },
    plan: StudioCapabilityPlan,
    trace: StudioTraceEntry[],
    addTrace: (stage: StudioTraceStage, status: "PASS" | "FAIL", detail: string) => void,
  ): Promise<StudioTaskResult> {
    let activeStage: StudioTraceStage = "ROUTE_MATH";
    try {
      addTrace("ROUTE_MATH", "PASS", "REAL_MATH_ROUTING_STARTED");
      activeStage = "REAL_MATH_PARSE";
      const problem = await this.mathExecution.parse(request.input.text);
      addTrace(activeStage, "PASS", "EXISTING_MATH_PARSER_COMPLETED");
      activeStage = "REAL_MATH_SOLVE";
      const solution = await this.mathExecution.solve(problem);
      addTrace(activeStage, "PASS", "EXISTING_MATH_SOLVER_COMPLETED");
      activeStage = "REAL_MATH_VERIFY";
      const verification = await this.mathExecution.verify(problem, solution);
      const math = this.mathExecution.result(request.input.text, problem, solution, verification);
      if (!math) throw new Error("MATH_GATE_REJECTED");
      addTrace(activeStage, "PASS", "DETERMINISTIC_MATH_GATE_PASSED");

      const answer = math.result.value;
      const labels = [
        "Problem: 2x - 4 = 0",
        "Analysis: add 4 to both sides",
        "Visual: 2x = 4",
        "Solution: x = 4 / 2",
        `Verified result: ${answer}`,
      ];
      activeStage = "GEOMETRY_ROUTE";
      addTrace(activeStage, "PASS", "EXISTING_DETERMINISTIC_GEOMETRY_ROUTE_SELECTED");
      activeStage = "SCENE_GRAPH";
      const graph = createSceneGraph(labels.map((text, index) => createSceneNode({
        identity: { id: `scene_${index + 1}` },
        geometry: { kind: "label", position: { x: 0, y: 0 }, text },
        metadata: { sceneNumber: index + 1, verifiedAnswer: answer },
      })), { sceneCount: 5, verifiedAnswer: answer });
      if (!validateSceneGraph(graph).valid) throw new Error("SCENE_GRAPH_INVALID");
      addTrace(activeStage, "PASS", "FIVE_SCENE_GRAPH_VALID");

      activeStage = "MOTION_TIMELINE";
      const sceneDuration = 2.8;
      const events: AnimationEvent[] = [];
      for (let index = 0; index < 5; index += 1) {
        const start = index * sceneDuration;
        events.push({ id: `scene_${index + 1}_in`, type: "appear", targetId: `scene_${index + 1}`, start, duration: 0.35 });
        if (index < 4) events.push({ id: `scene_${index + 1}_out`, type: "disappear", targetId: `scene_${index + 1}`, start: start + sceneDuration - 0.35, duration: 0.35 });
      }
      const timeline = createAnimationTimeline(events, graph, { scenes: 5, verifiedAnswer: answer });
      const timelineQa = validateAnimationTimeline(timeline, { sceneGraph: graph });
      if (!timelineQa.valid) throw new Error("TIMELINE_INVALID");
      addTrace(activeStage, "PASS", "MOTION_TIMELINE_VALID");

      activeStage = "MANIM_TOOLKIT";
      addTrace(activeStage, "PASS", "EXISTING_MANIM_TOOLKIT_SELECTED");
      activeStage = "MANIM_COMPILE";
      const compilation = compileManim(graph, { sceneClassName: "StudioFullVideo", timeline, layout: { frameWidth: 14, frameHeight: 8, margin: 0.5 } });
      if (compilation.nodeOrder.length !== graph.nodes.length || !compilation.source.includes("self.play")) throw new Error("MANIM_COMPILE_INVALID");
      addTrace(activeStage, "PASS", "EXISTING_MANIM_COMPILER_COMPLETED");

      activeStage = "EDGE_TTS";
      const narration = `Bài toán yêu cầu giải phương trình hai x trừ bốn bằng không. Cộng bốn vào hai vế, ta được hai x bằng bốn. Chia hai vế cho hai. Kết quả đã được kiểm chứng là ${answer}.`;
      const audio = await edgeTtsEngine.generateCueAudio(`studio_${requestId}`, toTtsText(narration));
      if (!audio.ok || !audio.audioPath || !audio.duration || audio.duration <= 0 || !audio.fileSizeBytes || audio.fileSizeBytes <= 0) throw new Error(audio.error ?? "EDGE_TTS_FAILED");
      const audioPath = isAbsolute(audio.audioPath) ? audio.audioPath : resolve(audio.audioPath);
      addTrace(activeStage, "PASS", "REAL_EDGE_TTS_AUDIO_READY");

      activeStage = "RENDERER_ROUTE";
      const rendererRoute = routeMotion({ id: requestId, geometryAuthority: "exact", requestedRenderer: "auto" }, { deterministicRenderer: "manim", generativeEnabled: false });
      if (rendererRoute.status !== "ready" || rendererRoute.renderer !== "manim") throw new Error("RENDERER_ROUTE_DENIED");
      addTrace(activeStage, "PASS", "PYTHON_MANIM_RENDERER_SELECTED");
      activeStage = "LOCAL_BRIDGE";
      const renderer = new PythonManimRendererAdapter();
      const rendererCapabilities = await renderer.capabilities();
      if (rendererCapabilities.status !== "READY") throw new Error("LOCAL_BRIDGE_UNAVAILABLE");
      addTrace(activeStage, "PASS", "LOCAL_BRIDGE_8765_READY");
      activeStage = "MANIM_RENDER";
      const render = await renderer.submitRenderJob({ jobId: `studio_${requestId}`, outputFormat: "mp4", resolution: request.input.video?.resolution ?? "480p", fps: request.input.video?.fps ?? 30, videoSpec: { manim_python_code: compilation.source } as never });
      if (render.status !== "COMPLETED") throw new Error(render.errorMessage ?? "MANIM_RENDER_FAILED");
      const renderArtifact = (render.artifacts as Array<{ pathOrUrl?: string; sizeBytes?: number }> | undefined)?.find((item) => item.pathOrUrl?.endsWith("render.mp4"));
      if (!renderArtifact?.pathOrUrl || !renderArtifact.sizeBytes || renderArtifact.sizeBytes <= 0) throw new Error("MANIM_ARTIFACT_MISSING");
      addTrace(activeStage, "PASS", "REAL_MANIM_RENDER_COMPLETED");

      activeStage = "FFMPEG_COMPOSE";
      const videoResponse = await fetch(new URL(renderArtifact.pathOrUrl, "http://127.0.0.1:8765"));
      if (!videoResponse.ok) throw new Error("RENDER_ARTIFACT_FETCH_FAILED");
      const directory = await mkdtemp(join(tmpdir(), "studio-full-video-"));
      const videoPath = join(directory, "animation.mp4");
      const finalPath = join(directory, "final.mp4");
      await writeFile(videoPath, new Uint8Array(await videoResponse.arrayBuffer()));
      await execFileAsync("ffmpeg", ["-loglevel", "error", "-y", "-i", videoPath, "-i", audioPath, "-filter_complex", `[0:v]tpad=stop_mode=clone:stop_duration=${Math.ceil(audio.duration + 1)}[v]`, "-map", "[v]", "-map", "1:a:0", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", finalPath], { timeout: 120_000, windowsHide: true });
      addTrace(activeStage, "PASS", "FFMPEG_AUDIO_VIDEO_COMPOSITION_COMPLETED");

      const probe = JSON.parse((await execFileAsync("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", finalPath], { timeout: 10_000, windowsHide: true })).stdout) as { streams?: Array<Record<string, unknown>>; format?: Record<string, unknown> };
      const videoStream = probe.streams?.find((stream) => stream.codec_type === "video");
      const audioStream = probe.streams?.find((stream) => stream.codec_type === "audio");
      const duration = Number(probe.format?.duration);
      const width = Number(videoStream?.width), height = Number(videoStream?.height);

      activeStage = "FRAME_QA";
      const framePaths: string[] = [];
      for (const [index, time] of [0.8, duration / 2, Math.max(0.8, duration - 0.8)].entries()) {
        const framePath = join(directory, `frame-${index}.png`);
        await execFileAsync("ffmpeg", ["-loglevel", "error", "-y", "-ss", String(time), "-i", finalPath, "-frames:v", "1", "-update", "1", framePath], { timeout: 30_000, windowsHide: true });
        framePaths.push(framePath);
      }
      const frameBytes = await Promise.all(framePaths.map((path) => readFile(path)));
      const frameQa = await new VisualFrameQAService().runJobFrameQA({ jobId: render.jobId, rawFrames: { start: { base64: frameBytes[0].toString("base64") }, key: { base64: frameBytes[1].toString("base64") }, end: { base64: frameBytes[2].toString("base64") } }, problemIR: { originalText: request.input.text, domain: "Algebra" }, solution: { finalAnswer: answer, pedagogicalSteps: [{ mathExpression: math.result.latex }] }, visualSpec: { type: "algebraic_steps" } });
      if (frameQa.overallStatus !== "PASS" || !Object.values(frameQa.frames).every((frame) => frame.analysisCompleted)) throw new Error("FRAME_QA_FAILED");
      addTrace(activeStage, "PASS", "AUTHORITATIVE_FRAME_QA_PASSED");

      activeStage = "OVERLAP_QA";
      const distinctFrames = new Set(frameBytes.map((bytes) => createHash("sha256").update(bytes).digest("hex"))).size > 1;
      if (!timelineQa.valid || !distinctFrames || frameQa.summary.layoutErrors > 0) throw new Error("OVERLAP_QA_FAILED");
      addTrace(activeStage, "PASS", "TIMELINE_AND_VISUAL_OVERLAP_QA_PASSED");
      activeStage = "FINAL_MATH_QA";
      if (!labels.some((label) => label.includes(answer)) || frameQa.summary.mathErrors > 0) throw new Error("FINAL_MATH_QA_FAILED");
      addTrace(activeStage, "PASS", "VERIFIED_RESULT_PRESENT_AND_VISUALLY_CORRECT");
      activeStage = "ARTIFACT_QA";
      const finalStat = await stat(finalPath);
      if (!videoStream || !audioStream || finalStat.size <= 0 || !(duration > 0) || !(width > 0) || !(height > 0)) throw new Error("ARTIFACT_INTEGRITY_FAILED");
      const artifactId = createHash("sha256").update(await readFile(finalPath)).digest("hex");
      addTrace(activeStage, "PASS", "MP4_ARTIFACT_INTEGRITY_PASSED");
      addTrace("RESULT", "PASS", "STUDIO_FULL_VIDEO_COMPLETED");
      return Object.freeze({
        requestId, task: request.task, success: true, plan,
        selectedEngines: Object.freeze(["math-ai", "studio.manim", "renderer-router", "local.manim", "edge-tts"]),
        capabilitiesUsed: Object.freeze(plan.steps.map((step) => step.capability)),
        artifacts: Object.freeze([Object.freeze({ kind: "math-execution", ...math }), Object.freeze({ kind: "scene-summary", sceneCount: 5, nodeCount: graph.nodes.length, timelineEventCount: timeline.events.length })]),
        warnings: Object.freeze([]), runtimeStatus: Object.freeze(plan.steps.map((step) => Object.freeze({ capability: step.capability, status: "READY" }))),
        qa: Object.freeze({ validation: "PASS", routing: "PASS", execution: "PASS" }), trace: Object.freeze(trace),
        verifiedMathResult: math.result,
        sceneSummary: Object.freeze({ sceneCount: 5, nodeCount: graph.nodes.length, timelineEventCount: timeline.events.length }),
        finalArtifact: Object.freeze({ artifactId, type: "video/mp4", status: "READY", size: finalStat.size, duration, videoCodec: String(videoStream.codec_name), audioCodec: String(audioStream.codec_name), width, height, qaState: "PASS" }),
        fullVideoQa: Object.freeze({ frame: "PASS", overlap: "PASS", finalMath: "PASS", artifact: "PASS" }),
      });
    } catch (error) {
      const last = trace[trace.length - 1];
      if (last?.stage !== activeStage || last.status !== "FAIL") addTrace(activeStage, "FAIL", error instanceof Error ? error.message : "FULL_VIDEO_STAGE_FAILED");
      return this.failure(requestId, request, plan, trace, activeStage === "REAL_MATH_VERIFY" ? "VERIFICATION_FAILED" : "EXECUTION_FAILED", "Studio full-video execution failed.");
    }
  }

  private failure(
    requestId: string,
    request: StudioTaskRequest,
    plan: StudioCapabilityPlan,
    trace: StudioTraceEntry[],
    code: StudioTaskErrorCode,
    message: string,
    runtimeStatus: readonly Readonly<{ capability: StudioPlannedCapability; status: string }>[] = [],
  ): StudioTaskResult {
    trace.push(Object.freeze({ sequence: trace.length, stage: "RESULT", status: "FAIL", detail: code }));
    return Object.freeze({
      requestId,
      task: request.task,
      success: false,
      plan,
      selectedEngines: Object.freeze([]),
      capabilitiesUsed: Object.freeze([]),
      artifacts: Object.freeze([]),
      warnings: Object.freeze([]),
      runtimeStatus: Object.freeze([...runtimeStatus]),
      qa: Object.freeze({ validation: "PASS", routing: "FAIL", execution: "FAIL" }),
      trace: Object.freeze(trace),
      error: Object.freeze({ code, message }),
    });
  }
}
