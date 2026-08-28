import assert from "node:assert/strict";
import { unzipSync } from "fflate";
import { XMLParser } from "fast-xml-parser";
import { renderDocumentToDocx } from "../src/modules/document-export/docx/index.ts";
import type { DocumentIR } from "../src/modules/question-bank/types.ts";

const document: DocumentIR = {
  sourceDocument: "DOCX-1A Golden.docx", sourceHash: "foundation", figures: [], warnings: [],
  blocks: [
    { id: "heading", kind: "SECTION", order: 0, content: [{ type: "text", value: "Nền tảng xuất Word" }], sourceLocation: "test:0" },
    { id: "body", kind: "PARAGRAPH", order: 1, content: [{ type: "text", value: "Nội dung tiếng Việt." }], sourceLocation: "test:1" },
    { id: "table", kind: "TABLE", order: 2, content: [{ type: "table", cells: [[{ type: "text", value: "Ô 1" }], [{ type: "text", value: "Ô 2" }]] }], sourceLocation: "test:2" },
  ],
};
const result = renderDocumentToDocx(document, { pageBreakAfterBlockIds: ["body"], generatedAt: new Date("2026-01-01T00:00:00.000Z") });
const parts = unzipSync(result.bytes);
for (const required of ["[Content_Types].xml", "_rels/.rels", "word/document.xml", "word/_rels/document.xml.rels", "docProps/core.xml", "docProps/app.xml"]) assert.ok(parts[required], required);
const decode = (name: string) => new TextDecoder().decode(parts[name]);
const parser = new XMLParser({ ignoreAttributes: false });
for (const name of ["[Content_Types].xml", "_rels/.rels", "word/document.xml", "word/_rels/document.xml.rels", "docProps/core.xml", "docProps/app.xml"]) assert.doesNotThrow(() => parser.parse(decode(name)));
const xml = decode("word/document.xml");
assert.match(xml, /Nền tảng xuất Word/);
assert.match(xml, /<w:tbl>/);
assert.match(xml, /<w:br w:type="page"\/>/);
assert.match(xml, /<w:pgSz w:w="11906" w:h="16838"\/>/);
assert.equal(result.qa.standardId, "NA_MATH_STANDARD_V2_6");
assert.equal(result.rendererVersion, "DOCX_EXPORT_V1");
assert.equal(result.standardVersion, "NA_MATH_STANDARD_V2_6");
console.log("DOCX_FOUNDATION_QA=PASS\nOOXML_PACKAGE_QA=PASS\nV2_6_REGISTRY_CONSUMPTION_QA=PASS");
