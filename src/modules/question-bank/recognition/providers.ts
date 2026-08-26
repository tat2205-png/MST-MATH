import type { MathRecognitionProvider, RecognitionInput, RecognitionResult } from "./types.js";

export class NativeOmmlProvider implements MathRecognitionProvider {
  readonly id = "native-omml"; readonly version = "1"; readonly priority = 10; readonly external = false;
  supports(input: RecognitionInput): boolean { return input.sourceType === "OMML" && Boolean(input.nativeLatex); }
  async recognize(input: RecognitionInput): Promise<RecognitionResult> { return { provider: this.id, providerVersion: this.version, sourceType: input.sourceType, plainText: input.plainTextHint ?? "", latex: input.nativeLatex, confidence: 1, sourceAssetId: input.sourceAssetId, warnings: [], requiresReview: true, rawEvidenceReference: input.sourceAssetId ?? `sha256:${input.sourceHash}` }; }
}
export class NativeMathTypeProvider implements MathRecognitionProvider {
  readonly id = "native-mathtype"; readonly version = "1"; readonly priority = 20; readonly external = false;
  supports(input: RecognitionInput): boolean { return input.sourceType === "MATHTYPE" && Boolean(input.nativeLatex); }
  async recognize(input: RecognitionInput): Promise<RecognitionResult> { return { provider: this.id, providerVersion: this.version, sourceType: input.sourceType, plainText: input.plainTextHint ?? "", latex: input.nativeLatex, confidence: 0.99, sourceAssetId: input.sourceAssetId, warnings: [], requiresReview: true, rawEvidenceReference: input.sourceAssetId ?? `sha256:${input.sourceHash}` }; }
}
export class ManualFallbackProvider implements MathRecognitionProvider {
  readonly id = "manual"; readonly version = "1"; readonly priority = 1000; readonly external = false;
  supports(): boolean { return true; }
  async recognize(input: RecognitionInput): Promise<RecognitionResult> { return { provider: this.id, providerVersion: this.version, sourceType: "MANUAL", plainText: input.plainTextHint ?? "", confidence: 0, sourceAssetId: input.sourceAssetId, warnings: ["MANUAL_RECOGNITION_REQUIRED"], requiresReview: true, rawEvidenceReference: input.sourceAssetId ?? `sha256:${input.sourceHash}` }; }
}
