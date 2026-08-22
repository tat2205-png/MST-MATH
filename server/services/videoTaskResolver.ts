import { VideoTaskMode } from "./skillRouter.js";

export function resolveVideoTaskMode(input: {
  pipelineStage?: string;
  intent?: string;
  outputType?: string;
  visualType?: string;
  domain?: string;
}): VideoTaskMode | null {
  const stage = (input.pipelineStage || "").toUpperCase().trim();
  const intent = (input.intent || "").toUpperCase().trim();
  const output = (input.outputType || "").toUpperCase().trim();
  const visual = (input.visualType || "").toUpperCase().trim();
  const domain = (input.domain || "").toUpperCase().trim();

  // 1. Specific Intent / Stage overrides
  if (intent.includes("REPAIR") || stage.includes("REPAIR") || intent === "MANIM_VIDEO_REPAIR") {
    return "MANIM_VIDEO_REPAIR";
  }

  if (intent.includes("QA") || stage.includes("QA") || intent === "VIDEO_QA") {
    return "VIDEO_QA";
  }

  if (
    stage.includes("VIDEO") ||
    intent.includes("VIDEO") ||
    output.includes("VIDEO") ||
    intent === "MANIM_VIDEO_CREATE"
  ) {
    return "MANIM_VIDEO_CREATE";
  }

  if (intent.includes("CAMERA") || stage.includes("CAMERA") || intent === "CAMERA") {
    return "CAMERA";
  }

  if (
    intent.includes("NARRATION") ||
    stage.includes("NARRATION") ||
    intent.includes("VOICE") ||
    intent === "NARRATION"
  ) {
    return "NARRATION";
  }

  if (
    intent.includes("INFOGRAPHIC") ||
    stage.includes("INFOGRAPHIC") ||
    intent.includes("MINDMAP") ||
    visual.includes("INFOGRAPHIC") ||
    visual.includes("MINDMAP") ||
    intent === "INFOGRAPHIC"
  ) {
    return "INFOGRAPHIC";
  }

  if (
    visual.includes("ORTHOGRAPHIC") ||
    intent.includes("ORTHOGRAPHIC") ||
    visual.includes("HÌNH CHIẾU") ||
    intent === "ORTHOGRAPHIC_PROJECTION"
  ) {
    return "ORTHOGRAPHIC_PROJECTION";
  }

  if (
    visual === "GEOMETRY_3D" ||
    intent.includes("GEOMETRY_3D") ||
    domain.includes("KHÔNG GIAN") ||
    domain.includes("SOLID")
  ) {
    return "GEOMETRY_3D";
  }

  if (
    visual === "GEOMETRY_2D" ||
    intent.includes("GEOMETRY_2D") ||
    domain.includes("HÌNH HỌC PHẲNG") ||
    domain.includes("PLANE GEOMETRY")
  ) {
    return "GEOMETRY_2D";
  }

  if (
    visual === "FUNCTION_GRAPH" ||
    visual === "COORDINATE_GRAPH" ||
    visual === "GRAPH_2D" ||
    intent.includes("GRAPH") ||
    intent.includes("CURVE") ||
    domain.includes("HÀM SỐ") ||
    domain.includes("ĐỒ THỊ") ||
    domain.includes("OXY")
  ) {
    return "GRAPH_2D";
  }

  if (
    stage.includes("SOLVE") ||
    stage.includes("SOLUTION") ||
    intent.includes("SOLVE") ||
    intent.includes("GIẢI") ||
    stage === "STEP_2" ||
    stage === "STEP_3" ||
    intent === "MATH_SOLVE"
  ) {
    return "MATH_SOLVE";
  }

  // If problem normalization stage
  if (stage.includes("PARSE") || stage.includes("NORMALIZE")) {
    if (domain.includes("KHÔNG GIAN")) return "GEOMETRY_3D";
    if (domain.includes("PHẲNG")) return "GEOMETRY_2D";
    return "MATH_SOLVE";
  }

  // Not mapped to video skill
  return null;
}
