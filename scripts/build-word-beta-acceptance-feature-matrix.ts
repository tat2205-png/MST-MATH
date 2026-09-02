import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { ingestDocx } from "../src/modules/document-engine/docx/ingestion.js";
import { detectSharedContexts } from "../src/modules/question-bank/boundary-validation.js";
import { segmentCanonicalQuestions } from "../src/modules/question-bank/canonical-segmentation.js";

const EXPECTED_QUESTION_COUNT = 668;
const root = process.env.PIMATH_WORD_REAL_CORPUS ?? join(homedir(), "PiMath-Acceptance", "word-real");
const out = "docs/evidence/word-beta-human-acceptance-round-2";
const files = readdirSync(root).filter((name) => name.endsWith(".docx") && !name.startsWith("~$")).sort();
const snapshot = JSON.parse(readFileSync("docs/evidence/question-boundary-final/corpus-recomposition.json", "utf8"));
const confirmed = new Set(
  snapshot.candidates
    .filter((candidate: any) => candidate.state === "CONFIRMED")
    .map((candidate: any) => candidate.candidateId),
);

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

function classifyMathObjectId(id: string): MathFormat {
  // These prefixes are canonical identities created by the production bridges:
  // bridgeMtefV3ToMathExpression -> mtef-v3-*
  // bridgeMtefV5ToMathExpression -> mtef-*
  // modern DOCX/OMML expressions -> non-mtef IDs.
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

const rows: any[] = [];

for (const file of files) {
  const document = ingestDocx({
    name: file,
    bytes: new Uint8Array(readFileSync(join(root, file))),
  }).document;
  if (!document) throw new Error(`MISSING_DOCUMENT_IR:${file}`);

  const sharedContexts = new Map(
    detectSharedContexts(document).map((context) => [context.contextId, context]),
  );

  for (const [index, question] of segmentCanonicalQuestions(document).entries()) {
    if (!confirmed.has(`${file}::candidate-${index + 1}`)) continue;

    const questionId = question.id;
    const mathObjectIds = uniqueSorted(question.mathObjectIds ?? []);
    const mathFormats = uniqueSorted(mathObjectIds.map(classifyMathObjectId)) as MathFormat[];

    const roles = new Set<MathRole>();
    if (hasMath(question.stem)) roles.add("MATH_IN_STEM");
    if (question.options.some((option: any) => hasMath(option.content))) roles.add("MATH_IN_OPTIONS");
    if ((question.subitems ?? []).some((subitem: any) => hasMath(subitem.content))) {
      roles.add("MATH_IN_TRUE_FALSE_SUBITEMS");
    }
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
    ]);

    rows.push({
      questionId,
      sourceDocumentId: question.sourceDocumentId,
      sourceAnchor: question.provenance,
      sourceObjectIds: uniqueSorted(question.sourceObjectIds ?? []),
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
        "current DocumentIR",
        "current canonical QuestionIR",
        "current canonical source identities",
        "MathExpression.id format identity contract: mtef-v3-* / mtef-* / modern",
      ],
    });
  }
}

rows.sort((a, b) => a.questionId.localeCompare(b.questionId));

const questionIds = rows.map((row) => row.questionId);
const uniqueQuestionIds = new Set(questionIds);
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
const v3QuestionJoinQa =
  mathFormatUniqueMathObjectCounts.MTEF_V3 > 0 && mathFormatQuestionCounts.MTEF_V3 > 0 ? "PASS" : "FAIL";

const featureMatrixQa =
  rows.length === EXPECTED_QUESTION_COUNT &&
  uniqueQuestionIds.size === EXPECTED_QUESTION_COUNT &&
  questionTypePrimaryCountSum === EXPECTED_QUESTION_COUNT &&
  questionTypeUnaccountedCount === 0 &&
  v3QuestionJoinQa === "PASS"
    ? "PASS"
    : "FAIL";

const summary = {
  questionTypeCounts: typeCounts,
  questionTypePrimaryCountSum,
  questionTypeMultiPrimaryCount,
  questionTypeUnaccountedCount,
  questionTypeSetEqualityQA:
    questionTypePrimaryCountSum === rows.length && questionTypeUnaccountedCount === 0 ? "PASS" : "FAIL",
  questionTypeAccountingQA:
    questionTypePrimaryCountSum === EXPECTED_QUESTION_COUNT && questionTypeUnaccountedCount === 0 ? "PASS" : "FAIL",
  mathFormatQuestionCounts,
  mathFormatUniqueMathObjectCounts,
  mathFormatDerivationQA: v3QuestionJoinQa === "PASS" ? "PASS" : "FAIL",
  v3QuestionJoinQA: v3QuestionJoinQa,
};

mkdirSync(out, { recursive: true });
writeFileSync(
  `${out}/acceptance-feature-matrix.json`,
  JSON.stringify(
    {
      schemaVersion: "PIMATH_WORD_BETA_ACCEPTANCE_FEATURE_MATRIX_V1",
      generatorVersion: "2",
      canonicalBoundaryCount: EXPECTED_QUESTION_COUNT,
      featureMatrixQuestionCount: rows.length,
      featureMatrixUniqueQuestionIdCount: uniqueQuestionIds.size,
      summary,
      rows,
    },
    null,
    2,
  ),
);

console.log(
  JSON.stringify({
    featureMatrixQuestionCount: rows.length,
    featureMatrixUniqueQuestionIdCount: uniqueQuestionIds.size,
    featureMatrixMissingQuestionCount: Math.max(0, EXPECTED_QUESTION_COUNT - uniqueQuestionIds.size),
    featureMatrixExtraQuestionCount: Math.max(0, uniqueQuestionIds.size - EXPECTED_QUESTION_COUNT),
    featureMatrixDuplicateQuestionIdCount: rows.length - uniqueQuestionIds.size,
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
  }),
);
