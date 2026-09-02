import assert from "node:assert/strict";
import { PIMATH_FIGURE_EXAM_CONTRACT_VERSION, type FigureCompatibilityContract } from "../src/modules/figure-exam-foundation/contracts.js";
assert.equal(PIMATH_FIGURE_EXAM_CONTRACT_VERSION, "1.0");
const contract: FigureCompatibilityContract = { contractVersion: "1.0", figureId: "F-1", sourceAssetId: "asset-1", sourceAnchor: { sourceDocumentId: "doc-1" }, sourceDocument: "fixture.docx", sourceHash: "sha256", transformationHistory: [], semanticKind: "OTHER_UNKNOWN", provenance: { sourceFile: "fixture.docx", sourceKind: "DOCX", parser: "native", transformationHistory: [] }, qa: { status: "REVIEW", issues: [], checks: {} } };
assert.equal(contract.sourceAnchor.sourceDocumentId, "doc-1");
console.log("PIMATH_FOUNDATION_CONTRACT=PASS");
