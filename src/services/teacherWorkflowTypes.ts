import type { Assessment, AssessmentAnswerManifest, AssessmentSpec } from "../modules/question-bank/assessment.js";
import type { ExportArtifact, ExportAudience, ExportFormat } from "../modules/question-bank/export.js";
import type { ContentBlock, QuestionBankStatus, QuestionObject, QuestionSearchQuery, QuestionType } from "../modules/question-bank/types.js";
import type { GameResult, GameSession, StudentGameQuestion } from "../modules/classroom-game/game.js";
import type { RenderJobRequest } from "../types/localRender.js";

export type TeacherWorkflowState =
  | "SOURCE_READY"
  | "PROCESSING"
  | "PROCESS_READY"
  | "DESIGN_READY"
  | "QA_REQUIRED"
  | "QA_PASS"
  | "EXPORT_READY"
  | "ERROR"
  | "EMPTY"
  | "IMPORTING"
  | "REVIEW_REQUIRED"
  | "BANK_READY"
  | "SELECTION_READY"
  | "ACTION_READY"
  | "PROCESSING"
  | "RESULT_READY"
  | "FAILED";

export type TeacherArea = "workspace" | "import" | "review" | "bank" | "assessment" | "game" | "video" | "export";

export interface TeacherQuestion extends Omit<QuestionObject, "figures"> {
  figures: Array<Omit<QuestionObject["figures"][number], "bytes"> & { dataUrl?: string }>;
}

export interface WorkflowReadiness {
  source: "MAS_INT_01_RUNTIME_READINESS";
  requiredRuntimeBlockers: "NONE";
  actions: Record<"assessment" | "game" | "video" | "export", { ready: boolean; reason: string }>;
}

export interface WorkflowSummary {
  state: TeacherWorkflowState;
  counts: Record<QuestionBankStatus | "TOTAL", number>;
  readiness: WorkflowReadiness;
  supportedImports: ["DOCX"];
  supportedExports: ExportFormat[];
}

export interface TeacherWorkflowStateInput {
  sourceReady: boolean;
  processing: boolean;
  processingError?: boolean;
  designReady: boolean;
  qa?: "PASS" | "WARN" | "REVIEW_REQUIRED" | "FAIL";
  exportReady: boolean;
}

/** Pure UI projection of authoritative service outcomes. It never infers math truth. */
export function deriveTeacherWorkflowState(input: TeacherWorkflowStateInput): TeacherWorkflowState {
  if (input.processingError) return "ERROR";
  if (!input.sourceReady) return "EMPTY";
  if (input.processing) return "PROCESSING";
  if (!input.designReady) return "PROCESS_READY";
  if (!input.qa || input.qa === "REVIEW_REQUIRED" || input.qa === "WARN") return "QA_REQUIRED";
  if (input.qa === "FAIL") return "ERROR";
  return input.exportReady ? "EXPORT_READY" : "QA_PASS";
}

export interface ImportWorkflowResult {
  imported: TeacherQuestion[];
  diagnostics: Array<{ code: string; questionId?: string; severity: "INFO" | "WARNING" | "ERROR"; details?: Record<string, unknown> }>;
  summary: WorkflowSummary;
}

export interface QuestionQueryResponse {
  items: TeacherQuestion[];
  total: number;
  warnings: Array<{ code: string; message: string }>;
  query: QuestionSearchQuery;
}

export interface AssessmentWorkflowResult {
  assessment: Assessment;
  questionIds: string[];
  queryPlan: unknown[];
}

export interface AssessmentWorkflowFailure {
  diagnostics: Array<{ code: string; message: string; sectionId?: string; details?: Record<string, unknown> }>;
  queryPlan: unknown[];
}

export interface GameWorkflowView {
  session: GameSession;
  currentQuestion?: StudentGameQuestion;
  result?: GameResult;
}

export interface VideoWorkflowResult {
  job: {
    id: string;
    questionId: string;
    mathGate: "VERIFIED_PASS";
    visualEngine: "MANIM";
    visualRoute: { featureEnabled: boolean; routeId: string };
    renderTask: RenderJobRequest & { jobId: string; videoSpec: unknown; outputFormat: "mp4"; fps: number };
  };
  stages: ["PREPARING", "VERIFYING_MATH", "PLANNING_VISUAL", "RENDERING", "QA", "COMPLETE"];
}

export interface ExportWorkflowRequest {
  assessmentId: string;
  audience: ExportAudience;
  formats: ExportFormat[];
  includeAnswers?: boolean;
  includeSolutions?: boolean;
  filename?: string;
}

export interface ExportWorkflowResult {
  assessmentId: string;
  audience: ExportAudience;
  artifacts: ExportArtifact[];
  questionIds: string[];
}

export type { Assessment, AssessmentAnswerManifest, AssessmentSpec, ContentBlock, ExportAudience, ExportFormat, QuestionBankStatus, QuestionSearchQuery, QuestionType };
