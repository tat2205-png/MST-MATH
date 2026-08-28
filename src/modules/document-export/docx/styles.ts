import { NA_MATH_STANDARD_V2_6, getNaMathOutputContract, type NaMathOutputIdentity } from "../../../config/naMathStandardV26.js";
import { escapeXml, xmlDocument } from "./xml.js";

export type WordStyleRole = "title" | "subtitle" | "heading1" | "heading2" | "heading3" | "body" | "label" | "definition" | "example" | "remember" | "exercise" | "solution" | "figureCaption" | "table" | "header" | "footer";
export interface WordStyleDefinition { id: string; name: string; font: string; color: string; basedOn?: string; bold?: boolean; italic?: boolean; sizeHalfPoints: number; }

const roles: Array<[WordStyleRole, string, string, "body" | "ui", number, boolean?, boolean?]> = [
  ["title", "NATitle", "NA Title", "ui", 36, true], ["subtitle", "NASubtitle", "NA Subtitle", "ui", 24],
  ["heading1", "NAHeading1", "NA Heading 1", "ui", 30, true], ["heading2", "NAHeading2", "NA Heading 2", "ui", 26, true], ["heading3", "NAHeading3", "NA Heading 3", "ui", 24, true],
  ["body", "NABody", "NA Body", "body", 22], ["label", "NALabel", "NA Label", "ui", 20, true], ["definition", "NADefinition", "NA Definition", "body", 22],
  ["example", "NAExample", "NA Example", "body", 22], ["remember", "NARemember", "NA Remember", "body", 22, true], ["exercise", "NAExercise", "NA Exercise", "body", 22],
  ["solution", "NASolution", "NA Solution", "body", 22], ["figureCaption", "NAFigureCaption", "NA Figure Caption", "body", 18, false, true],
  ["table", "NATable", "NA Table", "body", 20], ["header", "NAHeader", "NA Header", "ui", 18], ["footer", "NAFooter", "NA Footer", "ui", 18],
];

export function createWordStyleMap(identity: NaMathOutputIdentity): Readonly<Record<WordStyleRole, WordStyleDefinition>> {
  const typography = NA_MATH_STANDARD_V2_6.typography;
  const primary = getNaMathOutputContract(identity).primary_accent.replace("#", "");
  return Object.freeze(Object.fromEntries(roles.map(([role, id, name, fontRole, sizeHalfPoints, bold, italic]) => [role, Object.freeze({ id, name, font: fontRole === "body" ? typography.body : typography.ui, color: primary, basedOn: role === "body" ? undefined : "NABody", bold, italic, sizeHalfPoints })])) as Record<WordStyleRole, WordStyleDefinition>);
}

function paragraphStyle(style: WordStyleDefinition): string {
  const basedOn = style.basedOn ? `<w:basedOn w:val="${style.basedOn}"/>` : "";
  const run = `<w:rPr><w:rFonts w:ascii="${escapeXml(style.font)}" w:hAnsi="${escapeXml(style.font)}" w:eastAsia="${escapeXml(style.font)}"/><w:color w:val="${style.color}"/><w:sz w:val="${style.sizeHalfPoints}"/><w:szCs w:val="${style.sizeHalfPoints}"/>${style.bold ? "<w:b/>" : ""}${style.italic ? "<w:i/>" : ""}</w:rPr>`;
  const keep = style.id.startsWith("NAHeading") || style.id === "NATitle" || style.id === "NASubtitle" ? "<w:keepNext/>" : "";
  return `<w:style w:type="paragraph" w:styleId="${style.id}"><w:name w:val="${style.name}"/>${basedOn}<w:qFormat/><w:pPr>${keep}<w:widowControl/><w:spacing w:after="120"/></w:pPr>${run}</w:style>`;
}

export function createWordStylesXml(identity: NaMathOutputIdentity): string {
  const map = createWordStyleMap(identity);
  const defaults = `<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${escapeXml(NA_MATH_STANDARD_V2_6.typography.body)}" w:hAnsi="${escapeXml(NA_MATH_STANDARD_V2_6.typography.body)}" w:eastAsia="${escapeXml(NA_MATH_STANDARD_V2_6.typography.fallback_vi_serif)}"/></w:rPr></w:rPrDefault></w:docDefaults>`;
  const table = `<w:style w:type="table" w:styleId="NATable"><w:name w:val="NA Table"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:color="${map.table.color}"/><w:left w:val="single" w:sz="4" w:color="${map.table.color}"/><w:bottom w:val="single" w:sz="4" w:color="${map.table.color}"/><w:right w:val="single" w:sz="4" w:color="${map.table.color}"/><w:insideH w:val="single" w:sz="4" w:color="${map.table.color}"/><w:insideV w:val="single" w:sz="4" w:color="${map.table.color}"/></w:tblBorders></w:tblPr></w:style>`;
  return xmlDocument(`<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${defaults}${Object.values(map).map(paragraphStyle).join("")}${table}</w:styles>`);
}
