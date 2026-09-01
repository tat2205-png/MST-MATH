import type { MathScene } from "../math-ir/index.js";
import type { LessonGrammar, MathematicalTransitionGraph, MotionPlan, PedagogicalPlan, PedagogicalStage, VisualSemanticModel } from "./types.js";
import { validateVisualSemanticModel } from "./validation.js";

const grammarStages: Record<LessonGrammar, PedagogicalStage[]> = { LESSON: ["KNOW", "UNDERSTAND", "PROVE", "RECOGNIZE", "APPLY", "GENERALIZE", "REMEMBER"], PROBLEM_SOLVING: ["PROBLEM", "ANALYZE", "METHOD", "TRANSFORM", "VERIFY", "CONCLUDE"], PROOF: ["HYPOTHESIS", "OBSERVATION", "LEMMA", "DERIVATION", "CONCLUSION"] };

export function createPedagogicalPlan(id: string, grammar: LessonGrammar, explicitStages: Array<{ stage: PedagogicalStage; sourceIds: string[] }>): PedagogicalPlan {
  const allowed = new Set(grammarStages[grammar]);
  if (!explicitStages.length || explicitStages.some((item) => !allowed.has(item.stage) || !item.sourceIds.length)) throw new Error("INVALID_PEDAGOGICAL_PLAN");
  return { id, grammar, stages: explicitStages.map((item, index) => ({ id: `${id}:stage:${index + 1}`, ...item, sourceIds: [...item.sourceIds] })), validation: { status: "PASS" } };
}

export function createMotionPlan(id: string, transitions: MathematicalTransitionGraph): MotionPlan {
  if (transitions.validation.status !== "PASS") throw new Error("UNVALIDATED_TRANSITION_GRAPH");
  return { id, actions: transitions.transitions.map((transition, index) => ({ id: `${id}:action:${index + 1}`, intent: transition.type === "substitution" ? "MATH_SUBSTITUTE" : "MATH_REWRITE", targetIds: [transition.fromExpressionId, transition.toExpressionId], sourceTransitionId: transition.id, durationMs: 900 })), validation: { status: "PASS", onePrimaryFocus: true } };
}

export function rendererInputGate(model: VisualSemanticModel, scene: MathScene): { renderAllowed: boolean; issues: string[] } {
  const result = validateVisualSemanticModel(model, scene);
  return { renderAllowed: result.status === "PASS", issues: result.issues.map((issue) => issue.code) };
}

export function createTransitionGraph(id: string, expressionIds: string[], transitions: MathematicalTransitionGraph["transitions"]): MathematicalTransitionGraph {
  const known = new Set(expressionIds);
  if (new Set(expressionIds).size !== expressionIds.length || transitions.some((edge) => !known.has(edge.fromExpressionId) || !known.has(edge.toExpressionId) || edge.fromExpressionId === edge.toExpressionId || !edge.sourceStepId || edge.verified !== true)) throw new Error("INVALID_TRANSITION_GRAPH");
  return { id, expressionIds: [...expressionIds], transitions: transitions.map((edge) => ({ ...edge })), validation: { status: "PASS" } };
}
