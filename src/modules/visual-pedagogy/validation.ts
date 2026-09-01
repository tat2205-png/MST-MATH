import { validateMathIR, type MathDocument, type MathScene } from "../math-ir/index.js";
import { VISUAL_SEMANTIC_SCHEMA_VERSION, type VisualSemanticModel } from "./types.js";

export interface VisualSemanticIssue { code: string; path: string; message: string }
export type VisualSemanticValidation = { status: "PASS" | "FAIL"; issues: VisualSemanticIssue[] };

export function validateVisualSemanticModel(model: VisualSemanticModel, scene: MathScene): VisualSemanticValidation {
  const issues: VisualSemanticIssue[] = [];
  if (model.schemaVersion !== VISUAL_SEMANTIC_SCHEMA_VERSION) issues.push({ code: "INVALID_SCHEMA", path: "schemaVersion", message: "Unsupported visual semantic schema." });
  if (model.sourceSceneId !== scene.id) issues.push({ code: "INVALID_SCENE_REFERENCE", path: "sourceSceneId", message: "Visual model must reference its source Math IR scene." });
  const entityIds = new Set(scene.entities.map((entity) => entity.id));
  const constraints = new Map(scene.constraints.map((constraint) => [constraint.id, constraint]));
  for (const [index, visual] of model.entities.entries()) {
    if (!entityIds.has(visual.mathEntityId) || visual.provenance.sourceMathEntityId !== visual.mathEntityId) issues.push({ code: "INVALID_MATH_ENTITY_REFERENCE", path: `entities[${index}]`, message: "Visual entities must reference an existing Math IR entity with matching provenance." });
  }
  for (const [index, visual] of model.relations.entries()) {
    const source = constraints.get(visual.sourceConstraintId);
    if (!source || source.type !== visual.relationType || source.status !== "SATISFIED" || visual.entityIds.some((id) => !source.entityIds.includes(id))) issues.push({ code: "UNVALIDATED_RELATION", path: `relations[${index}]`, message: "A visual marker requires a satisfied matching Math IR constraint." });
  }
  return { status: issues.length ? "FAIL" : "PASS", issues };
}

export function validateMathSceneEnvelope(scene: MathScene): VisualSemanticValidation {
  const document: MathDocument = { schemaVersion: "math-ir/v1", id: `envelope:${scene.id}`, sections: [], problems: [], scenes: [scene], expressions: scene.expressions ?? [], assets: [] };
  const result = validateMathIR(document);
  return { status: result.status, issues: result.issues.filter((issue) => issue.severity === "error").map(({ code, path, message }) => ({ code, path, message })) };
}
