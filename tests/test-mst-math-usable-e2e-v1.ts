import fs from "node:fs";
import assert from "node:assert/strict";
import { MemoryQuestionBankRepository } from "../src/modules/question-bank/repository.js";
import { TeacherWorkflowService } from "../server/services/teacherWorkflowService.js";
import { createQuestionDocx } from "./question-bank-fixture.js";
import { deriveTeacherWorkflowState } from "../src/services/teacherWorkflowTypes.js";

process.env.STUDIO_ORCHESTRATOR_V1 = "true";
const repository = new MemoryQuestionBankRepository();
const service = new TeacherWorkflowService(repository);
const golden = fs.readFileSync("tests/golden/docx/GOLDEN_05_COMBINED_MATH_DOCUMENT.docx");
const source = service.importDocx(golden.toString("base64"), "GOLDEN_05_COMBINED_MATH_DOCUMENT.docx");
assert.equal(source.summary.supportedImports[0], "DOCX");
assert.equal(deriveTeacherWorkflowState({ sourceReady: true, processing: false, designReady: false, exportReady: false }), "PROCESS_READY");

// Existing fixture supplies question records; all orchestration remains behind the public service boundary.
const imported = service.importDocx(Buffer.from(createQuestionDocx()).toString("base64"), "b3-e2e.docx");
const ids = imported.imported.filter((q) => q.bankStatus === "REVIEW" && q.validationStatus !== "INVALID" && q.examQa?.status !== "BLOCKED" && q.examQa?.status !== "NOT_TESTED").map((q) => q.id);
assert.ok(ids.length > 0);
service.approve(ids);
const assessment = service.generateAssessment({ title: "B3 E2E", seed: "b3", globalFilters: { ids }, sections: [{ id: "main", title: "Phần 1", questionType: imported.imported[0].type, count: 1, ordering: "FIXED", pointsPerQuestion: 1 }] });
assert.ok("assessment" in assessment);
if (!("assessment" in assessment)) throw new Error("DESIGN_GATE=FAIL");
assert.equal(deriveTeacherWorkflowState({ sourceReady: true, processing: false, designReady: true, qa: "PASS", exportReady: true }), "EXPORT_READY");
const exported = service.exportAssessment({ assessmentId: assessment.assessment.id, audience: "STUDENT", formats: ["JSON"], filename: "b3-e2e" });
assert.equal(exported.artifacts.length, 1);
assert.ok(fs.existsSync(exported.artifacts[0].path));
console.log("MST_MATH_USABLE_DOCX_E2E_QA=PASS");
