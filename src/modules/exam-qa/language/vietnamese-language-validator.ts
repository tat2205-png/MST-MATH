import type { NormalizedExamQuestion, QAIssue } from "../types.js";
import { validateVietnameseTypography } from "./vietnamese-typography-validator.js";

interface QuestionTextField { field: string; text: string }

function questionTextFields(question: NormalizedExamQuestion): QuestionTextField[] {
  const fields: QuestionTextField[] = [];
  if (typeof question.stem === "string") fields.push({ field: "stem", text: question.stem });
  for (const option of question.options ?? []) fields.push({ field: `option:${option.key}`, text: option.text });
  (question.trueFalseStatements ?? []).forEach((statement, index) => fields.push({ field: `statement:${statement.key ?? index + 1}`, text: statement.text }));
  for (const [key, field] of [["expectedAnswerDisplay", "expectedAnswer"], ["sectionLabel", "sectionLabel"], ["displayText", "metadata.displayText"]] as const) {
    const value = question.metadata?.[key];
    if (typeof value === "string") fields.push({ field, text: value });
  }
  return fields;
}

export function validateVietnameseQuestionLanguage(question: NormalizedExamQuestion): QAIssue[] {
  return questionTextFields(question).flatMap(({ field, text }) => validateVietnameseTypography(text, { questionId: question.id, field, sectionId: question.section, sourcePage: question.sourcePage, sourceIndex: question.sourceIndex }));
}

