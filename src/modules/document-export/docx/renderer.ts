import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { mkdir } from "node:fs/promises";
import { zipSync, type Zippable } from "fflate";
import { NA_MATH_STANDARD_V2_6 } from "../../../config/naMathStandardV26.js";
import type { ContentBlock, DocumentBlock, DocumentIR, FigureRecord } from "../../question-bank/types.js";
import { DocxRenderError, type DocxRenderOptions, type DocxRenderResult } from "./types.js";
import { escapeXml, xmlDocument } from "./xml.js";
import { createWordStylesXml } from "./styles.js";
import { serializeMathNodeToOmml } from "./omml.js";

const encode = (value: string) => new TextEncoder().encode(value);
const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
interface MediaEntry { figure: FigureRecord; relationshipId: string; target: string; extension: string; contentType: string; widthEmu: number; heightEmu: number; }
interface RenderContext { warnings: string[]; media: Map<string, MediaEntry>; options: DocxRenderOptions; }

function textRun(value: string, bold = false): string {
  const preserve = /^\s|\s$/.test(value) ? ' xml:space="preserve"' : "";
  return `<w:r>${bold ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t${preserve}>${escapeXml(value)}</w:t></w:r>`;
}

function inlineFigure(entry: MediaEntry, options: DocxRenderOptions): string {
  const metadata = options.figureMetadata?.[entry.figure.id] ?? {};
  const name = escapeXml(metadata.semanticFigureId ?? entry.figure.id);
  const title = escapeXml(metadata.title ?? entry.figure.caption ?? name);
  const description = escapeXml([metadata.altText, metadata.geometryProfileId ? `Profile: ${metadata.geometryProfileId}` : undefined].filter(Boolean).join(" | "));
  const blip = entry.extension === "svg" ? `<a:blip r:embed="${entry.relationshipId}"/><a:extLst><a:ext uri="{96DAC541-7B7A-43D3-8B79-37D633B846F1}"><asvg:svgBlip r:embed="${entry.relationshipId}"/></a:ext></a:extLst>` : `<a:blip r:embed="${entry.relationshipId}"/>`;
  return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${entry.widthEmu}" cy="${entry.heightEmu}"/><wp:docPr id="${entry.relationshipId.replace(/\D/g, "") || 1}" name="${name}" title="${title}" descr="${description}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:blipFill>${blip}<a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${entry.widthEmu}" cy="${entry.heightEmu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
}

function contentXml(content: ContentBlock[], context: RenderContext): string {
  return content.map((item) => {
    if (item.type === "text") return textRun(item.value);
    if (item.type === "math") {
      return serializeMathNodeToOmml(item.math);
    }
    if (item.type === "figure") {
      const entry = context.media.get(item.figureId);
      if (!entry) throw new DocxRenderError("DOCX_FIGURE_BYTES_MISSING", `Figure bytes are missing: ${item.figureId}`);
      if (entry.extension === "svg") context.warnings.push("WORD_SVG_RUNTIME_COMPATIBILITY_NOT_VERIFIED");
      return inlineFigure(entry, context.options);
    }
    return "";
  }).join("");
}

function paragraph(block: DocumentBlock, context: RenderContext, pageBreak: boolean): string {
  const style = block.kind === "SECTION" ? "NAHeading1" : block.style ?? "NABody";
  const properties = [style ? `<w:pStyle w:val="${escapeXml(style)}"/>` : "", block.numbering ? `<w:numPr><w:ilvl w:val="0"/><w:numId w:val="${escapeXml(block.numbering)}"/></w:numPr>` : ""].join("");
  return `<w:p>${properties ? `<w:pPr>${properties}</w:pPr>` : ""}${contentXml(block.content, context)}${pageBreak ? '<w:r><w:br w:type="page"/></w:r>' : ""}</w:p>`;
}

function table(block: DocumentBlock, context: RenderContext): string {
  const tableContent = block.content.find((item) => item.type === "table");
  if (!tableContent || tableContent.type !== "table") return paragraph(block, context, false);
  const cells = tableContent.cells.map((cell) => `<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr><w:p>${contentXml(cell, context)}</w:p></w:tc>`).join("");
  return `<w:tbl><w:tblPr><w:tblStyle w:val="NATable"/><w:tblW w:w="0" w:type="auto"/></w:tblPr><w:tr>${cells}</w:tr></w:tbl>`;
}

function packageParts(document: DocumentIR, options: DocxRenderOptions, warnings: string[]): Record<string, Uint8Array> {
  const outputIdentity = options.outputIdentity ?? "learning_material";
  const media = new Map<string, MediaEntry>();
  for (const [index, figure] of document.figures.entries()) {
    if (!figure.bytes) continue;
    const extension = figure.mimeType === "image/svg+xml" ? "svg" : figure.mimeType === "image/png" ? "png" : figure.mimeType === "image/jpeg" ? "jpg" : undefined;
    if (!extension) throw new DocxRenderError("DOCX_MEDIA_TYPE_UNSUPPORTED", `Unsupported DOCX media type: ${figure.mimeType ?? "unknown"}`);
    const widthEmu = figure.dimensions?.widthEmu ?? 4_572_000;
    const heightEmu = figure.dimensions?.heightEmu ?? 3_048_000;
    if (widthEmu <= 0 || heightEmu <= 0) throw new DocxRenderError("DOCX_FIGURE_DIMENSION_INVALID", `Invalid figure dimensions: ${figure.id}`);
    media.set(figure.id, { figure, relationshipId: `rIdImage${index + 1}`, target: `media/figure-${index + 1}.${extension}`, extension, contentType: figure.mimeType!, widthEmu, heightEmu });
  }
  const context: RenderContext = { warnings, media, options };
  const pageBreakIds = new Set(options.pageBreakAfterBlockIds ?? []);
  const body = document.blocks.map((block) => block.kind === "TABLE" ? table(block, context) : paragraph(block, context, pageBreakIds.has(block.id))).join("");
  const title = escapeXml(options.title ?? document.sourceDocument);
  const creator = escapeXml(options.creator ?? "Math AI Studio");
  const generatedAt = (options.generatedAt ?? new Date(0)).toISOString();
  const mediaDefaults = [...new Map([...media.values()].map((entry) => [entry.extension, entry])).values()].map((entry) => `<Default Extension="${entry.extension}" ContentType="${entry.contentType}"/>`).join("");
  const parts: Record<string, Uint8Array> = {
    "[Content_Types].xml": encode(xmlDocument(`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${mediaDefaults}<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`)),
    "_rels/.rels": encode(xmlDocument('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>')),
    "docProps/core.xml": encode(xmlDocument(`<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${title}</dc:title><dc:creator>${creator}</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${generatedAt}</dcterms:created></cp:coreProperties>`)),
    "docProps/app.xml": encode(xmlDocument('<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Math AI Studio</Application><AppVersion>DOCX_EXPORT_V1</AppVersion></Properties>')),
    "word/document.xml": encode(xmlDocument(`<w:document xmlns:w="${W}" xmlns:r="${R}" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:asvg="http://schemas.microsoft.com/office/drawing/2016/SVG/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1021" w:right="1021" w:bottom="1021" w:left="1021" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`)),
    "word/styles.xml": encode(createWordStylesXml(outputIdentity)),
    "word/settings.xml": encode(xmlDocument(`<w:settings xmlns:w="${W}" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><m:mathPr><m:mathFont m:val="${escapeXml(NA_MATH_STANDARD_V2_6.typography.math)}"/></m:mathPr></w:settings>`)),
    "word/_rels/document.xml.rels": encode(xmlDocument(`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>${[...media.values()].map((entry) => `<Relationship Id="${entry.relationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${entry.target}"/>`).join("")}</Relationships>`)),
  };
  for (const entry of media.values()) parts[`word/${entry.target}`] = entry.figure.bytes!;
  return parts;
}

export function renderDocumentToDocx(document: DocumentIR, options: DocxRenderOptions = {}): DocxRenderResult {
  try {
    const warnings = [...document.warnings];
    const outputIdentity = options.outputIdentity ?? "learning_material";
    const parts = packageParts(document, options, warnings);
    const bytes = zipSync(parts as Zippable, { level: 6 });
    return { bytes, warnings: [...new Set(warnings)], qa: { format: "docx", packageParts: Object.keys(parts).sort(), standardId: NA_MATH_STANDARD_V2_6.id, outputIdentity }, rendererVersion: "DOCX_EXPORT_V1", standardVersion: NA_MATH_STANDARD_V2_6.id };
  } catch (error) {
    if (error instanceof DocxRenderError) throw error;
    throw new DocxRenderError("DOCX_RENDER_FAILED", "Unable to render semantic document to DOCX.", error);
  }
}

export async function writeDocumentToDocx(document: DocumentIR, outputPath: string, options: DocxRenderOptions = {}): Promise<DocxRenderResult> {
  if (!outputPath.toLowerCase().endsWith(".docx")) throw new DocxRenderError("DOCX_OUTPUT_EXTENSION_REQUIRED", "DOCX output path must end in .docx.");
  const resolved = resolve(outputPath);
  await mkdir(dirname(resolved), { recursive: true });
  const result = renderDocumentToDocx(document, options);
  await writeFile(resolved, result.bytes);
  return { ...result, outputPath: resolved };
}
