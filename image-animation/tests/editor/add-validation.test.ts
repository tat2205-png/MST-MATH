import assert from "node:assert/strict";
import {
  applyEditorOperation,
  type EditorOperation,
} from "../../core/editor/index.ts";
import {
  createSceneGraph,
  serializeSceneGraph,
} from "../../core/scene-graph/index.ts";

const graph = createSceneGraph([
  {
    identity: { id: "origin" },
    geometry: { kind: "point", x: 0, y: 0 },
    style: {},
    placement: { layer: 0, order: 0 },
    relations: {},
    metadata: {},
  },
]);
const original = serializeSceneGraph(graph);

const invalidAdds: readonly EditorOperation[] = [
  {
    type: "add",
    node: {
      identity: { id: "invalid-geometry" },
      geometry: { kind: "point", x: Number.NaN, y: 0 },
    },
  } as unknown as EditorOperation,
  {
    type: "add",
    node: {
      identity: { id: "invalid-style" },
      geometry: { kind: "point", x: 1, y: 1 },
      style: { opacity: 2 },
    },
  } as unknown as EditorOperation,
];

for (const operation of invalidAdds) {
  const first = applyEditorOperation(graph, operation);
  const second = applyEditorOperation(graph, operation);

  assert.deepEqual(first, second, "invalid add errors must be deterministic");
  assert.deepEqual(first, {
    ok: false,
    errors: [{
      path: "$.operation.node",
      code: "INVALID_NODE",
      message: "Add requires a valid complete node input.",
    }],
  });
  assert.equal(serializeSceneGraph(graph), original, "invalid add must not mutate its input graph");
}

console.log("Editor add validation tests: PASS");
