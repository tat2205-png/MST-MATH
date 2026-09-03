import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { safeCleanDocx } from "../src/modules/word-preflight/index.ts";
import { analyzeLegacyExamDocument } from "../src/modules/word-preflight/legacyExam.ts";
import { inspectWordActiveContent, sanitizeVbaToDocx } from "../src/modules/word-preflight/activeContent.ts";

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function makeFixture(options: { vba?: boolean; activeX?: boolean } = {}): Uint8Array {
  const macroType = options.vba
    ? "application/vnd.ms-word.document.macroEnabled.main+xml"
    : "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="${macroType}"/>
  ${options.vba ? '<Override PartName="/word/vbaProject.bin" ContentType="application/vnd.ms-office.vbaProject"/>' : ""}
</Types>`;
  const documentRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${options.vba ? '<Relationship Id="rVba" Type="http://schemas.microsoft.com/office/2006/relationships/vbaProject" Target="vbaProject.bin"/>' : ""}
</Relationships>`;
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
<w:body>
  <w:p><w:r><w:t>PHẦN I. Thí sinh trả lời...</w:t></w:r></w:p>
  <w:p><w:r><w:t># Câu hỏi thứ nhất</w:t></w:r></w:p>
  <w:p><w:r><w:t>A. Phương án A</w:t></w:r></w:p>
  <w:p><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>B. Phương án B</w:t></w:r></w:p>
  <w:p><w:r><w:t>C. Phương án C</w:t></w:r></w:p>
  <w:p><w:r><w:t>D. Phương án D</w:t></w:r></w:p>
  <w:p><w:r><w:t>&lt;nhom&gt;</w:t></w:r></w:p>
  <w:p><w:r><w:t># Câu hỏi thứ hai</w:t></w:r></w:p>
  <w:p><w:r><w:t>A. Phương án A</w:t></w:r></w:p>
  <w:p><w:r><w:t>B. Phương án B</w:t></w:r></w:p>
  <w:p><w:r><w:t>D. Phương án D</w:t></w:r></w:p>
  <w:p><w:r><w:t>&lt;/nhom&gt;</w:t></w:r></w:p>
  <w:p><m:oMath><m:r><m:t>x+1</m:t></m:r></m:oMath></w:p>
  <w:p><w:r><w:t>Văn bản   có khoảng trắng lặp.</w:t></w:r></w:p>
</w:body></w:document>`;

  const parts: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(contentTypes),
    "_rels/.rels": strToU8(`<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`),
    "word/document.xml": strToU8(documentXml),
    "word/_rels/document.xml.rels": strToU8(documentRels),
    "word/media/image1.png": new Uint8Array([137, 80, 78, 71, 1, 2, 3]),
  };
  if (options.vba) parts["word/vbaProject.bin"] = new Uint8Array([86, 66, 65, 0, 1, 2, 3]);
  if (options.activeX) parts["word/activeX/activeX1.bin"] = new Uint8Array([65, 88, 1, 2]);
  return zipSync(parts, { level: 6 });
}

const macroSource = makeFixture({ vba: true });
const sourceHash = sha256(macroSource);
const sourceParts = unzipSync(macroSource);
const sourceDocumentHash = sha256(sourceParts["word/document.xml"]);
const sourceMediaHash = sha256(sourceParts["word/media/image1.png"]);

const legacy = analyzeLegacyExamDocument(macroSource);
assert.equal(legacy.metrics.questionBlocks, 2);
assert.equal(legacy.metrics.smartTestHashMarkers, 2);
assert.equal(legacy.metrics.groupStarts, 1);
assert.equal(legacy.metrics.groupEnds, 1);
assert.equal(legacy.metrics.redAnswerHints, 1);
assert.ok(legacy.issues.some((issue) => issue.code === "WORD_QUESTION_OPTION_GAP"));
assert.ok(legacy.issues.some((issue) => issue.code === "WORD_SMARTTEST_MARKERS_DETECTED"));

const active = inspectWordActiveContent(macroSource);
assert.equal(active.hasVba, true);
assert.equal(active.hasActiveX, false);
assert.equal(active.canSanitizeVba, true);

const quarantined = sanitizeVbaToDocx(macroSource, "legacy-source.docm");
assert.equal(quarantined.preservedPartQa, "PASS");
assert.equal(quarantined.documentXmlBytePreserved, true);
assert.equal(quarantined.sourceBytesMutated, false);
assert.equal(sha256(macroSource), sourceHash);
assert.match(quarantined.suggestedOutputFileName, /\.PIMATH-CLEAN\.docx$/);
const quarantinedParts = unzipSync(quarantined.bytes);
assert.equal(quarantinedParts["word/vbaProject.bin"], undefined);
assert.equal(sha256(quarantinedParts["word/document.xml"]), sourceDocumentHash);
assert.equal(sha256(quarantinedParts["word/media/image1.png"]), sourceMediaHash);
assert.match(strFromU8(quarantinedParts["[Content_Types].xml"]), /application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document\.main\+xml/);
assert.doesNotMatch(strFromU8(quarantinedParts["word/_rels/document.xml.rels"]), /vbaProject/i);

const cleaned = safeCleanDocx(quarantined.bytes, quarantined.suggestedOutputFileName);
assert.equal(cleaned.safeCleanQa, "PASS");
assert.equal(cleaned.sourceBytesMutated, false);
assert.equal(cleaned.protectedFingerprintMatch, true);
const cleanedParts = unzipSync(cleaned.bytes);
assert.equal(sha256(cleanedParts["word/media/image1.png"]), sourceMediaHash);
assert.match(strFromU8(cleanedParts["word/document.xml"]), /<m:oMath>/);
assert.doesNotMatch(strFromU8(cleanedParts["word/document.xml"]), /Văn bản   có khoảng trắng/);
assert.equal(inspectWordActiveContent(cleaned.bytes).hasVba, false);

const activeXSource = makeFixture({ vba: true, activeX: true });
const activeXInspection = inspectWordActiveContent(activeXSource);
assert.equal(activeXInspection.hasActiveX, true);
assert.equal(activeXInspection.canSanitizeVba, false);
assert.throws(() => sanitizeVbaToDocx(activeXSource, "blocked.docm"), /WORD_ACTIVEX_BLOCKED/);

console.log("PIMATH_WORD_LEGACY_INTEGRATION_QA=PASS");
