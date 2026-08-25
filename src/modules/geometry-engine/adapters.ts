import type { MathEntity, MathStyle } from "../math-ir/index.js";
import { GEOMETRY_RENDERERS } from "./capabilities.js";
import type { GeometryIssue, GeometryRenderRequirements, GeometryRenderResult, GeometryRendererAdapter, NormalizedGeometryScene } from "./types.js";

const number = (value: number) => Number(value.toFixed(6)).toString();
const xml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const tex = (value: string) => value.replace(/([#$%&_{}])/g, "\\$1").replace(/[\u0000-\u001F\u007F]/g, "").slice(0, 500);

function coordinateMap(scene: NormalizedGeometryScene): Map<string, { x: number; y: number }> {
  return new Map(scene.renderCoordinates.map(({ entityId, coordinate }) => [entityId, coordinate.dimension === "2d" ? { x: coordinate.x, y: coordinate.y } : { x: coordinate.x + 0.5 * coordinate.z, y: coordinate.y + 0.35 * coordinate.z }]));
}

function styleFor(scene: NormalizedGeometryScene, entityId: string): MathStyle | undefined { return scene.source.styles?.find((style) => style.entityIds?.includes(entityId)); }
function references(entity: MathEntity): string[] {
  if (entity.type === "segment") return [entity.startPointId, entity.endPointId];
  if (entity.type === "line") return [...entity.pointIds];
  if (entity.type === "ray") return [entity.startPointId, entity.throughPointId];
  if (["polygon", "triangle", "quadrilateral"].includes(entity.type)) return [...(entity as Extract<MathEntity, { type: "polygon" | "triangle" | "quadrilateral" }>).vertexIds];
  return [];
}

function capabilityCheck(adapter: GeometryRendererAdapter, scene: NormalizedGeometryScene, requirements: GeometryRenderRequirements = {}) {
  const unsupported: GeometryIssue[] = [];
  const required: Array<[keyof GeometryRenderRequirements, keyof typeof adapter.capabilities]> = [["animation","animation"],["interaction","interaction"],["latexNative","latexNative"],["dynamicGeometry","dynamicGeometry"],["functionGraphs","functionGraphs"],["folding","folding"],["camera3D","camera3D"],["hiddenEdges","hiddenEdges"]];
  const dimension = scene.dimension === "2d" ? adapter.capabilities.dimension2D : adapter.capabilities.dimension3D;
  if (dimension === "no") unsupported.push({ code: "UNSUPPORTED_RENDER_TARGET", severity: "error", path: "scene.dimension", message: `${adapter.id} does not support ${scene.dimension}.` });
  for (const [requirement, capability] of required) if (requirements[requirement] && adapter.capabilities[capability] === "no") unsupported.push({ code: "UNSUPPORTED_RENDER_TARGET", severity: "error", path: `requirements.${requirement}`, message: `${adapter.id} does not support ${requirement}.` });
  const limited = dimension === "limited" || required.some(([requirement, capability]) => requirements[requirement] && adapter.capabilities[capability] === "limited");
  return { unsupported, limited };
}

abstract class BaseAdapter implements GeometryRendererAdapter {
  abstract readonly id: GeometryRendererAdapter["id"];
  abstract readonly capabilities: GeometryRendererAdapter["capabilities"];
  abstract readonly available: boolean;
  canRender(scene: NormalizedGeometryScene, requirements: GeometryRenderRequirements = {}) {
    const { unsupported, limited } = capabilityCheck(this, scene, requirements);
    const warnings = limited ? [{ code: "LIMITED_RENDERER_CAPABILITY", severity: "warning" as const, path: "renderer", message: `${this.id} has limited support for requested scene capabilities.` }] : [];
    return { status: unsupported.length ? "FAIL" as const : limited || !this.available ? "PARTIAL" as const : "PASS" as const, renderer: this.id, available: this.available, warnings, unsupported };
  }
  abstract render(scene: NormalizedGeometryScene, options?: GeometryRenderRequirements): GeometryRenderResult;
}

export class SvgGeometryAdapter extends BaseAdapter {
  readonly id = "svg" as const; readonly capabilities = GEOMETRY_RENDERERS.svg.capabilities; readonly available = true;
  render(scene: NormalizedGeometryScene, options: GeometryRenderRequirements = {}): GeometryRenderResult {
    const gate = this.canRender(scene, options); if (gate.status === "FAIL") return gate;
    const coords = coordinateMap(scene), primitives: string[] = [], warnings = [...gate.warnings, ...scene.warnings];
    const xs = [...coords.values()].map((p) => p.x), ys = [...coords.values()].map((p) => p.y);
    const minX = Math.min(...xs, -1), maxX = Math.max(...xs, 1), minY = Math.min(...ys, -1), maxY = Math.max(...ys, 1);
    const sx = (x: number) => 40 + ((x - minX) / Math.max(1e-9, maxX - minX)) * 560;
    const sy = (y: number) => 440 - ((y - minY) / Math.max(1e-9, maxY - minY)) * 400;
    for (const resolved of scene.entities) {
      const entity = resolved.entity, style = styleFor(scene, entity.id), hidden = scene.hiddenEdgeIds.includes(entity.id) || style?.hiddenEdge;
      const stroke = xml(style?.strokeStyle ?? "#1d4ed8"), width = number(style?.lineWidth ?? 2), dash = hidden || style?.lineStyle === "dashed" ? ' stroke-dasharray="8 6"' : style?.lineStyle === "dotted" ? ' stroke-dasharray="2 5"' : "";
      const ids = references(entity), points = ids.map((id) => coords.get(id)).filter((p): p is {x:number;y:number} => Boolean(p));
      if (["segment", "line", "ray"].includes(entity.type) && points.length === 2) primitives.push(`<line id="${xml(entity.id)}" x1="${number(sx(points[0].x))}" y1="${number(sy(points[0].y))}" x2="${number(sx(points[1].x))}" y2="${number(sy(points[1].y))}" stroke="${stroke}" stroke-width="${width}"${dash}/>`);
      else if (["polygon", "triangle", "quadrilateral"].includes(entity.type) && points.length >= 3) primitives.push(`<polygon id="${xml(entity.id)}" points="${points.map((p) => `${number(sx(p.x))},${number(sy(p.y))}`).join(" ")}" fill="${xml(style?.fillStyle ?? "none")}" stroke="${stroke}" stroke-width="${width}"${dash}/>`);
      else if (entity.type === "circle") { const center = coords.get(entity.centerPointId); if (center) { warnings.push({ code: "VISUAL_ONLY_RADIUS", severity: "warning", path: `entities.${entity.id}`, message: "Circle radius lacks numeric geometry evaluation; renderer used a visual-only radius." }); primitives.push(`<circle id="${xml(entity.id)}" cx="${number(sx(center.x))}" cy="${number(sy(center.y))}" r="40" fill="${xml(style?.fillStyle ?? "none")}" stroke="${stroke}" stroke-width="${width}"/>`); } }
      else if (entity.type === "point") { const p = coords.get(entity.id); if (p) primitives.push(`<circle id="${xml(entity.id)}" cx="${number(sx(p.x))}" cy="${number(sy(p.y))}" r="4" fill="${stroke}"/>`); }
      if (entity.label) { const p = coords.get(entity.id) ?? points[0]; if (p) primitives.push(`<text x="${number(sx(p.x)+7)}" y="${number(sy(p.y)-7)}" font-size="16" fill="#111827">${xml(entity.label)}</text>`); }
    }
    const content = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480" role="img" aria-label="${xml(scene.source.name)}">${primitives.join("")}</svg>`;
    return { ...gate, status: warnings.length ? "PARTIAL" : "PASS", warnings, output: { kind: "svg", content, mimeType: "image/svg+xml" } };
  }
}

export class TikzGeometryAdapter extends BaseAdapter {
  readonly id = "tikz" as const; readonly capabilities = GEOMETRY_RENDERERS.tikz.capabilities; readonly available = true;
  render(scene: NormalizedGeometryScene, options: GeometryRenderRequirements = {}): GeometryRenderResult {
    const gate = this.canRender(scene, options); if (gate.status === "FAIL") return gate;
    const coords = coordinateMap(scene), lines: string[] = ["\\begin{tikzpicture}[scale=1]"]; const warnings = [...gate.warnings, ...scene.warnings];
    for (const entity of scene.source.entities) {
      const point = coords.get(entity.id); if (entity.type === "point" && point) lines.push(`\\coordinate (${tex(entity.id)}) at (${number(point.x)},${number(point.y)});`);
    }
    for (const entity of scene.source.entities) {
      const style = styleFor(scene, entity.id), option = scene.hiddenEdgeIds.includes(entity.id) || style?.hiddenEdge || style?.lineStyle === "dashed" ? "[dashed]" : style?.lineStyle === "dotted" ? "[dotted]" : "";
      const ids = references(entity);
      if (["segment", "line", "ray"].includes(entity.type) && ids.length === 2) lines.push(`\\draw${option} (${tex(ids[0])}) -- (${tex(ids[1])});`);
      else if (["polygon", "triangle", "quadrilateral"].includes(entity.type) && ids.length >= 3) lines.push(`\\draw${option} ${ids.map((id) => `(${tex(id)})`).join(" -- ")} -- cycle;`);
      else if (entity.type === "circle") { warnings.push({ code: "VISUAL_ONLY_RADIUS", severity: "warning", path: `entities.${entity.id}`, message: "Circle radius lacks numeric geometry evaluation; renderer used a visual-only radius." }); lines.push(`\\draw${option} (${tex(entity.centerPointId)}) circle (1);`); }
      if (entity.label) { const anchor = entity.type === "point" ? entity.id : ids[0]; if (anchor) lines.push(`\\node[above] at (${tex(anchor)}) {${tex(entity.label)}};`); }
    }
    lines.push("\\end{tikzpicture}");
    return { ...gate, status: warnings.length ? "PARTIAL" : "PASS", warnings, output: { kind: "tikz", content: lines.join("\n"), mimeType: "text/x-tex" } };
  }
}

class ContractAdapter extends BaseAdapter {
  constructor(readonly id: "luadraw" | "manim" | "threejs" | "geogebra") { super(); }
  get capabilities() { return GEOMETRY_RENDERERS[this.id].capabilities; }
  readonly available = false;
  render(scene: NormalizedGeometryScene, options: GeometryRenderRequirements = {}): GeometryRenderResult {
    const gate = this.canRender(scene, options);
    return { ...gate, status: gate.status === "FAIL" ? "FAIL" : "PARTIAL", warnings: [...gate.warnings, { code: "RENDERER_UNAVAILABLE", severity: "warning", path: "renderer", message: `${this.id} is a compatibility contract and was not executed.` }] };
  }
}

export const geometryAdapters: Record<GeometryRendererAdapter["id"], GeometryRendererAdapter> = { svg: new SvgGeometryAdapter(), tikz: new TikzGeometryAdapter(), luadraw: new ContractAdapter("luadraw"), manim: new ContractAdapter("manim"), threejs: new ContractAdapter("threejs"), geogebra: new ContractAdapter("geogebra") };
