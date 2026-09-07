import assert from "node:assert/strict";
import { createQuestionDocx } from "./question-bank-fixture.ts";
import { buildDemoRc1P01 } from "../server/services/demoRc1P01Service.js";
import { rmSync } from "node:fs";

const output = "D:/MST-MATH-RC1/test-p01-output";
rmSync(output, { recursive: true, force: true });
const result = await buildDemoRc1P01("accepted-fixture.docx", createQuestionDocx(), output);
assert.equal(result.status, "REVIEW_REQUIRED");
assert.equal(result.artifacts, undefined);
assert.ok(result.diagnostics.some((item: any) => item.code === "WORD_RASTER_ASSET_CLASSIFICATION_SKIPPED"));
assert.deepEqual(result.lesson?.source.sha256, result.sourceHash);
console.log("DEMO_RC1_P01_INGEST_NORMALIZE_REVIEW_GATE_QA=PASS");
console.log("DEMO_RC1_OUTPUT_REQUIRES_TEACHER_REVIEW_QA=PASS");
