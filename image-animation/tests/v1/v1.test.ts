import assert from "node:assert/strict";
import { createGenerativeMotionArtifact } from "../../renderers/generative/index.ts";
import { routeMotion } from "../../renderers/router/index.ts";
import { createFrameEvidence, evaluateFrameQa } from "../../qa/frame/index.ts";
import { createV1DemoArtifact, serializeV1DemoArtifact } from "../../demo/v1-demo.ts";

const enabled = { deterministicRenderer: "manim" as const, generativeEnabled: true };
const exact = routeMotion({
  id: "exact-geometry",
  geometryAuthority: "exact",
  requestedRenderer: "generative",
}, enabled);
assert.deepEqual(exact, {
  status: "ready",
  requestId: "exact-geometry",
  renderer: "manim",
  authoritative: true,
  reason: "EXACT_GEOMETRY_REQUIRES_DETERMINISTIC_RENDERER",
});

const generated = routeMotion({ id: "visual", geometryAuthority: "non-authoritative" }, enabled);
assert.equal(generated.status, "ready");
assert.equal("renderer" in generated && generated.renderer, "generative");
assert.equal(generated.authoritative, false);

const denied = routeMotion(
  { id: "disabled", geometryAuthority: "non-authoritative" },
  { deterministicRenderer: "blender", generativeEnabled: false },
);
assert.deepEqual(denied, {
  status: "denied",
  requestId: "disabled",
  authoritative: false,
  reason: "GENERATIVE_RENDERING_DISABLED",
});

const artifact = createGenerativeMotionArtifact({
  id: "generated-video",
  source: "artifacts/generated.mp4",
  mediaType: "video/mp4",
  provenance: { providerId: "provider", promptDigest: "sha256:prompt" },
});
assert.equal(artifact.authoritative, false);
assert.equal(artifact.geometryAuthority, "none");
assert.equal(artifact.warning, "GENERATIVE_OUTPUT_IS_NON_AUTHORITATIVE");

const noEvidence = evaluateFrameQa([], [0]);
assert.equal(noEvidence.passed, false);
assert.deepEqual(noEvidence.issues.map((issue) => issue.code), ["NO_FRAME_EVIDENCE", "MISSING_FRAME"]);

const actualFrame = createFrameEvidence(0, 1, 1, Uint8Array.from([10, 20, 30, 255]));
assert.equal(actualFrame.byteLength, 4);
assert.match(actualFrame.sha256, /^[a-f0-9]{64}$/);
assert.equal(evaluateFrameQa([actualFrame], [0]).passed, true);
assert.equal(evaluateFrameQa([actualFrame], [0, 1]).passed, false);
assert.throws(
  () => createFrameEvidence(0, 2, 1, Uint8Array.from([0, 0, 0, 255])),
  /byte length/,
);
assert.equal(evaluateFrameQa([actualFrame, actualFrame], [0]).passed, false);

const firstDemo = createV1DemoArtifact();
const secondDemo = createV1DemoArtifact();
assert.deepEqual(secondDemo, firstDemo);
assert.equal(serializeV1DemoArtifact(), serializeV1DemoArtifact(), "demo output is byte-for-byte deterministic");
assert.equal(firstDemo.exactRoute.status, "ready");
assert.equal("renderer" in firstDemo.exactRoute && firstDemo.exactRoute.renderer, "manim");
assert.equal(firstDemo.generativeArtifact.authoritative, false);
assert.equal(firstDemo.frameQa.passed, true);

console.log("IA-10.1 V1 tests: PASS");
