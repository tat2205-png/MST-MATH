import type { Assessment, AssessmentAnswerManifest, AssessmentSpec } from "../modules/question-bank/assessment.js";
import type { ExportArtifact, ExportAudience, ExportFormat } from "../modules/question-bank/export.js";
import type { ContentBlock, QuestionBankStatus, QuestionObject, QuestionSearchQuery, QuestionType } from "../modules/question-bank/types.js";
import type { GameResult, GameSession, StudentGameQuestion } from "../modules/classroom-game/game.js";
import type { RenderJobRequest } from "../types/localRender.js";

export type TeacherWorkflowState =
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

export interface WorkflowActionReadiness {
  ready: boolean;
  reason: string;
}

export interface WorkflowReadiness {
  source: "MAS_INT_01_RUNTIME_READINESS";
  requiredRuntimeBlockers: "NONE";
  actions: Record<
    "assessment" | "game" | "video" | "export",
    WorkflowActionReadiness
  >;
}

// TypeScript's ambient Object.values overload resolves finite-key Records to
// unknown[] in this project toolchain. This overload is type-only and scoped
// to the existing readiness action contract; it does not change runtime shape.
declare global {
  interface ObjectConstructor {
    values(o: WorkflowReadiness["actions"]): WorkflowActionReadiness[];
  }
}

export interface WorkflowSummary {
  state: TeacherWorkflowState;
  counts: Record<QuestionBankStatus | "TOTAL", number>;
  readiness: WorkflowReadiness;
  supportedImports: ["DOCX"];
  supportedExports: ExportFormat[];
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
