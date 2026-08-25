import assert from "node:assert/strict";
import { executeStudioTaskRequest } from "../server/studio/api.js";

const expectedTrace = ["REQUEST", "VALIDATE", "PLAN", "ROUTE_MATH", "REAL_MATH_PARSE", "REAL_MATH_SOLVE", "REAL_MATH_VERIFY", "GEOMETRY_ROUTE", "SCENE_GRAPH", "MOTION_TIMELINE", "MANIM_TOOLKIT", "MANIM_COMPILE", "EDGE_TTS", "RENDERER_ROUTE", "LOCAL_BRIDGE", "MANIM_RENDER", "FFMPEG_COMPOSE", "FRAME_QA", "OVERLAP_QA", "FINAL_MATH_QA", "ARTIFACT_QA", "RESULT"];
const result = await executeStudioTaskRequest({
  task: "video.render",
  input: { text: "Giải phương trình 2x - 4 = 0.", video: { resolution: "480p", fps: 30 } },
  requestedCapabilities: ["math.solve", "geometry.2d", "animation.manim", "video.render"],
}, { integrationCanary: true, imageAnimation: false, luaDraw: false, depthTwoPointFiveD: false, blender: false, generativeMotion: false });

assert.equal(result.success, true);
assert.deepEqual(result.trace.map((entry) => entry.stage), expectedTrace);
assert.equal(result.trace.every((entry) => entry.status === "PASS"), true);
assert.match(result.verifiedMathResult?.value.replace(/\s/g, "") ?? "", /(?:x=2|2)/);
assert.equal(result.sceneSummary?.sceneCount, 5);
assert.equal(result.finalArtifact?.type, "video/mp4");
assert.equal(result.finalArtifact?.status, "READY");
assert.ok((result.finalArtifact?.size ?? 0) > 0);
assert.ok((result.finalArtifact?.duration ?? 0) > 0);
assert.equal(result.finalArtifact?.videoCodec, "h264");
assert.equal(result.finalArtifact?.audioCodec, "aac");
assert.ok((result.finalArtifact?.width ?? 0) > 0 && (result.finalArtifact?.height ?? 0) > 0);
assert.deepEqual(result.fullVideoQa, { frame: "PASS", overlap: "PASS", finalMath: "PASS", artifact: "PASS" });
assert.equal("path" in (result.finalArtifact ?? {}), false);
console.log(`STUDIO_API_TO_FINAL_ARTIFACT_QA=PASS\nSTUDIO_FULL_VIDEO_ORCHESTRATION_QA=PASS\nSTUDIO_FULL_VIDEO_TRACE_QA=PASS\nREAL_GOLDEN_PATH_TRACE_QA=PASS\nREAL_GOLDEN_PATH_RUNTIME=PASS\nEND_TO_END_PIPELINE_QA=PASS\nVIDEO_RENDER_QA=PASS\nAUDIO_VIDEO_QA=PASS\nFINAL_MP4_SIZE=${result.finalArtifact?.size}\nFINAL_MP4_DURATION=${result.finalArtifact?.duration}\nFINAL_ARTIFACT_ID=${result.finalArtifact?.artifactId}`);
