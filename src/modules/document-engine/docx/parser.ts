import path from "node:path";
import { createHash } from "node:crypto";
import type {
  DocumentConversionReport, DocumentEngineIssue, DocxAst, DocxBlockNode, DocxInlineNode,
  DocxParagraphNode, DocxTableNode, ExtractedDocxAsset, ParsedDocxResult,
} from "../types.js";
import { childElements, descendants, getAttribute, localName, parseXml, textContent, type XmlNode } from "../xml.js";
import { ommlToLatex } from "../omml/omml.js";
import { readSafeZip } from "./zip.js";

interface Relationship { id: string; type: string; target: string; external: boolean; }
interface ParseContext {
  files: Map<string, Uint8Array>;
  relationships: Map<string, Relationship>;
  contentTypes: Map<string, string>;
  styleHeadings: Map<string, number>;
  numbering: Map<string, { level: number; ordered: boolean }>;
  assets: ExtractedDocxAsset[];
  issues: DocumentEngineIssue[];
  equationCounter: number;
  paragraphCounter: number;
  tableCounter: number;
}

const decoder = new TextDecoder("utf-8", { fatal: true });
const emptyStats = () => ({ paragraphs: 0, equations: 0, images: 0, tables: 0 });

function makeReport(status: "PASS" | "PARTIAL" | "FAIL", issues: DocumentEngineIssue[], assets: ExtractedDocxAsset[], statistics = emptyStats()): DocumentConversionReport {
  return {
    status,
    warnings: issues.filter((issue) => issue.severity === "warning" && !issue.code.startsWith("UNSUPPORTED") && !issue.code.includes("FALLBACK") && issue.code !== "IMAGE_MATH_NOT_PARSED"),
    unsupported: issues.filter((issue) => issue.code.startsWith("UNSUPPORTED") || issue.code.includes("FALLBACK") || issue.code === "IMAGE_MATH_NOT_PARSED"),
    errors: issues.filter((issue) => issue.severity === "error"),
    assets: assets.map(({ bytes: _bytes, ...asset }) => asset),
    statistics,
  };
}

function xmlFromPackage(files: Map<string, Uint8Array>, packagePath: string, required: boolean, issues: DocumentEngineIssue[]): XmlNode | undefined {
  const bytes = files.get(packagePath);
  if (!bytes) {
    if (required) issues.push({ code: "MISSING_DOCUMENT_XML", severity: "error", path: packagePath, message: `Required DOCX part is missing: ${packagePath}` });
    return undefined;
  }
  try { return parseXml(decoder.decode(bytes)); }
  catch (error) {
    issues.push({ code: "MALFORMED_XML", severity: "error", path: packagePath, message: error instanceof Error ? error.message : String(error) });
    return undefined;
  }
}

function parseRelationships(root: XmlNode | undefined, issues: DocumentEngineIssue[]): Map<string, Relationship> {
  const result = new Map<string, Relationship>();
  if (!root) return result;
  for (const node of descendants({ name: "root", attributes: {}, children: [root] }, "Relationship")) {
    const id = getAttribute(node, "Id");
    const target = getAttribute(node, "Target");
    if (!id || !target) { issues.push({ code: "BROKEN_RELATIONSHIP", severity: "warning", message: "Relationship is missing Id or Target." }); continue; }
    const external = getAttribute(node, "TargetMode") === "External";
    if (external) issues.push({ code: "EXTERNAL_RELATIONSHIP_BLOCKED", severity: "warning", path: id, message: `External relationship was preserved but not accessed: ${target}` });
    result.set(id, { id, target, external, type: getAttribute(node, "Type") ?? "" });
  }
  return result;
}

function parseContentTypes(root: XmlNode | undefined): Map<string, string> {
  const result = new Map<string, string>();
  if (!root) return result;
  for (const node of childElements(root)) {
    if (localName(node.name) === "Default") {
      const extension = getAttribute(node, "Extension"), type = getAttribute(node, "ContentType");
      if (extension && type) result.set(`.${extension.toLowerCase()}`, type);
    } else if (localName(node.name) === "Override") {
      const part = getAttribute(node, "PartName"), type = getAttribute(node, "ContentType");
      if (part && type) result.set(part.replace(/^\//, ""), type);
    }
  }
  return result;
}

function parseStyles(root: XmlNode | undefined): Map<string, number> {
  const result = new Map<string, number>();
  if (!root) return result;
  for (const style of descendants(root, "style")) {
    const id = getAttribute(style, "styleId");
    if (!id) continue;
    const name = getAttribute(firstDescendant(style, "name"), "val") ?? id;
    const outline = Number.parseInt(getAttribute(firstDescendant(style, "outlineLvl"), "val") ?? "", 10);
    const heading = /^(heading|tiêu đề)\s*([1-6])$/i.exec(name) ?? /^Heading([1-6])$/i.exec(id);
    if (heading) result.set(id, Number.parseInt(heading[2] ?? heading[1], 10));
    else if (Number.isInteger(outline) && outline >= 0 && outline <= 5) result.set(id, outline + 1);
  }
  return result;
}

function firstDescendant(node: XmlNode, name: string): XmlNode | undefined { return descendants(node, name)[0]; }

function parseNumbering(root: XmlNode | undefined): Map<string, { level: number; ordered: boolean }> {
  const abstractFormats = new Map<string, Map<number, boolean>>();
  if (root) for (const abstract of descendants(root, "abstractNum")) {
    const id = getAttribute(abstract, "abstractNumId");
    if (!id) continue;
    const levels = new Map<number, boolean>();
    for (const level of childElements(abstract, "lvl")) {
      const index = Number.parseInt(getAttribute(level, "ilvl") ?? "0", 10);
      const format = getAttribute(firstDescendant(level, "numFmt"), "val") ?? "bullet";
      levels.set(index, format !== "bullet" && format !== "none");
    }
    abstractFormats.set(id, levels);
  }
  const result = new Map<string, { level: number; ordered: boolean }>();
  if (root) for (const num of descendants(root, "num")) {
    const numId = getAttribute(num, "numId"), abstractId = getAttribute(firstDescendant(num, "abstractNumId"), "val");
    if (!numId || !abstractId) continue;
    const levels = abstractFormats.get(abstractId);
    if (levels) for (const [level, ordered] of levels) result.set(`${numId}:${level}`, { level, ordered });
  }
  return result;
}

function relationshipPath(target: string): string | undefined {
  const normalized = path.posix.normalize(path.posix.join("word", target));
  return normalized.startsWith("word/") && !normalized.includes("../") ? normalized : undefined;
}

function mediaTypeFor(packagePath: string, contentTypes: Map<string, string>): string {
  return contentTypes.get(packagePath) ?? contentTypes.get(path.posix.extname(packagePath).toLowerCase()) ?? "application/octet-stream";
}

function extractImage(node: XmlNode, context: ParseContext, sourcePath: string): DocxInlineNode {
  const blip = descendants(node, "blip")[0];
  const relationshipId = blip ? getAttribute(blip, "embed") : undefined;
  const extent = descendants(node, "extent")[0];
  const widthEmu = Number.parseInt(extent ? getAttribute(extent, "cx") ?? "" : "", 10);
  const heightEmu = Number.parseInt(extent ? getAttribute(extent, "cy") ?? "" : "", 10);
  if (!relationshipId) {
    context.issues.push({ code: "BROKEN_RELATIONSHIP", severity: "warning", path: sourcePath, message: "Image has no embedded relationship ID." });
    return { type: "image", relationshipId: "missing", sourcePath };
  }
  const relationship = context.relationships.get(relationshipId);
  if (!relationship || relationship.external) {
    context.issues.push({ code: "BROKEN_RELATIONSHIP", severity: "warning", path: relationshipId, message: "Image relationship is missing or external." });
    return { type: "image", relationshipId, sourcePath };
  }
  const packagePath = relationshipPath(relationship.target);
  const bytes = packagePath ? context.files.get(packagePath) : undefined;
  if (!packagePath || !bytes) {
    context.issues.push({ code: "MISSING_MEDIA", severity: "warning", path: relationshipId, message: `Image media is missing for relationship ${relationshipId}.` });
    return { type: "image", relationshipId, sourcePath };
  }
  const existing = context.assets.find((asset) => asset.relationshipId === relationshipId);
  const asset = existing ?? {
    id: `asset-${createHash("sha256").update(relationshipId).digest("hex").slice(0, 12)}`,
    relationshipId, filename: path.posix.basename(packagePath), packagePath,
    mediaType: mediaTypeFor(packagePath, context.contentTypes), bytes,
    ...(Number.isFinite(widthEmu) ? { widthEmu } : {}), ...(Number.isFinite(heightEmu) ? { heightEmu } : {}),
  };
  if (!existing) context.assets.push(asset);
  context.issues.push({ code: "IMAGE_MATH_NOT_PARSED", severity: "warning", path: sourcePath, message: "Embedded image was preserved without OCR or geometry reconstruction." });
  return { type: "image", relationshipId, assetId: asset.id, sourcePath, widthEmu: asset.widthEmu, heightEmu: asset.heightEmu };
}

function parseInline(node: XmlNode, context: ParseContext, sourcePath: string): DocxInlineNode[] {
  const name = localName(node.name);
  if (name === "oMath" || name === "oMathPara") {
    const conversion = ommlToLatex(node, sourcePath);
    context.issues.push(...conversion.issues);
    const id = `expression-docx-${++context.equationCounter}`;
    return [{ type: "math", display: name === "oMathPara", sourcePath, expression: {
      id, raw: conversion.rawText, ...(conversion.latex ? { latex: conversion.latex, normalized: conversion.latex } : {}),
      metadata: { sourceEvidence: [{ id: `evidence-${id}`, origin: "imported", sourceType: "docx", sourceId: sourcePath, excerpt: conversion.rawText }] },
    } }];
  }
  if (name === "drawing" || name === "pict") return [extractImage(node, context, sourcePath)];
  if (name === "object") {
    const relationshipId = getAttribute(descendants(node, "OLEObject")[0] ?? node, "id");
    context.issues.push({ code: "LEGACY_MATHTYPE_NEEDS_FALLBACK", severity: "warning", path: sourcePath, message: "Legacy MathType/OLE object was preserved but not decoded." });
    return [{ type: "legacy_object", relationshipId, reason: "LEGACY_MATHTYPE_UNSUPPORTED", sourcePath }];
  }
  if (name === "t" || name === "instrText") return [{ type: "text", text: textContent(node) }];
  if (name === "tab") return [{ type: "text", text: "\t" }];
  if (name === "br") return getAttribute(node, "type") === "page" ? [{ type: "page_break" }] : [{ type: "text", text: "\n" }];
  return childElements(node).flatMap((child, index) => parseInline(child, context, `${sourcePath}/${localName(child.name)}[${index}]`));
}

function parseParagraph(node: XmlNode, context: ParseContext, sourcePath: string): DocxParagraphNode {
  const index = context.paragraphCounter++;
  const properties = childElements(node, "pPr")[0];
  const styleId = properties ? getAttribute(firstDescendant(properties, "pStyle"), "val") : undefined;
  const headingLevel = styleId ? context.styleHeadings.get(styleId) : undefined;
  const numProperties = properties ? firstDescendant(properties, "numPr") : undefined;
  const numberingId = numProperties ? getAttribute(firstDescendant(numProperties, "numId"), "val") : undefined;
  const level = Number.parseInt(numProperties ? getAttribute(firstDescendant(numProperties, "ilvl"), "val") ?? "0" : "", 10);
  const list = numberingId ? context.numbering.get(`${numberingId}:${Number.isFinite(level) ? level : 0}`) ?? { level: Number.isFinite(level) ? level : 0, ordered: false } : undefined;
  const children = childElements(node).filter((child) => localName(child.name) !== "pPr").flatMap((child, childIndex) => parseInline(child, context, `${sourcePath}/${localName(child.name)}[${childIndex}]`));
  return { type: "paragraph", index, ...(styleId ? { styleId } : {}), ...(headingLevel ? { headingLevel } : {}), ...(list && numberingId ? { list: { ...list, numberingId } } : {}), children };
}

function parseTable(node: XmlNode, context: ParseContext, sourcePath: string): DocxTableNode {
  const index = context.tableCounter++;
  const rows = childElements(node, "tr").map((row, rowIndex) => ({
    index: rowIndex,
    cells: childElements(row, "tc").map((cell, cellIndex) => {
      const blocks: DocxBlockNode[] = [];
      for (const [blockIndex, block] of childElements(cell).entries()) {
        const name = localName(block.name);
        if (name === "p") blocks.push(parseParagraph(block, context, `${sourcePath}/row[${rowIndex}]/cell[${cellIndex}]/p[${blockIndex}]`));
        else if (name === "tbl") context.issues.push({ code: "UNSUPPORTED_NESTED_TABLE", severity: "warning", path: sourcePath, message: "Nested Word table was preserved as unsupported content." });
      }
      return { index: cellIndex, blocks };
    }),
  }));
  return { type: "table", index, rows };
}

export function parseDocx(input: Uint8Array, options: { sourceName?: string } = {}): ParsedDocxResult {
  let zip;
  try { zip = readSafeZip(input); }
  catch (error) {
    const issues: DocumentEngineIssue[] = [{ code: "INVALID_DOCX_ARCHIVE", severity: "error", message: error instanceof Error ? error.message : String(error) }];
    return { status: "FAIL", report: makeReport("FAIL", issues, []) };
  }
  const issues = [...zip.issues];
  const documentRoot = xmlFromPackage(zip.entries, "word/document.xml", true, issues);
  const relationships = parseRelationships(xmlFromPackage(zip.entries, "word/_rels/document.xml.rels", false, issues), issues);
  const contentTypes = parseContentTypes(xmlFromPackage(zip.entries, "[Content_Types].xml", false, issues));
  const styleHeadings = parseStyles(xmlFromPackage(zip.entries, "word/styles.xml", false, issues));
  const numbering = parseNumbering(xmlFromPackage(zip.entries, "word/numbering.xml", false, issues));
  if (!documentRoot || issues.some((issue) => issue.severity === "error")) return { status: "FAIL", report: makeReport("FAIL", issues, []) };
  const context: ParseContext = { files: zip.entries, relationships, contentTypes, styleHeadings, numbering, assets: [], issues, equationCounter: 0, paragraphCounter: 0, tableCounter: 0 };
  const body = descendants(documentRoot, "body")[0];
  if (!body) {
    issues.push({ code: "MALFORMED_XML", severity: "error", path: "word/document.xml", message: "Word document body is missing." });
    return { status: "FAIL", report: makeReport("FAIL", issues, []) };
  }
  const blocks: DocxBlockNode[] = [];
  for (const [index, node] of childElements(body).entries()) {
    const name = localName(node.name);
    if (name === "p") blocks.push(parseParagraph(node, context, `word/document.xml/body/p[${index}]`));
    else if (name === "tbl") blocks.push(parseTable(node, context, `word/document.xml/body/tbl[${index}]`));
    else if (name === "sectPr") blocks.push({ type: "section_break", index });
    else issues.push({ code: "UNSUPPORTED_DOCUMENT_NODE", severity: "warning", path: `word/document.xml/body/${name}[${index}]`, message: `Unsupported Word body element: ${name}` });
  }
  const ast: DocxAst = { type: "document", blocks, assets: context.assets, issues, ...(options.sourceName ? { sourceName: options.sourceName } : {}) };
  const statistics = { paragraphs: context.paragraphCounter, equations: context.equationCounter, images: context.assets.length, tables: context.tableCounter };
  const status = issues.some((issue) => issue.severity === "error") ? "FAIL" : issues.length ? "PARTIAL" : "PASS";
  return { status, ast, report: makeReport(status, issues, context.assets, statistics) };
}
