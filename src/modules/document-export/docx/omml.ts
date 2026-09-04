import { NA_MATH_STANDARD_V2_6 } from "../../../config/naMathStandardV26.js";
import type { MathNode } from "../../document-engine/document-ir.js";
import { prepareMstMathNotation } from "../../math-notation/authority.js";
import { DocxRenderError } from "./types.js";
import { escapeXml } from "./xml.js";

type Token = { kind: "command" | "char" | "open" | "close" | "openBracket" | "closeBracket" | "sup" | "sub"; value: string };
const entities: Record<string, string> = {
  perp: "&#x27C2;", parallel: "&#x2225;", in: "&#x2208;", notin: "&#x2209;", subset: "&#x2282;", subseteq: "&#x2286;", subsetneq: "&#x228A;",
  cap: "&#x2229;", cup: "&#x222A;", Rightarrow: "&#x21D2;", Leftrightarrow: "&#x21D4;", forall: "&#x2200;", exists: "&#x2203;",
  ne: "&#x2260;", neq: "&#x2260;", le: "&#x2264;", leq: "&#x2264;", ge: "&#x2265;", geq: "&#x2265;", approx: "&#x2248;", equiv: "&#x2261;",
  pm: "&#x00B1;", angle: "&#x2220;", infty: "&#x221E;", Omega: "&#x03A9;", sum: "&#x2211;", prod: "&#x220F;", int: "&#x222B;",
  to: "&#x2192;", circ: "&#x00B0;", cdot: "&#x22C5;", mid: "&#x2223;",
};

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  for (let index = 0; index < source.length;) {
    const char = source[index];
    if (char === "\\") {
      const match = /^\\([A-Za-z]+|.)/.exec(source.slice(index));
      if (!match) throw new DocxRenderError("OMML_TOKENIZE_FAILED", `Invalid command at ${index}.`);
      tokens.push({ kind: "command", value: match[1] }); index += match[0].length; continue;
    }
    const kinds: Record<string, Token["kind"]> = { "{": "open", "}": "close", "[": "openBracket", "]": "closeBracket", "^": "sup", "_": "sub" };
    tokens.push({ kind: kinds[char] ?? "char", value: char }); index++;
  }
  return tokens;
}

const run = (value: string, entity = false) => `<m:r><m:t>${entity ? value : escapeXml(value)}</m:t></m:r>`;

class OmmlParser {
  private index = 0;
  constructor(private readonly tokens: Token[]) {}

  parse(stop?: Token["kind"]): string {
    let result = "";
    while (this.index < this.tokens.length && this.tokens[this.index].kind !== stop) result += this.atomWithScripts();
    if (stop) {
      if (this.tokens[this.index]?.kind !== stop) throw new DocxRenderError("OMML_GROUP_UNCLOSED", "Unclosed canonical math group.");
      this.index++;
    }
    return result;
  }

  private group(bracket = false): string {
    const open = bracket ? "openBracket" : "open";
    const close = bracket ? "closeBracket" : "close";
    if (this.tokens[this.index]?.kind !== open) return this.atomWithScripts();
    this.index++;
    return this.parse(close);
  }

  private atomWithScripts(): string {
    let base = this.atom();
    let sub: string | undefined;
    let sup: string | undefined;
    while (this.tokens[this.index]?.kind === "sub" || this.tokens[this.index]?.kind === "sup") {
      const kind = this.tokens[this.index++].kind;
      const value = this.group();
      if (kind === "sub") sub = value; else sup = value;
    }
    if (sub && sup) return `<m:sSubSup><m:e>${base}</m:e><m:sub>${sub}</m:sub><m:sup>${sup}</m:sSubSup>`;
    if (sub) return `<m:sSub><m:e>${base}</m:e><m:sub>${sub}</m:sub></m:sSub>`;
    if (sup) return `<m:sSup><m:e>${base}</m:e><m:sup>${sup}</m:sup></m:sSup>`;
    return base;
  }

  private atom(): string {
    const token = this.tokens[this.index++];
    if (!token) return "";
    if (token.kind === "open") return this.parse("close");
    if (token.kind === "openBracket") return run("[") + this.parse("closeBracket") + run("]");
    if (token.kind === "close" || token.kind === "closeBracket") throw new DocxRenderError("OMML_GROUP_UNEXPECTED_CLOSE", "Unexpected canonical math group close.");
    if (token.kind === "char") return run(token.value);
    if (token.kind !== "command") return "";
    if ([",", ";", " ", "!", "quad", "qquad"].includes(token.value)) return run(" ");
    if (token.value === "{" || token.value === "}") return run(token.value);
    if (token.value === "frac") return `<m:f><m:num>${this.group()}</m:num><m:den>${this.group()}</m:den></m:f>`;
    if (token.value === "sqrt") {
      const degree = this.tokens[this.index]?.kind === "openBracket" ? this.group(true) : "";
      return `<m:rad><m:radPr><m:degHide m:val="${degree ? 0 : 1}"/></m:radPr>${degree ? `<m:deg>${degree}</m:deg>` : ""}<m:e>${this.group()}</m:e></m:rad>`;
    }
    if (["vec", "overrightarrow", "widehat", "overline"].includes(token.value)) {
      const accents: Record<string, string> = { vec: "&#x20D7;", overrightarrow: "&#x20D7;", widehat: "&#x0302;", overline: "&#x0305;" };
      return `<m:acc><m:accPr><m:chr m:val="${accents[token.value]}"/></m:accPr><m:e>${this.group()}</m:e></m:acc>`;
    }
    if (token.value === "lim") return run("lim");
    if (token.value === "lvert") return run("|");
    if (token.value === "rvert") return run("|");
    if (token.value === "mathbb") return this.group();
    const entity = entities[token.value];
    if (entity) return run(entity, true);
    throw new DocxRenderError("UNKNOWN_CANONICAL_SYMBOL", `Unsupported canonical OMML command: \\${token.value}`);
  }
}

export function serializeMathNodeToOmml(node: MathNode, options: { notationProfileId?: string } = {}): string {
  const source = node.normalized ?? node.latex ?? (node.sourceType === "LATEX" ? node.sourceRaw : undefined);
  if (!source) throw new DocxRenderError("MATH_SOURCE_UNRESOLVED", `Math source is unresolved at ${node.sourceLocation}.`);

  const prepared = prepareMstMathNotation(source, {
    profileId: options.notationProfileId,
    output: "DOCX",
  });
  if (prepared.status === "FAIL" || !prepared.canonicalLatex) {
    const issue = prepared.issues[0];
    throw new DocxRenderError(issue?.code ?? "MATH_NOTATION_RENDER_FAILURE", issue?.message ?? "DOCX notation preparation failed.");
  }

  // The locked V2.6 validator owns the predecessor whitelist. A successor may introduce
  // additional registry-authorized control words without mutating that locked whitelist.
  // Preserve all legacy blocking reasons except UNKNOWN_CANONICAL_SYMBOL; the OMML parser
  // below remains fail-closed and rejects every command it cannot serialize explicitly.
  const legacyValidation = NA_MATH_STANDARD_V2_6.validateMathSource(prepared.canonicalLatex);
  const legacyBlockingReasons = legacyValidation.reasons.filter((reason) => !reason.startsWith("UNKNOWN_CANONICAL_SYMBOL:"));
  if (legacyBlockingReasons.length) throw new DocxRenderError("BLOCK_RENDER", legacyBlockingReasons.join("; "));

  const ommlBody = new OmmlParser(tokenize(prepared.canonicalLatex)).parse();
  return `<m:oMath><m:oMathPr><m:ctrlPr><w:rPr><w:rFonts w:ascii="${escapeXml(NA_MATH_STANDARD_V2_6.typography.math)}" w:hAnsi="${escapeXml(NA_MATH_STANDARD_V2_6.typography.math)}"/></w:rPr></m:ctrlPr></m:oMathPr>${ommlBody}</m:oMath>`;
}
