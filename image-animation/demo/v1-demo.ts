import { createGenerativeMotionArtifact } from "../renderers/generative/index.ts";
import { routeMotion } from "../renderers/router/index.ts";
import { createFrameEvidence, evaluateFrameQa } from "../qa/frame/index.ts";

export function createV1DemoArtifact() {
  const policy = Object.freeze({ deterministicRenderer: "manim" as const, generativeEnabled: true });
  const exactRoute = routeMotion({
    id: "euclid-triangle",
    geometryAuthority: "exact",
    requestedRenderer: "generative",
  }, policy);
  const visualRoute = routeMotion({
    id: "ambient-background",
    geometryAuthority: "non-authoritative",
  }, policy);
  const generativeArtifact = createGenerativeMotionArtifact({
    id: "ambient-background-output",
    source: "artifacts/v1/ambient-background.mp4",
    mediaType: "video/mp4",
    provenance: {
      providerId: "demo-provider",
      model: "demo-model-v1",
      promptDigest: "sha256:demo-prompt-v1",
    },
  });
  const frameEvidence = [
    createFrameEvidence(0, 1, 1, Uint8Array.from([0, 0, 0, 255])),
    createFrameEvidence(30, 1, 1, Uint8Array.from([255, 255, 255, 255])),
  ];
  const frameQa = evaluateFrameQa(frameEvidence, [0, 30]);
  return Object.freeze({
    version: 1 as const,
    demoId: "ia-v1-deterministic-demo" as const,
    policy,
    exactRoute,
    visualRoute,
    generativeArtifact,
    frameQa,
  });
}

export function serializeV1DemoArtifact(): string {
  return `${JSON.stringify(createV1DemoArtifact(), null, 2)}\n`;
}

if (process.argv[1]?.replaceAll("\\", "/").endsWith("/image-animation/demo/v1-demo.ts")) {
  process.stdout.write(serializeV1DemoArtifact());
}
