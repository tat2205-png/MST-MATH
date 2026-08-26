export const MATHEMATICAL_LOGIC_VALIDATOR_ID = "MATHEMATICAL_QUESTION_LOGIC";

export const MATH_ENTITY_KINDS = ["POINT", "LINE", "PLANE", "SEGMENT", "RAY", "VECTOR", "POLYGON", "TRIANGLE", "QUADRILATERAL", "CIRCLE", "SOLID", "VARIABLE", "FUNCTION", "SEQUENCE", "SET", "EXPRESSION", "UNKNOWN"] as const;
export type MathEntityKind = (typeof MATH_ENTITY_KINDS)[number];
export type SymbolState = "DECLARED" | "DERIVED_OR_IMPLIED" | "REFERENCED" | "UNRESOLVED";
export type LogicScope = "QUESTION" | "OPTION" | "TRUE_FALSE_STATEMENT";

export interface LogicSourceLocation { field: string; start?: number; end?: number }
export interface MathSymbolRecord {
  name: string;
  kind: MathEntityKind;
  state: SymbolState;
  declaredAt?: number;
  sourceLocation: LogicSourceLocation;
  dependsOn: string[];
  metadata?: Record<string, unknown>;
  confidence: "HIGH" | "MEDIUM";
}

export interface LogicDeclaration {
  name: string;
  kind: MathEntityKind;
  dependsOn: string[];
  definition: string;
  start: number;
  end: number;
}

