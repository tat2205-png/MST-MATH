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
assert.equal(matrix.featureMatrixUniqueCanonicalIdentityCount, EXPECTED_QUESTION_COUNT);
assert.equal(matrix.rows.length, EXPECTED_QUESTION_COUNT);
assert.equal(matrix.identityAuthority, "CANONICAL_LOGICAL_SOURCE_SLICE");
assert.equal(matrix.summary.acceptanceIdentityQA, "PASS");
assert.equal(matrix.summary.canonicalIdentityAccountingQA, "PASS");

const ids = matrix.rows.map((row: any) => row.questionId);
assert.equal(new Set(ids).size, EXPECTED_QUESTION_COUNT);
assert.deepEqual(ids, [...ids].sort());
assert.ok(matrix.rows.every((row: any) => /^[0-9a-f]{12}-(?:qcandidate-\d+|qslice-[0-9a-f]{12})$/.test(row.questionId)));
assert.ok(matrix.rows.every((row: any) => typeof row.questionIrId === "string" && row.questionIrId.length > 0));
assert.ok(matrix.rows.every((row: any) => typeof row.canonicalIdentityKey === "string" && row.canonicalIdentityKey.length > 0));
assert.ok(matrix.rows.every((row: any) => Array.isArray(row.sourceSliceIds) && row.sourceSliceIds.length > 0));
assert.ok(matrix.rows.every((row: any) => ["RETAINED_FROZEN", "PROMOTED_SPLIT"].includes(row.canonicalSelectionKind)));
assert.equal(new Set(matrix.rows.map((row: any) => row.canonicalIdentityKey)).size, EXPECTED_QUESTION_COUNT);
assert.ok(matrix.summary.retainedFrozenQuestionCount + matrix.summary.promotedSplitQuestionCount === EXPECTED_QUESTION_COUNT);

const promoted = matrix.rows.filter((row: any) => row.canonicalSelectionKind === "PROMOTED_SPLIT");
assert.equal(promoted.length, matrix.summary.promotedSplitQuestionCount);
assert.ok(promoted.every((row: any) => row.riskTags.includes("BOUNDARY_REMEDIATION_SPLIT")));
assert.ok(promoted.every((row: any) => row.identityContinuity === "NEW_SOURCE_BACKED_SPLIT_ID" || String(row.identityContinuity).startsWith("PRESERVED_")));

const questionIrIds = matrix.rows.map((row: any) => row.questionIrId);
const expectedQuestionIrDuplicateCount = matrix.rows.length - new Set(questionIrIds).size;
assert.equal(matrix.summary.questionIrDuplicateIdCount, expectedQuestionIrDuplicateCount);
assert.equal(matrix.summary.questionIrUniqueIdCount, new Set(questionIrIds).size);
assert.equal(
  matrix.summary.questionIrCollisionStatus,
  expectedQuestionIrDuplicateCount > 0 ? "DOCUMENTED_NON_BLOCKING_FOR_ACCEPTANCE_IDENTITY" : "NONE",
);
if (expectedQuestionIrDuplicateCount > 0) {
  assert.ok(Array.isArray(matrix.summary.questionIrCollisionGroups));
  assert.ok(matrix.summary.questionIrCollisionGroups.length > 0);
  assert.ok(matrix.summary.questionIrCollisionGroups.every((group: any) => group.acceptanceQuestionIds.length > 1));
}

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
    ...(row.canonicalSelectionKind === "PROMOTED_SPLIT" ? ["BOUNDARY_REMEDIATION_SPLIT"] : []),
  ]);
  assert.deepEqual(row.riskTags, [...expectedRiskTags].sort());
}

const v3Rows = matrix.rows.filter((row: any) =>
  row.mathObjectIds.some((id: string) => id.startsWith("mtef-v3-")),
);
const v3UniqueMathIds = new Set(
  v3Rows.flatMap((row: any) => row.mathObjectIds.filter((id: string) => id.startsWith("mtef-v3-"))),
);
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
