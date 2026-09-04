import assert from "node:assert/strict";
import { ingestDocx } from "../src/modules/document-engine/docx/ingestion.ts";
import { DOCX_FIXTURES } from "../src/modules/document-engine/fixtures.ts";
import { evaluatePreservationStatus } from "../src/modules/question-bank/contracts.ts";

for (const [name, bytes] of Object.entries({ fractionsRadicals: DOCX_FIXTURES.fractionsRadicals, inlineEquation: DOCX_FIXTURES.inlineEquation, displayEquation: DOCX_FIXTURES.displayEquation })) {
  const result = ingestDocx({ name: `${name}.docx`, bytes });
  assert.equal(result.diagnostics.sourceMathCount, result.diagnostics.extractedMathCount);
  assert.equal(result.diagnostics.extractedMathCount, result.diagnostics.documentIrMathCount);
  assert.equal(result.mathLedger.math.length, result.diagnostics.documentIrMathCount);
  assert.ok(result.mathLedger.math.every(entry => entry.mathObjectId && entry.sourceAnchor.sourceDocumentId));
}
const unsupported = ingestDocx({ name: "mathtype.docx", bytes: DOCX_FIXTURES.legacyMathType });
assert.equal(unsupported.qaStatus, "UNSUPPORTED");
assert.ok(unsupported.issues.some(issue => issue.code === "LEGACY_MATHTYPE_NEEDS_FALLBACK" && issue.status === "UNSUPPORTED"));
assert.equal(evaluatePreservationStatus([], { sourceMathCount: 2, extractedMathCount: 1, documentIrMathCount: 1, questionIrMathCount: 0, questionPackageMathCount: 1, sourceAssetCount: 0, extractedAssetCount: 0, documentIrAssetCount: 0, questionPackageAssetCount: 0 }), "REVIEW");
console.log("w02-word-math-preservation: PASS");
