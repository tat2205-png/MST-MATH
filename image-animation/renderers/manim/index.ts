import {
  assertValidSceneGraph,
  orderSceneNodes,
  type SceneGraph,
  type SceneNode,
  type Vec2,
  type VisualStyle,
} from "../../core/scene-graph/index.ts";

export interface ManimLayout {
  readonly frameWidth?: number;
  readonly frameHeight?: number;
  readonly margin?: number;
}

export interface ManimCompileOptions {
  readonly sceneClassName?: string;
  readonly layout?: ManimLayout;
}

export interface ManimLayoutIssue {
  readonly nodeId: string;
  readonly code: "OUTSIDE_FRAME";
  readonly message: string;
}

export interface ManimCompilation {
  readonly source: string;
  readonly nodeOrder: readonly string[];
}

export class ManimCompileError extends TypeError {
  readonly issues: readonly ManimLayoutIssue[];

  constructor(issues: readonly ManimLayoutIssue[]) {
    super(`Manim compilation rejected:\n${issues.map((issue) => `${issue.nodeId} [${issue.code}] ${issue.message}`).join("\n")}`);
    this.name = "ManimCompileError";
    this.issues = issues;
  }
}

interface Bounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

const DEFAULT_FRAME_WIDTH = 14.222222222222221;
const DEFAULT_FRAME_HEIGHT = 8;

function pythonString(value: string): string {
  return JSON.stringify(value)
    .replaceAll("\\u2028", "\\u2028")
    .replaceAll("\\u2029", "\\u2029");
}

function numberLiteral(value: number): string {
  if (Object.is(value, -0)) return "0";
  return String(value);
}

function vector(point: Vec2): string {
  return `[${numberLiteral(point.x)}, ${numberLiteral(point.y)}, 0]`;
}

function pointsBounds(points: readonly Vec2[]): Bounds {
  return {
    minX: Math.min(...points.map((point) => point.x)),
    maxX: Math.max(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
}

function nodeBounds(node: SceneNode): Bounds {
  const geometry = node.geometry;
  switch (geometry.kind) {
    case "point":
      return { minX: geometry.x, maxX: geometry.x, minY: geometry.y, maxY: geometry.y };
    case "segment":
    case "arrow":
      return pointsBounds([geometry.start, geometry.end]);
    case "polyline":
    case "polygon":
      return pointsBounds(geometry.points);
    case "circle":
      return {
        minX: geometry.center.x - geometry.radius,
        maxX: geometry.center.x + geometry.radius,
        minY: geometry.center.y - geometry.radius,
        maxY: geometry.center.y + geometry.radius,
      };
    case "label":
      return {
        minX: geometry.position.x,
        maxX: geometry.position.x,
        minY: geometry.position.y,
        maxY: geometry.position.y,
      };
    case "image_layer":
      return {
        minX: geometry.position.x - geometry.width / 2,
        maxX: geometry.position.x + geometry.width / 2,
        minY: geometry.position.y - geometry.height / 2,
        maxY: geometry.position.y + geometry.height / 2,
      };
  }
}

function positiveFinite(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new TypeError(`${name} must be a positive finite number.`);
  }
  return value;
}

function nonNegativeFinite(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError(`${name} must be a non-negative finite number.`);
  }
  return value;
}

function validateLayout(nodes: readonly SceneNode[], layout: ManimLayout | undefined): void {
  const frameWidth = positiveFinite(layout?.frameWidth ?? DEFAULT_FRAME_WIDTH, "layout.frameWidth");
  const frameHeight = positiveFinite(layout?.frameHeight ?? DEFAULT_FRAME_HEIGHT, "layout.frameHeight");
  const margin = nonNegativeFinite(layout?.margin ?? 0, "layout.margin");
  const limitX = frameWidth / 2 - margin;
  const limitY = frameHeight / 2 - margin;
  if (limitX < 0 || limitY < 0) {
    throw new TypeError("layout.margin must leave a non-negative drawable frame.");
  }

  const issues: ManimLayoutIssue[] = [];
  for (const node of nodes) {
    if (node.style.visible === false) continue;
    const bounds = nodeBounds(node);
    if (bounds.minX < -limitX || bounds.maxX > limitX || bounds.minY < -limitY || bounds.maxY > limitY) {
      issues.push({
        nodeId: node.identity.id,
        code: "OUTSIDE_FRAME",
        message: `bounds (${numberLiteral(bounds.minX)}, ${numberLiteral(bounds.minY)})-(${numberLiteral(bounds.maxX)}, ${numberLiteral(bounds.maxY)}) exceed frame limits x=±${numberLiteral(limitX)}, y=±${numberLiteral(limitY)}.`,
      });
    }
  }
  if (issues.length > 0) throw new ManimCompileError(issues);
}

function styleCalls(style: VisualStyle): string {
  const calls: string[] = [];
  if (style.stroke !== undefined || style.strokeWidth !== undefined) {
    const arguments_: string[] = [];
    if (style.stroke !== undefined) arguments_.push(`color=${pythonString(style.stroke)}`);
    if (style.strokeWidth !== undefined) arguments_.push(`width=${numberLiteral(style.strokeWidth)}`);
    calls.push(`.set_stroke(${arguments_.join(", ")})`);
  }
  if (style.fill !== undefined) calls.push(`.set_fill(color=${pythonString(style.fill)}, opacity=1)`);
  if (style.opacity !== undefined) calls.push(`.set_opacity(${numberLiteral(style.opacity)})`);
  if (style.visible === false) calls.push(".set_opacity(0)");
  return calls.join("");
}

function textArguments(node: SceneNode & { readonly geometry: { readonly kind: "label" } }): string {
  const style = node.style;
  const arguments_ = [pythonString(node.geometry.text)];
  if (style.fontFamily !== undefined) arguments_.push(`font=${pythonString(style.fontFamily)}`);
  if (style.fontSize !== undefined) arguments_.push(`font_size=${numberLiteral(style.fontSize)}`);
  if (style.fontWeight !== undefined) arguments_.push(`weight=${pythonString(String(style.fontWeight))}`);
  if (style.fill !== undefined) arguments_.push(`color=${pythonString(style.fill)}`);
  return arguments_.join(", ");
}

function constructor(node: SceneNode): string {
  const geometry = node.geometry;
  switch (geometry.kind) {
    case "point":
      return `Dot(point=${vector(geometry)})`;
    case "segment":
      return `Line(start=${vector(geometry.start)}, end=${vector(geometry.end)})`;
    case "polyline":
      return `VMobject().set_points_as_corners([${geometry.points.map(vector).join(", ")}])`;
    case "polygon":
      return `Polygon(${geometry.points.map(vector).join(", ")})`;
    case "circle":
      return `Circle(radius=${numberLiteral(geometry.radius)}).move_to(${vector(geometry.center)})`;
    case "label": {
      const anchor = geometry.anchor ?? "middle";
      return `_place_label(Text(${textArguments(node as SceneNode & { readonly geometry: { readonly kind: "label" } })}), ${vector(geometry.position)}, ${pythonString(anchor)})`;
    }
    case "arrow": {
      const arguments_ = [`start=${vector(geometry.start)}`, `end=${vector(geometry.end)}`, "buff=0"];
      if (geometry.headLength !== undefined) arguments_.push(`tip_length=${numberLiteral(geometry.headLength)}`);
      const arrow = `Arrow(${arguments_.join(", ")})`;
      return geometry.headWidth === undefined
        ? arrow
        : `_set_arrow_tip_width(${arrow}, ${numberLiteral(geometry.headWidth)})`;
    }
    case "image_layer":
      return `ImageMobject(${pythonString(geometry.source)}).stretch_to_fit_width(${numberLiteral(geometry.width)}).stretch_to_fit_height(${numberLiteral(geometry.height)}).move_to(${vector(geometry.position)})`;
  }
}

function nodeLine(node: SceneNode, index: number): string {
  const variable = `node_${String(index).padStart(4, "0")}`;
  const commentId = node.identity.id.replaceAll("\r", "\\r").replaceAll("\n", "\\n");
  return [
    `        # ${commentId}`,
    `        ${variable} = ${constructor(node)}${styleCalls(node.style)}`,
    `        self.add(${variable})`,
  ].join("\n");
}

function validateClassName(value: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new TypeError("sceneClassName must be a valid Python identifier.");
  }
  return value;
}

export function compileManim(
  graph: SceneGraph,
  options: ManimCompileOptions = {},
): ManimCompilation {
  assertValidSceneGraph(graph);
  const nodes = orderSceneNodes(graph.nodes);
  validateLayout(nodes, options.layout);
  const className = validateClassName(options.sceneClassName ?? "CompiledScene");
  const body = nodes.length === 0 ? "        pass" : nodes.map(nodeLine).join("\n");
  const source = [
    "from manim import *",
    "",
    "def _place_label(label, point, anchor):",
    "    label.move_to(point)",
    "    if anchor == \"start\":",
    "        label.shift(point - label.get_left())",
    "    elif anchor == \"end\":",
    "        label.shift(point - label.get_right())",
    "    return label",
    "",
    "def _set_arrow_tip_width(arrow, width):",
    "    arrow.get_tip().stretch_to_fit_width(width)",
    "    return arrow",
    "",
    `class ${className}(Scene):`,
    "    def construct(self):",
    body,
    "",
  ].join("\n");
  return { source, nodeOrder: nodes.map((node) => node.identity.id) };
}
