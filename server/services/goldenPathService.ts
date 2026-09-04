import { ManimScene, MathProblemIR, MathSolution, MathVerification, VisualSpecification } from "../../src/types/mathSchema.js";
import { readFileSync } from "node:fs";
import { resolve as resolvePath } from "node:path";
import { evaluateMathGate, MathGateResult } from "./mathVerificationGate.js";
import { NA_MATH_VIDEO_PROFILE } from "../../src/config/naMathStandardV26.js";
import { resolveConsumerProfile, resolveIcon } from "../../src/config/mstMathBrandRoot.js";

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
  equationSystem: { variables: ["x", "y"]; equations: ["x+y=5", "x-y=1"] };
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
    resolution: "720p" | "1080p";
    scenes: ManimScene[];
    manim_python_code: string;
  };
  outputFormat: "mp4";
  resolution: "720p" | "1080p";
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
  resolveConsumerProfile("VIDEO");
  for (const role of ["QUESTION_SOURCE", "SOLUTION_REASONING", "GEOMETRY_FIGURE", "RESULT_SUCCESS"] as const) resolveIcon(role);
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
    equationSystem: { variables: ["x", "y"], equations: ["x+y=5", "x-y=1"] },
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
  const profile = JSON.stringify(NA_MATH_VIDEO_PROFILE);
  const equationSystem = JSON.stringify(scenePlan.equationSystem);
  const iconRoles = Object.fromEntries((["QUESTION_SOURCE", "SOLUTION_REASONING", "GEOMETRY_FIGURE", "RESULT_SUCCESS"] as const).map((role) => [role, resolveIcon(role).resource]));
  const iconSvg = Object.fromEntries(Object.entries(iconRoles).map(([role, resource]) => [role, readFileSync(resolvePath(process.cwd(), resource), "utf8")]));
  const code = `from manim import *
import json

PROFILE = json.loads(${JSON.stringify(profile)})
MACRO_LAYOUT = PROFILE["macroLayout"]
BEHAVIOR = PROFILE["behavior"]
EQUATION_SYSTEM = json.loads(${JSON.stringify(equationSystem)})
ICON_SVG = json.loads(${JSON.stringify(JSON.stringify(iconSvg))})
VIDEO_ACCENT = "#D9911B"
BRAND_NAVY = "#0C2D57"
INK = "#18212B"
MUTED = "#66717D"
LINE = "#D8E0E6"

def semantic_icon(role, color=BRAND_NAVY):
    path = "/tmp/mst_math_icon_" + role + ".svg"
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(ICON_SVG[role].replace("currentColor", color))
    return SVGMobject(path).scale(0.12)

def section_tab(label, role, color=BRAND_NAVY):
    icon = semantic_icon(role, "#FFFFFF")
    title = Text(label, font=PROFILE["typography"]["label"], font_size=PROFILE["sizes"]["questionTag"], color="#FFFFFF", weight=BOLD)
    content = VGroup(icon, title).arrange(RIGHT, buff=0.12)
    tab = RoundedRectangle(corner_radius=0.06, width=content.width + 0.28, height=content.height + 0.14, stroke_color=color, stroke_width=1.5, fill_color=color, fill_opacity=1)
    return VGroup(tab, content)

def anchor_section_tab(tab, panel, padding=0.22):
    tab.align_to(panel, LEFT).align_to(panel, UP)
    tab.shift(RIGHT * padding + DOWN * padding)
    return tab

class GoldenLinearSystem(Scene):
    def construct(self):
        self.camera.background_color = PROFILE["colors"]["background"]
        # NA_MATH_VIDEO_QSG_V1: QUESTION_TOP / SOLUTION_LEFT / GEOMETRY_RIGHT
        # Reuse the approved NA Math panel tokens; panels are containers only and
        # do not modify the verified question, solution, or geometry source.
        question_panel = RoundedRectangle(corner_radius=0.16, width=PROFILE["regions"]["topPanel"]["width"], height=PROFILE["regions"]["topPanel"]["height"], stroke_color=PROFILE["colors"]["panelStroke"], stroke_width=2, fill_color=PROFILE["colors"]["panelFill"], fill_opacity=0.82).move_to([*PROFILE["regions"]["topPanel"]["center"], 0])
        solution_panel = RoundedRectangle(corner_radius=0.16, width=PROFILE["regions"]["leftPanel"]["width"], height=PROFILE["regions"]["leftPanel"]["height"], stroke_color=PROFILE["colors"]["panelStroke"], stroke_width=2, fill_color=PROFILE["colors"]["panelFill"], fill_opacity=0.72).move_to([*PROFILE["regions"]["leftPanel"]["center"], 0])
        geometry_panel = RoundedRectangle(corner_radius=0.16, width=PROFILE["regions"]["rightPanel"]["width"], height=PROFILE["regions"]["rightPanel"]["height"], stroke_color=PROFILE["colors"]["panelStroke"], stroke_width=2, fill_color=PROFILE["colors"]["panelFill"], fill_opacity=0.72).move_to([*PROFILE["regions"]["rightPanel"]["center"], 0])
        question_header = anchor_section_tab(section_tab("ĐỀ BÀI", "QUESTION_SOURCE"), question_panel)
        question_math = MathTex(r"\\begin{cases}" + EQUATION_SYSTEM["equations"][0] + r"\\\\" + EQUATION_SYSTEM["equations"][1] + r"\\end{cases}", font_size=PROFILE["sizes"]["math"]["max"], color=INK)
        question_math.next_to(question_header, DOWN, buff=PROFILE["spacing"]["questionBlockGap"]).align_to(question_header, LEFT)
        question = VGroup(question_header, question_math)
        solution_header = anchor_section_tab(section_tab("LỜI GIẢI", "SOLUTION_REASONING"), solution_panel)
        solution_content = VGroup(
            MathTex(r"(x+y)+(x-y)=5+1", font_size=PROFILE["sizes"]["math"]["max"], color=INK),
            MathTex(r"2x=6 \\Rightarrow x=${x}", font_size=PROFILE["sizes"]["math"]["max"], color=INK),
            MathTex(r"y=${y}", font_size=PROFILE["sizes"]["math"]["max"], color=INK),
            VGroup(semantic_icon("RESULT_SUCCESS", VIDEO_ACCENT), MathTex(r"\\boxed{x=${x},\\quad y=${y}}", font_size=PROFILE["sizes"]["result"], color=VIDEO_ACCENT)).arrange(RIGHT, buff=0.12)
        ).arrange(DOWN, aligned_edge=LEFT, buff=PROFILE["spacing"]["solutionBlockGap"]["min"])
        solution_content.next_to(solution_header, DOWN, buff=PROFILE["spacing"]["solutionBlockGap"]["min"]).align_to(solution_header, LEFT)
        solution = VGroup(solution_header, solution_content)
        geometry_header = anchor_section_tab(section_tab("HÌNH VẼ", "GEOMETRY_FIGURE"), geometry_panel)
        axes = Axes(x_range=[-1, 6, 1], y_range=[-1, 6, 1], x_length=5.1, y_length=3.5, axis_config={"color": MUTED, "include_numbers": True, "font_size": 16}).move_to([3.42, -1.35, 0])
        point = Dot(axes.c2p(${x}, ${y}), color=VIDEO_ACCENT)
        geometry_content = VGroup(axes, point)
        geometry_content.next_to(geometry_header, DOWN, buff=0.18).align_to(geometry_header, LEFT)
        geometry = VGroup(geometry_header, geometry_content)
        self.play(Create(question_panel), Create(solution_panel), Create(geometry_panel))
        self.play(Write(question))
        self.wait(1)
        for part in solution:
            self.play(Write(part))
        self.play(Create(geometry))
        self.wait(3)
`;
  return {
    jobId: `golden_path_${Date.now()}`,
    projectId: "golden-path-v1",
    projectName: "Golden Path Linear System",
    entryFile: "main.py",
    sceneName: "GoldenLinearSystem",
    quality: "preview",
    action: "render",
    files: [{ path: "main.py", content: code }],
    manifest: { projectId: "golden-path-v1", projectName: "Golden Path Linear System", entryFile: "main.py", sceneName: "GoldenLinearSystem", quality: "preview", action: "render", files: [{ path: "main.py", content: code }], metadata: { source, sceneCount: scenePlan.scenes.length, narrationCueCount: narrationPlan.cues.length, verifiedSolution: { x, y }, canonicalLayoutProfile: NA_MATH_VIDEO_PROFILE.id, canonicalLayoutId: "NA-MATH-LAYOUT-V1.3-CANONICAL", semanticOrder: ["QUESTION_TOP", "SOLUTION_LEFT", "GEOMETRY_RIGHT"], iconAuthority: "MST-MATH-DNA-SEMANTIC-ICONS-V1.1", iconRoles, resolution: "1080p", fps: 30 } },
    videoSpec: { video_title: "Golden Path: Hệ phương trình", total_duration_seconds: 28, target_aspect_ratio: "16:9", resolution: "1080p", scenes: scenePlan.scenes.map((scene) => ({ scene_id: scene.id, scene_index: scene.index, title: scene.title, learning_goal: scene.title, math_content: { latex: scene.math, explanation: scene.visualAction }, visual_objects: [scene.visualAction], animations: [{ type: "Write" as const, target: scene.visualAction, duration: 2 }], narration: { text_vi: narrationPlan.cues.find((cue) => cue.id === scene.narrationCueId)?.text || "", voice_tone: "step_by_step" as const, duration_hint_seconds: narrationPlan.cues.find((cue) => cue.id === scene.narrationCueId)?.durationSeconds || 2 } })), manim_python_code: code },
    outputFormat: "mp4",
    resolution: "1080p",
    fps: 30,
    verifiedSource: source,
    requiredFrameNames: ["START", "KEY", "END"],
  };
}
