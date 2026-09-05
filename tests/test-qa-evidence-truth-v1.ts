import assert from "node:assert/strict";
import { deriveQaEvidence } from "../src/lib/qaEvidence.ts";
import type { MathProblemIR, VerificationReport, VideoSpecification } from "../src/types/mathSchema.ts";

const verification: VerificationReport = {
  verification_seal: "CONFIRMED_VALID",
  status: "PASS",
  verificationSource: "HYBRID",
  checks: [],
  symbolic_correctness: { passed: true, notes: "symbolic ok" },
  numeric_soundness: { passed: true, notes: "numeric ok" },
  logical_deduction: { passed: true, notes: "logic ok" },
  geometry_invariants: { passed: true, notes: "geometry-specific invariant evidence" },
  domain_and_boundaries: { passed: true, notes: "domain ok" },
  units_and_dimensions: { passed: true, notes: "units ok" },
  counter_example_search: { found_counter_example: false, details: "none" },
  discrepancies: [],
};

const geometryProblem = {
  problem: "Cho tam giác ABC...",
  latex: "",
  domain: "Hình học phẳng",
  topic: "Tam giác",
  grade: "Lớp 10",
  given: [],
  find: [],
  entities: [],
  constraints: [],
  ambiguities: [],
  confidence: 1,
  status: "PASS",
} as MathProblemIR;

const algebraProblem = {
  ...geometryProblem,
  problem: "Giải phương trình",
  domain: "Đại số & Giải tích",
  topic: "Phương trình",
} as MathProblemIR;

const noVideo = deriveQaEvidence(geometryProblem, verification, null);
assert.equal(noVideo.geometry, "PASS", "geometry may PASS only from geometry-specific invariant evidence");
assert.equal(noVideo.layout, "NOT_TESTED", "video presence must not be inferred");
assert.equal(noVideo.camera, "NOT_TESTED");
assert.equal(noVideo.narration, "NOT_TESTED");
assert.equal(noVideo.python, "NOT_TESTED");
assert.equal(noVideo.manimRuntime, "NOT_TESTED");
assert.equal(noVideo.frame, "NOT_TESTED");

const videoWithoutQa = {
  video_title: "demo",
  total_duration_seconds: 10,
  target_aspect_ratio: "16:9",
  resolution: "1080p",
  scenes: [{
    scene_id: "s1",
    scene_index: 1,
    title: "scene",
    learning_goal: "goal",
    math_content: { latex: "x", explanation: "x" },
    visual_objects: [],
    animations: [],
    narration: { text_vi: "Có lời thoại", voice_tone: "formal_teacher", duration_hint_seconds: 5 },
  }],
  manim_python_code: "x".repeat(100),
} as VideoSpecification;

const presenceOnly = deriveQaEvidence(geometryProblem, verification, videoWithoutQa);
assert.equal(presenceOnly.layout, "NOT_TESTED", "videoSpec existence is not layout evidence");
assert.equal(presenceOnly.camera, "NOT_TESTED", "videoSpec existence is not camera evidence");
assert.equal(presenceOnly.narration, "NOT_TESTED", "scene existence is not narration-sync evidence");
assert.equal(presenceOnly.python, "NOT_TESTED", "code length is not Python QA evidence");

const canvasVerified = {
  ...videoWithoutQa,
  masterCanvasQa: {
    MASTER_CANVAS_QA: "PASS",
    KNOWLEDGE_REGION_QA: "PASS",
    CAMERA_TARGET_QA: "PASS",
    CAMERA_PLAN_QA: "PASS",
    details: [],
  },
} as VideoSpecification;
const canvasEvidence = deriveQaEvidence(geometryProblem, verification, canvasVerified);
assert.equal(canvasEvidence.layout, "PASS");
assert.equal(canvasEvidence.camera, "PASS");

const completedRender = {
  ...canvasVerified,
  render_job: { job_id: "r1", status: "COMPLETED", progress: 100, logs: [] },
} as VideoSpecification;
const renderEvidence = deriveQaEvidence(geometryProblem, verification, completedRender);
assert.equal(renderEvidence.python, "PASS", "successful execution is valid runtime evidence");
assert.equal(renderEvidence.manimRuntime, "PASS");
assert.equal(renderEvidence.frame, "NOT_TESTED", "runtime completion is not frame-QA evidence");

const graphWithoutCheck = deriveQaEvidence(algebraProblem, verification, null);
assert.equal(graphWithoutCheck.graph, "NOT_TESTED", "general Math QA must not proxy Graph QA");

const graphVerification: VerificationReport = {
  ...verification,
  checks: [{ id: "graph-domain", name: "Đồ thị hàm số", status: "PASS", details: "graph evidence" }],
};
assert.equal(deriveQaEvidence(algebraProblem, graphVerification, null).graph, "PASS");

console.log("QA_DIMENSION_EVIDENCE_GATE=PASS");
console.log("NO_PROXY_PASS_GATE=PASS");
