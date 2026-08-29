import type { MathScene } from "../math-ir/index.js";
import { geometryAdapters } from "./adapters.js";
import { normalizeGeometryScene } from "./normalize.js";
import type { GeometryRenderRequirements, GeometryRenderResult, GeometryRendererId, GeometryRouteOptions, GeometryRouteResult, NormalizedGeometryScene } from "./types.js";

export function analyzeGeometryRequirements(scene: NormalizedGeometryScene, options: GeometryRouteOptions = {}): GeometryRenderRequirements {
  return {
    animation: options.animation ?? Boolean(scene.source.animations?.length),
    interaction: options.interaction ?? false,
    latexNative: options.latexNative ?? false,
    dynamicGeometry: options.dynamicGeometry ?? false,
    functionGraphs: options.functionGraphs ?? scene.classification.includes("function_graph"),
    folding: options.folding ?? false,
    camera3D: options.camera3D ?? (scene.dimension === "3d" && Boolean(scene.source.camera)),
    hiddenEdges: options.hiddenEdges ?? scene.hiddenEdgeIds.length > 0,
  };
}

function automaticTarget(scene: NormalizedGeometryScene, requirements: GeometryRenderRequirements): GeometryRendererId {
  if (requirements.dynamicGeometry) return "geogebra";
  if (requirements.interaction && scene.dimension === "3d") return "threejs";
  if (requirements.interaction || requirements.functionGraphs) return "geogebra";
  if (requirements.animation) return "manim";
  if (requirements.latexNative) return "tikz";
  if (scene.dimension === "3d") return "tikz";
  return "svg";
}

export function selectGeometryRenderer(scene: NormalizedGeometryScene, options: GeometryRouteOptions = {}): GeometryRouteResult {
  const requirements = analyzeGeometryRequirements(scene, options);
  const target = options.target ?? automaticTarget(scene, requirements);
  const result = geometryAdapters[target].canRender(scene, requirements);
  if (!result.available && result.status !== "FAIL") result.warnings.push({ code: "RENDERER_UNAVAILABLE", severity: "warning", path: "renderer", message: `${target} capability route is defined, but its runtime adapter is unavailable in IA-3.` });
  return result;
}

export function routeGeometry(scene: MathScene, options: GeometryRouteOptions = {}): { normalization: ReturnType<typeof normalizeGeometryScene>; route: GeometryRouteResult } {
  const normalization = normalizeGeometryScene(scene);
  if (!normalization.scene) return { normalization, route: { status: "FAIL", available: false, warnings: [], unsupported: normalization.issues } };
  return { normalization, route: selectGeometryRenderer(normalization.scene, options) };
}

export function renderGeometry(scene: MathScene, options: GeometryRouteOptions = {}): GeometryRenderResult {
  const routed = routeGeometry(scene, options);
  if (!routed.normalization.scene || !routed.route.renderer || routed.route.status === "FAIL") return routed.route;
  if (!routed.route.available) return routed.route;
  return geometryAdapters[routed.route.renderer].render(routed.normalization.scene, analyzeGeometryRequirements(routed.normalization.scene, options));
}
