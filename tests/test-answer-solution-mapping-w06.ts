import assert from "node:assert/strict";
import { ingestDocx } from "../src/modules/document-engine/docx/ingestion.ts";
import { segmentCanonicalQuestions } from "../src/modules/question-bank/canonical-segmentation.ts";
import { DOCX_FIXTURES } from "../src/modules/document-engine/fixtures.ts";

const document = ingestDocx({ name: "mapping.docx", bytes: DOCX_FIXTURES.multipleProblems }).document!;
const questions = segmentCanonicalQuestions(document);
assert.equal(questions.length, 2);
assert.ok(questions.every(question => question.id && question.provenance.sourceFile === "mapping.docx"));
assert.ok(questions.every(question => question.solution === undefined || Array.isArray(question.solution)));
assert.ok(questions.every(question => question.issues.every(issue => issue.status === "REVIEW")));
const noSolution = questions.find(question => !question.solution?.length);
assert.ok(noSolution, "solution-less questions remain explicitly solution-less");
console.log("w06-answer-solution-mapping: PASS");
