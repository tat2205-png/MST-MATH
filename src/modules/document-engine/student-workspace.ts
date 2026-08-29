export const STUDENT_WORKSPACE_SCHEMA_VERSION = "student-workspace/v1" as const;

export const STUDENT_WORKSPACE_TYPES = [
  "NONE",
  "FREE_RESPONSE_SMALL", "FREE_RESPONSE_MEDIUM", "FREE_RESPONSE_LARGE",
  "GRID_SMALL", "GRID_MEDIUM", "GRID_LARGE",
  "COORDINATE_2D",
  "DRAWING_AREA",
] as const;

export type StudentWorkspaceType = typeof STUDENT_WORKSPACE_TYPES[number];
export type DocumentPhysicalUnit = "mm";
export type WorkspaceMetadataValue = string | number | boolean | null;

interface StudentWorkspaceBase<T extends StudentWorkspaceType> {
  schemaVersion: typeof STUDENT_WORKSPACE_SCHEMA_VERSION;
  type: T;
  width: number;
  height: number;
  unit: DocumentPhysicalUnit;
  studentEditable: true;
  solutionContentAllowed: false;
  answerContentAllowed: false;
  metadata?: Record<string, WorkspaceMetadataValue>;
}

export interface NoStudentWorkspace extends StudentWorkspaceBase<"NONE"> {
  width: 0;
  height: 0;
  studentEditable: true;
}

export interface FreeResponseStudentWorkspace extends StudentWorkspaceBase<
  "FREE_RESPONSE_SMALL" | "FREE_RESPONSE_MEDIUM" | "FREE_RESPONSE_LARGE"
> {}

export interface GridStudentWorkspace extends StudentWorkspaceBase<"GRID_SMALL" | "GRID_MEDIUM" | "GRID_LARGE"> {
  cellSizeMm: 5;
  rows: number;
  columns: number;
  showGrid: true;
}

export interface Coordinate2DStudentWorkspace extends StudentWorkspaceBase<"COORDINATE_2D"> {
  showGrid: boolean;
  showAxes: true;
  showNumbers: boolean;
  xRange: readonly [number, number];
  yRange: readonly [number, number];
  xTick: number;
  yTick: number;
}

export interface DrawingAreaStudentWorkspace extends StudentWorkspaceBase<"DRAWING_AREA"> {
  showGrid: false;
}

export type StudentWorkspace =
  | NoStudentWorkspace
  | FreeResponseStudentWorkspace
  | GridStudentWorkspace
  | Coordinate2DStudentWorkspace
  | DrawingAreaStudentWorkspace;

export const STUDENT_WORKSPACE_PRESETS = {
  NONE: { ...base("NONE", 0, 0), width: 0 as const, height: 0 as const },
  FREE_RESPONSE_SMALL: base("FREE_RESPONSE_SMALL", 170, 30),
  FREE_RESPONSE_MEDIUM: base("FREE_RESPONSE_MEDIUM", 170, 60),
  FREE_RESPONSE_LARGE: base("FREE_RESPONSE_LARGE", 170, 90),
  GRID_SMALL: { ...base("GRID_SMALL", 170, 40), cellSizeMm: 5, rows: 8, columns: 34, showGrid: true },
  GRID_MEDIUM: { ...base("GRID_MEDIUM", 170, 70), cellSizeMm: 5, rows: 14, columns: 34, showGrid: true },
  GRID_LARGE: { ...base("GRID_LARGE", 170, 100), cellSizeMm: 5, rows: 20, columns: 34, showGrid: true },
  COORDINATE_2D: {
    ...base("COORDINATE_2D", 160, 100), showGrid: true, showAxes: true, showNumbers: true,
    xRange: [-10, 10], yRange: [-6, 6], xTick: 1, yTick: 1,
  },
  DRAWING_AREA: { ...base("DRAWING_AREA", 170, 90), showGrid: false },
} satisfies Record<StudentWorkspaceType, StudentWorkspace>;

export type StudentWorkspaceValidationCode =
  | "UNKNOWN_WORKSPACE_TYPE"
  | "INVALID_DIMENSION"
  | "INVALID_PRESET"
  | "INVALID_COORDINATE_RANGE"
  | "INVALID_COORDINATE_TICK"
  | "STUDENT_SOLUTION_FORBIDDEN"
  | "STUDENT_ANSWER_FORBIDDEN"
  | "SOLUTION_GEOMETRY_FORBIDDEN"
  | "UNKNOWN_FIELD"
  | "INVALID_METADATA";

export interface StudentWorkspaceValidationIssue {
  code: StudentWorkspaceValidationCode;
  path: string;
  message: string;
}

export interface StudentWorkspaceValidationResult {
  status: "PASS" | "FAIL";
  issues: StudentWorkspaceValidationIssue[];
}

function base<T extends StudentWorkspaceType>(type: T, width: number, height: number): StudentWorkspaceBase<T> {
  return {
    schemaVersion: STUDENT_WORKSPACE_SCHEMA_VERSION,
    type, width, height, unit: "mm", studentEditable: true,
    solutionContentAllowed: false, answerContentAllowed: false,
  };
}

const prohibitedSolutionGeometry = /(?:solution|answer)[\s_-]?(?:graph|curve|region|vertices|vertex|annotation|construction)|shaded[\s_-]?solution|pre.?solved.*construction/i;
const commonFields = ["schemaVersion", "type", "width", "height", "unit", "studentEditable", "solutionContentAllowed", "answerContentAllowed", "metadata"];
const fieldsByType: Record<StudentWorkspaceType, readonly string[]> = {
  NONE: commonFields,
  FREE_RESPONSE_SMALL: commonFields, FREE_RESPONSE_MEDIUM: commonFields, FREE_RESPONSE_LARGE: commonFields,
  GRID_SMALL: [...commonFields, "cellSizeMm", "rows", "columns", "showGrid"],
  GRID_MEDIUM: [...commonFields, "cellSizeMm", "rows", "columns", "showGrid"],
  GRID_LARGE: [...commonFields, "cellSizeMm", "rows", "columns", "showGrid"],
  COORDINATE_2D: [...commonFields, "showGrid", "showAxes", "showNumbers", "xRange", "yRange", "xTick", "yTick"],
  DRAWING_AREA: [...commonFields, "showGrid"],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function equalTuple(value: unknown, expected: readonly [number, number]): boolean {
  return Array.isArray(value) && value.length === 2 && value[0] === expected[0] && value[1] === expected[1];
}

export function validateStudentWorkspace(value: unknown, context: { audience: "STUDENT" | "TEACHER" } = { audience: "STUDENT" }): StudentWorkspaceValidationResult {
  const issues: StudentWorkspaceValidationIssue[] = [];
  const issue = (code: StudentWorkspaceValidationCode, path: string, message: string) => issues.push({ code, path, message });
  if (!isRecord(value) || !STUDENT_WORKSPACE_TYPES.includes(value.type as StudentWorkspaceType)) {
    issue("UNKNOWN_WORKSPACE_TYPE", "type", "Workspace type is not part of student-workspace/v1.");
    return { status: "FAIL", issues };
  }
  const type = value.type as StudentWorkspaceType;
  const expected = STUDENT_WORKSPACE_PRESETS[type] as unknown as Record<string, unknown>;
  for (const [key, item] of Object.entries(value)) {
    if (!fieldsByType[type].includes(key)) issue("UNKNOWN_FIELD", key, `${key} is not part of the ${type} contract.`);
    if (key !== "metadata" && prohibitedSolutionGeometry.test(`${key} ${String(item)}`)) issue("SOLUTION_GEOMETRY_FORBIDDEN", key, "Solution geometry and answer annotations are forbidden in student workspace data.");
  }
  if (value.schemaVersion !== STUDENT_WORKSPACE_SCHEMA_VERSION || value.unit !== "mm" || value.studentEditable !== true) {
    issue("INVALID_PRESET", "workspace", "Schema version, physical unit, and student editability must match the canonical preset.");
  }
  if (value.solutionContentAllowed !== false) issue("STUDENT_SOLUTION_FORBIDDEN", "solutionContentAllowed", `Student workspace cannot contain solution content in ${context.audience} output.`);
  if (value.answerContentAllowed !== false) issue("STUDENT_ANSWER_FORBIDDEN", "answerContentAllowed", `Student workspace cannot contain answer content in ${context.audience} output.`);
  if (!Number.isFinite(value.width) || !Number.isFinite(value.height) || (type === "NONE" ? value.width !== 0 || value.height !== 0 : Number(value.width) <= 0 || Number(value.height) <= 0)) {
    issue("INVALID_DIMENSION", "width/height", "Dimensions must be finite millimetres; NONE is exactly 0 × 0 and other workspaces are positive.");
  }
  for (const key of ["width", "height", "cellSizeMm", "rows", "columns", "showGrid", "showAxes", "showNumbers", "xTick", "yTick"])
    if (key in expected && value[key] !== expected[key]) issue("INVALID_PRESET", key, `${key} must match the deterministic ${type} preset.`);
  if (type === "COORDINATE_2D") {
    if (!equalTuple(value.xRange, expected.xRange as readonly [number, number]) || !equalTuple(value.yRange, expected.yRange as readonly [number, number])) issue("INVALID_COORDINATE_RANGE", "xRange/yRange", "Coordinate ranges must match the canonical preset in V1.");
    if (!(Number(value.xTick) > 0) || !(Number(value.yTick) > 0)) issue("INVALID_COORDINATE_TICK", "xTick/yTick", "Coordinate ticks must be positive.");
  }
  if (value.metadata !== undefined) {
    if (!isRecord(value.metadata) || Object.values(value.metadata).some((item) => item !== null && !["string", "number", "boolean"].includes(typeof item))) issue("INVALID_METADATA", "metadata", "Metadata must contain only scalar, renderer-independent values.");
    else for (const [key, item] of Object.entries(value.metadata)) if (prohibitedSolutionGeometry.test(`${key} ${String(item)}`)) issue("SOLUTION_GEOMETRY_FORBIDDEN", `metadata.${key}`, "Solution geometry and answer annotations are forbidden in student workspace data.");
  }
  return { status: issues.length ? "FAIL" : "PASS", issues };
}

export function createStudentWorkspace(type: "NONE", metadata?: Record<string, WorkspaceMetadataValue>): NoStudentWorkspace;
export function createStudentWorkspace(type: "FREE_RESPONSE_SMALL" | "FREE_RESPONSE_MEDIUM" | "FREE_RESPONSE_LARGE", metadata?: Record<string, WorkspaceMetadataValue>): FreeResponseStudentWorkspace;
export function createStudentWorkspace(type: "GRID_SMALL" | "GRID_MEDIUM" | "GRID_LARGE", metadata?: Record<string, WorkspaceMetadataValue>): GridStudentWorkspace;
export function createStudentWorkspace(type: "COORDINATE_2D", metadata?: Record<string, WorkspaceMetadataValue>): Coordinate2DStudentWorkspace;
export function createStudentWorkspace(type: "DRAWING_AREA", metadata?: Record<string, WorkspaceMetadataValue>): DrawingAreaStudentWorkspace;
export function createStudentWorkspace(type: StudentWorkspaceType, metadata?: Record<string, WorkspaceMetadataValue>): StudentWorkspace;
export function createStudentWorkspace(type: StudentWorkspaceType, metadata?: Record<string, WorkspaceMetadataValue>): StudentWorkspace {
  const workspace = structuredClone(STUDENT_WORKSPACE_PRESETS[type]) as unknown as StudentWorkspace;
  if (metadata !== undefined) workspace.metadata = structuredClone(metadata);
  assertValidStudentWorkspace(workspace);
  return workspace;
}

export function assertValidStudentWorkspace(value: unknown, context?: { audience: "STUDENT" | "TEACHER" }): asserts value is StudentWorkspace {
  const result = validateStudentWorkspace(value, context);
  if (result.status === "FAIL") throw new Error(result.issues.map((item) => `${item.code}:${item.path}`).join(";"));
}

export function serializeStudentWorkspace(workspace: StudentWorkspace): string {
  assertValidStudentWorkspace(workspace);
  return JSON.stringify(workspace);
}

export function deserializeStudentWorkspace(serialized: string): StudentWorkspace {
  const value: unknown = JSON.parse(serialized);
  assertValidStudentWorkspace(value);
  return value;
}
