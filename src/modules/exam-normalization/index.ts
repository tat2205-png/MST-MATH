import type { ContentBlock, DocumentBlock, DocumentIR, MathNode } from "../document-engine/document-ir.js";
import { normalizeLatex, normalizeVietnameseText } from "../question-bank/normalization.js";

export type NormalizationLayer = "N0" | "N1" | "N2" | "N3" | "N4" | "N5";
export type ReviewCode = "NEEDS_HUMAN_REVIEW" | "AMBIGUOUS_QUESTION_BOUNDARY" | "AMBIGUOUS_MATH_NORMALIZATION" | "AMBIGUOUS_FIGURE_ASSOCIATION";

export interface NormalizationChange {
  layer: NormalizationLayer;
  sourceLocation?: string;
  originalValue: string;
  normalizedValue: string;
  rule: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
}

export interface NormalizationReview {
  code: ReviewCode;
  layer: NormalizationLayer;
  sourceLocation?: string;
  reason: string;
}

export interface NormalizedQuestion {
  id: string;
  questionNumber?: string;
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "UNKNOWN";
  stem: ContentBlock[];
  choices: Array<{ label: string; content: ContentBlock[] }>;
  trueFalse: Array<{ label: string; content: ContentBlock[] }>;
  shortAnswer: ContentBlock[];
  subquestions: Array<{ label: string; content: ContentBlock[] }>;
  sourceBlockIds: string[];
  figureIds: string[];
  figureAssociations: Array<{ figureId: string; status: "CONFIRMED" | "NEEDS_HUMAN_REVIEW"; confidence: "HIGH" | "LOW"; sourceLocation?: string }>;
  provenance: NormalizationChange[];
  review: NormalizationReview[];
}

export interface NormalizedDocumentIR {
  raw: DocumentIR;
  normalized: DocumentIR;
  questions: NormalizedQuestion[];
  provenance: NormalizationChange[];
  review: NormalizationReview[];
  layers: NormalizationLayer[];
}

const clone = <T>(value: T): T => {
  if (value instanceof Uint8Array) return new Uint8Array(value) as T;
  if (Array.isArray(value)) return value.map(item => clone(item)) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, clone(item)])) as T;
  return value;
};

function normalizeMath(math: MathNode, changes: NormalizationChange[], review: NormalizationReview[]): MathNode {
  if (math.parseStatus !== "PARSED" || !math.latex) {
    if (math.sourceRaw.trim() && math.parseStatus === "UNRESOLVED") review.push({ code: "AMBIGUOUS_MATH_NORMALIZATION", layer: "N2", sourceLocation: math.sourceLocation, reason: "Math representation is unresolved; no semantic rewrite was attempted." });
    return clone(math);
  }
  const original = math.latex;
  let normalized: string;
  try { normalized = normalizeLatex(original); } catch { review.push({ code: "AMBIGUOUS_MATH_NORMALIZATION", layer: "N2", sourceLocation: math.sourceLocation, reason: "Math fragment is not a safe standalone expression." }); return clone(math); }
  if (normalized !== original) changes.push({ layer: "N2", sourceLocation: math.sourceLocation, originalValue: original, normalizedValue: normalized, rule: "TRIM_MATH_REPRESENTATION_ONLY", confidence: "HIGH", reason: "Whitespace-only representation cleanup; semantic tokens are preserved." });
  return { ...clone(math), normalized };
}

function normalizeBlock(block: ContentBlock, changes: NormalizationChange[], review: NormalizationReview[]): ContentBlock {
  if (block.type === "text") {
    const normalized = normalizeVietnameseText(block.value);
    if (normalized !== block.value) changes.push({ layer: "N1", sourceLocation: block.sourceLocation, originalValue: block.value, normalizedValue: normalized, rule: "NFC_WHITESPACE_SAFE_TEXT", confidence: "HIGH", reason: "Unicode and whitespace normalization without lexical substitution." });
    return { ...block, value: normalized };
  }
  if (block.type === "math") return { ...block, math: normalizeMath(block.math, changes, review) };
  if (block.type === "table") return { ...block, cells: block.cells.map(row => row.map(cell => normalizeBlock(cell, changes, review))) };
  return { ...block };
}

function textOf(blocks: ContentBlock[]): string { return blocks.map(block => block.type === "text" ? block.value : "").join(""); }
function questionStart(block: DocumentBlock): RegExpMatchArray | null { return textOf(block.content).match(/^\s*(?:câu\s*)?(\d+[A-Za-z]?)\s*[:.)-]\s+/i); }
function optionLabel(block: ContentBlock): string | undefined { return block.type === "text" ? block.value.match(/^\s*([A-D])[.)]\s+/i)?.[1]?.toUpperCase() : undefined; }

function normalizeQuestions(blocks: DocumentBlock[], changes: NormalizationChange[], review: NormalizationReview[]): NormalizedQuestion[] {
  const groups: DocumentBlock[][] = [];
  for (const block of blocks) {
    if (questionStart(block)) groups.push([block]);
    else if (groups.length) groups.at(-1)!.push(block);
  }
  return groups.map((group, index) => {
    const normalizedBlocks = group.map(block => ({ ...block, content: block.content.map(content => normalizeBlock(content, changes, review)) }));
    const first = normalizedBlocks[0]; const number = questionStart(first)?.[1];
    const stem: ContentBlock[] = []; const choices: Array<{ label: string; content: ContentBlock[] }> = []; const trueFalse: Array<{ label: string; content: ContentBlock[] }> = []; const subquestions: Array<{ label: string; content: ContentBlock[] }> = [];
    for (const block of normalizedBlocks) for (const content of block.content) {
      const label = optionLabel(content);
      if (content.type === "text" && /^\s*(a|b|c|d)\s*[.)]\s*/i.test(content.value) && /đúng|sai/i.test(content.value)) trueFalse.push({ label: content.value.trim()[0].toUpperCase(), content: [content] });
      else if (label) choices.push({ label, content: [content] });
      else stem.push(content);
    }
    const figureIds = normalizedBlocks.flatMap(block => block.content.flatMap(content => content.type === "figure" ? [content.figureId] : [])).filter((id, position, all) => all.indexOf(id) === position);
    if (normalizedBlocks.length === 1 && stem.length === 0) review.push({ code: "AMBIGUOUS_QUESTION_BOUNDARY", layer: "N3", sourceLocation: first.sourceLocation, reason: "Question candidate has no deterministic textual stem." });
    const questionType = trueFalse.length ? "TRUE_FALSE" : choices.length ? "MULTIPLE_CHOICE" : stem.length ? "SHORT_ANSWER" : "UNKNOWN";
    const figureAssociations = figureIds.map(figureId => ({ figureId, status: "CONFIRMED" as const, confidence: "HIGH" as const, sourceLocation: normalizedBlocks.find(block => block.content.some(content => content.type === "figure" && content.figureId === figureId))?.sourceLocation }));
    return { id: `question-${number ?? index + 1}`, questionNumber: number, questionType, stem, choices, trueFalse, shortAnswer: [], subquestions, sourceBlockIds: normalizedBlocks.map(block => block.id), figureIds, figureAssociations, provenance: changes.filter(change => normalizedBlocks.some(block => block.sourceLocation === change.sourceLocation)), review: [] };
  });
}

/** Pure normalization boundary. `raw` is returned by reference and is never mutated. */
export function normalizeDocument(raw: DocumentIR): NormalizedDocumentIR {
  const provenance: NormalizationChange[] = []; const review: NormalizationReview[] = [];
  const normalized = clone(raw); normalized.blocks = raw.blocks.map(block => ({ ...block, content: block.content.map(content => normalizeBlock(content, provenance, review)) }));
  const questions = normalizeQuestions(raw.blocks, provenance, review);
  const figureIds = new Set(questions.flatMap(question => question.figureIds));
  for (const figure of raw.figures) if (!figureIds.has(figure.id) && figure.semanticRole === "REAL_FIGURE") review.push({ code: "AMBIGUOUS_FIGURE_ASSOCIATION", layer: "N4", sourceLocation: figure.sourceLocation, reason: "Real figure has no deterministic question ownership; raw figure is preserved." });
  return { raw, normalized, questions, provenance, review, layers: ["N0", "N1", "N2", "N3", "N4", "N5"] };
}

export function normalizationFingerprint(value: NormalizedDocumentIR): string { return JSON.stringify(value.normalized); }
