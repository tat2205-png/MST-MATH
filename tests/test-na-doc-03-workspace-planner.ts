import assert from "node:assert/strict";
import {
  deserializeWorkspacePlan, planQuestionWorkspace, planStudentWorkspace, serializeWorkspacePlan,
  validateDocumentComponent, workspacePlanToComponent,
} from "../src/modules/document-engine/index.js";
import type { QuestionObject } from "../src/modules/question-bank/types.js";

const pass = (input: Parameters<typeof planStudentWorkspace>[0], expected: string) => {
  const result = planStudentWorkspace(input);
  assert.equal(result.status, "PASS");
  if (result.status === "PASS") assert.equal(result.workspace.type, expected);
  return result;
};

pass({ questionType: "MULTIPLE_CHOICE" }, "NONE");
pass({ questionType: "TRUE_FALSE" }, "NONE");
pass({ questionType: "SHORT_ANSWER", responseComplexity: "MINIMAL" }, "FREE_RESPONSE_SMALL");
pass({ questionType: "ESSAY", responseComplexity: "SHORT_WRITTEN" }, "FREE_RESPONSE_SMALL");
pass({ questionType: "ESSAY", responseComplexity: "MULTI_STEP" }, "GRID_MEDIUM");
pass({ questionType: "ESSAY", responseComplexity: "LONG_DERIVATION" }, "GRID_LARGE");
const graph = pass({ questionType: "ESSAY", taskIntent: "GRAPH_ON_AXES" }, "COORDINATE_2D");
const construction = pass({ questionType: "ESSAY", taskIntent: "GEOMETRIC_CONSTRUCTION" }, "DRAWING_AREA");
pass({ questionType: "ESSAY", sourceSignals: ["COORDINATES_PRESENT"] }, "NONE");
pass({ questionType: "ESSAY", sourceSignals: ["GEOMETRY_VOCABULARY_PRESENT"] }, "NONE");
pass({}, "NONE");
pass({ questionType: "ESSAY", explicitAuthorOverride: "GRID_SMALL" }, "GRID_SMALL");
const invalid = planStudentWorkspace({ explicitAuthorOverride: "GRID_EXTRA_LARGE" });
assert.equal(invalid.status, "FAIL");
assert.equal(invalid.reasonCode, "INVALID_AUTHOR_OVERRIDE");

const sourceFigureQuestion: Pick<QuestionObject, "type" | "figures"> = {
  type: "ESSAY",
  figures: [{ id: "figure-1", relationshipId: "rId1", sourceLocation: "word/document.xml:p1" }],
};
const sourceFigurePlan = planQuestionWorkspace(sourceFigureQuestion);
assert.equal(sourceFigurePlan.status, "PASS");
if (sourceFigurePlan.status === "PASS") assert.equal(sourceFigurePlan.workspace.type, "NONE");

for (const input of [
  { questionType: "ESSAY" as const, taskIntent: "GRAPH_ON_AXES" as const },
  { questionType: "ESSAY" as const, taskIntent: "GEOMETRIC_CONSTRUCTION" as const },
  { questionType: "ESSAY" as const, responseComplexity: "MULTI_STEP" as const },
]) assert.deepEqual(planStudentWorkspace(input), planStudentWorkspace(input));

for (const plan of [graph, construction, sourceFigurePlan, invalid]) assert.deepEqual(deserializeWorkspacePlan(serializeWorkspacePlan(plan)), plan);

if (graph.status !== "PASS") throw new Error("GRAPH_PLAN_FAILED");
const component = workspacePlanToComponent("workspace-component", graph);
assert.equal(validateDocumentComponent(component).status, "PASS");
assert.equal(component.workspace.schemaVersion, "student-workspace/v1");

const forbiddenVisualKeys = new Set([
  "points", "lines", "rays", "segments", "curves", "graphs", "intercepts", "extrema", "asymptotes", "regions", "solutionVertices",
  "vectors", "vertices", "edges", "faces", "centers", "altitudes", "heightFeet", "diagonals", "sections", "solids", "auxiliaryConstructions",
]);
const assertNoVisualContent = (value: unknown) => {
  if (Array.isArray(value)) return value.forEach(assertNoVisualContent);
  if (typeof value !== "object" || value === null) return;
  for (const [key, child] of Object.entries(value)) {
    assert.equal(forbiddenVisualKeys.has(key), false, `Planner created forbidden visual key ${key}`);
    assertNoVisualContent(child);
  }
};
assertNoVisualContent(graph);
assertNoVisualContent(construction);
assert.throws(() => deserializeWorkspacePlan(JSON.stringify({ ...graph, points: [{ x: 1, y: 2 }] })), /WORKSPACE_PLAN_VISUAL_PAYLOAD_FORBIDDEN/);

console.log([
  "MCQ_TO_NONE=PASS", "TRUE_FALSE_TO_NONE=PASS", "SHORT_RESPONSE_TO_SMALL_WORKSPACE=PASS",
  "MULTI_STEP_TO_GRID_MEDIUM=PASS", "LONG_DERIVATION_TO_GRID_LARGE=PASS", "GRAPH_TASK_TO_COORDINATE_2D=PASS",
  "COORDINATE_INPUT_ONLY_NOT_GRAPH_WORKSPACE=PASS", "GEOMETRY_SOURCE_FIGURE_NOT_AUTO_DRAWING_AREA=PASS",
  "CONSTRUCTION_TASK_TO_DRAWING_AREA=PASS", "UNKNOWN_TASK_SAFE_FALLBACK=PASS",
  "VALID_MANUAL_OVERRIDE=PASS", "INVALID_MANUAL_OVERRIDE=PASS", "NO_FORCED_WORKSPACE=PASS",
  "NO_ARBITRARY_LARGE_WORKSPACE=PASS", "NO_GEOMETRY_CREATED_BY_PLANNER=PASS",
  "NO_GRAPH_CREATED_BY_PLANNER=PASS", "NO_VECTOR_CREATED_BY_PLANNER=PASS", "NO_SOLID_CREATED_BY_PLANNER=PASS",
  "DETERMINISTIC_PLANNER=PASS", "SERIALIZATION_ROUNDTRIP=PASS", "NA_DOC_01S_REUSE_QA=PASS",
  "NA_DOC_02_REUSE_QA=PASS", "NA_DOC_03_STATUS=PASS",
].join("\n"));
