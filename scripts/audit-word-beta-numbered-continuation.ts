import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { ingestDocx } from "../src/modules/document-engine/docx/ingestion.js";
import { segmentQuestions } from "../src/modules/question-bank/segmentation.js";
import { segmentCanonicalQuestions } from "../src/modules/question-bank/canonical-segmentation.js";
import {
  findAnswerSolutionAppendixRegions,
  findTerminalEmbeddedReferenceAnswerFooter,
} from "../src/modules/question-bank/source-region-classification.js";

const CORPUS_ROOT = process.env.PIMATH_WORD_REAL_CORPUS ?? join(homedir(), "PiMath-Acceptance", "word-real");
const SOURCE = "NK TEST APP.docx";
const EXPECTED_SOURCE_HASH = "f4d4446aeaf5ba446ff941c91cac75b86cbcdc656606d16dc0f4d52d0bf09fe9";
const EXPECTED_CANDIDATE_COUNT = 40;
const OUT = "docs/evidence/word-beta-human-acceptance-round-2/R2-36-numbered-continuation-audit.json";

const bytes = new Uint8Array(readFileSync(join(CORPUS_ROOT, SOURCE)));
const document = ingestDocx({ name: SOURCE, bytes }).document;
if (!document) throw new Error("DOCUMENT_IR_NOT_CREATED:NK_TEST_APP");

const sourceHashQA = document.sourceHash === EXPECTED_SOURCE_HASH ? "PASS" : "FAIL";
const appendixRegions = findAnswerSolutionAppendixRegions(document);
const referenceAnswerRegions = appendixRegions.filter((region) => region.evidence.includes("REFERENCE_ANSWER_HEADING"));
const embeddedReferenceAnswerFooter = findTerminalEmbeddedReferenceAnswerFooter(document);
const candidates = segmentQuestions(document);
const questions = segmentCanonicalQuestions(document);
if (candidates.length !== questions.length) throw new Error(`SEGMENTATION_QIR_LENGTH_MISMATCH:${candidates.length}:${questions.length}`);

const candidateCountQA = candidates.length === EXPECTED_CANDIDATE_COUNT ? "PASS" : "FAIL";

const textOf = (candidate: (typeof candidates)[number]) => candidate.textBlocks
  .map((block) => block.type === "text" ? block.value : block.type === "math" ? `[MATH:${block.math.id ?? ""}]` : block.type === "figure" ? `[FIGURE:${block.figureId}]` : "")
  .join(" ")
  .replace(/\s+/gu, " ")
  .trim();

const q6Indexes = candidates
  .map((candidate, index) => ({ candidate, question: questions[index], index, text: textOf(candidate) }))
  .filter((row) => row.candidate.questionIndex === 6 && /hai\s+điều\s+kiện\s+sau\s*:/iu.test(row.text));

const q6 = q6Indexes.length === 1 ? q6Indexes[0] : undefined;
const q6SourceObjectIds = q6 ? [...new Set(q6.candidate.rawBlocks.map((block) => block.id))] : [];
const q6SourceSliceIds = q6?.question.sourceSliceIds ?? [];
const q6Text = q6?.text ?? "";

const condition1Present = /cấp\s+số\s+cộng\s+tăng/iu.test(q6Text);
const condition2Present = /bằng\s+tổng\s+của\s+cả\s+ba\s+số/iu.test(q6Text);
const finalRequestPresent = /Tính\s+giá\s+trị\s+của\s+biểu\s+thức/iu.test(q6Text);
const paragraph101Owned = q6SourceObjectIds.includes("paragraph-101");
const paragraph102Owned = q6SourceObjectIds.includes("paragraph-102");
const referenceAnswerContamination = /ĐÁP\s*ÁN\s+THAM\s+KHẢO/iu.test(q6Text);
const aiFooterContamination = /Được\s+thực\s+hiện\s+bởi\s+AI/iu.test(q6Text);
const referenceAnswerRegionFound = referenceAnswerRegions.length >= 1 || Boolean(embeddedReferenceAnswerFooter);
const answerEntryRestartQA = !embeddedReferenceAnswerFooter ||
  embeddedReferenceAnswerFooter.markerNumbersAfterHeading.length === 0 ||
  embeddedReferenceAnswerFooter.markerNumbersAfterHeading[0] === 1
  ? "PASS"
  : "FAIL";

const isolatedContinuationCandidates = candidates
  .map((candidate, index) => ({
    ordinal: index + 1,
    questionIndex: candidate.questionIndex ?? null,
    sourceObjectIds: [...new Set(candidate.rawBlocks.map((block) => block.id))],
    text: textOf(candidate),
  }))
  .filter((row) => row.sourceObjectIds.includes("paragraph-101") || row.sourceObjectIds.includes("paragraph-102"))
  .filter((row) => !q6 || row.ordinal !== q6.index + 1);

const continuationOwnershipQA = Boolean(
  sourceHashQA === "PASS" &&
  candidateCountQA === "PASS" &&
  q6 &&
  condition1Present &&
  condition2Present &&
  finalRequestPresent &&
  paragraph101Owned &&
  paragraph102Owned &&
  isolatedContinuationCandidates.length === 0 &&
  referenceAnswerRegionFound &&
  answerEntryRestartQA === "PASS" &&
  !referenceAnswerContamination &&
  !aiFooterContamination
) ? "PASS" : "FAIL";

const diagnosticContent = (block: (typeof document.blocks)[number]) => block.content.map((content, contentIndex) => ({
  contentIndex,
  type: content.type,
  sourceLocation: content.sourceLocation ?? null,
  value: content.type === "text"
    ? content.value
    : content.type === "math"
      ? `[MATH:${content.math.id ?? ""}]`
      : content.type === "figure"
        ? `[FIGURE:${content.figureId}]`
        : "[TABLE]",
}));

const footerDiagnostics = continuationOwnershipQA === "PASS"
  ? []
  : document.blocks.slice(-12).map((block) => ({
      id: block.id,
      order: block.order,
      kind: block.kind,
      sourceLocation: block.sourceLocation,
      content: diagnosticContent(block),
    }));

const evidence = {
  schemaVersion: "PIMATH_R2_36_NUMBERED_CONTINUATION_AUDIT_V5",
  sourceDocument: SOURCE,
  sourceHash: document.sourceHash,
  expectedSourceHash: EXPECTED_SOURCE_HASH,
  sourceHashQA,
  totalCandidates: candidates.length,
  expectedCandidateCount: EXPECTED_CANDIDATE_COUNT,
  candidateCountQA,
  q6CandidateOrdinal: q6 ? q6.index + 1 : null,
  q6QuestionIrId: q6?.question.id ?? null,
  q6SourceObjectIds,
  q6SourceSliceIds,
  q6Text,
  condition1Present,
  condition2Present,
  finalRequestPresent,
  paragraph101Owned,
  paragraph102Owned,
  referenceAnswerRegionFound,
  referenceAnswerRegions,
  embeddedReferenceAnswerFooter: embeddedReferenceAnswerFooter ?? null,
  answerEntryRestartQA,
  referenceAnswerContamination,
  aiFooterContamination,
  isolatedContinuationCandidateCount: isolatedContinuationCandidates.length,
  isolatedContinuationCandidates,
  continuationOwnershipQA,
  footerDiagnostics,
  diagnosis: continuationOwnershipQA === "PASS"
    ? "QUESTION_SOURCE_SLICE_CONTINUATION_REMEDIATED_WITH_REFERENCE_ANSWER_ISOLATED"
    : "QUESTION_SOURCE_SLICE_CONTINUATION_STILL_BROKEN",
};

writeFileSync(OUT, JSON.stringify(evidence, null, 2) + "\n");
console.log(JSON.stringify({
  sourceHash: evidence.sourceHash,
  sourceHashQA: evidence.sourceHashQA,
  totalCandidates: evidence.totalCandidates,
  expectedCandidateCount: evidence.expectedCandidateCount,
  candidateCountQA: evidence.candidateCountQA,
  q6CandidateOrdinal: evidence.q6CandidateOrdinal,
  q6QuestionIrId: evidence.q6QuestionIrId,
  q6SourceObjectIds: evidence.q6SourceObjectIds,
  q6SourceSliceCount: evidence.q6SourceSliceIds.length,
  condition1Present: evidence.condition1Present,
  condition2Present: evidence.condition2Present,
  finalRequestPresent: evidence.finalRequestPresent,
  paragraph101Owned: evidence.paragraph101Owned,
  paragraph102Owned: evidence.paragraph102Owned,
  referenceAnswerRegionFound: evidence.referenceAnswerRegionFound,
  embeddedReferenceAnswerFooter: evidence.embeddedReferenceAnswerFooter,
  answerEntryRestartQA: evidence.answerEntryRestartQA,
  referenceAnswerContamination: evidence.referenceAnswerContamination,
  aiFooterContamination: evidence.aiFooterContamination,
  isolatedContinuationCandidateCount: evidence.isolatedContinuationCandidateCount,
  continuationOwnershipQA: evidence.continuationOwnershipQA,
  footerDiagnostics: evidence.footerDiagnostics,
  diagnosis: evidence.diagnosis,
  evidencePath: OUT,
}));

if (continuationOwnershipQA !== "PASS") process.exitCode = 1;
