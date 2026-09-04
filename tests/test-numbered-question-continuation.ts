import assert from "node:assert/strict";
import { segmentQuestions } from "../src/modules/question-bank/segmentation.js";
import { segmentCanonicalQuestions } from "../src/modules/question-bank/canonical-segmentation.js";
import {
  findAnswerSolutionAppendixRegions,
  findTerminalEmbeddedReferenceAnswerFooter,
} from "../src/modules/question-bank/source-region-classification.js";
import type { ContentBlock, DocumentBlock, DocumentIR } from "../src/modules/document-engine/document-ir.js";

const HASH = "abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd";

const text = (value: string, paragraph: number, run = 0): ContentBlock => ({
  type: "text",
  value,
  sourceLocation: `word/document.xml/paragraph[${paragraph}]/run[${run}]`,
});

const paragraph = (order: number, value: string, numbering?: string): DocumentBlock => ({
  id: `paragraph-${order}`,
  kind: "PARAGRAPH",
  order,
  paragraphIndex: order,
  sourceLocation: `word/document.xml/body/p[${order}]`,
  content: [text(value, order)],
  ...(numbering ? { numbering } : {}),
});

const paragraphRuns = (order: number, values: string[]): DocumentBlock => ({
  id: `paragraph-${order}`,
  kind: "PARAGRAPH",
  order,
  paragraphIndex: order,
  sourceLocation: `word/document.xml/body/p[${order}]`,
  content: values.map((value, run) => text(value, order, run)),
});

const documentFromBlocks = (name: string, blocks: DocumentBlock[]): DocumentIR => ({
  id: `docx-${name}`,
  sourceDocumentId: `docx-${name}`,
  sourceDocument: `${name}.docx`,
  sourceHash: HASH,
  warnings: [],
  figures: [],
  blocks,
  mathObjects: [],
  assetObjects: [],
});

{
  const document = documentFromBlocks("numbered-continuation", [
    paragraph(0, "Câu 6. Chọn ngẫu nhiên bốn số và xét đồng thời hai điều kiện sau:"),
    paragraph(1, "Ba số ở ba vị trí ngoài có thể sắp xếp thành một cấp số cộng tăng.", "1."),
    paragraph(2, "Số ở vị trí giữa bằng tổng của cả ba số ở ngoài. Tính xác suất cần tìm.", "2."),
    paragraph(3, "KQ: □ □ □ □"),
    paragraph(4, "Câu 7. Tính giá trị của biểu thức tiếp theo."),
  ]);

  const candidates = segmentQuestions(document);
  assert.equal(candidates.length, 2, "numbered subordinate conditions must remain inside Câu 6");
  assert.deepEqual(candidates.map((candidate) => candidate.questionIndex), [6, 7]);

  const q6 = candidates[0];
  assert.deepEqual(q6.rawBlocks.map((block) => block.id), ["paragraph-0", "paragraph-1", "paragraph-2", "paragraph-3"]);
  const q6Text = q6.textBlocks.map((block) => block.type === "text" ? block.value : "").join(" ");
  assert.match(q6Text, /hai điều kiện sau:/u);
  assert.match(q6Text, /cấp số cộng tăng/u);
  assert.match(q6Text, /bằng tổng của cả ba số/u);
  assert.match(q6Text, /Tính xác suất/u);
  assert.doesNotMatch(q6Text, /Câu 7/u);

  const questions = segmentCanonicalQuestions(document);
  assert.equal(questions.length, 2);
  assert.equal(questions[0].questionNumber, 6);
  assert.ok(questions[0].sourceSliceIds?.includes("paragraph-1"));
  assert.ok(questions[0].sourceSliceIds?.includes("paragraph-2"));
}

{
  const document = documentFromBlocks("numbered-continuation-reference-answer", [
    paragraph(0, "Câu 6. Chọn ngẫu nhiên bốn số và xét đồng thời hai điều kiện sau:"),
    paragraph(1, "Ba số ở ba vị trí ngoài có thể sắp xếp thành một cấp số cộng tăng.", "1."),
    paragraph(2, "Số ở vị trí giữa bằng tổng của cả ba số ở ngoài. Tính giá trị của biểu thức P.", "2."),
    paragraph(3, "KQ: □ □ □ □"),
    paragraph(4, "ĐÁP ÁN THAM KHẢO"),
    paragraph(5, "Được thực hiện bởi AI"),
  ]);

  const regions = findAnswerSolutionAppendixRegions(document);
  assert.equal(regions.length, 1);
  assert.equal(regions[0].kind, "ANSWER");
  assert.equal(regions[0].headingBlockId, "paragraph-4");
  assert.ok(regions[0].evidence.includes("REFERENCE_ANSWER_HEADING"));
  assert.ok(regions[0].evidence.includes("TERMINAL_DOCUMENT_REGION"));

  const candidates = segmentQuestions(document);
  assert.equal(candidates.length, 1);
  const q6Text = candidates[0].textBlocks.map((block) => block.type === "text" ? block.value : "").join(" ");
  assert.doesNotMatch(q6Text, /ĐÁP ÁN THAM KHẢO|Được thực hiện bởi AI/iu);
}

// Valid question prefix and reference-answer heading share one physical block.
{
  const document = documentFromBlocks("embedded-reference-answer-footer", [
    paragraph(0, "Câu 6. Xét đồng thời hai điều kiện sau:"),
    paragraph(1, "Điều kiện thứ nhất.", "1."),
    paragraph(2, "Điều kiện thứ hai.", "2."),
    paragraph(3, "Tính giá trị của biểu thức P. ĐÁP ÁN THAM KHẢO Được thực hiện bởi AI"),
  ]);

  const embedded = findTerminalEmbeddedReferenceAnswerFooter(document);
  assert.ok(embedded);
  assert.equal(embedded.blockId, "paragraph-3");
  assert.ok(embedded.charOffset > 0);

  const candidates = segmentQuestions(document);
  assert.equal(candidates.length, 1);
  const q6Text = candidates[0].textBlocks.map((block) => block.type === "text" ? block.value : "").join(" ");
  assert.match(q6Text, /Tính giá trị của biểu thức P/u);
  assert.doesNotMatch(q6Text, /ĐÁP ÁN THAM KHẢO|Được thực hiện bởi AI/iu);
}

// Corpus-like pattern: formatting splits the heading across Word runs, and the
// terminal answer region contains Câu 1..6 entries. Those markers support the
// answer-region classification when they restart from 1; they are not questions.
{
  const document = documentFromBlocks("split-run-reference-answer-entries", [
    paragraph(0, "Câu 6. Xét đồng thời hai điều kiện sau:"),
    paragraph(1, "Điều kiện thứ nhất.", "1."),
    paragraph(2, "Điều kiện thứ hai. Tính giá trị của biểu thức P.", "2."),
    paragraphRuns(3, ["KQ: □ □ □ □ ", "ĐÁP ", "ÁN ", "THAM ", "KHẢO"]),
    paragraph(4, "Câu 1. KQ: 0"),
    paragraph(5, "Câu 2. KQ: 1"),
    paragraph(6, "Câu 3. KQ: 2"),
    paragraph(7, "Câu 4. KQ: 3"),
    paragraph(8, "Câu 5. KQ: 4"),
    paragraph(9, "Câu 6. KQ: 5"),
    paragraph(10, "Được thực hiện bởi AI"),
  ]);

  const embedded = findTerminalEmbeddedReferenceAnswerFooter(document);
  assert.ok(embedded);
  assert.equal(embedded.blockId, "paragraph-3");
  assert.deepEqual(embedded.markerNumbersAfterHeading, [1, 2, 3, 4, 5, 6]);
  assert.ok(embedded.evidence.includes("ANSWER_ENTRIES_RESTART_AT_ONE"));

  const candidates = segmentQuestions(document);
  assert.equal(candidates.length, 1, "reference-answer Câu entries must not become question candidates");
  assert.equal(candidates[0].questionIndex, 6);
  const q6Text = candidates[0].textBlocks.map((block) => block.type === "text" ? block.value : "").join(" ");
  assert.match(q6Text, /KQ:/u);
  assert.doesNotMatch(q6Text, /ĐÁP|THAM|KHẢO|Câu 1|Được thực hiện bởi AI/iu);
}

// Fail closed if a reference-answer-looking phrase is followed by normal flow
// whose explicit numbering does not restart from 1.
{
  const document = documentFromBlocks("reference-answer-mid-flow", [
    paragraph(0, "Câu 1. Tính giá trị."),
    paragraph(1, "Ghi chú ĐÁP ÁN THAM KHẢO"),
    paragraph(2, "Câu 2. Tính giá trị tiếp theo."),
  ]);

  assert.equal(findTerminalEmbeddedReferenceAnswerFooter(document), undefined);
  const candidates = segmentQuestions(document);
  assert.equal(candidates.length, 2);
  assert.deepEqual(candidates.map((candidate) => candidate.questionIndex), [1, 2]);
}

{
  const document = documentFromBlocks("inline-answer-not-footer", [
    paragraph(0, "Câu 1. Tính giá trị của biểu thức."),
    paragraph(1, "Đáp án: 12"),
    paragraph(2, "Câu 2. Tính giá trị tiếp theo."),
  ]);

  assert.equal(findAnswerSolutionAppendixRegions(document).length, 0);
  assert.equal(findTerminalEmbeddedReferenceAnswerFooter(document), undefined);
  const candidates = segmentQuestions(document);
  assert.equal(candidates.length, 2);
}

{
  const document = documentFromBlocks("top-level-word-numbering", [
    paragraph(0, "Tính giá trị của biểu thức thứ nhất?", "1."),
    paragraph(1, "Tính giá trị của biểu thức thứ hai?", "2."),
  ]);

  const candidates = segmentQuestions(document);
  assert.equal(candidates.length, 2, "top-level Word numbering must remain a boundary signal");
}

console.log("NUMBERED_QUESTION_CONTINUATION_TESTS=PASS");
