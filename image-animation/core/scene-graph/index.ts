import type {
  Geometry,
  NodeMetadata,
  SceneGraph,
  SceneNode,
  SceneNodeInput,
  ValidationIssue,
  ValidationResult,
  Vec2,
} from "./types.ts";

export * from "./types.ts";

const KINDS = new Set([
  "point", "segment", "polyline", "polygon", "circle", "label", "arrow", "image_layer",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (isRecord(value)) {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      if (value[key] !== undefined) result[key] = canonicalValue(value[key]);
    }
    return result;
  }
  return value;
}

export function canonicalStringify(value: unknown): string {
  return JSON.stringify(canonicalValue(value));
}

function fnv1a64(value: string): string {
  let hash = 0xcbf29ce484222325n;
  for (const byte of new TextEncoder().encode(value)) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

function identitySeed(input: SceneNodeInput): unknown {
  return {
    geometry: input.geometry,
    name: input.identity?.name,
    placement: {
      layer: input.placement?.layer ?? 0,
      order: input.placement?.order ?? 0,
    },
    relations: input.relations ?? {},
  };
}

export function createStableId(input: SceneNodeInput): string {
  return `${input.geometry.kind}_${fnv1a64(canonicalStringify(identitySeed(input)))}`;
}

export function createSceneNode<G extends Geometry>(input: SceneNodeInput<G>): SceneNode<G> {
  return {
    identity: {
      id: input.identity?.id ?? createStableId(input),
      ...(input.identity?.name === undefined ? {} : { name: input.identity.name }),
    },
    geometry: canonicalValue(input.geometry) as G,
    style: canonicalValue(input.style ?? {}) as SceneNode<G>["style"],
    placement: {
      layer: input.placement?.layer ?? 0,
      order: input.placement?.order ?? 0,
    },
    relations: canonicalValue(input.relations ?? {}) as SceneNode<G>["relations"],
    metadata: canonicalValue(input.metadata ?? {}) as NodeMetadata,
  };
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function compareSceneNodes(a: SceneNode, b: SceneNode): number {
  return a.placement.layer - b.placement.layer ||
    a.placement.order - b.placement.order ||
    compareText(a.identity.id, b.identity.id);
}

export function orderSceneNodes(nodes: readonly SceneNode[]): SceneNode[] {
  return [...nodes].sort(compareSceneNodes);
}

function isSceneNode(value: SceneNode | SceneNodeInput): value is SceneNode {
  return isRecord(value.identity) && typeof value.identity.id === "string";
}

export function createSceneGraph(
  nodes: readonly (SceneNode | SceneNodeInput)[],
  metadata: NodeMetadata = {},
): SceneGraph {
  const normalized = nodes.map((node) => isSceneNode(node)
    ? canonicalValue(node) as unknown as SceneNode
    : createSceneNode(node));
  const graph: SceneGraph = {
    version: 1,
    nodes: orderSceneNodes(normalized),
    metadata: canonicalValue(metadata) as NodeMetadata,
  };
  assertValidSceneGraph(graph);
  return graph;
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

type AddIssue = (path: string, code: string, message: string) => void;

function validateVec2(value: unknown, path: string, add: AddIssue): value is Vec2 {
  if (!isRecord(value) || !finite(value.x) || !finite(value.y)) {
    add(path, "INVALID_POINT", "Expected finite numeric x and y coordinates.");
    return false;
  }
  return true;
}

function validateGeometry(geometry: unknown, path: string, add: AddIssue): void {
  if (!isRecord(geometry) || typeof geometry.kind !== "string" || !KINDS.has(geometry.kind)) {
    add(path, "INVALID_GEOMETRY_KIND", "Geometry kind is not supported.");
    return;
  }
  switch (geometry.kind) {
    case "point": validateVec2(geometry, path, add); break;
    case "segment":
      validateVec2(geometry.start, `${path}.start`, add);
      validateVec2(geometry.end, `${path}.end`, add);
      break;
    case "polyline":
    case "polygon": {
      if (!Array.isArray(geometry.points)) {
        add(`${path}.points`, "INVALID_POINTS", "Expected an array of points.");
        break;
      }
      const minimum = geometry.kind === "polygon" ? 3 : 2;
      if (geometry.points.length < minimum) {
        add(`${path}.points`, "TOO_FEW_POINTS", `Expected at least ${minimum} points.`);
      }
      geometry.points.forEach((point, index) => validateVec2(point, `${path}.points[${index}]`, add));
      if (geometry.kind === "polyline" && geometry.closed !== undefined && geometry.closed !== false) {
        add(`${path}.closed`, "INVALID_CLOSED", "Polyline closed may only be false.");
      }
      break;
    }
    case "circle":
      validateVec2(geometry.center, `${path}.center`, add);
      if (!finite(geometry.radius) || geometry.radius <= 0) {
        add(`${path}.radius`, "INVALID_RADIUS", "Radius must be a positive finite number.");
      }
      break;
    case "label":
      validateVec2(geometry.position, `${path}.position`, add);
      if (typeof geometry.text !== "string") add(`${path}.text`, "INVALID_TEXT", "Label text must be a string.");
      if (geometry.anchor !== undefined && !["start", "middle", "end"].includes(geometry.anchor as string)) {
        add(`${path}.anchor`, "INVALID_ANCHOR", "Label anchor is invalid.");
      }
      break;
    case "arrow":
      validateVec2(geometry.start, `${path}.start`, add);
      validateVec2(geometry.end, `${path}.end`, add);
      for (const key of ["headLength", "headWidth"] as const) {
        if (geometry[key] !== undefined && (!finite(geometry[key]) || geometry[key] <= 0)) {
          add(`${path}.${key}`, "INVALID_ARROW_HEAD", `${key} must be positive and finite.`);
        }
      }
      break;
    case "image_layer":
      validateVec2(geometry.position, `${path}.position`, add);
      if (!finite(geometry.width) || geometry.width <= 0) add(`${path}.width`, "INVALID_IMAGE_SIZE", "Image width must be positive and finite.");
      if (!finite(geometry.height) || geometry.height <= 0) add(`${path}.height`, "INVALID_IMAGE_SIZE", "Image height must be positive and finite.");
      if (typeof geometry.source !== "string" || geometry.source.length === 0) add(`${path}.source`, "INVALID_IMAGE_SOURCE", "Image source must be a non-empty string.");
      break;
  }
}

function validateMetadata(value: unknown, path: string, add: AddIssue): void {
  const visit = (item: unknown, itemPath: string): void => {
    if (item === null || typeof item === "string" || typeof item === "boolean" || finite(item)) return;
    if (Array.isArray(item)) return item.forEach((child, index) => visit(child, `${itemPath}[${index}]`));
    if (isRecord(item)) {
      for (const key of Object.keys(item)) visit(item[key], `${itemPath}.${key}`);
      return;
    }
    add(itemPath, "INVALID_METADATA", "Metadata must contain only JSON-compatible finite values.");
  };
  visit(value, path);
}

function validateStyle(value: unknown, path: string, add: AddIssue): void {
  if (!isRecord(value)) { add(path, "INVALID_STYLE", "Style must be an object."); return; }
  if (value.visible !== undefined && typeof value.visible !== "boolean") add(`${path}.visible`, "INVALID_VISIBLE", "Visible must be boolean.");
  if (value.opacity !== undefined && (!finite(value.opacity) || value.opacity < 0 || value.opacity > 1)) add(`${path}.opacity`, "INVALID_OPACITY", "Opacity must be between 0 and 1.");
  if (value.strokeWidth !== undefined && (!finite(value.strokeWidth) || value.strokeWidth < 0)) add(`${path}.strokeWidth`, "INVALID_STROKE_WIDTH", "Stroke width must be non-negative and finite.");
  if (value.fontSize !== undefined && (!finite(value.fontSize) || value.fontSize <= 0)) add(`${path}.fontSize`, "INVALID_FONT_SIZE", "Font size must be positive and finite.");
  for (const key of ["stroke", "fill", "fontFamily"] as const) {
    if (value[key] !== undefined && typeof value[key] !== "string") add(`${path}.${key}`, "INVALID_STYLE_VALUE", `${key} must be a string.`);
  }
  if (value.fontWeight !== undefined && typeof value.fontWeight !== "string" && !finite(value.fontWeight)) add(`${path}.fontWeight`, "INVALID_STYLE_VALUE", "fontWeight must be a string or finite number.");
}

export function validateSceneGraph(value: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  const add: AddIssue = (path, code, message) => issues.push({ path, code, message });
  if (!isRecord(value)) return { valid: false, issues: [{ path: "$", code: "INVALID_GRAPH", message: "Scene graph must be an object." }] };
  if (value.version !== 1) add("$.version", "INVALID_VERSION", "Scene graph version must be 1.");
  if (!Array.isArray(value.nodes)) add("$.nodes", "INVALID_NODES", "Scene graph nodes must be an array.");
  validateMetadata(value.metadata, "$.metadata", add);
  const nodes = Array.isArray(value.nodes) ? value.nodes : [];
  const ids = new Set<string>();
  const references: Array<{ path: string; id: string }> = [];
  nodes.forEach((node, index) => {
    const path = `$.nodes[${index}]`;
    if (!isRecord(node)) { add(path, "INVALID_NODE", "Node must be an object."); return; }
    if ("animation" in node) add(`${path}.animation`, "ANIMATION_NOT_ALLOWED", "Animation data must remain outside the scene graph.");
    const identity = node.identity;
    if (!isRecord(identity) || typeof identity.id !== "string" || identity.id.length === 0) add(`${path}.identity.id`, "INVALID_ID", "Node ID must be a non-empty string.");
    else if (ids.has(identity.id)) add(`${path}.identity.id`, "DUPLICATE_ID", `Duplicate node ID: ${identity.id}`);
    else ids.add(identity.id);
    if (isRecord(identity) && identity.name !== undefined && typeof identity.name !== "string") add(`${path}.identity.name`, "INVALID_NAME", "Node name must be a string.");
    validateGeometry(node.geometry, `${path}.geometry`, add);
    validateStyle(node.style, `${path}.style`, add);
    if (!isRecord(node.placement) || !Number.isSafeInteger(node.placement.layer) || !Number.isSafeInteger(node.placement.order)) add(`${path}.placement`, "INVALID_PLACEMENT", "Layer and order must be safe integers.");
    if (!isRecord(node.relations)) add(`${path}.relations`, "INVALID_RELATIONS", "Relations must be an object.");
    else {
      if (typeof node.relations.parent === "string" && node.relations.parent.length > 0) references.push({ path: `${path}.relations.parent`, id: node.relations.parent });
      else if (node.relations.parent !== undefined) add(`${path}.relations.parent`, "INVALID_RELATION", "Parent must be a non-empty node ID.");
      if (node.relations.references !== undefined) {
        if (!Array.isArray(node.relations.references) || node.relations.references.some((id) => typeof id !== "string" || id.length === 0)) add(`${path}.relations.references`, "INVALID_RELATION", "References must be an array of non-empty node IDs.");
        else node.relations.references.forEach((id, relationIndex) => references.push({ path: `${path}.relations.references[${relationIndex}]`, id }));
      }
    }
    validateMetadata(node.metadata, `${path}.metadata`, add);
  });
  for (const reference of references) if (!ids.has(reference.id)) add(reference.path, "MISSING_REFERENCE", `Referenced node does not exist: ${reference.id}`);
  return { valid: issues.length === 0, issues };
}

export function assertValidSceneGraph(value: unknown): asserts value is SceneGraph {
  const result = validateSceneGraph(value);
  if (!result.valid) throw new TypeError(`Invalid scene graph:\n${result.issues.map((issue) => `${issue.path} [${issue.code}] ${issue.message}`).join("\n")}`);
}

export function serializeSceneGraph(graph: SceneGraph): string {
  assertValidSceneGraph(graph);
  return canonicalStringify({ ...graph, nodes: orderSceneNodes(graph.nodes) });
}

export function deserializeSceneGraph(serialized: string): SceneGraph {
  const value: unknown = JSON.parse(serialized);
  assertValidSceneGraph(value);
  return createSceneGraph(value.nodes, value.metadata);
}
