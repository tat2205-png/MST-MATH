import { MathProblemIR, MathSolution, VideoSpecification, VideoStyleType } from "../../src/types/mathSchema.js";
import {
  CameraShot,
  CameraTarget,
  KnowledgeRegion,
  MasterCanvas,
  MasterCanvasBuildResult,
  MasterCanvasQa,
} from "../../src/types/cinematicCanvas.js";

export interface MasterCanvasBuildInput {
  videoStyle?: VideoStyleType;
  problemIR?: MathProblemIR;
  solution?: MathSolution;
  videoSpec?: VideoSpecification;
}

const NEED_SOURCE_QA: MasterCanvasQa = {
  MASTER_CANVAS_QA: "NEED_SOURCE_VERIFICATION",
  KNOWLEDGE_REGION_QA: "NEED_SOURCE_VERIFICATION",
  CAMERA_TARGET_QA: "NEED_SOURCE_VERIFICATION",
  CAMERA_PLAN_QA: "NEED_SOURCE_VERIFICATION",
  details: ["Cinematic Infographic requires verified problem, solution, and video sources."],
};

export function buildMasterCanvas(input: MasterCanvasBuildInput): MasterCanvasBuildResult {
  if (input.videoStyle !== "cinematic_infographic" || !input.problemIR || !input.solution || !input.videoSpec) {
    return { masterCanvas: null, qa: NEED_SOURCE_QA };
  }

  const sourceText = JSON.stringify({ problemIR: input.problemIR, solution: input.solution, videoSpec: input.videoSpec });
  const hasQuadraticSource = /bậc hai|quadratic|x\s*\^?\s*2|x²/i.test(sourceText);
  const formulaSources = collectFormulaSources(input.solution, input.videoSpec);

  if (!hasQuadraticSource || formulaSources.length < 2) {
    return {
      masterCanvas: null,
      qa: {
        ...NEED_SOURCE_QA,
        details: ["Verified source does not contain enough explicit quadratic lesson content."],
      },
    };
  }

  const regionData = [
    { id: "region_central", type: "TITLE" as const, title: "Phương trình bậc hai", x: 900, y: 500, contentId: "content_topic" },
    { id: "region_formula", type: "FORMULA" as const, title: "ax² + bx + c = 0", x: 180, y: 180, contentId: formulaSources[0] },
    { id: "region_discriminant", type: "FORMULA" as const, title: "Δ = b² - 4ac", x: 1800, y: 180, contentId: formulaSources[1] },
    { id: "region_roots", type: "SUMMARY" as const, title: "Nghiệm", x: 1800, y: 820, contentId: formulaSources[2] || "content_final_answer" },
  ];

  const regions: KnowledgeRegion[] = regionData.map((region, index) => ({
    id: region.id,
    type: region.type,
    title: region.title,
    position: { x: region.x, y: region.y },
    width: region.id === "region_central" ? 600 : 420,
    height: region.id === "region_central" ? 260 : 220,
    contentIds: [region.contentId],
    narrationCueIds: [`cue_${index + 1}`],
    cameraTargetId: `target_${region.id}`,
    sourceRefs: [region.contentId],
  }));

  const cameraTargets: CameraTarget[] = regions.map((region) => ({
    id: region.cameraTargetId as string,
    regionId: region.id,
    center: { x: region.position.x + region.width / 2, y: region.position.y + region.height / 2 },
    frameWidth: region.width + 180,
    requiredContentIds: region.contentIds,
  }));

  const cameraShots: CameraShot[] = [
    { id: "shot_overview", type: "OVERVIEW", targetId: "target_region_central", narrationCueIds: ["cue_1"], duration: 3, sequenceIndex: 1 },
    { id: "shot_formula", type: "TRAVEL", targetId: "target_region_formula", narrationCueIds: ["cue_2"], duration: 2, sequenceIndex: 2 },
    { id: "shot_formula_read", type: "READ", targetId: "target_region_formula", narrationCueIds: ["cue_2"], duration: 4, sequenceIndex: 3 },
    { id: "shot_discriminant", type: "FOCUS", targetId: "target_region_discriminant", narrationCueIds: ["cue_3"], duration: 4, sequenceIndex: 4 },
    { id: "shot_roots", type: "SETTLE", targetId: "target_region_roots", narrationCueIds: ["cue_4"], duration: 4, sequenceIndex: 5 },
    { id: "shot_pull_out", type: "PULL_OUT", targetId: "target_region_central", narrationCueIds: ["cue_1"], duration: 3, sequenceIndex: 6 },
  ];

  const masterCanvas: MasterCanvas = {
    id: `master_canvas_${input.problemIR.problem_id || "quadratic"}`,
    title: input.problemIR.topic || "Phương trình bậc hai",
    width: 2400,
    height: 1350,
    centerRegionId: "region_central",
    regions,
    connections: [
      { id: "connection_formula", fromRegionId: "region_central", toRegionId: "region_formula", style: "CURVED_RIBBON" },
      { id: "connection_discriminant", fromRegionId: "region_central", toRegionId: "region_discriminant", style: "CURVED_RIBBON" },
      { id: "connection_roots", fromRegionId: "region_central", toRegionId: "region_roots", style: "CURVED_RIBBON" },
    ],
    cameraTargets,
    cameraShots,
  };

  return { masterCanvas, qa: validateMasterCanvas(masterCanvas) };
}

function collectFormulaSources(solution: MathSolution, videoSpec: VideoSpecification): string[] {
  const sourceIds = solution.section_2_approach.formulas_needed
    .concat(solution.section_3_detailed_steps.map((step) => step.math_latex))
    .concat(videoSpec.scenes.map((scene) => scene.math_content.latex))
    .filter((value) => typeof value === "string" && value.trim().length > 0);
  return [...new Set(sourceIds)];
}

function validateMasterCanvas(masterCanvas: MasterCanvas): MasterCanvasQa {
  const regionsValid = masterCanvas.regions.length === 4 && masterCanvas.regions.every((region) => region.contentIds.length > 0);
  const targetsValid = masterCanvas.cameraTargets.length === masterCanvas.regions.length && masterCanvas.cameraTargets.every((target) => target.requiredContentIds.length > 0);
  const planValid = masterCanvas.cameraShots.length > 0 && masterCanvas.cameraShots.every((shot) => shot.duration > 0 && shot.sequenceIndex > 0);
  const canvasValid = masterCanvas.width > 0 && masterCanvas.height > 0 && masterCanvas.centerRegionId === "region_central";
  const status = (valid: boolean) => valid ? "PASS" as const : "FAIL" as const;

  return {
    MASTER_CANVAS_QA: status(canvasValid),
    KNOWLEDGE_REGION_QA: status(regionsValid),
    CAMERA_TARGET_QA: status(targetsValid),
    CAMERA_PLAN_QA: status(planValid),
    details: ["Deterministic 8A planner only; no render or LLM inference performed."],
  };
}
