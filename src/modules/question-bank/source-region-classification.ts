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

const explicitMarkerPattern = /\b(?:Câu|Bài|Question)\s*(\d+)\s*[:.)]/giu;
const questionSectionPattern = /^(?:PHẦN\s+(?:I|II|III|IV|V)|TRẮC NGHIỆM|ĐÚNG\s*\/\s*SAI|TRẢ LỜI NGẮN|TỰ LUẬN)\b/iu;
const answerHeadingPattern = /^(?:đáp\s*án|answer)\b/iu;
const solutionHeadingPattern = /^(?:lời\s*giải|hướng\s*dẫn\s*giải|solution)\b/iu;
const resultCuePattern = /\b(?:KQ|Kết\s*quả|Đáp\s*án)\s*:/giu;
const reasoningCuePattern = /\b(?:ta\s+có|vì|do\s+đó|suy\s+ra|dựa\s+vào|vậy|đây\s+là\s+bài\s+toán)\b/giu;

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

function cueCounts(blocks: DocumentBlock[]) {
  const value = blocks.map(blockText).join(" ");
  return {
    resultCueCount: [...value.matchAll(resultCuePattern)].length,
    reasoningCueCount: [...value.matchAll(reasoningCuePattern)].length,
  };
}

/**
 * Detect document-level answer/solution appendices conservatively.
 *
 * A short explicit heading alone is not enough because many teaching documents
 * interleave one question with its own "Lời giải". Promotion to appendix status
 * requires repeated explicit question labels after the heading plus repeated
 * result/reasoning evidence. This keeps per-question solutions in normal flow
 * while preventing an end-of-document worked-solution bank from becoming new
 * QuestionIR objects.
 */
export function findAnswerSolutionAppendixRegions(document: DocumentIR): AnswerSolutionAppendixRegion[] {
  const blocks = [...document.blocks].sort((a, b) => a.order - b.order);
  const regions: AnswerSolutionAppendixRegion[] = [];

  for (let i = 0; i < blocks.length; i += 1) {
    const heading = blocks[i];
    const headingText = blockText(heading);
    const kind = answerSolutionHeadingKind(headingText);
    if (!kind) continue;

    // Global appendix headings are visually heading-like. Avoid treating a full
    // inline worked solution paragraph beginning with "Lời giải" as a region.
    if (headingText.length > 120) continue;

    let endIndex = blocks.length;
    for (let j = i + 1; j < blocks.length; j += 1) {
      if (isQuestionSectionHeading(blockText(blocks[j]))) {
        endIndex = j;
        break;
      }
    }

    const regionBlocks = blocks.slice(i + 1, endIndex);
    const markerNumbers = [...new Set(regionBlocks.flatMap((block) => explicitQuestionMarkerNumbers(block.content)))];
    const { resultCueCount, reasoningCueCount } = cueCounts(regionBlocks);
    const repeatedQuestionEntries = markerNumbers.length >= 2;
    const solutionEvidence = kind === "ANSWER"
      ? resultCueCount >= 1 || reasoningCueCount >= 1
      : resultCueCount >= 2 || reasoningCueCount >= 2;

    if (!repeatedQuestionEntries || !solutionEvidence) continue;

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
        "REPEATED_QUESTION_MARKERS",
        ...(resultCueCount > 0 ? ["RESULT_CUES"] : []),
        ...(reasoningCueCount > 0 ? ["SOLUTION_REASONING_CUES"] : []),
      ],
    });

    // Do not discover nested appendix starts inside a region already accepted.
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
