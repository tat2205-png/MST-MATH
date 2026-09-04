#!/usr/bin/env bash
set -euo pipefail

ROOT="docs/evidence/word-beta-human-acceptance-round-2"

echo "================================================"
echo " PIMATH R2-36 — ONE-COMMAND ENGINEERING CLOSEOUT"
echo "================================================"

echo ""
echo "===== 1. TYPESCRIPT ====="
npm run lint

echo ""
echo "===== 2. FOCUSED CONTINUATION + FOOTER REGRESSION ====="
node --import tsx tests/test-numbered-question-continuation.ts
node --import tsx tests/test-reference-answer-subsections.ts

echo ""
echo "===== 3. REAL R2-36 SOURCE AUDIT ====="
node --import tsx scripts/audit-word-beta-numbered-continuation.ts

echo ""
echo "===== 4. FOCUSED MACHINE GATE ====="
node <<'NODE'
const fs = require("fs");
const p = "docs/evidence/word-beta-human-acceptance-round-2/R2-36-numbered-continuation-audit.json";
const a = JSON.parse(fs.readFileSync(p, "utf8"));
const check = (ok, code) => { if (!ok) { console.error("FAIL:", code); process.exit(1); } };
check(a.sourceHashQA === "PASS", "SOURCE_HASH");
check(a.candidateCountQA === "PASS", "NK_TEST_APP_CANDIDATE_COUNT");
check(a.totalCandidates === 40, "NK_TEST_APP_NOT_40");
check(a.condition1Present === true, "CONDITION_1");
check(a.condition2Present === true, "CONDITION_2");
check(a.finalRequestPresent === true, "FINAL_REQUEST");
check(a.paragraph101Owned === true, "PARAGRAPH_101");
check(a.paragraph102Owned === true, "PARAGRAPH_102");
check(a.referenceAnswerRegionFound === true, "REFERENCE_ANSWER_REGION");
check(a.answerEntryRestartQA === "PASS", "ANSWER_ENTRY_RESTART");
check(a.referenceAnswerContamination === false, "REFERENCE_ANSWER_CONTAMINATION");
check(a.aiFooterContamination === false, "AI_FOOTER_CONTAMINATION");
check(a.isolatedContinuationCandidateCount === 0, "ORPHAN_CONTINUATION");
check(a.continuationOwnershipQA === "PASS", "CONTINUATION_OWNERSHIP");
console.log("R2_36_FOCUSED_GATE=PASS");
NODE

echo ""
echo "===== 5. BOUNDARY REGRESSIONS ====="
node --import tsx tests/test-intra-block-question-segmentation.ts
node --import tsx tests/test-logical-source-slice-identity.ts
node --import tsx tests/test-canonical-boundary-remap.ts

echo ""
echo "===== 6. REAL 11-DOCX BOUNDARY AUDIT ====="
node --import tsx scripts/audit-intra-block-boundary-remediation.ts

echo ""
echo "===== 7. CANONICAL RECOMPOSITION ====="
node --import tsx scripts/recompose-word-beta-canonical-boundary.ts

echo ""
echo "===== 7B. CANONICAL AUTHORITY COUNT GATE ====="
node <<'NODE'
const fs = require("fs");
const p = "docs/evidence/word-beta-human-acceptance-round-2/canonical-boundary-recomposition.json";
const c = JSON.parse(fs.readFileSync(p, "utf8"));
const fail = (code) => { console.error("FAIL:", code); process.exit(1); };
if (c.canonicalBoundaryRecompositionQA !== "PASS") fail("SOURCE_BACKED_CANONICAL_REMAP");
if (c.unresolvedFrozenCount !== 0) fail("UNRESOLVED_FROZEN_AUTHORITY");
if (c.ambiguousFrozenCount !== 0 || c.ambiguousPromotionCount !== 0) fail("AMBIGUOUS_CANONICAL_REMAP");

if (c.humanCanonicalCountDecisionRequired === true || c.selectedQuestionCount !== c.frozenAuthorityCount) {
  const absorbed = (c.retired ?? []).filter((row) => row.reason === "SOURCE_OWNERSHIP_ABSORBED");
  console.log("");
  console.log("============================================");
  console.log(" CANONICAL AUTHORITY DECISION REQUIRED");
  console.log("============================================");
  console.log("FROZEN_AUTHORITY_COUNT =", c.frozenAuthorityCount);
  console.log("SOURCE_BACKED_SELECTED_COUNT =", c.selectedQuestionCount);
  console.log("CANONICAL_DELTA =", c.canonicalDeltaVs668);
  console.log("RETAINED_FROZEN_COUNT =", c.retainedFrozenCount);
  console.log("RETIRED_FROZEN_COUNT =", c.retiredFrozenCount);
  console.log("PROMOTED_SPLIT_COUNT =", c.promotedSplitCount);
  console.log("ABSORBED_FROZEN_COUNT =", absorbed.length);
  for (const row of absorbed) {
    console.log("ABSORBED_FROZEN =", JSON.stringify({
      frozenQuestionId: row.frozenQuestionId,
      sourceObjectIds: row.sourceObjectIds,
      absorbedByCurrentQuestionId: row.absorbedByCurrentQuestionId,
      absorbedSourceObjectIds: row.absorbedSourceObjectIds,
      appendixSourceObjectIds: row.appendixSourceObjectIds,
    }));
  }
  console.log("SOURCE_BACKED_REMAP_QA =", c.remapQA);
  console.log("HUMAN_CANONICAL_COUNT_DECISION_REQUIRED=YES");
  console.log("");
  process.exit(3);
}

console.log("CANONICAL_AUTHORITY_COUNT_GATE=PASS");
NODE

echo ""
echo "===== 8. WORD BETA RECONCILIATION ====="
node --import tsx scripts/run-word-beta-reconciliation.ts

echo ""
echo "===== 9. FEATURE MATRIX ====="
node --import tsx scripts/build-word-beta-acceptance-feature-matrix.ts
node --import tsx tests/test-word-beta-acceptance-feature-matrix.ts

echo ""
echo "===== 10. REVIEW SAMPLE ====="
node --import tsx scripts/certify-word-beta-review-sample.ts
node --import tsx tests/test-word-beta-review-sample-certification.ts

echo ""
echo "===== 11. HUMAN REVIEW PACK ====="
node --import tsx scripts/finalize-word-beta-human-review.ts
node --import tsx tests/test-word-beta-final-human-review-pack.ts

echo ""
echo "===== 12. READABILITY ====="
node --import tsx scripts/regenerate-word-beta-human-review-readable.ts
node --import tsx tests/test-word-beta-human-review-readability.ts

echo ""
echo "===== 13. FINAL MACHINE GATE ====="
node <<'NODE'
const fs = require("fs");
const ROOT = "docs/evidence/word-beta-human-acceptance-round-2";
const audit = JSON.parse(fs.readFileSync(`${ROOT}/R2-36-numbered-continuation-audit.json`, "utf8"));
const boundary = JSON.parse(fs.readFileSync(`${ROOT}/intra-block-boundary-remediation-impact.json`, "utf8"));
const canonical = JSON.parse(fs.readFileSync(`${ROOT}/canonical-boundary-recomposition.json`, "utf8"));
const cert = JSON.parse(fs.readFileSync("docs/evidence/word-beta-final/word-beta-certification.json", "utf8"));
const matrix = JSON.parse(fs.readFileSync(`${ROOT}/acceptance-feature-matrix.json`, "utf8"));
const coverage = JSON.parse(fs.readFileSync(`${ROOT}/risk-coverage-certification.json`, "utf8"));
const index = JSON.parse(fs.readFileSync(`${ROOT}/round-2-review-index.json`, "utf8"));
const check = (ok, code) => { if (!ok) { console.error("FAIL:", code); process.exit(1); } };
check(audit.sourceHashQA === "PASS", "R236_SOURCE_HASH");
check(audit.candidateCountQA === "PASS", "R236_CANDIDATE_COUNT");
check(audit.continuationOwnershipQA === "PASS", "R236_CONTINUATION");
check(audit.referenceAnswerContamination === false, "R236_REFERENCE_ANSWER");
check(audit.aiFooterContamination === false, "R236_AI_FOOTER");
check(boundary.candidateWithMultipleExplicitQuestionMarkersCount === 0, "MULTI_MARKER");
check(boundary.boundaryRemediationImpactQA === "PASS", "BOUNDARY_AUDIT");
check(canonical.canonicalBoundaryRecompositionQA === "PASS", "CANONICAL_RECOMPOSITION");
check(canonical.selectedQuestionCount === 668, "CANONICAL_COUNT");
check(cert.questionIRCount === 668, "QIR_COUNT");
check(cert.packageCount === 668, "PACKAGE_COUNT");
check(cert.hashMatchCount === 11 && cert.hashMismatchCount === 0, "SOURCE_HASH");
check(cert.automatedWordBetaQA === "PASS", "WORD_BETA_QA");
check(matrix.featureMatrixQuestionCount === 668, "FEATURE_MATRIX");
check(matrix.featureMatrixUniqueCanonicalIdentityCount === 668, "FEATURE_MATRIX_IDENTITY");
check(coverage.riskCoverageQA === "PASS", "RISK_COVERAGE");
const r236 = index.cases.find((x) => x.reviewCaseId === "R2-36");
check(Boolean(r236), "R236_MISSING");
const reviewPath = `${ROOT}/${r236.relativeReviewPath}/review.md`;
const md = fs.readFileSync(reviewPath, "utf8");
check(/cấp\s+số\s+cộng\s+tăng/iu.test(md), "REVIEW_CONDITION_1");
check(/bằng\s+tổng\s+của\s+cả\s+ba\s+số/iu.test(md), "REVIEW_CONDITION_2");
check(/Tính\s+giá\s+trị\s+của\s+biểu\s+thức/iu.test(md), "REVIEW_FINAL_REQUEST");
check(!/ĐÁP\s*ÁN\s+THAM\s+KHẢO/iu.test(md), "REVIEW_REFERENCE_ANSWER_CONTAMINATION");
check(!/Được\s+thực\s+hiện\s+bởi\s+AI/iu.test(md), "REVIEW_AI_FOOTER_CONTAMINATION");
console.log("================================");
console.log(" FINAL WORD BETA SUMMARY");
console.log("================================");
console.log("R2_36_SOURCE_HASH_QA =", audit.sourceHashQA);
console.log("R2_36_SOURCE_CANDIDATES =", audit.totalCandidates);
console.log("R2_36_CONTINUATION =", audit.continuationOwnershipQA);
console.log("R2_36_REFERENCE_ANSWER_CONTAMINATION =", audit.referenceAnswerContamination);
console.log("R2_36_AI_FOOTER_CONTAMINATION =", audit.aiFooterContamination);
console.log("RAW_CANDIDATES =", boundary.segmentedCandidateCount);
console.log("CANONICAL =", canonical.selectedQuestionCount);
console.log("QIR =", cert.questionIRCount);
console.log("PACKAGES =", cert.packageCount);
console.log("FEATURE_MATRIX =", matrix.featureMatrixQuestionCount);
console.log("WORD_BETA_QA =", cert.automatedWordBetaQA);
console.log("R2-36 REVIEW =", reviewPath);
console.log("R2_36_ENGINEERING_CLOSEOUT=PASS");
NODE

echo ""
echo "===== 14. FINAL WORKTREE ====="
git status --short
