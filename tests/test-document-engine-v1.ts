import assert from "node:assert/strict";
import { validateMathIR } from "../src/modules/math-ir/index.js";
import { convertDocxToLatex, docxToMathIR, parseDocx } from "../src/modules/document-engine/index.js";
import { createStoredZip, DOCX_FIXTURES } from "../src/modules/document-engine/fixtures.js";

const plain = convertDocxToLatex(DOCX_FIXTURES.plainText, { sourceName: "DOCX-01.docx" });
assert.equal(plain.status, "PASS");
assert.ok(plain.document && validateMathIR(plain.document).status === "PASS");
assert.match(plain.latex!, /Bài 1\. Giải phương trình x² - 5x \+ 6 = 0\./u);
assert.equal(plain.document!.problems.length, 1);

const inline = convertDocxToLatex(DOCX_FIXTURES.inlineEquation);
assert.equal(inline.status, "PASS");
assert.match(inline.latex!, /\$\{x\}\^\{2\}-5x\+6=0\$/);

const display = convertDocxToLatex(DOCX_FIXTURES.displayEquation);
assert.equal(display.status, "PASS");
assert.match(display.latex!, /\\\[/);
assert.match(display.latex!, /\{x\}\^\{2\}-5x\+6=0/);

const fraction = convertDocxToLatex(DOCX_FIXTURES.fractionsRadicals);
assert.equal(fraction.status, "PASS");
assert.match(fraction.latex!, /\\frac\{1\}\{2\}/);
assert.match(fraction.latex!, /\\sqrt\{x\}/);

const vietnamese = convertDocxToLatex(DOCX_FIXTURES.vietnameseMath);
assert.equal(vietnamese.status, "PASS");
assert.match(vietnamese.latex!, /Cho α ∈ A, a ⊥ b, d ∥ \(P\), x ≤ π và Δ ≠ 0\./u);

const image = convertDocxToLatex(DOCX_FIXTURES.image);
assert.equal(image.status, "PARTIAL");
assert.equal(image.report.statistics.images, 1);
assert.equal(image.report.assets[0].relationshipId, "rIdImage1");
assert.equal(image.report.assets[0].filename, "diagram.png");
assert.equal(image.report.assets[0].widthEmu, 914400);
assert.match(image.latex!, /\\includegraphics/);
assert.ok(image.report.unsupported.some((issue) => issue.code === "IMAGE_MATH_NOT_PARSED"));

const table = convertDocxToLatex(DOCX_FIXTURES.table);
assert.equal(table.status, "PASS");
assert.equal(table.report.statistics.tables, 1);
assert.match(table.latex!, /\\begin\{tabular\}/);
assert.match(table.latex!, /\$x\+1\$/);

const multiple = docxToMathIR(DOCX_FIXTURES.multipleProblems);
assert.equal(multiple.status, "PASS");
assert.equal(multiple.document?.problems.length, 2);
assert.match(multiple.document!.problems[0].statement, /Lời dẫn cho bài một/u);

const unsupported = convertDocxToLatex(DOCX_FIXTURES.unsupportedOmml);
assert.equal(unsupported.status, "PARTIAL");
assert.ok(unsupported.report.unsupported.some((issue) => issue.code === "UNSUPPORTED_OMML_CONSTRUCT"));
assert.match(unsupported.latex!, /unsupported OMML/);

const broken = parseDocx(DOCX_FIXTURES.broken);
assert.equal(broken.status, "FAIL");
assert.ok(broken.report.errors.some((issue) => issue.code === "INVALID_DOCX_ARCHIVE"));

const legacy = convertDocxToLatex(DOCX_FIXTURES.legacyMathType);
assert.equal(legacy.status, "PARTIAL");
assert.ok(legacy.report.unsupported.some((issue) => issue.code === "LEGACY_MATHTYPE_NEEDS_FALLBACK"));
assert.match(legacy.latex!, /LEGACY\\_MATHTYPE\\_UNSUPPORTED/);

const structured = convertDocxToLatex(DOCX_FIXTURES.structured);
assert.equal(structured.status, "PASS");
assert.equal(structured.document?.sections.length, 3);
assert.equal(structured.document?.sections[0].blocks[0].type, "heading");
assert.equal(structured.document?.sections[0].blocks[1].type, "list_item");
assert.equal(structured.document?.sections[0].blocks[2].type, "page_break");
assert.match(structured.latex!, /\\section\{Chương 1\}/u);
assert.match(structured.latex!, /\\begin\{enumerate\}/);
assert.match(structured.latex!, /\\newpage/);

const deflated = convertDocxToLatex(DOCX_FIXTURES.deflatedPlain);
assert.equal(deflated.status, "PASS");
assert.match(deflated.latex!, /DOCX nén Deflate/u);

const missingDocument = parseDocx(createStoredZip({ "[Content_Types].xml": "<Types/>" }));
assert.equal(missingDocument.status, "FAIL");
assert.ok(missingDocument.report.errors.some((issue) => issue.code === "MISSING_DOCUMENT_XML"));

const unsafeArchive = createStoredZip({ "../evil.xml": "<evil/>" });
assert.equal(parseDocx(unsafeArchive).status, "FAIL");

const dtdArchive = createStoredZip({ "word/document.xml": '<!DOCTYPE x [<!ENTITY e "boom">]><w:document xmlns:w="x"><w:body/></w:document>' });
assert.equal(parseDocx(dtdArchive).status, "FAIL");

const roundTrip = JSON.parse(JSON.stringify(plain.document));
assert.equal(validateMathIR(roundTrip).status, "PASS");
assert.equal(roundTrip.schemaVersion, "math-ir/v1");

console.log("DOCUMENT_ENGINE_V1_TESTS=PASS");
