import type { QuestionObject, QuestionType } from "../question-bank/types.js";
import {
  DOCUMENT_COMPONENT_SCHEMA_VERSION,
  type WorkspaceDocumentComponent,
} from "./document-components.js";
import {
  STUDENT_WORKSPACE_SCHEMA_VERSION,
  STUDENT_WORKSPACE_TYPES,
  assertValidStudentWorkspace,
  createStudentWorkspace,
  type StudentWorkspace,
  type StudentWorkspaceType,
} from "./student-workspace.js";

export const WORKSPACE_PLAN_SCHEMA_VERSION = "workspace-plan/v1" as const;

export type WorkspaceTaskIntent = "STANDARD_RESPONSE" | "GRAPH_ON_AXES" | "GEOMETRIC_CONSTRUCTION";
export type WorkspaceResponseComplexity = "MINIMAL" | "SHORT_WRITTEN" | "MULTI_STEP" | "LONG_DERIVATION";
export type WorkspaceSourceSignal =
  | "QUESTION_TYPE"
  | "EXPLICIT_TASK_INTENT"
  | "EXPLICIT_RESPONSE_COMPLEXITY"
  | "EXPLICIT_AUTHOR_OVERRIDE"
  | "COORDINATES_PRESENT"
  | "GEOMETRY_VOCABULARY_PRESENT"
  | "SOURCE_FIGURE_PRESENT";

export interface WorkspacePlanningInput {
  questionType?: QuestionType;
  taskIntent?: WorkspaceTaskIntent;
  responseComplexity?: WorkspaceResponseComplexity;
  explicitAuthorOverride?: StudentWorkspaceType | string;
  sourceSignals?: readonly WorkspaceSourceSignal[];
}

export type WorkspacePlanReasonCode =
  | "AUTHOR_OVERRIDE"
  | "OBJECTIVE_RESPONSE_NONE"
  | "MINIMAL_RESPONSE"
  | "SHORT_WRITTEN_RESPONSE"
  | "MULTI_STEP_SOLUTION"
  | "LONG_DERIVATION"
  | "EXPLICIT_GRAPH_TASK"
  | "EXPLICIT_CONSTRUCTION_TASK"
  | "CONSERVATIVE_FALLBACK"
  | "INVALID_AUTHOR_OVERRIDE";

const passReasonCodes: readonly WorkspacePlan["reasonCode"][] = [
  "AUTHOR_OVERRIDE", "OBJECTIVE_RESPONSE_NONE", "MINIMAL_RESPONSE", "SHORT_WRITTEN_RESPONSE",
  "MULTI_STEP_SOLUTION", "LONG_DERIVATION", "EXPLICIT_GRAPH_TASK", "EXPLICIT_CONSTRUCTION_TASK", "CONSERVATIVE_FALLBACK",
];
const workspaceSourceSignals: readonly WorkspaceSourceSignal[] = [
  "QUESTION_TYPE", "EXPLICIT_TASK_INTENT", "EXPLICIT_RESPONSE_COMPLEXITY", "EXPLICIT_AUTHOR_OVERRIDE",
  "COORDINATES_PRESENT", "GEOMETRY_VOCABULARY_PRESENT", "SOURCE_FIGURE_PRESENT",
];

export interface WorkspacePlan {
  schemaVersion: typeof WORKSPACE_PLAN_SCHEMA_VERSION;
  status: "PASS";
  workspace: StudentWorkspace;
  reasonCode: Exclude<WorkspacePlanReasonCode, "INVALID_AUTHOR_OVERRIDE">;
  sourceSignals: WorkspaceSourceSignal[];
}

export interface FailedWorkspacePlan {
  schemaVersion: typeof WORKSPACE_PLAN_SCHEMA_VERSION;
  status: "FAIL";
  reasonCode: "INVALID_AUTHOR_OVERRIDE";
  sourceSignals: WorkspaceSourceSignal[];
  issues: [{ code: "UNKNOWN_WORKSPACE_TYPE"; message: string }];
}

export type WorkspacePlanningResult = WorkspacePlan | FailedWorkspacePlan;

function signals(input: WorkspacePlanningInput): WorkspaceSourceSignal[] {
  const result = new Set(input.sourceSignals ?? []);
  if (input.questionType) result.add("QUESTION_TYPE");
  if (input.taskIntent) result.add("EXPLICIT_TASK_INTENT");
  if (input.responseComplexity) result.add("EXPLICIT_RESPONSE_COMPLEXITY");
  if (input.explicitAuthorOverride !== undefined) result.add("EXPLICIT_AUTHOR_OVERRIDE");
  return [...result].sort();
}

function pass(type: StudentWorkspaceType, reasonCode: WorkspacePlan["reasonCode"], sourceSignals: WorkspaceSourceSignal[]): WorkspacePlan {
  return { schemaVersion: WORKSPACE_PLAN_SCHEMA_VERSION, status: "PASS", workspace: createStudentWorkspace(type), reasonCode, sourceSignals };
}

export function planStudentWorkspace(input: WorkspacePlanningInput): WorkspacePlanningResult {
  const sourceSignals = signals(input);
  if (input.explicitAuthorOverride !== undefined) {
    if (!STUDENT_WORKSPACE_TYPES.includes(input.explicitAuthorOverride as StudentWorkspaceType)) {
      return {
        schemaVersion: WORKSPACE_PLAN_SCHEMA_VERSION, status: "FAIL", reasonCode: "INVALID_AUTHOR_OVERRIDE", sourceSignals,
        issues: [{ code: "UNKNOWN_WORKSPACE_TYPE", message: "Author override must be a canonical student-workspace/v1 type." }],
      };
    }
    return pass(input.explicitAuthorOverride as StudentWorkspaceType, "AUTHOR_OVERRIDE", sourceSignals);
  }
  if (input.questionType === "MULTIPLE_CHOICE" || input.questionType === "TRUE_FALSE") return pass("NONE", "OBJECTIVE_RESPONSE_NONE", sourceSignals);
  if (input.taskIntent === "GRAPH_ON_AXES") return pass("COORDINATE_2D", "EXPLICIT_GRAPH_TASK", sourceSignals);
  if (input.taskIntent === "GEOMETRIC_CONSTRUCTION") return pass("DRAWING_AREA", "EXPLICIT_CONSTRUCTION_TASK", sourceSignals);
  switch (input.responseComplexity) {
    case "MINIMAL": return pass("FREE_RESPONSE_SMALL", "MINIMAL_RESPONSE", sourceSignals);
    case "SHORT_WRITTEN": return pass("FREE_RESPONSE_SMALL", "SHORT_WRITTEN_RESPONSE", sourceSignals);
    case "MULTI_STEP": return pass("GRID_MEDIUM", "MULTI_STEP_SOLUTION", sourceSignals);
    case "LONG_DERIVATION": return pass("GRID_LARGE", "LONG_DERIVATION", sourceSignals);
  }
  if (input.questionType === "SHORT_ANSWER") return pass("FREE_RESPONSE_SMALL", "MINIMAL_RESPONSE", sourceSignals);
  return pass("NONE", "CONSERVATIVE_FALLBACK", sourceSignals);
}

export function planQuestionWorkspace(question: Pick<QuestionObject, "type" | "figures">, semantics: Omit<WorkspacePlanningInput, "questionType" | "sourceSignals"> = {}): WorkspacePlanningResult {
  const sourceSignals: WorkspaceSourceSignal[] = question.figures.length ? ["SOURCE_FIGURE_PRESENT"] : [];
  return planStudentWorkspace({ ...semantics, questionType: question.type, sourceSignals });
}

export function workspacePlanToComponent(id: string, plan: WorkspacePlan): WorkspaceDocumentComponent {
  return { schemaVersion: DOCUMENT_COMPONENT_SCHEMA_VERSION, id, kind: "WORKSPACE", workspace: structuredClone(plan.workspace) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function assertValidWorkspacePlan(value: unknown): asserts value is WorkspacePlanningResult {
  if (!isRecord(value) || value.schemaVersion !== WORKSPACE_PLAN_SCHEMA_VERSION || !["PASS", "FAIL"].includes(String(value.status)) || !Array.isArray(value.sourceSignals)) throw new Error("INVALID_WORKSPACE_PLAN");
  if (value.sourceSignals.some((signal) => !workspaceSourceSignals.includes(signal as WorkspaceSourceSignal))) throw new Error("INVALID_WORKSPACE_SOURCE_SIGNAL");
  if (value.status === "FAIL") {
    if (Object.keys(value).some((key) => !["schemaVersion", "status", "reasonCode", "sourceSignals", "issues"].includes(key)) || value.reasonCode !== "INVALID_AUTHOR_OVERRIDE" || !Array.isArray(value.issues)) throw new Error("INVALID_FAILED_WORKSPACE_PLAN");
    return;
  }
  if (Object.keys(value).some((key) => !["schemaVersion", "status", "workspace", "reasonCode", "sourceSignals"].includes(key))) throw new Error("WORKSPACE_PLAN_VISUAL_PAYLOAD_FORBIDDEN");
  if (!passReasonCodes.includes(value.reasonCode as WorkspacePlan["reasonCode"])) throw new Error("INVALID_WORKSPACE_REASON_CODE");
  assertValidStudentWorkspace(value.workspace);
  if (value.workspace && isRecord(value.workspace) && value.workspace.schemaVersion !== STUDENT_WORKSPACE_SCHEMA_VERSION) throw new Error("WORKSPACE_CONTRACT_MISMATCH");
}

export function serializeWorkspacePlan(plan: WorkspacePlanningResult): string {
  assertValidWorkspacePlan(plan);
  return JSON.stringify(plan);
}

export function deserializeWorkspacePlan(serialized: string): WorkspacePlanningResult {
  const value: unknown = JSON.parse(serialized);
  assertValidWorkspacePlan(value);
  return value;
}
