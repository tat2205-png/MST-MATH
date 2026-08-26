export type ImageMathClass = "EQUATION" | "FIGURE" | "GRAPH" | "TABLE_IMAGE" | "TEXT_IMAGE" | "MIXED" | "UNKNOWN";
export interface ImageClassificationInput { width: number; height: number; mimeType: string; nearbyText?: string; relationshipType?: string; embeddedObjectType?: string; monochromeRatio?: number; edgeDensity?: number }
export interface ImageClassification { classification: ImageMathClass; confidence: number; evidence: string[] }
export function classifyMathImage(input: ImageClassificationInput): ImageClassification {
  const evidence: string[] = []; const context = input.nearbyText ?? ""; const ratio = input.width / Math.max(1, input.height);
  if (/equation|mathtype/iu.test(`${input.relationshipType ?? ""} ${input.embeddedObjectType ?? ""}`)) return { classification: "EQUATION", confidence: 0.98, evidence: ["EMBEDDED_EQUATION_METADATA"] };
  if (/bảng|table/iu.test(context) && ratio > 0.7) return { classification: "TABLE_IMAGE", confidence: 0.82, evidence: ["TABLE_CONTEXT"] };
  if (/đồ thị|graph|hàm số/iu.test(context)) return { classification: "GRAPH", confidence: 0.84, evidence: ["GRAPH_CONTEXT"] };
  if (/hình|tam giác|đường tròn|geometry/iu.test(context)) return { classification: "FIGURE", confidence: 0.86, evidence: ["FIGURE_CONTEXT"] };
  if (ratio >= 2.2 && (input.monochromeRatio ?? 0) >= 0.75) { evidence.push("WIDE_MONOCHROME_GLYPH_BAND"); return { classification: "EQUATION", confidence: 0.8, evidence }; }
  if (input.height > input.width * 1.2 && (input.monochromeRatio ?? 0) >= 0.7) return { classification: "TEXT_IMAGE", confidence: 0.68, evidence: ["PORTRAIT_TEXT_LIKE_LAYOUT"] };
  return { classification: "UNKNOWN", confidence: 0.25, evidence: ["INSUFFICIENT_STRUCTURAL_EVIDENCE"] };
}

