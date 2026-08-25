export interface OmmlConversion { latex: string; supported: boolean; warnings: string[]; evidence: string }
type XmlNode = Record<string, unknown>;
const children = (node: unknown, name?: string): XmlNode[] => !Array.isArray(node) ? [] : node.flatMap((item) => typeof item === "object" && item !== null ? Object.entries(item as XmlNode).filter(([key]) => key !== ":@" && (!name || key === name)).flatMap(([, value]) => Array.isArray(value) ? value as XmlNode[] : []) : []);
const findChildren = (node: unknown, name: string): XmlNode[] => children(node, name);
const childGroups = (node: unknown, name: string): unknown[][] => !Array.isArray(node) ? [] : node.flatMap((item) => typeof item === "object" && item !== null ? Object.entries(item as XmlNode).filter(([key]) => key === name).map(([, value]) => Array.isArray(value) ? value : []) : []);
const symbol = (value: string) => value.replace(/∞/g, "\\infty").replace(/→/g, "\\to ").replace(/⊥/g, "\\perp ").replace(/∑/g, "\\sum").replace(/∫/g, "\\int").replace(/√/g, "\\sqrt{}");
const textOf = (node: unknown): string => {
  if (!Array.isArray(node)) return "";
  return node.map((item) => { if (typeof item !== "object" || item === null) return ""; return Object.entries(item as XmlNode).map(([key, value]) => key === "#text" ? String(value) : key === ":@" ? "" : textOf(value)).join(""); }).join("");
};
function attrs(node: XmlNode): Record<string, string> { return (node[":@"] ?? {}) as Record<string, string>; }
function findAttribute(node: unknown, tag: string, attribute: string): string | undefined { for (const [key, value, holder] of entriesFor(node)) { if (key === tag) return attrs(holder)[attribute]; const nested = findAttribute(value, tag, attribute); if (nested) return nested; } return undefined; }
function entriesFor(node: unknown): Array<[string, unknown, XmlNode]> { return !Array.isArray(node) ? [] : node.flatMap((item) => typeof item === "object" && item !== null ? Object.entries(item as XmlNode).filter(([key]) => key !== ":@").map(([key, value]) => [key, value, item as XmlNode] as [string, unknown, XmlNode]) : []); }
function renderList(list: unknown, warnings: string[]): string {
  if (!Array.isArray(list)) return "";
  return list.map((item) => {
    if (typeof item !== "object" || item === null) return "";
    return Object.entries(item as XmlNode).map(([key, value]) => {
      if (key === ":@") return "";
      if (key === "m:t" || key === "w:t") return symbol(textOf(value));
      if (key === "m:r" || key === "m:e" || key === "m:num" || key === "m:den" || key === "m:sub" || key === "m:sup" || key === "m:deg" || key === "m:fName") return renderList(value, warnings);
      if (key === "m:sSup") { const b = renderList(findChildren(value, "m:e"), warnings), s = renderList(findChildren(value, "m:sup"), warnings); return `${b}^{${s}}`; }
      if (key === "m:sSub") { const b = renderList(findChildren(value, "m:e"), warnings), s = renderList(findChildren(value, "m:sub"), warnings); return `${b}_{${s}}`; }
      if (key === "m:sSubSup") { const b = renderList(findChildren(value, "m:e"), warnings), sub = renderList(findChildren(value, "m:sub"), warnings), sup = renderList(findChildren(value, "m:sup"), warnings); return `${b}_{${sub}}^{${sup}}`; }
      if (key === "m:f") return `\\frac{${renderList(findChildren(value, "m:num"), warnings)}}{${renderList(findChildren(value, "m:den"), warnings)}}`;
      if (key === "m:rad") { const degree = renderList(findChildren(value, "m:deg"), warnings); return `\\sqrt${degree ? `[${degree}]` : ""}{${renderList(findChildren(value, "m:e"), warnings)}}`; }
      if (key === "m:func") return `${renderList(findChildren(value, "m:fName"), warnings)}${renderList(findChildren(value, "m:e"), warnings)}`;
      if (key === "m:limLow") return `${renderList(findChildren(value, "m:e"), warnings)}_{${renderList(findChildren(value, "m:lim"), warnings)}}`;
      if (key === "m:limUpp") return `${renderList(findChildren(value, "m:e"), warnings)}^{${renderList(findChildren(value, "m:lim"), warnings)}}`;
      if (key === "m:nary") { const chr = findAttribute(value, "m:chr", "@_m:val") ?? "∫"; const op = symbol(chr); const sub = renderList(findChildren(value, "m:sub"), warnings), sup = renderList(findChildren(value, "m:sup"), warnings); return `${op}${sub ? `_{${sub}}` : ""}${sup ? `^{${sup}}` : ""}${renderList(findChildren(value, "m:e"), warnings)}`; }
      if (key === "m:d") { const beg = findAttribute(value, "m:begChr", "@_m:val") ?? "(", end = findAttribute(value, "m:endChr", "@_m:val") ?? ")"; return `${beg}${renderList(findChildren(value, "m:e"), warnings)}${end}`; }
      if (key === "m:acc") { const body = renderList(findChildren(value, "m:e"), warnings); const char = findAttribute(value, "m:chr", "@_m:val") ?? ""; return char.includes("⃗") || char.includes("→") ? `\\vec{${body}}` : `\\widehat{${body}}`; }
      if (key === "m:m") { const rows = childGroups(value, "m:mr").map((row) => childGroups(row, "m:e").map((cell) => renderList(cell, warnings)).join(" & ")); return `\\begin{matrix}${rows.join(" \\\\ ")}\\end{matrix}`; }
      if (key === "m:eqArr") return `\\begin{aligned}${childGroups(value, "m:e").map((row) => renderList(row, warnings)).join(" \\\\ ")}\\end{aligned}`;
      if (key.startsWith("m:")) { const transparent = new Set(["m:oMath", "m:oMathPara", "m:ctrlPr", "m:rPr", "m:naryPr", "m:dPr", "m:accPr"]); if (!transparent.has(key) && !key.endsWith("Pr")) warnings.push(`UNSUPPORTED_OMML:${key}`); return renderList(value, warnings); }
      return "";
    }).join("");
  }).join("");
}
export function convertOmml(node: unknown): OmmlConversion { const warnings: string[] = []; const evidence = JSON.stringify(node); const latex = renderList(node, warnings).replace(/\s+/g, " ").trim(); if (!latex) warnings.push("EMPTY_OMML_RESULT"); return { latex, supported: warnings.length === 0 && latex.length > 0, warnings: [...new Set(warnings)], evidence }; }
