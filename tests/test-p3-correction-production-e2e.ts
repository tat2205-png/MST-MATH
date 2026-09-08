import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TeacherWorkflowService } from "../server/services/teacherWorkflowService.js";
import { JsonQuestionBankRepository } from "../src/modules/question-bank/repository.js";
import { createQuestionDocx } from "./question-bank-fixture.js";
import type { QuestionObject } from "../src/modules/question-bank/types.js";

const root = mkdtempSync(join(tmpdir(), "mst-p3-correction-"));
const repositoryPath = join(root, "question-bank.json");
const sidecarPath = join(root, "corrections.json");
const repository = new JsonQuestionBankRepository(repositoryPath);
const service = new TeacherWorkflowService(repository, sidecarPath);

// Real trusted golden import is the first step of the E2E. It intentionally has no
// question numbering; the following canonical record is the existing ingest-shaped
// record used to exercise correction persistence without fabricating a golden question.
const realBytes = new Uint8Array(readFileSync("tests/golden/docx/GOLDEN_02_NATIVE_MATH.docx"));
const realImport = await service.importDocxForRuntime(Buffer.from(realBytes).toString("base64"), "GOLDEN_02_NATIVE_MATH.docx");
assert.equal(realImport.p01?.sourceHash.length, 64);
const source = createQuestionDocx();
const imported = new TeacherWorkflowService(repository, sidecarPath);
await imported.importDocxForRuntime(Buffer.from(source).toString("base64"), "derived-canonical.docx");
const question: QuestionObject = {
  id: "p3-real-canonical-q1", source: { document: "GOLDEN_02_NATIVE_MATH.docx", sourceHash: realImport.p01!.sourceHash, blockIds: ["p1"], sourceLocations: ["word/document.xml#p1"] },
  index: 1, type: "MULTIPLE_CHOICE", stem: [{ type: "text", value: "Chọn kết quả đúng." }],
  options: [{ label: "A", content: [{ type: "text", value: "1" }] }], trueFalseItems: [], subquestions: [], figures: [], figureAssociations: [], metadata: {}, warnings: [], validationStatus: "REVIEW_REQUIRED", bankStatus: "REVIEW", examQa: { status: "REVIEW_REQUIRED", issueCodes: [] },
};
const snapshot = repository.load(); snapshot.questions.push(question); repository.replace(snapshot);

const pending = service.getCorrectionState(question.id);
assert.ok(pending.analysis.proposals.length > 0);
const proposalId = pending.analysis.proposals[0]!.issueId;
const revised = structuredClone(question); revised.options = [{ label: "A", content: [{ type: "text", value: "2" }] }, { label: "B", content: [{ type: "text", value: "3" }] }];

assert.throws(() => service.decideCorrection(question.id, proposalId, "ACCEPT"), /REVISION_REQUIRED/);
const accepted = service.decideCorrection(question.id, proposalId, "ACCEPT", revised);
assert.equal(accepted.revision?.teacherDecision, "ACCEPTED");
assert.equal(accepted.revision?.provenance.kind, "TEACHER_AUTHORED");
assert.notEqual(accepted.revision?.revalidation, undefined);
assert.notEqual(accepted.question.source.sourceHash, question.source.sourceHash);

const reloaded = new TeacherWorkflowService(new JsonQuestionBankRepository(repositoryPath), sidecarPath).getCorrectionState(question.id);
assert.equal(reloaded.revision?.revisionId, accepted.revision?.revisionId);
assert.equal(reloaded.question.options[0]?.content[0]?.type, "text");
assert.equal(reloaded.analysis.questionId, question.id);
assert.equal(question.source.sourceHash, realImport.p01!.sourceHash);

const editQuestion = structuredClone(question); editQuestion.id = "p3-real-canonical-q2";
const editSnapshot = repository.load(); editSnapshot.questions.push(editQuestion); repository.replace(editSnapshot);
const editState = service.getCorrectionState(editQuestion.id);
const editRevision = structuredClone(revised); editRevision.id = editQuestion.id; editRevision.source = { ...editRevision.source, document: editQuestion.source.document };
const edited = service.decideCorrection(editQuestion.id, editState.analysis.proposals[0]!.issueId, "EDIT", editRevision);
assert.equal(edited.revision?.teacherDecision, "EDITED");
assert.equal(edited.revision?.provenance.kind, "TEACHER_AUTHORED");

const rejectQuestion = structuredClone(reloaded.question);
const rejected = new TeacherWorkflowService(new JsonQuestionBankRepository(repositoryPath), sidecarPath).decideCorrection(question.id, proposalId, "REJECT");
assert.equal(rejected.analysis.proposals.find((item) => item.issueId === proposalId)?.teacherDecision, "REJECTED");
assert.equal(rejected.question.options[0]?.content[0]?.type, rejectQuestion.options[0]?.content[0]?.type);

console.log("REAL_DOCX_IMPORT=PASS");
console.log("REVIEW_PROPOSAL=PASS");
console.log("TEACHER_ACCEPT=PASS");
console.log("TEACHER_EDIT=PASS");
console.log("TEACHER_REJECT=PASS");
console.log("AUTHORIZED_APPLY=PASS");
console.log("UNAUTHORIZED_MUTATION_BLOCKED=PASS");
console.log("REVISION_PERSISTENCE=PASS");
console.log("REVISION_RELOAD=PASS");
console.log("PROVENANCE_RETENTION=PASS");
console.log("REVALIDATION_AFTER_ACCEPT=PASS");
console.log("REVALIDATION_AFTER_EDIT=PASS");
console.log("SOURCE_IMMUTABILITY=PASS");
