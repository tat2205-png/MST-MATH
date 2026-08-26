import { EXAM_QA_ISSUE_CODES } from "./issue-codes.js";
import type { NormalizedExam, QAIssue } from "./types.js";

export function validateExamStructure(exam: NormalizedExam): QAIssue[] {
  const issues: QAIssue[] = [];
  for (const section of exam.sections) {
    const questions = exam.questions.filter((question) => question.section === section.sectionId);
    if (section.expectedQuestionCount !== undefined && questions.length !== section.expectedQuestionCount) issues.push({ code: EXAM_QA_ISSUE_CODES.EXAM_STRUCTURE_SECTION_COUNT_MISMATCH, category: "STRUCTURE", severity: "ERROR", message: `Section ${section.sectionId} expected ${section.expectedQuestionCount} questions but found ${questions.length}.`, location: { sectionId: section.sectionId }, details: { expectedCount: section.expectedQuestionCount, actualCount: questions.length } });
    for (const question of questions) if (!section.allowedQuestionTypes.includes(question.type)) issues.push({ code: EXAM_QA_ISSUE_CODES.EXAM_STRUCTURE_QUESTION_TYPE_INVALID, category: "STRUCTURE", severity: "BLOCKER", message: `Question type ${question.type} is not allowed in section ${section.sectionId}.`, questionId: question.id, location: { sectionId: section.sectionId, field: "type" } });
    const byNumber = new Map<number, typeof questions>();
    for (const question of questions) if (Number.isInteger(question.questionNumber) && Number(question.questionNumber) > 0) byNumber.set(question.questionNumber!, [...(byNumber.get(question.questionNumber!) ?? []), question]);
    for (const [number, duplicates] of byNumber) if (duplicates.length > 1) duplicates.forEach((question) => issues.push({ code: EXAM_QA_ISSUE_CODES.QUESTION_NUMBER_DUPLICATE, category: "STRUCTURE", severity: "BLOCKER", message: `Question number ${number} is duplicated in section ${section.sectionId}.`, questionId: question.id, location: { sectionId: section.sectionId, field: "questionNumber" }, details: { questionNumber: number } }));
  }
  return issues;
}

export const VIETNAMESE_HIGH_SCHOOL_12_4_6 = [
  { sectionId: "PART_I", label: "PHẦN I", questionStart: 1, questionEnd: 12, expectedQuestionCount: 12, allowedQuestionTypes: ["SINGLE_CHOICE" as const], markerMode: "SINGLE_CHOICE" as const, expectedOptionCount: 4 },
  { sectionId: "PART_II", label: "PHẦN II", questionStart: 1, questionEnd: 4, expectedQuestionCount: 4, allowedQuestionTypes: ["TRUE_FALSE" as const], markerMode: "TRUE_FALSE" as const, expectedStatementCount: 4 },
  { sectionId: "PART_III", label: "PHẦN III", questionStart: 1, questionEnd: 6, expectedQuestionCount: 6, allowedQuestionTypes: ["SHORT_ANSWER" as const], markerMode: "SHORT_ANSWER" as const },
];

