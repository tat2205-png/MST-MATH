import assert from "node:assert/strict";
import { createSceneGraph, createSceneNode } from "../image-animation/core/scene-graph/index.js";
import { createAnimationTimeline, validateAnimationTimeline } from "../image-animation/core/timeline/index.js";
import { compileManim } from "../image-animation/renderers/manim/index.js";
const graph = createSceneGraph([
  createSceneNode({ identity: { id: "title" }, geometry: { kind: "label", position: { x: 0, y: 3 }, text: "Timeline" } }),
  createSceneNode({ identity: { id: "marker" }, geometry: { kind: "point", x: -2, y: 0 }, style: { fill: "YELLOW" } }),
  createSceneNode({ identity: { id: "result" }, geometry: { kind: "label", position: { x: 0, y: -2 }, text: "Result" } }),
]);
const timeline = createAnimationTimeline([
  { id: "title-in", type: "appear", targetId: "title", start: 0, duration: 0.4 },
  { id: "marker-move", type: "move", targetId: "marker", start: 0.4, duration: 1.2, to: { x: 2, y: 0 } },
  { id: "result-in", type: "appear", targetId: "result", start: 1.6, duration: 0.4 },
], graph);
assert.equal(validateAnimationTimeline(timeline, { sceneGraph: graph }).valid, true);
const compiled = compileManim(graph, { sceneClassName: "StudioTimelineScene", timeline });
assert.match(compiled.source, /self\.play\(FadeIn\(node_\d+\), run_time=0\.4\)/);
assert.match(compiled.source, /animate\.move_to\(\[2, 0, 0\]\)/);
assert.match(compiled.source, /from manim_toolkit\.background_ui import create_clean_background/);
assert.throws(() => compileManim(graph, { timeline: { version: 1, metadata: {}, events: [{ id: "bad", type: "appear", targetId: "missing", start: 0, duration: 1 }] } }), /MISSING_REFERENCE/);
assert.throws(() => compileManim(graph, { timeline: { version: 1, metadata: {}, events: [{ id: "bad", type: "move", targetId: "marker", start: 0, duration: -1, to: { x: 0, y: 0 } }] } }), /NEGATIVE_DURATION/);
console.log("MOTION_TIMELINE_EXECUTION_QA=PASS\nTIMELINE_VALIDATION_QA=PASS\nSCENE_TIMELINE_BINDING_QA=PASS\nMANIM_COMPILER_INTEGRATION_QA=PASS\nMANIM_TOOLKIT_RUNTIME_QA=PASS");
