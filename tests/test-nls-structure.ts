import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { KNTT_SOURCE_DEFINITIONS, NLS_SOURCE_IDS, registerKnttSources } from "../src/modules/nls-source-registry/index.js";
import { discoverKnttStructure, serializeStructureManifest, validateStructureManifest } from "../src/modules/nls-source-registry/structure.js";

const root = process.env.NA_MATH_NLS_SOURCE_ROOT || "D:\\NA-MATH-NLS-AI-SOURCES";
const before = registerKnttSources(root);
const manifest = discoverKnttStructure({ sourceRoot: root });
validateStructureManifest(manifest);
assert.equal(manifest.books.length, 9);
assert.deepEqual(manifest.books.map((book) => book.sourceId), [...NLS_SOURCE_IDS]);
assert.equal(manifest.fullBookOcr, false);
assert.ok(manifest.ocrPagesTotal < manifest.totalPdfPages);
assert.ok(manifest.ocrPageRatio > 0 && manifest.ocrPageRatio < 1);
assert.ok(manifest.books.every((book) => book.pdfStartPage === 1 && book.pdfEndPage === book.pageCount));
const ids = new Set<string>();
for (const book of manifest.books) {
  assert.equal(book.parentId, null);
  let previousChapterOrder = 0;
  for (const chapter of book.chapters) {
    assert.ok(!ids.has(chapter.id)); ids.add(chapter.id); assert.equal(chapter.parentId, book.id); assert.ok(chapter.order > previousChapterOrder); previousChapterOrder = chapter.order;
    let previousLessonOrder = 0;
    for (const lesson of chapter.lessons ?? []) { assert.ok(!ids.has(lesson.id)); ids.add(lesson.id); assert.equal(lesson.parentId, chapter.id); assert.ok(lesson.order > previousLessonOrder); previousLessonOrder = lesson.order; assert.ok(lesson.evidence.length > 0); assert.ok(lesson.printedStartPage === null || lesson.printedStartPage > 0); }
  }
}
assert.equal(serializeStructureManifest(manifest), serializeStructureManifest(discoverKnttStructure({ sourceRoot: root })));
const after = registerKnttSources(root);
for (const source of KNTT_SOURCE_DEFINITIONS) assert.equal(readFileSync(join(root, source.filename)).length, before.sources.find((item) => item.filename === source.filename)!.fileSize);
assert.deepEqual(after.sources.map((source) => source.sha256), before.sources.map((source) => source.sha256));
assert.throws(() => discoverKnttStructure({ sourceRoot: root, frontMatterPages: 31 }), /./);
const committed = JSON.parse(readFileSync(resolve("docs", "nls", "na-math-kntt-structure.manifest.json"), "utf8"));
assert.deepEqual(committed, manifest);
assert.ok(!JSON.stringify(committed).includes(root));
console.log("NLS_STRUCTURE_DISCOVERY_QA=PASS\nSTRUCTURE_SCHEMA_QA=PASS\nSTRUCTURE_ID_UNIQUENESS_QA=PASS\nSTRUCTURE_PARENT_CHILD_QA=PASS\nSTRUCTURE_ORDER_QA=PASS\nSTRUCTURE_PAGE_RANGE_QA=PASS\nPRINTED_PDF_PAGE_MAPPING_QA=PASS\nTOC_DISCOVERY_QA=PASS\nBOUNDARY_VERIFICATION_QA=PASS\nOCR_SCOPE_QA=PASS\nSOURCE_TRACEABILITY_QA=PASS\nSOURCE_IMMUTABILITY_QA=PASS\nMANIFEST_DETERMINISM_QA=PASS");
