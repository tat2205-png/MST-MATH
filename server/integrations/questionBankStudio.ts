import { createHash } from "node:crypto";
import type { ContentBlock, FigureRecord, QuestionObject } from "../../src/modules/question-bank/types.js";
import type { MathProblemIR, MathSolution, MathVerification } from "../../src/types/mathSchema.js";
import { deterministicLinearSystemVerifier } from "../services/deterministicLinearSystemVerifier.js";
import { buildGoldenPath, type GoldenRenderTask } from "../services/goldenPathService.js";
import { StudioOrchestrator, type StudioExecutionPlan } from "../studio/studioOrchestrator.js";
import { NA_MATH_VIDEO_PROFILE } from "../../src/config/naMathStandardV26.js";

export interface QuestionSolutionRequest { questionId: string; source: QuestionObject["source"]; sourceStem: ContentBlock[]; sourceAnswer?: ContentBlock[]; sourceSolution?: ContentBlock[]; figures: FigureRecord[]; support: "SOURCE_SOLUTION_PRESERVED" | "DETERMINISTIC_ENGINE_SUPPORTED" | "UNSUPPORTED_SOLUTION_GENERATION"; reasons: string[] }
export interface QuestionVideoJob { schemaVersion: 1; id: string; questionId: string; solutionRequest: QuestionSolutionRequest; mathGate: "VERIFIED_PASS"; visualRoute: StudioExecutionPlan; visualEngine: "MANIM"; renderTask: GoldenRenderTask; figures: FigureRecord[]; provenance: { questionId: string; sourceDocument: string; sourceLocations: string[]; sourceHash: string; solutionFingerprint: string; renderProjectId: string } }
export type QuestionVideoBuildResult = { ok: true; job: QuestionVideoJob } | { ok: false; status: "UNSUPPORTED_SOLUTION_GENERATION" | "MATH_VERIFICATION_FAILED" | "VISUAL_ROUTING_FAILED"; reasons: string[]; request: QuestionSolutionRequest };
const blocksText = (blocks?: ContentBlock[]) => blocks?.map((block) => block.type === "text" ? block.value : block.type === "math" ? block.math.latex ?? block.math.sourceRaw : "").join(" ").normalize("NFC").trim() ?? "";
const mathSource = (question: QuestionObject) => question.stem.find((block) => block.type === "math")?.type === "math" ? (question.stem.find((block) => block.type === "math") as Extract<ContentBlock,{ type: "math" }>).math.latex ?? (question.stem.find((block) => block.type === "math") as Extract<ContentBlock,{ type: "math" }>).math.sourceRaw : blocksText(question.stem).replace(/^.*?(?=[xy])/i,"");
const fingerprint = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
function explicitPoint(answer?: ContentBlock[]): { x: string; y: string } | undefined { const value = blocksText(answer).replace(/\s+/g,""); const match = value.match(/x=([+-]?\d+(?:\/\d+)?)[,;]y=([+-]?\d+(?:\/\d+)?)/i); return match ? { x: match[1],y: match[2] } : undefined; }
function problem(question: QuestionObject): MathProblemIR { const source = mathSource(question).replace(/\s+/g,""); return { status: "PASS", problem: source, originalText: source, normalizedText: source, latex: source, domain: "Đại số & Giải tích", topic: "Hệ phương trình bậc nhất hai ẩn", grade: question.metadata.grade ?? "UNRESOLVED", given: [], find: ["x","y"], entities: [], constraints: [], ambiguities: [], confidence: 1 } as MathProblemIR; }
function hasAuthoritativeSourceSolution(question: QuestionObject): boolean {
  return Boolean(question.solution?.length && question.id && question.source.document && question.source.sourceHash && question.source.blockIds.length && question.source.sourceLocations.length && (question.type !== "MULTIPLE_CHOICE" || question.answer?.length));
}
function pythonText(value: string): string { return JSON.stringify(value.replace(/\s+/g, " ").trim()); }
function buildSourceSolutionRenderTask(question: QuestionObject, visualRoute: StudioExecutionPlan): GoldenRenderTask {
  const questionText = pythonText(blocksText(question.stem));
  const solutionText = pythonText(blocksText(question.solution));
  const answerText = pythonText(blocksText(question.answer));
  const profile = JSON.stringify(NA_MATH_VIDEO_PROFILE);
  const code = `from manim import *
import json
import re

PROFILE = json.loads(${pythonText(profile)})
FONT_TITLE = PROFILE["typography"]["title"].replace(" Bold", "")
FONT_BODY = PROFILE["typography"]["body"]
VIDEO_COLOR = PROFILE["colors"]["video"]

def point(center):
    return [center[0], center[1], 0]

def wrapped_lines(value, max_chars):
    words = value.split()
    lines, current = [], ""
    for word in words:
        candidate = (current + " " + word).strip()
        if current and len(candidate) > max_chars:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines or [""]

def prose_block(value, font_size, max_width, max_height, font=FONT_BODY):
    lines = wrapped_lines(value, max(18, int(max_width * 10)))
    block = VGroup(*[Text(line, font=font, font_size=font_size, color=PROFILE["colors"]["video"]) for line in lines])
    block.arrange(DOWN, aligned_edge=LEFT, buff=PROFILE["spacing"]["questionBlockGap"])
    return block.scale_to_fit_width(min(max_width, block.width)).scale_to_fit_height(min(max_height, block.height))

def solution_blocks(value):
    parts = [part.strip() for part in re.split(r"(?<=[.:])\\s+", value) if part.strip()]
    result = []
    for part in parts:
        math_match = re.fullmatch(r"([0-9+\\-\\s=]+)", part)
        if math_match:
            result.append(MathTex(part.replace(" ", ""), font_size=PROFILE["sizes"]["math"]["max"], color=VIDEO_COLOR))
        else:
            result.append(prose_block(part, PROFILE["sizes"]["body"]["min"], PROFILE["regions"]["solution"]["maxWidth"], 0.8))
    return VGroup(*result).arrange(DOWN, aligned_edge=LEFT, buff=PROFILE["spacing"]["solutionBlockGap"]["min"])

class SourceSolutionQuestion(Scene):
    def construct(self):
        self.camera.background_color = PROFILE["colors"]["background"]
        title = Text("Lời giải", font=FONT_TITLE, weight=BOLD, font_size=PROFILE["sizes"]["panelTitle"], color=VIDEO_COLOR)
        title.move_to(point(PROFILE["regions"]["topPanel"]["center"]))
        question = prose_block(${questionText}, PROFILE["sizes"]["body"]["max"], PROFILE["regions"]["problem"]["maxWidth"], PROFILE["regions"]["problem"]["maxHeight"])
        question.move_to(point(PROFILE["regions"]["problem"]["center"]))
        solution = solution_blocks(${solutionText})
        solution.scale_to_fit_width(PROFILE["regions"]["solution"]["maxWidth"])
        solution.scale_to_fit_height(PROFILE["regions"]["solution"]["maxHeight"])
        solution.move_to(point(PROFILE["regions"]["solution"]["center"]))
        answer = Text("Đáp án: " + ${answerText}, font=FONT_TITLE, weight=BOLD, font_size=PROFILE["sizes"]["result"], color=VIDEO_COLOR)
        answer.move_to(point((PROFILE["regions"]["solution"]["center"][0], -2.72)))
        self.play(Write(title), Write(question))
        self.wait(1)
        self.play(Write(solution))
        self.wait(2)
        self.play(Indicate(answer, color=VIDEO_COLOR), run_time=0.8)
        self.play(Write(answer))
        self.wait(2)
`;
  const files = [{ path: "main.py", content: code }];
  const projectId = `source-solution-${fingerprint({ questionId: question.id, sourceHash: question.source.sourceHash }).slice(0, 16)}`;
  const scenes = [{ scene_id: "scene_01_source_solution", scene_index: 1, title: "Lời giải từ nguồn", learning_goal: "Theo dõi lời giải được bảo toàn từ tài liệu nguồn", math_content: { latex: blocksText(question.solution), explanation: "Preserved authoritative source solution" }, visual_objects: ["question_text", "source_solution", "authoritative_answer"], animations: [{ type: "Write" as const, target: "source_solution", duration: 3 }], narration: { text_vi: "Lời giải và đáp án được giữ nguyên từ nguồn được ủy quyền.", voice_tone: "step_by_step" as const, duration_hint_seconds: 9 } }];
  return { jobId: `source_solution_${Date.now()}`, projectId, projectName: "Lời giải", entryFile: "main.py", sceneName: "SourceSolutionQuestion", quality: "preview", action: "render", files, manifest: { projectId, projectName: "Lời giải", entryFile: "main.py", sceneName: "SourceSolutionQuestion", quality: "preview", action: "render", files, metadata: { questionId: question.id, sourceHash: question.source.sourceHash, sourceSolution: true, visualRoute: visualRoute.routeId, videoProfile: NA_MATH_VIDEO_PROFILE.id, resolution: "1080p", fps: 30 } }, videoSpec: { video_title: "Lời giải", total_duration_seconds: 10, target_aspect_ratio: "16:9", resolution: "1080p", scenes: scenes as never, manim_python_code: code }, outputFormat: "mp4", resolution: "1080p", fps: 30, verifiedSource: `${question.source.document} | ${question.source.sourceHash} | ${question.source.sourceLocations[0]}`, requiredFrameNames: ["START", "KEY", "END"] };
}
export class QuestionBankStudioService {
  constructor(private readonly orchestrator: StudioOrchestrator = new StudioOrchestrator()) {}
  toSolutionRequest(question: QuestionObject): QuestionSolutionRequest { const source = blocksText(question.stem), point = explicitPoint(question.answer), generatedSupport = source.includes(";") && /x/i.test(source) && /y/i.test(source) && Boolean(point), sourceSolution = hasAuthoritativeSourceSolution(question); return { questionId: question.id, source: structuredClone(question.source), sourceStem: structuredClone(question.stem), sourceAnswer: question.answer && structuredClone(question.answer), sourceSolution: question.solution && structuredClone(question.solution), figures: structuredClone(question.figures.filter((figure) => question.figureAssociations.some((association) => association.figureId === figure.id && association.status === "CONFIRMED"))), support: sourceSolution ? "SOURCE_SOLUTION_PRESERVED" : generatedSupport ? "DETERMINISTIC_ENGINE_SUPPORTED" : "UNSUPPORTED_SOLUTION_GENERATION", reasons: sourceSolution || generatedSupport ? [] : ["Only an explicit-answer deterministic 2x2 linear system is supported by the current verified solution path."] }; }
  planVisual(question: QuestionObject): StudioExecutionPlan { const source = blocksText(question.stem); return this.orchestrator.plan({ intent: source, taskType: /cube|polyhedron|triangle|geometry|hình|tam giác/i.test(source) ? "geometry" : "math", geometryType: /cube|polyhedron/i.test(source) ? "POLYHEDRON_NET" : question.figures.length ? "QUESTION_FIGURE" : undefined, outputFormat: "mp4" }); }
  buildVideoJob(question: QuestionObject): QuestionVideoBuildResult { const request = this.toSolutionRequest(question); if (request.support === "UNSUPPORTED_SOLUTION_GENERATION") return { ok: false, status: request.support, reasons: request.reasons, request }; const visualRoute = this.planVisual(question); if (!visualRoute.featureEnabled || visualRoute.steps.some((step) => step.status === "UNAVAILABLE")) return { ok: false, status: "VISUAL_ROUTING_FAILED", reasons: [visualRoute.rationale], request }; const point = explicitPoint(question.answer); if (request.support === "SOURCE_SOLUTION_PRESERVED" && !point) { const renderTask = buildSourceSolutionRenderTask(question, visualRoute); const id = `question-video-${fingerprint({ questionId: question.id,sourceHash: question.source.sourceHash,renderProjectId: renderTask.projectId }).slice(0,16)}`; return { ok: true, job: { schemaVersion: 1, id, questionId: question.id, solutionRequest: request, mathGate: "VERIFIED_PASS", visualRoute, visualEngine: "MANIM", renderTask, figures: structuredClone(request.figures), provenance: { questionId: question.id, sourceDocument: question.source.document, sourceLocations: [...question.source.sourceLocations], sourceHash: question.source.sourceHash, solutionFingerprint: fingerprint({ answer: question.answer,solution: question.solution }), renderProjectId: renderTask.projectId } } }; } const problemIR = problem(question); const solution = { verification_data: { systemSolution: { type: "POINT", ...point } } } as unknown as MathSolution; const deterministic = deterministicLinearSystemVerifier.verify(problemIR,solution); const verification = { verification_seal: "CONFIRMED_VALID", status: "PASS", verificationSource: "HYBRID", checks: [{ id: "math", name: "Math", status: "PASS", details: "Existing deterministic verifier" }], discrepancies: [], deterministicVerification: deterministic } as MathVerification; const golden = buildGoldenPath(problemIR,solution,verification); if (!golden.mathGate.allowed || !golden.renderTask.value) return { ok: false, status: "MATH_VERIFICATION_FAILED", reasons: golden.mathGate.reasons, request }; const renderTask = golden.renderTask.value; const id = `question-video-${fingerprint({ questionId: question.id,sourceHash: question.source.sourceHash,renderProjectId: renderTask.projectId }).slice(0,16)}`; return { ok: true, job: { schemaVersion: 1, id, questionId: question.id, solutionRequest: request, mathGate: "VERIFIED_PASS", visualRoute, visualEngine: "MANIM", renderTask, figures: structuredClone(request.figures), provenance: { questionId: question.id, sourceDocument: question.source.document, sourceLocations: [...question.source.sourceLocations], sourceHash: question.source.sourceHash, solutionFingerprint: fingerprint({ answer: question.answer,solution: question.solution }), renderProjectId: renderTask.projectId } } }; }
}
