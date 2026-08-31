import assert from "node:assert/strict";
import { extractExplicitSourceMcqAnswer, normalizeCandidate } from "../src/modules/question-bank/extraction.ts";
import type { DocumentIR, DocumentQuestionCandidate } from "../src/modules/question-bank/types.ts";

const cases: Array<[string, "A" | "B" | "C" | "D" | undefined]> = [
  ["Chọn A", "A"], ["Chọn B.", "B"], ["Đáp án: C", "C"], ["Đáp án đúng: D", "D"],
  ["Vậy chọn A", "A"], ["  đáp án   :   B ) ", "B"], ["Chọn C ... Đáp án: C", "C"],
  ["Lời giải. Chọn A ... Đáp án: B", undefined], ["Loại A", undefined], ["Xét phương án B", undefined],
  ["Nếu chọn C thì", undefined], ["A và D không đúng", undefined], ["Ta có A = 1", undefined],
];
for (const [text, expected] of cases) assert.equal(extractExplicitSourceMcqAnswer(text), expected, text);

const candidate: DocumentQuestionCandidate = {
  id: "candidate", questionIndex: 1, questionLabel: "Câu 1", rawBlocks: [],
  textBlocks: [{ type: "text", value: "Câu 1. A. 25 B. 10" }, { type: "text", value: "Lời giải" }, { type: "text", value: "Chọn A Vậy kết quả là 25." }],
  mathBlocks: [], figureAnchors: [], sourceLocations: ["word/document.xml:p:3"], parseWarnings: [], questionTypeCandidate: "MULTIPLE_CHOICE",
};
const document: DocumentIR = { sourceDocument: "source.docx", sourceHash: "source-hash", blocks: [], figures: [], warnings: [] };
const normalized = normalizeCandidate(candidate, document);
assert.deepEqual(normalized.answer, [{ type: "text", value: "A" }]);
assert.match(JSON.stringify(normalized.solution), /Chọn A/);
assert.equal(normalized.id, "source-hash-q1");
assert.equal(normalized.source.sourceHash, "source-hash");
assert.deepEqual(normalized.source.sourceLocations, ["word/document.xml:p:3"]);
console.log("EXPLICIT_SOURCE_MCQ_ANSWER_EXTRACTION_QA=PASS\nNON_INFERENCE_QA=PASS\nCONFLICT_FAIL_CLOSED_QA=PASS\nSOLUTION_PRESERVATION_QA=PASS\nQUESTION_ID_STABILITY_QA=PASS\nSOURCE_PROVENANCE_QA=PASS");
