import type { DocumentIR, MathNode } from "../document-engine/document-ir.js";
import type { NormalizedDocumentIR, NormalizationReview } from "../exam-normalization/index.js";

export type MathQAStatus = "PASS" | "NEEDS_HUMAN_REVIEW" | "UNSUPPORTED_REQUIRES_REVIEW" | "BLOCKED";
export type MathQAGate = "MQ1_PARSE_VALIDITY" | "MQ2_NORMALIZATION_SEMANTIC_PRESERVATION" | "MQ3_DOMAIN_AND_CONDITION_PRESERVATION" | "MQ4_ANSWER_SOLUTION_CONSISTENCY" | "MQ5_NUMERIC_AND_SYMBOLIC_CONSISTENCY" | "MQ6_MATH_NOTATION_VALIDITY" | "MQ7_AMBIGUITY_REVIEW_GATE" | "MQ8_PROVENANCE_INTEGRITY";

export interface MathQAIssue { code: string; message: string; sourceLocation?: string; details?: Record<string, unknown> }
export interface MathQAGateResult { gate: MathQAGate; status: MathQAStatus; issues: MathQAIssue[] }
export interface MathQAExpression { raw: string; normalized?: string; parseStatus?: "PARSED" | "UNRESOLVED" | "UNSUPPORTED"; sourceLocation?: string }
export interface MathQAQuestion { id: string; expressions: MathQAExpression[]; domainConditions?: string[]; rawDomainConditions?: string[]; normalizedDomainConditions?: string[]; expectedAnswer?: string; providedAnswer?: string; solution?: string; provenance?: Array<{ originalValue: string; normalizedValue: string; rule: string; sourceLocation?: string }>; review?: NormalizationReview[] }
export interface MathQAInput { raw: DocumentIR; normalized: NormalizedDocumentIR; questions?: MathQAQuestion[] }
export interface MathQAResult { status: MathQAStatus; gates: MathQAGateResult[]; rawSourceUnchanged: boolean; provenanceIntact: boolean }

const issue = (code: string, message: string, sourceLocation?: string, details?: Record<string, unknown>): MathQAIssue => ({ code, message, sourceLocation, details });
const gate = (name: MathQAGate, status: MathQAStatus, issues: MathQAIssue[] = []): MathQAGateResult => ({ gate: name, status, issues });
const normalizedComparable = (value: string) => value.normalize("NFC").replace(/\s+/g, " ").trim();
const stable = (value: unknown) => JSON.stringify(value);
const bracesBalanced = (value: string) => { let depth = 0; for (const char of value) { if (char === "{") depth += 1; if (char === "}" && --depth < 0) return false; } return depth === 0; };

function collectMath(document: DocumentIR): MathNode[] { return document.blocks.flatMap(block => block.content.flatMap(content => content.type === "math" ? [content.math] : content.type === "table" ? content.cells.flatMap(row => row.flatMap(cell => cell.type === "math" ? [cell.math] : [])) : [])); }
function allQuestions(input: MathQAInput): MathQAQuestion[] { return input.questions ?? input.normalized.questions.flatMap(question => question.stem.filter(block => block.type === "math").map(block => ({ id: question.id, expressions: [{ raw: block.math.sourceRaw, normalized: block.math.normalized, parseStatus: block.math.parseStatus, sourceLocation: block.math.sourceLocation }], provenance: question.provenance, review: question.review }))); }

export function runMathQA(input: MathQAInput): MathQAResult {
  const rawSnapshot = stable(input.raw); const rawMath = collectMath(input.raw); const questions = allQuestions(input); const gates: MathQAGateResult[] = [];
  const parseIssues: MathQAIssue[] = rawMath.filter(math => math.parseStatus !== "PARSED").map(math => issue(math.parseStatus === "UNSUPPORTED" ? "UNSUPPORTED_MATH" : "UNRESOLVED_MATH", "Math is outside deterministic parse scope or unresolved.", math.sourceLocation));
  gates.push(gate("MQ1_PARSE_VALIDITY", parseIssues.length ? (parseIssues.some(item => item.code === "UNSUPPORTED_MATH") ? "UNSUPPORTED_REQUIRES_REVIEW" : "NEEDS_HUMAN_REVIEW") : "PASS", parseIssues));
  const semanticIssues: MathQAIssue[] = []; for (const question of questions) for (const expression of question.expressions) if (expression.normalized !== undefined && normalizedComparable(expression.raw) !== normalizedComparable(expression.normalized)) semanticIssues.push(issue("SEMANTIC_CHANGE_REQUIRES_REVIEW", "Normalized math differs beyond whitespace-safe representation.", expression.sourceLocation));
  gates.push(gate("MQ2_NORMALIZATION_SEMANTIC_PRESERVATION", semanticIssues.length ? "NEEDS_HUMAN_REVIEW" : "PASS", semanticIssues));
  const conditionIssues: MathQAIssue[] = []; for (const question of questions) {
    const rawConditions = question.rawDomainConditions;
    const normalizedConditions = question.normalizedDomainConditions;
    if (!rawConditions || !normalizedConditions) conditionIssues.push(issue("DOMAIN_CONDITION_EVIDENCE_MISSING", "Independent raw and normalized domain/condition evidence is required; absence is not treated as an empty condition set.", question.id));
    else if (stable(rawConditions) !== stable(normalizedConditions)) conditionIssues.push(issue("DOMAIN_CONDITION_LOSS", "Domain or condition metadata differs after normalization.", question.id, { rawConditions, normalizedConditions }));
  }
  gates.push(gate("MQ3_DOMAIN_AND_CONDITION_PRESERVATION", conditionIssues.length ? "BLOCKED" : "PASS", conditionIssues));
  const answerIssues: MathQAIssue[] = []; for (const question of questions) { if (question.expectedAnswer === undefined && question.providedAnswer === undefined && question.solution === undefined) answerIssues.push(issue("ANSWER_NOT_VERIFIED", "No explicit answer/solution is available for deterministic consistency verification.", question.id)); else if (question.expectedAnswer !== undefined && question.providedAnswer !== undefined && normalizedComparable(question.expectedAnswer) !== normalizedComparable(question.providedAnswer)) answerIssues.push(issue("ANSWER_INCONSISTENT", "Provided answer differs from expected answer.", question.id)); }
  gates.push(gate("MQ4_ANSWER_SOLUTION_CONSISTENCY", answerIssues.length ? "NEEDS_HUMAN_REVIEW" : "PASS", answerIssues));
  const numericIssues: MathQAIssue[] = []; for (const question of questions) for (const expression of question.expressions) if (expression.normalized !== undefined && normalizedComparable(expression.raw) !== normalizedComparable(expression.normalized)) numericIssues.push(issue("SYMBOLIC_REPRESENTATION_CHANGED", "No deterministic proof was supplied for a symbolic representation change.", expression.sourceLocation));
  gates.push(gate("MQ5_NUMERIC_AND_SYMBOLIC_CONSISTENCY", numericIssues.length ? "NEEDS_HUMAN_REVIEW" : "PASS", numericIssues));
  const notationIssues: MathQAIssue[] = rawMath.flatMap(math => !bracesBalanced(math.latex ?? math.sourceRaw) ? [issue("MALFORMED_MATH_NOTATION", "Math notation has unbalanced braces.", math.sourceLocation)] : /\\(documentclass|begin\{document\})/.test(math.latex ?? "") ? [issue("INVALID_MATH_FRAGMENT", "Document-level LaTeX is not a valid math fragment.", math.sourceLocation)] : []);
  gates.push(gate("MQ6_MATH_NOTATION_VALIDITY", notationIssues.length ? "BLOCKED" : "PASS", notationIssues));
  const reviewIssues: MathQAIssue[] = input.normalized.review.map(item => issue(item.code, item.reason, item.sourceLocation)); for (const question of questions) for (const item of question.review ?? []) reviewIssues.push(issue(item.code, item.reason, item.sourceLocation));
  gates.push(gate("MQ7_AMBIGUITY_REVIEW_GATE", reviewIssues.length ? "NEEDS_HUMAN_REVIEW" : "PASS", reviewIssues));
  const provenanceIssues: MathQAIssue[] = []; for (const question of questions) for (const expression of question.expressions) if (expression.normalized !== undefined && !question.provenance?.some(item => item.originalValue === expression.raw && item.normalizedValue === expression.normalized)) provenanceIssues.push(issue("PROVENANCE_MISSING", "Derived math value has no matching source provenance record.", expression.sourceLocation));
  const provenanceIntact = provenanceIssues.length === 0; gates.push(gate("MQ8_PROVENANCE_INTEGRITY", provenanceIntact ? "PASS" : "BLOCKED", provenanceIssues));
  const rawSourceUnchanged = stable(input.raw) === rawSnapshot; const statuses = gates.map(item => item.status); const status: MathQAStatus = !rawSourceUnchanged || statuses.includes("BLOCKED") ? "BLOCKED" : statuses.includes("UNSUPPORTED_REQUIRES_REVIEW") ? "UNSUPPORTED_REQUIRES_REVIEW" : statuses.includes("NEEDS_HUMAN_REVIEW") ? "NEEDS_HUMAN_REVIEW" : "PASS";
  return { status, gates, rawSourceUnchanged, provenanceIntact };
}

export function verifyMathQAIdempotence(input: MathQAInput, normalize: (raw: DocumentIR) => NormalizedDocumentIR): boolean { const first = normalize(input.raw); const second = normalize(first.normalized); return stable(first.normalized) === stable(second.normalized); }
