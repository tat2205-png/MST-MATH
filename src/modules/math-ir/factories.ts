import {
  MATH_IR_SCHEMA_VERSION,
  type EntityId,
  type MathConstraint,
  type MathConstraintType,
  type MathDocument,
  type MathEntity,
  type MathFact,
  type MathProblem,
  type MathScene,
  type PlaneEntity,
  type PointEntity,
  type SegmentEntity,
  type SemanticCoordinate,
} from "./types.js";

export function createPoint(id: EntityId, label?: string, semanticCoordinate: SemanticCoordinate = { dimension: "unknown" }): PointEntity {
  return { id, type: "point", label, semanticCoordinate };
}

export function createSegment(id: EntityId, startPointId: EntityId, endPointId: EntityId, label?: string): SegmentEntity {
  return { id, type: "segment", startPointId, endPointId, label };
}

export function createPlane(id: EntityId, pointIds?: EntityId[], label?: string): PlaneEntity {
  return { id, type: "plane", pointIds, label };
}

export function createConstraint(id: string, type: MathConstraintType, entityIds: EntityId[], fact: MathFact, expressionId?: string): MathConstraint {
  return expressionId === undefined ? { id, type, entityIds, fact } : { id, type, entityIds, fact, expressionId };
}

export function createMathScene(input: Omit<MathScene, "entities" | "constraints"> & { entities?: MathEntity[]; constraints?: MathConstraint[] }): MathScene {
  return { ...input, entities: input.entities ?? [], constraints: input.constraints ?? [] };
}

export function createMathProblem(input: Omit<MathProblem, "expressions" | "entities" | "constraints" | "givens" | "targets" | "sceneIds"> & Partial<Pick<MathProblem, "expressions" | "entities" | "constraints" | "givens" | "targets" | "sceneIds">>): MathProblem {
  return { ...input, expressions: input.expressions ?? [], entities: input.entities ?? [], constraints: input.constraints ?? [], givens: input.givens ?? [], targets: input.targets ?? [], sceneIds: input.sceneIds ?? [] };
}

export function createMathDocument(input: Omit<MathDocument, "schemaVersion" | "sections" | "problems" | "scenes" | "expressions"> & Partial<Pick<MathDocument, "sections" | "problems" | "scenes" | "expressions">>): MathDocument {
  return { ...input, schemaVersion: MATH_IR_SCHEMA_VERSION, sections: input.sections ?? [], problems: input.problems ?? [], scenes: input.scenes ?? [], expressions: input.expressions ?? [] };
}
