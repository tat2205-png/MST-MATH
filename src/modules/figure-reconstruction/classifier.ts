import type { FigureKind } from "../figure-exam-foundation/contracts.js";
import type { FigureClassification, FigureClassificationInput } from "./contracts.js";

const names: Array<[FigureKind, RegExp]> = [
  ["VARIATION_DIAGRAM", /variation|monotonic|bảng biến thiên/i], ["FUNCTION_GRAPH_2D", /function|graph|đồ thị|hàm số/i],
  ["COORDINATE_3D", /coordinate.?3d|3d|xyz|trục không gian/i], ["COORDINATE_2D", /coordinate|tọa độ|xy|axis|trục/i],
  ["GEOMETRY_3D", /polyhedron|cube|prism|pyramid|hình hộp|lăng trụ|chóp/i], ["GEOMETRY_2D", /geometry|triangle|circle|polygon|tam giác|đường tròn/i],
  ["FOLD_DIAGRAM", /fold|net|triển khai|gấp/i], ["GRID_PATTERN", /grid|lưới|ô vuông/i], ["NODE_DIAGRAM", /node|network|sơ đồ nút/i], ["TABLE", /table|bảng/i]
];
export function classifyFigure(input: FigureClassificationInput): FigureClassification {
  const text = [input.source?.caption, input.source?.mediaPath].filter(Boolean).join(" ");
  const match = names.find(([, pattern]) => pattern.test(text));
  if (!match) return { semanticKind: "OTHER_UNKNOWN", confidence: 0, evidence: [], issues: ["SEMANTIC_KIND_UNRESOLVED"], status: "REVIEW" };
  return { semanticKind: match[0], confidence: 0.9, evidence: [`matched source metadata: ${text}`], issues: [], status: "PASS" };
}
