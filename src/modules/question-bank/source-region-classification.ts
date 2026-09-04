import type { ContentBlock, DocumentBlock, DocumentIR } from "../document-engine/document-ir.js";

export type AnswerSolutionRegionKind = "ANSWER" | "SOLUTION";

export interface AnswerSolutionAppendixRegion {
  kind: AnswerSolutionRegionKind;
  startOrder: number;
  endOrder: number;
  headingBlockId: string;
  sourceObjectIds: string[];
  markerNumbers: number[];
  resultCueCount: number;
  reasoningCueCount: number;
  evidence: string[];
}

export interface EmbeddedReferenceAnswerFooter {
  blockId: string;
  blockOrder: number;
  contentIndex: number;
  charOffset: number;
  markerText: string;
  markerNumbersAfterHeading: number[];
  evidence: string[];
}

const explicitMarkerPattern = /\b(?:Câu|Bài|Question)\s*(\d+)\s*[:.)]/giu;
const questionSectionPattern = /^(?:PHẦN\s+(?:I|II|III|IV|V)|TRẮC NGHIỆM|ĐÚNG\s*\/\s*SAI|TRẢ LỜI NGẮN|TỰ LUẬN)\b/iu;
const answerHeadingPattern = /^(?:đáp\s*án|answer)\b/iu;
const solutionHeadingPattern = /^(?:lời\s*giải|hướng\s*dẫn\s*giải|solution)\b/iu;
const referenceAnswerHeadingPattern = /^(?:đáp\s*án\s+tham\s+khảo|reference\s+answers?)(?:\s|$|[:\-–—])/iu;
const embeddedReferenceAnswerPattern = /(?<![\p{L}\p{N}_])(?:đáp\s*án\s+tham\s+khảo|reference\s+answers?)(?=\s|$|[:\-–—])/iu;
const resultCuePattern = /\b(?:KQ|Kết\s*quả|Đáp\s*án)\s*:/giu;
const reasoningCuePattern = /(?<![\p{L}\p{N}_])(?:ta\s+có|vì|do\s+đó|suy\s+ra|dựa\s+vào|vậy|đây\s+là\s+bài\s+toán)(?![\p{L}\p{N}_])/giu;

export function visibleText(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === "text") return block.value;
      if (block.type === "table") return block.cells.flat().map((cell) => visibleText([cell])).join(" ");
      return "";
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function blockText(block: DocumentBlock): string {
  return visibleText(block.content);
}

export function explicitQuestionMarkerNumbers(blocks: ContentBlock[]): number[] {
  const value = visibleText(blocks);
  return [...value.matchAll(explicitMarkerPattern)].map((match) => Number(match[1]));
}

export function answerSolutionHeadingKind(value: string): AnswerSolutionRegionKind | undefined {
  const normalized = value.trim();
  if (answerHeadingPattern.test(normalized)) return "ANSWER";
  if (solutionHeadingPattern.test(normalized)) return "SOLUTION";
  return undefined;
}

export function isQuestionSectionHeading(value: string): boolean {
  return questionSectionPattern.test(value.trim());
}

export function isReferenceAnswerHeading(value: string): boolean {
  return referenceAnswerHeadingPattern.test(value.trim());
}

function cueCounts(blocks: DocumentBlock[]) {
  const value = blocks.map(blockText).join(" ");
  return {
    resultCueCount: [...value.matchAll(resultCuePattern)].length,
    reasoningCueCount: [...value.matchAll(reasoningCuePattern)].length,
  };
}

interface AggregatedTextRun {
  blockIndex: number;
  blockId: string;
  blockOrder: number;
  contentIndex: number;
  aggregateStart: number;
  aggregateEnd: number;
}

/**
 * Build one document-visible text stream while retaining exact source offsets.
 * Virtual spaces between text runs and physical blocks mirror the visible-text
 * contract used by review rendering, so formatting-only Word boundaries cannot
 * hide a semantic heading such as "ĐÁP ÁN THAM KHẢO".
 */
function aggregateDocumentTextRuns(blocks: DocumentBlock[]): { value: string; runs: AggregatedTextRun[] } {
  let value = "";
  const runs: AggregatedTextRun[] = [];

  blocks.forEach((block, blockIndex) => {
    block.content.forEach((content, contentIndex) => {
      if (content.type !== "text") return;
      if (value.length > 0) value += " ";
      const aggregateStart = value.length;
      value += content.value;
      runs.push({
        blockIndex,
        blockId: block.id,
        blockOrder: block.order,
        contentIndex,
        aggregateStart,
        aggregateEnd: value.length,
      });
    });
  });

  return { value, runs };
}

function markerPositionInDocument(blocks: DocumentBlock[]): {
  blockIndex: number;
  blockId: string;
  blockOrder: number;
  contentIndex: number;
  charOffset: number;
  markerText: string;
} | undefined {
  const aggregate = aggregateDocumentTextRuns(blocks);
  const match = embeddedReferenceAnswerPattern.exec(aggregate.value);
  if (!match || match.index === undefined) return undefined;

  const run = aggregate.runs.find(
    (candidate) => match.index >= candidate.aggregateStart && match.index < candidate.aggregateEnd,
  );
  if (!run) return undefined;

  return {
    blockIndex: run.blockIndex,
    blockId: run.blockId,
    blockOrder: run.blockOrder,
    contentIndex: run.contentIndex,
    charOffset: match.index - run.aggregateStart,
    markerText: match[0],
  };
}

function suffixContentFrom(
  block: DocumentBlock,
  contentIndex: number,
  charOffset: number,
): ContentBlock[] {
  const suffix: ContentBlock[] = [];
  for (let i = contentIndex; i < block.content.length; i += 1) {
    const content = block.content[i];
    if (i === contentIndex && content.type === "text") {
      suffix.push({ ...content, value: content.value.slice(charOffset) });
    } else {
      suffix.push(content);
    }
  }
  return suffix;
}

function terminalReferenceAnswerEvidence(
  blocks: DocumentBlock[],
  blockIndex: number,
  contentIndex: number,
  charOffset: number,
): { accepted: boolean; markerNumbers: number[]; evidence: string[] } {
  const block = blocks[blockIndex];
  const suffixContent = suffixContentFrom(block, contentIndex, charOffset);
  const laterBlocks = blocks.slice(blockIndex + 1);

  // A later explicit question section means this is not a terminal footer.
  if (laterBlocks.some((candidate) => isQuestionSectionHeading(blockText(candidate)))) {
    return { accepted: false, markerNumbers: [], evidence: [] };
  }

  const markerNumbers = [
    ...explicitQuestionMarkerNumbers(suffixContent),
    ...laterBlocks.flatMap((candidate) => explicitQuestionMarkerNumbers(candidate.content)),
  ];

  // Explicit Câu/Bài labels after a reference-answer heading are answer entries
  // only when the sequence restarts from 1. Otherwise fail closed.
  if (markerNumbers.length > 0 && markerNumbers[0] !== 1) {
    return { accepted: false, markerNumbers, evidence: [] };
  }

  return {
    accepted: true,
    markerNumbers,
    evidence: [
      "REFERENCE_ANSWER_HEADING",
      "VISIBLE_TEXT_AGGREGATE",
      "TERMINAL_DOCUMENT_REGION",
      ...(markerNumbers.length > 0 ? ["ANSWER_ENTRIES_RESTART_AT_ONE"] : []),
    ],
  };
}

/**
 * Locate a terminal reference-answer footer even when Word splits the heading
 * across several runs and/or physical paragraphs. The returned start location
 * always maps back to the original block/run so downstream segmentation can
 * slice only the logical question prefix without mutating DocumentIR.
 */
export function findTerminalEmbeddedReferenceAnswerFooter(document: DocumentIR): EmbeddedReferenceAnswerFooter | undefined {
  const blocks = [...document.blocks].sort((a, b) => a.order - b.order);
  const marker = markerPositionInDocument(blocks);
  if (!marker) return undefined;

  const terminal = terminalReferenceAnswerEvidence(
    blocks,
    marker.blockIndex,
    marker.contentIndex,
    marker.charOffset,
  );
  if (!terminal.accepted) return undefined;

  return {
    blockId: marker.blockId,
    blockOrder: marker.blockOrder,
    contentIndex: marker.contentIndex,
    charOffset: marker.charOffset,
    markerText: marker.markerText,
    markerNumbersAfterHeading: terminal.markerNumbers,
    evidence: terminal.evidence,
  };
}

/** Detect document-level answer/solution appendices conservatively. */
export function findAnswerSolutionAppendixRegions(document: DocumentIR): AnswerSolutionAppendixRegion[] {
  const blocks = [...document.blocks].sort((a, b) => a.order - b.order);
  const regions: AnswerSolutionAppendixRegion[] = [];

  for (let i = 0; i < blocks.length; i += 1) {
    const heading = blocks[i];
    const headingText = blockText(heading);
    const kind = answerSolutionHeadingKind(headingText);
    if (!kind) continue;
    if (headingText.length > 120) continue;

    let endIndex = blocks.length;
    for (let j = i + 1; j < blocks.length; j += 1) {
      if (isQuestionSectionHeading(blockText(blocks[j]))) {
        endIndex = j;
        break;
      }
    }
    if (endIndex !== blocks.length) continue;

    const regionBlocks = blocks.slice(i + 1, endIndex);
    const markerSequence = regionBlocks.flatMap((block) => explicitQuestionMarkerNumbers(block.content));
    const markerNumbers = [...new Set(markerSequence)];
    const { resultCueCount, reasoningCueCount } = cueCounts(regionBlocks);
    const referenceAnswerHeading = kind === "ANSWER" && isReferenceAnswerHeading(headingText);

    if (referenceAnswerHeading) {
      const last = regionBlocks.at(-1) ?? heading;
      regions.push({
        kind,
        startOrder: heading.order,
        endOrder: last.order,
        headingBlockId: heading.id,
        sourceObjectIds: [heading.id, ...regionBlocks.map((block) => block.id)],
        markerNumbers,
        resultCueCount,
        reasoningCueCount,
        evidence: [
          "EXPLICIT_HEADING",
          "REFERENCE_ANSWER_HEADING",
          "TERMINAL_DOCUMENT_REGION",
          ...(markerNumbers.length > 0 ? ["QUESTION_MARKERS"] : []),
          ...(resultCueCount > 0 ? ["RESULT_CUES"] : []),
        ],
      });
      i = Math.max(i, endIndex - 1);
      continue;
    }

    const repeatedQuestionEntries = markerNumbers.length >= 2;
    const numberingRestartsAtOne = markerSequence[0] === 1;
    const cueCount = resultCueCount + reasoningCueCount;
    const solutionEvidence = kind === "ANSWER"
      ? cueCount >= 1
      : cueCount >= Math.min(2, markerNumbers.length);

    if (!repeatedQuestionEntries || !numberingRestartsAtOne || !solutionEvidence) continue;

    const last = regionBlocks.at(-1) ?? heading;
    regions.push({
      kind,
      startOrder: heading.order,
      endOrder: last.order,
      headingBlockId: heading.id,
      sourceObjectIds: [heading.id, ...regionBlocks.map((block) => block.id)],
      markerNumbers,
      resultCueCount,
      reasoningCueCount,
      evidence: [
        "EXPLICIT_HEADING",
        "TERMINAL_DOCUMENT_REGION",
        "REPEATED_QUESTION_MARKERS",
        "NUMBERING_RESTARTS_AT_ONE",
        ...(resultCueCount > 0 ? ["RESULT_CUES"] : []),
        ...(reasoningCueCount > 0 ? ["SOLUTION_REASONING_CUES"] : []),
      ],
    });

    i = Math.max(i, endIndex - 1);
  }

  return regions;
}

export function blockBelongsToAnswerSolutionAppendix(
  block: Pick<DocumentBlock, "order">,
  regions: AnswerSolutionAppendixRegion[],
): boolean {
  return regions.some((region) => block.order >= region.startOrder && block.order <= region.endOrder);
}
