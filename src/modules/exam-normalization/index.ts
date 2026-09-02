import { resolveExamRuntimeAuthority, resolveAccessibilityAuthority, resolveOutputProfile } from "../../config/naMathBrandRoot.js";
import type { DocumentBlock, DocumentIR, ContentBlock } from "../document-engine/document-ir.js";
import type { QuestionObject } from "../question-bank/types.js";
import type { FigureCompatibilityContract } from "../figure-exam-foundation/contracts.js";
import { toExamQuestion } from "../question-bank/examAdapter.js";
import type { ExamNormalizationOptions, NormalizedExamDocument, NormalizedAnswerRegion, NormalizedQuestionPlacement } from "./types.js";
export * from "./types.js";

const profileFor = (exam: ExamNormalizationOptions["exam"]) => exam === "THPTQG" ? "P06_EXAM_THPTQG" : exam === "DGNL" ? "P06_EXAM_DGNL" : exam === "SAT" ? "P06_EXAM_SAT" : exam === "VSAT" ? "P06_EXAM_VSAT" : "P06_EXAM_SCHOOL";
const text = (value: string): ContentBlock => ({ type: "text", value });
const questionLabel = (q: QuestionObject) => q.index === undefined ? "" : `Câu ${q.index}. `;
const makeBlocks = (q: QuestionObject): { blocks: DocumentBlock[]; answer: NormalizedAnswerRegion } => {
  const blocks: DocumentBlock[] = [];
  const add = (kind: DocumentBlock["kind"], content: ContentBlock[], suffix: string, style?: string) => { const id = `${q.id}:${suffix}`; blocks.push({ id, kind, order: blocks.length, paragraphIndex: blocks.length, style, content, sourceLocation: q.source.sourceLocations[0] ?? q.source.document }); return id; };
  add("PARAGRAPH", [text(questionLabel(q)), ...q.stem], "stem", "NABody");
  if (q.type === "MULTIPLE_CHOICE") { q.options.forEach((o) => add("PARAGRAPH", [text(`${o.label}. `), ...o.content], `option:${o.label}`, "NABody")); return { blocks, answer: { questionId: q.id, type: "CHOICE", labels: q.options.map(o => o.label), rows: 1 } }; }
  if (q.type === "TRUE_FALSE") { q.trueFalseItems.forEach((o) => add("PARAGRAPH", [text(`${o.label}. `), ...o.content], `statement:${o.label}`, "NABody")); return { blocks, answer: { questionId: q.id, type: "TRUE_FALSE", labels: q.trueFalseItems.map(o => o.label), rows: 1 } }; }
  if (q.shortAnswer?.length) add("PARAGRAPH", q.shortAnswer, "short-answer", "NABody");
  return { blocks, answer: { questionId: q.id, type: "SHORT_ANSWER", labels: [], rows: 1 } };
};

export function normalizeExamDocument(questions: readonly QuestionObject[], options: ExamNormalizationOptions): NormalizedExamDocument {
  const profileId = profileFor(options.exam); const authority = options.exam === "THPTQG" ? resolveExamRuntimeAuthority("THPTQG") : options.exam === "DGNL" ? resolveExamRuntimeAuthority("DGNL") : options.exam === "SAT" ? resolveExamRuntimeAuthority("SAT") : options.exam === "VSAT" ? resolveExamRuntimeAuthority("VSAT") : { profile: resolveOutputProfile(profileId), renderer: "EXISTING_EXAM_RENDERER" };
  resolveAccessibilityAuthority();
  const blocks: DocumentBlock[] = []; const answers: NormalizedAnswerRegion[] = []; const placements: NormalizedQuestionPlacement[] = [];
  for (const q of questions) { const made = makeBlocks(q); const first = blocks.length; blocks.push(...made.blocks.map((b, i) => ({ ...b, order: first + i, paragraphIndex: first + i }))); answers.push(made.answer); placements.push({ questionId: q.id, questionNumber: q.index, blockIds: made.blocks.map(b => b.id), keepWithQuestion: true, figureIds: q.figures.map(f => f.id), safeFigureBounds: Object.fromEntries(q.figures.map(f => [f.id, options.figures?.get(f.id)?.safeBoundingBox])) }); }
  const document: DocumentIR = { sourceDocument: options.sourceDocument ?? "exam-normalized", sourceHash: questions.map(q => q.source.sourceHash).join(":"), blocks, figures: questions.flatMap(q => q.figures), warnings: [] };
  return { document, answerRegions: answers, profileId, warnings: [], pagination: { page: "A4 portrait", profileId, keepQuestionTogether: true, pageBreakBeforeQuestionIds: [], placements } };
}

export function validateNormalizedExamDocument(result: NormalizedExamDocument): string[] {
  const issues: string[] = []; const ids = new Set<string>();
  for (const placement of result.pagination.placements) { if (placement.blockIds.some(id => ids.has(id))) issues.push(`DUPLICATE_BLOCK_ID:${placement.questionId}`); placement.blockIds.forEach(id => ids.add(id)); if (placement.keepWithQuestion !== true) issues.push(`KEEP_WITH_QUESTION_REQUIRED:${placement.questionId}`); }
  if (result.document.blocks.some(block => block.content.some(blockContent => blockContent.type === "text" && /answer|solution/i.test(blockContent.value)))) issues.push("NO_ANSWER_LEAKAGE");
  return issues;
}

export function toNormalizedExamQuestion(question: QuestionObject) { return toExamQuestion(question); }
