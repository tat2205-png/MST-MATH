import assert from "node:assert/strict";
import {
  EDITOR_LOCKS_METADATA_KEY,
  applyEditorOperation,
  applyEditorOperations,
  type EditorOperation,
} from "../../core/editor/index.ts";
import {
  createSceneGraph,
  serializeSceneGraph,
  validateSceneGraph,
} from "../../core/scene-graph/index.ts";

const initial = createSceneGraph([
  {
    identity: { id: "A", name: "Point A" },
    geometry: { kind: "point", x: 0, y: 0 },
    style: {},
    placement: { layer: 0, order: 0 },
    relations: {},
    metadata: {},
  },
  {
    identity: { id: "B" },
    geometry: { kind: "point", x: 4, y: 0 },
    style: {},
    placement: { layer: 0, order: 1 },
    relations: {},
    metadata: {},
  },
]);

const operations: readonly EditorOperation[] = [
  {
    type: "add",
    node: {
      identity: { id: "AB", name: "Segment AB" },
      geometry: { kind: "segment", start: { x: 0, y: 0 }, end: { x: 4, y: 0 } },
      placement: { layer: 1, order: 0 },
    },
  },
  { type: "edit", id: "AB", style: { stroke: "#000", strokeWidth: 2 } },
  { type: "rename", id: "A", name: "Origin" },
  { type: "layer", id: "B", layer: 2, order: 3 },
  { type: "relation", id: "AB", parent: "A", references: ["A", "B"] },
];

const edited = applyEditorOperations(initial, operations);
assert.equal(edited.ok, true);
if (!edited.ok) throw new Error("expected successful edit sequence");
assert.equal(validateSceneGraph(edited.graph).valid, true);
assert.equal(edited.graph.nodes.find((node) => node.identity.id === "A")?.identity.name, "Origin");
assert.deepEqual(edited.graph.nodes.find((node) => node.identity.id === "B")?.placement, { layer: 2, order: 3 });
const segment = edited.graph.nodes.find((node) => node.identity.id === "AB");
assert.deepEqual(segment?.geometry, { kind: "segment", start: { x: 0, y: 0 }, end: { x: 4, y: 0 } });
assert.deepEqual(segment?.relations, { parent: "A", references: ["A", "B"] });
assert.deepEqual(segment?.style, { stroke: "#000", strokeWidth: 2 });

const repeated = applyEditorOperations(initial, operations);
assert.equal(repeated.ok, true);
if (!repeated.ok) throw new Error("expected deterministic result");
assert.equal(serializeSceneGraph(repeated.graph), serializeSceneGraph(edited.graph));

const locked = applyEditorOperation(edited.graph, { type: "lock", id: "AB" });
assert.equal(locked.ok, true);
if (!locked.ok) throw new Error("expected lock success");
assert.deepEqual(locked.graph.metadata[EDITOR_LOCKS_METADATA_KEY], ["AB"]);

for (const operation of [
  { type: "edit", id: "AB", geometry: { kind: "segment", start: { x: 1, y: 1 }, end: { x: 2, y: 2 } } },
  { type: "rename", id: "AB", name: "changed" },
  { type: "layer", id: "AB", layer: 9, order: 9 },
  { type: "relation", id: "AB", parent: null },
  { type: "delete", id: "AB" },
] as const) {
  const beforeRejection = serializeSceneGraph(locked.graph);
  const rejected = applyEditorOperation(locked.graph, operation);
  assert.equal(rejected.ok, false);
  if (rejected.ok) throw new Error("locked operation unexpectedly succeeded");
  assert.equal(rejected.errors[0].code, "NODE_LOCKED");
  assert.equal(serializeSceneGraph(locked.graph), beforeRejection, "rejection does not mutate input");
}

const unlocked = applyEditorOperation(locked.graph, { type: "unlock", id: "AB" });
assert.equal(unlocked.ok, true);
if (!unlocked.ok) throw new Error("expected unlock success");
assert.equal(unlocked.graph.metadata[EDITOR_LOCKS_METADATA_KEY], undefined);

const clearRelations = applyEditorOperation(unlocked.graph, {
  type: "relation",
  id: "AB",
  parent: null,
  references: null,
});
assert.equal(clearRelations.ok, true);
if (!clearRelations.ok) throw new Error("expected relation clear success");
assert.deepEqual(clearRelations.graph.nodes.find((node) => node.identity.id === "AB")?.relations, {});

const deleted = applyEditorOperation(clearRelations.graph, { type: "delete", id: "AB" });
assert.equal(deleted.ok, true);
if (!deleted.ok) throw new Error("expected delete success");
assert.equal(deleted.graph.nodes.some((node) => node.identity.id === "AB"), false);
assert.equal(validateSceneGraph(deleted.graph).valid, true);

const referencedDelete = applyEditorOperation(edited.graph, { type: "delete", id: "A" });
assert.equal(referencedDelete.ok, false);
if (referencedDelete.ok) throw new Error("referenced delete unexpectedly succeeded");
assert.deepEqual(referencedDelete.errors, [{
  path: "$.operation.id",
  code: "NODE_REFERENCED",
  message: "Node is referenced by: AB",
}]);

const geometryBefore = edited.graph.nodes.find((node) => node.identity.id === "AB")?.geometry;
const styleOnly = applyEditorOperation(edited.graph, { type: "edit", id: "AB", style: { opacity: 0.5 } });
assert.equal(styleOnly.ok, true);
if (!styleOnly.ok) throw new Error("expected style edit success");
assert.deepEqual(styleOnly.graph.nodes.find((node) => node.identity.id === "AB")?.geometry, geometryBefore, "style edit never invents geometry");

const failures: Array<[EditorOperation, string]> = [
  [{ type: "add", node: { identity: { id: "A" }, geometry: { kind: "point", x: 1, y: 1 } } }, "DUPLICATE_ID"],
  [{ type: "edit", id: "missing", style: {} }, "NODE_NOT_FOUND"],
  [{ type: "edit", id: "A" }, "EMPTY_EDIT"],
  [{ type: "layer", id: "A", layer: 1.5, order: 0 }, "INVALID_PLACEMENT"],
  [{ type: "relation", id: "A", parent: "missing" }, "INVALID_RESULT_GRAPH"],
  [{ type: "lock", id: "missing" }, "NODE_NOT_FOUND"],
  [{ type: "unlock", id: "A" }, "NOT_LOCKED"],
];

for (const [operation, code] of failures) {
  const first = applyEditorOperation(initial, operation);
  const second = applyEditorOperation(initial, operation);
  assert.deepEqual(first, second, `error for ${operation.type} is deterministic`);
  assert.equal(first.ok, false);
  if (first.ok) throw new Error("invalid operation unexpectedly succeeded");
  assert.equal(first.errors[0].code, code);
}

const batchFailure = applyEditorOperations(initial, [
  { type: "rename", id: "A", name: "renamed" },
  { type: "delete", id: "missing" },
]);
assert.deepEqual(batchFailure, {
  ok: false,
  errors: [{
    path: "$.operations[1].id",
    code: "NODE_NOT_FOUND",
    message: "Node does not exist: missing",
  }],
});
assert.equal(initial.nodes.find((node) => node.identity.id === "A")?.identity.name, "Point A", "batch failure does not mutate its input");

const invalidLockState = createSceneGraph(initial.nodes, { [EDITOR_LOCKS_METADATA_KEY]: ["missing"] });
const invalidLockResult = applyEditorOperation(invalidLockState, { type: "rename", id: "A", name: "x" });
assert.equal(invalidLockResult.ok, false);
if (invalidLockResult.ok) throw new Error("invalid lock state unexpectedly succeeded");
assert.equal(invalidLockResult.errors[0].code, "INVALID_LOCK_STATE");

console.log("Editor tests: PASS");
