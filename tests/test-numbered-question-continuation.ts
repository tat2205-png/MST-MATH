import assert from "node:assert/strict";
import { segmentQuestions } from "../src/modules/question-bank/segmentation.js";
import { segmentCanonicalQuestions } from "../src/modules/question-bank/canonical-segmentation.js";
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

// Source-backed R2-36 pattern: an explicit question stem introduces a numbered
// list of subordinate conditions. Word list numbering must not create top-level
// question boundaries; the conditions and final request belong to the question.
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

// Guardrail: genuine top-level Word-numbered questions still split when there
// is no continuation-introduction cue from the current question.
{
  const document = documentFromBlocks("top-level-word-numbering", [
    paragraph(0, "Tính giá trị của biểu thức thứ nhất?", "1."),
    paragraph(1, "Tính giá trị của biểu thức thứ hai?", "2."),
  ]);

  const candidates = segmentQuestions(document);
  assert.equal(candidates.length, 2, "top-level Word numbering must remain a boundary signal");
}

console.log("NUMBERED_QUESTION_CONTINUATION_TESTS=PASS");
