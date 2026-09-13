import type { GeometrySpec } from "../../types/geometrySpec.js";
export interface GeometrySemanticsAdapter { readonly authority: "SEMANTIC_GEOMETRY"; reconstruct(input: unknown): Promise<GeometrySpec>; }
export interface FoldDelegationAdapter { readonly authority: "FOLD_DGK"; reconstruct(input: unknown): Promise<GeometrySpec>; }
export interface ProviderEvidence { provider: string; model?: string; confidence: number; evidence: string[]; issues: string[]; reviewStatus: "PASS" | "REVIEW"; }

