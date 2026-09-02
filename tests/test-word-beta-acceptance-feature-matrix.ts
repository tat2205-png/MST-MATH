import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const matrix = JSON.parse(readFileSync("docs/evidence/word-beta-human-acceptance-round-2/acceptance-feature-matrix.json", "utf8"));
assert.equal(matrix.featureMatrixQuestionCount, 668);
assert.equal(matrix.featureMatrixUniqueQuestionIdCount, 668);
assert.equal(matrix.rows.length, 668);
assert.ok(matrix.rows.every((row: any) => row.questionId && Array.isArray(row.mathFormats) && Array.isArray(row.mathRoles) && Array.isArray(row.evidenceRefs) && row.evidenceRefs.length > 0));
assert.deepEqual(matrix.rows.map((row: any) => row.questionId), [...matrix.rows].map((row: any) => row.questionId).sort());
console.log("ACCEPTANCE_FEATURE_MATRIX_TESTS=PASS");
