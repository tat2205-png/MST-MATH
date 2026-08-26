import assert from "node:assert/strict";
import { EXAM_QA_ISSUE_CODES, QUESTION_VALIDATORS, VIETNAMESE_HIGH_SCHOOL_12_4_6, adaptQuestionBankRecord, formatVietnameseDecimal, normalizeMarkerAnswer, validateExam, validateNormalizedExamSchema, validateNormalizedQuestionSchema, validateQuestion } from "../src/modules/exam-qa/index.js";
import type { NormalizedExamQuestion } from "../src/modules/exam-qa/index.js";

const mcq = (overrides: Partial<NormalizedExamQuestion> = {}): NormalizedExamQuestion => ({ id: "q1", section: "PART_I", questionNumber: 1, type: "SINGLE_CHOICE", stem: "Giá trị của x là?", options: ["A", "B", "C", "D"].map((key) => ({ key, text: key })), expectedAnswer: "A", ...overrides });

assert.equal(validateNormalizedQuestionSchema(mcq()).valid, true, "EXAM_QA_SCHEMA question");
assert.equal(validateNormalizedExamSchema({ questions: [], sections: [] }).valid, true, "EXAM_QA_SCHEMA exam");
assert.equal(adaptQuestionBankRecord({ id: "source-1", type: "SINGLE_CHOICE" }).type, "SINGLE_CHOICE", "EXAM_QA_SCHEMA adapter");

assert.equal(validateQuestion(mcq()).status, "READY", "EXAM_QA_SINGLE_CHOICE valid");
assert.equal(validateQuestion(mcq({ options: mcq().options?.slice(0, 3) })).status, "REVIEW_REQUIRED", "EXAM_QA_SINGLE_CHOICE missing option");
assert.equal(validateQuestion(mcq({ options: [{ key: "A", text: "1" }, { key: "A", text: "2" }, { key: "C", text: "3" }, { key: "D", text: "4" }] })).status, "BLOCKED", "EXAM_QA_SINGLE_CHOICE duplicate key");
assert.equal(validateQuestion(mcq({ expectedAnswer: "E" })).status, "BLOCKED", "EXAM_QA_SINGLE_CHOICE answer outside options");

const tf: NormalizedExamQuestion = { id: "q2", section: "PART_II", questionNumber: 1, type: "TRUE_FALSE", stem: "Xét các mệnh đề.", trueFalseStatements: [true, false, true, false].map((expected, index) => ({ key: String.fromCharCode(97 + index), text: `Mệnh đề ${index + 1}`, expected })) };
assert.equal(validateQuestion(tf, { expectedStatementCount: 4 }).status, "READY", "EXAM_QA_TRUE_FALSE valid");
assert.equal(validateQuestion({ ...tf, trueFalseStatements: tf.trueFalseStatements?.slice(0, 3) }, { expectedStatementCount: 4 }).status, "REVIEW_REQUIRED", "EXAM_QA_TRUE_FALSE wrong count");

for (const value of [3, 13.5, 0.25, -2]) { const result = normalizeMarkerAnswer("SHORT_ANSWER", value); assert.equal(result.ok, true, `EXAM_QA_SHORT_ANSWER ${value}`); }
assert.equal((normalizeMarkerAnswer("SHORT_ANSWER", "13.5") as { ok: true; answer: { canonical: string } }).answer.canonical, "13.5", "EXAM_QA_MARKER_NORMALIZATION canonical");
assert.equal(formatVietnameseDecimal("13.5"), "13,5", "EXAM_QA_MARKER_NORMALIZATION display 13.5");
assert.equal(formatVietnameseDecimal("0.25"), "0,25", "EXAM_QA_MARKER_NORMALIZATION display 0.25");
assert.equal(validateQuestion({ id: "q3", section: "PART_III", questionNumber: 1, type: "SHORT_ANSWER", stem: "Tính.", expectedAnswer: "1/2" }).status, "REVIEW_REQUIRED", "EXAM_QA_SHORT_ANSWER invalid");

assert.deepEqual(VIETNAMESE_HIGH_SCHOOL_12_4_6.map((section) => section.allowedQuestionTypes[0]), ["SINGLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"], "EXAM_QA_EXAM_STRUCTURE configuration");
const duplicateExam = validateExam({ questions: [mcq(), mcq({ id: "q-other" })], sections: [{ sectionId: "PART_I", allowedQuestionTypes: ["SINGLE_CHOICE"], markerMode: "SINGLE_CHOICE", expectedQuestionCount: 2, expectedOptionCount: 4 }] });
assert.equal(duplicateExam.status, "BLOCKED", "EXAM_QA_EXAM_STRUCTURE duplicate numbering");
assert.ok(duplicateExam.issues.some((item) => item.code === EXAM_QA_ISSUE_CODES.QUESTION_NUMBER_DUPLICATE));

const notTested = validateQuestion(mcq(), { unexecutedValidators: [QUESTION_VALIDATORS.STEM] });
assert.equal(notTested.status, "NOT_TESTED", "EXAM_QA_FAIL_CLOSED required validator");
assert.ok(notTested.issues.some((item) => item.code === EXAM_QA_ISSUE_CODES.REQUIRED_VALIDATOR_NOT_TESTED));
const essay = validateQuestion({ id: "essay", questionNumber: 1, type: "ESSAY", stem: "Chứng minh." });
assert.equal(essay.markerCompatibility.status, "UNSUPPORTED");
assert.equal(essay.status, "REVIEW_REQUIRED");

console.log("EXAM-QA-0 test groups passed: EXAM_QA_SCHEMA, EXAM_QA_SINGLE_CHOICE, EXAM_QA_TRUE_FALSE, EXAM_QA_SHORT_ANSWER, EXAM_QA_EXAM_STRUCTURE, EXAM_QA_FAIL_CLOSED, EXAM_QA_MARKER_NORMALIZATION");
