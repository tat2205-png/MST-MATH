import type { ContentBlock } from "./types.js";
export function normalizeVietnameseText(value: string): string { return value.normalize("NFC").replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim(); }
export function normalizeLatex(value: string): string { const latex = value.trim(); if (/\\documentclass|\\begin\{document\}/.test(latex)) throw new Error("INVALID_LATEX_FRAGMENT"); return latex; }
export function normalizeBlocks(blocks: ContentBlock[]): ContentBlock[] { return blocks.map((block) => block.type === "text" ? { ...block, value: normalizeVietnameseText(block.value) } : block); }
