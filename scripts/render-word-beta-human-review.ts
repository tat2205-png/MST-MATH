import type { ContentBlock, DocumentIR } from "../src/modules/document-engine/document-ir.js";
import type { QuestionIR } from "../src/modules/question-bank/contracts.js";

const mathText = (block: Extract<ContentBlock, { type: "math" }>) =>
  `$${block.math.latex ?? block.math.normalized ?? block.math.sourceRaw}$`;

export function renderInlineBlock(block: ContentBlock): string {
  if (block.type === "text") return block.value;
  if (block.type === "math") return mathText(block);
  if (block.type === "figure") return `[FIGURE:${block.figureId}]`;
  return block.cells
    .map((row) => row.map((cell) => renderInlineBlocks([cell])).join(" | "))
    .join(" / ");
}

function shouldInsertSpace(left: string, right: string): boolean {
  if (!left || !right) return false;
  if (/\s$/.test(left) || /^\s/.test(right)) return false;
  if (/[([{]$/.test(left)) return false;
  if (/^[,.;:!?)}\]]/.test(right)) return false;
  return true;
}

export function renderInlineBlocks(blocks?: ContentBlock[]): string {
  return (blocks ?? []).reduce((out, block) => {
    const value = renderInlineBlock(block);
    if (!value) return out;
    return out + (shouldInsertSpace(out, value) ? " " : "") + value;
  }, "").trim();
}

function questionContent(question: QuestionIR): ContentBlock[] {
  return [
    ...(question.stem ?? []),
    ...(question.options ?? []).flatMap((option) => option.content),
    ...(question.subitems ?? []).flatMap((item) => item.content),
    ...(question.answer ?? []),
    ...(question.solution ?? []),
  ];
}

function collectSourceLocations(block: ContentBlock): string[] {
  const locations: string[] = [];
  if (block.sourceLocation) locations.push(block.sourceLocation);
  if (block.type === "math" && block.math.sourceLocation) locations.push(block.math.sourceLocation);
  if (block.type === "table") {
    for (const cell of block.cells.flat()) locations.push(...collectSourceLocations(cell));
  }
  return locations;
}

function sourceLocationFor(block: ContentBlock): string | undefined {
  if (block.sourceLocation) return block.sourceLocation;
  return block.type === "math" ? block.math.sourceLocation : undefined;
}

function filterSourceContent(blocks: ContentBlock[], allowedLocations: Set<string>): ContentBlock[] {
  return blocks.flatMap((block): ContentBlock[] => {
    if (block.type === "table") {
      const cells = block.cells
        .map((row) => row.map((cell) => filterSourceContent([cell], allowedLocations)).flat())
        .filter((cell) => cell.length > 0);
      if (cells.length > 0) return [{ ...block, cells }];
      return [];
    }
    const location = sourceLocationFor(block);
    return location && allowedLocations.has(location) ? [block] : [];
  });
}

/**
 * Reconstruct source at run/content-block granularity when possible. Several
 * logical questions may legally share one physical Word paragraph, so using
 * only sourceObjectIds would render the entire paragraph for every question.
 * QuestionIR blocks preserve the original sourceLocation, allowing us to show
 * only the source runs that actually belong to this question while retaining
 * the physical source-object provenance.
 */
export function renderSourceReconstruction(document: DocumentIR, question: QuestionIR): string {
  const sourceIds = new Set(question.sourceObjectIds ?? []);
  const sourceLocations = new Set(questionContent(question).flatMap(collectSourceLocations));

  const paragraphs = (document.blocks ?? [])
    .filter((block) => sourceIds.has(block.id))
    .sort((a, b) => a.order - b.order)
    .map((block) => {
      if (sourceLocations.size === 0) return renderInlineBlocks(block.content);
      return renderInlineBlocks(filterSourceContent(block.content, sourceLocations));
    })
    .filter(Boolean);

  return paragraphs.join("\n\n").trim();
}

export function renderQuestionText(question: QuestionIR): string {
  const lines: string[] = [];
  const stem = renderInlineBlocks(question.stem);
  if (stem) lines.push(stem);
  for (const option of question.options ?? []) {
    const value = renderInlineBlocks(option.content);
    lines.push(`${option.label}. ${value}`.trim());
  }
  for (const item of question.subitems ?? []) {
    const value = renderInlineBlocks(item.content);
    lines.push(`${item.label}) ${value}`.trim());
  }
  return lines.join("\n").trim();
}

export function renderQuestionMarkdown(question: QuestionIR): string {
  const sections: string[] = [];
  const stem = renderInlineBlocks(question.stem);
  if (stem) sections.push(`**Stem**\n\n${stem}`);

  if ((question.options ?? []).length > 0) {
    const options = question.options
      .map((option) => `- **${option.label}.** ${renderInlineBlocks(option.content)}`)
      .join("\n");
    sections.push(`**Options**\n\n${options}`);
  }

  if ((question.subitems ?? []).length > 0) {
    const subitems = (question.subitems ?? [])
      .map((item) => `- **${item.label})** ${renderInlineBlocks(item.content)}`)
      .join("\n");
    sections.push(`**True/False subitems**\n\n${subitems}`);
  }

  return sections.join("\n\n").trim();
}

export function renderAnswer(question: QuestionIR): string {
  return renderInlineBlocks(question.answer);
}

export function renderSolution(question: QuestionIR): string {
  return renderInlineBlocks(question.solution);
}
