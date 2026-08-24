import assert from "node:assert/strict";
import { planStudioTask } from "../server/studio/capabilityPlanner.js";
import { validateStudioTaskRequest } from "../server/studio/taskValidation.js";

const geometry = planStudioTask({ task: "geometry.visualize", input: { fixture: "triangle_area" }, requestedCapabilities: ["geometry.2d"] });
assert.deepEqual(geometry.steps.map((step) => [step.capability, step.component]), [["geometry.2d", "studio.manim"]]);
const video = planStudioTask({ task: "video.plan", input: { fixture: "triangle_area" }, requestedCapabilities: ["video.plan", "geometry.2d", "math.solve"] });
assert.deepEqual(video.steps.map((step) => step.capability), ["math.solve", "geometry.2d", "video.plan"]);
assert.throws(() => validateStudioTaskRequest({ task: "math.solve", input: { fixture: "linear_equation" }, requestedCapabilities: ["geometry.2d"] }));
assert.throws(() => validateStudioTaskRequest({ task: "math.solve", input: { fixture: "linear_equation", path: "C:\\unsafe" }, requestedCapabilities: ["math.solve"] }));
console.log("STUDIO_CAPABILITY_PLANNER_QA=PASS");
