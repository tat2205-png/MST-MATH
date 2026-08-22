import { buildMasterCanvas } from "../server/services/masterCanvasPlanner.js";
import { MathProblemIR, MathSolution, VideoSpecification } from "../src/types/mathSchema.js";

const problemIR = {
  problem_id: "step8a-quadratic",
  problem: "Giải phương trình bậc hai ax^2 + bx + c = 0",
  latex: "ax^2 + bx + c = 0",
  domain: "Đại số & Giải tích",
  topic: "Phương trình bậc hai",
  grade: "Lớp 12",
  given: ["a != 0"],
  find: ["Nghiệm"],
  entities: [],
  constraints: [],
  ambiguities: [],
  confidence: 1,
  status: "PASS",
} as MathProblemIR;

const solution = {
  section_2_approach: { strategy_overview: "Dùng biệt thức.", roadmap_steps: [], formulas_needed: ["ax² + bx + c = 0", "Δ = b² - 4ac"] },
  section_3_detailed_steps: [],
  final_answer: { value: "Nghiệm", latex: "x", summary_text: "Nghiệm." },
} as MathSolution;

const videoSpec = {
  video_title: "Phương trình bậc hai",
  total_duration_seconds: 20,
  target_aspect_ratio: "16:9",
  resolution: "1080p",
  scenes: [],
  manim_python_code: "from manim import *",
} as VideoSpecification;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const blocked = buildMasterCanvas({ videoStyle: "standard_manim" });
assert(blocked.masterCanvas === null && blocked.qa.MASTER_CANVAS_QA === "NEED_SOURCE_VERIFICATION", "Non-cinematic build must be gated.");

const result = buildMasterCanvas({ videoStyle: "cinematic_infographic", problemIR, solution, videoSpec });
assert(result.masterCanvas !== null, "Quadratic source should build a canvas.");
assert(result.masterCanvas?.regions.map((region) => region.title).join("|") === "Phương trình bậc hai|ax² + bx + c = 0|Δ = b² - 4ac|Nghiệm", "Smoke content must remain exact.");
assert(result.masterCanvas?.regions.length === 4, "Expected four regions.");
assert(result.masterCanvas?.cameraTargets.length === 4, "Expected one target per region.");
assert(result.masterCanvas?.cameraShots.length === 6, "Expected deterministic camera plan.");
assert(result.qa.MASTER_CANVAS_QA === "PASS", "Master canvas QA failed.");
assert(result.qa.KNOWLEDGE_REGION_QA === "PASS", "Knowledge region QA failed.");
assert(result.qa.CAMERA_TARGET_QA === "PASS", "Camera target QA failed.");
assert(result.qa.CAMERA_PLAN_QA === "PASS", "Camera plan QA failed.");

console.log("MASTER_CANVAS_QA: PASS");
console.log("KNOWLEDGE_REGION_QA: PASS");
console.log("CAMERA_TARGET_QA: PASS");
console.log("CAMERA_PLAN_QA: PASS");
