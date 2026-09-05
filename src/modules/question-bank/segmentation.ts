import type { ContentBlock, DocumentBlock, DocumentIR, DocumentQuestionCandidate, MathNode, QuestionType } from "./types.js";

const textOf = (blocks: ContentBlock[]): string =>
  blocks
    .map((block) =>
      block.type === "text"
        ? block.value
        : block.type === "table"
          ? block.cells.flat().map((cell) => textOf([cell])).join(" ")
          : "",
    )
    .join("");

/**
 * Strict canonical question boundary.
 *
 * Bare numeric paragraphs such as:
 *   1. ...
 *   2. ...
 *
 * are NOT question boundaries. They may be chapter headings, theorem steps,
 * enumerations, solution steps, or Word auto-numbered prose.
 *
 * Only explicit Câu/Bài markers or validated semantic Word numbering are
 * authoritative at this layer.
 */
const explicitQuestion = /^(Câu|Bài)\s*(\d+)\s*[.:)]\s*/iu;

const section =
  /^(PHẦN\s+(?:I|II|III|IV|V)|TRẮC NGHIỆM|ĐÚNG\s*\/\s*SAI|TRẢ LỜI NGẮN|TỰ LUẬN|BÀI TẬP)/iu;

function isUppercaseBaiHeading(value: string): boolean {
  const match = /^Bài\s+\d+\s*[.:)]\s*(.+)$/iu.exec(value);
  if (!match) return false;

  const remainder = match[1].trim();
  const letters = remainder.match(/\p{L}/gu) ?? [];

  return letters.length >= 4 && !/\p{Ll}/u.test(remainder);
}

function typeFor(
  sectionName: string | undefined,
  content: ContentBlock[],
): QuestionType {
  const value = `${sectionName ?? ""} ${textOf(content)}`;

  if (/đúng\s*\/\s*sai/iu.test(value)) return "TRUE_FALSE";
  if (/trả lời ngắn/iu.test(value)) return "SHORT_ANSWER";
  if (/tự luận/iu.test(value)) return "ESSAY";

  const labels = [...value.matchAll(/([A-H])[.)](?:\s|$)/gu)].map(
    (match) => match[1],
  );

  return new Set(labels).size >= 2 ? "MULTIPLE_CHOICE" : "UNKNOWN";
}

function isStructuralQuestionBoundary(block: DocumentBlock, value: string): boolean {
  const meta = block.numberingMeta;
  if (!meta) return false;
  if (/^[A-H][.)]\s/iu.test(value)) return false;
  if (meta.level !== 0) return false;
  if (!/^(?:decimal|decimalZero)$/i.test(meta.format ?? "")) return false;
  return /^(?:Câu|Bài)\s*%1(?:\s*[.:)]?\s*)$/iu.test((meta.levelText ?? "").trim());
}

export function segmentQuestions(
  document: DocumentIR,
): DocumentQuestionCandidate[] {
  const candidates: DocumentQuestionCandidate[] = [];

  let current: DocumentBlock[] = [];
  let currentSection: string | undefined;
  let label: string | undefined;
  let index: number | undefined;
  let sequenceIndex: number | undefined;

  const flush = () => {
    if (!current.length) return;

    const flat = current.flatMap((block) => block.content);

    const math = flat.flatMap((block): MathNode[] =>
      block.type === "math"
        ? [block.math]
        : block.type === "table"
          ? block.cells
              .flat()
              .flatMap((cell) => (cell.type === "math" ? [cell.math] : []))
          : [],
    );

    const figures = [
      ...new Set(
        flat.flatMap((block) =>
          block.type === "figure"
            ? [block.figureId]
            : block.type === "table"
              ? block.cells
                  .flat()
                  .flatMap((cell) =>
                    cell.type === "figure" ? [cell.figureId] : [],
                  )
              : [],
        ),
      ),
    ];

    candidates.push({
      id: `candidate-${candidates.length + 1}`,
      questionIndex: index,
      questionLabel: label,
      sequenceIndex,
      section: currentSection,
      rawBlocks: current,
      textBlocks: flat,
      mathBlocks: math,
      figureAnchors: figures,
      questionTypeCandidate: typeFor(currentSection, flat),
      sourceLocations: current.map((block) => block.sourceLocation),
      parseWarnings: math.flatMap((node) => node.warnings),
    });

    current = [];
    label = undefined;
    index = undefined;
    sequenceIndex = undefined;
  };

  for (const block of document.blocks) {
    const value = textOf(block.content).trim();

    if (!value) {
      if (block.kind === "SECTION") {
        flush();
        continue;
      }

      if (current.length && block.content.length > 0) {
        current.push(block);
      }

      continue;
    }

    const marker = explicitQuestion.exec(value);

    if (marker?.[1].toLocaleLowerCase("vi-VN") === "bài" &&
        isUppercaseBaiHeading(value)) {
      flush();
      currentSection = value;
      continue;
    }

    const sectionMatch = section.exec(value);

    if (!marker && (sectionMatch || block.kind === "SECTION")) {
      flush();
      currentSection = value;
      continue;
    }

    if (isStructuralQuestionBoundary(block, value)) {
      flush();
      label = block.numberingMeta?.label;
      index = block.numberingMeta?.ordinal;
      sequenceIndex = candidates.length + 1;
      current.push(block);
      continue;
    }

    if (marker) {
      flush();

      label = marker[0].trim();
      index = Number(marker[2]);
      current.push(block);
      continue;
    }

    if (current.length) {
      current.push(block);
    }
  }

  flush();

  return candidates;
}
