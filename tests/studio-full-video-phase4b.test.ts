import assert from "node:assert/strict";
import { executeStudioTaskRequest } from "../server/studio/api.js";
import { StudioApiError } from "../server/studio/apiErrors.js";
import { planStudioTask } from "../server/studio/capabilityPlanner.js";
import type { StudioVideoArtifact } from "../server/studio/taskContracts.js";
import { validateStudioTaskRequest } from "../server/studio/taskValidation.js";

const request = validateStudioTaskRequest({
  task: "video.render",
  input: { text: "Giải phương trình 2x - 4 = 0.", video: { resolution: "480p", fps: 30 } },
  requestedCapabilities: ["math.solve", "geometry.2d", "animation.manim", "video.render"],
});
assert.equal(request.task, "video.render");
assert.deepEqual(planStudioTask(request).steps.map((step) => step.capability), ["math.solve", "geometry.2d", "animation.manim", "video.render"]);
assert.throws(() => validateStudioTaskRequest({ ...request, input: { text: "x=1", video: { fps: 60 } } }), /fps/);

await assert.rejects(
  () => executeStudioTaskRequest(request, { integrationCanary: false, imageAnimation: false, luaDraw: false, depthTwoPointFiveD: false, blender: false, generativeMotion: false }),
  (error: unknown) => error instanceof StudioApiError && error.code === "CAPABILITY_DISABLED",
);

const artifactContract: StudioVideoArtifact = { artifactId: "a".repeat(64), type: "video/mp4", status: "READY", size: 1, duration: 1, videoCodec: "h264", audioCodec: "aac", width: 854, height: 480, qaState: "PASS" };
assert.equal("path" in artifactContract, false);
console.log("STUDIO_FULL_VIDEO_CONTRACT_QA=PASS\nSTUDIO_ARTIFACT_CONTRACT_QA=PASS\nSTUDIO_FULL_VIDEO_FAIL_CLOSED_QA=PASS");
