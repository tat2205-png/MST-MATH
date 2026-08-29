import type { ExamQuestionOption, ExamQuestionType, NormalizedExamQuestion, TrueFalseStatement } from "../types.js";

export interface QuestionBankRecord {
  id?: unknown; sourceId?: unknown; page?: unknown; index?: unknown; section?: unknown; number?: unknown;
  type?: unknown; stem?: unknown; options?: unknown; statements?: unknown; answer?: unknown; metadata?: unknown;
  [key: string]: unknown;
}

const knownTypes = new Set<ExamQuestionType>(["SINGLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY", "UNKNOWN"]);
const text = (value: unknown) => typeof value === "string" ? value : undefined;
const finiteNumber = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : undefined;

export function adaptQuestionBankRecord(record: QuestionBankRecord): NormalizedExamQuestion {
  const type = typeof record.type === "string" && knownTypes.has(record.type as ExamQuestionType) ? record.type as ExamQuestionType : "UNKNOWN";
  return {
    id: text(record.id), sourceId: text(record.sourceId), sourcePage: finiteNumber(record.page), sourceIndex: finiteNumber(record.index),
    section: text(record.section), questionNumber: finiteNumber(record.number), type, stem: text(record.stem),
    options: Array.isArray(record.options) ? record.options.filter((item): item is ExamQuestionOption => typeof item === "object" && item !== null && typeof (item as ExamQuestionOption).key === "string" && typeof (item as ExamQuestionOption).text === "string") : undefined,
    trueFalseStatements: Array.isArray(record.statements) ? record.statements.filter((item): item is TrueFalseStatement => typeof item === "object" && item !== null && typeof (item as TrueFalseStatement).text === "string") : undefined,
    expectedAnswer: record.answer,
    metadata: { adapter: "QUESTION_BANK_GENERIC_V1", sourceMetadata: record.metadata, unmappedSource: record },
  };
}

