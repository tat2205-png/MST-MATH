import type { DocumentEngineIssue } from "../types.js";
import { childElements, descendants, getAttribute, localName, textContent, type XmlNode } from "../xml.js";

export interface OmmlConversionResult {
  status: "PASS" | "PARTIAL" | "FAIL";
  latex?: string;
  rawText: string;
  issues: DocumentEngineIssue[];
}

const symbolMap: Record<string, string> = {
  "≤": "\\le", "≥": "\\ge", "≠": "\\ne", "∈": "\\in", "⊂": "\\subset",
  "∥": "\\parallel", "⊥": "\\perp", "×": "\\times", "÷": "\\div", "±": "\\pm",
  "∞": "\\infty", "π": "\\pi", "α": "\\alpha", "β": "\\beta", "γ": "\\gamma",
  "δ": "\\delta", "Δ": "\\Delta", "θ": "\\theta", "λ": "\\lambda", "μ": "\\mu", "σ": "\\sigma",
};

function escapeMathText(value: string): string {
  return [...value].map((char) => symbolMap[char] ?? ({ "{": "\\{", "}": "\\}", "#": "\\#", "%": "\\%", "&": "\\&" }[char] ?? char)).join("");
}

function firstChild(node: XmlNode, name: string): XmlNode | undefined {
  return childElements(node).find((child) => localName(child.name) === name);
}

function convertChildren(node: XmlNode, issues: DocumentEngineIssue[], path: string): string {
  return childElements(node).map((child, index) => convertNode(child, issues, `${path}/${localName(child.name)}[${index}]`)).join("");
}

function wrappedArgument(node: XmlNode | undefined, issues: DocumentEngineIssue[], path: string): string {
  return node ? convertChildren(node, issues, path) : "";
}

function convertNode(node: XmlNode, issues: DocumentEngineIssue[], path: string): string {
  const name = localName(node.name);
  switch (name) {
    case "oMath": case "oMathPara": case "e": case "num": case "den": case "sup": case "sub": case "deg": case "lim": case "fName": case "mr":
      return convertChildren(node, issues, path);
    case "r": return descendants(node, "t").map(textContent).map(escapeMathText).join("");
    case "t": return escapeMathText(textContent(node));
    case "f": return `\\frac{${wrappedArgument(firstChild(node, "num"), issues, `${path}/num`)}}{${wrappedArgument(firstChild(node, "den"), issues, `${path}/den`)}}`;
    case "sSup": return `{${wrappedArgument(firstChild(node, "e"), issues, `${path}/e`)}}^{${wrappedArgument(firstChild(node, "sup"), issues, `${path}/sup`)}}`;
    case "sSub": return `{${wrappedArgument(firstChild(node, "e"), issues, `${path}/e`)}}_{${wrappedArgument(firstChild(node, "sub"), issues, `${path}/sub`)}}`;
    case "sSubSup": return `{${wrappedArgument(firstChild(node, "e"), issues, `${path}/e`)}}_{${wrappedArgument(firstChild(node, "sub"), issues, `${path}/sub`)}}^{${wrappedArgument(firstChild(node, "sup"), issues, `${path}/sup`)}}`;
    case "limUpp": return `${wrappedArgument(firstChild(node, "e"), issues, `${path}/e`)}^{${wrappedArgument(firstChild(node, "lim"), issues, `${path}/lim`)}}`;
    case "acc": {
      const chr = getAttribute(firstChild(firstChild(node, "accPr") ?? node, "chr"), "val");
      const body = wrappedArgument(firstChild(node, "e"), issues, `${path}/e`);
      return `${chr === "⃗" ? "\\vec" : "\\widehat"}{${body}}`;
    }
    case "bar": return `\\overline{${wrappedArgument(firstChild(node, "e"), issues, `${path}/e`)}}`;
    case "box": case "groupChr": return wrappedArgument(firstChild(node, "e"), issues, `${path}/e`);
    case "rad": {
      const degree = wrappedArgument(firstChild(node, "deg"), issues, `${path}/deg`);
      const body = wrappedArgument(firstChild(node, "e"), issues, `${path}/e`);
      return degree ? `\\sqrt[${degree}]{${body}}` : `\\sqrt{${body}}`;
    }
    case "d": {
      const properties = firstChild(node, "dPr");
      const begin = properties ? getAttribute(firstChild(properties, "begChr") ?? properties, "val") ?? "(" : "(";
      const end = properties ? getAttribute(firstChild(properties, "endChr") ?? properties, "val") ?? ")" : ")";
      const body = wrappedArgument(firstChild(node, "e"), issues, `${path}/e`);
      if (begin === "|" && end === "|") return `\\left|${body}\\right|`;
      const delimiters: Record<string, string> = { "[": "[", "]": "]", "{": "\\{", "}": "\\}" };
      return `\\left${delimiters[begin] ?? begin}${body}\\right${delimiters[end] ?? end}`;
    }
    case "func": return `${wrappedArgument(firstChild(node, "fName"), issues, `${path}/fName`)} ${wrappedArgument(firstChild(node, "e"), issues, `${path}/e`)}`;
    case "nary": {
      const properties = firstChild(node, "naryPr");
      const character = properties ? getAttribute(firstChild(properties, "chr") ?? properties, "val") : undefined;
      const command = character === "∫" ? "\\int" : character === "∏" ? "\\prod" : "\\sum";
      const lower = wrappedArgument(firstChild(node, "sub"), issues, `${path}/sub`);
      const upper = wrappedArgument(firstChild(node, "sup"), issues, `${path}/sup`);
      return `${command}${lower ? `_{${lower}}` : ""}${upper ? `^{${upper}}` : ""} ${wrappedArgument(firstChild(node, "e"), issues, `${path}/e`)}`;
    }
    case "limLow": return `\\lim_{${wrappedArgument(firstChild(node, "lim"), issues, `${path}/lim`)}} ${wrappedArgument(firstChild(node, "e"), issues, `${path}/e`)}`;
    case "m": {
      const rows = childElements(node, "mr").map((row) => childElements(row, "e").map((cell) => convertChildren(cell, issues, `${path}/cell`)).join(" & "));
      return `\\begin{matrix}${rows.join(" \\\\ ")}\\end{matrix}`;
    }
    case "ctrlPr": case "rPr": case "fPr": case "radPr": case "sSupPr": case "sSubPr": case "sSubSupPr": case "dPr": case "naryPr": case "limLowPr": case "mPr":
      return "";
    default:
      issues.push({ code: "UNSUPPORTED_OMML_CONSTRUCT", severity: "warning", path, message: `Unsupported OMML element: ${name}` });
      return `\\text{[unsupported OMML: ${name}]}`;
  }
}

export function ommlToLatex(node: XmlNode, sourcePath = "OMML"): OmmlConversionResult {
  const issues: DocumentEngineIssue[] = [];
  if (!["oMath", "oMathPara"].includes(localName(node.name))) return { status: "FAIL", rawText: textContent(node), issues: [{ code: "INVALID_OMML", severity: "error", path: sourcePath, message: "Expected an OMML math root." }] };
  const latex = convertNode(node, issues, sourcePath).trim();
  if (!latex) issues.push({ code: "INVALID_OMML", severity: "error", path: sourcePath, message: "OMML expression is empty." });
  return { status: issues.some((issue) => issue.severity === "error") ? "FAIL" : issues.length ? "PARTIAL" : "PASS", latex: latex || undefined, rawText: textContent(node), issues };
}
