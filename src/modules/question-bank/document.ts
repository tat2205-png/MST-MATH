import { createHash } from "node:crypto";
import { unzipSync } from "fflate";
import { parseOmml } from "./omml.js";
import type { ContentBlock, DocumentBlock, DocumentIR, FigureRecord } from "./types.js";
const decode = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const mime = (path?: string) => path?.endsWith(".png") ? "image/png" : path?.match(/\.jpe?g$/i) ? "image/jpeg" : path?.endsWith(".svg") ? "image/svg+xml" : path?.endsWith(".wmf") ? "image/wmf" : path?.endsWith(".emf") ? "image/emf" : "application/octet-stream";
const numberStyle = (style: string, name: string) => Number.parseFloat(new RegExp(`(?:^|;)${name}:([^;]+)`, "i").exec(style)?.[1] ?? "0");
const sourceFormat = (path?: string) => path?.split(".").at(-1)?.toUpperCase() ?? "UNKNOWN";
export function classifyAssetRole(markup: string, mediaPath?: string, inVmlGroup = false) {
  if (/<w:object\b|<o:OLEObject\b/i.test(markup)) {
    const progId = /\bProgID="([^"]+)"/i.exec(markup)?.[1] ?? "";
    if (/mathtype|equation\.dsmt/i.test(progId)) return "MATHTYPE_PREVIEW" as const;
    if (/^equation(?:\.|$)/i.test(progId)) return "EQUATION_PREVIEW" as const;
    return "OLE_PREVIEW" as const;
  }
  if (mediaPath?.match(/\.(?:wmf|emf)$/i)) return inVmlGroup ? "REAL_FIGURE" as const : "UNKNOWN" as const;
  return "RASTER_FIGURE" as const;
}
function relationships(xml: string): Map<string, string> { return new Map([...xml.matchAll(/<Relationship\b[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"[^>]*\/?\s*>/gi)].map((m) => [m[1], m[2]])); }
function paragraphContent(xml: string, location: string, rels: Map<string, string>, files: Record<string, Uint8Array>, figures: FigureRecord[], paragraphIndex: number, tableCell?: string, canonicalVml = false): ContentBlock[] {
  const groups = [...xml.matchAll(/<v:group\b([^>]*)>([\s\S]*?)<\/v:group>/gi)];
  const groupedIds = new Set<string>();
  for (const group of groups) {
    const groupId = /\bid="([^"]+)"/i.exec(group[1])?.[1] ?? `vml-group-${paragraphIndex}-${figures.length}`;
    let order = 0; const componentIds: string[] = [];
    for (const shape of group[2].matchAll(/<v:shape\b([^>]*)>[\s\S]*?<v:imagedata\b([^>]*)\/?>(?:[\s\S]*?<\/v:shape>)?/gi)) {
      const rid = /r:id="([^"]+)"/i.exec(shape[2])?.[1]; if (!rid) continue;
      if (canonicalVml) groupedIds.add(rid); const target = rels.get(rid); const path = target ? `word/${target.replace(/^\.\.\//, "")}` : undefined; const bytes = path ? files[path] : undefined;
      const id = `figure-${rid}`; const style = /\bstyle="([^"]*)"/i.exec(shape[1])?.[1] ?? "";
      const semanticRole = classifyAssetRole(shape[0], path, true);
      const record: FigureRecord = { id, relationshipId: rid, mediaPath: path, mimeType: mime(path), bytes, sourceLocation: location, paragraphIndex, tableCell, semanticRole, groupId, layout: { groupId, componentOrder: order++, x: numberStyle(style, "left"), y: numberStyle(style, "top"), width: numberStyle(style, "width"), height: numberStyle(style, "height"), rotation: numberStyle(style, "rotation") || undefined }, derivation: { sourceAssetId: id, sourceMediaPath: path, sourceFormat: sourceFormat(path), sourceMime: mime(path), sourceSha256: bytes ? createHash("sha256").update(bytes).digest("hex") : undefined, semanticRole, status: "SOURCE" } };
      const existing = figures.find((x) => x.id === id); if (!existing) figures.push(record); componentIds.push(id);
    }
    if (canonicalVml && componentIds.length) {
      const compositeId = `figure-composite-${groupId}`;
      const groupStyle = /\bstyle="([^"]*)"/i.exec(group[1])?.[1] ?? ""; const origin = (/\bcoordorigin="([^"]+)"/i.exec(group[1])?.[1] ?? "0,0").split(",").map(Number); const size = (/\bcoordsize="([^"]+)"/i.exec(group[1])?.[1] ?? "1,1").split(",").map(Number);
      if (!figures.some((x) => x.id === compositeId)) figures.push({ id: compositeId, relationshipId: "VML_GROUP", sourceLocation: location, paragraphIndex, tableCell, semanticRole: "REAL_FIGURE", groupId, componentIds, vmlGroupXml: group[2], layout: { groupId, componentOrder: 0, x: origin[0], y: origin[1], width: size[0], height: size[1] }, dimensions: { widthPx: Math.max(1, Math.round(numberStyle(groupStyle, "width") * 4 / 3)), heightPx: Math.max(1, Math.round(numberStyle(groupStyle, "height") * 4 / 3)) } });
    }
  }
  const content: ContentBlock[] = []; const token = /<m:oMathPara\b[\s\S]*?<\/m:oMathPara>|<m:oMath\b[\s\S]*?<\/m:oMath>|<w:t\b[^>]*>[\s\S]*?<\/w:t>|<(?:a:blip|v:imagedata)\b[^>]*>/gi; let match;
  while ((match = token.exec(xml))) { const raw = match[0]; if (/^<w:t/i.test(raw)) { const value = decode(raw.replace(/^<w:t\b[^>]*>|<\/w:t>$/gi, "")); if (value) content.push({ type: "text", value, sourceLocation: location }); }
    else if (/^<m:oMath/i.test(raw)) content.push({ type: "math", math: parseOmml(raw, `${location}:math:${content.length}`), sourceLocation: location });
    else { const rid = /r:(?:embed|id)="([^"]+)"/i.exec(raw)?.[1]; if (!rid || groupedIds.has(rid)) continue; const target = rels.get(rid); const path = target ? `word/${target.replace(/^\.\.\//, "")}` : undefined; const id = `figure-${rid}`; const extent = /<wp:extent\b[^>]*cx="(\d+)"[^>]*cy="(\d+)"/i.exec(xml); const semanticRole = classifyAssetRole(xml, path); if (!figures.some((x) => x.id === id)) figures.push({ id, relationshipId: rid, mediaPath: path, mimeType: mime(path), bytes: path ? files[path] : undefined, sourceLocation: location, paragraphIndex, tableCell, semanticRole, dimensions: extent ? { widthEmu: Number(extent[1]), heightEmu: Number(extent[2]) } : undefined, derivation: { sourceAssetId: id, sourceMediaPath: path, sourceFormat: sourceFormat(path), sourceMime: mime(path), sourceSha256: path && files[path] ? createHash("sha256").update(files[path]).digest("hex") : undefined, semanticRole, status: semanticRole === "UNKNOWN" ? "REVIEW_REQUIRED" : "SOURCE" } }); content.push({ type: "figure", figureId: id, sourceLocation: location }); }
  }
  if (canonicalVml) for (const group of groups) { const groupId = /\bid="([^"]+)"/i.exec(group[1])?.[1]; if (groupId) content.push({ type: "figure", figureId: `figure-composite-${groupId}`, sourceLocation: location }); }
  return content.reduce<ContentBlock[]>((result, block) => {
    const previous = result.at(-1);
    if (previous?.type === "text" && block.type === "text") {
      previous.value += block.value;
    } else {
      result.push(block);
    }
    return result;
  }, []);
}
export function parseDocx(bytes: Uint8Array, sourceDocument: string, options: { canonicalVml?: boolean } = {}): DocumentIR {
  const files = unzipSync(bytes); const raw = files["word/document.xml"]; if (!raw) throw new Error("INVALID_DOCX_DOCUMENT_XML_MISSING"); const xml = new TextDecoder().decode(raw); const relRaw = files["word/_rels/document.xml.rels"]; const rels = relationships(relRaw ? new TextDecoder().decode(relRaw) : "");
  const figures: FigureRecord[] = [], blocks: DocumentBlock[] = [], warnings: string[] = []; const body = /<w:body\b[^>]*>([\s\S]*?)<\/w:body>/i.exec(xml)?.[1] ?? xml; const top = /<w:(p|tbl)\b[\s\S]*?<\/w:\1>/gi; let match, paragraphIndex = 0, order = 0;
  while ((match = top.exec(body))) { const location = `word/document.xml:${match[1]}:${order}`; if (match[1] === "p") { const style = /<w:pStyle\b[^>]*w:val="([^"]+)"/i.exec(match[0])?.[1]; const numbering = /<w:numId\b[^>]*w:val="([^"]+)"/i.exec(match[0])?.[1]; const content = paragraphContent(match[0], location, rels, files, figures, paragraphIndex, undefined, options.canonicalVml); if (content.length) blocks.push({ id: `block-${order}`, kind: /^heading/i.test(style ?? "") ? "SECTION" : "PARAGRAPH", order, paragraphIndex, style, numbering, boldLabel: /<w:b\b/i.test(match[0]), content, sourceLocation: location }); paragraphIndex++; }
    else { const cells: ContentBlock[][] = []; let cell; const cellRe = /<w:tc\b[\s\S]*?<\/w:tc>/gi; let cellIndex = 0; while ((cell = cellRe.exec(match[0]))) cells.push(paragraphContent(cell[0], `${location}:cell:${cellIndex}`, rels, files, figures, paragraphIndex, `${order}:${cellIndex++}`, options.canonicalVml)); blocks.push({ id: `block-${order}`, kind: "TABLE", order, paragraphIndex, content: [{ type: "table", cells, sourceLocation: location }], sourceLocation: location }); }
    order++;
  }
  for (const [path, data] of Object.entries(files).filter(([p]) => p.startsWith("word/media/"))) if (!figures.some((f) => f.mediaPath === path)) { const id = `figure-orphan-${figures.length + 1}`; const semanticRole = path.match(/\.(?:wmf|emf)$/i) ? "UNKNOWN" as const : "RASTER_FIGURE" as const; figures.push({ id, relationshipId: "UNRESOLVED", mediaPath: path, mimeType: mime(path), bytes: data, sourceLocation: path, semanticRole, derivation: { sourceAssetId: id, sourceMediaPath: path, sourceFormat: sourceFormat(path), sourceMime: mime(path), sourceSha256: createHash("sha256").update(data).digest("hex"), semanticRole, status: semanticRole === "UNKNOWN" ? "REVIEW_REQUIRED" : "SOURCE" } }); }
  return { sourceDocument, sourceHash: createHash("sha256").update(bytes).digest("hex"), blocks, figures, warnings };
}
