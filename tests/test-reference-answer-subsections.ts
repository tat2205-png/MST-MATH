import assert from "node:assert/strict";
import { segmentQuestions } from "../src/modules/question-bank/segmentation.js";
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

const paragraph = (order: number, value: string): DocumentBlock => ({
  id: `paragraph-${order}`,
  kind: "PARAGRAPH",
  order,
  paragraphIndex: order,
  sourceLocation: `word/document.xml/body/p[${order}]`,
  content: [text(value, order)],
});

const table = (order: number, cells: string[]): DocumentBlock => ({
  id: `table-${order}`,
  kind: "TABLE",
  order,
  sourceLocation: `word/document.xml/body/tbl[${order}]`,
  content: [{
    type: "table",
    sourceLocation: `word/document.xml/body/tbl[${order}]`,
    cells: cells.map((value, index) => [text(value, order, index)]),
  }],
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

// Reference-answer material can have its own PHẦN I / II / III subsections.
// Those headings must not be mistaken for a return to question flow when the
// tail contains independent answer/solution evidence.
{
  const document = documentFromBlocks("structured-answer-subsections", [
    paragraph(0, "Câu 6. Xét đồng thời hai điều kiện sau:"),
    paragraph(1, "Điều kiện thứ nhất."),
    paragraph(2, "Điều kiện thứ hai. Tính giá trị của biểu thức P."),
    paragraph(3, "ĐÁP ÁN THAM KHẢO\n Được thực hiện bởi AI"),
    paragraph(4, "PHẦN I: Trắc nghiệm bốn phương án lựa chọn."),
    table(5, ["Câu", "Đáp án", "1", "C", "2", "A"]),
    paragraph(6, "PHẦN II: Trắc nghiệm Đúng / Sai"),
    table(7, ["Câu", "Ý a)", "Ý b)", "1", "Đúng", "Sai"]),
    paragraph(8, "PHẦN III: Trắc nghiệm trả lời ngắn"),
    paragraph(9, "HƯỚNG DẪN GIẢI TRẮC NGHIỆM TRẢ LỜI NGẮN"),
    paragraph(10, "Câu 1: Ta có kết quả: 0"),
    paragraph(11, "Câu 2: Ta có kết quả: 1"),
  ]);

  const footer = findTerminalEmbeddedReferenceAnswerFooter(document);
  assert.ok(footer, "structured answer subsections must still produce a terminal footer");
  assert.equal(footer.blockId, "paragraph-3");
  assert.ok(footer.evidence.includes("STRUCTURED_ANSWER_SUBSECTIONS"));
  assert.ok(
    footer.evidence.includes("ANSWER_KEY_TABLE") ||
    footer.evidence.includes("SOLUTION_HEADING_AFTER_REFERENCE") ||
    footer.evidence.includes("RESTARTED_ANSWER_ENTRIES_WITH_RESULTS"),
  );

  const regions = findAnswerSolutionAppendixRegions(document);
  assert.equal(regions.length, 1);
  assert.equal(regions[0].headingBlockId, "paragraph-3");
  assert.ok(regions[0].evidence.includes("STRUCTURED_ANSWER_SUBSECTIONS"));

  const candidates = segmentQuestions(document);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].questionIndex, 6);
  const q6Text = candidates[0].textBlocks
    .map((block) => block.type === "text" ? block.value : "")
    .join(" ");
  assert.match(q6Text, /Điều kiện thứ hai/u);
  assert.doesNotMatch(q6Text, /ĐÁP ÁN THAM KHẢO|PHẦN I|HƯỚNG DẪN GIẢI|Câu 1:/iu);
}

// Fail closed when a standalone reference-answer-looking heading is followed by
// a real question section but there is no answer-key or solution evidence.
{
  const document = documentFromBlocks("reference-heading-before-real-section", [
    paragraph(0, "Câu 1. Tính giá trị."),
    paragraph(1, "ĐÁP ÁN THAM KHẢO"),
    paragraph(2, "PHẦN II: TỰ LUẬN"),
    paragraph(3, "Câu 2. Chứng minh mệnh đề sau."),
  ]);

  assert.equal(findTerminalEmbeddedReferenceAnswerFooter(document), undefined);
}

console.log("REFERENCE_ANSWER_SUBSECTION_TESTS=PASS");
