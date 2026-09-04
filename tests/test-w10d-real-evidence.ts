import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync("docs/evidence/w10d-real-corpus/manifest.json", "utf8"));
const review = JSON.parse(readFileSync("docs/evidence/w10d-real-corpus/question-review.json", "utf8"));
assert.equal(manifest.totals.realDocxTotal, 11);
assert.equal(manifest.totals.detectedQuestions, 160);
assert.equal(manifest.totals.sourceMath, 3077);
assert.equal(manifest.totals.documentMath, 3077);
assert.equal(manifest.totals.questionMath, 2912);
assert.equal(manifest.totals.packageMath, 2912);
assert.equal(manifest.totals.sourceAssets, 571);
assert.equal(manifest.totals.extractedAssets, 587);
assert.ok(manifest.files.every((file: { immutable: boolean }) => file.immutable));
assert.equal(review.humanVerificationRequired, 160);
assert.equal(review.documents.flatMap((document: { questions: unknown[] }) => document.questions).length, 160);
console.log("W10D_REAL_EVIDENCE_QA=PASS");
