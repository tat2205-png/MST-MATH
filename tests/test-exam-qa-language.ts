import assert from "node:assert/strict";
import { EXAM_QA_ISSUE_CODES, QUESTION_VALIDATORS, validateQuestion, validateVietnameseQuestionLanguage, validateVietnameseTypography } from "../src/modules/exam-qa/index.js";
import type { NormalizedExamQuestion } from "../src/modules/exam-qa/index.js";

const context = { questionId: "language", field: "stem" };
const codes = (text: string) => validateVietnameseTypography(text, context).map((issue) => issue.code);
const issueFor = (text: string, code: string) => validateVietnameseTypography(text, context).find((issue) => issue.code === code);

const boundary = issueFor("mặt đất, Biết tỉ số...", EXAM_QA_ISSUE_CODES.VI_SUSPICIOUS_COMMA_CAPITALIZATION);
assert.ok(boundary, "CASE 1 sentence boundary");
assert.equal(boundary.suggestion, "mặt đất. Biết tỉ số...");

const connector = issueFor("G là trung điểm SO.", EXAM_QA_ISSUE_CODES.VI_MATH_CONNECTOR_MISSING);
assert.equal(connector?.suggestion, "G là trung điểm của SO.", "CASE 2 connector");

const unit = issueFor("AB=9(cm)", EXAM_QA_ISSUE_CODES.VI_MATH_UNIT_FORMAT_WARNING);
assert.equal(unit?.suggestion, "AB = 9 cm", "CASE 3 unit typography");
assert.ok(codes("Cho  hình chóp S.ABCD").includes(EXAM_QA_ISSUE_CODES.VI_DOUBLE_SPACE), "CASE 4 double space");
assert.ok(codes("ABCD , có đáy...").includes(EXAM_QA_ISSUE_CODES.VI_SPACE_BEFORE_PUNCTUATION), "CASE 5 space before punctuation");
assert.ok(codes("ABCD.Gọi M...").includes(EXAM_QA_ISSUE_CODES.VI_MISSING_SPACE_AFTER_PUNCTUATION), "CASE 6 missing space");

for (const decimal of ["13,5", "0,25", "1,0582", "13.5"]) assert.equal(codes(decimal).some((code) => code === EXAM_QA_ISSUE_CODES.VI_MISSING_SPACE_AFTER_PUNCTUATION), false, `CASE 7 decimal ${decimal}`);
assert.deepEqual(codes("Cho hình chóp S.ABCD có đáy ABCD là hình bình hành."), [], "CASE 8 valid math prose");
assert.ok(codes("Cho hình chóp (S.ABCD").includes(EXAM_QA_ISSUE_CODES.VI_UNBALANCED_PARENTHESES), "CASE 9 delimiter");
assert.ok(codes("Cho hi\u0300nh cho\u0301p.").includes(EXAM_QA_ISSUE_CODES.VI_UNICODE_NORMALIZATION_WARNING), "CASE 10 Unicode NFC");
assert.deepEqual(codes("Trong Oxyz, xét Ox, Oy, Oz, (SAB) và (SCD)."), [], "CASE 11 math identifiers");

const source = "Cho  hình chóp S.ABCD";
const question: NormalizedExamQuestion = { id: "immutable", questionNumber: 1, type: "SHORT_ANSWER", stem: source, expectedAnswer: 3 };
const before = structuredClone(question);
const languageIssues = validateVietnameseQuestionLanguage(question);
assert.ok(languageIssues.some((issue) => issue.location?.field === "stem"));
assert.deepEqual(question, before, "CASE 12 source immutability");
assert.equal(validateQuestion(question).status, "REVIEW_REQUIRED", "language warning integrates with status");
assert.equal(validateQuestion(question, { unexecutedValidators: [QUESTION_VALIDATORS.LANGUAGE] }).status, "NOT_TESTED", "required language validator fails closed");

const scoped: NormalizedExamQuestion = { id: "scoped", questionNumber: 1, type: "SINGLE_CHOICE", stem: "Chọn đáp án.", options: [{ key: "A", text: "Đúng  rồi" }, { key: "B", text: "Sai" }, { key: "C", text: "Không" }, { key: "D", text: "Khác" }], expectedAnswer: "A" };
assert.equal(validateVietnameseQuestionLanguage(scoped).find((issue) => issue.code === EXAM_QA_ISSUE_CODES.VI_DOUBLE_SPACE)?.location?.field, "option:A", "field-level option location");

console.log("EXAM-QA-1 Vietnamese language and typography tests passed");
