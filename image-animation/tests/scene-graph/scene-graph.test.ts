import assert from "node:assert/strict";
import {
  createSceneGraph,
  createSceneNode,
  createStableId,
  deserializeSceneGraph,
  serializeSceneGraph,
  validateSceneGraph,
  type SceneNodeInput,
} from "../../core/scene-graph/index.ts";

const inputs: SceneNodeInput[] = [
  { geometry: { kind: "point", x: 1, y: 2 }, identity: { name: "A" }, placement: { layer: 2, order: 0 } },
  { geometry: { kind: "segment", start: { x: 0, y: 0 }, end: { x: 1, y: 1 } }, placement: { layer: 1, order: 1 } },
  { geometry: { kind: "polyline", points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] } },
  { geometry: { kind: "polygon", points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }] } },
  { geometry: { kind: "circle", center: { x: 2, y: 2 }, radius: 3 } },
  { geometry: { kind: "label", position: { x: 1, y: 1 }, text: "hello", anchor: "middle" } },
  { geometry: { kind: "arrow", start: { x: 0, y: 0 }, end: { x: 4, y: 5 }, headLength: 1 } },
  { geometry: { kind: "image_layer", position: { x: 0, y: 0 }, width: 640, height: 480, source: "fixture.png" } },
];

const nodes = inputs.map(createSceneNode);
assert.deepEqual(nodes.map((node) => node.geometry.kind), ["point", "segment", "polyline", "polygon", "circle", "label", "arrow", "image_layer"]);

const reorderedInput: SceneNodeInput = {
  metadata: { z: 2, a: 1 },
  style: { fill: "red", opacity: 0.5 },
  geometry: { y: 2, kind: "point", x: 1 },
  identity: { name: "A" },
  placement: { order: 0, layer: 2 },
};
assert.equal(createStableId(inputs[0]), createStableId(reorderedInput), "stable IDs ignore object key insertion order");
assert.equal(createSceneNode(inputs[0]).identity.id, createSceneNode(inputs[0]).identity.id, "stable IDs repeat exactly");
assert.notEqual(createStableId(inputs[0]), createStableId({ ...inputs[0], geometry: { kind: "point", x: 2, y: 2 } }), "geometry changes identity seed");

const graph = createSceneGraph(nodes, { title: "fixture", nested: { z: true, a: false } });
assert.equal(validateSceneGraph(graph).valid, true);
for (let index = 1; index < graph.nodes.length; index += 1) {
  const previous = graph.nodes[index - 1];
  const current = graph.nodes[index];
  assert.ok(
    previous.placement.layer < current.placement.layer ||
      (previous.placement.layer === current.placement.layer && previous.placement.order < current.placement.order) ||
      (previous.placement.layer === current.placement.layer && previous.placement.order === current.placement.order && previous.identity.id.localeCompare(current.identity.id, "en") <= 0),
    "nodes use deterministic layer/order/ID ordering",
  );
}

const serialized = serializeSceneGraph(graph);
assert.equal(serializeSceneGraph(deserializeSceneGraph(serialized)), serialized, "serialization round-trips byte-for-byte");
assert.equal(serializeSceneGraph(createSceneGraph([...nodes].reverse(), { nested: { a: false, z: true }, title: "fixture" })), serialized, "input and key order do not affect serialization");

const parent = createSceneNode({ identity: { id: "parent" }, geometry: { kind: "point", x: 0, y: 0 } });
const child = createSceneNode({ identity: { id: "child" }, geometry: { kind: "label", position: { x: 0, y: 0 }, text: "child" }, relations: { parent: "parent", references: ["parent"] } });
assert.equal(validateSceneGraph(createSceneGraph([child, parent])).valid, true, "valid relations resolve regardless of input order");

const duplicate = { version: 1, metadata: {}, nodes: [parent, parent] };
assert.ok(validateSceneGraph(duplicate).issues.some((issue) => issue.code === "DUPLICATE_ID"));

const missingReference = { version: 1, metadata: {}, nodes: [{ ...child, relations: { parent: "missing" } }] };
assert.ok(validateSceneGraph(missingReference).issues.some((issue) => issue.code === "MISSING_REFERENCE"));

const invalidGeometry = { version: 1, metadata: {}, nodes: [{ ...parent, geometry: { kind: "circle", center: { x: 0, y: 0 }, radius: 0 } }] };
assert.ok(validateSceneGraph(invalidGeometry).issues.some((issue) => issue.code === "INVALID_RADIUS"));

const mixedAnimation = { version: 1, metadata: {}, nodes: [{ ...parent, animation: { duration: 1 } }] };
assert.ok(validateSceneGraph(mixedAnimation).issues.some((issue) => issue.code === "ANIMATION_NOT_ALLOWED"), "animation remains outside geometry and scene nodes");

assert.throws(() => deserializeSceneGraph("{\"version\":2,\"nodes\":[],\"metadata\":{}}"), /INVALID_VERSION/);
console.log("Scene Graph tests: PASS");
