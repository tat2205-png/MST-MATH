import assert from "node:assert/strict";
import { segmentQuestions } from "../src/modules/question-bank/segmentation.js";
import { segmentCanonicalQuestions } from "../src/modules/question-bank/canonical-segmentation.js";
import {
  findAnswerSolutionAppendixRegions,
  findTerminalEmbeddedReferenceAnswerFooter,
} from "../src/modules/question-bank/source-region-classification.js";
import type { ContentBlock, DocumentBlock, DocumentIR } from "../src/modules/document-engine/document-ir.js";

const HASH = "abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd";

const text = (value: string, paragraph: number): ContentBlock => ({
  type: "text",
  value,
  sourceLocation: `word/document.xml/paragraph[${paragraph}]/run[0]`,
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
  const q6 = candidates[0];
  assert.equal(q6.questionIndex, 6);
  assert.deepEqual(q6.rawBlocks.map((block) => block.id), ["paragraph-0", "paragraph-1", "paragraph-2", "paragraph-3"]);
  const q6Text = q6.textBlocks.map((block) => block.type === "text" ? block.value : "").join(" ");
  assert.match(q6Text, /cấp số cộng tăng/u);
  assert.match(q6Text, /bằng tổng của cả ba số/u);
  assert.doesNotMatch(q6Text, /ĐÁP ÁN THAM KHẢO|Được thực hiện bởi AI/iu);
}

// Word can place valid final-question text and the terminal reference-answer
// heading in the same physical paragraph. Preserve the valid prefix while
// slicing the footer from logical question flow.
{
  const mixed = paragraph(
    3,
    "Tính giá trị của biểu thức P. ĐÁP ÁN THAM KHẢO Được thực hiện bởi AI",
  );
  const document = documentFromBlocks("embedded-reference-answer-footer", [
    paragraph(0, "Câu 6. Xét đồng thời hai điều kiện sau:"),
    paragraph(1, "Điều kiện thứ nhất.", "1."),
    paragraph(2, "Điều kiện thứ hai.", "2."),
    mixed,
  ]);

  const embedded = findTerminalEmbeddedReferenceAnswerFooter(document);
  assert.ok(embedded);
  assert.equal(embedded.blockId, "paragraph-3");
  assert.ok(embedded.charOffset > 0);
  assert.ok(embedded.evidence.includes("EMBEDDED_IN_PHYSICAL_BLOCK"));

  const candidates = segmentQuestions(document);
  assert.equal(candidates.length, 1);
  const q6Text = candidates[0].textBlocks.map((block) => block.type === "text" ? block.value : "").join(" ");
  assert.match(q6Text, /Tính giá trị của biểu thức P/u);
  assert.doesNotMatch(q6Text, /ĐÁP ÁN THAM KHẢO|Được thực hiện bởi AI/iu);
  assert.ok(candidates[0].rawBlocks.some((block) => block.id === "paragraph-3"));
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
  assert.deepEqual(candidates.map((candidate) => candidate.questionIndex), [1, 2]);
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
