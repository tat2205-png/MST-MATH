import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { ingestDocx } from "../src/modules/document-engine/docx/ingestion.js";
import type { DocumentIR } from "../src/modules/document-engine/document-ir.js";
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
const INDEX_PATH = `${ROOT}/round-2-review-index.json`;
const MATRIX_PATH = `${ROOT}/acceptance-feature-matrix.json`;
const HUMAN_INDEX_PATH = `${ROOT}/HUMAN_REVIEW_INDEX.md`;
const CORPUS_ROOT = process.env.PIMATH_WORD_REAL_CORPUS ?? join(homedir(), "PiMath-Acceptance", "word-real");
const EXPECTED_CASE_COUNT = 40;

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8"));
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const qcandidateId = (document: DocumentIR, index: number) => `${document.sourceHash.slice(0, 12)}-qcandidate-${index + 1}`;
const caseNumber = (id: string) => Number(id.replace(/^R2-/, ""));

type Located = { question: QuestionIR; document: DocumentIR; sourceDocument: string };
type MatrixRow = {
  questionId: string;
  questionType: string;
  mathFormats: string[];
  mathRoles: string[];
  mathObjectIds: string[];
  assetIds: string[];
  riskTags: string[];
};

function locateQuestions(ids: Set<string>): Map<string, Located> {
  const found = new Map<string, Located>();
  const files = readdirSync(CORPUS_ROOT)
    .filter((name) => name.endsWith(".docx") && !name.startsWith("~$"))
    .sort();

  for (const file of files) {
    const result = ingestDocx({ name: file, bytes: new Uint8Array(readFileSync(join(CORPUS_ROOT, file))) });
    const document = result.document;
    if (!document) throw new Error(`MISSING_DOCUMENT_IR:${file}`);

    for (const [index, question] of segmentCanonicalQuestions(document).entries()) {
      const id = qcandidateId(document, index);
      if (!ids.has(id)) continue;
      if (found.has(id)) throw new Error(`DUPLICATE_ACCEPTANCE_ID:${id}`);
      found.set(id, { question, document, sourceDocument: file });
    }
  }
  return found;
}

function readableMarkdown(
  reviewCaseId: string,
  row: MatrixRow,
  located: Located,
  sourceText: string,
  currentMarkdown: string,
  answerText: string,
  solutionText: string,
): string {
  const { question, sourceDocument } = located;
  return [
    `# Review Case ${reviewCaseId}`,
    "",
    `- **Question ID:** ${row.questionId}`,
    `- **QuestionIR ID:** ${question.id}`,
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
    `- **Math formats:** ${row.mathFormats.join(", ") || "None"}`,
    `- **Math roles:** ${row.mathRoles.join(", ") || "None"}`,
    `- **Math object count:** ${row.mathObjectIds.length}`,
    `- **Asset count:** ${row.assetIds.length}`,
    row.mathObjectIds.length ? `- **Math objects:** ${row.mathObjectIds.join(", ")}` : "- **Math objects:** None",
    row.assetIds.length ? `- **Assets:** ${row.assetIds.join(", ")}` : "- **Assets:** None",
    "",
    "## E. Human Review",
    "",
    "Compare **A** with **B**, then check Answer/Solution and the original DOCX when needed.",
    "",
    "Decision:",
    "- [ ] ACCEPT",
    "- [ ] MINOR_NON_BLOCKING",
    "- [ ] BLOCKING",
    "- [ ] NEEDS_SOURCE_CHECK",
    "",
    "Record the final decision in [`HUMAN_DECISIONS.md`](../../HUMAN_DECISIONS.md).",
    "",
    "Comment:",
    "",
    "Blocking defect category:",
    "",
  ].join("\n");
}

const index = readJson<any>(INDEX_PATH);
const matrix = readJson<any>(MATRIX_PATH);
if (index.caseCount !== EXPECTED_CASE_COUNT || !Array.isArray(index.cases) || index.cases.length !== EXPECTED_CASE_COUNT) {
  throw new Error("REVIEW_INDEX_NOT_40");
}
if (matrix.featureMatrixQuestionCount !== 668 || matrix.featureMatrixUniqueQuestionIdCount !== 668) {
  throw new Error("FEATURE_MATRIX_NOT_668");
}

const rowsById = new Map<string, MatrixRow>(matrix.rows.map((row: MatrixRow) => [row.questionId, row]));
const ids = new Set<string>(index.cases.map((entry: any) => String(entry.questionId)));
const located = locateQuestions(ids);
if (located.size !== EXPECTED_CASE_COUNT) {
  const missing = [...ids].filter((id) => !located.has(id));
  throw new Error(`LOCAL_SOURCE_JOIN_MISSING:${located.size}:MISSING:${missing.join(",")}`);
}

let sourceVisibleCount = 0;
let currentVisibleCount = 0;
let needsSourceCheckCount = 0;

for (const entry of index.cases) {
  const questionId = String(entry.questionId);
  const reviewCaseId = String(entry.reviewCaseId);
  const row = rowsById.get(questionId);
  const hit = located.get(questionId);
  if (!row || !hit) throw new Error(`REVIEW_JOIN_FAILED:${reviewCaseId}:${questionId}`);

  const sourceText = renderSourceReconstruction(hit.document, hit.question);
  const currentText = renderQuestionText(hit.question);
  const currentMarkdown = renderQuestionMarkdown(hit.question);
  const answerText = renderAnswer(hit.question);
  const solutionText = renderSolution(hit.question);
  if (sourceText) sourceVisibleCount++;
  if (currentText) currentVisibleCount++;
  const readabilityStatus = sourceText || currentText ? "PASS" : "NEEDS_SOURCE_CHECK";
  if (readabilityStatus !== "PASS") needsSourceCheckCount++;

  const base = `${ROOT}/cases/${reviewCaseId}`;
  const oldReview = readJson<any>(`${base}/review.json`);
  const review = {
    ...oldReview,
    schemaVersion: "PIMATH_WORD_BETA_HUMAN_REVIEW_CASE_V3",
    reviewReadabilityStatus: readabilityStatus,
    sourceRepresentation: {
      ...oldReview.sourceRepresentation,
      text: sourceText,
    },
    finalRepresentation: {
      ...oldReview.finalRepresentation,
      text: currentText,
      answer: answerText,
      solution: solutionText,
    },
  };
  const jsonText = JSON.stringify(review, null, 2) + "\n";
  const md = readableMarkdown(reviewCaseId, row, hit, sourceText, currentMarkdown, answerText, solutionText);
  writeFileSync(`${base}/review.json`, jsonText);
  writeFileSync(`${base}/review.md`, md);
  entry.reviewArtifactHash = sha256(jsonText + md);
  entry.reviewReadabilityStatus = readabilityStatus;
}

index.schemaVersion = "PIMATH_WORD_BETA_HUMAN_REVIEW_PACK_V3";
index.reviewRenderer = "PIMATH_WORD_BETA_HUMAN_READABLE_RENDERER_V1";
index.sourceVisibleCaseCount = sourceVisibleCount;
index.currentVisibleCaseCount = currentVisibleCount;
index.needsSourceCheckForReadabilityCount = needsSourceCheckCount;
index.humanReviewReadabilityQA = needsSourceCheckCount === 0 ? "PASS" : "PARTIAL";
writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + "\n");

const sortedCases = [...index.cases].sort((a: any, b: any) => caseNumber(a.reviewCaseId) - caseNumber(b.reviewCaseId));
const humanIndex = [
  "# PiMath Word Beta — Final Human Review Index",
  "",
  `Final review cases: ${EXPECTED_CASE_COUNT}`,
  "Risk coverage: PASS",
  `Human review readability: ${index.humanReviewReadabilityQA}`,
  "Human decisions: PENDING",
  "",
  "| # | Review Case | Question ID | Type | Source | Risk tags | Readability | Review |",
  "|---:|---|---|---|---|---|---|---|",
  ...sortedCases.map((entry: any, i: number) =>
    `| ${i + 1} | ${entry.reviewCaseId} | ${entry.questionId} | ${entry.questionType} | ${String(entry.sourceDocument).replaceAll("|", "\\|")} | ${String((entry.coverageTags ?? []).join(", ")).replaceAll("|", "\\|")} | ${entry.reviewReadabilityStatus} | [open](${entry.relativeReviewPath}/review.md) |`,
  ),
  "",
].join("\n");
writeFileSync(HUMAN_INDEX_PATH, humanIndex);

console.log(JSON.stringify({
  finalReviewCaseCount: index.cases.length,
  sourceVisibleCaseCount,
  currentVisibleCaseCount,
  needsSourceCheckForReadabilityCount: needsSourceCheckCount,
  humanReviewReadabilityQA: index.humanReviewReadabilityQA,
  renderer: index.reviewRenderer,
}));
