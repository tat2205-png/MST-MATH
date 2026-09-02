import { createHash } from "node:crypto";

export type EvidenceKind = "TEXT" | "LAYOUT" | "TABLE" | "OCR_TEXT" | "FIGURE" | "MATH_HINT" | "READING_ORDER" | "SEMANTIC_ASSIST";
export type ReviewStatus = "NOT_REQUIRED" | "REVIEW" | "UNAVAILABLE";
export type RuntimeStatus = "AVAILABLE" | "UNAVAILABLE" | "MODEL_MISSING" | "INVALID_INPUT" | "ERROR";

export interface EvidenceRequest { sourceDocument: string; bytes?: Uint8Array; sourceHash?: string; sourceAnchor?: string; assetId?: string; timeoutMs?: number; }
export interface LocalDocumentEvidence { provider: string; providerVersion: string; model?: string; sourceDocument: string; sourceHash: string; sourceAnchor?: string; assetId?: string; evidenceKind: EvidenceKind; confidence?: number; payload?: unknown; reference?: string; issues: string[]; reviewStatus: ReviewStatus; transformationHistory: string[]; provenance: { sourceFile: string; sourceSha256: string; provider: string; transformations: string[]; authority: "EVIDENCE_ONLY" }; }
export interface ProviderAvailability { status: RuntimeStatus; version?: string; model?: string; issues: string[]; }
export interface LocalDocumentEvidenceProvider { readonly name: string; capabilities(): readonly EvidenceKind[]; availability(): Promise<ProviderAvailability>; extractEvidence(request: EvidenceRequest): Promise<LocalDocumentEvidence[]>; }
export const sourceHash = (request: EvidenceRequest) => request.sourceHash ?? createHash("sha256").update(request.bytes ?? new Uint8Array()).digest("hex");
export const reviewForConfidence = (confidence?: number): ReviewStatus => confidence !== undefined && confidence < 0.85 ? "REVIEW" : "NOT_REQUIRED";
export function unavailableEvidence(provider: string, request: EvidenceRequest, issue: string): LocalDocumentEvidence[] { const hash = sourceHash(request); return [{ provider, providerVersion: "unavailable", sourceDocument: request.sourceDocument, sourceHash: hash, sourceAnchor: request.sourceAnchor, assetId: request.assetId, evidenceKind: "TEXT", issues: [issue], reviewStatus: "UNAVAILABLE", transformationHistory: [], provenance: { sourceFile: request.sourceDocument, sourceSha256: hash, provider, transformations: [], authority: "EVIDENCE_ONLY" } }]; }
