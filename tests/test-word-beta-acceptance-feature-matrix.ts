import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const matrix = JSON.parse(
  readFileSync(
    "docs/evidence/word-beta-human-acceptance-round-2/acceptance-feature-matrix.json",
    "utf8",
  ),
);

const EXPECTED_QUESTION_COUNT = 668;
const PRIMARY_TYPES = ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY", "UNKNOWN"] as const;

const expectedFormatForMathId = (id: string) =>
  id.startsWith("mtef-v3-") ? "MTEF_V3" : id.startsWith("mtef-") ? "MTEF_V5" : "MODERN_MATH";

assert.equal(matrix.featureMatrixQuestionCount, EXPECTED_QUESTION_COUNT);
assert.equal(matrix.featureMatrixUniqueQuestionIdCount, EXPECTED_QUESTION_COUNT);
assert.equal(matrix.rows.length, EXPECTED_QUESTION_COUNT);

const ids = matrix.rows.map((row: any) => row.questionId);
assert.equal(new Set(ids).size, EXPECTED_QUESTION_COUNT);
assert.deepEqual(ids, [...ids].sort());

const typeSets = new Map(
  PRIMARY_TYPES.map((type) => [
    type,
    new Set(matrix.rows.filter((row: any) => row.questionType === type).map((row: any) => row.questionId)),
  ]),
);
assert.ok(matrix.rows.every((row: any) => PRIMARY_TYPES.includes(row.questionType)));

const typeCountSum = [...typeSets.values()].reduce((sum, set) => sum + set.size, 0);
assert.equal(typeCountSum, EXPECTED_QUESTION_COUNT);
assert.equal(new Set([...typeSets.values()].flatMap((set) => [...set])).size, EXPECTED_QUESTION_COUNT);

for (const row of matrix.rows) {
  assert.ok(row.questionId);
  assert.ok(Array.isArray(row.mathFormats));
  assert.ok(Array.isArray(row.mathRoles));
  assert.ok(Array.isArray(row.mathObjectIds));
  assert.ok(Array.isArray(row.assetIds));
  assert.ok(Array.isArray(row.evidenceRefs) && row.evidenceRefs.length > 0);

  const expectedFormats = [...new Set(row.mathObjectIds.map(expectedFormatForMathId))].sort();
  assert.deepEqual(row.mathFormats, expectedFormats);

  const expectedRiskTags = new Set([
    ...row.mathFormats,
    ...row.mathRoles,
    ...(row.assetIds.length > 0 ? ["ASSET_BEARING"] : []),
    ...(row.assetIds.length > 1 ? ["MULTI_ASSET"] : []),
  ]);
  assert.deepEqual(row.riskTags, [...expectedRiskTags].sort());
}

const v3Rows = matrix.rows.filter((row: any) =>
  row.mathObjectIds.some((id: string) => id.startsWith("mtef-v3-")),
);
const v3UniqueMathIds = new Set(
  v3Rows.flatMap((row: any) =>
    row.mathObjectIds.filter((id: string) => id.startsWith("mtef-v3-")),
  ),
);

// Current locked source corpus is known to contain V3 objects. This assertion prevents
// an unresolved V3 join from silently being emitted as numeric zero again.
assert.ok(v3Rows.length > 0);
assert.ok(v3UniqueMathIds.size > 0);
assert.ok(v3Rows.every((row: any) => row.mathFormats.includes("MTEF_V3")));

assert.equal(matrix.summary.questionTypePrimaryCountSum, EXPECTED_QUESTION_COUNT);
assert.equal(matrix.summary.questionTypeMultiPrimaryCount, 0);
assert.equal(matrix.summary.questionTypeUnaccountedCount, 0);
assert.equal(matrix.summary.questionTypeSetEqualityQA, "PASS");
assert.equal(matrix.summary.questionTypeAccountingQA, "PASS");

assert.equal(matrix.summary.mathFormatQuestionCounts.MTEF_V3, v3Rows.length);
assert.equal(matrix.summary.mathFormatUniqueMathObjectCounts.MTEF_V3, v3UniqueMathIds.size);
assert.equal(matrix.summary.v3QuestionJoinQA, "PASS");
assert.equal(matrix.summary.mathFormatDerivationQA, "PASS");

console.log("ACCEPTANCE_FEATURE_MATRIX_TESTS=PASS");
