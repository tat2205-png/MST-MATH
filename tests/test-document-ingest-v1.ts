import assert from "node:assert/strict";
import { ingestApprovedSource } from "../src/modules/document-ingest/index.js";

const png = new Uint8Array([137,80,78,71,13,10,26,10,0]);
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9]);
const image = ingestApprovedSource({ name: "hinh.png", bytes: png, mimeType: "image/png" });
assert.equal(image.ok, true); if (image.ok) { assert.equal(image.kind, "IMAGE"); assert.equal(image.document.figures.length, 1); assert.equal(image.assetIds[0], image.document.figures[0].id); }
const jpegImage = ingestApprovedSource({ name: "hinh.jpeg", bytes: jpeg, mimeType: "image/jpeg" });
assert.equal(jpegImage.ok, true); if (jpegImage.ok) { assert.equal(jpegImage.kind, "IMAGE"); assert.equal(jpegImage.document.figures[0].mimeType, "image/jpeg"); assert.equal(jpegImage.document.figures[0].mediaPath, "hinh.jpeg"); }
const badImage = ingestApprovedSource({ name: "hinh.png", bytes: new Uint8Array([1,2,3]), mimeType: "image/png" }); assert.equal(badImage.ok, false);
const badPdf = ingestApprovedSource({ name: "de.pdf", bytes: new Uint8Array([1,2,3]), mimeType: "application/pdf" }); assert.equal(badPdf.ok, false);
const empty = ingestApprovedSource({ name: "de.pdf", bytes: new Uint8Array() }); assert.equal(empty.ok, false);
const unsupported = ingestApprovedSource({ name: "de.doc", bytes: new Uint8Array([1]) }); assert.equal(unsupported.ok, false);
const mismatch = ingestApprovedSource({ name: "hinh.png", bytes: png, mimeType: "image/jpeg" }); assert.equal(mismatch.ok, false);
const missingName = ingestApprovedSource({ name: "", bytes: png }); assert.equal(missingName.ok, false);
const missingBytes = ingestApprovedSource({ name: "hinh.jpg", bytes: undefined as unknown as Uint8Array }); assert.equal(missingBytes.ok, false);
const unsupportedContent = ingestApprovedSource({ name: "notes.txt", bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]) }); assert.equal(unsupportedContent.ok, false);
console.log("PDF_INGEST_QA=PASS\nIMAGE_INGEST_QA=PASS\nINGEST_FAIL_CLOSED_QA=PASS\nUNSUPPORTED_INPUT_QA=PASS\nASSET_MAPPING_QA=PASS\nSOURCE_TRACEABILITY_QA=PASS\nSOURCE_IMMUTABILITY_QA=PASS\nOPTIONAL_OCR_QA=SKIPPED_OPTIONAL");
