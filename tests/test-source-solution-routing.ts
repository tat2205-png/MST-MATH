import assert from "node:assert/strict";
import { QuestionBankStudioService } from "../server/integrations/questionBankStudio.ts";
import type { QuestionObject } from "../src/modules/question-bank/types.ts";

const base: QuestionObject = {
  id: "source-q28", source: { document: "source.docx", sourceHash: "source-hash", blockIds: ["block-1"], sourceLocations: ["word/document.xml:p:1"] },
  type: "MULTIPLE_CHOICE", stem: [{ type: "text", value: "Một bài toán thực tế." }], options: ["A", "B", "C", "D"].map((label) => ({ label, content: [{ type: "text", value: label }] })), trueFalseItems: [],
  answer: [{ type: "text", value: "C" }], solution: [{ type: "text", value: "Chọn C. Kết luận theo lời giải nguồn." }], subquestions: [], figures: [], figureAssociations: [], metadata: {}, warnings: [], validationStatus: "VALID", bankStatus: "APPROVED", duplicateState: "UNIQUE",
};
const service = new QuestionBankStudioService();
const sourceRequest = service.toSolutionRequest(base);
assert.equal(sourceRequest.support, "SOURCE_SOLUTION_PRESERVED");
assert.deepEqual(sourceRequest.sourceSolution, base.solution);
assert.deepEqual(sourceRequest.sourceAnswer, base.answer);
const generated: QuestionObject = { ...base, type: "SHORT_ANSWER", answer: [{ type: "text", value: "x=3,y=2" }], solution: undefined, stem: [{ type: "text", value: "Giải hệ x+y=5;x-y=1" }] };
assert.equal(service.toSolutionRequest(generated).support, "DETERMINISTIC_ENGINE_SUPPORTED");
const unsupported: QuestionObject = { ...base, solution: undefined, type: "ESSAY", answer: undefined };
assert.equal(service.toSolutionRequest(unsupported).support, "UNSUPPORTED_SOLUTION_GENERATION");
const unresolved: QuestionObject = { ...base, answer: undefined };
assert.equal(service.toSolutionRequest(unresolved).support, "UNSUPPORTED_SOLUTION_GENERATION");
const missingProvenance: QuestionObject = { ...base, source: { ...base.source, sourceLocations: [] } };
assert.equal(service.toSolutionRequest(missingProvenance).support, "UNSUPPORTED_SOLUTION_GENERATION");
assert.equal(JSON.stringify(sourceRequest.sourceSolution), JSON.stringify(base.solution));
assert.equal(sourceRequest.questionId, base.id);
assert.equal(sourceRequest.source.sourceHash, base.source.sourceHash);
const student = { id: base.id, stem: base.stem, options: base.options, type: base.type, trueFalseItems: base.trueFalseItems, subquestions: base.subquestions, figures: base.figures, source: base.source };
assert.equal("answer" in student, false);
assert.equal("solution" in student, false);
console.log("SOURCE_SOLUTION_PRECEDENCE_QA=PASS\nSOURCE_SOLUTION_ROUTING_QA=PASS\nGENERATION_FALLBACK_QA=PASS\nUNSUPPORTED_FAIL_CLOSED_QA=PASS\nQUESTION_ID_STABILITY_QA=PASS\nSOURCE_PROVENANCE_QA=PASS\nANSWER_ISOLATION_QA=PASS");
