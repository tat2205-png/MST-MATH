import assert from "node:assert/strict";
import { geminiProvider } from "../server/providers/index.js";
import { VisualFrameQAService } from "../server/services/visualFrameQAService.js";

const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+XxZ2AAAAAElFTkSuQmCC";
const frames = { start: { base64: png }, key: { base64: png }, end: { base64: png } };
const original = geminiProvider.generateStructuredJSON;
const run = (value: unknown) => {
  geminiProvider.generateStructuredJSON = (async () => {
    if (value instanceof Error) throw value;
    return value;
  }) as typeof original;
  return new VisualFrameQAService().runJobFrameQA({ jobId: "phase4a4", rawFrames: frames });
};

try {
  const analysisError = await run(new Error("secret stack detail"));
  assert.equal(analysisError.overallStatus, "FAIL");
  assert.equal(analysisError.frames.start.analysisCompleted, false);
  assert.doesNotMatch(JSON.stringify(analysisError), /secret stack detail/);

  const malformedAnalyzer = await run({ unexpected: true });
  assert.equal(malformedAnalyzer.overallStatus, "FAIL");

  const malformedArtifact = await new VisualFrameQAService().runJobFrameQA({ jobId: "bad", rawFrames: { ...frames, start: { base64: "not-an-image" } } });
  assert.equal(malformedArtifact.overallStatus, "FAIL");

  for (const [name, checks, category] of [
    ["TEXT", { textClipped: true }, "TEXT_ERROR"],
    ["LATEX", { formulaClipped: true }, "TEXT_ERROR"],
    ["GEOMETRY", { cameraCropping: true, geometryInvariantPreserved: false }, "GEOMETRY_ERROR"],
  ] as const) {
    const report = await run({ status: "PASS", issues: [], checks, notes: name });
    assert.equal(report.overallStatus, "FAIL", `${name} outside frame must fail`);
    assert.equal(report.frames.start.issues.some((issue) => issue.category === category), true);
  }

  const valid = await run({ status: "PASS", issues: [], checks: { textClipped: false, formulaClipped: false, formulaReadable: true, textOverlap: false, objectOverlap: false, spacingSufficient: true, safeMarginViolated: false, cameraCropping: false, fontRenderError: false, assetDistorted: false, mathAccurate: true, geometryInvariantPreserved: true, graphInvariantPreserved: true }, notes: "clean" });
  assert.equal(valid.overallStatus, "PASS");
  assert.equal(valid.frames.start.analysisCompleted, true);

  const containment = await run({ status: "PASS", issues: [], checks: { objectOverlap: false, spacingSufficient: true }, notes: "Text inside Card; Formula inside FormulaBox; Geometry inside GeometryPanel" });
  assert.equal(containment.overallStatus, "PASS");

  const runtime = new VisualFrameQAService() as any;
  runtime.evaluateSingleFrame = async () => { throw new Error("unexpected runtime failure"); };
  const runtimeReport = await runtime.runJobFrameQA({ jobId: "runtime", rawFrames: frames });
  assert.equal(runtimeReport.overallStatus, "FAIL");
  assert.equal(runtimeReport.finalStatus, "QA_FAILED");

  assert.equal([analysisError, malformedAnalyzer, malformedArtifact, runtimeReport].some((report) => Object.values(report.frames).some((frame: any) => frame.status === "PASS" && frame.analysisCompleted === false)), false);
  console.log("FRAME_QA_FAIL_CLOSED=PASS\nFRAME_QA_ERROR_PATH_QA=PASS\nFRAME_QA_BOUNDS_QA=PASS\nFRAME_QA_PASS_REQUIRES_ANALYSIS_QA=PASS\nFRAME_QA_PROPAGATION_QA=PASS\nTEXT_FRAME_QA=PASS\nLATEX_FRAME_QA=PASS\nGEOMETRY_FRAME_QA=PASS\nOVERLAP_REGRESSION_QA=PASS\nDETERMINISTIC_FRAME_QA_AUTHORITATIVE=TRUE");
} finally {
  geminiProvider.generateStructuredJSON = original;
}
