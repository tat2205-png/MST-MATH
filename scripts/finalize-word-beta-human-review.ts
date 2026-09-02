import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { ingestDocx } from "../src/modules/document-engine/docx/ingestion.js";
import type { ContentBlock, DocumentIR } from "../src/modules/document-engine/document-ir.js";
import { segmentCanonicalQuestions } from "../src/modules/question-bank/canonical-segmentation.js";
import type { QuestionIR } from "../src/modules/question-bank/contracts.js";

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
  sourceDocumentId: string;
  sourceAnchor?: unknown;
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
const qcandidateId = (document: DocumentIR, index: number) => `${document.sourceHash.slice(0, 12)}-qcandidate-${index + 1}`;

function blockText(block: ContentBlock): string {
  if (block.type === "text") return block.value;
  if (block.type === "math") return `$${block.math.latex ?? block.math.normalized ?? block.math.sourceRaw}$`;
  if (block.type === "figure") return `[FIGURE:${block.figureId}]`;
  return block.cells.map((row) => row.map(blockText).join(" | ")).join(" / ");
}

function blocksText(blocks?: ContentBlock[]): string {
  return (blocks ?? []).map(blockText).join("").trim();
}

function questionText(question: QuestionIR): string {
  const lines: string[] = [];
  const stem = blocksText(question.stem);
  if (stem) lines.push(stem);
  for (const option of question.options ?? []) lines.push(`${option.label}. ${blocksText(option.content)}`);
  for (const item of question.subitems ?? []) lines.push(`${item.label}) ${blocksText(item.content)}`);
  return lines.join("\n").trim();
}

function locateSelectedQuestions(finalIds: Set<string>): Map<string, LocatedQuestion> {
  const located = new Map<string, LocatedQuestion>();
  const files = readdirSync(CORPUS_ROOT).filter((name) => name.endsWith(".docx") && !name.startsWith("~$")).sort();
  for (const file of files) {
    const result = ingestDocx({ name: file, bytes: new Uint8Array(readFileSync(join(CORPUS_ROOT, file))) });
    const document = result.document;
    if (!document) throw new Error(`MISSING_DOCUMENT_IR:${file}`);
    for (const [index, question] of segmentCanonicalQuestions(document).entries()) {
      const acceptanceId = qcandidateId(document, index);
      if (!finalIds.has(acceptanceId)) continue;
      if (located.has(acceptanceId)) throw new Error(`DUPLICATE_ACCEPTANCE_ID:${acceptanceId}`);
      located.set(acceptanceId, { question, document, sourceDocument: file });
    }
  }
  return located;
}

function artifactFor(reviewCaseId: string, row: MatrixRow, located: LocatedQuestion, baseline: string) {
  const { question, document, sourceDocument } = located;
  const math = (document.mathObjects ?? []).filter((entry) => row.mathObjectIds.includes(entry.mathObjectId));
  const assets = (document.assetObjects ?? []).filter((entry) => row.assetIds.includes(entry.assetId));
  const sourceText = questionText(question);
  const answerText = blocksText(question.answer);
  const solutionText = blocksText(question.solution);
  const json = {
    schemaVersion: "PIMATH_WORD_BETA_HUMAN_REVIEW_CASE_V2",
    reviewCaseId,
    questionId: row.questionId,
    questionIrId: question.id,
    technicalBaselineCommit: baseline,
    source: {
      documentId: question.sourceDocumentId,
      documentPath: sourceDocument,
      documentHash: document.sourceHash,
      sourceObjectIds: [...question.sourceObjectIds],
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
      packageId: `question-${row.questionId}`,
      text: sourceText,
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

  const md = `# Review Case ${reviewCaseId}\n\nQuestion ID: ${row.questionId}\nQuestionIR ID: ${question.id}\nSource document: ${sourceDocument}\nQuestion type: ${row.questionType}\nRisk tags: ${row.riskTags.join(", ") || "None"}\n\n## A. Current source-backed question\n\n${sourceText || "[NO_VISIBLE_TEXT]"}\n\n## B. Answer\n\n${answerText || "[NO_ANSWER_TEXT]"}\n\n## C. Solution\n\n${solutionText || "[NO_SOLUTION_TEXT]"}\n\n## D. Math / Assets\n\nMath formats: ${row.mathFormats.join(", ") || "None"}\nMath roles: ${row.mathRoles.join(", ") || "None"}\nMath objects: ${row.mathObjectIds.join(", ") || "None"}\nAssets: ${row.assetIds.join(", ") || "None"}\n\n## E. Human Review\n\nDecision:\n[ ] ACCEPT\n[ ] MINOR_NON_BLOCKING\n[ ] BLOCKING\n[ ] NEEDS_SOURCE_CHECK\n\nComment:\n\nBlocking defect category:\n`;
  return { json, md };
}

const matrix = readJson<any>(MATRIX_PATH);
const selection = readJson<any>(SELECTION_PATH);
const coverage = readJson<any>(COVERAGE_PATH);
const oldIndex = readJson<any>(REVIEW_INDEX_PATH);

if (matrix.featureMatrixQuestionCount !== 668 || matrix.featureMatrixUniqueQuestionIdCount !== 668 || matrix.summary?.acceptanceIdentityQA !== "PASS" || matrix.summary?.mathFormatDerivationQA !== "PASS") throw new Error("FEATURE_MATRIX_NOT_CERTIFIED");
if (coverage.mandatoryCoverageGapCount !== 0 || coverage.coverageDerivationQA !== "PASS" || coverage.riskCoverageQA !== "PASS") throw new Error("RISK_COVERAGE_NOT_CERTIFIED");
if (!Array.isArray(selection.finalQuestionIds) || selection.finalQuestionIds.length !== FINAL_COUNT || new Set(selection.finalQuestionIds).size !== FINAL_COUNT) throw new Error("FINAL_SELECTION_NOT_40_UNIQUE");

const rowsById = new Map<string, MatrixRow>(matrix.rows.map((row: MatrixRow) => [row.questionId, row]));
const oldCases = Array.isArray(oldIndex.cases) ? oldIndex.cases : [];
const oldByQuestion = new Map(oldCases.map((entry: any) => [String(entry.questionId), entry]));
const oldByCase = new Map(oldCases.map((entry: any) => [String(entry.reviewCaseId), entry]));
const finalSet = new Set<string>(selection.finalQuestionIds);
const retainedIds = selection.finalQuestionIds.filter((id: string) => oldByQuestion.has(id));
const addedIds = selection.finalQuestionIds.filter((id: string) => !oldByQuestion.has(id)).sort();
const freedCaseIds = oldCases.filter((entry: any) => !finalSet.has(String(entry.questionId))).map((entry: any) => String(entry.reviewCaseId)).sort((a: string, b: string) => caseNumber(a) - caseNumber(b));
if (addedIds.length !== freedCaseIds.length) throw new Error(`REPLACEMENT_CARDINALITY_MISMATCH:${addedIds.length}:${freedCaseIds.length}`);

const assignment = new Map<string, string>();
for (const id of retainedIds) assignment.set(id, String((oldByQuestion.get(id) as any).reviewCaseId));
for (let i = 0; i < addedIds.length; i++) assignment.set(addedIds[i], freedCaseIds[i]);

const located = locateSelectedQuestions(finalSet);
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
  schemaVersion: "PIMATH_WORD_BETA_HUMAN_REVIEW_PACK_V2",
  technicalBaselineCommit: baseline,
  canonicalBoundaryCount: 668,
  caseCount: FINAL_COUNT,
  selectionSource: "final-review-selection.json",
  coverageSource: "risk-coverage-certification.json",
  cases: finalCases,
};
writeFileSync(REVIEW_INDEX_PATH, JSON.stringify(finalIndex, null, 2) + "\n");

const humanIndex = [
  "# PiMath Word Beta — Final Human Review Index",
  "",
  `Final review cases: ${FINAL_COUNT}`,
  "Risk coverage: PASS",
  "Human decisions: PENDING",
  "",
  "| # | Review Case | Question ID | Type | Source | Risk tags | Review |",
  "|---:|---|---|---|---|---|---|",
  ...finalCases.map((entry, index) => `| ${index + 1} | ${entry.reviewCaseId} | ${entry.questionId} | ${entry.questionType} | ${entry.sourceDocument.replaceAll("|", "\\|")} | ${entry.coverageTags.join(", ").replaceAll("|", "\\|")} | [open](${entry.relativeReviewPath}/review.md) |`),
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
  replacedReviewCaseCount: addedIds.length,
  replacedCaseAssignments: addedIds.map((questionId) => ({ questionId, reviewCaseId: assignment.get(questionId) })),
  humanReviewIndexCreated: true,
  humanDecisionWorksheetCreated: true,
  humanDecisionRecordedCount: 0,
  finalPackMaterializationQA: "PASS",
}));
