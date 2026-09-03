import path from "node:path";
import type { Assessment, AssessmentAnswerManifest, AssessmentSpec } from "../../src/modules/question-bank/assessment.js";
import { AssessmentService } from "../../src/modules/question-bank/assessment.js";
import { ClassroomGameService, type GameSession, type GameSpec } from "../../src/modules/classroom-game/game.js";
import { QuestionBankService } from "../../src/modules/question-bank/bankService.js";
import { QuestionBankExportService, type ExportAudience, type ExportFormat } from "../../src/modules/question-bank/export.js";
import { JsonQuestionBankRepository } from "../../src/modules/question-bank/repository.js";
import { QuestionSearchService } from "../../src/modules/question-bank/search.js";
import type { FigureRecord, QuestionBankRepository, QuestionObject, QuestionSearchQuery } from "../../src/modules/question-bank/types.js";
import { preflightDocx, type WordPreflightReport } from "../../src/modules/word-preflight/index.js";
import type {
  AssessmentWorkflowResult,
  ExportWorkflowRequest,
  ExportWorkflowResult,
  GameWorkflowView,
  ImportWorkflowResult,
  QuestionQueryResponse,
  TeacherQuestion,
  VideoWorkflowResult,
  WorkflowSummary,
} from "../../src/services/teacherWorkflowTypes.js";
import { QuestionBankStudioService } from "../integrations/questionBankStudio.js";
import { StudioEngineRegistry } from "../studio/engineRegistry.js";

type StoredAssessment = { assessment: Assessment; answerManifest: AssessmentAnswerManifest };
type StoredGame = { service: ClassroomGameService; session: GameSession };
type ImportDiagnostic = ImportWorkflowResult["diagnostics"][number];

function figureForClient(figure: FigureRecord): TeacherQuestion["figures"][number] {
  const { bytes, ...safe } = figure;
  const dataUrl = bytes?.length && ["image/png", "image/jpeg", "image/svg+xml", "image/gif"].includes(figure.mimeType ?? "")
    ? `data:${figure.mimeType};base64,${Buffer.from(bytes).toString("base64")}`
    : undefined;
  return { ...safe, dataUrl };
}

function questionForClient(question: QuestionObject): TeacherQuestion {
  return { ...structuredClone(question), figures: question.figures.map(figureForClient) };
}

function wordPreflightDiagnostics(report: WordPreflightReport): ImportDiagnostic[] {
  const diagnostics: ImportDiagnostic[] = [{
    code: "WORD_PREFLIGHT_PASS",
    severity: report.riskLevel === "HIGH" ? "WARNING" : "INFO",
    details: {
      version: report.version,
      healthScore: report.healthScore,
      riskLevel: report.riskLevel,
      sourceSha256: report.inputSha256,
      safeCleanAvailable: report.safeCleanAvailable,
      metrics: report.metrics,
    },
  }];
  for (const issue of report.issues) {
    diagnostics.push({
      code: issue.code,
      severity: issue.severity,
      details: { message: issue.message, count: issue.count },
    });
  }
  if (report.safeCleanAvailable) {
    diagnostics.push({
      code: "WORD_SAFE_CLEAN_AVAILABLE",
      severity: "INFO",
      details: {
        endpoint: "/api/word-preflight/safe-clean",
        sourceOverwrite: false,
        protectedFingerprint: report.protectedFingerprint,
      },
    });
  }
  return diagnostics;
}

function preflightImportBytes(bytes: Uint8Array, fileName: string): ImportDiagnostic[] {
  const report = preflightDocx(bytes, path.basename(fileName));
  const blockers = report.issues.filter((issue) => issue.severity === "ERROR");
  if (blockers.length) throw new Error(`INVALID_DOCUMENT: Word preflight blocked this file (${blockers.map((issue) => issue.code).join(", ")}).`);
  return wordPreflightDiagnostics(report);
}

export class TeacherWorkflowService {
  private readonly bank: QuestionBankService;
  private readonly search: QuestionSearchService;
  private readonly assessment: AssessmentService;
  private readonly exporter = new QuestionBankExportService();
  private readonly studio = new QuestionBankStudioService();
  private readonly assessments = new Map<string, StoredAssessment>();
  private readonly games = new Map<string, StoredGame>();
  private readonly outputDirectory: string;

  constructor(private readonly repository: QuestionBankRepository = new JsonQuestionBankRepository(path.join(process.cwd(), "render_output", "teacher-workflow", "question-bank.json"))) {
    this.bank = new QuestionBankService(repository);
    this.search = new QuestionSearchService(repository);
    this.assessment = new AssessmentService(repository);
    this.outputDirectory = path.join(process.cwd(), "render_output", "teacher-workflow", "exports");
  }

  summary(): WorkflowSummary {
    const questions = this.repository.load().questions;
    const count = (status: QuestionObject["bankStatus"]) => questions.filter((question) => question.bankStatus === status).length;
    const studioEnabled = StudioEngineRegistry.featureFlagEnabled();
    return {
      state: questions.length ? count("REVIEW") || count("QUARANTINED") ? "REVIEW_REQUIRED" : "BANK_READY" : "EMPTY",
      counts: { TOTAL: questions.length, APPROVED: count("APPROVED"), REVIEW: count("REVIEW"), QUARANTINED: count("QUARANTINED") },
      readiness: {
        source: "MAS_INT_01_RUNTIME_READINESS",
        requiredRuntimeBlockers: "NONE",
        actions: {
          assessment: { ready: true, reason: "Question Bank and Assessment services are REQUIRED_PASS." },
          game: { ready: true, reason: "Classroom Game service is integrated and ready." },
          video: { ready: studioEnabled, reason: studioEnabled ? "Studio Orchestrator, Manim, and Local Render Bridge are REQUIRED_PASS." : "Studio Orchestrator đang tắt bởi feature flag. Dùng npm run studio cho quy trình chính thức." },
          export: { ready: true, reason: "JSON, LaTeX, DOCX, and PDF exporters are REQUIRED_PASS." },
        },
      },
      supportedImports: ["DOCX"],
      supportedExports: ["JSON", "LATEX", "DOCX", "PDF"],
    };
  }

  importDocx(base64: string, fileName: string): ImportWorkflowResult {
    if (!fileName.toLocaleLowerCase().endsWith(".docx")) throw new Error("UNSUPPORTED_FILE: Chỉ hỗ trợ tệp DOCX đã được kiểm định.");
    const bytes = new Uint8Array(Buffer.from(base64, "base64"));
    if (!bytes.length) throw new Error("INVALID_DOCUMENT: Tệp DOCX rỗng hoặc không hợp lệ.");
    const preflightDiagnostics = preflightImportBytes(bytes, fileName);
    const result = this.bank.importDocx(bytes, path.basename(fileName));
    return { imported: result.imported.map(questionForClient), diagnostics: [...preflightDiagnostics, ...result.diagnostics], summary: this.summary() };
  }

  async importDocxForRuntime(base64: string, fileName: string): Promise<ImportWorkflowResult> {
    if (!fileName.toLocaleLowerCase().endsWith(".docx")) throw new Error("UNSUPPORTED_FILE: Chỉ hỗ trợ tệp DOCX đã được kiểm định.");
    const bytes = new Uint8Array(Buffer.from(base64, "base64")); if (!bytes.length) throw new Error("INVALID_DOCUMENT: Tệp DOCX rỗng hoặc không hợp lệ.");
    const preflightDiagnostics = preflightImportBytes(bytes, fileName);
    const result = await this.bank.importDocxForRuntime(bytes, path.basename(fileName)); return { imported: result.imported.map(questionForClient), diagnostics: [...preflightDiagnostics, ...result.diagnostics], summary: this.summary() };
  }

  approve(ids: string[]): WorkflowSummary {
    const snapshot = this.repository.load();
    const requested = new Set(ids);
    for (const question of snapshot.questions) {
      if (!requested.has(question.id)) continue;
      if (question.bankStatus !== "REVIEW" || question.validationStatus === "INVALID" || question.examQa?.status === "BLOCKED" || question.examQa?.status === "NOT_TESTED") {
        throw new Error(`APPROVAL_BLOCKED:${question.id}: Không thể duyệt câu cách ly, cấu trúc INVALID hoặc Exam QA chưa đạt điều kiện xem xét.`);
      }
      question.bankStatus = "APPROVED";
    }
    this.repository.replace(snapshot);
    return this.summary();
  }

  query(query: QuestionSearchQuery): QuestionQueryResponse {
    const result = this.search.query(query);
    return { ...result, items: result.items.map(questionForClient) };
  }

  generateAssessment(spec: AssessmentSpec): AssessmentWorkflowResult | { diagnostics: unknown[]; queryPlan: unknown[] } {
    const result = this.assessment.generate({ ...spec, statuses: ["APPROVED"] });
    if ("diagnostics" in result) return { diagnostics: result.diagnostics, queryPlan: result.queryPlan };
    this.assessments.set(result.assessment.id, { assessment: result.assessment, answerManifest: result.answerManifest });
    return { assessment: result.assessment, questionIds: result.assessment.sections.flatMap((section) => section.questionRefs.map((ref) => ref.questionId)), queryPlan: result.queryPlan };
  }

  startGame(assessmentId: string): GameWorkflowView {
    const stored = this.assessments.get(assessmentId);
    if (!stored) throw new Error("ASSESSMENT_NOT_FOUND");
    const service = new ClassroomGameService(this.repository, stored.answerManifest);
    const spec: GameSpec = { seed: stored.assessment.seed, mode: "SEQUENTIAL", participants: ["Lớp học"], rounds: stored.assessment.sections.map((section) => ({ id: `round-${section.id}`, title: section.title, assessmentSectionIds: [section.id], pointsPerQuestion: section.pointsPerQuestion ?? 1 })) };
    const session = service.create(stored.assessment, spec);
    service.transition(session, "READY");
    service.transition(session, "ACTIVE");
    this.games.set(session.id, { service, session });
    return { session: structuredClone(session) };
  }

  gameAction(sessionId: string, action: "OPEN" | "CLOSE" | "COMPLETE_ROUND" | "NEXT_ROUND" | "SUBMIT", response?: string): GameWorkflowView {
    const stored = this.games.get(sessionId);
    if (!stored) throw new Error("GAME_SESSION_NOT_FOUND");
    const { service, session } = stored;
    let currentQuestion;
    if (action === "OPEN") {
      currentQuestion = service.studentQuestion(service.openQuestion(session, Date.now()));
      const source = this.search.getById(currentQuestion.id);
      const confirmed = new Set(source?.figureAssociations.filter((association) => association.status === "CONFIRMED" && association.questionId === source.id).map((association) => association.figureId) ?? []);
      currentQuestion.figures = currentQuestion.figures.filter((figure) => confirmed.has(figure.id));
    }
    else if (action === "SUBMIT") service.submit(session, "Lớp học", response ?? "", Date.now());
    else if (action === "CLOSE") service.closeQuestion(session);
    else if (action === "COMPLETE_ROUND") service.completeRound(session);
    else if (action === "NEXT_ROUND") service.nextRound(session);
    const result = session.state === "COMPLETE" ? service.result(session) : undefined;
    return { session: structuredClone(session), currentQuestion, result };
  }

  prepareVideo(questionId: string): VideoWorkflowResult {
    const question = this.search.getById(questionId);
    if (!question) throw new Error("QUESTION_NOT_FOUND");
    const result = this.studio.buildVideoJob(question);
    if ("status" in result) throw new Error(`${result.status}:${result.reasons.join(" ")}`);
    return { job: result.job, stages: ["PREPARING", "VERIFYING_MATH", "PLANNING_VISUAL", "RENDERING", "QA", "COMPLETE"] };
  }

  exportAssessment(request: ExportWorkflowRequest): ExportWorkflowResult {
    const stored = this.assessments.get(request.assessmentId);
    if (!stored) throw new Error("ASSESSMENT_NOT_FOUND");
    const result = this.exporter.deliver(stored.assessment, stored.answerManifest, this.repository, {
      audience: request.audience,
      formats: request.formats,
      includeAnswers: request.audience === "TEACHER" && request.includeAnswers,
      includeSolutions: request.audience === "TEACHER" && request.includeSolutions,
      includeMetadata: request.audience === "TEACHER",
      includeProvenance: request.audience === "TEACHER",
      assetMode: "REFERENCE",
      outputProfile: "NA_MATH_STANDARD",
      outputDirectory: this.outputDirectory,
      filename: request.filename,
    });
    if ("diagnostics" in result) throw new Error(result.diagnostics.map((diagnostic) => `${diagnostic.code}: ${diagnostic.message}`).join(" | "));
    return { assessmentId: request.assessmentId, audience: request.audience, artifacts: result.artifacts, questionIds: result.package.questionRefs };
  }
}
