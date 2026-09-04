import assert from "node:assert/strict";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { preflightDocx, safeCleanDocx } from "../src/modules/word-preflight/index.js";

function fixtureDocx(extra: Record<string, Uint8Array> = {}): Uint8Array {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
  <w:body>
    <w:p w:rsidR="00112233"><w:r><w:proofErr w:type="spellStart"/><w:t>A   B</w:t><w:proofErr w:type="spellEnd"/></w:r></w:p>
    <w:p><w:r><w:t xml:space="preserve">C   D</w:t></w:r></w:p>
    <w:p><m:oMath><m:r><m:t>x+1</m:t></m:r></m:oMath></w:p>
    <w:p><w:r><w:object><v:shape id="mathTypeShape"/><o:OLEObject Type="Embed" ProgID="Equation.DSMT4" r:id="rIdOle"/></w:object></w:r></w:p>
    <w:p><w:r><w:drawing><w:anchor>FIGURE_LOCKED</w:anchor></w:drawing></w:r></w:p>
    <w:p><w:r><w:pict><v:shape id="legacyFigure"/></w:pict></w:r></w:p>
    <w:p><w:hyperlink r:id="rIdExternal"><w:r><w:t>External link</w:t></w:r></w:hyperlink></w:p>
    <w:p></w:p>
    <w:sectPr/>
  </w:body>
</w:document>`;
  const relationships = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdImage" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
  <Relationship Id="rIdOle" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject" Target="embeddings/oleObject1.bin"/>
  <Relationship Id="rIdExternal" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://example.com" TargetMode="External"/>
</Relationships>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
  const core = `<?xml version="1.0" encoding="UTF-8"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator>Teacher Name</dc:creator><cp:lastModifiedBy>Teacher Name</cp:lastModifiedBy></cp:coreProperties>`;
  const styles = `<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Normal"/></w:styles>`;

  return zipSync({
    "[Content_Types].xml": strToU8(contentTypes),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`),
    "word/document.xml": strToU8(documentXml),
    "word/_rels/document.xml.rels": strToU8(relationships),
    "word/styles.xml": strToU8(styles),
    "docProps/core.xml": strToU8(core),
    "word/media/image1.png": new Uint8Array([137, 80, 78, 71, 1, 2, 3]),
    "word/embeddings/oleObject1.bin": new Uint8Array([1, 9, 8, 7, 6, 5]),
    ...extra,
  });
}

const source = fixtureDocx();
const sourceCopy = source.slice();
const before = preflightDocx(source, "messy.docx");
assert.equal(before.safeCleanAvailable, true);
assert.equal(before.metrics.ommlEquations, 1);
assert.ok(before.metrics.oleObjects >= 1);
assert.ok(before.metrics.drawings >= 1);
assert.ok(before.metrics.legacyVmlObjects >= 1);
assert.equal(before.metrics.externalRelationships, 1);
assert.equal(before.metrics.repeatedPlainTextWhitespaceRuns, 1);
assert.ok(before.metrics.proofingMarkers >= 2);
assert.equal(before.riskLevel, "HIGH");
assert.ok(before.issues.some((issue) => issue.code === "WORD_OLE_PROTECTED"));
assert.ok(before.issues.some((issue) => issue.code === "WORD_OMML_PROTECTED"));
console.log("WORD_PREFLIGHT_METRICS_QA=PASS");

const cleaned = safeCleanDocx(source, "messy.docx");
assert.deepEqual(source, sourceCopy);
assert.equal(cleaned.sourceBytesMutated, false);
assert.equal(cleaned.safeCleanQa, "PASS");
assert.equal(cleaned.protectedFingerprintMatch, true);
assert.equal(cleaned.before.protectedFingerprint, cleaned.after.protectedFingerprint);
assert.equal(cleaned.suggestedOutputFileName, "messy.PIMATH-CLEAN.docx");
assert.ok(cleaned.changes.plainTextWhitespaceRunsNormalized >= 1);
assert.ok(cleaned.changes.proofingMarkersRemoved >= 2);
assert.ok(cleaned.changes.revisionSessionAttributesRemoved >= 1);
assert.equal(cleaned.changes.personalMetadataFieldsCleared, 2);
console.log("WORD_SOURCE_IMMUTABILITY_QA=PASS");
console.log("WORD_PROTECTED_FINGERPRINT_QA=PASS");

const cleanedParts = unzipSync(cleaned.bytes);
const cleanedDocument = strFromU8(cleanedParts["word/document.xml"]);
const cleanedCore = strFromU8(cleanedParts["docProps/core.xml"]);
assert.ok(cleanedDocument.includes("<w:t>A B</w:t>"));
assert.ok(cleanedDocument.includes("<w:t xml:space=\"preserve\">C   D</w:t>"));
assert.ok(!cleanedDocument.includes("w:proofErr"));
assert.ok(!cleanedDocument.includes("w:rsidR="));
assert.ok(cleanedDocument.includes("<m:oMath><m:r><m:t>x+1</m:t></m:r></m:oMath>"));
assert.ok(cleanedDocument.includes("ProgID=\"Equation.DSMT4\""));
assert.ok(cleanedDocument.includes("FIGURE_LOCKED"));
assert.ok(cleanedCore.includes("<dc:creator></dc:creator>"));
assert.ok(cleanedCore.includes("<cp:lastModifiedBy></cp:lastModifiedBy>"));
assert.deepEqual(cleanedParts["word/media/image1.png"], unzipSync(source)["word/media/image1.png"]);
assert.deepEqual(cleanedParts["word/embeddings/oleObject1.bin"], unzipSync(source)["word/embeddings/oleObject1.bin"]);
assert.deepEqual(cleanedParts["word/_rels/document.xml.rels"], unzipSync(source)["word/_rels/document.xml.rels"]);
console.log("WORD_OMML_MATHTYPE_FIGURE_PRESERVATION_QA=PASS");
console.log("WORD_RELATIONSHIP_MEDIA_EMBEDDING_QA=PASS");

const macroSource = fixtureDocx({ "word/vbaProject.bin": new Uint8Array([1, 2, 3, 4]) });
const macroReport = preflightDocx(macroSource, "macro-disguised.docx");
assert.equal(macroReport.riskLevel, "BLOCKED");
assert.equal(macroReport.safeCleanAvailable, false);
assert.throws(() => safeCleanDocx(macroSource, "macro-disguised.docx"), /WORD_PREFLIGHT_BLOCKED/);
console.log("WORD_MACRO_FAIL_CLOSED_QA=PASS");

assert.throws(() => preflightDocx(new Uint8Array([1, 2, 3]), "bad.docx"), /INVALID_DOCUMENT/);
console.log("WORD_INVALID_PACKAGE_QA=PASS");
console.log("PIMATH_WORD_PREFLIGHT_SAFE_CLEAN_V1=PASS");
