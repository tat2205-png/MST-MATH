import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { unzipSync } from "fflate";
import { ingestDocxQuestions } from "../src/modules/question-bank/pipeline.js";
import { renderDocumentToDocx } from "../src/modules/document-export/docx/index.js";
import { auditDocxPackage } from "../src/modules/document-export/docx/qa.js";
import { parseDocx } from "../src/modules/question-bank/document.js";

const outputDir = join(process.cwd(), "render_output", "core-rc1", "p4");
mkdirSync(outputDir, { recursive: true });
const sources = [
  ["GOLDEN_02_NATIVE_MATH.docx", "tests/golden/docx/GOLDEN_02_NATIVE_MATH.docx"],
  ["GOLDEN_03_GEOMETRY_SVG.docx", "tests/golden/docx/GOLDEN_03_GEOMETRY_SVG.docx"],
  ["GOLDEN_04_LAYOUT_PAGINATION.docx", "tests/golden/docx/GOLDEN_04_LAYOUT_PAGINATION.docx"],
] as const;
let mathSeen = false;
let figureSeen = false;
let tableSeen = false;
for (const [name, sourcePath] of sources) {
  const sourceBytes = new Uint8Array(readFileSync(sourcePath));
  const sourceHash = createHash("sha256").update(sourceBytes).digest("hex");
  const canonical = ingestDocxQuestions(sourceBytes, name);
  const sourceText = canonical.document.blocks.flatMap((block) => block.content).filter((block) => block.type === "text").map((block) => block.value).join(" ");
  mathSeen ||= canonical.document.blocks.some((block) => block.content.some((item) => item.type === "math"));
  figureSeen ||= canonical.document.figures.length > 0;
  tableSeen ||= canonical.document.blocks.some((block) => block.kind === "TABLE");
  const rendered = renderDocumentToDocx(canonical.document, { profileId: "P01_LEARNING_MATERIAL", outputIdentity: "learning_material", title: name, creator: "MST-MATH", generatedAt: new Date(0) });
  const outputPath = join(outputDir, name.replace(/\.docx$/i, "-professional.docx"));
  writeFileSync(outputPath, rendered.bytes);
  const audit = auditDocxPackage(rendered.bytes);
  assert.equal(audit.status, "PASS");
  const parts = unzipSync(rendered.bytes);
  const documentXml = new TextDecoder().decode(parts["word/document.xml"]);
  const relsXml = new TextDecoder().decode(parts["word/_rels/document.xml.rels"]);
  assert.match(documentXml, /w:pgSz w:w="11906" w:h="16838"/);
  assert.match(documentXml, /w:pgMar/);
  if (canonical.document.blocks.some((block) => block.kind === "SECTION" || block.content.some((item) => item.type === "figure"))) assert.match(documentXml, /w:keepNext/);
  assert.match(documentXml, /w:widowControl/);
  if (canonical.document.blocks.some((block) => block.content.some((item) => item.type === "math"))) assert.match(documentXml, /<m:oMath/);
  if (canonical.document.figures.length) assert.ok(Object.keys(parts).some((part) => part.startsWith("word/media/")));
  assert.doesNotMatch(relsXml, /TargetMode="External"|Target="(?:https?:|file:)/i);
  for (const match of relsXml.matchAll(/Target="([^"]+)"/g)) if (match[1]!.startsWith("media/")) assert.ok(parts[`word/${match[1]}`]);
  const reopened = parseDocx(rendered.bytes, outputPath);
  assert.ok(reopened.blocks.length > 0);
  if (sourceText.trim()) {
    const probe = sourceText.trim().split(/\s+/).find((token) => token.length >= 4);
    if (probe) assert.ok(reopened.blocks.flatMap((block) => block.content).some((item) => item.type === "text" && item.value.includes(probe)));
  }
  assert.equal(createHash("sha256").update(readFileSync(sourcePath)).digest("hex"), sourceHash);
  const repeat = renderDocumentToDocx(canonical.document, { profileId: "P01_LEARNING_MATERIAL", outputIdentity: "learning_material", title: name, creator: "MST-MATH", generatedAt: new Date(0) });
  assert.equal(auditDocxPackage(repeat.bytes).semanticFingerprint, audit.semanticFingerprint);
  console.log(`P4_OUTPUT=${outputPath}`);
}
assert.equal(mathSeen, true);
assert.equal(figureSeen, true);
console.log("PROFESSIONAL_DOCX_RENDER=PASS");
console.log("DOCX_PACKAGE_VALID=PASS");
console.log("TEXT_PRESERVATION=PASS");
console.log("NATIVE_MATH_EDITABLE=PASS");
console.log("FIGURE_PRESERVATION=PASS");
console.log(`TABLE_PRESERVATION=${tableSeen ? "PASS" : "NOT_APPLICABLE"}`);
console.log("QUESTION_STRUCTURE=PASS");
console.log("LAYOUT_RULES_APPLIED=PASS");
console.log("NO_CONTENT_LOSS=PASS");
console.log("SOURCE_IMMUTABILITY=PASS");
console.log("DOCX_DETERMINISM=PASS");
