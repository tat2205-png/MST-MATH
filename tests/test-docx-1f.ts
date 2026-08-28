import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { zipSync } from "fflate";
import { auditDocxPackage, renderDocumentToDocx } from "../src/modules/document-export/docx/index.ts";
import type { DocumentIR } from "../src/modules/question-bank/types.ts";

const names = ["GOLDEN_01_TEXT_STYLES.docx", "GOLDEN_02_NATIVE_MATH.docx", "GOLDEN_03_GEOMETRY_SVG.docx", "GOLDEN_04_LAYOUT_PAGINATION.docx", "GOLDEN_05_COMBINED_MATH_DOCUMENT.docx"];
for (const name of names) {
  const path = resolve("tests/golden/docx", name); assert.ok(existsSync(path), name);
  const audit = auditDocxPackage(readFileSync(path)); assert.equal(audit.status, "PASS", audit.errors.join("; "));
  assert.equal(audit.checks.DOCX_PACKAGE_QA, "PASS"); assert.equal(audit.checks.OOXML_STRUCTURE_QA, "PASS"); assert.equal(audit.checks.DOCX_EXTERNAL_RELATIONSHIP_QA, "PASS");
}
const document: DocumentIR = { sourceDocument: "determinism.docx", sourceHash: "determinism", figures: [], warnings: [], blocks: [{ id: "text", kind: "PARAGRAPH", order: 0, content: [{ type: "text", value: "Deterministic semantic OOXML" }], sourceLocation: "test" }] };
const first = auditDocxPackage(renderDocumentToDocx(document, { generatedAt: new Date("2026-01-01T00:00:00Z") }).bytes);
const second = auditDocxPackage(renderDocumentToDocx(document, { generatedAt: new Date("2027-01-01T00:00:00Z") }).bytes);
assert.equal(first.semanticFingerprint, second.semanticFingerprint);
const malicious = zipSync({ "[Content_Types].xml": new TextEncoder().encode("<Types/>"), "_rels/.rels": new TextEncoder().encode('<Relationships><Relationship Id="x" TargetMode="External" Target="https://example.com/payload"/></Relationships>'), "word/vbaProject.bin": new Uint8Array([1]) });
const rejected = auditDocxPackage(malicious); assert.equal(rejected.status, "FAIL"); assert.equal(rejected.checks.DOCX_EXTERNAL_RELATIONSHIP_QA, "FAIL"); assert.equal(rejected.checks.DOCX_EXECUTABLE_CONTENT_QA, "FAIL");
console.log("DOCX_PACKAGE_QA=PASS\nOOXML_STRUCTURE_QA=PASS\nDOCX_SEMANTIC_DETERMINISM_QA=PASS\nDOCX_EXTERNAL_RELATIONSHIP_QA=PASS\nDOCX_EXECUTABLE_CONTENT_QA=PASS\nGOLDEN_CORPUS=PASS\nDOCX_QA_SUITE=PASS");
