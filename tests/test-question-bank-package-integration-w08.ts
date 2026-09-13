import assert from "node:assert/strict";
import { ingestDocx } from "../src/modules/document-engine/docx/ingestion.ts";
import { segmentCanonicalQuestions } from "../src/modules/question-bank/canonical-segmentation.ts";
import { createQuestionPackage } from "../src/modules/question-bank/contracts.ts";
import { questionPackageToQuestionObject } from "../src/modules/question-bank/package-integration.ts";
import { DOCX_FIXTURES } from "../src/modules/document-engine/fixtures.ts";

const result = ingestDocx({ name: "bank.docx", bytes: DOCX_FIXTURES.multipleProblems });
const question = segmentCanonicalQuestions(result.document!)[0]!;
const pkg = createQuestionPackage(question, result.assetLedger.assets);
const bankQuestion = questionPackageToQuestionObject(pkg, result.document!.figures);
assert.equal(bankQuestion.id, pkg.id);
assert.deepEqual(bankQuestion.source.blockIds, pkg.sourceObjectIds);
assert.equal(bankQuestion.source.document, pkg.provenance.sourceFile);
assert.equal(bankQuestion.validationStatus, "VALID");
assert.equal(bankQuestion.bankStatus, "REVIEW");
console.log("w08-question-bank-package-integration: PASS");
