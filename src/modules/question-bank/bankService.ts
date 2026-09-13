import { validateQuestion as runExamQa } from "../exam-qa/engine.js";
import { AssetRegistry } from "./assets.js";
import { detectDuplicate } from "./duplicate.js";
import { toExamQuestion } from "./examAdapter.js";
import { ingestDocxQuestions, ingestDocxQuestionsForRuntime } from "./pipeline.js";
import type { DocumentIR, DuplicateResult, FigureRecord, QuestionBankRepository, QuestionBankSnapshot, QuestionObject } from "./types.js";
import { validateQuestion } from "./schema.js";
export interface ImportDiagnostic { code: string; questionId?: string; severity: "INFO" | "WARNING" | "ERROR"; details?: Record<string, unknown> }
export interface BankImportResult { imported: QuestionObject[]; duplicates: DuplicateResult[]; diagnostics: ImportDiagnostic[]; snapshot: QuestionBankSnapshot; document: DocumentIR }
function statusQuestion(question: QuestionObject): QuestionObject {
  const structural = validateQuestion(question); const exam = runExamQa(toExamQuestion(question)); const issueCodes = exam.issues.map((x) => x.code);
  const invalid = structural.some((x) => x.level === "FAIL") || exam.status === "BLOCKED" || exam.status === "NOT_TESTED";
  return { ...question, schemaVersion: 1, validationStatus: invalid ? "INVALID" : structural.some((x) => x.level === "WARNING") || exam.status === "REVIEW_REQUIRED" ? "REVIEW_REQUIRED" : "VALID", bankStatus: invalid ? "QUARANTINED" : "REVIEW", examQa: { status: exam.status, issueCodes }, warnings: [...new Set([...question.warnings, ...structural.filter((x) => x.level !== "PASS").map((x) => x.code), ...issueCodes])] };
}
export class QuestionBankService {
  constructor(private readonly repository: QuestionBankRepository) {}
  importDocx(bytes: Uint8Array, name: string): BankImportResult {
    return this.importPipeline(ingestDocxQuestions(bytes, name));
  }
  async importDocxForRuntime(bytes: Uint8Array, name: string): Promise<BankImportResult> { return this.importPipeline(await ingestDocxQuestionsForRuntime(bytes, name)); }
  private importPipeline(pipeline: ReturnType<typeof ingestDocxQuestions>): BankImportResult {
    const before = this.repository.load(); const questions = [...before.questions]; const orphanFigures = [...before.orphanFigures]; const registry = new AssetRegistry(); [...questions.flatMap((q) => q.figures), ...orphanFigures].forEach((f) => registry.register(f));
    const imported: QuestionObject[] = [], duplicates: DuplicateResult[] = [], diagnostics: ImportDiagnostic[] = [];
    for (const source of pipeline.questions) { const question = statusQuestion(source); const duplicate = detectDuplicate(question, questions); duplicates.push(duplicate); if (duplicate.status === "DUPLICATE") { diagnostics.push({ code: "DUPLICATE_QUESTION", questionId: question.id, severity: "INFO", details: { matchedId: duplicate.matchedId } }); continue; } question.duplicateState = duplicate.status; if (duplicate.status === "POSSIBLE_DUPLICATE") diagnostics.push({ code: "POSSIBLE_DUPLICATE", questionId: question.id, severity: "WARNING", details: { matchedId: duplicate.matchedId } }); question.figures.forEach((figure) => registry.register(figure)); if (question.bankStatus === "QUARANTINED") diagnostics.push({ code: "INVALID_QUESTION_STRUCTURE", questionId: question.id, severity: "ERROR" }); questions.push(question); imported.push(question); }
    for (const association of pipeline.figureAssociations.filter((x) => x.status === "UNASSIGNED")) { const figure = pipeline.document.figures.find((x) => x.id === association.figureId); if (figure && !orphanFigures.some((x) => x.id === figure.id)) { registry.register(figure); orphanFigures.push(figure); diagnostics.push({ code: "UNRESOLVED_FIGURE", severity: "WARNING", details: { figureId: figure.id } }); } }
    const snapshot: QuestionBankSnapshot = { schemaVersion: 1, questions, orphanFigures }; this.repository.replace(snapshot); return { imported, duplicates, diagnostics, snapshot: this.repository.load(), document: pipeline.document };
  }
}
