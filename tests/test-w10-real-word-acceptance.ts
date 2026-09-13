import assert from "node:assert/strict";
import { runW10Acceptance } from "../scripts/run-w10-real-word-acceptance.ts";

const reports = runW10Acceptance(["GOLDEN_00_FOUNDATION.docx", "GOLDEN_01_TEXT_STYLES.docx", "GOLDEN_02_NATIVE_MATH.docx", "GOLDEN_03_GEOMETRY_SVG.docx", "GOLDEN_04_LAYOUT_PAGINATION.docx", "GOLDEN_05_COMBINED_MATH_DOCUMENT.docx"]);
assert.equal(reports.length, 6);
assert.ok(reports.every(report => /^[a-f0-9]{64}$/.test(report.sourceSha256)));
assert.ok(reports.every(report => report.extractedMathCount === report.documentIrMathCount));
assert.ok(reports.every(report => report.extractedAssetCount === report.documentIrAssetCount));
assert.equal(reports.reduce((sum, report) => sum + report.detectedQuestionCount, 0), 0);
assert.ok(reports.some(report => report.sourceMathCount > 0));
assert.ok(reports.some(report => report.sourceAssetCount > 0));
console.log("w10-real-word-acceptance-harness: PASS");
