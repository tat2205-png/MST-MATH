import assert from "node:assert/strict";
import { segmentCanonicalQuestions } from "../src/modules/question-bank/canonical-segmentation.js";
import type { ContentBlock, DocumentIR } from "../src/modules/document-engine/document-ir.js";
import { canonicalQuestionIdentityKey } from "../src/modules/question-bank/canonical-boundary-remap.js";

const text = (value: string, run: number): ContentBlock => ({
  type: "text",
  value,
  sourceLocation: `word/document.xml/paragraph[0]/run[${run}]`,
});

const document: DocumentIR = {
  id: "doc-source-slice",
  sourceDocumentId: "doc-source-slice",
  sourceDocument: "source-slice.docx",
  sourceHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
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
        text("Câu 1: Tính giá trị thứ nhất. Kết quả: 1. ", 0),
        text("Câu 2: Tính giá trị thứ hai. Kết quả: 2.", 1),
      ],
    },
  ],
  mathObjects: [],
  assetObjects: [],
};

const questions = segmentCanonicalQuestions(document);
assert.equal(questions.length, 2);
assert.deepEqual(questions.map(question => question.sourceObjectIds), [["paragraph-0"], ["paragraph-0"]]);
assert.ok(questions.every(question => question.sourceSliceIds?.length === 1));
assert.notDeepEqual(questions[0].sourceSliceIds, questions[1].sourceSliceIds);
assert.match(questions[0].sourceSliceIds![0], /question-segment-1/u);
assert.match(questions[1].sourceSliceIds![0], /question-segment-2/u);
assert.notEqual(canonicalQuestionIdentityKey(questions[0]), canonicalQuestionIdentityKey(questions[1]));

console.log("LOGICAL_SOURCE_SLICE_IDENTITY_TESTS=PASS");
