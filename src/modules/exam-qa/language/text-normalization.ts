export interface TextSpan { text: string; start: number; end: number }

/** Returns prose-like spans while excluding common serialized math delimiters. */
export function getProseSpans(source: string): TextSpan[] {
  const mathPattern = /\$\$[\s\S]*?\$\$|\$[^$]*\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/g;
  const spans: TextSpan[] = [];
  let cursor = 0;
  for (const match of source.matchAll(mathPattern)) {
    const start = match.index ?? 0;
    if (start > cursor) spans.push({ text: source.slice(cursor, start), start: cursor, end: start });
    cursor = start + match[0].length;
  }
  if (cursor < source.length) spans.push({ text: source.slice(cursor), start: cursor, end: source.length });
  return spans;
}

export function replaceAt(source: string, start: number, end: number, replacement: string): string {
  return source.slice(0, start) + replacement + source.slice(end);
}

export function hasBalancedDelimiters(source: string, open: "(" | "[", close: ")" | "]"): boolean {
  let depth = 0;
  for (let index = 0; index < source.length; index += 1) {
    if (source[index - 1] === "\\") continue;
    if (source[index] === open) depth += 1;
    if (source[index] === close && --depth < 0) return false;
  }
  return depth === 0;
}

