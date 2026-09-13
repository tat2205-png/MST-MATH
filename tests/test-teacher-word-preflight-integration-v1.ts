import assert from "node:assert/strict";
import { MemoryQuestionBankRepository } from "../src/modules/question-bank/repository.js";
import { TeacherWorkflowService } from "../server/services/teacherWorkflowService.js";
import { createQuestionDocx } from "./question-bank-fixture.js";

const repository = new MemoryQuestionBankRepository();
const service = new TeacherWorkflowService(repository);
const source = createQuestionDocx();
const result = service.importDocx(Buffer.from(source).toString("base64"), "teacher-word-preflight.docx");

const preflight = result.diagnostics.find((item) => item.code === "WORD_PREFLIGHT_PASS");
const safeClean = result.diagnostics.find((item) => item.code === "WORD_SAFE_CLEAN_AVAILABLE");
assert.ok(preflight);
assert.equal(preflight.severity === "INFO" || preflight.severity === "WARNING", true);
assert.ok(preflight.details?.sourceSha256);
assert.equal(preflight.details?.safeCleanAvailable, true);
assert.ok(safeClean);
assert.equal(safeClean.details?.endpoint, "/api/word-preflight/safe-clean");
assert.equal(safeClean.details?.sourceOverwrite, false);
assert.ok(result.imported.length > 0);
assert.ok(result.imported.every((question) => question.source.document === "teacher-word-preflight.docx"));

console.log("TEACHER_WORD_PREFLIGHT_GATE_QA=PASS");
console.log("TEACHER_WORD_SOURCE_IDENTITY_QA=PASS");
console.log("TEACHER_WORD_SAFE_CLEAN_DISCOVERY_QA=PASS");
