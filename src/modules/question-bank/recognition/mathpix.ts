import type { MathRecognitionProvider, RecognitionInput, RecognitionResult } from "./types.js";

export interface MathpixConfiguration { appId?: string; appKey?: string; endpoint?: string }
export class MathpixProvider implements MathRecognitionProvider {
  readonly id = "mathpix"; readonly version = "v3-text"; readonly priority = 300; readonly external = true;
  constructor(private readonly config: MathpixConfiguration = { appId: process.env.MATHPIX_APP_ID, appKey: process.env.MATHPIX_APP_KEY }) {}
  get runtime(): "CONFIGURED" | "NOT_CONFIGURED" { return this.config.appId && this.config.appKey ? "CONFIGURED" : "NOT_CONFIGURED"; }
  supports(input: RecognitionInput): boolean { return this.runtime === "CONFIGURED" && Boolean(input.bytes) && ["EQUATION_IMAGE", "SCANNED_PAGE"].includes(input.sourceType); }
  async recognize(input: RecognitionInput): Promise<RecognitionResult | undefined> {
    if (!this.supports(input) || input.policy !== "EXTERNAL_PROVIDER_ALLOWED") return undefined;
    const response = await fetch(this.config.endpoint ?? "https://api.mathpix.com/v3/text", { method: "POST", headers: { "Content-Type": "application/json", app_id: this.config.appId!, app_key: this.config.appKey! }, body: JSON.stringify({ src: `data:${input.mimeType};base64,${Buffer.from(input.bytes!).toString("base64")}`, formats: ["text", "latex_styled"] }) });
    if (!response.ok) throw new Error(`Math recognition provider returned HTTP ${response.status}`);
    const body = await response.json() as { text?: string; latex_styled?: string; confidence?: number };
    return { provider: this.id, providerVersion: this.version, sourceType: input.sourceType, plainText: body.text ?? "", latex: body.latex_styled, confidence: body.confidence ?? 0, sourceAssetId: input.sourceAssetId, warnings: [], requiresReview: true, rawEvidenceReference: input.sourceAssetId ?? `sha256:${input.sourceHash}` };
  }
}

