import { MATH_ENTITY_TYPES, type LayoutCoordinate, type MathEntity, type MathScene, type SemanticCoordinate } from "../math-ir/index.js";
import { resolveGeometryEntities } from "./references.js";
import type { GeometryIssue, GeometryValidationResult } from "./types.js";

const pointTypes = new Set(["point"]);
const supportedTypes = new Set<string>(MATH_ENTITY_TYPES);
const finiteCoordinate = (coordinate: SemanticCoordinate | LayoutCoordinate | undefined) => !coordinate || (coordinate.dimension === "2d" ? Number.isFinite(coordinate.x) && Number.isFinite(coordinate.y) : coordinate.dimension === "3d" ? Number.isFinite(coordinate.x) && Number.isFinite(coordinate.y) && Number.isFinite(coordinate.z) : true);
const coordinateOf = (entity: MathEntity | undefined) => entity && entity.semanticCoordinate?.dimension !== "unknown" ? entity.semanticCoordinate : entity?.layoutCoordinate;

function issue(issues: GeometryIssue[], code: string, path: string, message: string): void { issues.push({ code, severity: "error", path, message }); }
function pointsAreDistinct(ids: string[]) { return new Set(ids).size === ids.length; }

export function validateGeometryScene(scene: MathScene): GeometryValidationResult {
  const issues: GeometryIssue[] = [];
  if (!scene || !Array.isArray(scene.entities) || !["2d", "3d"].includes(scene.dimension)) return { status: "FAIL", issues: [{ code: "INVALID_DIMENSION", severity: "error", path: "scene", message: "Geometry scene is malformed." }] };
  const resolved = resolveGeometryEntities(scene); issues.push(...resolved.issues);
  const byId = new Map(scene.entities.map((entity) => [entity.id, entity]));
  scene.entities.forEach((entity, index) => {
    const path = `entities[${index}]`;
    if (!supportedTypes.has(String(entity.type))) issue(issues, "UNSUPPORTED_GEOMETRY_ENTITY", `${path}.type`, `Unsupported geometry entity: ${String(entity.type)}`);
    if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(entity.id) || (entity.label && (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(entity.label) || entity.label.length > 500))) issue(issues, "UNSAFE_RENDERER_PAYLOAD", path, "Entity ID or label contains unsafe data.");
    if (!finiteCoordinate(entity.semanticCoordinate) || !finiteCoordinate(entity.layoutCoordinate)) {
      const values = [entity.semanticCoordinate, entity.layoutCoordinate].flatMap((coordinate) => coordinate && coordinate.dimension !== "unknown" ? [coordinate.x, coordinate.y, ...(coordinate.dimension === "3d" ? [coordinate.z] : [])] : []);
      issue(issues, values.some(Number.isNaN) ? "NAN_COORDINATE" : "INFINITE_COORDINATE", path, "Coordinates must be finite.");
    }
    const semantic = entity.semanticCoordinate;
    if (semantic && semantic.dimension !== "unknown" && semantic.dimension !== scene.dimension) issue(issues, "MIXED_2D_3D_CONFLICT", `${path}.semanticCoordinate`, "Semantic coordinate dimension conflicts with scene dimension.");
    const requirePoints = (ids: string[]) => ids.forEach((id, refIndex) => { if (byId.get(id) && !pointTypes.has(byId.get(id)!.type)) issue(issues, "INVALID_POINT_REFERENCE", `${path}.references[${refIndex}]`, `${id} is not a point.`); });
    if (entity.type === "line") requirePoints([...entity.pointIds]);
    if (entity.type === "ray") requirePoints([entity.startPointId, entity.throughPointId]);
    if (entity.type === "segment") {
      requirePoints([entity.startPointId, entity.endPointId]);
      if (entity.startPointId === entity.endPointId) issue(issues, "ZERO_LENGTH_SEGMENT", path, "Segment endpoints must be distinct.");
      const a = coordinateOf(byId.get(entity.startPointId)!), b = coordinateOf(byId.get(entity.endPointId)!);
      if (a && b && a.dimension === b.dimension && JSON.stringify(a) === JSON.stringify(b)) issue(issues, "ZERO_LENGTH_SEGMENT", path, "Segment endpoints have identical coordinates.");
    }
    if (["polygon", "triangle", "quadrilateral"].includes(entity.type)) {
      const ids = [...(entity as Extract<MathEntity, { type: "polygon" | "triangle" | "quadrilateral" }>).vertexIds]; requirePoints(ids);
      const minimum = entity.type === "triangle" ? 3 : entity.type === "quadrilateral" ? 4 : 3;
      if (ids.length < minimum || !pointsAreDistinct(ids)) issue(issues, "INVALID_POLYGON", path, "Polygon requires the expected number of distinct point references.");
    }
    if (entity.type === "circle" && byId.get(entity.centerPointId)?.type !== "point") issue(issues, "INVALID_CIRCLE", path, "Circle requires a valid center point.");
    if (entity.type === "plane") { requirePoints(entity.pointIds ?? []); if (!entity.equationExpressionId && (!entity.pointIds || entity.pointIds.length < 3 || !pointsAreDistinct(entity.pointIds))) issue(issues, "INVALID_PLANE", path, "Plane requires an equation or at least three distinct points."); }
    if (["prism", "pyramid", "polyhedron", "sphere", "cylinder", "cone"].includes(entity.type) && scene.dimension !== "3d") issue(issues, "INVALID_SOLID", path, "Solid entity requires a 3D scene.");
    if (entity.type === "pyramid" && (byId.get(entity.apexPointId)?.type !== "point" || !["polygon", "triangle", "quadrilateral"].includes(byId.get(entity.baseFaceId)?.type ?? ""))) issue(issues, "INVALID_SOLID", path, "Pyramid requires a point apex and polygonal base.");
    if (entity.type === "sphere" && byId.get(entity.centerPointId)?.type !== "point") issue(issues, "INVALID_SOLID", path, "Sphere requires a point center.");
    if (entity.type === "cylinder" && (entity.baseCenterIds.some((id) => byId.get(id)?.type !== "point") || !pointsAreDistinct(entity.baseCenterIds))) issue(issues, "INVALID_SOLID", path, "Cylinder requires two distinct point centers.");
    if (entity.type === "cone" && (byId.get(entity.apexPointId)?.type !== "point" || byId.get(entity.baseCenterPointId)?.type !== "point" || entity.apexPointId === entity.baseCenterPointId)) issue(issues, "INVALID_SOLID", path, "Cone requires distinct apex and base-center points.");
    if (entity.type === "prism" && (entity.baseFaceIds.some((id) => !["polygon", "triangle", "quadrilateral"].includes(byId.get(id)?.type ?? "")) || !pointsAreDistinct(entity.baseFaceIds))) issue(issues, "INVALID_SOLID", path, "Prism requires two distinct polygonal base faces.");
    if (entity.type === "polyhedron" && (entity.vertexIds.length < 4 || entity.vertexIds.some((id) => byId.get(id)?.type !== "point") || entity.edgeIds.some((id) => byId.get(id)?.type !== "segment") || entity.faceIds.some((id) => !["polygon", "triangle", "quadrilateral"].includes(byId.get(id)?.type ?? "")))) issue(issues, "INVALID_SOLID", path, "Polyhedron requires valid point vertices, segment edges, and polygonal faces.");
    if (entity.type === "function_graph" && !scene.expressions?.some((expression) => expression.id === entity.expressionId)) issue(issues, "MISSING_ENTITY_REFERENCE", `${path}.expressionId`, "Function graph expression is missing from the scene.");
  });
  return { status: issues.some((item) => item.severity === "error") ? "FAIL" : "PASS", issues };
}
