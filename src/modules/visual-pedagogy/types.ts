import type { EntityId, MathConstraintType } from "../math-ir/index.js";

export const VISUAL_SEMANTIC_SCHEMA_VERSION = "visual-semantic/v1" as const;

export type VisualObjectRole = "primary" | "auxiliary" | "construction" | "emphasized" | "hidden" | "result";
export type PedagogicalRole = "hypothesis" | "conclusion" | "proof_step" | "formula" | "result";
export type SemanticColorRole = "theory" | "application" | "tip" | "warning" | "success" | "geometry" | "neutral";

export interface VisualEntitySemantic {
  id: string;
  mathEntityId: EntityId;
  objectRole: VisualObjectRole;
  pedagogicalRole?: PedagogicalRole;
  colorRole?: SemanticColorRole;
  visible: boolean;
  provenance: { sourceMathEntityId: EntityId; origin: "source" | "derived" | "planner" };
}

export interface VisualRelationSemantic {
  id: string;
  sourceConstraintId: string;
  relationType: Extract<MathConstraintType, "equal_length" | "equal_angle" | "perpendicular" | "parallel" | "tangent" | "point_on_line" | "point_on_circle">;
  marker: "equal_segment" | "equal_angle" | "right_angle" | "parallel" | "tangent" | "incidence";
  entityIds: EntityId[];
  provenance: { sourceRelationId: string; validation: "validated" };
}

export interface VisualSemanticModel {
  schemaVersion: typeof VISUAL_SEMANTIC_SCHEMA_VERSION;
  id: string;
  sourceSceneId: string;
  entities: VisualEntitySemantic[];
  relations: VisualRelationSemantic[];
  validation: { status: "PASS"; mathIrValidated: true };
}

export type LessonGrammar = "LESSON" | "PROBLEM_SOLVING" | "PROOF";
export type PedagogicalStage = "KNOW" | "UNDERSTAND" | "PROVE" | "RECOGNIZE" | "APPLY" | "GENERALIZE" | "REMEMBER" | "PROBLEM" | "ANALYZE" | "METHOD" | "TRANSFORM" | "VERIFY" | "CONCLUDE" | "HYPOTHESIS" | "OBSERVATION" | "LEMMA" | "DERIVATION" | "CONCLUSION";
export interface PedagogicalPlan { id: string; grammar: LessonGrammar; stages: Array<{ id: string; stage: PedagogicalStage; sourceIds: string[] }>; validation: { status: "PASS" } }

export type MotionIntent = "INTRO_REVEAL" | "TITLE_REVEAL" | "CARD_ENTER" | "CARD_EXIT" | "MATH_WRITE" | "MATH_REWRITE" | "MATH_SUBSTITUTE" | "MATH_EXPAND" | "MATH_FACTOR" | "MATH_CANCEL" | "MATH_REARRANGE" | "MATH_COMPARE" | "HIGHLIGHT_OBJECT" | "FOCUS_OBJECT" | "CIRCUMSCRIBE_OBJECT" | "STEP_ENTER" | "STEP_EXIT" | "CHAPTER_TRANSITION" | "RESULT_REVEAL" | "TAKEAWAY_REVEAL";
export interface MotionPlan { id: string; actions: Array<{ id: string; intent: MotionIntent; targetIds: string[]; sourceTransitionId?: string; durationMs: number }>; validation: { status: "PASS"; onePrimaryFocus: true } }

export type MathTransitionType = "rewrite_as_power" | "base_conversion" | "substitution" | "expansion" | "factorization" | "cancellation" | "rearrangement" | "comparison" | "equivalence";
export interface MathematicalTransitionGraph { id: string; expressionIds: string[]; transitions: Array<{ id: string; fromExpressionId: string; toExpressionId: string; type: MathTransitionType; sourceStepId: string; verified: true }>; validation: { status: "PASS" } }
