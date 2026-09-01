import type { Vec2 } from "../fold-3d/types.js";

export type PlanarGeometry = { kind: "polygon"; vertices: Vec2[] } | { kind: "circle"; center: Vec2; radius: number };
const EPSILON = 1e-8;
export function containsPoint(geometry: PlanarGeometry, point: Vec2): boolean {
  if (geometry.kind === "circle") return Math.hypot(point[0] - geometry.center[0], point[1] - geometry.center[1]) <= geometry.radius + EPSILON;
  let inside = false;
  for (let i = 0, j = geometry.vertices.length - 1; i < geometry.vertices.length; j = i++) {
    const a = geometry.vertices[i], b = geometry.vertices[j], cross = (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]);
    if (Math.abs(cross) < EPSILON && point[0] >= Math.min(a[0], b[0]) - EPSILON && point[0] <= Math.max(a[0], b[0]) + EPSILON && point[1] >= Math.min(a[1], b[1]) - EPSILON && point[1] <= Math.max(a[1], b[1]) + EPSILON) return true;
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
