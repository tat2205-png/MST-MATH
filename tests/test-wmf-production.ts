import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { zipSync } from "fflate";
import { classifyAssetRole, parseDocx } from "../src/modules/question-bank/document.ts";
import { deriveBrowserSafeFigures, isValidPng } from "../src/modules/question-bank/wmf.ts";

function minimalWmf(): Uint8Array {
  const bytes = new Uint8Array(24), view = new DataView(bytes.buffer);
  view.setUint16(0, 1, true); view.setUint16(2, 9, true); view.setUint16(4, 0x0300, true); view.setUint32(6, 12, true); view.setUint16(10, 0, true); view.setUint32(12, 3, true); view.setUint16(16, 0, true); view.setUint32(18, 3, true); view.setUint16(22, 0, true); return bytes;
}
const wmf = minimalWmf(), sourceHash = createHash("sha256").update(wmf).digest("hex");
assert.equal(classifyAssetRole(`<w:object><o:OLEObject ProgID="Equation.DSMT4"/></w:object>`, "x.wmf"), "MATHTYPE_PREVIEW");
assert.equal(classifyAssetRole(`<w:object><o:OLEObject ProgID="Equation.3"/></w:object>`, "x.wmf"), "EQUATION_PREVIEW");
assert.equal(classifyAssetRole(`<w:object><o:OLEObject ProgID="Package"/></w:object>`, "x.wmf"), "OLE_PREVIEW");
assert.equal(classifyAssetRole(`<v:shape/>`, "x.wmf", false), "UNKNOWN"); assert.equal(classifyAssetRole(`<v:shape/>`, "x.wmf", true), "REAL_FIGURE");
const xml = `<w:document xmlns:w="w" xmlns:r="r" xmlns:v="v" xmlns:o="o"><w:body><w:p><w:r><w:t>Câu 1. Hình</w:t></w:r></w:p><w:p><w:r><w:pict><v:group id="g1" style="width:100pt;height:50pt" coordorigin="0,0" coordsize="1000,500"><v:shape id="s1" style="position:absolute;left:10;top:20;width:200;height:100"><v:imagedata r:id="rId1"/></v:shape></v:group></w:pict></w:r></w:p><w:p><w:r><w:object><v:shape><v:imagedata r:id="rId2"/></v:shape><o:OLEObject r:id="rId3"/></w:object></w:r></w:p></w:body></w:document>`;
const rels = `<Relationships><Relationship Id="rId1" Target="media/figure.wmf"/><Relationship Id="rId2" Target="media/preview.wmf"/><Relationship Id="rId3" Target="embeddings/object.bin"/></Relationships>`;
const docx = zipSync({ "word/document.xml": new TextEncoder().encode(xml), "word/_rels/document.xml.rels": new TextEncoder().encode(rels), "word/media/figure.wmf": wmf, "word/media/preview.wmf": wmf, "word/embeddings/object.bin": new Uint8Array([1]) });
const parsed = parseDocx(docx, "fixture.docx", { canonicalVml: true });
assert.equal(parsed.figures.find((f) => f.id === "figure-rId1")?.semanticRole, "REAL_FIGURE");
assert.equal(parsed.figures.find((f) => f.id === "figure-rId2")?.semanticRole, "OLE_PREVIEW");
assert.equal(parsed.figures.find((f) => f.id === "figure-rId2")?.derivation?.status, "SOURCE");
const before = { document: Object.prototype.hasOwnProperty.call(globalThis, "document"), html: Object.prototype.hasOwnProperty.call(globalThis, "HTMLCanvasElement"), image: Object.prototype.hasOwnProperty.call(globalThis, "Image") };
const derived = await deriveBrowserSafeFigures(parsed);
assert.deepEqual({ document: Object.prototype.hasOwnProperty.call(globalThis, "document"), html: Object.prototype.hasOwnProperty.call(globalThis, "HTMLCanvasElement"), image: Object.prototype.hasOwnProperty.call(globalThis, "Image") }, before);
const component = derived.figures.find((f) => f.id === "figure-rId1")!; const composite = derived.figures.find((f) => f.componentIds)!;
assert.equal(component.mimeType, "image/png"); assert.ok(isValidPng(component.bytes)); assert.equal(component.derivation?.status, "DERIVED");
assert.equal(component.derivation?.sourceSha256, sourceHash); assert.equal(createHash("sha256").update(wmf).digest("hex"), sourceHash);
assert.equal(composite.mimeType, "image/png"); assert.ok(isValidPng(composite.bytes)); assert.equal(composite.componentIds?.length, 1);
assert.equal(derived.figures.find((f) => f.id === "figure-rId2")?.mimeType, "image/wmf");
const failed = await deriveBrowserSafeFigures({ ...parsed, figures: [{ ...parsed.figures.find((f) => f.id === "figure-rId1")!, bytes: new Uint8Array([1,2,3]) }] });
assert.equal(failed.figures[0].derivation?.status, "FAILED"); assert.equal(failed.figures[0].bytes, undefined);
console.log("WMF_PRODUCTION_QA=PASS");
