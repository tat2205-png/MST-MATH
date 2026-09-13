import type { FigureCompatibilityContract, FigureKind } from "../figure-exam-foundation/contracts.js";
import type { FigureRecord, Provenance, SourceAnchor } from "../document-engine/document-ir.js";
import type { GeometrySpec } from "../../types/geometrySpec.js";

export interface FigureClassificationInput {
  figureId: string; sourceAssetId: string; sourceAnchor: SourceAnchor; sourceDocument: string;
  sourceHash: string; relationshipId?: string; provenance: Provenance;
  transformationHistory: readonly string[]; source?: Pick<FigureRecord, "caption" | "mimeType" | "mediaPath">;
}
export interface FigureClassification { semanticKind: FigureKind; confidence: number; evidence: string[]; issues: string[]; status: "PASS" | "REVIEW"; }
export interface ReconstructionProposal { classification: FigureClassification; geometrySpec?: GeometrySpec; contract: FigureCompatibilityContract; }
export type FigureStrokeStyle = "SOLID" | "DASHED";
export interface FigureSemanticEvidence { labels: string[]; axes?: { names: string[]; origin?: string; direction?: Record<string, "POSITIVE" | "NEGATIVE">; ticks?: string[] }; strokes?: Array<{ id: string; style: FigureStrokeStyle; meaning?: "PROJECTION" | "HIDDEN_EDGE" | "REFERENCE" | "BOUNDARY" | "AMBIGUOUS" }>; vectorRepresentation?: { kind: "SVG" | "GEOMETRY_SPEC" | "MATH_SCENE"; reference: string }; rasterSourceAssetId: string; }

