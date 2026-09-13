import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { ingestDocx } from "../src/modules/document-engine/docx/ingestion.ts";
import { DOCX_FIXTURES } from "../src/modules/document-engine/fixtures.ts";

const source = { name: "Tiếng Việt.docx", bytes: DOCX_FIXTURES.inlineEquation };
const result = ingestDocx(source);
assert.ok(result.document);
assert.equal(result.provenance.sourceKind, "DOCX");
assert.equal(result.provenance.sourceSha256, createHash("sha256").update(source.bytes).digest("hex"));
assert.equal(result.document?.sourceDocument, source.name);
assert.equal(result.document?.blocks[0]?.paragraphIndex, 0);
assert.equal(result.diagnostics.paragraphCount, 1);
assert.equal(result.diagnostics.sourceMathCount, 1);
assert.equal(result.diagnostics.extractedMathCount, 1);
assert.equal(result.diagnostics.documentIrMathCount, 1);
assert.equal(result.mathLedger.math[0]?.sourceAnchor.paragraphIndex, 0);
assert.equal(result.qaStatus, "PASS");

const unsupported = ingestDocx({ name: "legacy.docx", bytes: DOCX_FIXTURES.legacyMathType });
assert.equal(unsupported.qaStatus, "UNSUPPORTED");
assert.ok(unsupported.issues.some(issue => issue.code === "LEGACY_MATHTYPE_NEEDS_FALLBACK"));
const broken = ingestDocx({ name: "broken.docx", bytes: DOCX_FIXTURES.broken });
assert.equal(broken.qaStatus, "QUARANTINED");
console.log("docx-ingestion-orchestration: PASS");
