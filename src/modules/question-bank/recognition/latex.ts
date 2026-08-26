export function canonicalizeLatex(value: string): string | undefined {
  const trimmed = value.trim().replace(/^\$+|\$+$/g, "").replace(/\\begin\{document\}|\\end\{document\}/g, "").replace(/\s+/g, " ").trim();
  if (!trimmed || /\\documentclass|\\usepackage|\\begin\{document\}/.test(trimmed)) return undefined;
  return trimmed.replace(/\\dfrac/g, "\\frac").replace(/\\tfrac/g, "\\frac").replace(/\s*,\s*d([a-zA-Z])\b/g, ",d$1");
}

