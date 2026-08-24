import type { GeometrySpec } from "../../src/types/geometrySpec.js";
import type { GeometryEngine } from "./geometryEngine.js";

export const luaDrawFlags = {
  enabled: process.env.LUADRAW_ENABLED === "true",
  netEnabled: process.env.LUADRAW_NET_ENABLED === "true",
  threeDEnabled: process.env.LUADRAW_3D_ENABLED === "true",
  autoRoute: process.env.LUADRAW_AUTO_ROUTE === "true",
};

export function routeGeometry(spec: GeometrySpec, luaDraw: GeometryEngine): GeometryEngine | null {
  if (!luaDrawFlags.enabled || !luaDrawFlags.autoRoute) return null;
  if (spec.geometryType === "POLYHEDRON_NET" && !luaDrawFlags.netEnabled) return null;
  if (spec.geometryType === "POLYHEDRON" && !luaDrawFlags.threeDEnabled) return null;
  return luaDraw;
}
