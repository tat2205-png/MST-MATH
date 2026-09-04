import type {
  FigureRecord,
  QuestionObject,
  SourceProvenance,
} from "./types.js";

import type {
  QuestionPackage,
} from "./contracts.js";

export function questionPackageToQuestionObject(
  pkg: QuestionPackage,
  figures: FigureRecord[] = [],
): QuestionObject {
  const source: SourceProvenance = {
    document:
      pkg.provenance.sourceFile,

    sourceHash:
      pkg.provenance.sourceSha256 ?? "",

    blockIds:
      pkg.sourceObjectIds,

    sourceLocations:
      pkg.extractionIssues.flatMap(
        (issue) =>
          issue.sourceAnchor?.partName
            ? [
                issue.sourceAnchor.partName,
              ]
            : [],
      ),
  };

  return {
    schemaVersion: 1,

    id: pkg.id,
    source,

    index:
      typeof pkg.question.questionNumber === "number"
        ? pkg.question.questionNumber
        : undefined,

    type:
      pkg.question.questionType,

    stem:
      pkg.question.stem,

    options:
      pkg.question.options,

    trueFalseItems:
      pkg.question.trueFalseItems ?? [],

    ...(pkg.question.shortAnswer
      ? {
          shortAnswer:
            pkg.question.shortAnswer,
        }
      : {}),

    ...(pkg.question.answer
      ? {
          answer:
            pkg.question.answer,
        }
      : {}),

    ...(pkg.question.solution
      ? {
          solution:
            pkg.question.solution,
        }
      : {}),

    subquestions:
      pkg.question.subquestions ?? [],

    figures:
      figures.filter(
        (figure) =>
          pkg.question.assetIds.includes(
            figure.id,
          ),
      ),

    figureAssociations: [],

    metadata:
      Object.fromEntries(
        Object.entries(
          pkg.metadata,
        ).map(
          ([key, value]) => [
            key,
            String(value),
          ],
        ),
      ),

    warnings:
      pkg.extractionIssues.map(
        (issue) =>
          issue.code,
      ),

    validationStatus:
      pkg.qaStatus === "PASS"
        ? "VALID"
        : "REVIEW_REQUIRED",

    bankStatus:
      pkg.qaStatus === "QUARANTINED"
        ? "QUARANTINED"
        : "REVIEW",
  };
}
