import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const ROOT = "docs/evidence/word-beta-human-acceptance-round-2";
const index = JSON.parse(readFileSync(`${ROOT}/round-2-review-index.json`, "utf8"));
const selection = JSON.parse(readFileSync(`${ROOT}/final-review-selection.json`, "utf8"));
const coverage = JSON.parse(readFileSync(`${ROOT}/risk-coverage-certification.json`, "utf8"));

assert.equal(index.caseCount, 40);
assert.equal(index.cases.length, 40);
assert.equal(index.identityAuthority, "CANONICAL_LOGICAL_SOURCE_SLICE");
assert.equal(new Set(index.cases.map((entry: any) => entry.reviewCaseId)).size, 40);
assert.equal(new Set(index.cases.map((entry: any) => entry.questionId)).size, 40);
assert.equal(new Set(index.cases.map((entry: any) => entry.canonicalIdentityKey)).size, 40);

const selected = [...selection.finalQuestionIds].sort();
const indexed = index.cases.map((entry: any) => entry.questionId).sort();
assert.deepEqual(indexed, selected);

for (const entry of index.cases) {
  assert.match(entry.reviewCaseId, /^R2-\d{2}$/);
  assert.ok(entry.reviewArtifactHash);
  assert.equal(entry.humanDecisionStatus, "PENDING");
  assert.ok(["RETAINED_FROZEN", "PROMOTED_SPLIT"].includes(entry.canonicalSelectionKind));
  assert.ok(typeof entry.canonicalIdentityKey === "string" && entry.canonicalIdentityKey.length > 0);
  const base = `${ROOT}/${entry.relativeReviewPath}`;
  assert.ok(existsSync(`${base}/review.json`), `missing ${base}/review.json`);
  assert.ok(existsSync(`${base}/review.md`), `missing ${base}/review.md`);
  const review = JSON.parse(readFileSync(`${base}/review.json`, "utf8"));
  assert.equal(review.reviewCaseId, entry.reviewCaseId);
  assert.equal(review.questionId, entry.questionId);
  assert.equal(review.canonicalIdentityKey, entry.canonicalIdentityKey);
  assert.equal(review.canonicalSelectionKind, entry.canonicalSelectionKind);
  assert.equal(review.humanReview.decision, null);
  assert.ok(Array.isArray(review.coverageTags));
  assert.ok(Array.isArray(review.source?.sourceSliceIds) && review.source.sourceSliceIds.length > 0);
}

assert.equal(coverage.mandatoryCoverageGapCount, 0);
assert.equal(coverage.coverageDerivationQA, "PASS");
assert.equal(coverage.riskCoverageQA, "PASS");
assert.equal(coverage.boundaryRemediationSplitCoverageQA, "PASS");
if (index.cases.some((entry: any) => entry.canonicalSelectionKind === "PROMOTED_SPLIT")) {
  assert.ok(index.cases.some((entry: any) => (entry.coverageTags ?? []).includes("BOUNDARY_REMEDIATION_SPLIT")));
}

const humanIndex = readFileSync(`${ROOT}/HUMAN_REVIEW_INDEX.md`, "utf8");
const decisions = readFileSync(`${ROOT}/HUMAN_DECISIONS.md`, "utf8");
assert.ok(humanIndex.includes("Final review cases: 40"));
assert.ok(humanIndex.includes("Canonical identity: PASS"));
assert.ok(humanIndex.includes("Boundary remediation split coverage: PASS"));
assert.equal((decisions.match(/^\| \d+ \| R2-/gm) ?? []).length, 40);
assert.ok(!/\|\s*(ACCEPT|MINOR_NON_BLOCKING|BLOCKING|NEEDS_SOURCE_CHECK)\s*\|/m.test(decisions));

console.log("WORD_BETA_FINAL_HUMAN_REVIEW_PACK_TESTS=PASS");
