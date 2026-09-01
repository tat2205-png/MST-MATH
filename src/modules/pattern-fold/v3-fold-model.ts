import type { Vec3 } from "../fold-3d/types.js";
export const V3_FOLD_MODEL = { sheetSide: 8, cornerOffset: 1, outerEdge: 6, trapezoidWidth: 2.5, defaultBaseSide: 3, minBaseSide: 1, maxBaseSide: 5.5, baseSideStep: .1 } as const;
export const v3Q = (t: number) => Math.sqrt(6.25 - 4 * t * t);
export const v3H = (t: number) => 2 * t;
export const v3SidePoint = (point: Vec3, hinge: Vec3, outward: Vec3, t: number): Vec3 => { const dx = point[0] - hinge[0], dy = point[1] - hinge[1], q = v3Q(t), h = v3H(t), length = Math.hypot(dx, dy) || 1; const radial = (dx * outward[0] + dy * outward[1]) / length; return [point[0] + outward[0] * radial * (q / 2.5 - 1), point[1] + outward[1] * radial * (q / 2.5 - 1), h * radial / length]; };
