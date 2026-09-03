import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ROOT = "docs/evidence/word-beta-human-acceptance-round-2";
const index = JSON.parse(readFileSync(`${ROOT}/round-2-review-index.json`, "utf8"));

assert.equal(index.caseCount, 40);
assert.equal(index.cases.length, 40);
assert.equal(index.reviewRenderer, "PIMATH_WORD_BETA_HUMAN_READABLE_RENDERER_V2");
assert.equal(index.identityAuthority, "CANONICAL_LOGICAL_SOURCE_SLICE");
assert.ok(["PASS", "PARTIAL"].includes(index.humanReviewReadabilityQA));
assert.equal(index.currentVisibleCaseCount, 40);

for (const entry of index.cases) {
  const base = `${ROOT}/${entry.relativeReviewPath}`;
  const review = JSON.parse(readFileSync(`${base}/review.json`, "utf8"));
  const md = readFileSync(`${base}/review.md`, "utf8");

  assert.equal(review.schemaVersion, "PIMATH_WORD_BETA_HUMAN_REVIEW_CASE_V4");
  assert.ok(["PASS", "NEEDS_SOURCE_CHECK"].includes(review.reviewReadabilityStatus));
  assert.equal(review.questionId, entry.questionId);
  assert.equal(review.canonicalIdentityKey, entry.canonicalIdentityKey);
  assert.equal(review.canonicalSelectionKind, entry.canonicalSelectionKind);
  assert.ok(Array.isArray(review.source?.sourceSliceIds) && review.source.sourceSliceIds.length > 0);
  assert.ok(typeof review.sourceRepresentation?.text === "string");
  assert.ok(typeof review.finalRepresentation?.text === "string");
  assert.ok(review.finalRepresentation.text.length > 0);

  assert.ok(md.includes("## A. Source document reconstruction"));
  assert.ok(md.includes("## B. Current PiMath QuestionIR"));
  assert.ok(md.includes("## C. Answer / Solution"));
  assert.ok(md.includes("## D. Technical evidence"));
  assert.ok(md.includes("## E. Human Review"));
  assert.ok(md.includes("HUMAN_DECISIONS.md"));
  assert.match(md, /- \*\*Question ID:\*\*/);
  assert.match(md, /- \*\*Canonical selection:\*\*/);
  assert.match(md, /- \*\*Source document:\*\*/);
}

const promoted = index.cases.filter((entry: any) => entry.canonicalSelectionKind === "PROMOTED_SPLIT");
if (promoted.length > 0) {
  assert.ok(promoted.every((entry: any) => (entry.coverageTags ?? []).includes("BOUNDARY_REMEDIATION_SPLIT")));
}

console.log("WORD_BETA_HUMAN_REVIEW_READABILITY_TESTS=PASS");
