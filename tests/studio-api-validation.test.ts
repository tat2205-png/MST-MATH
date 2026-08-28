import assert from "node:assert/strict";
import { validateStudioCanaryRequest } from "../server/studio/api.js";
import { StudioApiError } from "../server/studio/apiErrors.js";

const invalid: unknown[] = [
  null,
  {},
  { task: "shell", input: { fixture: "triangle_area" } },
  { task: "geometry_visual", input: { fixture: "triangle_area", code: "print(1)" } },
  { task: "geometry_visual", input: { fixture: "triangle_area" }, path: "C:\\secret" },
  { task: "geometry_visual", input: { fixture: "x".repeat(5000) } },
];
for (const value of invalid) {
  assert.throws(
    () => validateStudioCanaryRequest(value),
    (error: unknown) => error instanceof StudioApiError && error.code === "INVALID_REQUEST",
  );
}
assert.doesNotThrow(() => validateStudioCanaryRequest({ task: "geometry_visual", input: { fixture: "triangle_area" } }));
console.log("STUDIO_API_VALIDATION_QA=PASS");
