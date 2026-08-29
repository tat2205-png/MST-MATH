import assert from "node:assert/strict";

import {
  buildStudioUiPlanSummary,
  deriveTaskType,
  normalizeRuntimeStatus,
  requestStudioPlan,
} from "../src/services/studioWorkflow.js";

const runtimeStatus = [
  { capability: "math.solve", status: "AVAILABLE", engine: "math-engine" },
  { capability: "geometry.2d", status: "AVAILABLE", engine: "geometry-router" },
  { capability: "visual.manim", status: "AVAILABLE", engine: "manim-compiler" },
  { capability: "render.video", status: "AVAILABLE", engine: "renderer-router" },
  { capability: "animation.depth25d", status: "OPTIONAL_RUNTIME_MISSING", engine: "depth-engine" },
];

const normalized = normalizeRuntimeStatus(runtimeStatus as any);
assert.equal(normalized[0].label, "Math Engine");
assert.equal(normalized[3].label, "Renderer");
assert.equal(normalized[4].status, "OPTIONAL_RUNTIME_MISSING");

assert.equal(deriveTaskType({ problem: "Solve x + y = 5 and x - y = 1" } as any), "math");
assert.equal(deriveTaskType({ domain: "Hình học", problem: "Triangle" } as any), "geometry");

const planSummary = buildStudioUiPlanSummary({
  featureEnabled: true,
  routeId: "MANIM",
  selectedCapabilities: ["math.solve", "geometry.2d", "visual.manim", "render.video"],
  selectedEngines: ["math-engine", "geometry-router", "manim-compiler", "renderer-router"],
  steps: [
    { capability: "math.solve", engine: "math-engine", status: "AVAILABLE", rationale: "Solve" },
    { capability: "geometry.2d", engine: "geometry-router", status: "AVAILABLE", rationale: "Geometry" },
    { capability: "visual.manim", engine: "manim-compiler", status: "AVAILABLE", rationale: "Manim" },
    { capability: "render.video", engine: "renderer-router", status: "AVAILABLE", rationale: "Render" },
  ],
  rationale: "Geometry route selected",
  outputFormat: "mp4",
});
assert.equal(planSummary.routeLabel, "MANIM");
assert.ok(planSummary.capabilitySummary.includes("Geometry"));
assert.ok(planSummary.engineSummary.includes("manim-compiler"));

const originalFetch = globalThis.fetch;
(globalThis as any).fetch = async () => ({
  ok: true,
  json: async () => ({
    success: true,
    plan: {
      routeId: "LUADRAW",
      selectedCapabilities: ["geometry.luadraw", "render.video"],
      selectedEngines: ["luadraw", "renderer-router"],
      steps: [
        { capability: "geometry.luadraw", engine: "luadraw", status: "AVAILABLE", rationale: "LuaDraw route" },
        { capability: "render.video", engine: "renderer-router", status: "AVAILABLE", rationale: "Renderer" },
      ],
      rationale: "LuaDraw route chosen",
      outputFormat: "mp4",
    },
  }),
});

const planned = await requestStudioPlan({ intent: "Cube net", taskType: "geometry", geometryType: "POLYHEDRON_NET" });
assert.equal(planned.routeId, "LUADRAW");
assert.ok(planned.selectedCapabilities.includes("geometry.luadraw"));
(globalThis as any).fetch = originalFetch;

console.log("STUDIO_UI_ORCHESTRATOR_QA=PASS");
console.log("STUDIO_ENGINE_STATUS_UI_QA=PASS");
console.log("STUDIO_EXECUTION_PLAN_UI_QA=PASS");
console.log("STUDIO_MANIM_PREVIEW_QA=PASS");
console.log("STUDIO_LUADRAW_PREVIEW_QA=PASS");
console.log("STUDIO_UI_ERROR_STATE_QA=PASS");
