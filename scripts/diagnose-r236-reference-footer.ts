import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { ingestDocx } from "../src/modules/document-engine/docx/ingestion.js";
import { segmentQuestions } from "../src/modules/question-bank/segmentation.js";
import {
  blockText,
  explicitQuestionMarkerNumbers,
  findTerminalEmbeddedReferenceAnswerFooter,
  isQuestionSectionHeading,
} from "../src/modules/question-bank/source-region-classification.js";
import type { ContentBlock, DocumentBlock } from "../src/modules/document-engine/document-ir.js";

const CORPUS_ROOT = process.env.PIMATH_WORD_REAL_CORPUS ?? join(homedir(), "PiMath-Acceptance", "word-real");
const SOURCE = "NK TEST APP.docx";
const OUT = "docs/evidence/word-beta-human-acceptance-round-2/R2-36-reference-footer-diagnostic.json";
const EXPECTED_HASH = "f4d4446aeaf5ba446ff941c91cac75b86cbcdc656606d16dc0f4d52d0bf09fe9";

const bytes = new Uint8Array(readFileSync(join(CORPUS_ROOT, SOURCE)));
const document = ingestDocx({ name: SOURCE, bytes }).document;
if (!document) throw new Error("DOCUMENT_IR_NOT_CREATED:NK_TEST_APP");
if (document.sourceHash !== EXPECTED_HASH) throw new Error(`SOURCE_HASH_MISMATCH:${document.sourceHash}`);

const candidates = segmentQuestions(document);
const q6 = candidates.find((candidate) =>
  candidate.questionIndex === 6 &&
  /hai\s+điều\s+kiện\s+sau\s*:/iu.test(
    candidate.textBlocks.map((block) => block.type === "text" ? block.value : "").join(" "),
  ),
);
if (!q6) throw new Error("R2_36_Q6_NOT_FOUND");

const q6Ids = [...new Set(q6.rawBlocks.map((block) => block.id))];
const documentIndexById = new Map(document.blocks.map((block, index) => [block.id, index]));
const q6Indexes = q6Ids.map((id) => documentIndexById.get(id)).filter((value): value is number => value !== undefined);
const minIndex = Math.min(...q6Indexes);
const maxIndex = Math.max(...q6Indexes);

const contentSnapshot = (content: ContentBlock, contentIndex: number) => ({
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
  codePoints: content.type === "text"
    ? [...content.value].map((ch) => `${ch}=U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`).slice(0, 160)
    : [],
});

const blockSnapshot = (block: DocumentBlock, index: number) => ({
  documentIndex: index,
  id: block.id,
  order: block.order,
  paragraphIndex: block.paragraphIndex ?? null,
  kind: block.kind,
  style: block.style ?? null,
  numbering: block.numbering ?? null,
  sourceLocation: block.sourceLocation,
  visibleText: blockText(block),
  explicitQuestionMarkerNumbers: explicitQuestionMarkerNumbers(block.content),
  isQuestionSectionHeading: isQuestionSectionHeading(blockText(block)),
  content: block.content.map(contentSnapshot),
});

const q6PhysicalBlocks = document.blocks
  .map((block, index) => ({ block, index }))
  .filter(({ block }) => q6Ids.includes(block.id))
  .map(({ block, index }) => blockSnapshot(block, index));

const nearbyBlocks = document.blocks
  .map((block, index) => ({ block, index }))
  .filter(({ index }) => index >= Math.max(0, minIndex - 4) && index <= Math.min(document.blocks.length - 1, maxIndex + 12))
  .map(({ block, index }) => blockSnapshot(block, index));

const referenceLexemeBlocks = document.blocks
  .map((block, index) => ({ block, index, visible: blockText(block) }))
  .filter(({ visible }) => /(?:đáp|tham\s*khảo|được\s+thực\s+hiện\s+bởi\s+ai)/iu.test(visible))
  .map(({ block, index }) => blockSnapshot(block, index));

interface StreamRun {
  blockIndex: number;
  blockId: string;
  blockOrder: number;
  contentIndex: number;
  start: number;
  end: number;
}

let stream = "";
const runs: StreamRun[] = [];
document.blocks.forEach((block, blockIndex) => {
  block.content.forEach((content, contentIndex) => {
    if (content.type !== "text") return;
    if (stream.length > 0) stream += " ";
    const start = stream.length;
    stream += content.value;
    runs.push({
      blockIndex,
      blockId: block.id,
      blockOrder: block.order,
      contentIndex,
      start,
      end: stream.length,
    });
  });
});

const exactPattern = /(?<![\p{L}\p{N}_])(?:đáp\s*án\s+tham\s+khảo|reference\s+answers?)(?=\s|$|[:\-–—])/giu;
const exactMatches = [...stream.matchAll(exactPattern)];

const markerDiagnostics = exactMatches.map((match, ordinal) => {
  const offset = match.index ?? -1;
  const run = runs.find((candidate) => offset >= candidate.start && offset < candidate.end);
  if (!run) {
    return {
      ordinal: ordinal + 1,
      markerText: match[0],
      offset,
      mapped: false,
      acceptedByCurrentTerminalGate: false,
      rejectionReasons: ["OFFSET_NOT_MAPPED_TO_TEXT_RUN"],
    };
  }

  const block = document.blocks[run.blockIndex];
  const suffixContent: ContentBlock[] = [];
  for (let i = run.contentIndex; i < block.content.length; i += 1) {
    const content = block.content[i];
    if (i === run.contentIndex && content.type === "text") {
      suffixContent.push({ ...content, value: content.value.slice(offset - run.start) });
    } else {
      suffixContent.push(content);
    }
  }
  const laterBlocks = document.blocks.slice(run.blockIndex + 1);
  const laterQuestionSections = laterBlocks
    .filter((candidate) => isQuestionSectionHeading(blockText(candidate)))
    .map((candidate) => ({ id: candidate.id, order: candidate.order, text: blockText(candidate) }));
  const markerNumbers = [
    ...explicitQuestionMarkerNumbers(suffixContent),
    ...laterBlocks.flatMap((candidate) => explicitQuestionMarkerNumbers(candidate.content)),
  ];
  const rejectionReasons = [
    ...(laterQuestionSections.length > 0 ? ["LATER_QUESTION_SECTION"] : []),
    ...(markerNumbers.length > 0 && markerNumbers[0] !== 1 ? [`QUESTION_MARKERS_DO_NOT_RESTART_AT_ONE:${markerNumbers[0]}`] : []),
  ];

  return {
    ordinal: ordinal + 1,
    markerText: match[0],
    offset,
    mapped: true,
    blockId: run.blockId,
    blockOrder: run.blockOrder,
    documentIndex: run.blockIndex,
    contentIndex: run.contentIndex,
    charOffset: offset - run.start,
    streamWindow: stream.slice(Math.max(0, offset - 180), Math.min(stream.length, offset + 360)),
    laterQuestionSections,
    markerNumbersAfterHeading: markerNumbers.slice(0, 50),
    acceptedByCurrentTerminalGate: rejectionReasons.length === 0,
    rejectionReasons,
  };
});

const looseNormalizedStream = stream
  .normalize("NFKC")
  .replace(/[\u200B-\u200D\u2060\uFEFF]/gu, "")
  .replace(/\s+/gu, " ");
const looseReferencePhraseFound = /đáp\s*án\s+tham\s+khảo/iu.test(looseNormalizedStream);
const looseAiFooterFound = /được\s+thực\s+hiện\s+bởi\s+ai/iu.test(looseNormalizedStream);

const currentFinderResult = findTerminalEmbeddedReferenceAnswerFooter(document) ?? null;

const evidence = {
  schemaVersion: "PIMATH_R2_36_REFERENCE_FOOTER_DIAGNOSTIC_V1",
  sourceDocument: SOURCE,
  sourceHash: document.sourceHash,
  candidateCount: candidates.length,
  q6SourceObjectIds: q6Ids,
  q6PhysicalBlocks,
  nearbyBlocks,
  referenceLexemeBlocks,
  exactReferenceMarkerCount: exactMatches.length,
  markerDiagnostics,
  looseReferencePhraseFound,
  looseAiFooterFound,
  currentFinderResult,
};

writeFileSync(OUT, JSON.stringify(evidence, null, 2) + "\n");

console.log("============================================");
console.log(" R2-36 REFERENCE FOOTER SOURCE DIAGNOSTIC");
console.log("============================================");
console.log("sourceHash =", evidence.sourceHash);
console.log("candidateCount =", evidence.candidateCount);
console.log("q6SourceObjectIds =", evidence.q6SourceObjectIds);
console.log("exactReferenceMarkerCount =", evidence.exactReferenceMarkerCount);
console.log("looseReferencePhraseFound =", evidence.looseReferencePhraseFound);
console.log("looseAiFooterFound =", evidence.looseAiFooterFound);
console.log("currentFinderResult =", evidence.currentFinderResult);
console.log("");
console.log("MARKER DIAGNOSTICS:");
for (const marker of evidence.markerDiagnostics) console.log(JSON.stringify(marker));
console.log("");
console.log("Q6 PHYSICAL BLOCKS:");
for (const block of evidence.q6PhysicalBlocks) console.log(JSON.stringify(block));
console.log("");
console.log("NEARBY BLOCKS:");
for (const block of evidence.nearbyBlocks) console.log(JSON.stringify(block));
console.log("");
console.log(`DIAGNOSTIC_EVIDENCE=${OUT}`);
