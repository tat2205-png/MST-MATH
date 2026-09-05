import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildSolutionPrompt,
  curriculumContext,
  GENERIC_SOLUTION_SCHEMA_DESCRIPTION,
  UNKNOWN_CURRICULUM_CONTEXT,
} from "../server/services/solutionGenerator.ts";
import type { MathProblemIR } from "../src/types/mathSchema.ts";

const unknownProblem = {
  problem: "Giải bài toán từ dữ kiện đã cho",
  latex: "",
  domain: undefined,
  topic: undefined,
  grade: undefined,
  given: [],
  find: [],
  entities: [],
  constraints: [],
  ambiguities: [],
  confidence: 0.5,
  status: "NEED_MORE_INFORMATION",
} as unknown as MathProblemIR;

const context = curriculumContext(unknownProblem);
assert.equal(context.domain, UNKNOWN_CURRICULUM_CONTEXT);
assert.equal(context.topic, UNKNOWN_CURRICULUM_CONTEXT);
assert.equal(context.grade, UNKNOWN_CURRICULUM_CONTEXT);

const prompt = buildSolutionPrompt(unknownProblem);
assert.equal(prompt.includes("GRADE: Lớp 12"), false);
assert.equal(prompt.includes("DOMAIN: Đại số & Giải tích"), false);
assert.equal(prompt.includes("UNKNOWN — cần xác minh"), true);
assert.equal(prompt.includes("do not invent or default a curriculum classification"), true);

for (const anchoredExample of ["2x^2 - 5x + 2", "\\Delta = b^2 - 4ac", "Định lý Vi-et"]) {
  assert.equal(
    GENERIC_SOLUTION_SCHEMA_DESCRIPTION.includes(anchoredExample),
    false,
    `generic solution schema must not anchor unrelated problems with ${anchoredExample}`,
  );
}

const visualSource = readFileSync("server/services/visualPlanner.ts", "utf8");
for (const fabricatedFallback of [
  "Fallback visual specification",
  'equation: "x^3 - 3*x"',
  'label: "S", coords: [0, 0, 4]',
  'points: [[0, 0], [4, 0], [1, 3]]',
]) {
  assert.equal(
    visualSource.includes(fabricatedFallback),
    false,
    `authoritative visual path must not contain fabricated fallback: ${fabricatedFallback}`,
  );
}
assert.equal(visualSource.includes("VISUAL_PLANNING_REVIEW_REQUIRED"), true);
assert.equal(visualSource.includes("no fabricated fallback was produced"), true);
assert.equal(visualSource.includes("ZERO-INFERENCE"), true);

console.log("CURRICULUM_UNKNOWN_FAIL_CLOSED_GATE=PASS");
console.log("SILENT_CURRICULUM_DEFAULT_COUNT=0");
console.log("FABRICATED_VISUAL_FALLBACK_COUNT=0");
console.log("ZERO_INFERENCE_GATE=PASS");
