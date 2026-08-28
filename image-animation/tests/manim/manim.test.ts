import assert from "node:assert/strict";
import {
  createSceneGraph,
  createSceneNode,
  type SceneNodeInput,
} from "../../core/scene-graph/index.ts";
import {
  compileManim,
  ManimCompileError,
} from "../../renderers/manim/index.ts";

const nodes: SceneNodeInput[] = [
  { identity: { id: "point" }, geometry: { kind: "point", x: -2, y: 1 }, style: { fill: "#ff0000" }, placement: { layer: 1, order: 0 } },
  { identity: { id: "segment" }, geometry: { kind: "segment", start: { x: -1, y: -1 }, end: { x: 1, y: 1 } }, style: { stroke: "BLUE", strokeWidth: 3 } },
  { identity: { id: "polyline" }, geometry: { kind: "polyline", points: [{ x: -2, y: 0 }, { x: 0, y: 2 }, { x: 2, y: 0 }] }, style: { opacity: 0.75 } },
  { identity: { id: "polygon" }, geometry: { kind: "polygon", points: [{ x: -1, y: -1 }, { x: 1, y: -1 }, { x: 0, y: 1 }] }, style: { fill: "GREEN", stroke: "WHITE" } },
  { identity: { id: "circle" }, geometry: { kind: "circle", center: { x: 2, y: 0 }, radius: 0.5 } },
  { identity: { id: "label" }, geometry: { kind: "label", position: { x: 0, y: 2.5 }, text: 'A "quoted" label', anchor: "start" }, style: { fontFamily: "Arial", fontSize: 30, fontWeight: 700 } },
  { identity: { id: "arrow" }, geometry: { kind: "arrow", start: { x: -2, y: -2 }, end: { x: 2, y: -2 }, headLength: 0.25, headWidth: 0.2 } },
  { identity: { id: "image" }, geometry: { kind: "image_layer", position: { x: 0, y: 0 }, width: 3, height: 2, source: "assets/diagram.png" }, style: { visible: false }, placement: { layer: -1, order: 0 } },
];

const graph = createSceneGraph(nodes.map(createSceneNode), { approved: true });
const first = compileManim(graph, { sceneClassName: "GeometryScene" });
const second = compileManim(graph, { sceneClassName: "GeometryScene" });
assert.deepEqual(second, first, "identical approved graphs compile byte-for-byte");
assert.equal(first.source.endsWith("\n"), true);
assert.match(first.source, /class GeometryScene\(Scene\):/);
assert.deepEqual(first.nodeOrder, ["image", "arrow", "circle", "label", "polygon", "polyline", "segment", "point"]);

for (const token of [
  "Dot(point=[-2, 1, 0])",
  "Line(start=[-1, -1, 0], end=[1, 1, 0])",
  "VMobject().set_points_as_corners([[-2, 0, 0], [0, 2, 0], [2, 0, 0]])",
  "Polygon([-1, -1, 0], [1, -1, 0], [0, 1, 0])",
  "Circle(radius=0.5).move_to([2, 0, 0])",
  '_place_label(Text("A \\"quoted\\" label", font="Arial", font_size=30, weight="700"), [0, 2.5, 0], "start")',
  "_set_arrow_tip_width(Arrow(start=[-2, -2, 0], end=[2, -2, 0], buff=0, tip_length=0.25), 0.2)",
  "ImageMobject(\"assets/diagram.png\").stretch_to_fit_width(3).stretch_to_fit_height(2).move_to([0, 0, 0])",
  ".set_stroke(color=\"BLUE\", width=3)",
  ".set_fill(color=\"GREEN\", opacity=1)",
  ".set_opacity(0)",
]) {
  assert.ok(first.source.includes(token), `expected exact Manim token: ${token}`);
}

const reversed = createSceneGraph([...graph.nodes].reverse(), graph.metadata);
assert.deepEqual(
  compileManim(reversed, { sceneClassName: "GeometryScene" }),
  first,
  "input ordering cannot change canonical output",
);

const moved = createSceneGraph([
  createSceneNode({ identity: { id: "p" }, geometry: { kind: "point", x: 1.125, y: -2.25 } }),
]);
assert.match(
  compileManim(moved).source,
  /Dot\(point=\[1\.125, -2\.25, 0\]\)/,
  "compiler copies source coordinates without scaling or reinterpretation",
);

const outside = createSceneGraph([
  createSceneNode({ identity: { id: "z-outside" }, geometry: { kind: "circle", center: { x: 4.75, y: 0 }, radius: 0.5 } }),
  createSceneNode({ identity: { id: "a-outside" }, geometry: { kind: "point", x: -5, y: 0 } }),
]);
assert.throws(
  () => compileManim(outside, { layout: { frameWidth: 10, frameHeight: 8, margin: 0.25 } }),
  (error: unknown) => {
    assert.ok(error instanceof ManimCompileError);
    assert.deepEqual(error.issues.map((issue) => issue.nodeId), ["a-outside", "z-outside"]);
    assert.ok(error.issues.every((issue) => issue.code === "OUTSIDE_FRAME"));
    return true;
  },
  "layout guard fails closed and reports canonical node order",
);

const hiddenOutside = createSceneGraph([
  createSceneNode({ identity: { id: "hidden" }, geometry: { kind: "point", x: 100, y: 100 }, style: { visible: false } }),
]);
assert.doesNotThrow(() => compileManim(hiddenOutside), "invisible geometry cannot cause a visual overflow");

assert.throws(() => compileManim(graph, { sceneClassName: "bad-name" }), /valid Python identifier/);
assert.throws(() => compileManim(graph, { layout: { frameWidth: 0 } }), /positive finite number/);
assert.throws(() => compileManim(graph, { layout: { margin: -1 } }), /non-negative finite number/);

const empty = compileManim(createSceneGraph([]));
assert.match(empty.source, /def construct\(self\):\n        self\.add\(create_clean_background\(\)\)\n        pass\n$/);

console.log("Manim compiler tests: PASS");
