import type { ContentBlock, DocumentIR, ImportCandidate } from "../types.js";

export type RecognitionSourceType = "OMML" | "MATHTYPE" | "EQUATION_IMAGE" | "SCANNED_PAGE" | "MANUAL";
export type RecognitionPolicy = "DRY_RUN" | "LOCAL_ONLY" | "EXTERNAL_PROVIDER_ALLOWED";
export type RecognitionTier = "HIGH_CONFIDENCE" | "MEDIUM_CONFIDENCE" | "LOW_CONFIDENCE";

export interface BoundingBox { x: number; y: number; width: number; height: number; page?: number }
export interface RecognitionInput {
  bytes?: Uint8Array;
  mimeType?: string;
  sourceType: RecognitionSourceType;
  sourceAssetId?: string;
  sourceHash: string;
  plainTextHint?: string;
  nativeLatex?: string;
  policy: RecognitionPolicy;
  settings?: Record<string, string | number | boolean>;
}
export interface RecognitionResult {
  provider: string;
  providerVersion: string;
  sourceType: RecognitionSourceType;
  plainText: string;
  latex?: string;
  confidence: number;
  boundingBox?: BoundingBox;
  sourceAssetId?: string;
  warnings: string[];
  requiresReview: boolean;
  rawEvidenceReference: string;
}
export interface MathRecognitionProvider {
  readonly id: string;
  readonly version: string;
  readonly priority: number;
  readonly external: boolean;
  supports(input: RecognitionInput): boolean;
  recognize(input: RecognitionInput): Promise<RecognitionResult | undefined>;
}
export interface RecognitionCache {
  get(key: string): RecognitionResult | undefined;
  set(key: string, result: RecognitionResult): void;
}
export interface PageOCRProvider extends MathRecognitionProvider {}
export interface OrderedPageBlock { order: number; content: ContentBlock[]; boundingBox: BoundingBox; confidence: number; role?: "BODY" | "HEADER" | "FOOTER" | "ADMINISTRATIVE" }
export interface ScannedPageInput { page: number; assetId: string; assetHash: string; bytes: Uint8Array; mimeType: string; width: number; height: number }
export interface ScannedDocumentResult { document: DocumentIR; candidates: ImportCandidate[]; recognition: RecognitionResult[] }

