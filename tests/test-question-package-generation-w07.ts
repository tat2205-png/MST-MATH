import assert from "node:assert/strict";
import { createQuestionPackage, serializeQuestionPackage } from "../src/modules/question-bank/contracts.ts";
import { ingestDocx } from "../src/modules/document-engine/docx/ingestion.ts";
import { segmentCanonicalQuestions } from "../src/modules/question-bank/canonical-segmentation.ts";
import { DOCX_FIXTURES } from "../src/modules/document-engine/fixtures.ts";

const result = ingestDocx({ name: "package.docx", bytes: DOCX_FIXTURES.multipleProblems });
const question = segmentCanonicalQuestions(result.document!)[0]!;
const pkg = createQuestionPackage(question, result.assetLedger.assets);
assert.equal(pkg.directoryName, `question-${question.id}`);
assert.equal(pkg.question.id, question.id);
assert.deepEqual(pkg.mathObjectIds, question.mathObjectIds);
assert.deepEqual(pkg.sourceObjectIds, question.sourceObjectIds);
assert.equal(pkg.provenance.sourceSha256, result.provenance.sourceSha256);
assert.match(pkg.questionTex!, /Giải/);
assert.equal(typeof serializeQuestionPackage(pkg), "string");
console.log("w07-question-package-generation: PASS");
