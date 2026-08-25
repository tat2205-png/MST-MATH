import type { MathEntity, MathScene } from "../math-ir/index.js";
import type { GeometryIssue, ResolvedGeometryEntity } from "./types.js";

export function geometryEntityReferenceIds(entity: MathEntity): string[] {
  switch (entity.type) {
    case "line": return [...entity.pointIds];
    case "ray": return [entity.startPointId, entity.throughPointId];
    case "segment": return [entity.startPointId, entity.endPointId];
    case "vector": return [entity.startPointId, entity.endPointId].filter((id): id is string => Boolean(id));
    case "plane": return entity.pointIds ?? [];
    case "polygon": case "triangle": case "quadrilateral": return [...entity.vertexIds, ...("sideIds" in entity ? entity.sideIds ?? [] : [])];
    case "circle": case "sphere": return [entity.centerPointId];
    case "arc": return [entity.circleId, entity.startPointId, entity.endPointId];
    case "cylinder": return [...entity.baseCenterIds];
    case "cone": return [entity.apexPointId, entity.baseCenterPointId];
    case "prism": return [...entity.baseFaceIds, ...entity.faceIds];
    case "pyramid": return [entity.apexPointId, entity.baseFaceId, ...(entity.faceIds ?? [])];
    case "polyhedron": return [...entity.vertexIds, ...entity.edgeIds, ...entity.faceIds];
    case "function_graph": return entity.axesId ? [entity.axesId] : [];
    case "label": return entity.targetEntityId ? [entity.targetEntityId] : [];
    case "measurement": return [entity.targetEntityId];
    case "angle_marker": case "right_angle_marker": return [...entity.pointIds];
    default: return [];
  }
}

export function resolveGeometryEntities(scene: MathScene): { entities: ResolvedGeometryEntity[]; issues: GeometryIssue[] } {
  const issues: GeometryIssue[] = [];
  const byId = new Map<string, MathEntity>();
  scene.entities.forEach((entity, index) => {
    if (byId.has(entity.id)) issues.push({ code: "DUPLICATE_ENTITY_ID", severity: "error", path: `entities[${index}].id`, message: `Duplicate entity ID: ${entity.id}` });
    else byId.set(entity.id, entity);
  });
  const entities = scene.entities.map((entity, index) => {
    const referencedEntityIds = geometryEntityReferenceIds(entity);
    const resolvedReferences = referencedEntityIds.flatMap((id, refIndex) => {
      const resolved = byId.get(id);
      if (!resolved) issues.push({ code: "MISSING_ENTITY_REFERENCE", severity: "error", path: `entities[${index}].references[${refIndex}]`, message: `Missing entity reference: ${id}` });
      return resolved ? [resolved] : [];
    });
    return { entityId: entity.id, entity, referencedEntityIds, resolvedReferences };
  });
  return { entities, issues };
}
