export const VI_LANGUAGE_VALIDATOR_ID = "VIETNAMESE_LANGUAGE";
export const VI_UNIT_PATTERN = String.raw`(?:mm|cm|dm|km|m)(?:²|³|\^[23])?`;

export interface SafeSuggestionDetails {
  original: string;
  suggested: string;
  ruleId: string;
  confidence: "HIGH" | "MEDIUM";
  start?: number;
  end?: number;
}

