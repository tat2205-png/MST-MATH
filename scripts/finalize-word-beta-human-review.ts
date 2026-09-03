import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { ingestDocx } from "../src/modules/document-engine/docx/ingestion.js";
import type { DocumentIR } from "../src/modules/document-engine/document-ir.js";
import { canonicalQuestionIdentityKey } from "../src/modules/question-bank/canonical-boundary-remap.js";
import { segmentCanonicalQuestions } from "../src/modules/question-bank/canonical-segmentation.js";
import type { QuestionIR } from "../src/modules/question-bank/contracts.js";
import {
  renderAnswer,
  renderQuestionMarkdown,
  renderQuestionText,
  renderSolution,
  renderSourceReconstruction,
} from "./render-word-beta-human-review.js";

const ROOT = "docs/evidence/word-beta-human-acceptance-round-2";
const MATRIX_PATH = `${ROOT}/acceptance-feature-matrix.json`;
const SELECTION_PATH = `${ROOT}/final-review-selection.json`;
const COVERAGE_PATH = `${ROOT}/risk-coverage-certification.json`;
const REVIEW_INDEX_PATH = `${ROOT}/round-2-review-index.json`;
const HUMAN_INDEX_PATH = `${ROOT}/HUMAN_REVIEW_INDEX.md`;
const HUMAN_DECISIONS_PATH = `${ROOT}/HUMAN_DECISIONS.md`;
const CORPUS_ROOT = process.env.PIMATH_WORD_REAL_CORPUS ?? join(homedir(), "PiMath-Acceptance", "word-real");
const FINAL_COUNT = 40;

type MatrixRow = {
  questionId: string;
  questionIrId?: string;
  canonicalIdentityKey: string;
  canonicalSelectionKind: "RETAINED_FROZEN" | "PROMOTED_SPLIT";
  canonicalFrozenQuestionId?: string | null;
  canonicalParentFrozenQuestionId?: string | null;
  identityContinuity?: string;
  sourceDocumentId: string;
  sourceSliceIds: string[];
  sourceObjectIds: string[];
  questionType: string;
  mathFormats: string[];
  mathRoles: string[];
  mathObjectIds: string[];
  assetIds: string[];
  riskTags: string[];
};

type LocatedQuestion = { question: QuestionIR; document: DocumentIR; sourceDocument: string };

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8"));
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const caseNumber = (id: string) => Number(id.replace(/^R2-/, ""));

function assertNoRecordedHumanDecisions() {
  if (!existsSync(HUMAN_DECISIONS_PATH)) return;
  const text = readFileSync(HUMAN_DECISIONS_PATH, "utf8");
  if (/\|\s*(ACCEPT|MINOR_NON_BLOCKING|BLOCKING|NEEDS_SOURCE_CHECK)\s*\|/m.test(text)) {
    throw new Error("HUMAN_DECISIONS_ALREADY_RECORDED_REFUSING_TO_OVERWRITE");
  }
}

function locateSelectedQuestions(rows: MatrixRow[]): Map<string, LocatedQuestion> {
  const targetByIdentity = new Map(rows.map((row) => [row.canonicalIdentityKey, row.questionId]));
  if (targetByIdentity.size !== rows.length) throw new Error("FINAL_SELECTION_CANONICAL_IDENTITY_COLLISION");
  const located = new Map<string, LocatedQuestion>();
  const files = readdirSync(CORPUS_ROOT).filter((name) => name.endsWith(".docx") && !name.startsWith("~$")).sort();
  for (const file of files) {
    const result = ingestDocx({ name: file, bytes: new Uint8Array(readFileSync(join(CORPUS_ROOT, file))) });
    const document = result.document;
    if (!document) throw new Error(`MISSING_DOCUMENT_IR:${file}`);
    for (const question of segmentCanonicalQuestions(document)) {
      const identity = canonicalQuestionIdentityKey(question);
      const acceptanceId = targetByIdentity.get(identity);
      if (!acceptanceId) continue;
      if (located.has(acceptanceId)) throw new Error(`DUPLICATE_ACCEPTANCE_ID:${acceptanceId}`);
      located.set(acceptanceId, { question, document, sourceDocument: file });
    }
  }
  return located;
}

function readableMarkdown(reviewCaseId: string, row: MatrixRow, located: LocatedQuestion) {
  const { question, document, sourceDocument } = located;
  const sourceText = renderSourceReconstruction(document, question);
  const currentMarkdown = renderQuestionMarkdown(question);
  const answerText = renderAnswer(question);
  const solutionText = renderSolution(question);
  return [
    `# Review Case ${reviewCaseId}`,
    "",
    `- **Question ID:** ${row.questionId}`,
    `- **QuestionIR ID:** ${question.id}`,
    `- **Canonical selection:** ${row.canonicalSelectionKind}`,
    `- **Source document:** ${sourceDocument}`,
    `- **Question type:** ${row.questionType}`,
    `- **Risk tags:** ${row.riskTags.join(", ") || "None"}`,
    "",
    "## A. Source document reconstruction",
    "",
    sourceText || "[NO_VISIBLE_SOURCE_TEXT — open the original DOCX before deciding]",
    "",
    "## B. Current PiMath QuestionIR",
    "",
    currentMarkdown || "[NO_VISIBLE_QUESTION_TEXT — inspect technical evidence and source DOCX]",
    "",
    "## C. Answer / Solution",
    "",
    "### Answer",
    "",
    answerText || "[NO_ANSWER_TEXT]",
    "",
    "### Solution",
    "",
    solutionText || "[NO_SOLUTION_TEXT]",
    "",
    "## D. Technical evidence",
    "",
    `- **Canonical identity:** ${row.canonicalIdentityKey}`,
    `- **Source slice count:** ${row.sourceSliceIds.length}`,
    `- **Math formats:** ${row.mathFormats.join(", ") || "None"}`,
    `- **Math roles:** ${row.mathRoles.join(", ") || "None"}`,
    `- **Math object count:** ${row.mathObjectIds.length}`,
    `- **Asset count:** ${row.assetIds.length}`,
    "",
    "## E. Human Review",
    "",
    "Decision:",
    "- [ ] ACCEPT",
    "- [ ] MINOR_NON_BLOCKING",
    "- [ ] BLOCKING",
    "- [ ] NEEDS_SOURCE_CHECK",
    "",
    "Comment:",
    "",
    "Blocking defect category:",
    "",
  ].join("\n");
}

function artifactFor(reviewCaseId: string, row: MatrixRow, located: LocatedQuestion, baseline: string) {
  const { question, document, sourceDocument } = located;
  const math = (document.mathObjects ?? []).filter((entry) => row.mathObjectIds.includes(entry.mathObjectId));
  const assets = (document.assetObjects ?? []).filter((entry) => row.assetIds.includes(entry.assetId));
  const sourceText = renderSourceReconstruction(document, question);
  const currentText = renderQuestionText(question);
  const answerText = renderAnswer(question);
  const solutionText = renderSolution(question);
  const json = {
    schemaVersion: "PIMATH_WORD_BETA_HUMAN_REVIEW_CASE_V4",
    reviewCaseId,
    questionId: row.questionId,
    questionIrId: question.id,
    technicalBaselineCommit: baseline,
    canonicalSelectionKind: row.canonicalSelectionKind,
    canonicalIdentityKey: row.canonicalIdentityKey,
    identityContinuity: row.identityContinuity ?? null,
    source: {
      documentId: question.sourceDocumentId,
      documentPath: sourceDocument,
      documentHash: document.sourceHash,
      sourceObjectIds: [...question.sourceObjectIds],
      sourceSliceIds: [...(question.sourceSliceIds ?? question.sourceObjectIds)],
      provenance: question.provenance,
    },
    questionType: row.questionType,
    sourceRepresentation: {
      text: sourceText,
      mathObjectIds: [...row.mathObjectIds],
      assetIds: [...row.assetIds],
      math,
      assets,
    },
    finalRepresentation: {
      acceptanceQuestionId: row.questionId,
      questionIrId: question.id,
      packageId: `question-${question.id}`,
      text: currentText,
      answer: answerText,
      solution: solutionText,
      mathObjectIds: [...row.mathObjectIds],
      assetIds: [...row.assetIds],
    },
    automatedQa: question.qaStatus,
    provenanceStatus: question.provenance ? "PASS" : "FAIL",
    coverageTags: [...row.riskTags],
    mathFormats: [...row.mathFormats],
    mathRoles: [...row.mathRoles],
    humanReview: { decision: null, comment: null, blockingDefectCategory: null },
  };
  return { json, md: readableMarkdown(reviewCaseId, row, located) };
}

assertNoRecordedHumanDecisions();
const matrix = readJson<any>(MATRIX_PATH);
const selection = readJson<any>(SELECTION_PATH);
const coverage = readJson<any>(COVERAGE_PATH);
const oldIndex = readJson<any>(REVIEW_INDEX_PATH);

if (
  matrix.featureMatrixQuestionCount !== 668 ||
  matrix.featureMatrixUniqueQuestionIdCount !== 668 ||
  matrix.featureMatrixUniqueCanonicalIdentityCount !== 668 ||
  matrix.summary?.acceptanceIdentityQA !== "PASS" ||
  matrix.summary?.canonicalIdentityAccountingQA !== "PASS" ||
  matrix.summary?.mathFormatDerivationQA !== "PASS"
) throw new Error("FEATURE_MATRIX_NOT_CERTIFIED");
if (
  coverage.mandatoryCoverageGapCount !== 0 ||
  coverage.coverageDerivationQA !== "PASS" ||
  coverage.riskCoverageQA !== "PASS" ||
  coverage.boundaryRemediationSplitCoverageQA !== "PASS"
) throw new Error("RISK_COVERAGE_NOT_CERTIFIED");
if (!Array.isArray(selection.finalQuestionIds) || selection.finalQuestionIds.length !== FINAL_COUNT || new Set(selection.finalQuestionIds).size !== FINAL_COUNT) throw new Error("FINAL_SELECTION_NOT_40_UNIQUE");

const rowsById = new Map<string, MatrixRow>(matrix.rows.map((row: MatrixRow) => [row.questionId, row]));
const finalRows = selection.finalQuestionIds.map((id: string) => rowsById.get(id)).filter((row: MatrixRow | undefined): row is MatrixRow => Boolean(row));
if (finalRows.length !== FINAL_COUNT) throw new Error(`FINAL_MATRIX_ROW_JOIN_FAILED:${finalRows.length}`);
const oldCases = Array.isArray(oldIndex.cases) ? oldIndex.cases : [];
const oldByQuestion = new Map(oldCases.map((entry: any) => [String(entry.questionId), entry]));
const finalSet = new Set<string>(selection.finalQuestionIds);
const retainedIds = selection.finalQuestionIds.filter((id: string) => oldByQuestion.has(id));
const addedIds = selection.finalQuestionIds.filter((id: string) => !oldByQuestion.has(id));
const freedCases = oldCases
  .filter((entry: any) => !finalSet.has(String(entry.questionId)))
  .map((entry: any) => ({ reviewCaseId: String(entry.reviewCaseId), oldQuestionId: String(entry.questionId) }))
  .sort((a: any, b: any) => caseNumber(a.reviewCaseId) - caseNumber(b.reviewCaseId));
if (addedIds.length !== freedCases.length) throw new Error(`REPLACEMENT_CARDINALITY_MISMATCH:${addedIds.length}:${freedCases.length}`);

const assignment = new Map<string, string>();
for (const id of retainedIds) assignment.set(id, String((oldByQuestion.get(id) as any).reviewCaseId));

const staleInitial = new Set<string>(selection.staleInitialQuestionIds ?? []);
const staleFreed = freedCases.filter((entry: any) => staleInitial.has(entry.oldQuestionId));
const regularFreed = freedCases.filter((entry: any) => !staleInitial.has(entry.oldQuestionId));
const promotedAdded = addedIds.filter((id: string) => rowsById.get(id)?.canonicalSelectionKind === "PROMOTED_SPLIT");
const regularAdded = addedIds.filter((id: string) => rowsById.get(id)?.canonicalSelectionKind !== "PROMOTED_SPLIT");
const orderedAdded = [...promotedAdded, ...regularAdded];
const orderedFreed = [...staleFreed, ...regularFreed];
for (let i = 0; i < orderedAdded.length; i++) assignment.set(orderedAdded[i], orderedFreed[i].reviewCaseId);

const located = locateSelectedQuestions(finalRows);
if (located.size !== FINAL_COUNT) {
  const missing = selection.finalQuestionIds.filter((id: string) => !located.has(id));
  throw new Error(`LOCAL_SOURCE_JOIN_MISSING:${located.size}:MISSING:${missing.join(",")}`);
}

const baseline = String(oldIndex.technicalBaselineCommit ?? "b60e672944c966710c7bedb235fb4b822c602da5");
const finalCases: any[] = [];
for (const questionId of selection.finalQuestionIds) {
  const row = rowsById.get(questionId);
  const source = located.get(questionId);
  const reviewCaseId = assignment.get(questionId);
  if (!row || !source || !reviewCaseId) throw new Error(`FINAL_CASE_JOIN_FAILED:${questionId}`);
  const { json, md } = artifactFor(reviewCaseId, row, source, baseline);
  const dir = `${ROOT}/cases/${reviewCaseId}`;
  mkdirSync(dir, { recursive: true });
  const jsonText = JSON.stringify(json, null, 2) + "\n";
  writeFileSync(`${dir}/review.json`, jsonText);
  writeFileSync(`${dir}/review.md`, md);
  finalCases.push({
    reviewCaseId,
    questionId,
    canonicalIdentityKey: row.canonicalIdentityKey,
    canonicalSelectionKind: row.canonicalSelectionKind,
    questionType: row.questionType,
    sourceDocument: source.sourceDocument,
    previousDefectCategory: null,
    coverageTags: [...row.riskTags],
    relativeReviewPath: `cases/${reviewCaseId}`,
    reviewArtifactHash: sha256(jsonText + md),
    humanDecisionStatus: "PENDING",
  });
}
finalCases.sort((a, b) => caseNumber(a.reviewCaseId) - caseNumber(b.reviewCaseId));

const finalIndex = {
  schemaVersion: "PIMATH_WORD_BETA_HUMAN_REVIEW_PACK_V4",
  technicalBaselineCommit: baseline,
  canonicalBoundaryCount: 668,
  identityAuthority: "CANONICAL_LOGICAL_SOURCE_SLICE",
  caseCount: FINAL_COUNT,
  selectionSource: "final-review-selection.json",
  coverageSource: "risk-coverage-certification.json",
  staleInitialQuestionCount: (selection.staleInitialQuestionIds ?? []).length,
  cases: finalCases,
};
writeFileSync(REVIEW_INDEX_PATH, JSON.stringify(finalIndex, null, 2) + "\n");

const humanIndex = [
  "# PiMath Word Beta — Final Human Review Index",
  "",
  `Final review cases: ${FINAL_COUNT}`,
  "Canonical identity: PASS",
  "Risk coverage: PASS",
  "Boundary remediation split coverage: PASS",
  "Human decisions: PENDING",
  "",
  "| # | Review Case | Question ID | Canonical selection | Type | Source | Risk tags | Review |",
  "|---:|---|---|---|---|---|---|---|",
  ...finalCases.map((entry, index) => `| ${index + 1} | ${entry.reviewCaseId} | ${entry.questionId} | ${entry.canonicalSelectionKind} | ${entry.questionType} | ${entry.sourceDocument.replaceAll("|", "\\|")} | ${entry.coverageTags.join(", ").replaceAll("|", "\\|")} | [open](${entry.relativeReviewPath}/review.md) |`),
  "",
].join("\n");
writeFileSync(HUMAN_INDEX_PATH, humanIndex);

const decisions = [
  "# PiMath Word Beta — Human Decisions",
  "",
  "Allowed values: `ACCEPT`, `MINOR_NON_BLOCKING`, `BLOCKING`, `NEEDS_SOURCE_CHECK`.",
  "",
  "| # | Review Case | Question ID | Decision | Comment |",
  "|---:|---|---|---|---|",
  ...finalCases.map((entry, index) => `| ${index + 1} | ${entry.reviewCaseId} | ${entry.questionId} |  |  |`),
  "",
].join("\n");
writeFileSync(HUMAN_DECISIONS_PATH, decisions);

console.log(JSON.stringify({
  finalReviewCaseCount: finalCases.length,
  uniqueReviewCaseIdCount: new Set(finalCases.map((entry) => entry.reviewCaseId)).size,
  uniqueQuestionIdCount: new Set(finalCases.map((entry) => entry.questionId)).size,
  uniqueCanonicalIdentityCount: new Set(finalCases.map((entry) => entry.canonicalIdentityKey)).size,
  staleInitialQuestionCount: (selection.staleInitialQuestionIds ?? []).length,
  promotedSplitReviewCaseCount: finalCases.filter((entry) => entry.canonicalSelectionKind === "PROMOTED_SPLIT").length,
  replacedReviewCaseCount: addedIds.length,
  replacedCaseAssignments: addedIds.map((questionId: string) => ({ questionId, reviewCaseId: assignment.get(questionId), canonicalSelectionKind: rowsById.get(questionId)?.canonicalSelectionKind })),
  humanReviewIndexCreated: true,
  humanDecisionWorksheetCreated: true,
  humanDecisionRecordedCount: 0,
  finalPackMaterializationQA: "PASS",
}));
