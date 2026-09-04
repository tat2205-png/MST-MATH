import { createHash } from "node:crypto";
import type {
  QuestionObject,
  QuestionRelation,
  QuestionRelationType,
  QuestionBankRelations,
} from "./types.js";
import {
  canonicalQuestionPayload,
  canonicalizeForRelation,
  questionFingerprint,
} from "./duplicate.js";

const content = (question: QuestionObject, answers = false) =>
  JSON.stringify(
    canonicalizeForRelation(canonicalQuestionPayload(question, answers)),
  ).normalize("NFC");

export const relationFingerprint = (question: QuestionObject) =>
  questionFingerprint(question);

export function relationTypesForQuestion(
  index: QuestionBankRelations | undefined,
  id: string,
): QuestionRelationType[] {
  return [
    ...new Set(
      (index?.relations ?? [])
        .filter(
          (relation) =>
            relation.sourceQuestionId === id || relation.targetQuestionId === id,
        )
        .flatMap((relation) => relation.relations),
    ),
  ];
}

export const structureFingerprint = (question: QuestionObject) =>
  createHash("sha256")
    .update(
      JSON.stringify({
        type: question.type,
        options: question.options.map((item) => item.label),
        trueFalse: question.trueFalseItems.map((item) => item.label),
        subquestions: question.subquestions.map((item) => item.label),
      }).normalize("NFC"),
    )
    .digest("hex");

/**
 * A stable key for the relation rule that compares question semantics while
 * intentionally ignoring MCQ option payload differences. Exported so import
 * indexing can narrow candidates without duplicating relation semantics.
 */
export const optionlessQuestionKey = (question: QuestionObject) =>
  JSON.stringify({
    type: question.type,
    stem: question.stem,
    shortAnswer: question.shortAnswer,
    subquestions: question.subquestions,
    trueFalseItems: question.trueFalseItems.map((item) => item.label),
  }).normalize("NFC");

const confirmedFigureKey = (question: QuestionObject) =>
  question.figureAssociations
    .filter((association) => association.status === "CONFIRMED")
    .map((association) => association.figureId)
    .sort()
    .join("|");

const mathStructure = (
  block: Extract<QuestionObject["stem"][number], { type: "math" }>,
) =>
  (block.math.latex ?? block.math.normalized ?? block.math.sourceRaw).replace(
    /[0-9]+(?:\.[0-9]+)?/gu,
    "#",
  );

const parameterStructure = (question: QuestionObject) =>
  JSON.stringify(
    canonicalizeForRelation({
      type: question.type,
      stem: question.stem.map((block) =>
        block.type === "math"
          ? {
              type: "math",
              sourceType: block.math.sourceType,
              parseStatus: block.math.parseStatus,
              structure: mathStructure(block),
            }
          : block,
      ),
      options: question.options.map((option) => ({
        label: option.label,
        content: option.content.map((block) =>
          block.type === "math"
            ? {
                type: "math",
                sourceType: block.math.sourceType,
                parseStatus: block.math.parseStatus,
                structure: mathStructure(block),
              }
            : block,
        ),
      })),
      trueFalseItems: question.trueFalseItems,
      shortAnswer: question.shortAnswer,
      subquestions: question.subquestions,
    }),
  );

export const variantStructureFingerprint = (question: QuestionObject) =>
  createHash("sha256")
    .update(parameterStructure(question).normalize("NFC"))
    .digest("hex");

export function analyzeRelation(
  a: QuestionObject,
  b: QuestionObject,
): QuestionRelation {
  if (
    a.source.sourceHash === b.source.sourceHash &&
    a.index !== undefined &&
    a.index === b.index &&
    content(a) !== content(b)
  ) {
    return {
      sourceQuestionId: a.id,
      targetQuestionId: b.id,
      relations: ["SOURCE_CONFLICT"],
      evidence: ["STABLE_SOURCE_IDENTITY_CONTENT_CONFLICT"],
      reviewRequired: true,
    };
  }

  const sameCore = content(a) === content(b);
  const sameFull = content(a, true) === content(b, true);

  if (sameCore && sameFull) {
    return {
      sourceQuestionId: a.id,
      targetQuestionId: b.id,
      relations: ["EXACT_DUPLICATE"],
      evidence: ["DETERMINISTIC_CANONICAL_CONTENT_MATCH"],
    };
  }

  if (sameCore && !sameFull) {
    return {
      sourceQuestionId: a.id,
      targetQuestionId: b.id,
      relations: ["SOURCE_CONFLICT", "POSSIBLE_DUPLICATE"],
      evidence: ["CANONICAL_QUESTION_MATCH_ANSWER_OR_SOLUTION_CONFLICT"],
      reviewRequired: true,
    };
  }

  if (
    optionlessQuestionKey(a) === optionlessQuestionKey(b) &&
    JSON.stringify(a.options) !== JSON.stringify(b.options)
  ) {
    return {
      sourceQuestionId: a.id,
      targetQuestionId: b.id,
      relations: ["SOURCE_CONFLICT", "POSSIBLE_DUPLICATE"],
      evidence: ["CANONICAL_QUESTION_MATCH_OPTION_CONFLICT"],
      reviewRequired: true,
    };
  }

  if (
    parameterStructure(a) === parameterStructure(b) &&
    relationFingerprint(a) !== relationFingerprint(b)
  ) {
    return {
      sourceQuestionId: a.id,
      targetQuestionId: b.id,
      relations: ["PARAMETRIC_VARIANT"],
      evidence: ["SAME_CANONICAL_STRUCTURE_DIFFERENT_CANONICAL_MATH"],
    };
  }

  const aFigures = confirmedFigureKey(a);
  const bFigures = confirmedFigureKey(b);
  if (aFigures && aFigures === bFigures) {
    return {
      sourceQuestionId: a.id,
      targetQuestionId: b.id,
      relations: ["SHARED_FIGURE"],
      evidence: ["CONFIRMED_FIGURE_ID_MATCH"],
    };
  }

  return {
    sourceQuestionId: a.id,
    targetQuestionId: b.id,
    relations: ["NONE"],
    evidence: [],
  };
}

export function familyIdFor(
  question: QuestionObject,
  _peer: QuestionObject,
) {
  return `FAMILY_${variantStructureFingerprint(question).slice(0, 16)}`;
}
