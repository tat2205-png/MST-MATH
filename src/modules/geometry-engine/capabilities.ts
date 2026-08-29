import type { GeometryRendererId, RendererCapabilities } from "./types.js";

export interface GeometryRendererDescriptor { id: GeometryRendererId; available: boolean; implementation: "render" | "compatibility" | "contract"; capabilities: RendererCapabilities; }

const base = (overrides: Partial<RendererCapabilities>): RendererCapabilities => ({ dimension2D: "no", dimension3D: "no", animation: "no", interaction: "no", latexNative: "no", dynamicGeometry: "no", functionGraphs: "no", folding: "no", camera3D: "no", hiddenEdges: "no", ...overrides });

export const GEOMETRY_RENDERERS: Record<GeometryRendererId, GeometryRendererDescriptor> = {
  svg: { id: "svg", available: true, implementation: "render", capabilities: base({ dimension2D: "yes", dimension3D: "no", hiddenEdges: "yes", functionGraphs: "no" }) },
  tikz: { id: "tikz", available: true, implementation: "render", capabilities: base({ dimension2D: "yes", dimension3D: "limited", latexNative: "yes", hiddenEdges: "yes", functionGraphs: "no" }) },
  luadraw: { id: "luadraw", available: false, implementation: "compatibility", capabilities: base({ dimension2D: "yes", dimension3D: "limited", latexNative: "yes", hiddenEdges: "limited", functionGraphs: "no" }) },
  manim: { id: "manim", available: false, implementation: "compatibility", capabilities: base({ dimension2D: "yes", dimension3D: "yes", animation: "yes", functionGraphs: "yes", camera3D: "yes", hiddenEdges: "yes" }) },
  threejs: { id: "threejs", available: false, implementation: "contract", capabilities: base({ dimension2D: "limited", dimension3D: "yes", animation: "yes", interaction: "yes", camera3D: "yes", hiddenEdges: "yes", folding: "limited" }) },
  geogebra: { id: "geogebra", available: false, implementation: "contract", capabilities: base({ dimension2D: "yes", dimension3D: "yes", animation: "limited", interaction: "yes", dynamicGeometry: "yes", functionGraphs: "yes", camera3D: "yes" }) },
};

export function getGeometryCapabilityMatrix(): GeometryRendererDescriptor[] { return Object.values(GEOMETRY_RENDERERS).map((renderer) => ({ ...renderer, capabilities: { ...renderer.capabilities } })); }
