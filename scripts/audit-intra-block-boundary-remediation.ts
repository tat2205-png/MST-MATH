import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { ingestDocx } from "../src/modules/document-engine/docx/ingestion.js";
import type { ContentBlock } from "../src/modules/document-engine/document-ir.js";
import { segmentQuestions } from "../src/modules/question-bank/segmentation.js";

const CORPUS_ROOT = process.env.PIMATH_WORD_REAL_CORPUS ?? join(homedir(), "PiMath-Acceptance", "word-real");
const SNAPSHOT_PATH = "docs/evidence/question-boundary-final/corpus-recomposition.json";
const OUT = "docs/evidence/word-beta-human-acceptance-round-2/intra-block-boundary-remediation-impact.json";
const markerPattern = /\b(?:Câu|Bài|Question)\s*(\d+)\s*[:.)]/giu;

function markerNumbers(blocks: ContentBlock[]): number[] {
  const numbers: number[] = [];
  for (const block of blocks) {
    if (block.type === "text") {
      for (const match of block.value.matchAll(markerPattern)) numbers.push(Number(match[1]));
    } else if (block.type === "table") {
      for (const cell of block.cells.flat()) numbers.push(...markerNumbers([cell]));
    }
  }
  return numbers;
}

function preview(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === "text") return block.value;
      if (block.type === "math") return `[MATH:${block.math.id ?? block.math.sourceType}]`;
      if (block.type === "figure") return `[FIGURE:${block.figureId}]`;
      return block.cells.flat().map((cell) => preview([cell])).join(" | ");
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));

// Canonical confirmed count and historical raw segmentation count are different
// populations. Never subtract current raw candidates from confirmed candidates.
const baselineConfirmedByFile = new Map<string, number>();
for (const entry of snapshot.candidates ?? []) {
  if (entry.state !== "CONFIRMED") continue;
  const candidateId = String(entry.candidateId ?? "");
  const split = candidateId.lastIndexOf("::candidate-");
  if (split < 0) continue;
  const file = candidateId.slice(0, split);
  baselineConfirmedByFile.set(file, (baselineConfirmedByFile.get(file) ?? 0) + 1);
}

const baselineRawByFile = new Map<string, number>();
for (const entry of snapshot.documents ?? []) {
  const file = String(entry.file ?? "");
  const candidateCount = Number(entry.candidateCount);
  if (file && Number.isFinite(candidateCount)) baselineRawByFile.set(file, candidateCount);
}

const files = readdirSync(CORPUS_ROOT)
  .filter((name) => name.endsWith(".docx") && !name.startsWith("~$"))
  .sort();

const perDocument: any[] = [];
const multiMarkerCandidates: any[] = [];
let segmentedCandidateCount = 0;
let embeddedSplitGroupFound = false;
let nkTestApp: any = null;

for (const file of files) {
  const result = ingestDocx({ name: file, bytes: new Uint8Array(readFileSync(join(CORPUS_ROOT, file))) });
  const document = result.document;
  if (!document) throw new Error(`DOCUMENT_IR_NOT_CREATED:${file}`);

  const candidates = segmentQuestions(document);
  segmentedCandidateCount += candidates.length;

  const sourceObjectOwners = new Map<string, Array<{ ordinal: number; questionIndex: number | null }>>();
  candidates.forEach((candidate, index) => {
    const numbers = [...new Set(markerNumbers(candidate.textBlocks))];
    if (numbers.length > 1) {
      multiMarkerCandidates.push({
        sourceDocument: file,
        candidateOrdinal: index + 1,
        candidateId: candidate.id,
        markerNumbers: numbers,
        questionIndex: candidate.questionIndex ?? null,
        sourceObjectIds: [...new Set(candidate.rawBlocks.map((block) => block.id))],
        sourceBlockKinds: [...new Set(candidate.rawBlocks.map((block) => block.kind))],
        sourceLocations: [...new Set(candidate.rawBlocks.map((block) => block.sourceLocation))],
        preview: preview(candidate.textBlocks).slice(0, 1800),
      });
    }

    for (const sourceObjectId of new Set(candidate.rawBlocks.map((block) => block.id))) {
      const owners = sourceObjectOwners.get(sourceObjectId) ?? [];
      owners.push({ ordinal: index + 1, questionIndex: candidate.questionIndex ?? null });
      sourceObjectOwners.set(sourceObjectId, owners);
    }
  });

  const sharedPhysicalSourceGroups = [...sourceObjectOwners.entries()]
    .filter(([, owners]) => owners.length > 1)
    .map(([sourceObjectId, owners]) => ({ sourceObjectId, owners }));

  const sixQuestionGroup = sharedPhysicalSourceGroups.find((group) => {
    const indexes = [...new Set(group.owners.map((owner) => owner.questionIndex).filter((value): value is number => value !== null))].sort((a, b) => a - b);
    return [1, 2, 3, 4, 5, 6].every((number) => indexes.includes(number));
  });

  const historicalRawCount = baselineRawByFile.get(file) ?? null;
  const confirmedCount = baselineConfirmedByFile.get(file) ?? 0;

  if (file === "NK TEST APP.docx") {
    embeddedSplitGroupFound = Boolean(sixQuestionGroup);
    nkTestApp = {
      sourceHash: document.sourceHash,
      candidateCount: candidates.length,
      historicalRawCandidateCount: historicalRawCount,
      rawDeltaVsHistoricalSegmentation: historicalRawCount === null ? null : candidates.length - historicalRawCount,
      baselineConfirmedCount: confirmedCount,
      embeddedSplitGroupFound,
      embeddedSplitGroup: sixQuestionGroup ?? null,
      tailCandidates: candidates.slice(-12).map((candidate, offset) => ({
        ordinal: candidates.length - Math.min(12, candidates.length) + offset + 1,
        candidateId: candidate.id,
        questionIndex: candidate.questionIndex ?? null,
        questionTypeCandidate: candidate.questionTypeCandidate,
        sourceObjectIds: [...new Set(candidate.rawBlocks.map((block) => block.id))],
        sourceBlockKinds: [...new Set(candidate.rawBlocks.map((block) => block.kind))],
        markerNumbers: [...new Set(markerNumbers(candidate.textBlocks))],
        preview: preview(candidate.textBlocks).slice(0, 900),
      })),
    };
  }

  perDocument.push({
    sourceDocument: file,
    sourceHash: document.sourceHash,
    historicalRawCandidateCount: historicalRawCount,
    segmentedCandidateCount: candidates.length,
    rawDeltaVsHistoricalSegmentation: historicalRawCount === null ? null : candidates.length - historicalRawCount,
    baselineConfirmedCount: confirmedCount,
    sharedPhysicalSourceGroupCount: sharedPhysicalSourceGroups.length,
  });
}

const baselineConfirmedCount = [...baselineConfirmedByFile.values()].reduce((sum, value) => sum + value, 0);
const historicalRawCandidateCount = [...baselineRawByFile.values()].reduce((sum, value) => sum + value, 0);
const candidateWithMultipleExplicitQuestionMarkersCount = multiMarkerCandidates.length;
const qa =
  candidateWithMultipleExplicitQuestionMarkersCount === 0 &&
  Boolean(nkTestApp) &&
  embeddedSplitGroupFound
    ? "PASS"
    : "FAIL";

const evidence = {
  schemaVersion: "PIMATH_INTRA_BLOCK_BOUNDARY_REMEDIATION_IMPACT_V2",
  corpusFileCount: files.length,
  historicalRawCandidateCount,
  segmentedCandidateCount,
  measuredRawCandidateDeltaVsHistoricalSegmentation: segmentedCandidateCount - historicalRawCandidateCount,
  baselineConfirmedCount,
  candidateWithMultipleExplicitQuestionMarkersCount,
  multiMarkerCandidates,
  nkTestApp,
  perDocument,
  noMultiQuestionCandidateQA: candidateWithMultipleExplicitQuestionMarkersCount === 0 ? "PASS" : "FAIL",
  r236EmbeddedSplitQA: embeddedSplitGroupFound ? "PASS" : "FAIL",
  boundaryRemediationImpactQA: qa,
  note: "Historical raw segmentation and canonical confirmed boundary counts are reported separately. Canonical count must be recomposed after source-backed remediation; it is not inferred from raw candidate delta.",
};

writeFileSync(OUT, JSON.stringify(evidence, null, 2) + "\n");
console.log(JSON.stringify({
  corpusFileCount: files.length,
  historicalRawCandidateCount,
  segmentedCandidateCount,
  measuredRawCandidateDeltaVsHistoricalSegmentation: segmentedCandidateCount - historicalRawCandidateCount,
  baselineConfirmedCount,
  candidateWithMultipleExplicitQuestionMarkersCount,
  multiMarkerCandidates,
  nkTestAppCandidateCount: nkTestApp?.candidateCount ?? null,
  nkTestAppHistoricalRawCandidateCount: nkTestApp?.historicalRawCandidateCount ?? null,
  nkTestAppRawDeltaVsHistoricalSegmentation: nkTestApp?.rawDeltaVsHistoricalSegmentation ?? null,
  r236EmbeddedSplitQA: evidence.r236EmbeddedSplitQA,
  noMultiQuestionCandidateQA: evidence.noMultiQuestionCandidateQA,
  boundaryRemediationImpactQA: evidence.boundaryRemediationImpactQA,
  evidencePath: OUT,
}));
