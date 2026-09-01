import type { MathConstraint, MathEntity, MathScene } from "../math-ir/index.js";
import { validateMathSceneEnvelope } from "./validation.js";

export interface TangentConstructionResult { status: "PASS" | "FAIL"; scene?: MathScene; derivedPointIds: string[]; constraintIds: string[]; issues: string[] }

export function constructTangentsFromExternalPoint(scene: MathScene, circleId: string, externalPointId: string, outputIds: readonly [string, string] = ["C", "D"]): TangentConstructionResult {
  const circle = scene.entities.find((entity): entity is Extract<MathEntity, { type: "circle" }> => entity.id === circleId && entity.type === "circle");
  const center = circle && scene.entities.find((entity) => entity.id === circle.centerPointId && entity.type === "point");
  const external = scene.entities.find((entity) => entity.id === externalPointId && entity.type === "point");
  const a = center?.semanticCoordinate, b = external?.semanticCoordinate;
  const radiusExpression = circle?.radiusExpressionId && scene.expressions?.find((expression) => expression.id === circle.radiusExpressionId);
  const radius = Number(radiusExpression?.normalized ?? radiusExpression?.raw);
  if (!circle || !center || !external || a?.dimension !== "2d" || b?.dimension !== "2d" || !Number.isFinite(radius) || radius <= 0) return { status: "FAIL", derivedPointIds: [], constraintIds: [], issues: ["Circle, 2D center/external point, and positive numeric radius are required."] };
  const dx = b.x - a.x, dy = b.y - a.y, distanceSquared = dx * dx + dy * dy;
  if (distanceSquared <= radius * radius) return { status: "FAIL", derivedPointIds: [], constraintIds: [], issues: ["Tangent construction requires an external point."] };
  const scale = radius * radius / distanceSquared;
  const offset = radius * Math.sqrt(distanceSquared - radius * radius) / distanceSquared;
  const baseX = a.x + scale * dx, baseY = a.y + scale * dy;
  const coordinates = [{ x: baseX - offset * dy, y: baseY + offset * dx }, { x: baseX + offset * dy, y: baseY - offset * dx }];
  const points: MathEntity[] = coordinates.map((coordinate, index) => ({ id: outputIds[index], type: "point", label: outputIds[index], semanticCoordinate: { dimension: "2d", ...coordinate }, metadata: { adapterMetadata: { construction: { kind: "TANGENT_POINTS_FROM_EXTERNAL_POINT", sourceIds: [circleId, externalPointId], resolved: true } } } }));
  const tangentSegments: MathEntity[] = outputIds.map((id) => ({ id: `segment:${externalPointId}${id}`, type: "segment", startPointId: externalPointId, endPointId: id, metadata: { adapterMetadata: { construction: { kind: "TANGENT_SEGMENT", sourceIds: [externalPointId, id], resolved: true } } } }));
  const fact = { origin: "derived" as const, ruleId: "euclidean.tangent-from-external-point", evidenceIds: [circleId, externalPointId] };
  const constraints: MathConstraint[] = [
    ...outputIds.map((id) => ({ id: `${id}:on-circle`, type: "point_on_circle" as const, entityIds: [id, circleId], fact, status: "SATISFIED" as const })),
    ...outputIds.map((id) => ({ id: `${id}:tangent`, type: "tangent" as const, entityIds: [externalPointId, id, circleId], fact, status: "SATISFIED" as const })),
    ...outputIds.map((id) => ({ id: `${id}:radius-perpendicular-tangent`, type: "perpendicular" as const, entityIds: [center.id, id, external.id], fact, status: "SATISFIED" as const })),
    { id: `${outputIds[0]}${externalPointId}:equal:${outputIds[1]}${externalPointId}`, type: "equal_length", entityIds: tangentSegments.map((segment) => segment.id), fact, status: "SATISFIED" },
  ];
  const next: MathScene = { ...scene, entities: [...scene.entities, ...points, ...tangentSegments], constraints: [...scene.constraints, ...constraints], semantics: { ...scene.semantics, dependencies: [...(scene.semantics?.dependencies ?? []), ...outputIds.map((id) => ({ id: `dependency:${id}`, dependentId: id, sourceIds: [circleId, externalPointId], kind: "TANGENT_POINTS_FROM_EXTERNAL_POINT", evaluatorRef: "visual-pedagogy/constructTangentsFromExternalPoint" }))] } };
  const validation = validateMathSceneEnvelope(next);
  return validation.status === "FAIL" ? { status: "FAIL", derivedPointIds: [], constraintIds: [], issues: validation.issues.map((issue) => issue.message) } : { status: "PASS", scene: next, derivedPointIds: [...outputIds], constraintIds: constraints.map((constraint) => constraint.id), issues: [] };
}
