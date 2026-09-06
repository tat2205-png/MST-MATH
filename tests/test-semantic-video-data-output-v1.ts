import assert from "node:assert/strict";
import { MATH_IR_SCHEMA_VERSION, type MathDocument } from "../src/modules/math-ir/index.js";
import {
  SEMANTIC_VIDEO_SCHEMA_VERSION,
  compileSemanticVideo,
  getOutputProfile,
  type MotionIR,
  type NarrationPlan,
  type TimelineIR,
} from "../src/modules/semantic-video/index.js";

const document: MathDocument = {
  schemaVersion: MATH_IR_SCHEMA_VERSION,
  id: "equation-demo",
  sections: [],
  problems: [],
  expressions: [
    { id: "eq-source", latex: "3x+5=2x+11" },
    { id: "eq-target", latex: "3x-2x=11-5" },
  ],
  scenes: [
    {
      id: "scene-equation",
      name: "Biến đổi phương trình",
      dimension: "2d",
      entities: [],
      constraints: [],
    },
  ],
};

const motion: MotionIR = {
  schemaVersion: SEMANTIC_VIDEO_SCHEMA_VERSION,
  id: "motion-equation-demo",
  mathDocumentId: document.id,
  scenes: [
    {
      id: "plan-equation",
      sourceSceneId: "scene-equation",
      learningGoal: "Nhìn thấy phép chuyển vế như một biến đổi tương đương, không phải hiệu ứng trang trí.",
      instructions: [
        {
          id: "motion-transform",
          primitive: "TRANSFORM_MATH",
          sourceSceneId: "scene-equation",
          semanticPurpose: "Move terms while preserving equation equivalence.",
          pedagogicalIntent: "DERIVE",
          fromExpressionId: "eq-source",
          toExpressionId: "eq-target",
          durationHintSeconds: 1.5,
        },
        {
          id: "motion-show-step",
          primitive: "SHOW_STEP",
          sourceSceneId: "scene-equation",
          semanticPurpose: "Hold the transformed equation for learner inspection.",
          pedagogicalIntent: "VERIFY",
          targetExpressionIds: ["eq-target"],
          durationHintSeconds: 1,
        },
      ],
    },
  ],
};

const narration: NarrationPlan = {
  id: "narration-equation-demo",
  cues: [
    { id: "nar-transform", text: "Chuyển hai x sang vế trái và năm sang vế phải, đồng thời đổi dấu.", language: "vi-VN", voiceTone: "step_by_step", durationHintSeconds: 2 },
    { id: "nar-check", text: "Ta thu được một phương trình tương đương.", language: "vi-VN", voiceTone: "formal_teacher", durationHintSeconds: 1.5 },
  ],
};

const timeline: TimelineIR = {
  schemaVersion: SEMANTIC_VIDEO_SCHEMA_VERSION,
  id: "timeline-equation-demo",
  fps: 30,
  cues: [
    { id: "cue-transform", scenePlanId: "plan-equation", startSeconds: 0, durationSeconds: 2, motionInstructionIds: ["motion-transform"], narrationCueId: "nar-transform" },
    { id: "cue-check", scenePlanId: "plan-equation", startSeconds: 2, durationSeconds: 2, motionInstructionIds: ["motion-show-step"], narrationCueId: "nar-check" },
  ],
};

const compile = (overrides: Partial<Parameters<typeof compileSemanticVideo>[0]> = {}) => compileSemanticVideo({
  id: "render-equation-demo",
  document,
  motion,
  narration,
  timeline,
  outputProfileId: "V01_TEACHER_CLEAN_16_9",
  renderer: "manim",
  ...overrides,
});

const first = compile();
assert.equal(first.status, "PASS", first.status === "FAIL" ? JSON.stringify(first.issues) : "");
if (first.status === "PASS") {
  assert.equal(first.manifest.renderer, "manim");
  assert.equal(first.manifest.outputProfile.width, 1920);
  assert.equal(first.manifest.outputProfile.height, 1080);
  assert.equal(first.manifest.latex.engine, "lualatex");
  assert.match(first.fingerprint, /^[a-f0-9]{64}$/);
  const second = compile();
  assert.equal(second.status, "PASS");
  if (second.status === "PASS") {
    assert.equal(second.fingerprint, first.fingerprint);
    assert.equal(second.canonicalJson, first.canonicalJson);
  }
}

const social = compile({ outputProfileId: "V02_SOCIAL_MATH_9_16" });
assert.equal(social.status, "PASS");
if (social.status === "PASS") {
  assert.equal(social.manifest.outputProfile.width, 1080);
  assert.equal(social.manifest.outputProfile.height, 1920);
  assert.equal(social.manifest.outputProfile.aspectRatio, "9:16");
}

assert.equal(getOutputProfile("V03_TEACHER_OVERLAY").stage, "P1_PILOT");

const invalidTransform = structuredClone(motion);
delete invalidTransform.scenes[0].instructions[0].toExpressionId;
const transformFailure = compile({ motion: invalidTransform });
assert.equal(transformFailure.status, "FAIL");
if (transformFailure.status === "FAIL") {
  assert.ok(transformFailure.issues.some((issue) => issue.code === "TRANSFORM_MATH_REQUIRES_EXPRESSIONS"));
}

const invalidTimeline = structuredClone(timeline);
invalidTimeline.cues[0].motionInstructionIds = ["missing-motion"];
const timelineFailure = compile({ timeline: invalidTimeline });
assert.equal(timelineFailure.status, "FAIL");
if (timelineFailure.status === "FAIL") {
  assert.ok(timelineFailure.issues.some((issue) => issue.code === "INVALID_MOTION_REFERENCE"));
  assert.ok(timelineFailure.issues.some((issue) => issue.code === "UNSCHEDULED_MOTION"));
}

const repeatedTimeline = structuredClone(timeline);
repeatedTimeline.cues[1].motionInstructionIds.push("motion-transform");
const repeatedFailure = compile({ timeline: repeatedTimeline });
assert.equal(repeatedFailure.status, "FAIL");
if (repeatedFailure.status === "FAIL") {
  assert.ok(repeatedFailure.issues.some((issue) => issue.code === "MOTION_SCHEDULED_MULTIPLE_TIMES"));
}

const mismatchedFps = structuredClone(timeline);
mismatchedFps.fps = 60;
const fpsFailure = compile({ timeline: mismatchedFps });
assert.equal(fpsFailure.status, "FAIL");
if (fpsFailure.status === "FAIL") {
  assert.ok(fpsFailure.issues.some((issue) => issue.code === "FPS_MISMATCH"));
}

console.log("SEMANTIC_VIDEO_DATA_OUTPUT_V1_TESTS=PASS");
