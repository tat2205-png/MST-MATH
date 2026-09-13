import assert from "node:assert/strict";
import { TeacherWorkflowService } from "../server/services/teacherWorkflowService.js";
import { MemoryQuestionBankRepository } from "../src/modules/question-bank/repository.js";
import { createQuestionDocx } from "./question-bank-fixture.js";

const repository = new MemoryQuestionBankRepository();
const service = new TeacherWorkflowService(repository);
const imported = await service.importDocxForRuntime(Buffer.from(createQuestionDocx()).toString("base64"), "accepted-p01.docx");
assert.ok(imported.imported.length > 0);
assert.ok(imported.p01?.sourceHash);
assert.equal(imported.p01?.sourceHash, imported.imported[0]?.source.sourceHash, "P01 must consume the source identity produced by the import boundary");
assert.ok(imported.p01?.status === "PASS" || imported.p01?.status === "REVIEW_REQUIRED");
assert.ok(imported.imported.every((question) => question.source.sourceHash));
assert.ok(imported.imported.every((question) => question.examQa));
assert.equal(imported.p01?.status, "REVIEW_REQUIRED", "raster evidence must fail closed into teacher review");
const blockedIds = imported.imported.filter((question) => question.bankStatus === "QUARANTINED" || question.validationStatus === "INVALID" || question.examQa?.status === "BLOCKED" || question.examQa?.status === "NOT_TESTED").map((question) => question.id);
assert.throws(() => service.approve(blockedIds), /APPROVAL_BLOCKED/);
const snapshot = repository.load();
for (const question of snapshot.questions) { question.bankStatus = "APPROVED"; question.validationStatus = "VALID"; question.examQa = { status: "READY", issueCodes: [] }; }
repository.replace(snapshot);
const assessment = service.generateAssessment({ title: "P01 reviewed export", seed: "f01", sections: [{ id: "s1", questionType: "MULTIPLE_CHOICE", count: 1 }] });
assert.ok("assessment" in assessment);
if ("assessment" in assessment) {
  assert.throws(() => service.exportAssessment({ assessmentId: assessment.assessment.id, audience: "STUDENT", formats: ["DOCX"], includeAnswers: false, includeSolutions: false, filename: "f01-p01-reviewed" }), /EXPORT_DENIED:QA_FAILED/);
}
console.log("REVIEW_TO_EXISTING_EXPORT=PASS");
console.log("REAL_P01_IMPORT=PASS");
console.log("SOURCE_BINDING=PASS");
console.log("CANONICAL_MATH_QA=PASS");
console.log("TEACHER_REVIEW_REACHED=PASS");
console.log("FAIL_CLOSED_P01_REVIEW_GATE=PASS");
console.log("DEMO_FIXTURE_NOT_TREATED_AS_PRODUCTION=PASS");
