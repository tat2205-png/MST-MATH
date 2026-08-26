import { inflateRawSync } from "node:zlib";
import type { ImportCandidate } from "../types.js";
import { groupQuestionCandidates, provenance } from "./common.js";

function unzipEntries(bytes: Uint8Array): Map<string, Uint8Array> {
  const out = new Map<string, Uint8Array>(); const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); let p = 0;
  while (p + 30 <= bytes.length && view.getUint32(p, true) === 0x04034b50) {
    const method = view.getUint16(p + 8, true), size = view.getUint32(p + 18, true), nameLen = view.getUint16(p + 26, true), extraLen = view.getUint16(p + 28, true);
    const name = new TextDecoder().decode(bytes.slice(p + 30, p + 30 + nameLen)); const start = p + 30 + nameLen + extraLen; const compressed = bytes.slice(start, start + size);
    out.set(name, method === 0 ? compressed : method === 8 ? inflateRawSync(compressed) : new Uint8Array()); p = start + size;
  }
  return out;
}
function xmlText(xml: string): string[] {
  const paragraphs = xml.match(/<w:p\b[\s\S]*?<\/w:p>/g) ?? [];
  return paragraphs.map((p) => [...p.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((m) => m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")).join("")).filter(Boolean);
}
export function importDocx(bytes: Uint8Array, originalFileName: string): ImportCandidate[] {
  const entries = unzipEntries(bytes); const doc = entries.get("word/document.xml"); if (!doc) throw new Error("Invalid DOCX: word/document.xml is missing");
  const groups = groupQuestionCandidates(xmlText(new TextDecoder().decode(doc))); const assets = [...entries.keys()].filter((x) => x.startsWith("word/media/")).map((x) => `asset-${x.replace(/[^a-z0-9]/gi, "-")}`);
  return groups.map((g) => ({ content: g.blocks, source: provenance(originalFileName, "DOCX", bytes, undefined, g.number), status: "DRAFT", assetIds: assets, notes: assets.length ? ["Embedded images require asset registry persistence"] : [] }));
}
