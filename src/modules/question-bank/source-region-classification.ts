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

function hasLaterQuestionStructure(blocks: DocumentBlock[], blockIndex: number, contentIndex: number, charOffset: number): boolean {
  const block = blocks[blockIndex];
  const suffixContent: ContentBlock[] = [];
  for (let i = contentIndex; i < block.content.length; i += 1) {
    const content = block.content[i];
    if (i === contentIndex && content.type === "text") {
      suffixContent.push({ ...content, value: content.value.slice(charOffset) });
    } else {
      suffixContent.push(content);
    }
  }

  const laterBlocks = blocks.slice(blockIndex + 1);
  const laterText = [visibleText(suffixContent), ...laterBlocks.map(blockText)].join(" ").trim();
  if (explicitMarkerPattern.test(laterText)) return true;
  return laterBlocks.some((candidate) => isQuestionSectionHeading(blockText(candidate)));
}

/**
 * Locate a strong reference-answer footer even when Word stores the heading in
 * the same physical paragraph as the final valid question content. The footer
 * is considered terminal only when no later question marker/section exists.
 * DocumentIR is not mutated; consumers can slice the logical question content
 * while preserving the physical source object for provenance.
 */
export function findTerminalEmbeddedReferenceAnswerFooter(document: DocumentIR): EmbeddedReferenceAnswerFooter | undefined {
  const blocks = [...document.blocks].sort((a, b) => a.order - b.order);

  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex += 1) {
    const block = blocks[blockIndex];
    for (let contentIndex = 0; contentIndex < block.content.length; contentIndex += 1) {
      const content = block.content[contentIndex];
      if (content.type !== "text") continue;
      const match = embeddedReferenceAnswerPattern.exec(content.value);
      embeddedReferenceAnswerPattern.lastIndex = 0;
      if (!match || match.index === undefined) continue;

      if (hasLaterQuestionStructure(blocks, blockIndex, contentIndex, match.index)) continue;

      return {
        blockId: block.id,
        blockOrder: block.order,
        contentIndex,
        charOffset: match.index,
        markerText: match[0],
        evidence: [
          "REFERENCE_ANSWER_HEADING",
          "EMBEDDED_IN_PHYSICAL_BLOCK",
          "TERMINAL_DOCUMENT_REGION",
        ],
      };
    }
  }

  return undefined;
}

/**
 * Detect document-level answer/solution appendices conservatively.
 *
 * A short "Lời giải" paragraph inside normal question flow must never cause all
 * later questions to disappear. A general answer/solution region is promoted to
 * document-level appendix only when all of the following source-backed signals
 * agree:
 *   1) the heading is short and explicit;
 *   2) the region runs to the physical end of the document rather than stopping
 *      at a later question section;
 *   3) repeated question-entry labels occur after the heading;
 *   4) appendix numbering restarts at question 1;
 *   5) there is repeated answer/reasoning evidence.
 *
 * A terminal heading explicitly saying "ĐÁP ÁN THAM KHẢO" / "Reference answer"
 * is a stronger structural signal and is accepted as an ANSWER appendix even
 * when it contains no repeated Câu markers. Embedded same-paragraph footer cases
 * are handled by findTerminalEmbeddedReferenceAnswerFooter().
 *
 * If the evidence is insufficient we fail closed and leave blocks in normal
 * question flow for later review instead of silently excluding them.
 */
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
