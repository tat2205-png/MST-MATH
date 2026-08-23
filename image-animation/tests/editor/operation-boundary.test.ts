import assert from "node:assert/strict";
import {
  applyEditorOperation,
  applyEditorOperations,
  type EditorOperation,
} from "../../core/editor/index.ts";
import {
  createSceneGraph,
  serializeSceneGraph,
} from "../../core/scene-graph/index.ts";

const graph = createSceneGraph([
  {
    identity: { id: "point" },
    geometry: { kind: "point", x: 0, y: 0 },
    style: {},
    placement: { layer: 0, order: 0 },
    relations: {},
    metadata: {},
  },
]);
const original = serializeSceneGraph(graph);

const malformedOperations: readonly unknown[] = [
  null,
  undefined,
  [],
  {},
  { type: 1 },
  { type: "unsupported" },
];

for (const malformed of malformedOperations) {
  const operation = malformed as EditorOperation;
  const first = applyEditorOperation(graph, operation);
  const second = applyEditorOperation(graph, operation);

  assert.deepEqual(first, second, "malformed operation errors must be deterministic");
  assert.deepEqual(first, {
    ok: false,
    errors: [{
      path: "$.operation",
      code: "INVALID_OPERATION",
      message: "Editor operation must have a supported type.",
    }],
  });
  assert.equal(serializeSceneGraph(graph), original, "malformed operations must not mutate the graph");
}

for (const malformedNode of [null, [], {}, { geometry: null }]) {
  const operation = { type: "add", node: malformedNode } as unknown as EditorOperation;
  const first = applyEditorOperation(graph, operation);
  const second = applyEditorOperation(graph, operation);

  assert.deepEqual(first, second, "malformed add errors must be deterministic");
  assert.deepEqual(first, {
    ok: false,
    errors: [{
      path: "$.operation.node.geometry",
      code: "GEOMETRY_REQUIRED",
      message: "Add requires explicit geometry.",
    }],
  });
  assert.equal(serializeSceneGraph(graph), original, "malformed adds must not mutate the graph");
}

const invalidId = applyEditorOperation(graph, {
  type: "rename",
  id: "",
  name: "renamed",
} as EditorOperation);
assert.deepEqual(invalidId, {
  ok: false,
  errors: [{
    path: "$.operation.id",
    code: "INVALID_ID",
    message: "Node ID must be a non-empty string.",
  }],
});

const invalidBatch = applyEditorOperations(graph, null as unknown as readonly EditorOperation[]);
assert.deepEqual(invalidBatch, {
  ok: false,
  errors: [{
    path: "$.operations",
    code: "INVALID_OPERATIONS",
    message: "Editor operations must be an array.",
  }],
});

const malformedBatchItem = applyEditorOperations(graph, [
  { type: "rename", id: "point", name: "temporary" },
  null as unknown as EditorOperation,
]);
assert.deepEqual(malformedBatchItem, {
  ok: false,
  errors: [{
    path: "$.operations[1]",
    code: "INVALID_OPERATION",
    message: "Editor operation must have a supported type.",
  }],
});
assert.equal(serializeSceneGraph(graph), original, "failed batches must not mutate the input graph");

const missingEditedGeometry = applyEditorOperation(graph, {
  type: "edit",
  id: "point",
  geometry: undefined,
});
assert.deepEqual(missingEditedGeometry, {
  ok: false,
  errors: [{
    path: "$.operation.geometry",
    code: "GEOMETRY_REQUIRED",
    message: "Geometry cannot be removed or inferred.",
  }],
});
assert.equal(serializeSceneGraph(graph), original);

console.log("Editor operation boundary tests: PASS");
