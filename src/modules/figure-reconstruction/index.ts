export * from "./contracts.js";
export * from "./classifier.js";
export * from "./validation.js";
export * from "./adapters.js";
export * from "./golden-fixtures.js";
import { classifyFigure } from "./classifier.js";
import type { FigureClassificationInput, ReconstructionProposal } from "./contracts.js";
import { PIMATH_FIGURE_EXAM_CONTRACT_VERSION } from "../figure-exam-foundation/contracts.js";
export function proposeFigureReconstruction(input: FigureClassificationInput): ReconstructionProposal {
  const classification = classifyFigure(input);
  const qaStatus: "PASS" | "REVIEW" = classification.status === "PASS" ? "PASS" : "REVIEW";
  const contract = { contractVersion: PIMATH_FIGURE_EXAM_CONTRACT_VERSION, figureId: input.figureId, sourceAssetId: input.sourceAssetId, sourceAnchor: input.sourceAnchor, sourceDocument: input.sourceDocument, sourceHash: input.sourceHash, relationshipId: input.relationshipId, transformationHistory: [...input.transformationHistory], semanticKind: classification.semanticKind, provenance: { ...input.provenance, transformationHistory: [...input.provenance.transformationHistory] }, qa: { status: qaStatus, issues: [], checks: {} } };
  return { classification, contract };
}
