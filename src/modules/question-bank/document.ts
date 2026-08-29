import { createHash } from "node:crypto";
import { unzipSync } from "fflate";
import { parseOmml } from "./omml.js";
import type { ContentBlock, DocumentBlock, DocumentIR, FigureRecord } from "./types.js";
const decode = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const mime = (path?: string) => path?.endsWith(".png") ? "image/png" : path?.match(/\.jpe?g$/i) ? "image/jpeg" : path?.endsWith(".svg") ? "image/svg+xml" : path?.endsWith(".wmf") ? "image/wmf" : "application/octet-stream";
function relationships(xml: string): Map<string, string> { return new Map([...xml.matchAll(/<Relationship\b[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"[^>]*\/?\s*>/gi)].map((m) => [m[1], m[2]])); }
function paragraphContent(xml: string, location: string, rels: Map<string, string>, files: Record<string, Uint8Array>, figures: FigureRecord[], paragraphIndex: number, tableCell?: string): ContentBlock[] {
  const content: ContentBlock[] = []; const token = /<m:oMath(?:Para)?\b[\s\S]*?<\/m:oMath(?:Para)?>|<w:t\b[^>]*>[\s\S]*?<\/w:t>|<(?:a:blip|v:imagedata)\b[^>]*>/gi; let match;
  while ((match = token.exec(xml))) { const raw = match[0]; if (/^<w:t/i.test(raw)) { const value = decode(raw.replace(/^<w:t\b[^>]*>|<\/w:t>$/gi, "")); if (value) content.push({ type: "text", value, sourceLocation: location }); }
    else if (/^<m:oMath/i.test(raw)) content.push({ type: "math", math: parseOmml(raw, `${location}:math:${content.length}`), sourceLocation: location });
    else { const rid = /r:(?:embed|id)="([^"]+)"/i.exec(raw)?.[1]; if (!rid) continue; const target = rels.get(rid); const path = target ? `word/${target.replace(/^\.\.\//, "")}` : undefined; const id = `figure-${rid}`; const extent = /<wp:extent\b[^>]*cx="(\d+)"[^>]*cy="(\d+)"/i.exec(xml); if (!figures.some((x) => x.id === id)) figures.push({ id, relationshipId: rid, mediaPath: path, mimeType: mime(path), bytes: path ? files[path] : undefined, sourceLocation: location, paragraphIndex, tableCell, dimensions: extent ? { widthEmu: Number(extent[1]), heightEmu: Number(extent[2]) } : undefined }); content.push({ type: "figure", figureId: id, sourceLocation: location }); }
  } return content;
}
export function parseDocx(bytes: Uint8Array, sourceDocument: string): DocumentIR {
  const files = unzipSync(bytes); const raw = files["word/document.xml"]; if (!raw) throw new Error("INVALID_DOCX_DOCUMENT_XML_MISSING"); const xml = new TextDecoder().decode(raw); const relRaw = files["word/_rels/document.xml.rels"]; const rels = relationships(relRaw ? new TextDecoder().decode(relRaw) : "");
  const figures: FigureRecord[] = [], blocks: DocumentBlock[] = [], warnings: string[] = []; const body = /<w:body\b[^>]*>([\s\S]*?)<\/w:body>/i.exec(xml)?.[1] ?? xml; const top = /<w:(p|tbl)\b[\s\S]*?<\/w:\1>/gi; let match, paragraphIndex = 0, order = 0;
  while ((match = top.exec(body))) { const location = `word/document.xml:${match[1]}:${order}`; if (match[1] === "p") { const style = /<w:pStyle\b[^>]*w:val="([^"]+)"/i.exec(match[0])?.[1]; const numbering = /<w:numId\b[^>]*w:val="([^"]+)"/i.exec(match[0])?.[1]; const content = paragraphContent(match[0], location, rels, files, figures, paragraphIndex); if (content.length) blocks.push({ id: `block-${order}`, kind: /^heading/i.test(style ?? "") ? "SECTION" : "PARAGRAPH", order, paragraphIndex, style, numbering, boldLabel: /<w:b\b/i.test(match[0]), content, sourceLocation: location }); paragraphIndex++; }
    else { const cells: ContentBlock[][] = []; let cell; const cellRe = /<w:tc\b[\s\S]*?<\/w:tc>/gi; let cellIndex = 0; while ((cell = cellRe.exec(match[0]))) cells.push(paragraphContent(cell[0], `${location}:cell:${cellIndex}`, rels, files, figures, paragraphIndex, `${order}:${cellIndex++}`)); blocks.push({ id: `block-${order}`, kind: "TABLE", order, paragraphIndex, content: [{ type: "table", cells, sourceLocation: location }], sourceLocation: location }); }
    order++;
  }
  for (const [path, data] of Object.entries(files).filter(([p]) => p.startsWith("word/media/"))) if (!figures.some((f) => f.mediaPath === path)) figures.push({ id: `figure-orphan-${figures.length + 1}`, relationshipId: "UNRESOLVED", mediaPath: path, mimeType: mime(path), bytes: data, sourceLocation: path });
  return { sourceDocument, sourceHash: createHash("sha256").update(bytes).digest("hex"), blocks, figures, warnings };
}
