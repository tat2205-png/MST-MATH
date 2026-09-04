import assert from "node:assert/strict";
import { documentLedger, evaluatePreservationStatus, type QuestionIR, type QuestionPackage } from "../src/modules/question-bank/contracts.ts";
import type { DocumentIR, ExtractionIssue, Provenance, SourceAnchor } from "../src/modules/document-engine/document-ir.ts";

const anchor: SourceAnchor = { sourceDocumentId: "doc-1", partName: "word/document.xml", paragraphIndex: 2, runIndex: 1, objectIndex: 0 };
const provenance: Provenance = { sourceFile: "sample.docx", sourceSha256: "abc", sourceKind: "DOCX", parser: "docx-parser", parserVersion: "1", transformationHistory: ["EXTRACTED"] };
const document: DocumentIR = { id: "doc-1", sourceDocument: "sample.docx", sourceHash: "abc", blocks: [], figures: [], warnings: [], provenance, mathObjects: [{ mathObjectId: "math-1", sourceAnchor: anchor, status: "PASS" }], assetObjects: [{ assetId: "asset-1", kind: "IMAGE", sourceAnchor: anchor, status: "PASS" }] };
const question: QuestionIR = { id: "q-1", questionNumber: 1, questionType: "MULTIPLE_CHOICE", sourceDocumentId: "doc-1", sourceObjectIds: ["block-1"], stem: [{ type: "text", value: "x" }], options: [], mathObjectIds: ["math-1"], assetIds: ["asset-1"], tableIds: [], metadata: {}, qaStatus: "PASS", issues: [], provenance };
const pkg: QuestionPackage = { id: "q-1", directoryName: "question-q-1", question, metadata: {}, assets: document.assetObjects!, mathObjectIds: ["math-1"], sourceObjectIds: ["block-1"], provenance, qaStatus: "PASS", extractionIssues: [] };

assert.equal(document.mathObjects![0].mathObjectId, question.mathObjectIds[0]);
assert.equal(pkg.question.id, question.id);
assert.deepEqual(document.provenance, provenance);
assert.deepEqual(document.mathObjects![0].sourceAnchor, anchor);
assert.equal(documentLedger(document).status, "PASS");
assert.equal(evaluatePreservationStatus([], { sourceMathCount: 1, extractedMathCount: 0, documentIrMathCount: 1, questionIrMathCount: 1, questionPackageMathCount: 1, sourceAssetCount: 0, extractedAssetCount: 0, documentIrAssetCount: 0, questionPackageAssetCount: 0 }), "REVIEW");
const statuses: Array<[ExtractionIssue["status"], ReturnType<typeof evaluatePreservationStatus>]> = [["REVIEW", "REVIEW"], ["QUARANTINED", "QUARANTINED"], ["UNSUPPORTED", "UNSUPPORTED"]];
for (const [status, expected] of statuses) assert.equal(evaluatePreservationStatus([{ code: "X", severity: "ERROR", message: "not safe", status }]), expected);
console.log("document-question-contract: PASS");
