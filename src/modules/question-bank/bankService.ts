import { validateQuestion as runExamQa } from "../exam-qa/engine.js";
import { AssetRegistry } from "./assets.js";
import { detectDuplicate } from "./duplicate.js";
import { toExamQuestion } from "./examAdapter.js";
import { ingestDocxQuestions, ingestDocxQuestionsForRuntime } from "./pipeline.js";
import type { DuplicateResult, QuestionBankRepository, QuestionBankSnapshot, QuestionObject } from "./types.js";
import { validateQuestion } from "./schema.js";
import { analyzeRelation, familyIdFor } from "./relations.js";
export interface ImportDiagnostic { code: string; questionId?: string; severity: "INFO" | "WARNING" | "ERROR"; details?: Record<string, unknown> }
export interface BankImportResult { imported: QuestionObject[]; duplicates: DuplicateResult[]; diagnostics: ImportDiagnostic[]; snapshot: QuestionBankSnapshot }
function statusQuestion(question: QuestionObject): QuestionObject { const structural = validateQuestion(question); const exam = runExamQa(toExamQuestion(question)); const issueCodes = exam.issues.map(x => x.code); const invalid = structural.some(x => x.level === "FAIL") || exam.status === "BLOCKED" || exam.status === "NOT_TESTED"; return { ...question, schemaVersion: 1, validationStatus: invalid ? "INVALID" : structural.some(x => x.level === "WARNING") || exam.status === "REVIEW_REQUIRED" ? "REVIEW_REQUIRED" : "VALID", bankStatus: invalid ? "QUARANTINED" : "REVIEW", examQa: { status: exam.status, issueCodes }, warnings: [...new Set([...question.warnings, ...structural.filter(x => x.level !== "PASS").map(x => x.code), ...issueCodes])] }; }
export class QuestionBankService {
  constructor(private readonly repository: QuestionBankRepository) {}
  importDocx(bytes: Uint8Array, name: string): BankImportResult { return this.importPipeline(ingestDocxQuestions(bytes, name)); }
  async importDocxForRuntime(bytes: Uint8Array, name: string): Promise<BankImportResult> { return this.importPipeline(await ingestDocxQuestionsForRuntime(bytes, name)); }
  private importPipeline(pipeline: ReturnType<typeof ingestDocxQuestions>): BankImportResult {
    const before = this.repository.load(); const questions = [...before.questions]; const orphanFigures = [...before.orphanFigures]; const registry = new AssetRegistry(); [...questions.flatMap(q => q.figures), ...orphanFigures].forEach(f => registry.register(f));
    const imported: QuestionObject[] = [], duplicates: DuplicateResult[] = [], diagnostics: ImportDiagnostic[] = []; const relations = before.relations ?? { schemaVersion: 1 as const, relations: [], families: [], duplicateAudit: [] };
    for (const source of pipeline.questions) {
      const question = statusQuestion(source); const duplicate = detectDuplicate(question, questions); const candidates = questions.map(existing => analyzeRelation(existing, question)).filter(item => !item.relations.includes("NONE")); const relation = candidates.find(item => item.relations.includes("EXACT_DUPLICATE")) ?? candidates[0]; const match = relation ? questions.find(q => q.id === relation.sourceQuestionId) : duplicate.matchedId ? questions.find(q => q.id === duplicate.matchedId) : undefined; relations.relations.push(...candidates); duplicates.push(duplicate);
      if (relation?.relations.includes("EXACT_DUPLICATE")) { if (match) relations.duplicateAudit.push({ removedQuestionId: question.id, keptQuestionId: match.id, relation: "EXACT_DUPLICATE", sourceDocument: question.source.document, sourceHash: question.source.sourceHash, sourceLocations: question.source.sourceLocations, evidence: relation.evidence, policyVersion: "PIMATH_QUESTION_RELATIONS_V1" }); diagnostics.push({ code: "DUPLICATE_QUESTION", questionId: question.id, severity: "INFO", details: { matchedId: match.id } }); continue; }
      question.duplicateState = relation?.relations.includes("POSSIBLE_DUPLICATE") ? "POSSIBLE_DUPLICATE" : duplicate.status; if (relation?.relations.includes("SOURCE_CONFLICT")) diagnostics.push({ code: "SOURCE_CONFLICT", questionId: question.id, severity: "WARNING", details: { matchedId: match?.id } }); question.figures.forEach(figure => registry.register(figure)); if (question.bankStatus === "QUARANTINED") diagnostics.push({ code: "INVALID_QUESTION_STRUCTURE", questionId: question.id, severity: "ERROR" }); questions.push(question); imported.push(question);
      if (relation?.relations.includes("PARAMETRIC_VARIANT") && match) { const familyId = familyIdFor(match, question); const family = relations.families.find(f => f.familyId === familyId) ?? { familyId, memberQuestionIds: [match.id], relationEvidence: relation.evidence, schemaVersion: 1 as const }; if (!family.memberQuestionIds.includes(question.id)) family.memberQuestionIds.push(question.id); if (!relations.families.includes(family)) relations.families.push(family); }
    }
    for (const association of pipeline.figureAssociations.filter(x => x.status === "UNASSIGNED")) { const figure = pipeline.document.figures.find(x => x.id === association.figureId); if (figure && !orphanFigures.some(x => x.id === figure.id)) { registry.register(figure); orphanFigures.push(figure); diagnostics.push({ code: "UNRESOLVED_FIGURE", severity: "WARNING", details: { figureId: figure.id } }); } }
    const snapshot: QuestionBankSnapshot = { schemaVersion: 1, questions, orphanFigures, relations }; this.repository.replace(snapshot); return { imported, duplicates, diagnostics, snapshot: this.repository.load() };
  }
}
