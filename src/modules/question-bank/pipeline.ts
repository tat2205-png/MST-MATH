import { parseDocx } from "./document.js";
import { normalizeCandidate } from "./extraction.js";
import { associateFigures } from "./figures.js";
import { segmentQuestions } from "./segmentation.js";
import { deriveBrowserSafeFigures } from "./wmf.js";
import type {
  DocumentIR,
  DocumentQuestionCandidate,
  QuestionObject,
} from "./types.js";

export interface QuestionImportContext {
  /**
   * Immutable source identity.
   * These values describe the file selected by the teacher,
   * not the SAFE CLEAN processing artifact.
   */
  sourceDocument?: string;
  sourceSha256?: string;

  /**
   * Identity of the artifact actually parsed.
   */
  processingSha256?: string;

  /**
   * Ordered non-destructive transformations between source and parser input.
   */
  transformationHistory?: string[];
}

export function canonicalizeCompositeAnchors(
  candidate: DocumentQuestionCandidate,
  document: DocumentIR,
): DocumentQuestionCandidate {
  const composites = candidate.figureAnchors
    .map((id) => document.figures.find((figure) => figure.id === id))
    .filter((figure) => figure?.componentIds?.length);

  const discarded = new Set<string>();

  for (const left of composites) {
    for (const right of composites) {
      if (left === right) continue;

      const shared = left!.componentIds!.filter((id) =>
        right!.componentIds!.includes(id),
      );

      const sourceIdentityMatch =
        shared.length /
          Math.min(left!.componentIds!.length, right!.componentIds!.length) >=
        0.9;

      if (sourceIdentityMatch) {
        const loser =
          left!.componentIds!.length < right!.componentIds!.length
            ? left!
            : right!;

        discarded.add(loser.id);
      }
    }
  }

  return discarded.size
    ? {
        ...candidate,
        figureAnchors: candidate.figureAnchors.filter(
          (id) => !discarded.has(id),
        ),
        parseWarnings: [
          ...candidate.parseWarnings,
          "OVERLAPPING_VML_GROUP_DEDUPLICATED",
        ],
      }
    : candidate;
}

function lockOriginalSourceIdentity(
  document: DocumentIR,
  context?: QuestionImportContext,
): DocumentIR {
  if (!context) return document;

  const sourceDocument = context.sourceDocument ?? document.sourceDocument;
  const sourceSha256 = context.sourceSha256 ?? document.sourceHash;

  const priorHistory = document.provenance?.transformationHistory ?? [];
  const transformationHistory = [
    ...priorHistory,
    ...(context.transformationHistory ?? []),
  ];

  return {
    ...document,

    // CRITICAL:
    // The canonical identity remains the immutable original source,
    // although document contents may have been parsed from a clean artifact.
    sourceDocument,
    sourceHash: sourceSha256,

    provenance: {
      sourceFile: sourceDocument,
      sourceSha256,
      sourceKind: document.provenance?.sourceKind ?? "DOCX",
      parser: document.provenance?.parser ?? "question-bank-docx",
      parserVersion: document.provenance?.parserVersion,
      transformationHistory,
    },
  };
}

function attachProcessingProvenance(
  question: QuestionObject,
  context?: QuestionImportContext,
): QuestionObject {
  if (!context) return question;

  return {
    ...question,
    source: {
      ...question.source,
      ...(context.processingSha256
        ? { processingSha256: context.processingSha256 }
        : {}),
      ...(context.transformationHistory?.length
        ? { transformationHistory: [...context.transformationHistory] }
        : {}),
    },
  };
}

function finish(
  document: DocumentIR,
  context?: QuestionImportContext,
) {
  const candidates = segmentQuestions(document).map((candidate) =>
    canonicalizeCompositeAnchors(candidate, document),
  );

  const questions = candidates.map((candidate) =>
    attachProcessingProvenance(
      normalizeCandidate(candidate, document),
      context,
    ),
  );

  const figureAssociations = associateFigures(document, questions);

  return {
    document,
    candidates,
    questions,
    figureAssociations,
    warnings: [
      ...document.warnings,
      ...candidates.flatMap((candidate) => candidate.parseWarnings),
    ],
  };
}

/**
 * Source-independent Question Bank extraction from canonical DocumentIR.
 */
export function extractQuestionsFromDocumentIR(document: DocumentIR) {
  return finish(document);
}

export function ingestDocxQuestions(
  bytes: Uint8Array,
  name: string,
  context?: QuestionImportContext,
) {
  const parsed = parseDocx(bytes, name);
  return finish(lockOriginalSourceIdentity(parsed, context), context);
}

export async function ingestDocxQuestionsForRuntime(
  bytes: Uint8Array,
  name: string,
  context?: QuestionImportContext,
) {
  const parsed = await deriveBrowserSafeFigures(
    parseDocx(bytes, name, { canonicalVml: true }),
  );

  return finish(lockOriginalSourceIdentity(parsed, context), context);
}
