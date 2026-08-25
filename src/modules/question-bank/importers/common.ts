import { createHash } from "node:crypto";
import type { ContentBlock, SourceFileType, SourceProvenance } from "../types.js";
export function sha256(data: Uint8Array): string { return createHash("sha256").update(data).digest("hex"); }
export function provenance(name: string, type: SourceFileType, bytes: Uint8Array, page?: number, questionNumber?: string): SourceProvenance {
  const hash = sha256(bytes); return { fileId: hash.slice(0, 16), originalFileName: name, fileType: type, sourceHash: hash, page, questionNumber, importedAt: new Date().toISOString() };
}
export function groupQuestionCandidates(lines: string[]): { number?: string; blocks: ContentBlock[] }[] {
  const groups: { number?: string; blocks: ContentBlock[] }[] = [];
  for (const raw of lines.map((x) => x.trim()).filter(Boolean)) {
    const marker = /^(?:Câu|Bài)\s+(\d+)[.:)]\s*(.*)$/iu.exec(raw);
    if (marker || !groups.length) groups.push({ number: marker?.[1], blocks: [{ type: "text", value: marker?.[2] || raw }] });
    else (groups.at(-1)!.blocks[0] as { type: "text"; value: string }).value += `\n${raw}`;
  }
  return groups;
}
