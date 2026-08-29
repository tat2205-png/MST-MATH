import type { ExportAudience } from "../question-bank/export.js";
import type { QuestionObject } from "../question-bank/types.js";
import type { MathAssetReference, MathDocumentBlock, MathMetadata } from "../math-ir/index.js";
import {
  assertValidStudentWorkspace,
  type StudentWorkspace,
} from "./student-workspace.js";

export const DOCUMENT_COMPONENT_SCHEMA_VERSION = "document-component/v1" as const;

export const DOCUMENT_COMPONENT_KINDS = [
  "DEFINITION", "THEOREM", "EXAMPLE", "EXERCISE", "SOLUTION", "ANSWER",
  "NOTE", "WARNING", "FIGURE", "TABLE", "WORKSPACE",
] as const;

export type DocumentComponentKind = typeof DOCUMENT_COMPONENT_KINDS[number];

interface DocumentComponentBase<T extends DocumentComponentKind> {
  schemaVersion: typeof DOCUMENT_COMPONENT_SCHEMA_VERSION;
  id: string;
  kind: T;
  title?: string;
  label?: string;
  metadata?: MathMetadata;
}

interface ContentDocumentComponent<T extends "DEFINITION" | "THEOREM" | "NOTE" | "WARNING"> extends DocumentComponentBase<T> {
  content: MathDocumentBlock[];
}

export type DefinitionDocumentComponent = ContentDocumentComponent<"DEFINITION">;
export type TheoremDocumentComponent = ContentDocumentComponent<"THEOREM">;
export type NoteDocumentComponent = ContentDocumentComponent<"NOTE">;
export type WarningDocumentComponent = ContentDocumentComponent<"WARNING">;

export interface ExampleDocumentComponent extends DocumentComponentBase<"EXAMPLE"> {
  problemId: string;
  content?: MathDocumentBlock[];
}

export interface ExerciseDocumentComponent extends DocumentComponentBase<"EXERCISE"> {
  questionId: QuestionObject["id"];
}

export interface SolutionDocumentComponent extends DocumentComponentBase<"SOLUTION"> {
  content: MathDocumentBlock[];
}

export interface AnswerDocumentComponent extends DocumentComponentBase<"ANSWER"> {
  content: MathDocumentBlock[];
}

export interface FigureDocumentComponent extends DocumentComponentBase<"FIGURE"> {
  asset: MathAssetReference;
  caption?: string;
}

export interface TableDocumentComponent extends DocumentComponentBase<"TABLE"> {
  asset: MathAssetReference;
  caption?: string;
}

export interface WorkspaceDocumentComponent extends DocumentComponentBase<"WORKSPACE"> {
  workspace: StudentWorkspace;
}

export type DocumentComponent =
  | DefinitionDocumentComponent
  | TheoremDocumentComponent
  | ExampleDocumentComponent
  | ExerciseDocumentComponent
  | SolutionDocumentComponent
  | AnswerDocumentComponent
  | NoteDocumentComponent
  | WarningDocumentComponent
  | FigureDocumentComponent
  | TableDocumentComponent
  | WorkspaceDocumentComponent;

export type DocumentComponentValidationCode =
  | "UNKNOWN_COMPONENT_KIND"
  | "INVALID_COMPONENT_ID"
  | "INVALID_COMPONENT_CONTENT"
  | "INVALID_REFERENCE"
  | "INVALID_FIGURE_ASSET"
  | "INVALID_TABLE_ASSET"
  | "INVALID_WORKSPACE"
  | "RENDERER_SPECIFIC_FIELD_FORBIDDEN";

export interface DocumentComponentValidationIssue {
  code: DocumentComponentValidationCode;
  path: string;
  message: string;
}

export interface DocumentComponentValidationResult {
  status: "PASS" | "FAIL";
  issues: DocumentComponentValidationIssue[];
}

const rendererSpecificFields = new Set([
  "className", "css", "cssPixels", "html", "latexCommand", "ooxml", "pageCoordinates",
  "pixelHeight", "pixelWidth", "styleId", "tikz", "wordStyleId", "fontName", "hexColor",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function findRendererField(value: unknown, path = "component"): string | undefined {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index++) {
      const found = findRendererField(value[index], `${path}[${index}]`);
      if (found) return found;
    }
    return undefined;
  }
  if (!isRecord(value)) return undefined;
  for (const [key, child] of Object.entries(value)) {
    if (rendererSpecificFields.has(key)) return `${path}.${key}`;
    const found = findRendererField(child, `${path}.${key}`);
    if (found) return found;
  }
  return undefined;
}

function validBlocks(value: unknown): value is MathDocumentBlock[] {
  return Array.isArray(value) && value.length > 0 && value.every((block) => isRecord(block) && typeof block.id === "string" && typeof block.type === "string");
}

export function validateDocumentComponent(value: unknown): DocumentComponentValidationResult {
  const issues: DocumentComponentValidationIssue[] = [];
  const issue = (code: DocumentComponentValidationCode, path: string, message: string) => issues.push({ code, path, message });
  if (!isRecord(value) || !DOCUMENT_COMPONENT_KINDS.includes(value.kind as DocumentComponentKind)) {
    issue("UNKNOWN_COMPONENT_KIND", "kind", "Component kind is not part of document-component/v1.");
    return { status: "FAIL", issues };
  }
  if (value.schemaVersion !== DOCUMENT_COMPONENT_SCHEMA_VERSION || typeof value.id !== "string" || !value.id.trim()) issue("INVALID_COMPONENT_ID", "id", "A component requires its V1 schema version and a stable non-empty ID.");
  const rendererField = findRendererField(value);
  if (rendererField) issue("RENDERER_SPECIFIC_FIELD_FORBIDDEN", rendererField, "Renderer-specific presentation cannot be canonical component data.");
  switch (value.kind as DocumentComponentKind) {
    case "DEFINITION": case "THEOREM": case "SOLUTION": case "ANSWER": case "NOTE": case "WARNING":
      if (!validBlocks(value.content)) issue("INVALID_COMPONENT_CONTENT", "content", `${value.kind} requires existing MathDocumentBlock content.`);
      break;
    case "EXAMPLE":
      if (typeof value.problemId !== "string" || !value.problemId.trim() || value.content !== undefined && !validBlocks(value.content)) issue("INVALID_REFERENCE", "problemId/content", "EXAMPLE requires an existing problem reference and optional MathDocumentBlock content.");
      break;
    case "EXERCISE":
      if (typeof value.questionId !== "string" || !value.questionId.trim()) issue("INVALID_REFERENCE", "questionId", "EXERCISE references an existing QuestionObject by ID.");
      break;
    case "FIGURE":
      if (!isRecord(value.asset) || value.asset.kind !== "image" || typeof value.asset.id !== "string") issue("INVALID_FIGURE_ASSET", "asset", "FIGURE must reuse an existing image MathAssetReference.");
      break;
    case "TABLE":
      if (!isRecord(value.asset) || value.asset.kind !== "table" || typeof value.asset.id !== "string") issue("INVALID_TABLE_ASSET", "asset", "TABLE must reuse an existing table MathAssetReference.");
      break;
    case "WORKSPACE":
      try { assertValidStudentWorkspace(value.workspace); }
      catch { issue("INVALID_WORKSPACE", "workspace", "WORKSPACE must contain a valid student-workspace/v1 value."); }
      break;
  }
  return { status: issues.length ? "FAIL" : "PASS", issues };
}

export function assertValidDocumentComponent(value: unknown): asserts value is DocumentComponent {
  const result = validateDocumentComponent(value);
  if (result.status === "FAIL") throw new Error(result.issues.map((item) => `${item.code}:${item.path}`).join(";"));
}

export function createExerciseDocumentComponent(id: string, question: Pick<QuestionObject, "id">, options: Pick<ExerciseDocumentComponent, "title" | "label" | "metadata"> = {}): ExerciseDocumentComponent {
  const component: ExerciseDocumentComponent = { schemaVersion: DOCUMENT_COMPONENT_SCHEMA_VERSION, id, kind: "EXERCISE", questionId: question.id, ...structuredClone(options) };
  assertValidDocumentComponent(component);
  return component;
}

export function isDocumentComponentVisible(component: DocumentComponent, audience: ExportAudience): boolean {
  return audience === "TEACHER" || component.kind !== "SOLUTION" && component.kind !== "ANSWER";
}

export function serializeDocumentComponent(component: DocumentComponent): string {
  assertValidDocumentComponent(component);
  return JSON.stringify(component);
}

export function deserializeDocumentComponent(serialized: string): DocumentComponent {
  const value: unknown = JSON.parse(serialized);
  assertValidDocumentComponent(value);
  return value;
}
