import crypto from "node:crypto";
import type { GeometrySpec, GeometryValidationReport } from "../../src/types/geometrySpec.js";

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const edgeKey = (a: string, b: string) => [a, b].sort().join("|");

export function fingerprintGeometry(spec: Omit<GeometrySpec, "sourceFingerprint">): string {
  return crypto.createHash("sha256").update(JSON.stringify(spec)).digest("hex");
}

function polygonsOverlap(a: Array<[number, number]>, b: Array<[number, number]>): boolean {
  const bounds = (p: Array<[number, number]>) => ({
    minX: Math.min(...p.map(([x]) => x)), maxX: Math.max(...p.map(([x]) => x)),
    minY: Math.min(...p.map(([, y]) => y)), maxY: Math.max(...p.map(([, y]) => y)),
  });
  const x = bounds(a), y = bounds(b);
  const area = Math.min(x.maxX, y.maxX) - Math.max(x.minX, y.minX);
  const height = Math.min(x.maxY, y.maxY) - Math.max(x.minY, y.minY);
  return area > 1e-9 && height > 1e-9;
}

export function validateGeometrySpec(spec: GeometrySpec): GeometryValidationReport {
  const errors: string[] = [];
  const checks: GeometryValidationReport["checks"] = {};
  if (!["POLYGON_2D", "COORDINATE_2D", "POLYHEDRON", "POLYHEDRON_NET"].includes(spec.geometryType)) errors.push("Unsupported geometry type.");
  if (spec.schemaVersion !== "1.0" || !/^[A-Za-z0-9_-]+$/.test(spec.taskId)) errors.push("Invalid schema version or taskId.");
  const ids = new Set<string>();
  for (const vertex of spec.vertices) {
    if (!vertex.id || ids.has(vertex.id) || !finite(vertex.x) || !finite(vertex.y) || (vertex.z !== undefined && !finite(vertex.z))) errors.push(`Invalid vertex ${vertex.id}.`);
    ids.add(vertex.id);
  }
  checks.VERTEX_QA = errors.some((e) => e.includes("vertex")) ? "FAIL" : "PASS";
  const edgeMap = new Map<string, string>();
  for (const edge of spec.edges) {
    const [a, b] = edge.vertices;
    if (!edge.id || a === b || !ids.has(a) || !ids.has(b) || edgeMap.has(edgeKey(a, b))) errors.push(`Invalid edge ${edge.id}.`);
    edgeMap.set(edgeKey(a, b), edge.id);
  }
  checks.EDGE_QA = errors.some((e) => e.includes("edge")) ? "FAIL" : "PASS";
  for (const face of spec.faces) {
    if (!face.id || face.vertices.length < 3 || new Set(face.vertices).size !== face.vertices.length || face.vertices.some((id) => !ids.has(id))) errors.push(`Invalid face ${face.id}.`);
    for (let i = 0; i < face.vertices.length; i++) if (!edgeMap.has(edgeKey(face.vertices[i], face.vertices[(i + 1) % face.vertices.length]))) errors.push(`Face ${face.id} references a missing boundary edge.`);
  }
  checks.FACE_QA = errors.some((e) => e.includes("face") || e.includes("Face")) ? "FAIL" : "PASS";
  const faceIds = new Set(spec.faces.map((face) => face.id));
  for (const relation of spec.adjacency) if (relation.faces.some((id) => !faceIds.has(id)) || !spec.edges.some((edge) => edge.id === relation.edge)) errors.push("Invalid face adjacency.");
  checks.FACE_ADJACENCY_QA = errors.some((e) => e.includes("adjacency")) ? "FAIL" : "PASS";
  for (const dimension of spec.dimensions) if (!spec.edges.some((edge) => edge.id === dimension.edge) || !finite(dimension.value) || dimension.value <= 0 || !dimension.label) errors.push(`Invalid dimension ${dimension.id}.`);
  checks.DIMENSION_QA = errors.some((e) => e.includes("dimension")) ? "FAIL" : "PASS";
  for (const label of spec.labels) if (!label.text || (label.vertex && !ids.has(label.vertex)) || (!label.vertex && !label.position)) errors.push(`Invalid label ${label.id}.`);
  checks.LABEL_QA = errors.some((e) => e.includes("label")) ? "FAIL" : "PASS";
  const edgeUse = new Map<string, number>();
  for (const face of spec.faces) for (let i = 0; i < face.vertices.length; i++) { const key = edgeKey(face.vertices[i], face.vertices[(i + 1) % face.vertices.length]); edgeUse.set(key, (edgeUse.get(key) || 0) + 1); }
  const manifold = spec.geometryType.startsWith("POLYHEDRON") ? [...edgeUse.values()].every((count) => count === 2) : true;
  if (!manifold) errors.push("Polyhedron is not a closed 2-manifold.");
  checks.MANIFOLD_QA = spec.geometryType.startsWith("POLYHEDRON") ? (manifold ? "PASS" : "FAIL") : "NOT_APPLICABLE";
  if (spec.net) {
    const coords = spec.net.faceCoordinates;
    const netFaceIds = Object.keys(coords);
    const connected = faceIds.has(spec.net.rootFace) && spec.net.adjacency.length === Math.max(0, spec.faces.length - 1);
    const faceCount = netFaceIds.length === spec.faces.length && netFaceIds.every((id) => faceIds.has(id));
    const edgeMatch = spec.net.adjacency.every((item) => faceIds.has(item.faces[0]) && faceIds.has(item.faces[1]) && spec.edges.some((edge) => edge.id === item.hingeEdge));
    let overlap = false;
    for (let i = 0; i < netFaceIds.length; i++) for (let j = i + 1; j < netFaceIds.length; j++) if (polygonsOverlap(coords[netFaceIds[i]], coords[netFaceIds[j]])) overlap = true;
    checks.NET_CONNECTED = connected ? "PASS" : "FAIL";
    checks.NET_FACE_COUNT = faceCount ? "PASS" : "FAIL";
    checks.NET_EDGE_MATCH = edgeMatch ? "PASS" : "FAIL";
    checks.NET_OVERLAP = overlap ? "FAIL" : "PASS";
    if (!connected || !faceCount || !edgeMatch || overlap) errors.push("Invalid or overlapping polyhedron net.");
  } else for (const key of ["NET_CONNECTED", "NET_FACE_COUNT", "NET_EDGE_MATCH", "NET_OVERLAP"]) checks[key] = "NOT_APPLICABLE";
  const { sourceFingerprint: _, ...unsigned } = spec;
  if (spec.sourceFingerprint !== fingerprintGeometry(unsigned)) errors.push("Source fingerprint mismatch.");
  checks.SOURCE_PROVENANCE_QA = errors.some((e) => e.includes("fingerprint")) ? "FAIL" : "PASS";
  return { status: errors.length ? "FAIL" : "PASS", checks, errors };
}
