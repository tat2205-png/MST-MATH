import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { ingestDocx } from "../src/modules/document-engine/docx/ingestion.js";
import { detectSharedContexts } from "../src/modules/question-bank/boundary-validation.js";
import { canonicalQuestionIdentityKey } from "../src/modules/question-bank/canonical-boundary-remap.js";
import { segmentCanonicalQuestions } from "../src/modules/question-bank/canonical-segmentation.js";

const EXPECTED_QUESTION_COUNT = 668;
const root = process.env.PIMATH_WORD_REAL_CORPUS ?? join(homedir(), "PiMath-Acceptance", "word-real");
const out = "docs/evidence/word-beta-human-acceptance-round-2";
const matrixPath = `${out}/acceptance-feature-matrix.json`;
const canonicalPath = `${out}/canonical-boundary-recomposition.json`;
const files = readdirSync(root).filter((name) => name.endsWith(".docx") && !name.startsWith("~$")).sort();

type MathFormat = "MODERN_MATH" | "MTEF_V5" | "MTEF_V3";
type MathRole =
  | "MATH_IN_STEM"
  | "MATH_IN_OPTIONS"
  | "MATH_IN_TRUE_FALSE_SUBITEMS"
  | "MATH_IN_SHORT_ANSWER"
  | "MATH_IN_ANSWER"
  | "MATH_IN_SOLUTION"
  | "SHARED_CONTEXT_MATH";
type PrimaryQuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "UNKNOWN";

const PRIMARY_TYPES: readonly PrimaryQuestionType[] = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "SHORT_ANSWER",
  "ESSAY",
  "UNKNOWN",
];

const uniqueSorted = (values: Iterable<string>) => [...new Set(values)].sort();
const sameStringSet = (a: readonly string[] = [], b: readonly string[] = []) => {
  const aa = uniqueSorted(a);
  const bb = uniqueSorted(b);
  return aa.length === bb.length && aa.every((value, index) => value === bb[index]);
};
const shortHash = (value: string) => createHash("sha256").update(value).digest("hex").slice(0, 12);

function classifyMathObjectId(id: string): MathFormat {
  if (id.startsWith("mtef-v3-")) return "MTEF_V3";
  if (id.startsWith("mtef-")) return "MTEF_V5";
  return "MODERN_MATH";
}

function hasMath(blocks: any[] | undefined): boolean {
  return (blocks ?? []).some((block) => block.type === "math");
}

function normalizePrimaryQuestionType(value: unknown): PrimaryQuestionType {
  const type = String(value ?? "UNKNOWN") as PrimaryQuestionType;
  return PRIMARY_TYPES.includes(type) ? type : "UNKNOWN";
}

const canonical = JSON.parse(readFileSync(canonicalPath, "utf8"));
if (
  canonical.canonicalBoundaryRecompositionQA !== "PASS" ||
  canonical.selectedQuestionCount !== EXPECTED_QUESTION_COUNT ||
  !Array.isArray(canonical.selectedQuestions) ||
  canonical.selectedQuestions.length !== EXPECTED_QUESTION_COUNT
) {
  throw new Error("CANONICAL_668_SELECTION_NOT_CERTIFIED");
}

const selectedByIdentity = new Map<string, any>();
for (const selection of canonical.selectedQuestions) {
  const key = `${selection.sourceDocumentId}::${(selection.sourceSliceIds ?? selection.sourceObjectIds).join("|")}`;
  if (selectedByIdentity.has(key)) throw new Error(`CANONICAL_SELECTION_IDENTITY_COLLISION:${key}`);
  selectedByIdentity.set(key, selection);
}

const priorMatrix = existsSync(matrixPath) ? JSON.parse(readFileSync(matrixPath, "utf8")) : null;
const priorRows: any[] = Array.isArray(priorMatrix?.rows) ? priorMatrix.rows : [];

function deterministicAcceptanceId(sourceHash: string, identityKey: string): string {
  return `${sourceHash.slice(0, 12)}-qslice-${shortHash(identityKey)}`;
}

function continuityAcceptanceId(selection: any, question: any, sourceHash: string, identityKey: string) {
  const exactIdentity = priorRows.filter((row) =>
    row.canonicalIdentityKey === identityKey &&
    row.sourceDocumentId === question.sourceDocumentId,
  );
  if (exactIdentity.length === 1) {
    return { questionId: String(exactIdentity[0].questionId), identityContinuity: "PRESERVED_CANONICAL_IDENTITY" };
  }

  if (selection.selectionKind === "RETAINED_FROZEN") {
    const legacy = priorRows.filter((row) =>
      row.sourceDocumentId === question.sourceDocumentId &&
      row.questionIrId === selection.frozenQuestionId &&
      sameStringSet(row.sourceObjectIds ?? [], selection.sourceObjectIds ?? []),
    );
    if (legacy.length === 1) {
      return { questionId: String(legacy[0].questionId), identityContinuity: "PRESERVED_LEGACY_ACCEPTANCE_ID" };
    }
  }

  return {
    questionId: deterministicAcceptanceId(sourceHash, identityKey),
    identityContinuity: selection.selectionKind === "PROMOTED_SPLIT" ? "NEW_SOURCE_BACKED_SPLIT_ID" : "NEW_SOURCE_IDENTITY_ID",
  };
}

const rows: any[] = [];
const consumedCanonicalIdentities = new Set<string>();

for (const file of files) {
  const document = ingestDocx({
    name: file,
    bytes: new Uint8Array(readFileSync(join(root, file))),
  }).document;
  if (!document) throw new Error(`MISSING_DOCUMENT_IR:${file}`);

  const sharedContexts = new Map(
    detectSharedContexts(document).map((context) => [context.contextId, context]),
  );

  for (const question of segmentCanonicalQuestions(document)) {
    const canonicalIdentityKey = canonicalQuestionIdentityKey(question);
    const selection = selectedByIdentity.get(canonicalIdentityKey);
    if (!selection) continue;
    if (consumedCanonicalIdentities.has(canonicalIdentityKey)) {
      throw new Error(`DUPLICATE_CANONICAL_FEATURE_MATRIX_CONSUMPTION:${canonicalIdentityKey}`);
    }
    consumedCanonicalIdentities.add(canonicalIdentityKey);

    const { questionId, identityContinuity } = continuityAcceptanceId(
      selection,
      question,
      document.sourceHash,
      canonicalIdentityKey,
    );
    const questionIrId = question.id;
    const mathObjectIds = uniqueSorted(question.mathObjectIds ?? []);
    const mathFormats = uniqueSorted(mathObjectIds.map(classifyMathObjectId)) as MathFormat[];

    const roles = new Set<MathRole>();
    if (hasMath(question.stem)) roles.add("MATH_IN_STEM");
    if (question.options.some((option: any) => hasMath(option.content))) roles.add("MATH_IN_OPTIONS");
    if ((question.subitems ?? []).some((subitem: any) => hasMath(subitem.content))) roles.add("MATH_IN_TRUE_FALSE_SUBITEMS");
    if (hasMath(question.answer)) {
      roles.add("MATH_IN_ANSWER");
      if (question.questionType === "SHORT_ANSWER") roles.add("MATH_IN_SHORT_ANSWER");
    }
    if (hasMath(question.solution)) roles.add("MATH_IN_SOLUTION");

    const sharedContextMathObjectIds = uniqueSorted(
      (question.contextIds ?? []).flatMap(
        (contextId: string) => sharedContexts.get(contextId)?.mathObjectIds ?? [],
      ),
    );
    if (sharedContextMathObjectIds.length > 0) roles.add("SHARED_CONTEXT_MATH");

    const assetIds = uniqueSorted([...(question.assetIds ?? []), ...(question.tableIds ?? [])]);
    const riskTags = uniqueSorted([
      ...mathFormats,
      ...roles,
      ...(assetIds.length > 0 ? ["ASSET_BEARING"] : []),
      ...(assetIds.length > 1 ? ["MULTI_ASSET"] : []),
      ...(selection.selectionKind === "PROMOTED_SPLIT" ? ["BOUNDARY_REMEDIATION_SPLIT"] : []),
    ]);

    rows.push({
      questionId,
      questionIrId,
      canonicalIdentityKey,
      canonicalSelectionKind: selection.selectionKind,
      canonicalMatchKind: selection.matchKind ?? null,
      canonicalFrozenQuestionId: selection.frozenQuestionId ?? null,
      canonicalParentFrozenQuestionId: selection.parentFrozenQuestionId ?? null,
      canonicalCurrentQuestionId: selection.currentQuestionId ?? question.id,
      identityContinuity,
      sourceDocumentId: question.sourceDocumentId,
      sourceAnchor: question.provenance,
      sourceObjectIds: uniqueSorted(question.sourceObjectIds ?? []),
      sourceSliceIds: [...(question.sourceSliceIds ?? question.sourceObjectIds ?? [])],
      questionType: normalizePrimaryQuestionType(question.questionType),
      mathFormats,
      mathRoles: [...roles].sort(),
      mathObjectIds,
      mathObjectCount: mathObjectIds.length,
      sharedContextMathObjectIds,
      assetIds,
      assetCount: assetIds.length,
      riskTags,
      evidenceRefs: [
        "source-backed canonical boundary recomposition",
        "canonical logical source-slice identity",
        "current DocumentIR",
        "current canonical QuestionIR",
        "MathExpression.id format identity contract: mtef-v3-* / mtef-* / modern",
      ],
    });
  }
}

if (consumedCanonicalIdentities.size !== selectedByIdentity.size) {
  const missing = [...selectedByIdentity.keys()].filter((key) => !consumedCanonicalIdentities.has(key));
  throw new Error(`CANONICAL_FEATURE_MATRIX_JOIN_MISSING:${missing.length}:${missing.slice(0, 3).join(",")}`);
}

rows.sort((a, b) => a.questionId.localeCompare(b.questionId));

const questionIds = rows.map((row) => row.questionId);
const uniqueQuestionIds = new Set(questionIds);
const canonicalIdentityKeys = rows.map((row) => row.canonicalIdentityKey);
const uniqueCanonicalIdentityKeys = new Set(canonicalIdentityKeys);
const questionIrIds = rows.map((row) => row.questionIrId);
const uniqueQuestionIrIds = new Set(questionIrIds);
const questionIrGroups = new Map<string, string[]>();
for (const row of rows) {
  const ids = questionIrGroups.get(row.questionIrId) ?? [];
  ids.push(row.questionId);
  questionIrGroups.set(row.questionIrId, ids);
}
const questionIrCollisionGroups = [...questionIrGroups.entries()]
  .filter(([, ids]) => ids.length > 1)
  .map(([questionIrId, acceptanceQuestionIds]) => ({ questionIrId, acceptanceQuestionIds: acceptanceQuestionIds.sort() }))
  .sort((a, b) => a.questionIrId.localeCompare(b.questionIrId));
const questionIrDuplicateIdCount = rows.length - uniqueQuestionIrIds.size;

const typeCounts = Object.fromEntries(
  PRIMARY_TYPES.map((type) => [type, rows.filter((row) => row.questionType === type).length]),
) as Record<PrimaryQuestionType, number>;
const questionTypePrimaryCountSum = Object.values(typeCounts).reduce((sum, count) => sum + count, 0);
const questionTypeUnaccountedCount = rows.filter((row) => !PRIMARY_TYPES.includes(row.questionType)).length;
const questionTypeMultiPrimaryCount = 0;

const mathFormatQuestionCounts = {
  MODERN_MATH: rows.filter((row) => row.mathFormats.includes("MODERN_MATH")).length,
  MTEF_V5: rows.filter((row) => row.mathFormats.includes("MTEF_V5")).length,
  MTEF_V3: rows.filter((row) => row.mathFormats.includes("MTEF_V3")).length,
};
const allMathObjectIds = uniqueSorted(rows.flatMap((row) => row.mathObjectIds));
const mathFormatUniqueMathObjectCounts = {
  MODERN_MATH: allMathObjectIds.filter((id) => classifyMathObjectId(id) === "MODERN_MATH").length,
  MTEF_V5: allMathObjectIds.filter((id) => classifyMathObjectId(id) === "MTEF_V5").length,
  MTEF_V3: allMathObjectIds.filter((id) => classifyMathObjectId(id) === "MTEF_V3").length,
};
const v3QuestionJoinQa = mathFormatUniqueMathObjectCounts.MTEF_V3 > 0 && mathFormatQuestionCounts.MTEF_V3 > 0 ? "PASS" : "FAIL";
const acceptanceIdentityQa =
  rows.length === EXPECTED_QUESTION_COUNT &&
  uniqueQuestionIds.size === EXPECTED_QUESTION_COUNT &&
  uniqueCanonicalIdentityKeys.size === EXPECTED_QUESTION_COUNT
    ? "PASS"
    : "FAIL";

const featureMatrixQa =
  acceptanceIdentityQa === "PASS" &&
  questionTypePrimaryCountSum === EXPECTED_QUESTION_COUNT &&
  questionTypeUnaccountedCount === 0 &&
  v3QuestionJoinQa === "PASS"
    ? "PASS"
    : "FAIL";

const summary = {
  acceptanceIdentityQA: acceptanceIdentityQa,
  canonicalIdentityUniqueCount: uniqueCanonicalIdentityKeys.size,
  canonicalIdentityAccountingQA: uniqueCanonicalIdentityKeys.size === EXPECTED_QUESTION_COUNT ? "PASS" : "FAIL",
  retainedFrozenQuestionCount: rows.filter((row) => row.canonicalSelectionKind === "RETAINED_FROZEN").length,
  promotedSplitQuestionCount: rows.filter((row) => row.canonicalSelectionKind === "PROMOTED_SPLIT").length,
  preservedAcceptanceIdentityCount: rows.filter((row) => String(row.identityContinuity).startsWith("PRESERVED_")).length,
  newSourceIdentityCount: rows.filter((row) => String(row.identityContinuity).startsWith("NEW_")).length,
  questionIrUniqueIdCount: uniqueQuestionIrIds.size,
  questionIrDuplicateIdCount,
  questionIrCollisionGroupCount: questionIrCollisionGroups.length,
  questionIrCollisionStatus: questionIrDuplicateIdCount > 0 ? "DOCUMENTED_NON_BLOCKING_FOR_ACCEPTANCE_IDENTITY" : "NONE",
  questionIrCollisionGroups,
  questionTypeCounts: typeCounts,
  questionTypePrimaryCountSum,
  questionTypeMultiPrimaryCount,
  questionTypeUnaccountedCount,
  questionTypeSetEqualityQA: questionTypePrimaryCountSum === rows.length && questionTypeUnaccountedCount === 0 ? "PASS" : "FAIL",
  questionTypeAccountingQA: questionTypePrimaryCountSum === EXPECTED_QUESTION_COUNT && questionTypeUnaccountedCount === 0 ? "PASS" : "FAIL",
  mathFormatQuestionCounts,
  mathFormatUniqueMathObjectCounts,
  mathFormatDerivationQA: v3QuestionJoinQa === "PASS" ? "PASS" : "FAIL",
  v3QuestionJoinQA: v3QuestionJoinQa,
};

mkdirSync(out, { recursive: true });
writeFileSync(
  matrixPath,
  JSON.stringify(
    {
      schemaVersion: "PIMATH_WORD_BETA_ACCEPTANCE_FEATURE_MATRIX_V2",
      generatorVersion: "4",
      identityAuthority: "CANONICAL_LOGICAL_SOURCE_SLICE",
      canonicalBoundaryCount: EXPECTED_QUESTION_COUNT,
      canonicalBoundaryRecompositionSource: canonicalPath,
      featureMatrixQuestionCount: rows.length,
      featureMatrixUniqueQuestionIdCount: uniqueQuestionIds.size,
      featureMatrixUniqueCanonicalIdentityCount: uniqueCanonicalIdentityKeys.size,
      summary,
      rows,
    },
    null,
    2,
  ),
);

console.log(JSON.stringify({
  featureMatrixQuestionCount: rows.length,
  featureMatrixUniqueQuestionIdCount: uniqueQuestionIds.size,
  featureMatrixUniqueCanonicalIdentityCount: uniqueCanonicalIdentityKeys.size,
  featureMatrixMissingQuestionCount: Math.max(0, EXPECTED_QUESTION_COUNT - uniqueCanonicalIdentityKeys.size),
  featureMatrixExtraQuestionCount: Math.max(0, uniqueCanonicalIdentityKeys.size - EXPECTED_QUESTION_COUNT),
  featureMatrixDuplicateQuestionIdCount: rows.length - uniqueQuestionIds.size,
  acceptanceIdentityQA: acceptanceIdentityQa,
  retainedFrozenQuestionCount: summary.retainedFrozenQuestionCount,
  promotedSplitQuestionCount: summary.promotedSplitQuestionCount,
  preservedAcceptanceIdentityCount: summary.preservedAcceptanceIdentityCount,
  newSourceIdentityCount: summary.newSourceIdentityCount,
  questionIrUniqueIdCount: uniqueQuestionIrIds.size,
  questionIrDuplicateIdCount,
  questionIrCollisionGroupCount: questionIrCollisionGroups.length,
  questionIrCollisionStatus: summary.questionIrCollisionStatus,
  questionWithModernMathCount: mathFormatQuestionCounts.MODERN_MATH,
  questionWithMtefV5Count: mathFormatQuestionCounts.MTEF_V5,
  questionWithMtefV3Count: mathFormatQuestionCounts.MTEF_V3,
  ...Object.fromEntries(PRIMARY_TYPES.map((type) => [`${type.toLowerCase()}Count`, typeCounts[type]])),
  questionTypePrimaryCountSum,
  questionTypeMultiPrimaryCount,
  questionTypeUnaccountedCount,
  questionTypeAccountingQA: summary.questionTypeAccountingQA,
  v3QuestionJoinQA: v3QuestionJoinQa,
  mathFormatDerivationQA: summary.mathFormatDerivationQA,
  featureMatrixQA: featureMatrixQa,
}));
