import { createHash } from "node:crypto";
import type { ContentBlock } from "./types.js";
export function normalizeVietnameseText(value: string): string { return value.normalize("NFC").replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim(); }
export function normalizeLatex(latex: string): string {
  const value = latex.trim();
  if (/\\documentclass|\\begin\{document\}|\\end\{document\}/.test(value)) throw new Error("Full LaTeX documents are not canonical question math");
  return value;
}
export function contentToSearchText(blocks: ContentBlock[]): string {
  return blocks.map((b) => b.type === "text" ? normalizeVietnameseText(b.value) : b.type === "math" ? b.latex : b.type === "image" ? b.alt ?? "" : b.rows.flat(2).map((x) => x.type === "text" ? x.value : x.type === "math" ? x.latex : "").join(" ")).join(" ").normalize("NFC").toLocaleLowerCase("vi").replace(/\s+/g, " ").trim();
}
export function canonicalContentFingerprint(blocks: ContentBlock[]): string { return createHash("sha256").update(JSON.stringify(blocks)).digest("hex"); }
