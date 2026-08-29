import { EXAM_QUESTION_TYPES, type NormalizedExam, type NormalizedExamQuestion } from "./types.js";

export interface SchemaValidationResult { valid: boolean; errors: string[] }
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

export function validateNormalizedQuestionSchema(value: unknown): SchemaValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) return { valid: false, errors: ["Question must be an object."] };
  if (!EXAM_QUESTION_TYPES.includes(value.type as NormalizedExamQuestion["type"])) errors.push("Question.type is invalid.");
  if (value.options !== undefined && !Array.isArray(value.options)) errors.push("Question.options must be an array when provided.");
  if (value.trueFalseStatements !== undefined && !Array.isArray(value.trueFalseStatements)) errors.push("Question.trueFalseStatements must be an array when provided.");
  if (value.questionNumber !== undefined && typeof value.questionNumber !== "number") errors.push("Question.questionNumber must be a number when provided.");
  return { valid: errors.length === 0, errors };
}

export function validateNormalizedExamSchema(value: unknown): SchemaValidationResult {
  if (!isRecord(value)) return { valid: false, errors: ["Exam must be an object."] };
  const errors: string[] = [];
  if (!Array.isArray(value.questions)) errors.push("Exam.questions must be an array.");
  if (!Array.isArray(value.sections)) errors.push("Exam.sections must be an array.");
  if (Array.isArray(value.sections)) value.sections.forEach((section, index) => {
    if (!isRecord(section) || typeof section.sectionId !== "string" || !Array.isArray(section.allowedQuestionTypes) || typeof section.markerMode !== "string") errors.push(`Exam.sections[${index}] is malformed.`);
  });
  return { valid: errors.length === 0, errors };
}

export function isNormalizedExam(value: unknown): value is NormalizedExam { return validateNormalizedExamSchema(value).valid; }

