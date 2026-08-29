import type { GeometrySpec } from "../../types/geometrySpec.js";
import type { LayoutCoordinate, MathEntity, MathScene } from "../math-ir/index.js";

export type GeometryRendererId = "svg" | "tikz" | "luadraw" | "manim" | "threejs" | "geogebra";
export type CapabilityLevel = "yes" | "limited" | "no";

export interface RendererCapabilities {
  dimension2D: CapabilityLevel;
  dimension3D: CapabilityLevel;
  animation: CapabilityLevel;
  interaction: CapabilityLevel;
  latexNative: CapabilityLevel;
  dynamicGeometry: CapabilityLevel;
  functionGraphs: CapabilityLevel;
  folding: CapabilityLevel;
  camera3D: CapabilityLevel;
  hiddenEdges: CapabilityLevel;
}

export interface GeometryIssue {
  code: string;
  severity: "error" | "warning";
  path: string;
  message: string;
}

export interface GeometryValidationResult { status: "PASS" | "FAIL"; issues: GeometryIssue[]; }

export interface ResolvedGeometryEntity {
  entityId: string;
  entity: MathEntity;
  referencedEntityIds: string[];
  resolvedReferences: MathEntity[];
}

export interface GeometryRenderCoordinate {
  entityId: string;
  coordinate: LayoutCoordinate;
  origin: "semantic" | "layout" | "visual_only";
}

export interface NormalizedGeometryScene {
  source: MathScene;
  dimension: "2d" | "3d";
  classification: Array<"euclidean_2d" | "coordinate_2d" | "function_graph" | "solid_3d" | "coordinate_3d" | "measurement" | "annotation">;
  entities: ResolvedGeometryEntity[];
  renderCoordinates: GeometryRenderCoordinate[];
  hiddenEdgeIds: string[];
  graphHints: Array<{ entityId: string; expressionId: string; domainExpressionId?: string; axesId?: string; sampling: "adapter_determined" }>;
  warnings: GeometryIssue[];
}

export interface GeometryRenderRequirements {
  animation?: boolean;
  interaction?: boolean;
  latexNative?: boolean;
  dynamicGeometry?: boolean;
  functionGraphs?: boolean;
  folding?: boolean;
  camera3D?: boolean;
  hiddenEdges?: boolean;
}

export interface GeometryRouteOptions extends GeometryRenderRequirements { target?: GeometryRendererId; }

export interface GeometryRouteResult {
  status: "PASS" | "PARTIAL" | "FAIL";
  renderer?: GeometryRendererId;
  available: boolean;
  warnings: GeometryIssue[];
  unsupported: GeometryIssue[];
}

export type GeometryRendererOutput =
  | { kind: "svg"; content: string; mimeType: "image/svg+xml" }
  | { kind: "tikz"; content: string; mimeType: "text/x-tex" }
  | { kind: "luadraw_geometry_spec"; spec: GeometrySpec }
  | { kind: "manim_scene_contract"; scene: MathScene };

export interface GeometryRenderResult extends GeometryRouteResult { output?: GeometryRendererOutput; }

export interface GeometryRendererAdapter {
  readonly id: GeometryRendererId;
  readonly capabilities: RendererCapabilities;
  readonly available: boolean;
  canRender(scene: NormalizedGeometryScene, requirements?: GeometryRenderRequirements): GeometryRouteResult;
  render(scene: NormalizedGeometryScene, options?: GeometryRouteOptions): GeometryRenderResult;
}
