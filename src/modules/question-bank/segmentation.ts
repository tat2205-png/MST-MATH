import type { ContentBlock, DocumentBlock, DocumentIR, ImportConfidence, QuestionAnswer, QuestionOption, QuestionType, SourcePosition, TrueFalseStatement } from "./types.js";

export interface SegmentedQuestion { questionNumber?: string; content: ContentBlock[]; questionType: QuestionType; options?: QuestionOption[]; statements?: Array<{ id: string; content: ContentBlock[] }>; answer?: QuestionAnswer; solution?: ContentBlock[]; assetIds: string[]; warnings: string[]; evidence: string[]; confidence: ImportConfidence; sourcePosition: SourcePosition }
const questionStart = /^(?:Câu|Bài|Question)\s*0*(\d+)\s*[.:)]?\s*/iu;
const solutionStart = /^(?:Lời giải|Giải|Hướng dẫn giải|Hướng dẫn)\s*[:.]?\s*/iu;
const answerHeader = /^(?:Đáp án|Hướng dẫn đáp án)\s*[:.]?\s*/iu;
const plainText = (blocks: ContentBlock[]) => blocks.map((block) => block.type === "text" ? block.value : block.type === "math" ? `$${block.latex}$` : block.type === "image" ? `[IMAGE:${block.assetId}]` : "[TABLE]").join("");
const firstText = (blocks: ContentBlock[]): string => { const block = blocks.find((item) => item.type === "text"); return block?.type === "text" ? block.value.trim() : ""; };
function blockContent(block: DocumentBlock): ContentBlock[] { if (block.type === "paragraph" || block.type === "heading") return block.content; if (block.type === "table") return [{ type: "table", rows: block.rows }]; if (block.type === "image") return [{ type: "image", assetId: block.assetId, alt: block.target }]; if (block.type === "math") return [{ type: "math", latex: block.latex }]; return []; }
function trimFirstText(blocks: ContentBlock[], pattern: RegExp): ContentBlock[] { const copy = structuredClone(blocks); const first = copy.find((b) => b.type === "text"); if (first?.type === "text") first.value = first.value.replace(pattern, ""); return copy.filter((b) => b.type !== "text" || b.value.length > 0); }

type Labeled = { label: string; content: ContentBlock[] };
function extractLabeled(content: ContentBlock[], labels: string): { stem: ContentBlock[]; items: Labeled[] } {
  const stem: ContentBlock[] = []; const items: Labeled[] = []; let current: Labeled | undefined;
  for (const block of content) {
    if (block.type !== "text") { (current?.content ?? stem).push(block); continue; }
    const regex = new RegExp(`(?:^|\\s)([${labels}])[.)]\\s*`, "g"); let cursor = 0; let match: RegExpExecArray | null;
    while ((match = regex.exec(block.value))) { const before = block.value.slice(cursor, match.index); if (before) (current?.content ?? stem).push({ type: "text", value: before }); current = { label: match[1].toUpperCase(), content: [] }; items.push(current); cursor = regex.lastIndex; }
    const rest = block.value.slice(cursor); if (rest) (current?.content ?? stem).push({ type: "text", value: rest });
  }
  return { stem, items };
}
function parseAnswerSection(blocks: DocumentBlock[]): Map<string, { mcq?: "A" | "B" | "C" | "D"; tf?: boolean[] }> {
  const answers = new Map<string, { mcq?: "A" | "B" | "C" | "D"; tf?: boolean[] }>(); let active = false;
  for (const block of blocks) { const text = plainText(blockContent(block)).trim(); if (answerHeader.test(text)) active = true; if (!active) continue; for (const match of text.matchAll(/(?:Câu\s*)?(\d+)\s*(?:[.:-]|\s)\s*([ABCD])(?:\b|$)/giu)) answers.set(match[1], { mcq: match[2].toUpperCase() as "A" | "B" | "C" | "D" }); const tf = /(?:Câu\s*)?(\d+)\s*[:.-]\s*((?:[a-d]\s*[):.-]?\s*(?:Đ|S|Đúng|Sai)\s*){2,})/iu.exec(text); if (tf) answers.set(tf[1], { tf: [...tf[2].matchAll(/(?:Đ|S|Đúng|Sai)/giu)].map((x) => /^đ/iu.test(x[0])) }); }
  return answers;
}
function classify(content: ContentBlock[]): { type: QuestionType; stem: ContentBlock[]; options?: QuestionOption[]; statements?: TrueFalseStatement[]; evidence: string[]; confidence: number; warnings: string[] } {
  const text = plainText(content); const upper = extractLabeled(content, "ABCD"); const lower = extractLabeled(content, "abcd"); const tfContext = /đúng\s*(?:hay|\/|hoặc)?\s*sai|mỗi\s+ý|đúng\/sai/iu.test(text);
  if (upper.items.length === 4 && "ABCD".split("").every((label) => upper.items.some((x) => x.label === label))) return { type: "MCQ", stem: upper.stem, options: upper.items.map((x) => ({ id: x.label as "A" | "B" | "C" | "D", content: x.content })), evidence: ["EXACT_ABCD_OPTIONS"], confidence: 0.98, warnings: [] };
  if (tfContext && lower.items.length === 4) return { type: "TRUE_FALSE", stem: lower.stem, statements: lower.items.map((x) => ({ id: x.label.toLowerCase(), content: x.content, answer: false })), evidence: ["TRUE_FALSE_CONTEXT", "FOUR_LABELED_STATEMENTS"], confidence: 0.95, warnings: [] };
  if (/trả\s+lời\s+ngắn|đáp\s+số|ghi\s+kết\s+quả/iu.test(text)) return { type: "SHORT_ANSWER", stem: content, evidence: ["SHORT_ANSWER_INSTRUCTION"], confidence: 0.9, warnings: ["ANSWER_UNRESOLVED"] };
  const warnings = lower.items.length >= 2 ? ["AMBIGUOUS_SUBQUESTION_STRUCTURE"] : [];
  return { type: "ESSAY", stem: content, evidence: lower.items.length >= 2 ? ["PRESERVED_SUBQUESTIONS"] : ["OPEN_RESPONSE_FALLBACK"], confidence: lower.items.length >= 2 ? 0.75 : 0.65, warnings };
}
export function segmentDocument(document: DocumentIR): SegmentedQuestion[] {
  const answerMap = parseAnswerSection(document.blocks); const boundaries: Array<{ index: number; number: string }> = [];
  document.blocks.forEach((block, index) => { if (block.type !== "paragraph" && block.type !== "heading") return; const match = questionStart.exec(firstText(block.content)); if (match) boundaries.push({ index, number: match[1] }); else if (block.numberingId && /question|câu|bài/iu.test(block.styleName ?? "")) boundaries.push({ index, number: String(boundaries.length + 1) }); });
  return boundaries.map((boundary, boundaryIndex) => {
    const end = boundaryIndex + 1 < boundaries.length ? boundaries[boundaryIndex + 1].index - 1 : document.blocks.findIndex((block, index) => index > boundary.index && (block.type === "paragraph" || block.type === "heading") && answerHeader.test(plainText(block.content).trim())) - 1;
    const safeEnd = end < boundary.index ? document.blocks.length - 1 : end; const slice = document.blocks.slice(boundary.index, safeEnd + 1); let solutionAt = slice.findIndex((block) => (block.type === "paragraph" || block.type === "heading") && solutionStart.test(plainText(block.content).trim())); if (solutionAt < 0) solutionAt = slice.length;
    const questionBlocks = slice.slice(0, solutionAt); const solutionBlocks = slice.slice(solutionAt); const content = questionBlocks.flatMap(blockContent); if (content.length) content.splice(0, content.length, ...trimFirstText(content, questionStart)); const classified = classify(content); const sourceAnswer = answerMap.get(boundary.number); let answer: QuestionAnswer | undefined;
    if (classified.type === "MCQ" && sourceAnswer?.mcq) answer = { type: "MCQ", optionId: sourceAnswer.mcq };
    if (classified.type === "TRUE_FALSE" && sourceAnswer?.tf && classified.statements) answer = { type: "TRUE_FALSE", statements: classified.statements.map((statement, i) => ({ ...statement, answer: sourceAnswer.tf?.[i] ?? false })) };
    const solution = solutionBlocks.flatMap(blockContent); if (solution.length) solution.splice(0, solution.length, ...trimFirstText(solution, solutionStart));
    const assetIds = [...new Set([...classified.stem, ...(classified.options?.flatMap((o) => o.content) ?? []), ...solution].filter((b): b is Extract<ContentBlock, { type: "image" }> => b.type === "image").map((b) => b.assetId))];
    const mathBlocks = [...classified.stem, ...(classified.options?.flatMap((o) => o.content) ?? []), ...solution].filter((b) => b.type === "math").length; const mathConfidence = document.mathObjects ? document.mathConverted / document.mathObjects : 1;
    return { questionNumber: boundary.number, content: classified.stem, questionType: classified.type, options: classified.options, statements: classified.statements?.map(({ id, content }) => ({ id, content })), answer, solution: solution.length ? solution : undefined, assetIds, warnings: [...classified.warnings, ...document.warnings, ...(classified.type !== "ESSAY" && !answer ? ["ANSWER_UNRESOLVED"] : [])], evidence: ["EXPLICIT_QUESTION_TOKEN", ...classified.evidence, ...(mathBlocks ? ["STRUCTURED_MATH_PRESENT"] : [])], confidence: { segmentation: 0.99, type: classified.confidence, math: mathConfidence, answer: answer ? 0.98 : 0, assetMapping: assetIds.length ? 0.95 : 1 }, sourcePosition: { blockStart: boundary.index, blockEnd: safeEnd, paragraphStart: document.blocks[boundary.index].paragraphIndex, paragraphEnd: document.blocks[safeEnd]?.paragraphIndex } };
  });
}
