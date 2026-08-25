import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AssetRegistry } from "../src/modules/question-bank/assets.ts";
import { detectDuplicate } from "../src/modules/question-bank/duplicate.ts";
import { isValidQuestionId, parseQuestionId } from "../src/modules/question-bank/id.ts";
import { contentToSearchText, normalizeLatex, normalizeVietnameseText } from "../src/modules/question-bank/normalization.ts";
import { validateQuestion } from "../src/modules/question-bank/schema.ts";
import { matchesQuestionFilters } from "../src/modules/question-bank/search.ts";
import { SqliteQuestionBankRepository } from "../src/modules/question-bank/sqliteRepository.ts";
import type { QuestionRecord } from "../src/modules/question-bank/types.ts";
import { transitionQuestion } from "../src/modules/question-bank/workflow.ts";
import { importPdf } from "../src/modules/question-bank/importers/pdf.ts";
import { importDocx } from "../src/modules/question-bank/importers/docx.ts";

const vi = ["Cho hình chóp", "Trong không gian Oxyz", "phương trình mặt phẳng", "vectơ pháp tuyến"];
const latex = [String.raw`SA\perp(ABCD)`, String.raw`\displaystyle\int_0^1 x^2,dx`, String.raw`\lim_{x\to+\infty}f(x)`, String.raw`\frac{a+b}{c}`];
const now = "2026-08-26T00:00:00.000Z";
const question: QuestionRecord = { id: "NA-M12-OXYZ-PLANE-MCQ-L2-000001", grade: 12, subject: "MATH", curriculum: "GDPT_2018", chapter: "Hình học", lesson: "Oxyz", topic: "Mặt phẳng", knowledgeUnit: "Vectơ pháp tuyến", questionType: "MCQ", cognitiveLevel: "COMPREHENSION", difficulty: 2, content: [...vi.map((value) => ({ type: "text" as const, value })), ...latex.map((value) => ({ type: "math" as const, latex: value }))], options: (["A", "B", "C", "D"] as const).map((id) => ({ id, content: [{ type: "text", value: `Đáp án ${id}` }] })), answer: { type: "MCQ", optionId: "A" }, solution: [{ type: "text", value: "Lời giải" }], assets: [], tags: ["Oxyz"], searchText: "trong không gian oxyz phương trình mặt phẳng vectơ pháp tuyến", source: { fileId: "f1", originalFileName: "đề toán.docx", fileType: "DOCX", sourceHash: "abc123", page: 2, questionNumber: "1", importedAt: now }, status: "DRAFT", createdAt: now, updatedAt: now };

assert.ok(isValidQuestionId(question.id)); assert.equal(parseQuestionId(question.id)?.sequence, 1); assert.ok(!isValidQuestionId("NA-bad"));
assert.deepEqual(validateQuestion(question).map((x) => x.level), ["PASS"]);
for (const text of vi) assert.equal(normalizeVietnameseText(text), text);
for (const math of latex) assert.equal(normalizeLatex(math), math);
assert.ok(contentToSearchText(question.content).includes("phương trình mặt phẳng"));
assert.throws(() => normalizeLatex(String.raw`\documentclass{article}`));

for (const kind of ["TRUE_FALSE", "SHORT_ANSWER", "ESSAY"] as const) {
  const q = structuredClone(question); q.id = kind === "TRUE_FALSE" ? "NA-M12-OXYZ-SPHERE-TF-L2-000018" : kind === "SHORT_ANSWER" ? "NA-M12-OXYZ-PLANE-SA-L2-000002" : "NA-M12-OXYZ-PLANE-ESSAY-L2-000003"; q.questionType = kind; delete q.options;
  q.answer = kind === "TRUE_FALSE" ? { type: "TRUE_FALSE", statements: [{ id: "a", content: [{ type: "text", value: "Mệnh đề" }], answer: true }] } : kind === "SHORT_ANSWER" ? { type: "SHORT_ANSWER", content: [{ type: "math", latex: "2" }] } : { type: "ESSAY" };
  assert.ok(!validateQuestion(q).some((x) => x.level === "FAIL"), kind);
}
assert.throws(() => transitionQuestion(question, "APPROVED", true)); const review = transitionQuestion(question, "REVIEW"); assert.throws(() => transitionQuestion(review, "APPROVED")); assert.equal(transitionQuestion(review, "APPROVED", true).status, "APPROVED");

const dir = mkdtempSync(join(tmpdir(), "qb-v1-")); try { const repo = new SqliteQuestionBankRepository(join(dir, "test.db")); assert.equal(repo.schemaVersion(), 1); repo.saveQuestion(question); assert.equal(repo.getQuestion(question.id)?.source.page, 2); assert.equal(repo.searchQuestions({ grade: 12, tags: ["Oxyz"] }).length, 1); repo.updateQuestion({ ...question, difficulty: 3 }); assert.equal(repo.getQuestion(question.id)?.difficulty, 3); assert.ok(repo.deleteQuestion(question.id)); repo.close(); } finally { rmSync(dir, { recursive: true, force: true }); }

const registry = new AssetRegistry(); registry.register({ assetId: "img-1", type: "IMAGE", sourcePath: "assets/image/a.png", mimeType: "image/png", hash: "hash", createdAt: now }); assert.deepEqual(registry.validateReferences({ ...question, assets: ["img-1"] }), []); assert.deepEqual(registry.validateReferences({ ...question, assets: ["missing"] }), ["missing"]);
assert.equal(detectDuplicate(question, [structuredClone(question)]).kind, "EXACT_DUPLICATE"); assert.equal(detectDuplicate({ ...question, id: "NA-M12-OXYZ-PLANE-MCQ-L2-000099", source: { ...question.source, sourceHash: "other" }, content: [{ type: "text", value: "other" }] }, [question]).kind, "LIKELY_DUPLICATE"); assert.ok(matchesQuestionFilters(question, { grade: 12, status: "DRAFT", topic: "Mặt phẳng" }));

const scanned = new TextEncoder().encode("%PDF-1.4\n1 0 obj <</Type /Page /Resources << /XObject << /Im1 2 0 R >> >> >> endobj"); const pdf = importPdf(scanned, "scan.pdf"); assert.equal(pdf.classification, "SCANNED"); assert.equal(pdf.routing, "OCR_REQUIRED"); assert.equal(pdf.candidates[0].status, "QUARANTINED");
const digital = new TextEncoder().encode("%PDF-1.4\n1 0 obj <</Type /Page>> stream BT (Câu 1. Trong không gian Oxyz) Tj ET endstream endobj"); const parsedPdf = importPdf(digital, "digital.pdf"); assert.equal(parsedPdf.classification, "DIGITAL_TEXT"); assert.equal(parsedPdf.candidates[0].source.page, 1);

function storedZip(name: string, body: Uint8Array): Uint8Array {
  const filename = new TextEncoder().encode(name); const bytes = new Uint8Array(30 + filename.length + body.length); const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x04034b50, true); view.setUint16(8, 0, true); view.setUint32(18, body.length, true); view.setUint32(22, body.length, true); view.setUint16(26, filename.length, true); bytes.set(filename, 30); bytes.set(body, 30 + filename.length); return bytes;
}
const docxXml = new TextEncoder().encode("<w:document><w:body><w:p><w:r><w:t>Câu 1. Cho hình chóp</w:t></w:r></w:p><w:p><w:r><w:t>vectơ pháp tuyến</w:t></w:r></w:p></w:body></w:document>");
const docx = importDocx(storedZip("word/document.xml", docxXml), "đề toán.docx"); assert.equal(docx.length, 1); assert.equal(docx[0].source.originalFileName, "đề toán.docx"); assert.equal(docx[0].source.questionNumber, "1"); assert.ok(docx[0].content[0].type === "text" && docx[0].content[0].value.includes("Cho hình chóp"));

const mainSource = readFileSync("src/main.tsx", "utf8"); const uiSource = readFileSync("src/modules/question-bank/QuestionBankDevApp.tsx", "utf8"); assert.match(mainSource, /VITE_QUESTION_BANK_DEV === 'true'/); assert.match(mainSource, /\/dev\/question-bank/); for (const feature of ["Import DOCX/PDF", "Review", "Search questions", "Chi tiết & trình biên tập", "Đáp án", "Lời giải", "QA state", "Assets"]) assert.ok(uiSource.includes(feature), feature);

console.log("CANONICAL_SCHEMA=PASS\nQUESTION_ID_QA=PASS\nUTF8_VIETNAMESE_QA=PASS\nLATEX_PRESERVATION_QA=PASS\nLOCAL_STORAGE=PASS\nSOURCE_TRACEABILITY=PASS\nASSET_REGISTRY=PASS\nMCQ_VALIDATOR=PASS\nTRUE_FALSE_VALIDATOR=PASS\nSHORT_ANSWER_VALIDATOR=PASS\nESSAY_VALIDATOR=PASS\nDOCX_IMPORT_SMOKE=PASS\nDOCX_UTF8_QA=PASS\nPDF_TEXT_IMPORT_SMOKE=PASS\nSCANNED_PDF_ROUTING=PASS\nDUPLICATE_DETECTOR=PASS\nQUESTION_SEARCH=PASS\nDEV_UI=PASS\nFEATURE_FLAG_QA=PASS\nQUESTION_BANK_TESTS=PASS");
