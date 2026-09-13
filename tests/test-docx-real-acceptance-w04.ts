import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ingestDocx } from "../src/modules/document-engine/docx/ingestion.ts";

const files = ["GOLDEN_00_FOUNDATION.docx", "GOLDEN_01_TEXT_STYLES.docx", "GOLDEN_02_NATIVE_MATH.docx", "GOLDEN_03_GEOMETRY_SVG.docx", "GOLDEN_04_LAYOUT_PAGINATION.docx", "GOLDEN_05_COMBINED_MATH_DOCUMENT.docx"];
const reports = files.map(file => ingestDocx({ name: file, bytes: new Uint8Array(readFileSync(`tests/golden/docx/${file}`)) }));
assert.equal(reports.length, 6);
for (const report of reports) {
  assert.match(report.provenance.sourceSha256 ?? "", /^[a-f0-9]{64}$/);
  assert.ok(report.document || report.qaStatus === "QUARANTINED");
  assert.equal(report.diagnostics.extractedMathCount, report.diagnostics.documentIrMathCount);
  assert.equal(report.diagnostics.extractedAssetCount, report.diagnostics.documentIrAssetCount);
  assert.ok(report.diagnostics.paragraphCount >= 0 && report.diagnostics.tableCount >= 0);
}
assert.ok(reports.some(report => report.diagnostics.sourceMathCount > 0));
assert.ok(reports.some(report => report.diagnostics.sourceAssetCount > 0));
console.log(`w04-real-docx-acceptance: PASS files=${reports.length}`);
