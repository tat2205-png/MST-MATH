import type { DocumentIR, FigureAssociation, QuestionObject } from "./types.js";
export function associateFigures(document: DocumentIR, questions: QuestionObject[]): FigureAssociation[] {
  const assigned = new Map(questions.flatMap((q) => q.figureAssociations.map((a) => [a.figureId, a] as const))); return document.figures.map((figure) => assigned.get(figure.id) ?? { figureId: figure.id, status: "UNASSIGNED", confidence: 0, evidence: ["NO_STRUCTURAL_QUESTION_OWNERSHIP"] });
}
