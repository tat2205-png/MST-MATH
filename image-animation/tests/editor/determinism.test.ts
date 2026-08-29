import assert from "node:assert/strict";
import {
  applyEditorOperation,
  applyEditorOperations,
  type EditorOperation,
} from "../../core/editor/index.ts";
import {
  createSceneGraph,
  serializeSceneGraph,
  validateSceneGraph,
} from "../../core/scene-graph/index.ts";

const graph = createSceneGraph([
  {
    identity: { id: "point" },
    geometry: { kind: "point", x: 2, y: 3 },
    style: { fill: "#fff" },
    placement: { layer: 0, order: 0 },
    relations: {},
    metadata: { source: "test" },
  },
]);

const original = serializeSceneGraph(graph);
const originalGeometry = graph.nodes[0].geometry;

const missingGeometry = applyEditorOperation(graph, {
  type: "add",
  node: { identity: { id: "missing-geometry" } },
} as EditorOperation);
assert.deepEqual(missingGeometry, {
  ok: false,
  errors: [{
    path: "$.operation.node.geometry",
    code: "GEOMETRY_REQUIRED",
    message: "Add requires explicit geometry.",
  }],
});

const invalidGeometryOperation = {
  type: "add",
  node: {
    identity: { id: "invalid-geometry" },
    geometry: { kind: "point", x: Number.NaN, y: 0 },
  },
} as unknown as EditorOperation;
const invalidGeometryFirst = applyEditorOperation(graph, invalidGeometryOperation);
const invalidGeometrySecond = applyEditorOperation(graph, invalidGeometryOperation);
assert.deepEqual(invalidGeometryFirst, invalidGeometrySecond);
assert.equal(invalidGeometryFirst.ok, false);
if (invalidGeometryFirst.ok) throw new Error("invalid geometry unexpectedly succeeded");
assert.equal(invalidGeometryFirst.errors[0].code, "INVALID_NODE");

const nonGeometricOperations: readonly EditorOperation[] = [
  { type: "edit", id: "point", style: { opacity: 0.25 } },
  { type: "rename", id: "point", name: "renamed" },
  { type: "layer", id: "point", layer: 4, order: 7 },
  { type: "relation", id: "point", references: [] },
  { type: "lock", id: "point" },
  { type: "unlock", id: "point" },
];

const nonGeometricResult = applyEditorOperations(graph, nonGeometricOperations);
assert.equal(nonGeometricResult.ok, true);
if (!nonGeometricResult.ok) throw new Error("non-geometric operations unexpectedly failed");
assert.equal(validateSceneGraph(nonGeometricResult.graph).valid, true);
assert.deepEqual(nonGeometricResult.graph.nodes[0].geometry, originalGeometry);
assert.equal(serializeSceneGraph(graph), original, "operations must not mutate their input graph");

const deterministicFailureOperations: readonly EditorOperation[] = [
  { type: "rename", id: "point", name: "temporary" },
  { type: "relation", id: "point", parent: "missing" },
];
const batchFailureFirst = applyEditorOperations(graph, deterministicFailureOperations);
const batchFailureSecond = applyEditorOperations(graph, deterministicFailureOperations);
assert.deepEqual(batchFailureFirst, batchFailureSecond);
assert.deepEqual(batchFailureFirst, {
  ok: false,
  errors: [{
    path: "$.operations[1]",
    code: "INVALID_RESULT_GRAPH",
    message: "The operation would produce an invalid scene graph.",
  }],
});
assert.equal(serializeSceneGraph(graph), original, "failed batches must not mutate their input graph");

const deleteResult = applyEditorOperation(graph, { type: "delete", id: "point" });
assert.equal(deleteResult.ok, true);
if (!deleteResult.ok) throw new Error("delete unexpectedly failed");
assert.equal(deleteResult.graph.nodes.length, 0);
assert.equal(validateSceneGraph(deleteResult.graph).valid, true);
assert.equal(serializeSceneGraph(graph), original);

console.log("Editor determinism tests: PASS");
