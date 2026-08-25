import { XMLParser } from "fast-xml-parser";
import { unzipSync } from "fflate";
import type { ContentBlock, DocumentBlock, DocumentIR } from "./types.js";
import { convertOmml } from "./omml.js";

type XmlObject = Record<string, unknown>;
const parser = new XMLParser({ preserveOrder: true, ignoreAttributes: false, attributeNamePrefix: "@_", parseTagValue: false, trimValues: false });
const entries = (node: unknown): Array<[string, unknown, XmlObject]> => !Array.isArray(node) ? [] : node.flatMap((item) => typeof item === "object" && item !== null ? Object.entries(item as XmlObject).filter(([key]) => key !== ":@").map(([key, value]) => [key, value, item as XmlObject] as [string, unknown, XmlObject]) : []);
const attrs = (holder: XmlObject): Record<string, string> => (holder[":@"] ?? {}) as Record<string, string>;
function findFirst(node: unknown, tag: string): unknown[] | undefined { for (const [key, value] of entries(node)) { if (key === tag) return value as unknown[]; const nested = findFirst(value, tag); if (nested) return nested; } return undefined; }
function textValue(node: unknown): string { return entries(node).map(([key, value]) => key === "#text" ? String(value) : textValue(value)).join(""); }
function relationshipMap(xml?: Uint8Array): Map<string, string> { const map = new Map<string, string>(); if (!xml) return map; const walk = (node: unknown) => entries(node).forEach(([key, value, holder]) => { if (key.endsWith("Relationship")) { const a = attrs(holder); if (a["@_Id"] && a["@_Target"]) map.set(a["@_Id"], a["@_Target"]); } walk(value); }); walk(parser.parse(new TextDecoder().decode(xml))); return map; }
function mergeContent(content: ContentBlock[], next: ContentBlock): void { const last = content.at(-1); if (last?.type === "text" && next.type === "text") last.value += next.value; else content.push(next); }

interface ParagraphParse { content: ContentBlock[]; pageBreak: boolean; mathObjects: number; mathConverted: number; warnings: string[]; relationships: string[] }
function parseParagraph(node: unknown, rels: Map<string, string>): ParagraphParse {
  const result: ParagraphParse = { content: [], pageBreak: false, mathObjects: 0, mathConverted: 0, warnings: [], relationships: [] };
  const walk = (current: unknown) => entries(current).forEach(([key, value, holder]) => {
    if (key === "w:t") { mergeContent(result.content, { type: "text", value: textValue(value) }); return; }
    if (key === "w:tab") { mergeContent(result.content, { type: "text", value: "\t" }); return; }
    if (key === "w:br") { const type = attrs(holder)["@_w:type"]; if (type === "page") result.pageBreak = true; else mergeContent(result.content, { type: "text", value: "\n" }); return; }
    if (key === "m:oMath" || key === "m:oMathPara") { const converted = convertOmml([{ [key]: value }]); result.mathObjects += 1; if (converted.latex) { result.mathConverted += converted.supported ? 1 : 0; result.content.push({ type: "math", latex: converted.latex }); } else mergeContent(result.content, { type: "text", value: `[OMML:${converted.evidence}]` }); result.warnings.push(...converted.warnings); return; }
    if (key === "a:blip" || key === "v:imagedata") { const id = attrs(holder)["@_r:embed"] || attrs(holder)["@_r:id"]; if (id) { const assetId = `asset-${id}`; result.relationships.push(id); result.content.push({ type: "image", assetId, alt: rels.get(id) }); } return; }
    walk(value);
  });
  walk(node); return result;
}
function paragraphMetadata(node: unknown): { styleName?: string; numberingId?: string } { const pPr = findFirst(node, "w:pPr"); if (!pPr) return {}; const style = findFirst(pPr, "w:pStyle"), num = findFirst(pPr, "w:numId"); const styleHolder = style ? entries(pPr).find(([key]) => key === "w:pStyle")?.[2] : undefined; const numHolder = num ? (() => { let found: XmlObject | undefined; const walk = (x: unknown) => entries(x).forEach(([key, value, holder]) => { if (key === "w:numId") found = holder; else walk(value); }); walk(pPr); return found; })() : undefined; return { styleName: styleHolder ? attrs(styleHolder)["@_w:val"] : undefined, numberingId: numHolder ? attrs(numHolder)["@_w:val"] : undefined }; }
function parseTable(node: unknown, rels: Map<string, string>): { rows: ContentBlock[][][]; warnings: string[]; mathObjects: number; mathConverted: number } { const rows: ContentBlock[][][] = []; const warnings: string[] = []; let mathObjects = 0, mathConverted = 0; for (const row of (findFirst(node, "w:tr") ? entries(node).filter(([key]) => key === "w:tr").map(([, value]) => value) : [])) { const cells: ContentBlock[][] = []; for (const [, cell] of entries(row).filter(([key]) => key === "w:tc")) { const content: ContentBlock[] = []; const walk = (x: unknown) => entries(x).forEach(([key, value]) => { if (key === "w:p") { const parsed = parseParagraph(value, rels); content.push(...parsed.content); warnings.push(...parsed.warnings); mathObjects += parsed.mathObjects; mathConverted += parsed.mathConverted; } else walk(value); }); walk(cell); cells.push(content); } rows.push(cells); } return { rows, warnings, mathObjects, mathConverted }; }

export interface ParsedDocxDocument { document: DocumentIR; media: Map<string, Uint8Array>; relationships: Map<string, string> }
export function parseDocxToDocumentIR(bytes: Uint8Array, sourceName: string): ParsedDocxDocument {
  const files = unzipSync(bytes); const documentXml = files["word/document.xml"]; if (!documentXml) throw new Error("Invalid DOCX: word/document.xml is missing");
  const rels = relationshipMap(files["word/_rels/document.xml.rels"]); const body = findFirst(parser.parse(new TextDecoder().decode(documentXml)), "w:body"); if (!body) throw new Error("Invalid DOCX: document body is missing");
  const blocks: DocumentBlock[] = []; const warnings: string[] = []; let paragraphIndex = 0, mathObjects = 0, mathConverted = 0, order = 0;
  for (const [key, value] of entries(body)) {
    if (key === "w:p") { const meta = paragraphMetadata(value); const parsed = parseParagraph(value, rels); mathObjects += parsed.mathObjects; mathConverted += parsed.mathConverted; warnings.push(...parsed.warnings); if (parsed.content.length) blocks.push({ type: meta.styleName?.toLowerCase().includes("heading") ? "heading" : "paragraph", order: order++, paragraphIndex, styleName: meta.styleName, numberingId: meta.numberingId, sourcePosition: `word/document.xml:p${paragraphIndex}`, content: parsed.content }); if (parsed.pageBreak) blocks.push({ type: "pageBreak", order: order++, paragraphIndex, sourcePosition: `word/document.xml:p${paragraphIndex}:break` }); paragraphIndex += 1;
    } else if (key === "w:tbl") { const table = parseTable(value, rels); mathObjects += table.mathObjects; mathConverted += table.mathConverted; warnings.push(...table.warnings); blocks.push({ type: "table", order: order++, paragraphIndex, sourcePosition: `word/document.xml:table:${order}`, rows: table.rows }); }
  }
  const media = new Map(Object.entries(files).filter(([name]) => name.startsWith("word/media/")).map(([name, data]) => [name, data]));
  return { document: { sourceName, blocks, warnings: [...new Set(warnings)], mathObjects, mathConverted, assetsFound: media.size }, media, relationships: rels };
}
