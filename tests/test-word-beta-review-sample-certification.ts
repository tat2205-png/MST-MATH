import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ROOT = "docs/evidence/word-beta-human-acceptance-round-2";
const selection = JSON.parse(readFileSync(`${ROOT}/final-review-selection.json`, "utf8"));
const certification = JSON.parse(readFileSync(`${ROOT}/risk-coverage-certification.json`, "utf8"));
const matrix = JSON.parse(readFileSync(`${ROOT}/acceptance-feature-matrix.json`, "utf8"));

assert.equal(matrix.featureMatrixQuestionCount, 668);
assert.equal(matrix.featureMatrixUniqueQuestionIdCount, 668);
assert.equal(matrix.featureMatrixUniqueCanonicalIdentityCount, 668);
assert.equal(matrix.summary.acceptanceIdentityQA, "PASS");
assert.equal(matrix.summary.canonicalIdentityAccountingQA, "PASS");
assert.equal(matrix.summary.questionTypeAccountingQA, "PASS");
assert.equal(matrix.summary.mathFormatDerivationQA, "PASS");
assert.equal(matrix.summary.v3QuestionJoinQA, "PASS");

assert.equal(selection.initialReviewCaseCount, 40);
assert.equal(selection.finalReviewCaseCount, 40);
assert.equal(new Set(selection.finalQuestionIds).size, 40);
assert.equal(selection.addedQuestionIds.length, selection.removedQuestionIds.length);
assert.equal(selection.replacedReviewCaseCount, selection.addedQuestionIds.length);
assert.ok(selection.initialJoinedReviewCaseCount <= 40);
assert.equal(selection.staleInitialQuestionIds.length, 40 - selection.initialJoinedReviewCaseCount);

const matrixIds = new Set(matrix.rows.map((row: any) => row.questionId));
assert.ok(selection.finalQuestionIds.every((id: string) => matrixIds.has(id)));
assert.ok(selection.activeRound1MandatoryQuestionIds.every((id: string) => selection.finalQuestionIds.includes(id)));
assert.ok(selection.retiredRound1MandatoryQuestionIds.every((id: string) => !matrixIds.has(id)));

assert.equal(certification.mandatoryCoverageGapCount, 0);
assert.equal(certification.round1MandatoryGapCount, 0);
assert.equal(certification.coverageDerivationQA, "PASS");
assert.equal(certification.riskCoverageQA, "PASS");
assert.equal(certification.boundaryRemediationSplitCoverageQA, "PASS");
for (const result of Object.values(certification.finalCoverage) as any[]) assert.equal(result.pass, true);

const promotedRows = matrix.rows.filter((row: any) => row.canonicalSelectionKind === "PROMOTED_SPLIT");
if (promotedRows.length > 0) {
  assert.ok(selection.finalQuestionIds.some((id: string) => promotedRows.some((row: any) => row.questionId === id)));
  assert.equal(certification.finalCoverage["TAG:BOUNDARY_REMEDIATION_SPLIT"].pass, true);
}

console.log("WORD_BETA_REVIEW_SAMPLE_CERTIFICATION_TESTS=PASS");
