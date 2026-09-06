import assert from "node:assert/strict";
import { intersectionOverUnion, rasterBoxToPage, reconcileCandidates } from "../src/modules/document-ingest/pdf-reconciliation.js";
const page = { width: 600, height: 800, rotation: 0 as const };
assert.deepEqual(rasterBoxToPage([0, 0, 1200, 1600], 1200, 1600, page), [0, 0, 600, 800]);
assert.equal(intersectionOverUnion([0, 0, 10, 10], [0, 0, 10, 10]), 1);
const result = reconcileCandidates([
  { page: 1, bbox: [10, 10, 100, 30], kind: "TEXT", content: "  Cho   hàm số ", source: "OCR" },
  { page: 1, bbox: [10, 10, 100, 30], kind: "TEXT", content: "Cho hàm số", source: "PDF_NATIVE" },
  { page: 1, bbox: [20, 40, 80, 65], kind: "TEXT", content: "x 2 + 1", source: "OCR" },
  { page: 1, bbox: [20, 40, 80, 65], kind: "MATH", content: "x^2+1", source: "FORMULA_RECOGNIZER" },
]);
assert.equal(result.length, 2); assert.equal(result[0].source, "PDF_NATIVE"); assert.equal(result[1].kind, "MATH");
console.log("PDF_COORDINATE_QA=PASS\nPDF_RECONCILIATION_QA=PASS\nPDF_MATH_PRIORITY_QA=PASS");
