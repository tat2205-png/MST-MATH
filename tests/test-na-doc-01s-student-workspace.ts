import assert from "node:assert/strict";
import {
  STUDENT_WORKSPACE_PRESETS, STUDENT_WORKSPACE_TYPES,
  createStudentWorkspace, deserializeStudentWorkspace, serializeStudentWorkspace,
  validateStudentWorkspace,
} from "../src/modules/document-engine/index.js";

const pass = (value: unknown, audience: "STUDENT" | "TEACHER" = "STUDENT") => assert.equal(validateStudentWorkspace(value, { audience }).status, "PASS");
const failsWith = (value: unknown, code: string) => {
  const result = validateStudentWorkspace(value);
  assert.equal(result.status, "FAIL");
  assert.ok(result.issues.some((item) => item.code === code), `${code}: ${JSON.stringify(result.issues)}`);
};

const none = createStudentWorkspace("NONE");
pass(none); assert.equal(none.width, 0); assert.equal(none.height, 0);

for (const type of ["GRID_SMALL", "GRID_MEDIUM", "GRID_LARGE"] as const) {
  const grid = createStudentWorkspace(type);
  pass(grid); assert.equal(grid.cellSizeMm, 5); assert.equal(grid.columns * grid.cellSizeMm, grid.width); assert.equal(grid.rows * grid.cellSizeMm, grid.height);
}

for (const type of ["FREE_RESPONSE_SMALL", "FREE_RESPONSE_MEDIUM", "FREE_RESPONSE_LARGE"] as const) {
  const workspace = createStudentWorkspace(type);
  pass(workspace); assert.ok(workspace.width > 0 && workspace.height > 0); assert.equal(workspace.unit, "mm");
}

const coordinate = createStudentWorkspace("COORDINATE_2D");
pass(coordinate); assert.deepEqual(coordinate.xRange, [-10, 10]); assert.deepEqual(coordinate.yRange, [-6, 6]); assert.equal(coordinate.showAxes, true);
pass(createStudentWorkspace("DRAWING_AREA"));

failsWith({ ...createStudentWorkspace("FREE_RESPONSE_SMALL"), solutionContentAllowed: true }, "STUDENT_SOLUTION_FORBIDDEN");
failsWith({ ...createStudentWorkspace("FREE_RESPONSE_SMALL"), answerContentAllowed: true }, "STUDENT_ANSWER_FORBIDDEN");
failsWith({ ...createStudentWorkspace("COORDINATE_2D"), metadata: { solutionGraph: "y=x" } }, "SOLUTION_GEOMETRY_FORBIDDEN");
failsWith({ ...createStudentWorkspace("COORDINATE_2D"), metadata: { shadedSolutionRegion: "x>0" } }, "SOLUTION_GEOMETRY_FORBIDDEN");
failsWith({ ...createStudentWorkspace("COORDINATE_2D"), metadata: { answerAnnotation: "A(1;2)" } }, "SOLUTION_GEOMETRY_FORBIDDEN");
failsWith({ ...createStudentWorkspace("DRAWING_AREA"), metadata: { preSolvedAuxiliaryConstruction: true } }, "SOLUTION_GEOMETRY_FORBIDDEN");

pass(createStudentWorkspace("GRID_MEDIUM"), "TEACHER");
assert.equal(createStudentWorkspace("GRID_MEDIUM").solutionContentAllowed, false);
assert.equal(createStudentWorkspace("GRID_MEDIUM").answerContentAllowed, false);

for (const type of STUDENT_WORKSPACE_TYPES) {
  const original = createStudentWorkspace(type, { source: "synthetic-contract-test" });
  assert.deepEqual(deserializeStudentWorkspace(serializeStudentWorkspace(original)), original);
}

failsWith({ ...STUDENT_WORKSPACE_PRESETS.GRID_SMALL, width: -1 }, "INVALID_DIMENSION");
failsWith({ schemaVersion: "student-workspace/v1", type: "GRID_EXTRA_LARGE" }, "UNKNOWN_WORKSPACE_TYPE");

console.log([
  "WORKSPACE_NONE=PASS",
  "GRID_SMALL_VALID=PASS", "GRID_MEDIUM_VALID=PASS", "GRID_LARGE_VALID=PASS", "GRID_CELL_SIZE_5MM=PASS",
  "FREE_RESPONSE_SMALL=PASS", "FREE_RESPONSE_MEDIUM=PASS", "FREE_RESPONSE_LARGE=PASS",
  "COORDINATE_2D_VALID=PASS", "DRAWING_AREA_VALID=PASS",
  "STUDENT_SOLUTION_FORBIDDEN=PASS", "STUDENT_ANSWER_FORBIDDEN=PASS",
  "SOLUTION_GRAPH_FORBIDDEN=PASS", "SHADED_REGION_FORBIDDEN=PASS", "ANSWER_ANNOTATION_FORBIDDEN=PASS",
  "PRE_SOLVED_AUXILIARY_CONSTRUCTION_FORBIDDEN=PASS", "TEACHER_OUTPUT_COMPATIBILITY=PASS",
  "ANSWER_SOLUTION_ISOLATION_COMPATIBILITY=PASS", "SERIALIZATION_ROUNDTRIP=PASS",
  "INVALID_DIMENSION_REJECTED=PASS", "UNKNOWN_WORKSPACE_TYPE_REJECTED=PASS",
  "NA_DOC_01S_STATUS=PASS",
].join("\n"));
