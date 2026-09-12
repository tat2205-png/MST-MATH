import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ROOT = "docs/evidence/word-beta-human-acceptance-round-2";
const index = JSON.parse(readFileSync(`${ROOT}/round-2-review-index.json`, "utf8"));

assert.equal(index.caseCount, 40);
assert.equal(index.cases.length, 40);
assert.equal(index.reviewRenderer, "PIMATH_WORD_BETA_HUMAN_READABLE_RENDERER_V1");
assert.ok(["PASS", "PARTIAL"].includes(index.humanReviewReadabilityQA));
assert.equal(index.currentVisibleCaseCount, 40);

for (const entry of index.cases) {
  const base = `${ROOT}/${entry.relativeReviewPath}`;
  const review = JSON.parse(readFileSync(`${base}/review.json`, "utf8"));
  const md = readFileSync(`${base}/review.md`, "utf8");

  assert.equal(review.schemaVersion, "PIMATH_WORD_BETA_HUMAN_REVIEW_CASE_V3");
  assert.ok(["PASS", "NEEDS_SOURCE_CHECK"].includes(review.reviewReadabilityStatus));
  assert.equal(review.questionId, entry.questionId);
  assert.ok(typeof review.sourceRepresentation?.text === "string");
  assert.ok(typeof review.finalRepresentation?.text === "string");
  assert.ok(review.finalRepresentation.text.length > 0);

  assert.ok(md.includes("## A. Source document reconstruction"));
  assert.ok(md.includes("## B. Current PiMath QuestionIR"));
  assert.ok(md.includes("## C. Answer / Solution"));
  assert.ok(md.includes("## D. Technical evidence"));
  assert.ok(md.includes("## E. Human Review"));
  assert.ok(md.includes("HUMAN_DECISIONS.md"));

  // Metadata must be rendered as separate Markdown lines instead of one unreadable run-on line.
  assert.match(md, /- \*\*Question ID:\*\*/);
  assert.match(md, /- \*\*Source document:\*\*/);
}

console.log("WORD_BETA_HUMAN_REVIEW_READABILITY_TESTS=PASS");
