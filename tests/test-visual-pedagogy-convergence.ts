import assert from "node:assert/strict";
import type { MathScene } from "../src/modules/math-ir/index.js";
import { VISUAL_PEDAGOGY_GOLDEN_CORPUS, VISUAL_SEMANTIC_SCHEMA_VERSION, compareRendererSemantics, constructTangentsFromExternalPoint, createMotionPlan, createPedagogicalPlan, createTransitionGraph, rendererInputGate, validateLayout, validateVisualSemanticModel, type VisualSemanticModel } from "../src/modules/visual-pedagogy/index.js";

const source: MathScene = {
  id: "tangent-source", name: "External tangents", dimension: "2d",
  expressions: [{ id: "radius", normalized: "3" }],
  entities: [
    { id: "A", type: "point", label: "A", semanticCoordinate: { dimension: "2d", x: 0, y: 0 } },
    { id: "B", type: "point", label: "B", semanticCoordinate: { dimension: "2d", x: 5, y: 0 } },
    { id: "circle-A", type: "circle", centerPointId: "A", radiusExpressionId: "radius" },
  ], constraints: [],
};
const constructed = constructTangentsFromExternalPoint(source, "circle-A", "B");
assert.equal(constructed.status, "PASS");
const scene = constructed.scene!;
const points = new Map(scene.entities.filter((entity) => entity.type === "point").map((entity) => [entity.id, entity.semanticCoordinate]));
for (const id of ["C", "D"]) {
  const point = points.get(id)!;
  assert.equal(point.dimension, "2d");
  if (point.dimension === "2d") {
    assert.ok(Math.abs(Math.hypot(point.x, point.y) - 3) < 1e-10, `${id} must lie on the circle`);
    assert.ok(Math.abs(point.x * (5 - point.x) + point.y * (0 - point.y)) < 1e-10, `${id} radius must be perpendicular to tangent`);
  }
}
const c = points.get("C")!, d = points.get("D")!;
if (c.dimension === "2d" && d.dimension === "2d") assert.ok(Math.abs(Math.hypot(5-c.x,c.y)-Math.hypot(5-d.x,d.y)) < 1e-10);

const model: VisualSemanticModel = {
  schemaVersion: VISUAL_SEMANTIC_SCHEMA_VERSION, id: "visual:tangent", sourceSceneId: scene.id,
  entities: ["A", "B", "C", "D", "circle-A"].map((id) => ({ id: `visual:${id}`, mathEntityId: id, objectRole: id === "C" || id === "D" ? "construction" : "primary", visible: true, provenance: { sourceMathEntityId: id, origin: id === "C" || id === "D" ? "derived" : "source" } })),
  relations: scene.constraints.filter((constraint) => constraint.type === "tangent").map((constraint) => ({ id: `visual:${constraint.id}`, sourceConstraintId: constraint.id, relationType: "tangent", marker: "tangent", entityIds: constraint.entityIds, provenance: { sourceRelationId: constraint.id, validation: "validated" } })),
  validation: { status: "PASS", mathIrValidated: true },
};
assert.equal(validateVisualSemanticModel(model, scene).status, "PASS");
assert.equal(rendererInputGate(model, scene).renderAllowed, true);
assert.equal(rendererInputGate({ ...model, entities: [{ ...model.entities[0], mathEntityId: "missing" }] }, scene).renderAllowed, false);
const snapshot = { entityIds: model.entities.map((item) => item.mathEntityId), relationIds: model.relations.map((item) => item.id), visibleEntityIds: model.entities.map((item) => item.mathEntityId) };
assert.equal(compareRendererSemantics(model, [{ renderer: "svg", ...snapshot }, { renderer: "tikz", ...snapshot }]).status, "PASS");

assert.equal(validateLayout([{ id: "title", x: 72, y: 72, width: 936, height: 100, fontSizePx: 42, kind: "text" }, { id: "math", x: 72, y: 240, width: 936, height: 500, fontSizePx: 36, kind: "formula" }], { width: 1080, height: 1920, safeMargin: 72, mobile: true }).status, "PASS");
assert.equal(validateLayout([{ id: "tiny", x: 0, y: 0, width: 100, height: 100, fontSizePx: 12, kind: "text" }], { width: 1080, height: 1920, safeMargin: 72, mobile: true }).status, "FAIL");

const transitions = createTransitionGraph("graph:1", ["expr:9", "expr:3^2"], [{ id: "transition:1", fromExpressionId: "expr:9", toExpressionId: "expr:3^2", type: "rewrite_as_power", sourceStepId: "step:1", verified: true }]);
assert.equal(createMotionPlan("motion:1", transitions).actions[0].intent, "MATH_REWRITE");
assert.equal(createPedagogicalPlan("proof:1", "PROOF", [{ stage: "HYPOTHESIS", sourceIds: ["step:1"] }, { stage: "CONCLUSION", sourceIds: ["step:2"] }]).validation.status, "PASS");
assert.equal(VISUAL_PEDAGOGY_GOLDEN_CORPUS.length, 10);
console.log("VC_VISUAL_PEDAGOGY_CONVERGENCE=PASS");
