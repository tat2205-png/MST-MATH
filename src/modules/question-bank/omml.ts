import type { MathNode } from "./types.js";
const decode = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
const inner = (xml: string, tag: string) => new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i").exec(xml)?.[1];
const text = (xml: string) => [...xml.matchAll(/<m:t\b[^>]*>([\s\S]*?)<\/m:t>/gi)].map((x) => decode(x[1])).join("");
const symbol = (s: string) => s.replace(/∞/g, "\\infty ").replace(/∑/g, "\\sum ").replace(/∫/g, "\\int ").replace(/≤/g, "\\le ").replace(/≥/g, "\\ge ").replace(/≠/g, "\\ne ").replace(/→/g, "\\to ").replace(/⊥/g, "\\perp ").replace(/∈/g, "\\in ").replace(/ℝ/g, "\\mathbb{R}").replace(/α/g, "\\alpha ").replace(/β/g, "\\beta ").replace(/π/g, "\\pi ");
function convert(xml: string, warnings: string[]): string {
  const replacements: Array<[RegExp, (match: string) => string]> = [
    [/<m:f\b[^>]*>[\s\S]*?<\/m:f>/i, (m) => `\\frac{${convert(inner(m, "m:num") ?? "", warnings)}}{${convert(inner(m, "m:den") ?? "", warnings)}}`],
    [/<m:rad\b[^>]*>[\s\S]*?<\/m:rad>/i, (m) => { const degree = convert(inner(m, "m:deg") ?? "", warnings); const body = convert(inner(m, "m:e") ?? "", warnings); return degree ? `\\sqrt[${degree}]{${body}}` : `\\sqrt{${body}}`; }],
    [/<m:sSup\b[^>]*>[\s\S]*?<\/m:sSup>/i, (m) => `{${convert(inner(m, "m:e") ?? "", warnings)}}^{${convert(inner(m, "m:sup") ?? "", warnings)}}`],
    [/<m:sSub\b[^>]*>[\s\S]*?<\/m:sSub>/i, (m) => `{${convert(inner(m, "m:e") ?? "", warnings)}}_{${convert(inner(m, "m:sub") ?? "", warnings)}}`],
    [/<m:sSubSup\b[^>]*>[\s\S]*?<\/m:sSubSup>/i, (m) => `{${convert(inner(m, "m:e") ?? "", warnings)}}_{${convert(inner(m, "m:sub") ?? "", warnings)}}^{${convert(inner(m, "m:sup") ?? "", warnings)}}`],
    [/<m:nary\b[^>]*>[\s\S]*?<\/m:nary>/i, (m) => `${symbol((/<m:chr[^>]*m:val="([^"]+)"/i.exec(m)?.[1] ?? "∑"))}_{${convert(inner(m, "m:sub") ?? "", warnings)}}^{${convert(inner(m, "m:sup") ?? "", warnings)}} ${convert(inner(m, "m:e") ?? "", warnings)}`],
    [/<m:m\b[^>]*>[\s\S]*?<\/m:m>/i, (m) => { const rows = [...m.matchAll(/<m:mr\b[^>]*>([\s\S]*?)<\/m:mr>/gi)].map((r) => [...r[1].matchAll(/<m:e\b[^>]*>([\s\S]*?)<\/m:e>/gi)].map((c) => convert(c[1], warnings)).join(" & ")); return `\\begin{matrix}${rows.join(" \\\\ ")}\\end{matrix}`; }],
  ];
  let value = xml;
  for (const [pattern, fn] of replacements) { let match; while ((match = pattern.exec(value))) value = value.slice(0, match.index) + fn(match[0]) + value.slice(match.index + match[0].length); }
  const runs = [...value.matchAll(/<m:t\b[^>]*>([\s\S]*?)<\/m:t>/gi)].map((x) => symbol(decode(x[1]))).join("");
  if (!runs && /<m:[a-z]/i.test(value) && !/^\s*<\/?m:(?:oMath|oMathPara|e|num|den|deg|sup|sub|r)\b/i.test(value)) warnings.push("UNSUPPORTED_OMML");
  return runs || symbol(decode(value.replace(/<[^>]+>/g, "")));
}
export function parseOmml(sourceRaw: string, sourceLocation: string): MathNode {
  const warnings: string[] = []; const latex = convert(sourceRaw, warnings).trim();
  return { sourceType: "OMML", sourceRaw, latex: latex || undefined, normalized: latex || undefined, parseStatus: latex ? (warnings.length ? "UNSUPPORTED" : "PARSED") : "UNRESOLVED", warnings: [...new Set(warnings)], sourceLocation };
}
