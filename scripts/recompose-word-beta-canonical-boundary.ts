import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { ingestDocx } from "../src/modules/document-engine/docx/ingestion.js";
import { segmentCanonicalQuestions } from "../src/modules/question-bank/canonical-segmentation.js";
import { segmentQuestions } from "../src/modules/question-bank/segmentation.js";
import { findAnswerSolutionAppendixRegions } from "../src/modules/question-bank/source-region-classification.js";
import {
  remapCanonicalBoundaries,
  type CurrentBoundaryRecord,
  type FrozenBoundaryAuthorityRow,
} from "../src/modules/question-bank/canonical-boundary-remap.js";

const CORPUS_ROOT = process.env.PIMATH_WORD_REAL_CORPUS ?? join(homedir(), "PiMath-Acceptance", "word-real");
const AUTHORITY_CERTIFICATION_PATH = "docs/evidence/word-beta-final/word-beta-certification.json";
const AUTHORITY_MANIFEST_PATH = "docs/evidence/word-beta-final/package-expected-manifest.json";
const SOURCE_MANIFEST_PATH = "docs/evidence/w10d-real-corpus/manifest.json";
const OUT = "docs/evidence/word-beta-human-acceptance-round-2/canonical-boundary-recomposition.json";
const AUTHORITY_COMMIT = "1741ad4915e50ecba99c5ff5971cd8e6bb20b8ed";
const EXPECTED_AUTHORITY_COUNT = 668;

interface ManifestAuthorityRow {
  questionId: string;
  sourceDocumentId: string;
  sourceObjectIds: string[];
}

const stableJsonHash = (value: unknown): string => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const uniqueInOrder = <T>(values: readonly T[]): T[] => [...new Set(values)];

function loadFrozenAuthorityRows(): ManifestAuthorityRow[] {
  if (existsSync(OUT)) {
    try {
      const prior = JSON.parse(readFileSync(OUT, "utf8"));
      if (
        prior?.authority?.commit === AUTHORITY_COMMIT &&
        Array.isArray(prior?.frozenAuthorityRows) &&
        prior.frozenAuthorityRows.length === EXPECTED_AUTHORITY_COUNT
      ) {
        return prior.frozenAuthorityRows.map((row: any) => ({
          questionId: String(row.questionId),
          sourceDocumentId: String(row.sourceDocumentId),
          sourceObjectIds: [...row.sourceObjectIds],
        }));
      }
    } catch {
      // Fall through to the committed 668 authority on first materialization.
    }
  }

  const certification = JSON.parse(readFileSync(AUTHORITY_CERTIFICATION_PATH, "utf8"));
  if (certification.frozenBoundaryCount !== EXPECTED_AUTHORITY_COUNT) {
    throw new Error(`AUTHORITY_CERTIFICATION_NOT_668:${certification.frozenBoundaryCount}`);
  }
  const rows = JSON.parse(readFileSync(AUTHORITY_MANIFEST_PATH, "utf8"));
  if (!Array.isArray(rows) || rows.length !== EXPECTED_AUTHORITY_COUNT) {
    throw new Error(`AUTHORITY_MANIFEST_NOT_668:${Array.isArray(rows) ? rows.length : "NOT_ARRAY"}`);
  }
  return rows.map((row: any) => ({
    questionId: String(row.questionId),
    sourceDocumentId: String(row.sourceDocumentId),
    sourceObjectIds: [...row.sourceObjectIds],
  }));
}

const manifestAuthority = loadFrozenAuthorityRows();
const files = readdirSync(CORPUS_ROOT)
  .filter(name => name.endsWith(".docx") && !name.startsWith("~$"))
  .sort();
const sourceManifest = JSON.parse(readFileSync(SOURCE_MANIFEST_PATH, "utf8")).files ?? [];

const frozenRows: FrozenBoundaryAuthorityRow[] = [];
const currentRows: CurrentBoundaryRecord[] = [];
const perDocument: any[] = [];
let globalCurrentOrdinal = 0;
let hashMatchCount = 0;

for (const file of files) {
  const bytes = new Uint8Array(readFileSync(join(CORPUS_ROOT, file)));
  const sourceHash = createHash("sha256").update(bytes).digest("hex");
  if (sourceManifest.some((entry: any) => entry.filename === file && entry.sourceSha256 === sourceHash)) hashMatchCount += 1;

  const document = ingestDocx({ name: file, bytes }).document;
  if (!document) throw new Error(`DOCUMENT_IR_NOT_CREATED:${file}`);
  const sourceDocumentId = document.sourceDocumentId ?? document.id ?? document.sourceHash;
  const appendixRegions = findAnswerSolutionAppendixRegions(document);
  const sourceCandidates = segmentQuestions(document);
  const questions = segmentCanonicalQuestions(document);
  if (sourceCandidates.length !== questions.length) {
    throw new Error(`SEGMENTATION_QIR_LENGTH_MISMATCH:${file}:${sourceCandidates.length}:${questions.length}`);
  }

  const authorityRowsForDocument = manifestAuthority.filter(row =>
    row.sourceDocumentId === sourceDocumentId || row.sourceDocumentId === document.sourceHash,
  );

  for (const authority of authorityRowsForDocument) {
    const inAnswerSolutionAppendix = appendixRegions.some(region => {
      const regionIds = new Set(region.sourceObjectIds);
      return authority.sourceObjectIds.length > 0 && authority.sourceObjectIds.every(id => regionIds.has(id));
    });
    frozenRows.push({
      authorityOrdinal: manifestAuthority.indexOf(authority) + 1,
      questionId: authority.questionId,
      sourceDocumentId: authority.sourceDocumentId,
      sourceObjectIds: [...authority.sourceObjectIds],
      inAnswerSolutionAppendix,
    });
  }

  sourceCandidates.forEach((candidate, index) => {
    globalCurrentOrdinal += 1;
    const question = questions[index];
    currentRows.push({
      currentOrdinal: globalCurrentOrdinal,
      question,
      sourceDocumentId: question.sourceDocumentId,
      sourceObjectIds: uniqueInOrder(question.sourceObjectIds),
      sourceSliceIds: question.sourceSliceIds?.length ? [...question.sourceSliceIds] : uniqueInOrder(question.sourceObjectIds),
      startObjectId: candidate.rawBlocks[0]?.id,
      highConfidenceExplicitStart: Boolean(candidate.startCandidates?.some(start =>
        start.candidateKind === "TEXTUAL_MARKER" && start.confidence === "HIGH_CONFIDENCE",
      )),
    });
  });

  perDocument.push({
    sourceDocument: file,
    sourceHash,
    sourceDocumentId,
    rawCandidateCount: sourceCandidates.length,
    frozenAuthorityCount: authorityRowsForDocument.length,
    appendixRegionCount: appendixRegions.length,
  });
}

if (frozenRows.length !== EXPECTED_AUTHORITY_COUNT) {
  throw new Error(`FROZEN_AUTHORITY_DOCUMENT_JOIN_FAILED:${frozenRows.length}`);
}

const result = remapCanonicalBoundaries(frozenRows, currentRows);
const selectedIdentityKeys = result.selected.map(row => `${row.sourceDocumentId}::${row.sourceSliceIds.join("|")}`);
const selectedIdentityUniqueCount = new Set(selectedIdentityKeys).size;

const perDocumentSelection = perDocument.map(document => {
  const selected = result.selected.filter(row => row.sourceDocumentId === document.sourceDocumentId);
  const retained = result.retained.filter(row => row.sourceDocumentId === document.sourceDocumentId);
  const promoted = result.promoted.filter(row => row.sourceDocumentId === document.sourceDocumentId);
  const retired = result.retired.filter(row => row.sourceDocumentId === document.sourceDocumentId);
  return {
    ...document,
    retainedFrozenCount: retained.length,
    retiredFrozenCount: retired.length,
    promotedSplitCount: promoted.length,
    selectedQuestionCount: selected.length,
  };
});

const authorityQA =
  manifestAuthority.length === EXPECTED_AUTHORITY_COUNT &&
  frozenRows.length === EXPECTED_AUTHORITY_COUNT &&
  hashMatchCount === files.length;
const identityQA = selectedIdentityUniqueCount === result.selectedQuestionCount;
const remapQA = result.qa === "PASS";
const qa = authorityQA && identityQA && remapQA ? "PASS" : "FAIL";

const evidence = {
  schemaVersion: "PIMATH_CANONICAL_BOUNDARY_RECOMPOSITION_V1",
  authority: {
    commit: AUTHORITY_COMMIT,
    frozenBoundaryCount: EXPECTED_AUTHORITY_COUNT,
    certificationPath: AUTHORITY_CERTIFICATION_PATH,
    sourceManifestPath: SOURCE_MANIFEST_PATH,
    frozenAuthoritySha256: stableJsonHash(manifestAuthority),
  },
  corpusFileCount: files.length,
  hashMatchCount,
  hashMismatchCount: files.length - hashMatchCount,
  currentRawCandidateCount: currentRows.length,
  frozenAuthorityCount: result.frozenAuthorityCount,
  retainedFrozenCount: result.retainedFrozenCount,
  retiredFrozenCount: result.retiredFrozenCount,
  promotedSplitCount: result.promotedSplitCount,
  selectedQuestionCount: result.selectedQuestionCount,
  canonicalDeltaVs668: result.selectedQuestionCount - EXPECTED_AUTHORITY_COUNT,
  unresolvedFrozenCount: result.unresolvedFrozenCount,
  ambiguousFrozenCount: result.ambiguousFrozenCount,
  ambiguousPromotionCount: result.ambiguousPromotionCount,
  selectedIdentityUniqueCount,
  frozenAuthorityRows: manifestAuthority,
  retained: result.retained,
  retired: result.retired,
  promoted: result.promoted,
  unresolvedFrozen: result.unresolvedFrozen,
  ambiguousFrozen: result.ambiguousFrozen,
  ambiguousPromotions: result.ambiguousPromotions,
  selectedQuestions: result.selected,
  perDocument: perDocumentSelection,
  authorityQA: authorityQA ? "PASS" : "FAIL",
  identityQA: identityQA ? "PASS" : "FAIL",
  remapQA: remapQA ? "PASS" : "FAIL",
  canonicalBoundaryRecompositionQA: qa,
  note: "The 668 human-approved baseline is the frozen authority. Current boundaries are remapped by source identity, not candidate ordinal. A frozen question may be retired only when its complete physical source range is classified as an answer/solution appendix. A new current question may be promoted only as a high-confidence explicit intra-block split child overlapping a retained frozen authority range.",
};

writeFileSync(OUT, JSON.stringify(evidence, null, 2) + "\n");
console.log(JSON.stringify({
  frozenAuthorityCount: evidence.frozenAuthorityCount,
  currentRawCandidateCount: evidence.currentRawCandidateCount,
  retainedFrozenCount: evidence.retainedFrozenCount,
  retiredFrozenCount: evidence.retiredFrozenCount,
  promotedSplitCount: evidence.promotedSplitCount,
  selectedQuestionCount: evidence.selectedQuestionCount,
  canonicalDeltaVs668: evidence.canonicalDeltaVs668,
  unresolvedFrozenCount: evidence.unresolvedFrozenCount,
  ambiguousFrozenCount: evidence.ambiguousFrozenCount,
  ambiguousPromotionCount: evidence.ambiguousPromotionCount,
  hashMatchCount: evidence.hashMatchCount,
  authorityQA: evidence.authorityQA,
  identityQA: evidence.identityQA,
  remapQA: evidence.remapQA,
  canonicalBoundaryRecompositionQA: evidence.canonicalBoundaryRecompositionQA,
  evidencePath: OUT,
}));

if (qa !== "PASS") {
  process.exitCode = 2;
}
