import assert from "node:assert/strict";
import { analyzeExamQuestion, applyCorrectionRevision, acceptCorrectionProposal, rejectCorrectionProposal } from "../server/services/examAnalysisService.js";
import type { QuestionObject } from "../src/modules/question-bank/types.js";

const question: QuestionObject = { id: "q-analysis-1", source: { document: "accepted.docx", sourceHash: "source-hash", blockIds: ["p1"], sourceLocations: ["word/document.xml#p1"] }, index: 1, type: "MULTIPLE_CHOICE", stem: [{ type: "text", value: "Chọn kết quả đúng." }], options: [{ label: "A", content: [{ type: "text", value: "1" }] }], trueFalseItems: [], subquestions: [], figures: [], figureAssociations: [], metadata: {}, warnings: [], validationStatus: "REVIEW_REQUIRED", bankStatus: "REVIEW", examQa: { status: "REVIEW_REQUIRED", issueCodes: [] } };
const original = JSON.stringify(question);
const analysis = analyzeExamQuestion(question);
assert.equal(analysis.sourceHash, "source-hash");
assert.notEqual(analysis.publicationStatus, "READY");
assert.ok(analysis.proposals.length > 0);
assert.equal(JSON.stringify(question), original);
const accepted = acceptCorrectionProposal(analysis, analysis.proposals[0]!.issueId, "teacher-explicit-revision");
assert.equal(accepted.proposals[0]!.teacherDecision, "ACCEPTED");
assert.equal(accepted.proposals[0]!.verificationStatus, "NOT_VERIFIED");
const rejected = rejectCorrectionProposal(analysis, analysis.proposals[0]!.issueId);
assert.equal(rejected.proposals[0]!.teacherDecision, "REJECTED");
const revisedQuestion = structuredClone(question);
revisedQuestion.source = { ...revisedQuestion.source, sourceHash: "teacher-revision-hash" };
revisedQuestion.options = [
  { label: "A", content: [{ type: "text", value: "1" }] },
  { label: "B", content: [{ type: "text", value: "2" }] },
];
const applied = applyCorrectionRevision(accepted, question, accepted.proposals[0]!.issueId, revisedQuestion);
assert.equal(applied.question.source.sourceHash, "teacher-revision-hash");
assert.equal(applied.revision.sourceHashBefore, "source-hash");
assert.equal(applied.revision.sourceHashAfter, "teacher-revision-hash");
assert.equal(applied.revision.provenance.kind, "TEACHER_AUTHORED");
assert.equal(applied.revision.revalidation, "BLOCKED");
assert.equal(applied.analysis.publicationStatus, "BLOCKED");
assert.throws(() => applyCorrectionRevision(analysis, question, analysis.proposals[0]!.issueId, revisedQuestion), /TEACHER_DECISION_REQUIRED/);
console.log("EXAM_ANALYSIS_STRUCTURAL_QA=PASS");
console.log("EXAM_CORRECTION_PROPOSAL_CONTRACT_QA=PASS");
console.log("EXAM_TEACHER_DECISION_QA=PASS");
console.log("EXAM_RAW_IMMUTABILITY_QA=PASS");
console.log("EXAM_REVISION_REQUIRES_REVALIDATION_QA=PASS");
console.log("EXAM_TEACHER_APPLY_REVISION_QA=PASS");
console.log("EXAM_REVALIDATION_AND_PROVENANCE_QA=PASS");
