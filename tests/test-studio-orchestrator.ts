import assert from "node:assert/strict";

import { StudioEngineRegistry } from "../server/studio/engineRegistry.js";
import { StudioOrchestrator } from "../server/studio/studioOrchestrator.js";

const registry = new StudioEngineRegistry();
const orchestrator = new StudioOrchestrator(registry);

const defaultStatus = registry.getCapabilityStatus("math.solve");
assert.equal(defaultStatus, "AVAILABLE");
assert.equal(registry.getCapabilityStatus("geometry.luadraw"), "AVAILABLE");
assert.equal(registry.getCapabilityStatus("animation.depth25d"), "OPTIONAL_RUNTIME_MISSING");

process.env.STUDIO_ORCHESTRATOR_V1 = "true";
const manimPlan = orchestrator.plan({
  intent: "Create a visual explanation of a 3-4-5 right triangle.",
  taskType: "geometry",
  geometryType: "RIGHT_TRIANGLE",
  outputFormat: "mp4",
});
assert.equal(manimPlan.routeId, "MANIM");
assert.ok(manimPlan.selectedCapabilities.includes("geometry.2d"));
assert.ok(manimPlan.selectedCapabilities.includes("visual.manim"));
assert.ok(manimPlan.selectedCapabilities.includes("render.video"));
assert.equal(manimPlan.steps.some((step) => step.capability === "visual.manim"), true);

const luadrawPlan = orchestrator.plan({
  intent: "Create a cube net diagram.",
  taskType: "geometry",
  geometryType: "POLYHEDRON_NET",
  outputFormat: "mp4",
});
assert.equal(luadrawPlan.routeId, "LUADRAW");
assert.ok(luadrawPlan.selectedCapabilities.includes("geometry.luadraw"));
assert.ok(luadrawPlan.selectedCapabilities.includes("render.video"));
assert.equal(luadrawPlan.steps.some((step) => step.capability === "geometry.luadraw"), true);

const disabledOrchestrator = new StudioOrchestrator();
process.env.STUDIO_ORCHESTRATOR_V1 = "false";
const disabledPlan = disabledOrchestrator.plan({ intent: "Any request" });
assert.equal(disabledPlan.featureEnabled, false);
assert.equal(disabledPlan.routeId, "UNKNOWN");

console.log("STUDIO_ORCHESTRATOR_QA=PASS");
console.log("STUDIO_ROUTING_QA=PASS");
console.log("STUDIO_MANIM_CANARY_QA=PASS");
console.log("STUDIO_LUADRAW_ROUTING_QA=PASS");
