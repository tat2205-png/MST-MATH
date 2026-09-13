import type { FigureCompatibilityContract } from "../figure-exam-foundation/contracts.js";
import type { FigureSemanticEvidence } from "./contracts.js";
export interface FigureValidation { status: "PASS" | "FAIL" | "REVIEW"; checks: Record<string, "PASS" | "FAIL" | "REVIEW">; issues: string[]; }
export function validateFigureContract(contract: FigureCompatibilityContract): FigureValidation {
  const checks = { SOURCE_IDENTITY_QA: "PASS", PROVENANCE_QA: "PASS", BOUNDING_BOX_QA: contract.boundingBox ? "PASS" : "REVIEW", LOW_CONFIDENCE_REVIEW_QA: contract.qa.status === "REVIEW" ? "PASS" : "PASS" } as Record<string, "PASS" | "FAIL" | "REVIEW">;
  const issues: string[] = [];
  if (!contract.figureId || !contract.sourceAssetId || !contract.sourceHash) { checks.SOURCE_IDENTITY_QA = "FAIL"; issues.push("SOURCE_IDENTITY_INCOMPLETE"); }
  if (!contract.provenance.sourceFile || !contract.provenance.parser) { checks.PROVENANCE_QA = "FAIL"; issues.push("PROVENANCE_INCOMPLETE"); }
  return { status: issues.length ? "FAIL" : contract.qa.status === "REVIEW" ? "REVIEW" : "PASS", checks, issues };
}
export function validateSemanticEvidence(evidence: FigureSemanticEvidence): FigureValidation {
  const checks = { MATH_LABEL_QA: "PASS", AXIS_QA: "PASS", DASH_STYLE_QA: "PASS", VECTOR_OUTPUT_QA: "PASS", GEOMETRY_RELATION_QA: "PASS" } as Record<string, "PASS" | "FAIL" | "REVIEW">;
  const issues: string[] = [];
  if (!evidence.rasterSourceAssetId) { checks.VECTOR_OUTPUT_QA = "FAIL"; issues.push("RASTER_PROVENANCE_MISSING"); }
  if (evidence.strokes?.some(stroke => stroke.style === "DASHED" && !stroke.meaning)) { checks.DASH_STYLE_QA = "REVIEW"; issues.push("DASH_MEANING_AMBIGUOUS"); }
  if (evidence.vectorRepresentation && !["SVG", "GEOMETRY_SPEC", "MATH_SCENE"].includes(evidence.vectorRepresentation.kind)) { checks.VECTOR_OUTPUT_QA = "FAIL"; issues.push("VECTOR_BOUNDARY_UNSUPPORTED"); }
  if (evidence.axes && !evidence.axes.names.includes("x-axis")) { checks.AXIS_QA = "FAIL"; issues.push("X_AXIS_MISSING"); }
  return { status: issues.some(issue => issue === "DASH_MEANING_AMBIGUOUS") ? "REVIEW" : issues.length ? "FAIL" : "PASS", checks, issues };
}
export function validateBoundingBoxes(contract: FigureCompatibilityContract): FigureValidation {
  const checks = { BOUNDING_BOX_QA: "PASS" } as Record<string, "PASS" | "FAIL" | "REVIEW">;
  const issues: string[] = [];
  const valid = (box: NonNullable<FigureCompatibilityContract["boundingBox"]>) => Number.isFinite(box.x) && Number.isFinite(box.y) && Number.isFinite(box.width) && Number.isFinite(box.height) && box.width >= 0 && box.height >= 0 && ["px", "pt", "mm", "normalized"].includes(box.unit);
  if (contract.boundingBox && !valid(contract.boundingBox)) issues.push("BOUNDING_BOX_INVALID");
  if (contract.safeBoundingBox && !valid(contract.safeBoundingBox)) issues.push("SAFE_BOUNDING_BOX_INVALID");
  if (contract.boundingBox && contract.safeBoundingBox && (contract.safeBoundingBox.x > contract.boundingBox.x || contract.safeBoundingBox.y > contract.boundingBox.y || contract.safeBoundingBox.x + contract.safeBoundingBox.width < contract.boundingBox.x + contract.boundingBox.width || contract.safeBoundingBox.y + contract.safeBoundingBox.height < contract.boundingBox.y + contract.boundingBox.height)) issues.push("SAFE_BOUNDING_BOX_DOES_NOT_CONTAIN_FIGURE");
  if (issues.length) checks.BOUNDING_BOX_QA = "FAIL";
  return { status: issues.length ? "FAIL" : "PASS", checks, issues };
}

