import { deflateRawSync } from "node:zlib";

const w = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const m = "http://schemas.openxmlformats.org/officeDocument/2006/math";
const r = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const wp = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing";
const a = "http://schemas.openxmlformats.org/drawingml/2006/main";
const pic = "http://schemas.openxmlformats.org/drawingml/2006/picture";

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}

function createZip(files: Record<string, string | Uint8Array>, deflate: boolean): Uint8Array {
  const localParts: Buffer[] = [], centralParts: Buffer[] = [];
  let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const nameBytes = Buffer.from(name, "utf8");
    const data = typeof content === "string" ? Buffer.from(content, "utf8") : Buffer.from(content);
    const compressed = deflate ? deflateRawSync(data) : data;
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x800, 6); local.writeUInt16LE(deflate ? 8 : 0, 8);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(compressed.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(nameBytes.length, 26);
    localParts.push(local, nameBytes, compressed);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0x800, 8); central.writeUInt16LE(deflate ? 8 : 0, 10);
    central.writeUInt32LE(crc, 16); central.writeUInt32LE(compressed.length, 20); central.writeUInt32LE(data.length, 24); central.writeUInt16LE(nameBytes.length, 28); central.writeUInt32LE(offset, 42);
    centralParts.push(central, nameBytes); offset += local.length + nameBytes.length + compressed.length;
  }
  const central = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  const count = Object.keys(files).length;
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(count, 8); end.writeUInt16LE(count, 10); end.writeUInt32LE(central.length, 12); end.writeUInt32LE(offset, 16);
  return new Uint8Array(Buffer.concat([...localParts, central, end]));
}

export function createStoredZip(files: Record<string, string | Uint8Array>): Uint8Array { return createZip(files, false); }
export function createDeflatedZip(files: Record<string, string | Uint8Array>): Uint8Array { return createZip(files, true); }

function documentXml(body: string): string { return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${w}" xmlns:m="${m}" xmlns:r="${r}" xmlns:wp="${wp}" xmlns:a="${a}" xmlns:pic="${pic}"><w:body>${body}<w:sectPr/></w:body></w:document>`; }
function paragraph(content: string, properties = ""): string { return `<w:p>${properties ? `<w:pPr>${properties}</w:pPr>` : ""}${content}</w:p>`; }
function text(value: string): string { return `<w:r><w:t xml:space="preserve">${value.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</w:t></w:r>`; }
function mathText(value: string): string { return `<m:r><m:t>${value}</m:t></m:r>`; }
const contentTypes = `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
const relationships = (items = "") => `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${items}</Relationships>`;

function docx(body: string, extra: Record<string, string | Uint8Array> = {}): Uint8Array {
  return createStoredZip({ "[Content_Types].xml": contentTypes, "word/document.xml": documentXml(body), "word/_rels/document.xml.rels": relationships(), ...extra });
}

export const DOCX_FIXTURES = {
  plainText: docx(paragraph(text("Bài 1. Giải phương trình x² - 5x + 6 = 0."))),
  inlineEquation: docx(paragraph(`${text("Giải phương trình ")}<m:oMath><m:sSup><m:e>${mathText("x")}</m:e><m:sup>${mathText("2")}</m:sup></m:sSup>${mathText("-5x+6=0")}</m:oMath>${text(".")}`)),
  displayEquation: docx(paragraph(`<m:oMathPara><m:oMath><m:sSup><m:e>${mathText("x")}</m:e><m:sup>${mathText("2")}</m:sup></m:sSup>${mathText("-5x+6=0")}</m:oMath></m:oMathPara>`)),
  fractionsRadicals: docx(paragraph(`<m:oMathPara><m:oMath><m:f><m:num>${mathText("1")}</m:num><m:den>${mathText("2")}</m:den></m:f>${mathText("+")}<m:rad><m:deg/><m:e>${mathText("x")}</m:e></m:rad></m:oMath></m:oMathPara>`)),
  vietnameseMath: docx(paragraph(text("Cho α ∈ A, a ⊥ b, d ∥ (P), x ≤ π và Δ ≠ 0."))),
  image: createStoredZip({
    "[Content_Types].xml": contentTypes,
    "word/document.xml": documentXml(paragraph(`${text("Hình minh họa:")}<w:r><w:drawing><wp:inline><wp:extent cx="914400" cy="457200"/><a:graphic><a:graphicData><pic:pic><pic:blipFill><a:blip r:embed="rIdImage1"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`)),
    "word/_rels/document.xml.rels": relationships(`<Relationship Id="rIdImage1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/diagram.png"/>`),
    "word/media/diagram.png": new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
  }),
  table: docx(`<w:tbl><w:tr><w:tc>${paragraph(text("x"))}</w:tc><w:tc>${paragraph(`<m:oMath>${mathText("x+1")}</m:oMath>`)}</w:tc></w:tr><w:tr><w:tc>${paragraph(text("1"))}</w:tc><w:tc>${paragraph(text("2"))}</w:tc></w:tr></w:tbl>`),
  multipleProblems: docx(`${paragraph(text("Bài 1. Giải x + 1 = 0."))}${paragraph(text("Lời dẫn cho bài một."))}${paragraph(text("Bài 2. Giải x - 2 = 0."))}`),
  unsupportedOmml: docx(paragraph(`<m:oMathPara><m:oMath><m:eqArr>${mathText("x=1")}</m:eqArr></m:oMath></m:oMathPara>`)),
  broken: new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00]),
  legacyMathType: docx(paragraph(`<w:r><w:object><o:OLEObject xmlns:o="urn:schemas-microsoft-com:office:office" r:id="rIdOle1"/></w:object></w:r>`), { "word/_rels/document.xml.rels": relationships(`<Relationship Id="rIdOle1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject" Target="embeddings/oleObject1.bin"/>`), "word/embeddings/oleObject1.bin": new Uint8Array([1, 2, 3]) }),
  structured: docx(
    `${paragraph(text("Chương 1"), '<w:pStyle w:val="Heading1"/>')}${paragraph(text("Mục thứ nhất"), '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>')}${paragraph(`<w:r><w:br w:type="page"/></w:r>`)}<w:sectPr/>${paragraph(text("Phần sau"))}`,
    {
      "word/styles.xml": `<?xml version="1.0"?><w:styles xmlns:w="${w}"><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style></w:styles>`,
      "word/numbering.xml": `<?xml version="1.0"?><w:numbering xmlns:w="${w}"><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:numFmt w:val="decimal"/></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`,
    },
  ),
  deflatedPlain: createDeflatedZip({ "[Content_Types].xml": contentTypes, "word/document.xml": documentXml(paragraph(text("Bài 1. DOCX nén Deflate."))), "word/_rels/document.xml.rels": relationships() }),
};
