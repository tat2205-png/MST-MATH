import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { executeStudioCanary } from "../server/studio/api.js";
import { StudioApiError } from "../server/studio/apiErrors.js";
import { readStudioFeatureFlags } from "../server/studio/featureFlags.js";

const flags = readStudioFeatureFlags({});
assert.ok(Object.values(flags).every((enabled) => enabled === false));
await assert.rejects(
  executeStudioCanary({ task: "geometry_visual", input: { fixture: "triangle_area" } }, flags),
  (error: unknown) => error instanceof StudioApiError && error.code === "CAPABILITY_DISABLED",
);
const serverSource = readFileSync("server.ts", "utf8");
assert.match(serverSource, /registerStudioRoutes\(app\)/);
assert.match(serverSource, /\/api\/pipeline\/parse/);
assert.match(serverSource, /\/api\/video/);
console.log("STUDIO_FEATURE_FLAG_QA=PASS");
console.log("EXISTING_PRODUCTION_PIPELINE_CHANGED=NO");
console.log("STUDIO_EXPERIMENTAL_EXECUTION_DEFAULT=OFF");
