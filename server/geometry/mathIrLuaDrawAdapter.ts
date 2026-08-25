import type { GeometrySpec } from "../../src/types/geometrySpec.js";
import type { MathEntity, MathScene } from "../../src/modules/math-ir/index.js";
import { normalizeGeometryScene } from "../../src/modules/geometry-engine/normalize.js";
import { fingerprintGeometry } from "./geometryValidator.js";

export interface LuaDrawCompatibilityResult { status: "PASS" | "FAIL"; spec?: GeometrySpec; errors: string[]; }

export function mathSceneToLuaDrawSpec(scene: MathScene): LuaDrawCompatibilityResult {
  const normalized = normalizeGeometryScene(scene);
  if (!normalized.scene) return { status: "FAIL", errors: normalized.issues.map((issue) => `${issue.code}: ${issue.message}`) };
  const coordinates = new Map(normalized.scene.renderCoordinates.map((item) => [item.entityId, item.coordinate]));
  const points = scene.entities.filter((entity) => entity.type === "point");
  const vertices = points.map((point) => {
    const coordinate = coordinates.get(point.id)!;
    return coordinate.dimension === "2d" ? { id: point.id, x: coordinate.x, y: coordinate.y } : { id: point.id, x: coordinate.x, y: coordinate.y, z: coordinate.z };
  });
  const edgeEntities = scene.entities.filter((entity): entity is Extract<MathEntity, { type: "segment" }> => entity.type === "segment");
  const edges = edgeEntities.map((edge) => ({ id: edge.id, vertices: [edge.startPointId, edge.endPointId] as [string, string] }));
  const faceEntities = scene.entities.filter((entity): entity is Extract<MathEntity, { type: "polygon" | "triangle" | "quadrilateral" }> => ["polygon", "triangle", "quadrilateral"].includes(entity.type));
  const faces = faceEntities.map((face) => ({ id: face.id, vertices: [...face.vertexIds] }));
  if (!vertices.length || (!edges.length && !faces.length)) return { status: "FAIL", errors: ["LUADRAW_COMPATIBILITY_UNSUPPORTED: scene needs point coordinates and segment or polygon entities."] };
  const unsigned: Omit<GeometrySpec, "sourceFingerprint"> = {
    schemaVersion: "1.0", taskId: scene.id.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 80) || "math_ir_scene",
    geometryType: scene.dimension === "2d" ? (scene.entities.some((entity) => entity.type === "coordinate_axes_2d") ? "COORDINATE_2D" : "POLYGON_2D") : "POLYHEDRON",
    vertices, edges, faces,
    labels: points.filter((point) => point.label).map((point) => ({ id: `label_${point.id}`, text: point.label!, vertex: point.id })),
    dimensions: [], adjacency: [], renderOptions: { outputFormat: "PDF_SVG", strokeColor: "blue" },
  };
  return { status: "PASS", spec: { ...unsigned, sourceFingerprint: fingerprintGeometry(unsigned) }, errors: [] };
}
