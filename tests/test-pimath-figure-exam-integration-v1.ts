import assert from "node:assert/strict";
import { proposeFigureReconstruction, validateBoundingBoxes } from "../src/modules/figure-reconstruction/index.js";
import { normalizeExamDocument, validateNormalizedExamDocument } from "../src/modules/exam-normalization/index.js";
import type { QuestionObject } from "../src/modules/question-bank/types.js";

// TEST_FIXTURE_ONLY: NOT_GOLDEN_EVIDENCE. This proves the production contract boundary.
const sourceHash = "fixture-source-sha256";
const proposal = proposeFigureReconstruction({
  figureId: "F002_FUNCTION_GRAPH", sourceAssetId: "asset-function-graph", sourceAnchor: { sourceDocumentId: "exam-308.docx", paragraphIndex: 12, relationshipId: "rId7" },
  sourceDocument: "exam-308.docx", sourceHash, provenance: { sourceFile: "exam-308.docx", sourceKind: "DOCX", parser: "native", transformationHistory: [] }, transformationHistory: [], source: { caption: "function graph", mimeType: "image/svg+xml" },
});
const figure = { ...proposal.contract, boundingBox: { x: 10, y: 20, width: 240, height: 160, unit: "pt" as const }, safeBoundingBox: { x: 8, y: 18, width: 244, height: 164, unit: "pt" as const }, placement: { preferredRegion: "ABOVE" as const, keepWithQuestion: true } };
const semanticBefore = figure.semanticKind;
assert.equal(validateBoundingBoxes(figure).status, "PASS");
console.log("BOUNDING_BOX_CONTRACT_QA=PASS");
const question: QuestionObject = { id: "q-308-01", source: { document: figure.sourceDocument, sourceHash, blockIds: ["source-block-12"], sourceLocations: ["exam-308.docx:12"] }, index: 1, type: "MULTIPLE_CHOICE", stem: [{ type: "text", value: "Cho đồ thị hàm số như hình vẽ." }], options: ["A", "B", "C", "D"].map(label => ({ label, content: [{ type: "text", value: label }] })), trueFalseItems: [], subquestions: [], figures: [{ id: figure.figureId, relationshipId: "rId7", sourceLocation: "exam-308.docx:12" }], figureAssociations: [{ figureId: figure.figureId, questionId: "q-308-01", status: "CONFIRMED", confidence: 1, evidence: ["source-anchor"] }], metadata: {}, warnings: [], validationStatus: "VALID" };
const result = normalizeExamDocument([question], { exam: "THPTQG", sourceDocument: figure.sourceDocument, figures: new Map([[figure.figureId, figure]]) });
const placement = result.pagination.placements[0];
assert.equal(figure.figureId, placement.figureIds[0]); assert.equal(figure.sourceAssetId, "asset-function-graph"); assert.equal(figure.sourceAnchor.sourceDocumentId, "exam-308.docx"); assert.equal(figure.sourceDocument, result.document.sourceDocument); assert.equal(figure.sourceHash, sourceHash); assert.equal(figure.provenance.sourceFile, "exam-308.docx"); assert.equal(figure.semanticKind, semanticBefore);
assert.deepEqual(placement.safeFigureBounds[figure.figureId], figure.safeBoundingBox); assert.equal(placement.questionId, question.id); assert.equal(placement.keepWithQuestion, true); assert.deepEqual(validateNormalizedExamDocument(result), []); assert.equal(result.document.blocks.some(block => block.content.some(content => content.type === "text" && /answer|solution/i.test(content.value))), false);
console.log("SAFE_BOUNDING_BOX_HANDOFF_QA=PASS");
console.log("PIMATH_FIGURE_EXAM_INTEGRATION_V1_QA=PASS");

