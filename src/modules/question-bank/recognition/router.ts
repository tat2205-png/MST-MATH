import { canonicalizeLatex } from "./latex.js";
import { MemoryRecognitionCache, recognitionCacheKey } from "./cache.js";
import type { MathRecognitionProvider, RecognitionCache, RecognitionInput, RecognitionResult, RecognitionTier } from "./types.js";

export class MathRecognitionRouter {
  private readonly providers: MathRecognitionProvider[];
  constructor(providers: MathRecognitionProvider[], private readonly cache: RecognitionCache = new MemoryRecognitionCache()) { this.providers = [...providers].sort((a, b) => a.priority - b.priority); }
  async recognize(input: RecognitionInput): Promise<RecognitionResult> {
    for (const provider of this.providers) {
      if (!provider.supports(input) || (provider.external && input.policy !== "EXTERNAL_PROVIDER_ALLOWED")) continue;
      const key = recognitionCacheKey(input, provider.id, provider.version); const cached = this.cache.get(key); if (cached) return cached;
      const result = await provider.recognize(input); if (!result) continue;
      const latex = result.confidence >= 0.5 && result.latex ? canonicalizeLatex(result.latex) : undefined;
      const normalized = { ...result, latex, confidence: Math.max(0, Math.min(1, result.confidence)), requiresReview: true, warnings: [...result.warnings, ...(result.latex && !latex ? ["LATEX_REJECTED_LOW_CONFIDENCE_OR_INVALID"] : [])] };
      this.cache.set(key, normalized); return normalized;
    }
    return { provider: "manual", providerVersion: "1", sourceType: "MANUAL", plainText: input.plainTextHint ?? "", confidence: 0, sourceAssetId: input.sourceAssetId, warnings: ["NO_RECOGNITION_PROVIDER_AVAILABLE"], requiresReview: true, rawEvidenceReference: input.sourceAssetId ?? `sha256:${input.sourceHash}` };
  }
}
export function recognitionTier(confidence: number): RecognitionTier { return confidence >= 0.85 ? "HIGH_CONFIDENCE" : confidence >= 0.55 ? "MEDIUM_CONFIDENCE" : "LOW_CONFIDENCE"; }
export function recognitionStatus(confidence: number): "REVIEW" | "QUARANTINED" { return recognitionTier(confidence) === "LOW_CONFIDENCE" ? "QUARANTINED" : "REVIEW"; }

