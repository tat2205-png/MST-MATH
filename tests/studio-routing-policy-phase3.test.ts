import assert from "node:assert/strict";
import { planStudioTask } from "../server/studio/capabilityPlanner.js";

const cases = [
  ["geometry.visualize", "geometry.2d", "studio.manim"],
  ["geometry.visualize", "geometry.luadraw", "studio.luadraw"],
  ["animation.scene", "animation.manim", "studio.manim"],
  ["animation.scene", "animation.image", "studio.image-animation"],
] as const;
for (const [task, capability, component] of cases) {
  const plan = planStudioTask({ task, input: { fixture: "triangle_area" }, requestedCapabilities: [capability] });
  assert.equal(plan.steps[0].component, component);
}
console.log("STUDIO_ROUTING_POLICY_QA=PASS");
