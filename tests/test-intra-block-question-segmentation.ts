import assert from "node:assert/strict";
import { segmentQuestions } from "../src/modules/question-bank/segmentation.js";
import { segmentCanonicalQuestions } from "../src/modules/question-bank/canonical-segmentation.js";
import { discoverAnswerSolutionSourceBlocks } from "../src/modules/question-bank/answer-solution-validator.js";
import { findAnswerSolutionAppendixRegions } from "../src/modules/question-bank/source-region-classification.js";
import type { ContentBlock, DocumentBlock, DocumentIR } from "../src/modules/document-engine/document-ir.js";
import { renderSourceReconstruction } from "../scripts/render-word-beta-human-review.js";

const HASH = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const text = (value: string, run: number, paragraph = 0): ContentBlock => ({
  type: "text",
  value,
  sourceLocation: `word/document.xml/paragraph[${paragraph}]/run[${run}]`,
});

const paragraph = (order: number, content: ContentBlock[], kind: "PARAGRAPH" | "SECTION" = "PARAGRAPH"): DocumentBlock => ({
  id: `paragraph-${order}`,
  kind,
  order,
  paragraphIndex: order,
  sourceLocation: `word/document.xml/body/p[${order}]`,
  content,
});

const documentFromBlocks = (name: string, blocks: DocumentBlock[]): DocumentIR => ({
  id: `docx-fixture-${name}`,
  sourceDocumentId: `docx-fixture-${name}`,
  sourceDocument: `${name}.docx`,
  sourceHash: HASH,
  warnings: [],
  figures: [],
  blocks,
  mathObjects: [],
  assetObjects: [],
});

function fixture(kind: "PARAGRAPH" | "SECTION"): DocumentIR {
  return documentFromBlocks(`multi-question-${kind.toLowerCase()}`, [
    {
      id: "paragraph-0",
      kind,
      order: 0,
      paragraphIndex: 0,
      sourceLocation: "word/document.xml/body/p[0]",
      content: [
        text("Câu 1: Tính giá trị thứ nhất. ", 0),
        text("Kết quả: 1. ", 1),
        text("Câu 2: Tính giá trị thứ hai. ", 2),
        text("Kết quả: 2. ", 3),
        text("Câu 3: Tính giá trị thứ ba. ", 4),
        text("Kết quả: 3.", 5),
      ],
    },
  ]);
}

for (const kind of ["PARAGRAPH", "SECTION"] as const) {
  const document = fixture(kind);
  const candidates = segmentQuestions(document);
  assert.equal(candidates.length, 3, `${kind}: logical questions must split inside one physical source block`);
  assert.deepEqual(candidates.map((candidate) => candidate.questionIndex), [1, 2, 3]);
  assert.deepEqual(candidates.map((candidate) => candidate.rawBlocks.length), [1, 1, 1]);

  // All logical questions come from the same physical source object. Physical
  // identity must be preserved while candidate content is sliced at markers.
  assert.ok(candidates.every((candidate) => candidate.rawBlocks[0].id === "paragraph-0"));
  assert.ok(candidates[0].textBlocks.some((block) => block.type === "text" && block.value.includes("Câu 1")));
  assert.ok(!candidates[0].textBlocks.some((block) => block.type === "text" && block.value.includes("Câu 2")));
  assert.ok(candidates[1].textBlocks.some((block) => block.type === "text" && block.value.includes("Câu 2")));
  assert.ok(!candidates[1].textBlocks.some((block) => block.type === "text" && block.value.includes("Câu 3")));
  assert.ok(candidates[2].textBlocks.some((block) => block.type === "text" && block.value.includes("Câu 3")));

  const questions = segmentCanonicalQuestions(document);
  assert.equal(questions.length, 3);
  assert.deepEqual(questions.map((question) => question.questionNumber), [1, 2, 3]);
  assert.deepEqual(questions.map((question) => question.id), [
    "0123456789ab-q1",
    "0123456789ab-q2",
    "0123456789ab-q3",
  ]);
  assert.ok(questions.every((question) => question.sourceObjectIds.length === 1 && question.sourceObjectIds[0] === "paragraph-0"));

  const source1 = renderSourceReconstruction(document, questions[0]);
  const source2 = renderSourceReconstruction(document, questions[1]);
  const source3 = renderSourceReconstruction(document, questions[2]);
  assert.match(source1, /Câu 1:/);
  assert.doesNotMatch(source1, /Câu 2:/);
  assert.match(source2, /Câu 2:/);
  assert.doesNotMatch(source2, /Câu 1:|Câu 3:/);
  assert.match(source3, /Câu 3:/);
  assert.doesNotMatch(source3, /Câu 2:/);
}

// Real-corpus pattern: the next explicit question can begin in the middle of a
// Word text run after a terminal short-answer cue. This must split without any
// document-name or question-number hardcode.
{
  const document = documentFromBlocks("embedded-after-kq", [
    paragraph(0, [text("Câu 5. Tính diện tích phần được phủ màu.", 0, 0)]),
    paragraph(1, [text(" KQ: □ □ □ □ Câu 6. Cho tập hợp A và tính xác suất cần tìm.", 0, 1)]),
  ]);
  const candidates = segmentQuestions(document);
  assert.equal(candidates.length, 2);
  assert.deepEqual(candidates.map((candidate) => candidate.questionIndex), [5, 6]);
  assert.ok(candidates[0].textBlocks.some((block) => block.type === "text" && block.value.includes("KQ:")));
  assert.ok(!candidates[0].textBlocks.some((block) => block.type === "text" && block.value.includes("Câu 6")));
  assert.ok(candidates[1].textBlocks.some((block) => block.type === "text" && block.value.includes("Câu 6")));
}

// A worked-solution appendix can repeat "Câu N" labels, but those labels are
// solution-entry labels, not new source questions. The appendix is retained in
// the source ledger and excluded from QuestionIR segmentation.
{
  const document = documentFromBlocks("solution-appendix", [
    paragraph(0, [text("Câu 1. Tính giá trị của biểu thức.", 0, 0)]),
    paragraph(1, [text("KQ: 12", 0, 1)]),
    paragraph(2, [text("Lời giải", 0, 2)]),
    paragraph(3, [text("Câu 1: Ta có biểu thức bằng 12. Kết quả: 12", 0, 3)]),
    paragraph(4, [text("Câu 2: Vì điều kiện đã cho nên suy ra kết quả thứ hai.", 0, 4)]),
    paragraph(5, [text("Câu 3: Do đó đáp số cuối cùng được xác định.", 0, 5)]),
  ]);

  const regions = findAnswerSolutionAppendixRegions(document);
  assert.equal(regions.length, 1);
  assert.equal(regions[0].kind, "SOLUTION");
  assert.deepEqual(regions[0].markerNumbers, [1, 2, 3]);

  const candidates = segmentQuestions(document);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].questionIndex, 1);
  assert.ok(!candidates.some((candidate) => candidate.rawBlocks.some((block) => block.order >= 2)));

  const sourceRows = discoverAnswerSolutionSourceBlocks(document);
  const appendix = sourceRows.find((row) => row.sourceBlockId.includes("solution-appendix"));
  assert.ok(appendix);
  assert.equal(appendix.structureType, "SOLUTION");
  assert.ok(appendix.sourceObjectIds.includes("paragraph-5"));
  assert.ok(appendix.detectionEvidence.includes("REPEATED_QUESTION_MARKERS"));
}

console.log("INTRA_BLOCK_QUESTION_SEGMENTATION_TESTS=PASS");
