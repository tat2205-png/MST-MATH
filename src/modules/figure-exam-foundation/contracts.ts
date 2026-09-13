import type { GeometrySpec } from "../../types/geometrySpec.js";
import type { SourceAnchor, Provenance, PreservationStatus, ExtractionIssue } from "../document-engine/document-ir.js";

export const PIMATH_FIGURE_EXAM_CONTRACT_VERSION = "1.0" as const;
export type FigureKind = "VARIATION_DIAGRAM" | "FUNCTION_GRAPH_2D" | "COORDINATE_2D" | "COORDINATE_3D" | "GEOMETRY_2D" | "GEOMETRY_3D" | "FOLD_DIAGRAM" | "GRID_PATTERN" | "NODE_DIAGRAM" | "TABLE" | "OTHER_UNKNOWN";
export interface FigureBoundingBox { x: number; y: number; width: number; height: number; unit: "px" | "pt" | "mm" | "normalized"; }
export interface FigurePlacementMetadata { preferredRegion?: "INLINE" | "ABOVE" | "BELOW" | "SIDE"; keepWithQuestion?: boolean; grayscaleSafe?: boolean; }
export interface FigureQA { status: PreservationStatus; issues: ExtractionIssue[]; checks: Record<string, "PASS" | "FAIL" | "REVIEW" | "NOT_APPLICABLE">; }
/** Additive bridge: geometry remains owned by MathScene/GeometrySpec and document identity by DocumentIR. */
export interface FigureCompatibilityContract {
  contractVersion: typeof PIMATH_FIGURE_EXAM_CONTRACT_VERSION;
  figureId: string;
  sourceAssetId: string;
  sourceAnchor: SourceAnchor;
  sourceDocument: string;
  sourceHash: string;
  relationshipId?: string;
  transformationHistory: readonly string[];
  semanticKind: FigureKind;
  sceneReference?: string;
  geometrySpec?: GeometrySpec;
  boundingBox?: FigureBoundingBox;
  safeBoundingBox?: FigureBoundingBox;
  placement?: FigurePlacementMetadata;
  provenance: Provenance;
  qa: FigureQA;
}
