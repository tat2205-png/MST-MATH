import type {
  DocumentQuestionCandidate,
  QuestionObject,
} from "./types.js";

import type {
  QuestionIR,
} from "./contracts.js";

function counts(
  values: readonly { id: string }[],
): Map<string, number> {
  const result = new Map<string, number>();

  for (const value of values) {
    result.set(
      value.id,
      (result.get(value.id) ?? 0) + 1,
    );
  }

  return result;
}

function collisionId(
  originalId: string,
  candidate: DocumentQuestionCandidate | undefined,
  index: number,
): string {
  return `${originalId}-${candidate?.id ?? `candidate-${index + 1}`}`;
}

export function disambiguateQuestionObjectIds(
  questions: readonly QuestionObject[],
  candidates: readonly DocumentQuestionCandidate[],
): QuestionObject[] {
  const duplicateCounts = counts(questions);

  return questions.map((question, index) => {
    if ((duplicateCounts.get(question.id) ?? 0) <= 1) {
      return question;
    }

    const id = collisionId(
      question.id,
      candidates[index],
      index,
    );

    return {
      ...question,
      id,

      figureAssociations:
        question.figureAssociations.map(
          (association) => ({
            ...association,
            questionId: id,
          }),
        ),
    };
  });
}

export function disambiguateQuestionIrIds<
  T extends QuestionIR,
>(
  questions: readonly T[],
  candidates: readonly DocumentQuestionCandidate[],
): T[] {
  const duplicateCounts = counts(questions);

  return questions.map((question, index) => {
    if ((duplicateCounts.get(question.id) ?? 0) <= 1) {
      return question;
    }

    const id = collisionId(
      question.id,
      candidates[index],
      index,
    );

    return {
      ...question,
      id,

      issues: question.issues.map((issue) =>
        issue.objectId === question.id
          ? { ...issue, objectId: id }
          : issue,
      ),
    } as T;
  });
}