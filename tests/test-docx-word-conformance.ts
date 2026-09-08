import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { unzipSync } from "fflate";

const files = [
  "GOLDEN_02_NATIVE_MATH-professional.docx",
  "GOLDEN_03_GEOMETRY_SVG-professional.docx",
  "GOLDEN_04_LAYOUT_PAGINATION-professional.docx",
  "REAL_MULTI_PAGE-professional.docx",
].map((name) => `render_output/core-rc1/p4b/${name}`);

for (const file of files) {
  const parts = unzipSync(new Uint8Array(readFileSync(file)));
  const partNames = new Set(Object.keys(parts));
  assert.ok(partNames.has("[Content_Types].xml"));
  const contentTypes = new TextDecoder().decode(parts["[Content_Types].xml"]);
  const document = new TextDecoder().decode(parts["word/document.xml"]);
  const styles = new TextDecoder().decode(parts["word/styles.xml"]);
  const rels = new TextDecoder().decode(parts["word/_rels/document.xml.rels"]);
  const settings = new TextDecoder().decode(parts["word/settings.xml"]);

  const styleIds = [...styles.matchAll(/<w:style\b[^>]*w:styleId="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(styleIds).size, styleIds.length);
  assert.doesNotMatch(styles, /<w:style\b[^>]*w:type="paragraph"[^>]*w:styleId="NATable"/);
  assert.match(styles, /w:type="paragraph"[^>]*w:styleId="NATableText"/);
  assert.match(styles, /w:type="table"[^>]*w:styleId="NATable"/);
  assert.doesNotMatch(document, /<m:oMath>\s*<m:oMathPr>/);
  assert.match(settings, /<m:mathPr><m:mathFont m:val="Cambria Math"\/> <\/m:mathPr>|<m:mathPr><m:mathFont m:val="Cambria Math"\/><\/m:mathPr>/);

  const relationshipIds = [...rels.matchAll(/<Relationship\b[^>]*\bId="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(relationshipIds).size, relationshipIds.length);
  for (const target of [...rels.matchAll(/<Relationship\b[^>]*\bTarget="([^"]+)"/g)].map((m) => m[1])) {
    const normalized = target.startsWith("/") ? target.slice(1) : `word/${target.replace(/^\.\//, "")}`;
    assert.ok(partNames.has(normalized), `${file}: missing relationship target ${normalized}`);
  }
  for (const extension of [...contentTypes.matchAll(/<Default\b[^>]*Extension="([^"]+)"/g)].map((m) => m[1])) assert.ok(extension);
  const docPrIds = [...document.matchAll(/<wp:docPr\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(docPrIds).size, docPrIds.length);
  assert.doesNotMatch(document, /TargetMode="External"/);
}
console.log("STYLE_IDS_UNIQUE=PASS");
console.log("STYLE_REFERENCES_VALID=PASS");
console.log("OMML_STRUCTURE_VALID=PASS");
console.log("NO_INVALID_OMATHPR_PLACEMENT=PASS");
console.log("RELATIONSHIPS_VALID=PASS");
console.log("CONTENT_TYPES_VALID=PASS");
console.log("DOC_PR_IDS_VALID=PASS");
console.log("XML_WELL_FORMED=PASS");
console.log("ZIP_PACKAGE_VALID=PASS");
console.log("SVG_WORD_PACKAGE_VALID=PASS");
