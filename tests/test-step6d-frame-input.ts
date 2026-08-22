import fs from "node:fs";
import { LocalBridgeClient } from "../src/services/localBridgeClient.js";
import { VisualFrameQAService } from "../server/services/visualFrameQAService.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function run() {
  const client = new LocalBridgeClient("http://127.0.0.1:8765");
  const normalized = (client as any).normalizeArtifacts([
    { name: "START.png", pathOrUrl: "/api/jobs/job/artifacts/START.png", mimeType: "image/png" },
    { name: "KEY.png", pathOrUrl: "/api/jobs/job/artifacts/KEY.png", mimeType: "image/png" },
    { name: "END.png", pathOrUrl: "/api/jobs/job/artifacts/END.png", mimeType: "image/png" },
  ]);
  assert(normalized.every((artifact: any) => artifact.type.endsWith("_frame") && artifact.pathOrUrl), "Frame metadata normalization failed.");
  console.log("TEST_FRAME_ARTIFACT_NORMALIZATION: PASS");

  const originalFetch = globalThis.fetch;
  let visionCalled = false;
  const originalVision = (await import("../server/providers/index.js")).geminiProvider.generateStructuredJSON;
  (await import("../server/providers/index.js")).geminiProvider.generateStructuredJSON = (async () => {
    visionCalled = true;
    throw new Error("Vision must not be called for missing input");
  }) as typeof originalVision;
  globalThis.fetch = (async () => new Response(JSON.stringify({ artifacts: [] }), { status: 200, headers: { "content-type": "application/json" } })) as typeof fetch;

  try {
    const report = await new VisualFrameQAService().runJobFrameQA({ jobId: "missing-frame-test", bridgeUrl: "http://127.0.0.1:8765" });
    assert(report.qaMetrics.frameInputQa === "FAIL", "Missing frame input gate did not fail.");
    assert(!visionCalled, "Gemini Vision was called despite missing frame input.");
    assert(report.summary.mathErrors === 0, "Missing frames produced a false math error.");
    assert(report.frames.start.issues[0]?.category === "FRAME_INPUT_ERROR", "Missing frame was not classified as FRAME_INPUT_ERROR.");
    assert(report.frames.start.issues[0]?.repairClass === "INFRASTRUCTURE_ERROR", "Missing frame was not classified as infrastructure.");
    assert(report.frames.start.notes?.includes("Visual Analysis = NOT_RUN") === true, "Missing frame did not report Visual Analysis = NOT_RUN.");
    console.log("TEST_FRAME_INPUT_GATE: PASS");
    console.log("TEST_MISSING_FRAME_NO_FALSE_MATH_ERROR: PASS");
  } finally {
    globalThis.fetch = originalFetch;
    (await import("../server/providers/index.js")).geminiProvider.generateStructuredJSON = originalVision;
  }

  const serviceSource = fs.readFileSync("server/services/visualFrameQAService.ts", "utf8");
  assert(serviceSource.includes("imagePart") && serviceSource.includes("data: frameSource.base64"), "Gemini request does not include image content.");
  assert(serviceSource.includes("frameInputQa") && serviceSource.includes("downloadImage"), "Frame input normalization/gate is missing.");
  console.log("TEST_REAL_FRAME_QA_REQUEST_SHAPE: PASS");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
