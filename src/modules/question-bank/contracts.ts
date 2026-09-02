import type { AssetLedgerEntry, ContentBlock, DocumentIR, DocumentObjectId, ExtractionIssue, PreservationStatus, Provenance, SourceAnchor } from "../document-engine/document-ir.js";
import type { MathLedgerEntry } from "../document-engine/document-ir.js";

export type { AssetKind, AssetLedgerEntry, DocumentObjectId, ExtractionIssue, MathLedgerEntry, PreservationStatus, Provenance, SourceAnchor } from "../document-engine/document-ir.js";
export type CanonicalQuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "UNKNOWN";
export interface LedgerDiagnostics { sourceMathCount: number; extractedMathCount: number; documentIrMathCount: number; questionIrMathCount: number; questionPackageMathCount: number; sourceAssetCount: number; extractedAssetCount: number; documentIrAssetCount: number; questionPackageAssetCount: number }
export interface MathAssetIdentityMappings { sourceToExtracted: Record<string, string>; extractedToDocumentIr: Record<string, string>; documentIrToQuestionIr: Record<string, string[]>; questionIrToPackage: Record<string, string[]> }
export interface MathAssetLedger { diagnostics: LedgerDiagnostics; math: MathLedgerEntry[]; assets: AssetLedgerEntry[]; mappings?: MathAssetIdentityMappings; status: PreservationStatus; issues: ExtractionIssue[] }
export interface QuestionIR { id: string; questionNumber?: string | number; questionType: CanonicalQuestionType; sourceDocumentId: string; sourceObjectIds: DocumentObjectId[]; stem: ContentBlock[]; options: Array<{ label: string; content: ContentBlock[] }>; answer?: ContentBlock[]; solution?: ContentBlock[]; mathObjectIds: DocumentObjectId[]; assetIds: DocumentObjectId[]; tableIds: DocumentObjectId[]; metadata: Record<string, unknown>; qaStatus: PreservationStatus; issues: ExtractionIssue[]; provenance: Provenance }
export interface QuestionPackage { id: string; directoryName: `question-${string}`; question: QuestionIR; questionTex?: string; solutionTex?: string; metadata: Record<string, unknown>; assets: AssetLedgerEntry[]; mathObjectIds: DocumentObjectId[]; sourceObjectIds: DocumentObjectId[]; provenance: Provenance; qaStatus: PreservationStatus; extractionIssues: ExtractionIssue[] }

const packageText = (blocks?: ContentBlock[]) => (blocks ?? []).map(block => block.type === "text" ? block.value : block.type === "math" ? `\\(${block.math.latex ?? block.math.sourceRaw}\\)` : block.type === "figure" ? `[FIGURE:${block.figureId}]` : block.cells.map(row => row.map(cell => packageText([cell])).join(" & ")).join(" \\\\ ")).join("");
export function createQuestionPackage(question: QuestionIR, assets: AssetLedgerEntry[] = []): QuestionPackage {
  return { id: question.id, directoryName: `question-${question.id}`, question, questionTex: packageText(question.stem), solutionTex: question.solution ? packageText(question.solution) : "", metadata: { id: question.id, questionType: question.questionType, sourceDocumentId: question.sourceDocumentId }, assets: assets.filter(asset => question.assetIds.includes(asset.assetId)), mathObjectIds: [...question.mathObjectIds], sourceObjectIds: [...question.sourceObjectIds], provenance: question.provenance, qaStatus: question.qaStatus, extractionIssues: [...question.issues] };
}
export const serializeQuestionPackage = (pkg: QuestionPackage) => JSON.stringify(pkg, (_key, value) => value instanceof Uint8Array ? { $type: "Uint8Array", base64: Buffer.from(value).toString("base64") } : value, 2);

export function evaluatePreservationStatus(issues: readonly ExtractionIssue[], counts?: Pick<LedgerDiagnostics, "sourceMathCount" | "extractedMathCount" | "documentIrMathCount" | "questionIrMathCount" | "questionPackageMathCount" | "sourceAssetCount" | "extractedAssetCount" | "documentIrAssetCount" | "questionPackageAssetCount">): PreservationStatus {
  if (issues.some(issue => issue.status === "QUARANTINED")) return "QUARANTINED";
  if (issues.some(issue => issue.status === "UNSUPPORTED")) return "UNSUPPORTED";
  if (issues.some(issue => issue.status === "REVIEW")) return "REVIEW";
  if (counts && (counts.sourceMathCount !== counts.extractedMathCount || counts.extractedMathCount !== counts.documentIrMathCount || counts.documentIrMathCount !== counts.questionPackageMathCount || counts.sourceAssetCount !== counts.extractedAssetCount || counts.extractedAssetCount !== counts.documentIrAssetCount || counts.documentIrAssetCount !== counts.questionPackageAssetCount)) return "REVIEW";
  return "PASS";
}

export function documentLedger(document: DocumentIR): MathAssetLedger {
  const math = document.mathObjects ?? [];
  const assets = document.assetObjects ?? [];
  const issues = document.extractionIssues ?? [];
  const diagnostics = { sourceMathCount: math.length, extractedMathCount: math.length, documentIrMathCount: math.length, questionIrMathCount: 0, questionPackageMathCount: math.length, sourceAssetCount: assets.length, extractedAssetCount: assets.length, documentIrAssetCount: assets.length, questionPackageAssetCount: assets.length };
  return { diagnostics, math, assets, status: evaluatePreservationStatus(issues, diagnostics), issues };
}
