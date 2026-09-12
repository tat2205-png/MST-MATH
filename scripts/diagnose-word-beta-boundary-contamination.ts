import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { ingestDocx } from "../src/modules/document-engine/docx/ingestion.js";
import type { ContentBlock, DocumentBlock } from "../src/modules/document-engine/document-ir.js";
import { segmentQuestions } from "../src/modules/question-bank/segmentation.js";

const CORPUS_ROOT = process.env.PIMATH_WORD_REAL_CORPUS ?? join(homedir(), "PiMath-Acceptance", "word-real");
const SOURCE_QUERY = process.env.PIMATH_DIAG_SOURCE ?? "NK TEST APP.docx";
const TARGET_ORDINAL = Number(process.env.PIMATH_DIAG_CANDIDATE ?? "41");
const OUT = "docs/evidence/word-beta-human-acceptance-round-2/R2-36-boundary-diagnostic.json";

const textOfContent = (content: ContentBlock[]): string =>
  content
    .map((block) => {
      if (block.type === "text") return block.value;
      if (block.type === "math") return `[MATH:${block.math.id ?? block.math.sourceType}]`;
      if (block.type === "figure") return `[FIGURE:${block.figureId}]`;
      return block.cells.flat().map((cell) => textOfContent([cell])).join(" ");
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

const blockText = (block: DocumentBlock) => textOfContent(block.content);
const explicitQuestion = /^(?:(?:Câu|Bài|Question)\s*)?\d+\s*[.:)]\s*/iu;
const answerSolution = /^(?:đáp\s*án|lời\s*giải|hướng\s*dẫn\s*giải|kết\s*quả)\b/iu;
const semanticStem = /^(?:cho|tính|tìm|xác định|chứng minh|giải|hãy|một|trong|tại|người ta|một người|một công ty|một vật|tốc độ|xác suất)\b/iu;
const strongTaskVerb = /\b(?:tính|tìm|giải|chứng minh|xác định|xác suất|kết quả)\b/iu;

const files = readdirSync(CORPUS_ROOT)
  .filter((name) => name.endsWith(".docx") && !name.startsWith("~$"))
  .sort();
const source = files.find((name) => name === SOURCE_QUERY) ?? files.find((name) => name.includes(SOURCE_QUERY));
if (!source) throw new Error(`SOURCE_NOT_FOUND:${SOURCE_QUERY}`);

const result = ingestDocx({
  name: source,
  bytes: new Uint8Array(readFileSync(join(CORPUS_ROOT, source))),
});
if (!result.document) throw new Error(`DOCUMENT_IR_NOT_CREATED:${source}`);
const document = result.document;
const candidates = segmentQuestions(document);
const target = candidates[TARGET_ORDINAL - 1];
if (!target) throw new Error(`TARGET_CANDIDATE_NOT_FOUND:${TARGET_ORDINAL}:TOTAL=${candidates.length}`);

const nearby = candidates
  .map((candidate, i) => ({ candidate, ordinal: i + 1 }))
  .filter(({ ordinal }) => Math.abs(ordinal - TARGET_ORDINAL) <= 2)
  .map(({ candidate, ordinal }) => ({
    ordinal,
    candidateId: candidate.id,
    questionIndex: candidate.questionIndex ?? null,
    questionTypeCandidate: candidate.questionTypeCandidate,
    blockCount: candidate.rawBlocks.length,
    startObjectId: candidate.boundary.startObjectId,
    endObjectId: candidate.boundary.endObjectId,
    startEvidence: candidate.boundary.startEvidence,
    endEvidence: candidate.boundary.endEvidence,
    preview: candidate.rawBlocks.map(blockText).join(" ").slice(0, 500),
  }));

let sawAnswerSolution = false;
const internalSignals = target.rawBlocks.map((block, offset) => {
  const text = blockText(block);
  const marker = explicitQuestion.test(text);
  const answer = answerSolution.test(text);
  const semantic = semanticStem.test(text) && strongTaskVerb.test(text) && text.length >= 12;
  const numbering = Boolean(block.numbering);
  const transitionAfterAnswerSolution = sawAnswerSolution && (marker || numbering || semantic);
  if (answer) sawAnswerSolution = true;
  return {
    offset,
    objectId: block.id,
    order: block.order,
    paragraphIndex: block.paragraphIndex ?? null,
    kind: block.kind,
    numbering: block.numbering ?? null,
    explicitQuestionMarker: marker,
    answerSolutionMarker: answer,
    semanticQuestionLikeStart: semantic,
    transitionAfterAnswerSolution,
    text: text.slice(0, 700),
  };
});

const suspicious = internalSignals.filter(
  (entry, index) => index > 0 && (entry.explicitQuestionMarker || entry.numbering || entry.transitionAfterAnswerSolution),
);
const semanticOnlyAfterAnswer = internalSignals.filter(
  (entry, index) => index > 0 && entry.transitionAfterAnswerSolution && !entry.explicitQuestionMarker && !entry.numbering,
);

const evidence = {
  schemaVersion: "PIMATH_BOUNDARY_CONTAMINATION_DIAGNOSTIC_V1",
  sourceDocument: source,
  sourceHash: document.sourceHash,
  totalCandidates: candidates.length,
  targetOrdinal: TARGET_ORDINAL,
  targetCandidateId: target.id,
  targetQuestionIndex: target.questionIndex ?? null,
  targetQuestionTypeCandidate: target.questionTypeCandidate,
  targetBlockCount: target.rawBlocks.length,
  targetBoundary: target.boundary,
  targetParseWarnings: target.parseWarnings,
  nearby,
  internalSignals,
  suspiciousInternalBoundaryCount: suspicious.length,
  semanticOnlyTransitionAfterAnswerCount: semanticOnlyAfterAnswer.length,
  suspiciousInternalBoundaries: suspicious,
  diagnosis:
    suspicious.length > 0
      ? "BOUNDARY_CONTAMINATION_REPRODUCED"
      : "NO_STRONG_INTERNAL_BOUNDARY_REPRODUCED",
};

writeFileSync(OUT, JSON.stringify(evidence, null, 2) + "\n");
console.log(
  JSON.stringify({
    sourceDocument: source,
    sourceHash: document.sourceHash,
    totalCandidates: candidates.length,
    targetOrdinal: TARGET_ORDINAL,
    targetQuestionTypeCandidate: target.questionTypeCandidate,
    targetBlockCount: target.rawBlocks.length,
    suspiciousInternalBoundaryCount: suspicious.length,
    semanticOnlyTransitionAfterAnswerCount: semanticOnlyAfterAnswer.length,
    diagnosis: evidence.diagnosis,
    evidencePath: OUT,
  }),
);
