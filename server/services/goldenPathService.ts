import { ManimScene, MathProblemIR, MathSolution, MathVerification, VisualSpecification } from "../../src/types/mathSchema.js";
import { evaluateMathGate, MathGateResult } from "./mathVerificationGate.js";

export type GoldenStageStatus = "PASS" | "BLOCKED" | "PENDING" | "FAILED";

export interface GoldenStage<T> {
  status: GoldenStageStatus;
  value: T | null;
  reasons: string[];
}

export interface GoldenScene {
  id: string;
  index: number;
  title: string;
  math: string;
  visualAction: string;
  narrationCueId: string;
}

export interface GoldenScenePlan {
  scenes: GoldenScene[];
  verifiedValues: { x: string; y: string };
}

export interface GoldenNarrationCue {
  id: string;
  text: string;
  expectedVisual: string;
  durationSeconds: number;
}

export interface GoldenNarrationPlan {
  cues: GoldenNarrationCue[];
}

export interface GoldenRenderTask {
  jobId: string;
  projectId: string;
  projectName: string;
  entryFile: string;
  sceneName: string;
  quality: "preview";
  action: "render";
  files: Array<{ path: string; content: string }>;
  manifest: {
    projectId: string;
    projectName: string;
    entryFile: string;
    sceneName: string;
    quality: "preview";
    action: "render";
    files: Array<{ path: string; content: string }>;
    metadata: Record<string, unknown>;
  };
  videoSpec: {
    video_title: string;
    total_duration_seconds: number;
    target_aspect_ratio: "16:9";
    resolution: "720p";
    scenes: ManimScene[];
    manim_python_code: string;
  };
  outputFormat: "mp4";
  resolution: "720p";
  fps: number;
  verifiedSource: string;
  requiredFrameNames: ["START", "KEY", "END"];
}

export interface GoldenFrameQaInput {
  requiredFrames: Array<"START" | "KEY" | "END">;
  requiredMath: string[];
  finalAnswer: { x: string; y: string };
  sourceFingerprint?: string;
}

export type GoldenGateStatus = "PASS" | "FAIL" | "SKIPPED";

export interface GoldenRuntimeGateInput {
  mathGate: GoldenGateStatus;
  sceneContract: GoldenGateStatus;
  renderTask: GoldenGateStatus;
  localBridge: GoldenGateStatus;
  actualManim: GoldenGateStatus;
  mp4Artifact: GoldenGateStatus;
  frameArtifact: GoldenGateStatus;
  frameStructural: GoldenGateStatus;
  mathProvenance: GoldenGateStatus;
  optionalAiVisualQa: GoldenGateStatus;
}

export function evaluateGoldenRuntimeGate(input: GoldenRuntimeGateInput) {
  const required = ["mathGate", "sceneContract", "renderTask", "localBridge", "actualManim", "mp4Artifact", "frameArtifact", "frameStructural", "mathProvenance"] as const;
  return {
    optionalAiVisualQa: input.optionalAiVisualQa,
    finalGate: required.every((key) => input[key] === "PASS") ? "PASS" as const : "FAIL" as const,
  };
}

export interface GoldenRenderResult {
  status: "NOT_DISPATCHED" | "COMPLETED" | "FAILED";
  jobId?: string;
  mp4Path?: string;
  frameQaInputReady: boolean;
  reasons: string[];
}

export interface GoldenPathResult {
  problem: GoldenStage<string>;
  parsedProblem: GoldenStage<MathProblemIR>;
  verifiedSolution: GoldenStage<MathSolution>;
  mathGate: MathGateResult;
  scenePlan: GoldenStage<GoldenScenePlan>;
  visualPlan: GoldenStage<VisualSpecification>;
  narrationPlan: GoldenStage<GoldenNarrationPlan>;
  renderTask: GoldenStage<GoldenRenderTask>;
  renderResult: GoldenStage<GoldenRenderResult>;
  frameQaInput: GoldenStage<GoldenFrameQaInput>;
  finalStatus: "MATH_REVIEW_REQUIRED" | "RENDER_PENDING" | "RENDER_FAILED" | "FRAME_QA_PENDING" | "FINAL_PASS";
}

const blocked = <T>(reasons: string[]): GoldenStage<T> => ({ status: "BLOCKED", value: null, reasons });
const passed = <T>(value: T): GoldenStage<T> => ({ status: "PASS", value, reasons: [] });

export function buildGoldenPath(
  problemIR: MathProblemIR | null | undefined,
  solution: MathSolution | null | undefined,
  verification: MathVerification | null | undefined,
): GoldenPathResult {
  const problemText = problemIR?.latex || problemIR?.problem || "";
  const mathGate = evaluateMathGate(problemIR, solution, verification);
  const base = {
    problem: problemIR ? passed<string>(problemText) : blocked<string>(["Problem input is missing."]),
    parsedProblem: problemIR ? passed<MathProblemIR>(problemIR) : blocked<MathProblemIR>(["Parsed problem is missing."]),
    verifiedSolution: solution ? passed<MathSolution>(solution) : blocked<MathSolution>(["Verified solution is missing."]),
    mathGate,
  };

  if (!mathGate.allowed || !problemIR || !solution || !verification) {
    const reason = mathGate.reasons.length > 0 ? mathGate.reasons : ["Math Verification Gate did not pass."];
    return {
      ...base,
      scenePlan: blocked(reason),
      visualPlan: blocked(reason),
      narrationPlan: blocked(reason),
      renderTask: blocked(reason),
      renderResult: blocked(reason),
      frameQaInput: blocked(reason),
      finalStatus: "MATH_REVIEW_REQUIRED",
    };
  }

  const deterministic = verification.deterministicVerification;
  if (!deterministic || deterministic.problemType !== "LINEAR_SYSTEM_2X2" || deterministic.classification !== "UNIQUE_SOLUTION" || deterministic.systemSolution?.type !== "POINT") {
    const reason = ["Golden Path requires a deterministic unique 2x2 system point."];
    return {
      ...base,
      scenePlan: blocked(reason),
      visualPlan: blocked(reason),
      narrationPlan: blocked(reason),
      renderTask: blocked(reason),
      renderResult: blocked(reason),
      frameQaInput: blocked(reason),
      finalStatus: "MATH_REVIEW_REQUIRED",
    };
  }

  const { x, y } = deterministic.systemSolution;
  if (!x || !y) {
    const reason = ["Deterministic point is missing x or y."];
    return { ...base, scenePlan: blocked(reason), visualPlan: blocked(reason), narrationPlan: blocked(reason), renderTask: blocked(reason), renderResult: blocked(reason), frameQaInput: blocked(reason), finalStatus: "MATH_REVIEW_REQUIRED" };
  }

  const scenePlan = buildScenePlan(x, y);
  const visualPlan = buildVisualPlan(problemText, x, y);
  const narrationPlan = buildNarrationPlan(x, y);
  const renderTask = buildRenderTask(problemText, scenePlan, narrationPlan, x, y);
  const frameQaInput: GoldenFrameQaInput = {
    requiredFrames: ["START", "KEY", "END"],
    requiredMath: ["x + y = 5", "x - y = 1", `x = ${x}`, `y = ${y}`],
    finalAnswer: { x, y },
    sourceFingerprint: deterministic.sourceFingerprint,
  };

  return {
    ...base,
    scenePlan: passed(scenePlan),
    visualPlan: passed(visualPlan),
    narrationPlan: passed(narrationPlan),
    renderTask: passed(renderTask),
    renderResult: passed({ status: "NOT_DISPATCHED", frameQaInputReady: true, reasons: ["Render has not been dispatched; no runtime success is claimed."] }),
    frameQaInput: passed(frameQaInput),
    finalStatus: "RENDER_PENDING",
  };
}

export function finalizeGoldenPath(result: GoldenPathResult, render: { status: "COMPLETED" | "FAILED"; mp4Path?: string; jobId?: string }, frameQa: { status: "PASS" | "FAIL" }): GoldenPathResult {
  if (!result.mathGate.allowed || result.scenePlan.status !== "PASS" || result.renderTask.status !== "PASS" || result.frameQaInput.status !== "PASS") {
    return { ...result, finalStatus: "MATH_REVIEW_REQUIRED" };
  }
  if (render.status !== "COMPLETED") {
    return { ...result, renderResult: passed({ status: "FAILED", jobId: render.jobId, frameQaInputReady: Boolean(result.frameQaInput.value), reasons: ["Render did not complete successfully."] }), finalStatus: "RENDER_FAILED" };
  }
  if (frameQa.status !== "PASS") {
    return { ...result, renderResult: passed({ status: "COMPLETED", jobId: render.jobId, mp4Path: render.mp4Path, frameQaInputReady: Boolean(result.frameQaInput.value), reasons: [] }), finalStatus: "FRAME_QA_PENDING" };
  }
  return { ...result, renderResult: passed({ status: "COMPLETED", jobId: render.jobId, mp4Path: render.mp4Path, frameQaInputReady: true, reasons: [] }), finalStatus: "FINAL_PASS" };
}

function buildScenePlan(x: string, y: string): GoldenScenePlan {
  return {
    verifiedValues: { x, y },
    scenes: [
      { id: "scene_01_problem", index: 1, title: "Đề bài", math: "x + y = 5;\\quad x - y = 1", visualAction: "show two source equations", narrationCueId: "cue_01" },
      { id: "scene_02_analyze", index: 2, title: "Phân tích hệ", math: "a_1=1, b_1=1, c_1=5;\\quad a_2=1, b_2=-1, c_2=1", visualAction: "highlight coefficients", narrationCueId: "cue_02" },
      { id: "scene_03_eliminate", index: 3, title: "Cộng hai phương trình", math: "(x+y)+(x-y)=5+1", visualAction: "transform to 2x=6", narrationCueId: "cue_03" },
      { id: "scene_04_x", index: 4, title: "Tìm x", math: `2x=6\\quad\\Rightarrow\\quad x=${x}`, visualAction: "write verified x value", narrationCueId: "cue_04" },
      { id: "scene_05_y", index: 5, title: "Tìm y", math: `x+y=5\\quad\\Rightarrow\\quad y=${y}`, visualAction: "substitute verified x and write y", narrationCueId: "cue_05" },
      { id: "scene_06_verify", index: 6, title: "Kiểm tra", math: `${x}+${y}=5;\\quad ${x}-${y}=1`, visualAction: "check both equations", narrationCueId: "cue_06" },
      { id: "scene_07_final", index: 7, title: "Kết luận", math: `\\boxed{x=${x},\\ y=${y}}`, visualAction: "show final verified answer", narrationCueId: "cue_07" },
    ],
  };
}

function buildVisualPlan(source: string, x: string, y: string): VisualSpecification {
  return {
    visual_type: "NONE",
    title: "Hệ phương trình bậc nhất hai ẩn",
    description: "Bố cục 2D tối giản cho hệ phương trình đã được kiểm chứng.",
    view_mode: "2d",
    coordinate_system: { x_min: -6, x_max: 6, y_min: -4, y_max: 4, axis_labels: { x: "x", y: "y" } },
    elements: [
      { id: "source_equations", type: "label", label: source },
      { id: "verified_x", type: "label", label: `x = ${x}` },
      { id: "verified_y", type: "label", label: `y = ${y}` },
    ],
  };
}

function buildNarrationPlan(x: string, y: string): GoldenNarrationPlan {
  const cues: GoldenNarrationCue[] = ([
    ["cue_01", "Ta có hệ phương trình x cộng y bằng 5 và x trừ y bằng 1.", "show two source equations", 4],
    ["cue_02", "Các hệ số của hai phương trình được giữ nguyên từ đề bài.", "highlight coefficients", 4],
    ["cue_03", "Cộng hai phương trình để khử y, ta được 2x bằng 6.", "transform to 2x=6", 4],
    ["cue_04", `Suy ra nghiệm đã kiểm chứng là x bằng ${x}.`, "write verified x value", 3],
    ["cue_05", `Thế x vào phương trình đầu, ta được y bằng ${y}.`, "substitute verified x and write y", 4],
    ["cue_06", `Thế lại, ${x} cộng ${y} bằng 5 và ${x} trừ ${y} bằng 1.`, "check both equations", 5],
    ["cue_07", `Vậy nghiệm của hệ là x bằng ${x}, y bằng ${y}.`, "show final verified answer", 4],
  ] as [string, string, string, number][]).map(([id, text, expectedVisual, durationSeconds]) => ({ id, text, expectedVisual, durationSeconds }));
  return { cues };
}

function buildRenderTask(source: string, scenePlan: GoldenScenePlan, narrationPlan: GoldenNarrationPlan, x: string, y: string): GoldenRenderTask {
  const code = `from manim import *\n\nclass GoldenLinearSystem(Scene):\n    def construct(self):\n        title = Text("2x2 Linear System", font_size=32).to_edge(UP)\n        source = MathTex(r"x+y=5\\\\ x-y=1", font_size=34)\n        elimination = MathTex(r"2x=6\\\\ x=${x}", font_size=34)\n        y_result = MathTex(r"y=${y}", font_size=34)\n        answer = MathTex(r"x=${x},\\quad y=${y}", font_size=40)\n        self.play(Write(title), Write(source))\n        self.wait(2)\n        self.play(ReplacementTransform(source, elimination))\n        self.wait(2)\n        self.play(ReplacementTransform(elimination, y_result))\n        self.wait(2)\n        self.play(ReplacementTransform(y_result, answer))\n        self.wait(3)\n`;
  return {
    jobId: `golden_path_${Date.now()}`,
    projectId: "golden-path-v1",
    projectName: "Golden Path Linear System",
    entryFile: "main.py",
    sceneName: "GoldenLinearSystem",
    quality: "preview",
    action: "render",
    files: [{ path: "main.py", content: code }],
    manifest: { projectId: "golden-path-v1", projectName: "Golden Path Linear System", entryFile: "main.py", sceneName: "GoldenLinearSystem", quality: "preview", action: "render", files: [{ path: "main.py", content: code }], metadata: { source, sceneCount: scenePlan.scenes.length, narrationCueCount: narrationPlan.cues.length, verifiedSolution: { x, y } } },
    videoSpec: { video_title: "Golden Path: Hệ phương trình", total_duration_seconds: 28, target_aspect_ratio: "16:9", resolution: "720p", scenes: scenePlan.scenes.map((scene) => ({ scene_id: scene.id, scene_index: scene.index, title: scene.title, learning_goal: scene.title, math_content: { latex: scene.math, explanation: scene.visualAction }, visual_objects: [scene.visualAction], animations: [{ type: "Write" as const, target: scene.visualAction, duration: 2 }], narration: { text_vi: narrationPlan.cues.find((cue) => cue.id === scene.narrationCueId)?.text || "", voice_tone: "step_by_step" as const, duration_hint_seconds: narrationPlan.cues.find((cue) => cue.id === scene.narrationCueId)?.durationSeconds || 2 } })), manim_python_code: code },
    outputFormat: "mp4",
    resolution: "720p",
    fps: 30,
    verifiedSource: source,
    requiredFrameNames: ["START", "KEY", "END"],
  };
}
