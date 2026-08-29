import assert from "node:assert/strict";
import { createStudio } from "../server/studio/createStudio.js";

const flags = { integrationCanary: true, imageAnimation: false, luaDraw: false, depthTwoPointFiveD: false, blender: false, generativeMotion: false };
const request = { task: "math.solve" as const, input: { text: "2x-4=0" }, requestedCapabilities: ["math.solve" as const] };
const result = await createStudio(flags).executeTask(request);
assert.equal(result.success, true, result.error?.message);
assert.deepEqual(result.trace.map((entry) => entry.stage), ["VALIDATE", "PLAN", "ROUTE_MATH", "PARSE", "SOLVE", "VERIFY", "RESULT"]);
const artifact = result.artifacts[0];
assert.equal(artifact.kind, "math-execution");
assert.equal(artifact.input, "2x-4=0");
assert.equal((artifact.verification as { gateStatus: string }).gateStatus, "VERIFIED_PASS");
assert.match((artifact.result as { value: string }).value.replace(/\s/g, ""), /(?:x=2|2)/);
console.log("REAL_MATH_EXECUTION_QA=PASS");
