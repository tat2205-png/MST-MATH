import type { LayoutCoordinate, MathEntity, MathScene } from "../math-ir/index.js";
import { resolveGeometryEntities } from "./references.js";
import type { GeometryIssue, GeometryRenderCoordinate, NormalizedGeometryScene } from "./types.js";
import { validateGeometryScene } from "./validation.js";

const solidTypes = new Set(["prism", "pyramid", "polyhedron", "sphere", "cylinder", "cone"]);

function classify(scene: MathScene): NormalizedGeometryScene["classification"] {
  const result = new Set<NormalizedGeometryScene["classification"][number]>();
  for (const entity of scene.entities) {
    if (["point", "line", "ray", "segment", "vector", "polygon", "triangle", "quadrilateral", "circle", "arc", "angle_marker", "right_angle_marker"].includes(entity.type)) result.add(scene.dimension === "2d" ? "euclidean_2d" : "solid_3d");
    if (entity.type === "coordinate_axes_2d") result.add("coordinate_2d");
    if (entity.type === "coordinate_axes_3d") result.add("coordinate_3d");
    if (entity.type === "function_graph") result.add("function_graph");
    if (solidTypes.has(entity.type) || entity.type === "plane") result.add("solid_3d");
    if (entity.type === "measurement") result.add("measurement");
    if (["label", "angle_marker", "right_angle_marker"].includes(entity.type)) result.add("annotation");
  }
  return [...result];
}

function sourceCoordinate(entity: MathEntity): GeometryRenderCoordinate | undefined {
  if (entity.semanticCoordinate && entity.semanticCoordinate.dimension !== "unknown") return { entityId: entity.id, coordinate: entity.semanticCoordinate, origin: "semantic" };
  if (entity.layoutCoordinate) return { entityId: entity.id, coordinate: entity.layoutCoordinate, origin: "layout" };
  return undefined;
}

function visualCandidate(index: number, count: number, dimension: "2d" | "3d"): LayoutCoordinate {
  if (dimension === "2d") {
    const angle = count <= 1 ? 0 : (2 * Math.PI * index) / count;
    return { dimension: "2d", x: Number((2 * Math.cos(angle)).toFixed(6)), y: Number((2 * Math.sin(angle)).toFixed(6)) };
  }
  const candidates: Array<[number, number, number]> = [[0,0,2],[0,0,0],[2,0,0],[2,2,0],[0,2,0],[2,0,2],[2,2,2],[0,2,2]];
  const value = candidates[index % candidates.length];
  return { dimension: "3d", x: value[0], y: value[1], z: value[2] };
}

export function normalizeGeometryScene(scene: MathScene): { status: "PASS" | "FAIL"; scene?: NormalizedGeometryScene; issues: GeometryIssue[] } {
  const validation = validateGeometryScene(scene);
  if (validation.status === "FAIL") return { status: "FAIL", issues: validation.issues };
  const resolution = resolveGeometryEntities(scene);
  const pointEntities = scene.entities.filter((entity) => entity.type === "point");
  const warnings: GeometryIssue[] = [];
  const renderCoordinates: GeometryRenderCoordinate[] = [];
  pointEntities.forEach((entity, index) => {
    const coordinate = sourceCoordinate(entity);
    if (coordinate) renderCoordinates.push(coordinate);
    else {
      renderCoordinates.push({ entityId: entity.id, coordinate: visualCandidate(index, pointEntities.length, scene.dimension), origin: "visual_only" });
      warnings.push({ code: "VISUAL_ONLY_LAYOUT", severity: "warning", path: `entities.${entity.id}`, message: "Missing point coordinates received a deterministic visual-only layout candidate; no mathematical fact was inferred." });
    }
  });
  const hiddenEdgeIds = new Set<string>();
  scene.styles?.forEach((style) => { if (style.hiddenEdge) style.entityIds?.forEach((id) => hiddenEdgeIds.add(id)); });
  const graphHints = scene.entities.filter((entity) => entity.type === "function_graph").map((entity) => ({ entityId: entity.id, expressionId: entity.expressionId, ...(entity.domainExpressionId ? { domainExpressionId: entity.domainExpressionId } : {}), ...(entity.axesId ? { axesId: entity.axesId } : {}), sampling: "adapter_determined" as const }));
  return { status: "PASS", scene: { source: scene, dimension: scene.dimension, classification: classify(scene), entities: resolution.entities, renderCoordinates, hiddenEdgeIds: [...hiddenEdgeIds].sort(), graphHints, warnings }, issues: warnings };
}
