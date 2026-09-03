import assert from "node:assert/strict";
import { unzipSync } from "fflate";
import {
  planFourOptionLayout,
  type FourOptionMeasure,
} from "../src/modules/document-export/docx/mcq-four-option-layout.ts";
import { renderDocx, type CanonicalExportPackage } from "../src/modules/question-bank/export.ts";

const measured = (values: string[]): FourOptionMeasure[] =>
  values.map((plainText, index) => ({ label: "ABCD"[index], plainText }));

assert.equal(planFourOptionLayout(measured(["1", "2", "3", "4"])).layout, "FOUR_INLINE");
assert.equal(
  planFourOptionLayout(
    measured([
      "Hàm số đồng biến trên khoảng đã cho",
      "Hàm số nghịch biến trên khoảng đã cho",
      "Hàm số có đúng một điểm cực trị",
      "Hàm số không có điểm cực trị",
    ]),
  ).layout,
  "TWO_BY_TWO",
);
assert.equal(
  planFourOptionLayout(
    measured([
      "Khẳng định thứ nhất có nội dung rất dài và cần được trình bày trọn vẹn trên một dòng đáp án riêng để tránh chồng lấn công thức.",
      "Khẳng định thứ hai cũng chứa nhiều dữ kiện, ký hiệu và diễn giải nên không phù hợp với bố cục hai cột.",
      "Khẳng định thứ ba là một lựa chọn dài dùng để kiểm tra cơ chế tự động chuyển sang dạng bốn dòng độc lập.",
      "Khẳng định thứ tư tiếp tục đủ dài để bộ dàn trang không cố ép các lựa chọn vào cùng một hàng.",
    ]),
  ).layout,
  "STACKED",
);
assert.equal(
  planFourOptionLayout([
    { label: "A", plainText: "Một hình hoặc bảng", hasBlockObject: true },
    { label: "B", plainText: "2" },
    { label: "C", plainText: "3" },
    { label: "D", plainText: "4" },
  ]).layout,
  "STACKED",
);

const question = (id: string, position: number, values: string[]) => ({
  id,
  sectionId: "mcq",
  position,
  type: "MULTIPLE_CHOICE" as const,
  stem: [{ type: "text" as const, value: `Stem ${id}` }],
  options: values.map((value, index) => ({
    label: "ABCD"[index],
    content: [{ type: "text" as const, value }],
  })),
  trueFalseItems: [],
  subquestions: [],
  figures: [],
});

const pkg: CanonicalExportPackage = {
  schemaVersion: 1,
  id: "adaptive-layout-test",
  kind: "ASSESSMENT_EXPORT",
  audience: "STUDENT",
  assessment: {
    id: "assessment-adaptive-layout",
    title: "Adaptive MCQ Layout",
    seed: "layout-v1",
    bankFingerprint: "fixture",
  },
  sections: [
    {
      id: "mcq",
      title: "PHẦN I",
      questionType: "MULTIPLE_CHOICE",
      questions: [
        question("q-short", 1, ["1", "2", "3", "4"]),
        question("q-medium", 2, [
          "Hàm số đồng biến trên khoảng đã cho",
          "Hàm số nghịch biến trên khoảng đã cho",
          "Hàm số có đúng một điểm cực trị",
          "Hàm số không có điểm cực trị",
        ]),
        question("q-long", 3, [
          "Khẳng định thứ nhất có nội dung rất dài và cần được trình bày trọn vẹn trên một dòng đáp án riêng để tránh chồng lấn công thức.",
          "Khẳng định thứ hai cũng chứa nhiều dữ kiện, ký hiệu và diễn giải nên không phù hợp với bố cục hai cột.",
          "Khẳng định thứ ba là một lựa chọn dài dùng để kiểm tra cơ chế tự động chuyển sang dạng bốn dòng độc lập.",
          "Khẳng định thứ tư tiếp tục đủ dài để bộ dàn trang không cố ép các lựa chọn vào cùng một hàng.",
        ]),
      ],
    },
  ],
  questionRefs: ["q-short", "q-medium", "q-long"],
  assets: [],
  diagnostics: [],
};

const files = unzipSync(renderDocx(pkg));
const documentXml = new TextDecoder().decode(files["word/document.xml"]);
const tabCount = (documentXml.match(/<w:tab\/>/g) ?? []).length;
assert.equal(tabCount, 5, "FOUR_INLINE must emit 3 tabs and TWO_BY_TWO must emit 2 tabs");
assert.match(documentXml, /w:pos="2340"/);
assert.match(documentXml, /w:pos="4680"/);
assert.match(documentXml, /w:pos="7020"/);
assert.match(documentXml, /A\. /);
assert.match(documentXml, /B\. /);
assert.match(documentXml, /C\. /);
assert.match(documentXml, /D\. /);
assert.doesNotMatch(documentXml, /A\.\./);

console.log(
  "MCQ_FOUR_OPTION_PLANNER_QA=PASS\n" +
  "MCQ_FOUR_INLINE_QA=PASS\n" +
  "MCQ_TWO_BY_TWO_QA=PASS\n" +
  "MCQ_STACKED_QA=PASS\n" +
  "MCQ_BLOCK_OBJECT_FAIL_CLOSED_QA=PASS\n" +
  "MCQ_DOCX_TAB_LAYOUT_QA=PASS\n" +
  "PIMATH_MCQ_4_OPTION_ADAPTIVE_LAYOUT_V1=PASS",
);
