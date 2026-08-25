import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import express from "express";
import { QuestionBankImportService } from "../server/questionBank/importService.ts";
import { createQuestionBankRouter } from "../server/questionBank/routes.ts";

function storedZip(name: string, body: Uint8Array): Uint8Array { const filename = new TextEncoder().encode(name); const bytes = new Uint8Array(30 + filename.length + body.length); const view = new DataView(bytes.buffer); view.setUint32(0, 0x04034b50, true); view.setUint16(8, 0, true); view.setUint32(18, body.length, true); view.setUint32(22, body.length, true); view.setUint16(26, filename.length, true); bytes.set(filename, 30); bytes.set(body, 30 + filename.length); return bytes; }
const docxXml = new TextEncoder().encode("<w:document><w:body><w:p><w:r><w:t>Câu 1. Cho hình chóp S.ABCD</w:t></w:r></w:p><w:p><w:r><w:t>Chứng minh SA vuông góc đáy.</w:t></w:r></w:p></w:body></w:document>");
const docx = storedZip("word/document.xml", docxXml);
const digitalPdf = new TextEncoder().encode("%PDF-1.4\n1 0 obj <</Type /Page>> stream BT (Câu 2. Trong khong gian Oxyz) Tj ET endstream endobj");
const scannedPdf = new TextEncoder().encode("%PDF-1.4\n1 0 obj <</Type /Page /XObject 2 0 R>> endobj");
const root = mkdtempSync(path.join(tmpdir(), "qb-0k-")); const service = new QuestionBankImportService({ dataRoot: root });
const app = express(); app.use(express.json({ limit: "50mb" })); app.use("/api/question-bank", createQuestionBankRouter(service)); const server = app.listen(0, "127.0.0.1");
try {
  await new Promise<void>((resolve) => server.once("listening", resolve)); const address = server.address(); assert.ok(address && typeof address !== "string"); const base = `http://127.0.0.1:${address.port}/api/question-bank`;
  const upload = async (originalFileName: string, mimeType: string, bytes: Uint8Array) => { const response = await fetch(`${base}/import`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ originalFileName, mimeType, dataBase64: Buffer.from(bytes).toString("base64") }) }); return { response, body: await response.json() as Record<string, unknown> }; };
  const docxResult = await upload("đề-hình-học.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", docx); assert.equal(docxResult.response.status, 200); assert.equal(docxResult.body.sourceKind, "DOCX"); assert.equal(docxResult.body.questionsSaved, 1); assert.equal((docxResult.body.source as { originalFileName: string }).originalFileName, "đề-hình-học.docx");
  const questionsResponse = await fetch(`${base}/questions`); const listed = await questionsResponse.json() as { questions: Array<{ status: string; source: { originalFileName: string; sourceHash: string } }> }; assert.equal(listed.questions.length, 1); assert.equal(listed.questions[0].status, "REVIEW"); assert.notEqual(listed.questions[0].status, "APPROVED"); assert.equal(listed.questions[0].source.originalFileName, "đề-hình-học.docx"); assert.ok(existsSync(path.join(root, "question-bank.db"))); assert.ok(existsSync(path.join(root, "source", "word")));
  const duplicate = await upload("đề-hình-học.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", docx); assert.equal(duplicate.body.duplicate, true); assert.equal(duplicate.body.questionsSaved, 0);
  const pdfResult = await upload("digital.pdf", "application/pdf", digitalPdf); assert.equal(pdfResult.body.sourceKind, "DIGITAL_TEXT"); assert.equal(pdfResult.body.questionsSaved, 1); assert.ok(existsSync(path.join(root, "source", "pdf")));
  const scanResult = await upload("scan.pdf", "application/pdf", scannedPdf); assert.equal(scanResult.body.sourceKind, "SCANNED"); assert.equal(scanResult.body.quarantined, 1); assert.ok((scanResult.body.warnings as string[]).includes("OCR_REQUIRED"));
  const unsupported = await upload("malware.exe", "application/octet-stream", new Uint8Array([0x4d, 0x5a])); assert.equal(unsupported.response.status, 415); assert.equal(unsupported.body.code, "UNSUPPORTED_FILE_TYPE");
  const traversal = await upload("..\\escape.pdf", "application/pdf", digitalPdf); assert.equal(traversal.response.status, 400); assert.equal(traversal.body.code, "UNSAFE_FILENAME");
  const mismatch = await upload("fake.pdf", "application/pdf", docx); assert.equal(mismatch.response.status, 415); assert.equal(mismatch.body.code, "SIGNATURE_MISMATCH");
  const ui = readFileSync("src/modules/question-bank/QuestionBankDevApp.tsx", "utf8"); assert.match(ui, /type="file"/); assert.match(ui, /accept="\.docx,\.pdf"/); assert.match(ui, /fileInput\.current\?\.click\(\)/); assert.match(ui, /SELECTING_FILE/); assert.match(ui, /IMPORTING/); assert.match(ui, /SUCCESS/); assert.match(ui, /WARNING/); assert.match(ui, /ERROR/); assert.match(ui, /await refreshQuestions\(\)/); assert.match(ui, /fileInput\.current\.value = ""/);
  console.log("FILE_PICKER_QA=PASS\nACCEPT_FILTER_QA=PASS\nUNSUPPORTED_FILE_QA=PASS\nUPLOAD_ROUTE_QA=PASS\nDOCX_UPLOAD_QA=PASS\nDOCX_IMPORT_QA=PASS\nPDF_UPLOAD_QA=PASS\nPDF_IMPORT_QA=PASS\nSCANNED_PDF_ROUTING_QA=PASS\nSOURCE_FILENAME_QA=PASS\nSOURCE_STORAGE_QA=PASS\nSOURCE_TRACEABILITY_QA=PASS\nREPOSITORY_PERSISTENCE_QA=PASS\nAUTO_APPROVAL_GUARD_QA=PASS\nPATH_TRAVERSAL_QA=PASS\nUPLOAD_SECURITY_QA=PASS\nDUPLICATE_SOURCE_QA=PASS\nUI_STATE_QA=PASS\nREVIEW_QUEUE_REFRESH_QA=PASS\nQB_0K_TESTS=PASS");
} finally { await new Promise<void>((resolve) => server.close(() => resolve())); service.close(); rmSync(root, { recursive: true, force: true }); }
