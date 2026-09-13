import assert from "node:assert/strict";
import { extractQuestionsFromDocumentIR } from "../src/modules/question-bank/pipeline.ts";
import type {
  DocumentBlock,
  DocumentIR,
} from "../src/modules/document-engine/document-ir.ts";

function paragraph(
  order: number,
  value: string,
  extra: Partial<DocumentBlock> = {},
): DocumentBlock {
  const sourceLocation = `real-regression:p:${order}`;

  return {
    id: `block-${order}`,
    kind: "PARAGRAPH",
    order,
    paragraphIndex: order,
    content: [{ type: "text", value, sourceLocation }],
    sourceLocation,
    ...extra,
  };
}

const collisionDocument: DocumentIR = {
  sourceDocument: "CHƯƠNG V- ĐẠO HÀM.docx",
  sourceHash: "a".repeat(64),
  figures: [],
  warnings: [],
  blocks: [
    paragraph(
      0,
      "BÀI 31. ĐỊNH NGHĨA VÀ Ý NGHĨA CỦA ĐẠO HÀM",
      { boldLabel: true },
    ),

    // Real textbook / lesson-document structures that MUST NOT create
    // Question Bank records.
    paragraph(
      1,
      "1. MỘT SỐ BÀI TOÁN DẪN ĐẾN KHÁI NIỆM ĐẠO HÀM",
      { style: "Tiu20", boldLabel: true },
    ),
    paragraph(2, "Lũy thừa:"),
    paragraph(
      3,
      "1. với mọi hằng số",
      { numbering: "1", boldLabel: true },
    ),
    paragraph(
      4,
      "2. Đặc biệt: Phép toán",
      { numbering: "1", boldLabel: true },
    ),

    paragraph(
      5,
      "PHẦN I. TRẮC NGHIỆM",
      { kind: "SECTION" },
    ),
    paragraph(6, "Câu 1. Giá trị của biểu thức đã cho là"),
    paragraph(7, "A. 1 B. 2 C. 3 D. 4"),

    // Question numbers are allowed to reset between sections.
    paragraph(
      8,
      "PHẦN IV. TỰ LUẬN",
      { kind: "SECTION" },
    ),
    paragraph(9, "Câu 1. Tính đạo hàm của hàm số đã cho."),
  ],
};

const collisionRun = extractQuestionsFromDocumentIR(collisionDocument);

assert.equal(
  collisionRun.questions.length,
  2,
  "Numbered theory/list paragraphs must not create questions.",
);

assert.deepEqual(
  collisionRun.questions.map((question) => question.index),
  [1, 1],
);

assert.deepEqual(
  collisionRun.questions.map((question) => question.type),
  ["MULTIPLE_CHOICE", "ESSAY"],
);

assert.equal(
  new Set(collisionRun.questions.map((question) => question.id)).size,
  2,
  "Repeated question numbers across sections must have unique IDs.",
);

const serializedQuestions = JSON.stringify(collisionRun.questions);

for (const forbidden of [
  "Lũy thừa:",
  "MỘT SỐ BÀI TOÁN",
  "với mọi hằng số",
  "Đặc biệt: Phép toán",
]) {
  assert.equal(
    serializedQuestions.includes(forbidden),
    false,
    `False-positive source text leaked into Question Bank: ${forbidden}`,
  );
}

console.log("REAL_DOCX_FALSE_POSITIVE_SEGMENTATION_QA=PASS");
console.log("QUESTION_ID_COLLISION_QA=PASS");

const uniqueDocument: DocumentIR = {
  sourceDocument: "canonical-exam.docx",
  sourceHash: "b".repeat(64),
  figures: [],
  warnings: [],
  blocks: [
    paragraph(
      0,
      "PHẦN I. TRẮC NGHIỆM",
      { kind: "SECTION" },
    ),
    paragraph(1, "Câu 1. Tính 1 + 1."),
    paragraph(2, "A. 1 B. 2 C. 3 D. 4"),
    paragraph(3, "Câu 2. Tính 2 + 2."),
    paragraph(4, "A. 2 B. 3 C. 4 D. 5"),
  ],
};

const uniqueRun = extractQuestionsFromDocumentIR(uniqueDocument);

assert.deepEqual(
  uniqueRun.questions.map((question) => question.id),
  [
    `${"b".repeat(12)}-q1`,
    `${"b".repeat(12)}-q2`,
  ],
  "Existing unique canonical IDs must remain unchanged.",
);

console.log("QUESTION_ID_BACKWARD_COMPATIBILITY_QA=PASS");
console.log("MST_MATH_REAL_DOCX_SEGMENTATION_HARDENING_V1=PASS");
