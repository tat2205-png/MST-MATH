import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const ROOT = "docs/evidence/word-beta-human-acceptance-round-2";
const MATRIX_PATH = `${ROOT}/acceptance-feature-matrix.json`;
const REVIEW_INDEX_PATH = `${ROOT}/round-2-review-index.json`;
const ROUND1_PATH = `${ROOT}/round1-successor-map.json`;
const OUTPUT_PATH = `${ROOT}/final-review-selection.json`;
const COVERAGE_PATH = `${ROOT}/risk-coverage-certification.json`;
const FINAL_COUNT = 40;

type Row = {
  questionId: string;
  questionType: string;
  mathFormats: string[];
  mathRoles: string[];
  assetIds: string[];
  assetCount: number;
  riskTags: string[];
};

type Matrix = {
  featureMatrixQuestionCount: number;
  featureMatrixUniqueQuestionIdCount: number;
  summary?: {
    questionTypeAccountingQA?: string;
    mathFormatDerivationQA?: string;
    v3QuestionJoinQA?: string;
  };
  rows: Row[];
};

type Requirement = { key: string; minimum: number; predicate: (row: Row) => boolean };

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8"));
const uniq = <T>(xs: T[]) => [...new Set(xs)];

function reviewQuestionIds(index: any): string[] {
  const cases = Array.isArray(index?.cases) ? index.cases : [];
  return cases.map((c: any) => String(c.questionId ?? "")).filter(Boolean);
}

function round1MandatoryQuestionIds(raw: any): string[] {
  const arrays: any[][] = [];
  if (Array.isArray(raw)) arrays.push(raw);
  for (const key of ["rows", "cases", "mappings", "successors", "blockingSuccessors"]) {
    if (Array.isArray(raw?.[key])) arrays.push(raw[key]);
  }
  const ids: string[] = [];
  for (const row of arrays.flat()) {
    const decision = String(row?.decision ?? row?.round1Decision ?? row?.previousDecision ?? "").toUpperCase();
    const blocking = row?.blocking === true || decision === "BLOCKING" || String(row?.status ?? "").toUpperCase() === "BLOCKING";
    if (!blocking) continue;
    const id = row?.currentQuestionId ?? row?.successorQuestionId ?? row?.questionId;
    if (id) ids.push(String(id));
  }
  return uniq(ids).sort();
}

function requirementsFor(rows: Row[]): Requirement[] {
  const reqs: Requirement[] = [];
  const count = (predicate: (row: Row) => boolean) => rows.filter(predicate).length;
  const format = (name: string) => (row: Row) => row.mathFormats.includes(name);
  for (const name of ["MTEF_V3", "MTEF_V5", "MODERN_MATH"]) {
    const available = count(format(name));
    if (available > 0) reqs.push({ key: `FORMAT:${name}`, minimum: Math.min(5, available), predicate: format(name) });
  }
  for (const role of [
    "MATH_IN_OPTIONS",
    "MATH_IN_TRUE_FALSE_SUBITEMS",
    "MATH_IN_SHORT_ANSWER",
    "MATH_IN_ANSWER",
    "MATH_IN_SOLUTION",
    "SHARED_CONTEXT_MATH",
  ]) {
    const predicate = (row: Row) => row.mathRoles.includes(role);
    if (count(predicate) > 0) reqs.push({ key: `ROLE:${role}`, minimum: 1, predicate });
  }
  for (const tag of ["ASSET_BEARING", "MULTI_ASSET"]) {
    const predicate = (row: Row) => row.riskTags.includes(tag);
    if (count(predicate) > 0) reqs.push({ key: `TAG:${tag}`, minimum: 1, predicate });
  }
  for (const questionType of uniq(rows.map((row) => row.questionType)).sort()) {
    reqs.push({ key: `TYPE:${questionType}`, minimum: 1, predicate: (row) => row.questionType === questionType });
  }
  return reqs;
}

function coverage(rows: Row[], reqs: Requirement[]) {
  return Object.fromEntries(reqs.map((req) => {
    const actual = rows.filter(req.predicate).length;
    return [req.key, { minimum: req.minimum, actual, pass: actual >= req.minimum }];
  }));
}

function gapKeys(cov: Record<string, { minimum: number; actual: number; pass: boolean }>) {
  return Object.entries(cov).filter(([, value]) => !value.pass).map(([key]) => key);
}

function contribution(row: Row, reqs: Requirement[], selected: Row[]) {
  const selectedWithout = selected.filter((x) => x.questionId !== row.questionId);
  let essential = 0;
  for (const req of reqs) {
    if (!req.predicate(row)) continue;
    const countWithout = selectedWithout.filter(req.predicate).length;
    if (countWithout < req.minimum) essential++;
  }
  return essential;
}

function riskScore(row: Row) {
  return row.mathFormats.length * 20 + row.mathRoles.length * 10 + Math.min(row.assetCount ?? 0, 5) * 3 + (row.questionType === "UNKNOWN" ? 0 : 2);
}

function selectFinal(matrixRows: Row[], initialIds: string[], mandatoryIds: string[]) {
  const byId = new Map(matrixRows.map((row) => [row.questionId, row]));
  const initial = initialIds.map((id) => byId.get(id)).filter((x): x is Row => Boolean(x));
  if (initial.length !== FINAL_COUNT) throw new Error(`CURRENT_SAMPLE_JOIN_COUNT:${initial.length}:EXPECTED:${FINAL_COUNT}`);

  const reqs = requirementsFor(matrixRows);
  let selected = [...initial];

  for (const id of mandatoryIds) {
    const candidate = byId.get(id);
    if (!candidate) throw new Error(`ROUND1_MANDATORY_QUESTION_NOT_IN_MATRIX:${id}`);
    if (selected.some((row) => row.questionId === id)) continue;
    const removable = selected
      .filter((row) => !mandatoryIds.includes(row.questionId))
      .map((row) => ({ row, essential: contribution(row, reqs, selected), score: riskScore(row) }))
      .sort((a, b) => a.essential - b.essential || a.score - b.score || b.row.questionId.localeCompare(a.row.questionId))[0];
    if (!removable) throw new Error(`NO_REPLACEMENT_SLOT_FOR_MANDATORY:${id}`);
    selected = selected.filter((row) => row.questionId !== removable.row.questionId).concat(candidate);
  }

  let cov = coverage(selected, reqs);
  while (gapKeys(cov).length > 0) {
    const gaps = new Set(gapKeys(cov));
    const candidates = matrixRows
      .filter((row) => !selected.some((x) => x.questionId === row.questionId))
      .map((row) => ({
        row,
        gain: reqs.filter((req) => gaps.has(req.key) && req.predicate(row)).length,
        score: riskScore(row),
      }))
      .filter((x) => x.gain > 0)
      .sort((a, b) => b.gain - a.gain || b.score - a.score || a.row.questionId.localeCompare(b.row.questionId));
    const add = candidates[0]?.row;
    if (!add) throw new Error(`UNSATISFIABLE_COVERAGE_GAPS:${[...gaps].join(",")}`);

    const removable = selected
      .filter((row) => !mandatoryIds.includes(row.questionId))
      .map((row) => ({ row, essential: contribution(row, reqs, selected), score: riskScore(row) }))
      .filter((x) => x.essential === 0)
      .sort((a, b) => a.score - b.score || b.row.questionId.localeCompare(a.row.questionId))[0];
    if (!removable) throw new Error(`NO_REDUNDANT_CASE_AVAILABLE_FOR:${add.questionId}`);
    selected = selected.filter((row) => row.questionId !== removable.row.questionId).concat(add);
    selected.sort((a, b) => a.questionId.localeCompare(b.questionId));
    cov = coverage(selected, reqs);
  }

  if (selected.length !== FINAL_COUNT || new Set(selected.map((x) => x.questionId)).size !== FINAL_COUNT) {
    throw new Error("FINAL_SELECTION_CARDINALITY_INVALID");
  }
  return { selected, requirements: reqs, coverage: cov };
}

const matrix = readJson<Matrix>(MATRIX_PATH);
if (matrix.featureMatrixQuestionCount !== 668 || matrix.featureMatrixUniqueQuestionIdCount !== 668 || matrix.rows.length !== 668) {
  throw new Error("FEATURE_MATRIX_NOT_668_CERTIFIED");
}
if (matrix.summary?.questionTypeAccountingQA !== "PASS" || matrix.summary?.mathFormatDerivationQA !== "PASS" || matrix.summary?.v3QuestionJoinQA !== "PASS") {
  throw new Error("FEATURE_MATRIX_SEMANTIC_QA_NOT_PASS");
}
const reviewIndex = readJson<any>(REVIEW_INDEX_PATH);
const initialIds = reviewQuestionIds(reviewIndex);
const mandatoryRound1Ids = existsSync(ROUND1_PATH) ? round1MandatoryQuestionIds(readJson<any>(ROUND1_PATH)) : [];
const { selected, requirements, coverage: finalCoverage } = selectFinal(matrix.rows, initialIds, mandatoryRound1Ids);
const initialCoverage = coverage(initialIds.map((id) => matrix.rows.find((row) => row.questionId === id)!).filter(Boolean), requirements);
const initialSet = new Set(initialIds);
const finalIds = selected.map((row) => row.questionId);
const added = finalIds.filter((id) => !initialSet.has(id));
const removed = initialIds.filter((id) => !finalIds.includes(id));
const gaps = gapKeys(finalCoverage);
const selectedSet = new Set(finalIds);
const mandatoryMissing = mandatoryRound1Ids.filter((id) => !selectedSet.has(id));

const selection = {
  schemaVersion: "PIMATH_WORD_BETA_FINAL_REVIEW_SELECTION_V1",
  initialReviewCaseCount: initialIds.length,
  finalReviewCaseCount: finalIds.length,
  finalSelectionChanged: added.length > 0,
  replacedReviewCaseCount: added.length,
  initialQuestionIds: initialIds,
  finalQuestionIds: finalIds,
  addedQuestionIds: added,
  removedQuestionIds: removed,
  round1MandatoryQuestionIds: mandatoryRound1Ids,
  round1MandatoryMissingQuestionIds: mandatoryMissing,
};
const certification = {
  schemaVersion: "PIMATH_WORD_BETA_RISK_COVERAGE_CERTIFICATION_V1",
  source: MATRIX_PATH,
  matrixQuestionCount: matrix.rows.length,
  initialCoverage,
  finalCoverage,
  mandatoryCoverageGapCount: gaps.length + mandatoryMissing.length,
  mandatoryCoverageGaps: gaps,
  round1MandatoryGapCount: mandatoryMissing.length,
  coverageDerivationQA: gaps.length === 0 ? "PASS" : "FAIL",
  riskCoverageQA: gaps.length === 0 && mandatoryMissing.length === 0 ? "PASS" : "FAIL",
  archivalRound1EvidenceStatus: existsSync(ROUND1_PATH) ? "CONSUMED_IF_SCHEMA_MATCHED" : "NOT_PRESENT_NON_BLOCKING_FOR_CURRENT_SOURCE_COVERAGE",
};

mkdirSync(ROOT, { recursive: true });
writeFileSync(OUTPUT_PATH, JSON.stringify(selection, null, 2));
writeFileSync(COVERAGE_PATH, JSON.stringify(certification, null, 2));
console.log(JSON.stringify({
  initialReviewCaseCount: initialIds.length,
  finalReviewCaseCount: finalIds.length,
  finalSelectionChanged: selection.finalSelectionChanged,
  replacedReviewCaseCount: added.length,
  mandatoryCoverageGapCount: certification.mandatoryCoverageGapCount,
  coverageDerivationQA: certification.coverageDerivationQA,
  riskCoverageQA: certification.riskCoverageQA,
  addedQuestionIds: added,
  removedQuestionIds: removed,
}));
