import assert from "node:assert/strict";
import { EXAM_QA_ISSUE_CODES, QUESTION_VALIDATORS, buildQuestionSymbolTable, validateMathematicalQuestionLogic, validateQuestion } from "../src/modules/exam-qa/index.js";
import type { NormalizedExamQuestion } from "../src/modules/exam-qa/index.js";

const question = (stem: string, overrides: Partial<NormalizedExamQuestion> = {}): NormalizedExamQuestion => ({ id: "logic", questionNumber: 1, type: "SHORT_ANSWER", stem, expectedAnswer: 3, ...overrides });
const logicCodes = (value: NormalizedExamQuestion) => validateMathematicalQuestionLogic(value).map((item) => item.code);

assert.deepEqual(logicCodes(question("Cho hình chóp S.ABCD có đáy ABCD là hình bình hành. Gọi M là trung điểm của AB.")), [], "CASE 1 valid geometry");
const undefinedTarget = validateMathematicalQuestionLogic(question("Cho tam giác ABC. Gọi M là trung điểm của AB. Tính MN."));
assert.ok(undefinedTarget.some((item) => item.code === EXAM_QA_ISSUE_CODES.LOGIC_TARGET_REFERENCE_UNRESOLVED && item.details?.symbol === "N"), "CASE 2 undefined target");
const dependency = validateMathematicalQuestionLogic(question("Cho tam giác ABC. Gọi M là trung điểm của PQ."));
assert.ok(dependency.some((item) => item.code === EXAM_QA_ISSUE_CODES.LOGIC_DECLARATION_DEPENDENCY_UNRESOLVED && (item.details?.unresolvedSymbols as string[]).includes("P")), "CASE 3 unresolved dependency");
assert.ok(logicCodes(question("Cho tứ giác ABCD. Gọi M là trung điểm của AB. Gọi M là trung điểm của CD.")).includes(EXAM_QA_ISSUE_CODES.LOGIC_CONFLICTING_DEFINITION), "CASE 4 conflicting definition");
assert.deepEqual(logicCodes(question("Cho hình bình hành ABCD. Gọi O là giao điểm của AC và BD.")), [], "CASE 5 valid intersection");
const missingPlane = validateMathematicalQuestionLogic(question("Cho hình chóp S.ABCD. Gọi M là giao điểm của AB với mặt phẳng (SPQ)."));
assert.ok(missingPlane.some((item) => item.code === EXAM_QA_ISSUE_CODES.LOGIC_DECLARATION_DEPENDENCY_UNRESOLVED && (item.details?.unresolvedSymbols as string[]).includes("P")), "CASE 6 missing plane symbol");

const tf = question("Cho tứ diện ABCD. Gọi G là trọng tâm của tam giác BCD.", { type: "TRUE_FALSE", expectedAnswer: undefined, trueFalseStatements: [{ key: "c", text: "Gọi N là giao điểm của AD với mặt phẳng (BGC). Khi đó AN/AD = 2/3.", expected: true }] });
assert.deepEqual(logicCodes(tf), [], "CASE 7 true/false local scope");

const optionQuestion = question("Cho hình chóp S.ABCD.", { type: "SINGLE_CHOICE", options: [{ key: "A", text: "MN // (PQR)" }, { key: "B", text: "AB // CD" }, { key: "C", text: "SA ⟂ AB" }, { key: "D", text: "AC = BD" }], expectedAnswer: "B" });
const optionIssues = validateMathematicalQuestionLogic(optionQuestion);
assert.ok(optionIssues.some((item) => item.location?.field === "option:A" && item.code === EXAM_QA_ISSUE_CODES.UNDEFINED_SYMBOL_REFERENCE), "CASE 8 option scope");

const primeTable = buildQuestionSymbolTable(question("Cho lăng trụ ABC.A'B'C'."));
for (const symbol of ["A", "B", "C", "A'", "B'", "C'"]) assert.equal(primeTable.has(symbol), true, `CASE 9 prime ${symbol}`);
assert.deepEqual(logicCodes(question("Cho hình chóp S.ABCD. Gọi E là trung điểm của SD. Gọi F là giao điểm của BE và mặt phẳng (SAC). Tính BE/EF.")), [], "CASE 10 valid short-answer target");
assert.ok(logicCodes(question("Cho đoạn thẳng AB. Gọi M là trung điểm của AM.")).includes(EXAM_QA_ISSUE_CODES.LOGIC_SELF_REFERENTIAL_DEFINITION), "CASE 11 self reference");

const immutable = question("Cho tam giác ABC. Tính MN."); const before = structuredClone(immutable); validateMathematicalQuestionLogic(immutable); assert.deepEqual(immutable, before, "CASE 12 immutability");
const coexist = validateQuestion(question("Cho  tam giác ABC. Tính MN."));
assert.ok(coexist.issues.some((item) => item.code === EXAM_QA_ISSUE_CODES.VI_DOUBLE_SPACE), "CASE 13 language issue preserved");
assert.ok(coexist.issues.some((item) => item.code === EXAM_QA_ISSUE_CODES.LOGIC_TARGET_REFERENCE_UNRESOLVED), "CASE 13 logic issue preserved");
assert.deepEqual(logicCodes(question("Cho hình chóp S.ABCD có đáy ABCD là hình bình hành. Gọi M là trung điểm của AB. Chứng minh đường thẳng SM song song với mặt phẳng (SCD).")), [], "CASE 14 no deep-solver false positive");
assert.equal(validateQuestion(question("Cho tam giác ABC."), { unexecutedValidators: [QUESTION_VALIDATORS.LOGIC] }).status, "NOT_TESTED", "logic validator fail-closed");
assert.ok(logicCodes(question("Cho hai điểm A, B với A ≠ B và A = B.")).includes(EXAM_QA_ISSUE_CODES.LOGIC_EXPLICIT_CONTRADICTION), "limited explicit contradiction");

console.log("EXAM-QA-2 mathematical question logic tests passed");
