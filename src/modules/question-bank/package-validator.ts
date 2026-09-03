export interface ExpectedPackageManifest {
  questionId: string;
  sourceDocumentId: string;
  sourceObjectIds: string[];
  sourceSliceIds: string[];
  expectedMathReferenceCount: number;
  expectedAssetReferenceCount: number;
  expectedTextBlockIds: string[];
  requiredProvenanceFields: string[];
}

export function buildExpectedPackageManifest(q: any): ExpectedPackageManifest {
  return {
    questionId: q.id,
    sourceDocumentId: q.sourceDocumentId,
    sourceObjectIds: [...q.sourceObjectIds],
    sourceSliceIds: [...(q.sourceSliceIds ?? q.sourceObjectIds)],
    expectedMathReferenceCount: q.mathObjectIds.length,
    expectedAssetReferenceCount: q.assetIds.length,
    expectedTextBlockIds: q.sourceObjectIds.filter((x: string) => x.includes("paragraph")),
    requiredProvenanceFields: ["sourceFile", "sourceSha256"],
  };
}

const sameOrdered = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export function validatePackageManifest(expected: ExpectedPackageManifest, actual: any) {
  const errors: string[] = [];
  if (actual.id !== expected.questionId) errors.push("QUESTION_ID");

  const actualSourceObjectIds = [...(actual.sourceObjectIds ?? [])];
  if (!sameOrdered(expected.sourceObjectIds, actualSourceObjectIds)) errors.push("SOURCE_OBJECT_IDENTITY");

  const actualSourceSliceIds = [...(actual.sourceSliceIds ?? actual.question?.sourceSliceIds ?? actualSourceObjectIds)];
  if (!sameOrdered(expected.sourceSliceIds, actualSourceSliceIds)) errors.push("SOURCE_SLICE_IDENTITY");

  if ((actual.mathObjectIds?.length ?? 0) !== expected.expectedMathReferenceCount) errors.push("MATH_REFERENCE");
  const actualAssetIds = [...new Set((actual.assets ?? []).map((a: any) => a.assetId))];
  if (actualAssetIds.length !== expected.expectedAssetReferenceCount) errors.push("ASSET_REFERENCE");
  for (const field of expected.requiredProvenanceFields) {
    if (!actual.provenance?.[field]) errors.push(`PROVENANCE:${field}`);
  }
  return { valid: errors.length === 0, errors };
}
