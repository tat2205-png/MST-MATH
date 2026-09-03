import assert from "node:assert/strict";
import { segmentQuestions } from "../src/modules/question-bank/segmentation.js";
import { segmentCanonicalQuestions } from "../src/modules/question-bank/canonical-segmentation.js";
import type { ContentBlock, DocumentIR } from "../src/modules/document-engine/document-ir.js";
import { renderSourceReconstruction } from "../scripts/render-word-beta-human-review.js";

const text = (value: string, run: number): ContentBlock => ({
  type: "text",
  value,
  sourceLocation: `word/document.xml/paragraph[0]/run[${run}]`,
});

const document: DocumentIR = {
  id: "docx-fixture",
  sourceDocumentId: "docx-fixture",
  sourceDocument: "multi-question-paragraph.docx",
  sourceHash: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  warnings: [],
  figures: [],
  blocks: [
    {
      id: "paragraph-0",
      kind: "PARAGRAPH",
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
  ],
  mathObjects: [],
  assetObjects: [],
};

const candidates = segmentQuestions(document);
assert.equal(candidates.length, 3);
assert.deepEqual(candidates.map((candidate) => candidate.questionIndex), [1, 2, 3]);
assert.deepEqual(candidates.map((candidate) => candidate.rawBlocks.length), [1, 1, 1]);

// All logical questions come from the same physical paragraph. Physical source identity
// must be preserved while candidate content is sliced at explicit in-paragraph markers.
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

console.log("INTRA_BLOCK_QUESTION_SEGMENTATION_TESTS=PASS");
