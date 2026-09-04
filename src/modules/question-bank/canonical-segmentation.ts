import { normalizeCandidate } from "./extraction.js";
import { disambiguateQuestionIrIds } from "./question-identity.js";
import { segmentQuestions } from "./segmentation.js";

import type {
  ContentBlock,
  DocumentIR,
  ExtractionIssue,
  Provenance,
} from "../document-engine/document-ir.js";

import type {
  DocumentQuestionCandidate,
} from "./types.js";

import {
  questionIRCombinationIssues,
} from "./contracts.js";

import type {
  BaseQuestionIR,
  QuestionIR,
} from "./contracts.js";

const provenanceFor = (
  document: DocumentIR,
): Provenance =>
  document.provenance ?? {
    sourceFile: document.sourceDocument,
    sourceSha256: document.sourceHash,
    sourceKind: "DOCX",
    parser: "document-engine",
    transformationHistory: [],
  };

interface References {
  math: Set<string>;
  figures: Set<string>;
}

function collect(
  blocks: readonly ContentBlock[],
  refs: References,
): void {
  for (const block of blocks) {
    if (block.type === "math") {
      if (block.math.id) {
        refs.math.add(block.math.id);
      }

      continue;
    }

    if (block.type === "figure") {
      refs.figures.add(block.figureId);
      continue;
    }

    if (block.type === "table") {
      for (const row of block.cells) {
        collect(row, refs);
      }
    }
  }
}

function questionReferences(
  question: ReturnType<typeof normalizeCandidate>,
): References {
  const refs: References = {
    math: new Set<string>(),
    figures: new Set<string>(),
  };

  collect(question.stem, refs);

  for (const option of question.options) {
    collect(option.content, refs);
  }

  for (const item of question.trueFalseItems) {
    collect(item.content, refs);
  }

  if (question.shortAnswer) {
    collect(question.shortAnswer, refs);
  }

  if (question.answer) {
    collect(question.answer, refs);
  }

  if (question.solution) {
    collect(question.solution, refs);
  }

  for (const subquestion of question.subquestions) {
    collect(subquestion.content, refs);
  }

  for (const figure of question.figures) {
    refs.figures.add(figure.id);
  }

  return refs;
}

function ownedTableIds(
  document: DocumentIR,
  candidate: DocumentQuestionCandidate,
): string[] {
  const sourceIds = new Set(
    candidate.rawBlocks
      .filter((block) => block.kind === "TABLE")
      .map((block) => block.id),
  );

  return (
    document.assetObjects
      ?.filter(
        (asset) =>
          asset.kind === "TABLE" &&
          sourceIds.has(asset.assetId),
      )
      .map((asset) => asset.assetId) ?? []
  );
}

export function segmentCanonicalQuestions(
  document: DocumentIR,
): QuestionIR[] {
  const candidates =
    segmentQuestions(document);

  const questions =
    candidates.map((candidate) => {
      const normalized =
        normalizeCandidate(
          candidate,
          document,
        );

      const refs =
        questionReferences(normalized);

      const knownMath =
        new Set(
          document.mathObjects?.map(
            (entry) =>
              entry.mathObjectId,
          ) ?? [],
        );

      const knownAssets =
        new Set(
          document.assetObjects?.map(
            (entry) =>
              entry.assetId,
          ) ?? [],
        );

      const semanticIssueCodes =
        questionIRCombinationIssues({
          questionType:
            normalized.type,

          options:
            normalized.options,

          trueFalseItems:
            normalized.trueFalseItems,

          shortAnswer:
            normalized.shortAnswer,

          subquestions:
            normalized.subquestions,
        });

      const issues: ExtractionIssue[] = [
        ...normalized.warnings.map(
          (code) => ({
            code,
            severity: "WARNING" as const,
            message: code,
            status: "REVIEW" as const,
            objectId: normalized.id,
          }),
        ),

        ...semanticIssueCodes.map(
          (code) => ({
            code,
            severity: "ERROR" as const,
            message:
              `Invalid QuestionIR semantic combination: ${code}`,
            status: "REVIEW" as const,
            objectId: normalized.id,
          }),
        ),
      ];

      const base: BaseQuestionIR = {
        id:
          normalized.id,

        questionNumber:
          normalized.index,

        sourceDocumentId:
          document.sourceDocumentId ??
          document.id ??
          document.sourceHash,

        sourceObjectIds:
          candidate.rawBlocks.map(
            (block) => block.id,
          ),

        stem:
          normalized.stem,

        // Compatibility field. Canonical validation requires
        // non-MCQ variants to keep this empty.
        options:
          normalized.options,

        ...(normalized.answer
          ? {
              answer:
                normalized.answer,
            }
          : {}),

        ...(normalized.solution
          ? {
              solution:
                normalized.solution,
            }
          : {}),

        mathObjectIds:
          [...refs.math].filter(
            (id) =>
              knownMath.has(id),
          ),

        assetIds:
          [...refs.figures].filter(
            (id) =>
              knownAssets.has(id),
          ),

        tableIds:
          ownedTableIds(
            document,
            candidate,
          ),

        metadata:
          normalized.metadata,

        qaStatus:
          issues.length ||
          normalized.validationStatus !== "VALID"
            ? "REVIEW"
            : "PASS",

        issues,

        provenance:
          provenanceFor(document),
      };

      /*
       * An inconsistent source combination is never silently
       * canonicalized as a known question type. Preserve its
       * semantic material under UNKNOWN + REVIEW.
       */
      if (semanticIssueCodes.length) {
        return {
          ...base,

          questionType:
            "UNKNOWN",

          ...(normalized.trueFalseItems.length
            ? {
                trueFalseItems:
                  normalized.trueFalseItems,
              }
            : {}),

          ...(normalized.shortAnswer
            ? {
                shortAnswer:
                  normalized.shortAnswer,
              }
            : {}),

          ...(normalized.subquestions.length
            ? {
                subquestions:
                  normalized.subquestions,
              }
            : {}),
        } satisfies QuestionIR;
      }

      switch (normalized.type) {
        case "MULTIPLE_CHOICE":
          return {
            ...base,
            questionType:
              "MULTIPLE_CHOICE",
          } satisfies QuestionIR;

        case "TRUE_FALSE":
          return {
            ...base,
            questionType:
              "TRUE_FALSE",
            trueFalseItems:
              normalized.trueFalseItems,
          } satisfies QuestionIR;

        case "SHORT_ANSWER":
          return {
            ...base,
            questionType:
              "SHORT_ANSWER",

            ...(normalized.shortAnswer
              ? {
                  shortAnswer:
                    normalized.shortAnswer,
                }
              : {}),
          } satisfies QuestionIR;

        case "ESSAY":
          return {
            ...base,
            questionType:
              "ESSAY",
            subquestions:
              normalized.subquestions,
          } satisfies QuestionIR;

        case "UNKNOWN":
        default:
          return {
            ...base,
            questionType:
              "UNKNOWN",

            ...(normalized.trueFalseItems.length
              ? {
                  trueFalseItems:
                    normalized.trueFalseItems,
                }
              : {}),

            ...(normalized.shortAnswer
              ? {
                  shortAnswer:
                    normalized.shortAnswer,
                }
              : {}),

            ...(normalized.subquestions.length
              ? {
                  subquestions:
                    normalized.subquestions,
                }
              : {}),
          } satisfies QuestionIR;
      }
    });

  return disambiguateQuestionIrIds(
    questions,
    candidates,
  );
}
