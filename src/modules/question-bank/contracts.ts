import type { AssetLedgerEntry, ContentBlock, DocumentIR, DocumentObjectId, ExtractionIssue, PreservationStatus, Provenance, SourceAnchor } from "../document-engine/document-ir.js";
import type { MathLedgerEntry } from "../document-engine/document-ir.js";

export type { AssetKind, AssetLedgerEntry, DocumentObjectId, ExtractionIssue, MathLedgerEntry, PreservationStatus, Provenance, SourceAnchor } from "../document-engine/document-ir.js";
export type CanonicalQuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "UNKNOWN";
export interface LedgerDiagnostics { sourceMathCount: number; extractedMathCount: number; documentIrMathCount: number; questionIrMathCount: number; questionPackageMathCount: number; sourceAssetCount: number; extractedAssetCount: number; documentIrAssetCount: number; questionPackageAssetCount: number }
export interface MathAssetIdentityMappings { sourceToExtracted: Record<string, string>; extractedToDocumentIr: Record<string, string>; documentIrToQuestionIr: Record<string, string[]>; questionIrToPackage: Record<string, string[]> }
export interface MathAssetLedger { diagnostics: LedgerDiagnostics; math: MathLedgerEntry[]; assets: AssetLedgerEntry[]; mappings?: MathAssetIdentityMappings; status: PreservationStatus; issues: ExtractionIssue[] }
export interface QuestionOptionIR {
  label: string;
  content: ContentBlock[];
}

export interface TrueFalseItemIR {
  label: string;
  content: ContentBlock[];
}

export interface SubquestionIR {
  label: string;
  content: ContentBlock[];
}

/**
 * Canonical common question identity/content contract.
 *
 * `options` remains on the base only for backward compatibility with
 * certified QuestionIR payloads where every question carried an options
 * array. Canonical validation requires it to be empty for non-MCQ types.
 *
 * `answer` is the answer-key / expected-result authority.
 * It must not be confused with SHORT_ANSWER response semantic content.
 */
export interface BaseQuestionIR {
  id: string;
  questionNumber?: string | number;
  sourceDocumentId: string;
  sourceObjectIds: DocumentObjectId[];
  stem: ContentBlock[];
  options: QuestionOptionIR[];
  answer?: ContentBlock[];
  solution?: ContentBlock[];
  mathObjectIds: DocumentObjectId[];
  assetIds: DocumentObjectId[];
  tableIds: DocumentObjectId[];
  metadata: Record<string, unknown>;
  qaStatus: PreservationStatus;
  issues: ExtractionIssue[];
  provenance: Provenance;
}

export interface MultipleChoiceQuestionIR extends BaseQuestionIR {
  questionType: "MULTIPLE_CHOICE";
  trueFalseItems?: never;
  shortAnswer?: never;
  subquestions?: never;
}

export interface TrueFalseQuestionIR extends BaseQuestionIR {
  questionType: "TRUE_FALSE";

  /**
   * Ordered labelled TRUE/FALSE statements.
   * These are canonical question semantics, not MCQ options.
   */
  trueFalseItems?: TrueFalseItemIR[];

  shortAnswer?: never;
  subquestions?: never;
}

export interface ShortAnswerQuestionIR extends BaseQuestionIR {
  questionType: "SHORT_ANSWER";
  trueFalseItems?: never;

  /**
   * Structured SHORT_ANSWER question/response semantic content.
   *
   * This is NOT the answer key.
   * Expected/canonical result authority remains `answer`.
   */
  shortAnswer?: ContentBlock[];

  subquestions?: never;
}

export interface EssayQuestionIR extends BaseQuestionIR {
  questionType: "ESSAY";
  trueFalseItems?: never;
  shortAnswer?: never;

  /**
   * Ordered labelled subordinate parts a), b), c), ...
   */
  subquestions?: SubquestionIR[];
}

/**
 * Compatibility boundary for source questions whose type cannot yet be
 * resolved. UNKNOWN is never promoted merely because multiple semantic
 * collections happen to be present.
 */
export interface UnknownQuestionIR extends BaseQuestionIR {
  questionType: "UNKNOWN";
  trueFalseItems?: TrueFalseItemIR[];
  shortAnswer?: ContentBlock[];
  subquestions?: SubquestionIR[];
}

export type QuestionIR =
  | MultipleChoiceQuestionIR
  | TrueFalseQuestionIR
  | ShortAnswerQuestionIR
  | EssayQuestionIR
  | UnknownQuestionIR;

export interface QuestionIRSemanticShape {
  questionType: CanonicalQuestionType;
  options?: readonly unknown[];
  trueFalseItems?: readonly unknown[];
  shortAnswer?: readonly unknown[];
  subquestions?: readonly unknown[];
}

export type QuestionIRCombinationIssue =
  | "MCQ_WITH_TRUE_FALSE_ITEMS"
  | "MCQ_WITH_SHORT_ANSWER"
  | "MCQ_WITH_SUBQUESTIONS"
  | "TRUE_FALSE_WITH_OPTIONS"
  | "TRUE_FALSE_WITH_SHORT_ANSWER"
  | "TRUE_FALSE_WITH_SUBQUESTIONS"
  | "SHORT_ANSWER_WITH_OPTIONS"
  | "SHORT_ANSWER_WITH_TRUE_FALSE_ITEMS"
  | "SHORT_ANSWER_WITH_SUBQUESTIONS"
  | "ESSAY_WITH_OPTIONS"
  | "ESSAY_WITH_TRUE_FALSE_ITEMS"
  | "ESSAY_WITH_SHORT_ANSWER";

export function questionIRCombinationIssues(
  question: QuestionIRSemanticShape,
): QuestionIRCombinationIssue[] {
  const issues: QuestionIRCombinationIssue[] = [];

  const hasOptions =
    (question.options?.length ?? 0) > 0;

  const hasTrueFalse =
    (question.trueFalseItems?.length ?? 0) > 0;

  const hasShortAnswer =
    (question.shortAnswer?.length ?? 0) > 0;

  const hasSubquestions =
    (question.subquestions?.length ?? 0) > 0;

  switch (question.questionType) {
    case "MULTIPLE_CHOICE":
      if (hasTrueFalse) {
        issues.push("MCQ_WITH_TRUE_FALSE_ITEMS");
      }
      if (hasShortAnswer) {
        issues.push("MCQ_WITH_SHORT_ANSWER");
      }
      if (hasSubquestions) {
        issues.push("MCQ_WITH_SUBQUESTIONS");
      }
      break;

    case "TRUE_FALSE":
      if (hasOptions) {
        issues.push("TRUE_FALSE_WITH_OPTIONS");
      }
      if (hasShortAnswer) {
        issues.push("TRUE_FALSE_WITH_SHORT_ANSWER");
      }
      if (hasSubquestions) {
        issues.push("TRUE_FALSE_WITH_SUBQUESTIONS");
      }
      break;

    case "SHORT_ANSWER":
      if (hasOptions) {
        issues.push("SHORT_ANSWER_WITH_OPTIONS");
      }
      if (hasTrueFalse) {
        issues.push("SHORT_ANSWER_WITH_TRUE_FALSE_ITEMS");
      }
      if (hasSubquestions) {
        issues.push("SHORT_ANSWER_WITH_SUBQUESTIONS");
      }
      break;

    case "ESSAY":
      if (hasOptions) {
        issues.push("ESSAY_WITH_OPTIONS");
      }
      if (hasTrueFalse) {
        issues.push("ESSAY_WITH_TRUE_FALSE_ITEMS");
      }
      if (hasShortAnswer) {
        issues.push("ESSAY_WITH_SHORT_ANSWER");
      }
      break;

    case "UNKNOWN":
      break;
  }

  return issues;
}

export function assertQuestionIRCombination(
  question: QuestionIRSemanticShape,
): void {
  const issues =
    questionIRCombinationIssues(question);

  if (issues.length) {
    throw new Error(
      `INVALID_QUESTION_IR_COMBINATION:${issues.join(",")}`,
    );
  }
}
export interface QuestionPackage { id: string; directoryName: `question-${string}`; question: QuestionIR; questionTex?: string; solutionTex?: string; metadata: Record<string, unknown>; assets: AssetLedgerEntry[]; mathObjectIds: DocumentObjectId[]; sourceObjectIds: DocumentObjectId[]; provenance: Provenance; qaStatus: PreservationStatus; extractionIssues: ExtractionIssue[] }

const packageText = (blocks?: ContentBlock[]) => (blocks ?? []).map(block => block.type === "text" ? block.value : block.type === "math" ? `\\(${block.math.latex ?? block.math.sourceRaw}\\)` : block.type === "figure" ? `[FIGURE:${block.figureId}]` : block.cells.map(row => row.map(cell => packageText([cell])).join(" & ")).join(" \\\\ ")).join("");
function ownedPackageAssets(
  question: QuestionIR,
  assets: readonly AssetLedgerEntry[],
): AssetLedgerEntry[] {
  const ownedIds =
    new Set<DocumentObjectId>([
      ...question.assetIds,
      ...question.tableIds,
    ]);

  const seen =
    new Set<DocumentObjectId>();

  const result: AssetLedgerEntry[] = [];

  for (const asset of assets) {
    if (!ownedIds.has(asset.assetId)) {
      continue;
    }

    if (seen.has(asset.assetId)) {
      continue;
    }

    seen.add(asset.assetId);
    result.push(asset);
  }

  return result;
}

export function createQuestionPackage(
  question: QuestionIR,
  assets: AssetLedgerEntry[] = [],
): QuestionPackage {
  assertQuestionIRCombination(question);

  return {
    id: question.id,
    directoryName: `question-${question.id}`,
    question,
    questionTex: packageText(question.stem),
    solutionTex:
      question.solution
        ? packageText(question.solution)
        : "",
    metadata: {
      id: question.id,
      questionType: question.questionType,
      sourceDocumentId: question.sourceDocumentId,
    },
    assets: ownedPackageAssets(question, assets),
    mathObjectIds: [...question.mathObjectIds],
    sourceObjectIds: [...question.sourceObjectIds],
    provenance: question.provenance,
    qaStatus: question.qaStatus,
    extractionIssues: [...question.issues],
  };
}
export const serializeQuestionPackage = (pkg: QuestionPackage) => JSON.stringify(pkg, (_key, value) => value instanceof Uint8Array ? { $type: "Uint8Array", base64: Buffer.from(value).toString("base64") } : value, 2);

export function evaluatePreservationStatus(issues: readonly ExtractionIssue[], counts?: Pick<LedgerDiagnostics, "sourceMathCount" | "extractedMathCount" | "documentIrMathCount" | "questionIrMathCount" | "questionPackageMathCount" | "sourceAssetCount" | "extractedAssetCount" | "documentIrAssetCount" | "questionPackageAssetCount">): PreservationStatus {
  if (issues.some(issue => issue.status === "QUARANTINED")) return "QUARANTINED";
  if (issues.some(issue => issue.status === "UNSUPPORTED")) return "UNSUPPORTED";
  if (issues.some(issue => issue.status === "REVIEW")) return "REVIEW";
  if (counts && (counts.sourceMathCount !== counts.extractedMathCount || counts.extractedMathCount !== counts.documentIrMathCount || counts.documentIrMathCount !== counts.questionPackageMathCount || counts.sourceAssetCount !== counts.extractedAssetCount || counts.extractedAssetCount !== counts.documentIrAssetCount || counts.documentIrAssetCount !== counts.questionPackageAssetCount)) return "REVIEW";
  return "PASS";
}

export function documentLedger(document: DocumentIR): MathAssetLedger {
  const math = document.mathObjects ?? [];
  const assets = document.assetObjects ?? [];
  const issues = document.extractionIssues ?? [];
  const diagnostics = { sourceMathCount: math.length, extractedMathCount: math.length, documentIrMathCount: math.length, questionIrMathCount: 0, questionPackageMathCount: math.length, sourceAssetCount: assets.length, extractedAssetCount: assets.length, documentIrAssetCount: assets.length, questionPackageAssetCount: assets.length };
  return { diagnostics, math, assets, status: evaluatePreservationStatus(issues, diagnostics), issues };
}
