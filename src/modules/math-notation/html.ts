import katex from "katex";
import { prepareMstMathNotation } from "./authority.js";
import type { MathNotationIssue } from "./index.js";

export interface MathNotationHtmlRenderResult {
  status: "PASS" | "FAIL";
  source: string;
  canonicalLatex?: string;
  semanticSignature: string[];
  html?: string;
  issues: MathNotationIssue[];
}

export function renderMstMathToHtml(
  source: string,
  options: { notationProfileId?: string; displayMode?: boolean } = {},
): MathNotationHtmlRenderResult {
  const prepared = prepareMstMathNotation(source, {
    profileId: options.notationProfileId,
    output: "HTML",
  });

  if (prepared.status === "FAIL" || !prepared.canonicalLatex) {
    return {
      status: "FAIL",
      source,
      semanticSignature: prepared.semanticSignature,
      issues: prepared.issues,
    };
  }

  try {
    const html = katex.renderToString(prepared.canonicalLatex, {
      displayMode: options.displayMode ?? false,
      throwOnError: true,
      strict: false,
      output: "htmlAndMathml",
    });
    return {
      status: "PASS",
      source,
      canonicalLatex: prepared.canonicalLatex,
      semanticSignature: prepared.semanticSignature,
      html,
      issues: [],
    };
  } catch (error) {
    return {
      status: "FAIL",
      source,
      canonicalLatex: prepared.canonicalLatex,
      semanticSignature: prepared.semanticSignature,
      issues: [{
        code: "MATH_NOTATION_RENDER_FAILURE",
        message: error instanceof Error ? error.message : "KaTeX failed to render canonical notation.",
      }],
    };
  }
}
