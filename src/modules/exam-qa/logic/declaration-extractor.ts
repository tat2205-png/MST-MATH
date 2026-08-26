import type { LogicDeclaration, MathEntityKind } from "./logic-rules.js";
import { extractGeometryReferences, extractPointLabels } from "./symbol-extractor.js";

export function extractImpliedGeometrySymbols(text: string): Array<{ name: string; kind: MathEntityKind; start: number }> {
  const symbols: Array<{ name: string; kind: MathEntityKind; start: number }> = [];
  const pattern = /(?:hình chóp|lăng trụ|tam giác|tứ giác|tứ diện|hình bình hành|đoạn thẳng|đáy)\s+([A-ZĐ][A-ZĐ0-9_₀-₉'’′.]*)/giu;
  for (const match of text.matchAll(pattern)) {
    const token = match[1].replace(/[.]$/, "");
    extractPointLabels(token).forEach((name) => symbols.push({ name, kind: "POINT", start: match.index ?? 0 }));
  }
  return symbols;
}

export function extractDeclarations(text: string): LogicDeclaration[] {
  const declarations: LogicDeclaration[] = [];
  const pattern = /gọi\s+(\(([A-ZĐ])\)|([A-ZĐ](?:['’′]|[₀-₉]+|_\d+|\d+)?))\s+là\s+([^.!?]+)/giu;
  for (const match of text.matchAll(pattern)) {
    const name = match[2] || match[3];
    const definition = match[4].trim();
    let kind: MathEntityKind = match[2] || /mặt phẳng/iu.test(definition) ? "PLANE" : "POINT";
    if (/đường thẳng/iu.test(definition)) kind = "LINE";
    const dependsOn = extractGeometryReferences(definition).filter((symbol) => symbol !== name || /trung điểm|giao điểm/iu.test(definition));
    declarations.push({ name, kind, dependsOn, definition, start: match.index ?? 0, end: (match.index ?? 0) + match[0].length });
  }
  return declarations;
}

