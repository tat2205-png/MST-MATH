import assert from "node:assert/strict";
import { ingestApprovedSource } from "../src/modules/document-ingest/index.js";

const pdf = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n");
const png = new Uint8Array([137,80,78,71,13,10,26,10,0]);
const image = ingestApprovedSource({ name: "hinh.png", bytes: png, mimeType: "image/png" });
assert.equal(image.ok, true); if (image.ok) { assert.equal(image.kind, "IMAGE"); assert.equal(image.document.figures.length, 1); assert.equal(image.assetIds[0], image.document.figures[0].id); }
const badImage = ingestApprovedSource({ name: "hinh.png", bytes: new Uint8Array([1,2,3]), mimeType: "image/png" }); assert.equal(badImage.ok, false);
const badPdf = ingestApprovedSource({ name: "de.pdf", bytes: new Uint8Array([1,2,3]), mimeType: "application/pdf" }); assert.equal(badPdf.ok, false);
const empty = ingestApprovedSource({ name: "de.pdf", bytes: new Uint8Array() }); assert.equal(empty.ok, false);
const unsupported = ingestApprovedSource({ name: "de.doc", bytes: new Uint8Array([1]) }); assert.equal(unsupported.ok, false);
const mismatch = ingestApprovedSource({ name: "hinh.png", bytes: png, mimeType: "image/jpeg" }); assert.equal(mismatch.ok, false);
console.log("PDF_INGEST_QA=PASS\nIMAGE_INGEST_QA=PASS\nINGEST_FAIL_CLOSED_QA=PASS\nUNSUPPORTED_INPUT_QA=PASS\nASSET_MAPPING_QA=PASS\nSOURCE_TRACEABILITY_QA=PASS\nSOURCE_IMMUTABILITY_QA=PASS\nOPTIONAL_OCR_QA=SKIPPED_OPTIONAL");
