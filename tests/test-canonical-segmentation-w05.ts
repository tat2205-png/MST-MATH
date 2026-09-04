import assert from "node:assert/strict";
import { ingestDocx } from "../src/modules/document-engine/docx/ingestion.ts";
import { segmentCanonicalQuestions } from "../src/modules/question-bank/canonical-segmentation.ts";
import { DOCX_FIXTURES } from "../src/modules/document-engine/fixtures.ts";

const document = ingestDocx({ name: "questions.docx", bytes: DOCX_FIXTURES.multipleProblems }).document!;
const questions = segmentCanonicalQuestions(document);
assert.equal(questions.length, 2);
assert.deepEqual(questions.map(question => question.questionNumber), [1, 2]);
assert.ok(questions.every(question => question.sourceDocumentId === document.sourceDocumentId));
assert.ok(questions.every(question => question.sourceObjectIds.length > 0));
assert.ok(questions.every(question => question.provenance.sourceSha256 === document.sourceHash));
console.log("w05-canonical-question-segmentation: PASS");
