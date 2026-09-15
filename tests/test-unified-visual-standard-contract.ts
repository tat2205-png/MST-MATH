import assert from "node:assert/strict";
import {
  AUTHORITY_RESOLUTION_MATRIX,
  AUTOMATION_BOUNDARY,
  CONFLICT_RESOLUTION_POLICY,
  CORE_FAMILY_SEMANTIC_CONTRACTS,
  PEDAGOGICAL_DISCLOSURE_RUBRIC,
  PILOT_PATTERN_CONTRACTS,
  REUSABILITY_MAP,
  UNIFIED_VISUAL_GATES,
  UNIFIED_VISUAL_STANDARD_VERSION,
} from "../src/modules/visual-pedagogy/index.js";

assert.equal(UNIFIED_VISUAL_STANDARD_VERSION, "mst-math-visual/v1");

const truthRule = AUTHORITY_RESOLUTION_MATRIX.find((rule) => rule.conflict === "MATHEMATICAL_TRUTH_vs_ANY");
assert.equal(truthRule?.winner, "MATHEMATICAL_TRUTH");

const curriculumRule = AUTHORITY_RESOLUTION_MATRIX.find((rule) => rule.conflict === "GDPT2018_KNTT_vs_TOOL_DEFAULT");
assert.equal(curriculumRule?.winner, "GDPT2018_KNTT");

assert.equal(PEDAGOGICAL_DISCLOSURE_RUBRIC.GIVEN_ONLY.showTargetOrFinalResult, false);
assert.equal(PEDAGOGICAL_DISCLOSURE_RUBRIC.SCAFFOLDED.showTargetOrFinalResult, false);
assert.equal(PEDAGOGICAL_DISCLOSURE_RUBRIC.EXPLANATORY.showTargetOrFinalResult, true);
assert.equal(PEDAGOGICAL_DISCLOSURE_RUBRIC.FULL_SOLUTION.showTargetOrFinalResult, true);

const graphContract = CORE_FAMILY_SEMANTIC_CONTRACTS.find((contract) => contract.familyId === "COORDINATE_AND_FUNCTION");
assert.ok(graphContract);
assert.ok(graphContract.forbiddenInference.includes("freehand curve approximation"));

const spatialContract = CORE_FAMILY_SEMANTIC_CONTRACTS.find((contract) => contract.familyId === "SPATIAL_GEOMETRY");
assert.ok(spatialContract);
assert.ok(spatialContract.invariants.some((rule) => rule.includes("geometry plus view")));

assert.deepEqual(UNIFIED_VISUAL_GATES.map((gate) => gate.id), ["G0", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9"]);
assert.equal(CONFLICT_RESOLUTION_POLICY.rootCauseRule, "Fix the earliest failed gate before downstream gates.");

assert.deepEqual(PILOT_PATTERN_CONTRACTS.map((pattern) => pattern.id), ["TRIANGLE", "FUNCTION_GRAPH", "SPATIAL_LINE_PLANE"]);
assert.ok(REUSABILITY_MAP.some((policy) => policy.primitive === "AXIS"));
assert.ok(REUSABILITY_MAP.some((policy) => policy.primitive === "LABEL"));

const geometryBoundary = AUTOMATION_BOUNDARY.find((rule) => rule.layer === "GEOMETRY_CONSTRUCTION");
assert.ok(geometryBoundary);
assert.ok(geometryBoundary.forbidden.includes("choose hidden edges by appearance"));

console.log("UNIFIED_VISUAL_STANDARD_CONTRACT_PASS");
