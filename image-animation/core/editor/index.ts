import {
  createSceneGraph,
  createSceneNode,
  validateSceneGraph,
  type NodeMetadata,
  type SceneGraph,
  type SceneNode,
} from "../scene-graph/index.ts";
import {
  EDITOR_LOCKS_METADATA_KEY,
  type EditorError,
  type EditorOperation,
  type EditorResult,
} from "./types.ts";

export * from "./types.ts";

const OPERATION_TYPES = new Set([
  "add",
  "edit",
  "delete",
  "rename",
  "layer",
  "relation",
  "lock",
  "unlock",
]);

function error(path: string, code: string, message: string): EditorResult {
  return { ok: false, errors: [{ path, code, message }] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(value: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function readLocks(graph: SceneGraph): readonly string[] | EditorError {
  const value = graph.metadata[EDITOR_LOCKS_METADATA_KEY];
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((id) => typeof id !== "string" || id.length === 0)) {
    return {
      path: `$.metadata.${EDITOR_LOCKS_METADATA_KEY}`,
      code: "INVALID_LOCK_STATE",
      message: "Editor lock state must be an array of non-empty node IDs.",
    };
  }
  const locks = value as readonly string[];
  if (new Set(locks).size !== locks.length || locks.some((id) => !graph.nodes.some((node) => node.identity.id === id))) {
    return {
      path: `$.metadata.${EDITOR_LOCKS_METADATA_KEY}`,
      code: "INVALID_LOCK_STATE",
      message: "Editor lock state must contain unique IDs of existing nodes.",
    };
  }
  return [...locks].sort(compareText);
}

function isEditorError(value: readonly string[] | EditorError): value is EditorError {
  return !Array.isArray(value);
}

function metadataWithLocks(graph: SceneGraph, locks: readonly string[]): NodeMetadata {
  const metadata: Record<string, NodeMetadata[string]> = { ...graph.metadata };
  if (locks.length === 0) delete metadata[EDITOR_LOCKS_METADATA_KEY];
  else metadata[EDITOR_LOCKS_METADATA_KEY] = [...locks].sort(compareText);
  return metadata;
}

function buildGraph(nodes: readonly SceneNode[], metadata: NodeMetadata): EditorResult {
  try {
    return { ok: true, graph: createSceneGraph(nodes, metadata) };
  } catch {
    return error("$", "INVALID_RESULT_GRAPH", "The operation would produce an invalid scene graph.");
  }
}

function nodeIndex(graph: SceneGraph, id: string): number {
  return graph.nodes.findIndex((node) => node.identity.id === id);
}

function requireId(operation: EditorOperation): EditorResult | undefined {
  if (operation.type !== "add" && (typeof operation.id !== "string" || operation.id.length === 0)) {
    return error("$.operation.id", "INVALID_ID", "Node ID must be a non-empty string.");
  }
  return undefined;
}

export function applyEditorOperation(graph: SceneGraph, operation: EditorOperation): EditorResult {
  const validation = validateSceneGraph(graph);
  if (!validation.valid) {
    return {
      ok: false,
      errors: validation.issues.map((issue) => ({
        path: issue.path,
        code: `INVALID_INPUT_GRAPH_${issue.code}`,
        message: issue.message,
      })),
    };
  }

  if (!isRecord(operation) || typeof operation.type !== "string" || !OPERATION_TYPES.has(operation.type)) {
    return error("$.operation", "INVALID_OPERATION", "Editor operation must have a supported type.");
  }

  const typedOperation = operation as unknown as EditorOperation;
  const idFailure = requireId(typedOperation);
  if (idFailure) return idFailure;

  const lockState = readLocks(graph);
  if (isEditorError(lockState)) return { ok: false, errors: [lockState] };
  const locks = lockState;

  if (typedOperation.type === "add") {
    if (!isRecord(typedOperation.node) || !hasOwn(typedOperation.node, "geometry") || typedOperation.node.geometry == null) {
      return error("$.operation.node.geometry", "GEOMETRY_REQUIRED", "Add requires explicit geometry.");
    }
    let node: SceneNode;
    try {
      node = createSceneNode(typedOperation.node);
    } catch {
      return error("$.operation.node", "INVALID_NODE", "Add requires a valid complete node input.");
    }
    if (nodeIndex(graph, node.identity.id) !== -1) {
      return error("$.operation.node.identity.id", "DUPLICATE_ID", `Node already exists: ${node.identity.id}`);
    }
    const candidateValidation = validateSceneGraph({
      version: 1,
      nodes: [...graph.nodes, node],
      metadata: graph.metadata,
    });
    if (!candidateValidation.valid) {
      return error("$.operation.node", "INVALID_NODE", "Add requires a valid complete node input.");
    }
    return buildGraph([...graph.nodes, node], graph.metadata);
  }

  const index = nodeIndex(graph, typedOperation.id);
  if (index === -1) return error("$.operation.id", "NODE_NOT_FOUND", `Node does not exist: ${typedOperation.id}`);

  if (typedOperation.type === "lock") {
    if (locks.includes(typedOperation.id)) return error("$.operation.id", "ALREADY_LOCKED", `Node is already locked: ${typedOperation.id}`);
    return buildGraph(graph.nodes, metadataWithLocks(graph, [...locks, typedOperation.id]));
  }

  if (typedOperation.type === "unlock") {
    if (!locks.includes(typedOperation.id)) return error("$.operation.id", "NOT_LOCKED", `Node is not locked: ${typedOperation.id}`);
    return buildGraph(graph.nodes, metadataWithLocks(graph, locks.filter((id) => id !== typedOperation.id)));
  }

  if (locks.includes(typedOperation.id)) {
    return error("$.operation.id", "NODE_LOCKED", `Node is locked: ${typedOperation.id}`);
  }

  const current = graph.nodes[index];
  let replacement: SceneNode | undefined;

  switch (typedOperation.type) {
    case "edit": {
      if (!hasOwn(typedOperation, "geometry") && !hasOwn(typedOperation, "style") && !hasOwn(typedOperation, "metadata")) {
        return error("$.operation", "EMPTY_EDIT", "Edit must explicitly replace geometry, style, or metadata.");
      }
      if (hasOwn(typedOperation, "geometry") && typedOperation.geometry === undefined) {
        return error("$.operation.geometry", "GEOMETRY_REQUIRED", "Geometry cannot be removed or inferred.");
      }
      replacement = {
        ...current,
        ...(hasOwn(typedOperation, "geometry") ? { geometry: typedOperation.geometry! } : {}),
        ...(hasOwn(typedOperation, "style") ? { style: typedOperation.style! } : {}),
        ...(hasOwn(typedOperation, "metadata") ? { metadata: typedOperation.metadata! } : {}),
      };
      break;
    }
    case "rename":
      if (typedOperation.name !== null && typeof typedOperation.name !== "string") {
        return error("$.operation.name", "INVALID_NAME", "Name must be a string or null.");
      }
      replacement = {
        ...current,
        identity: typedOperation.name === null
          ? { id: current.identity.id }
          : { ...current.identity, name: typedOperation.name },
      };
      break;
    case "layer":
      if (!Number.isSafeInteger(typedOperation.layer) || !Number.isSafeInteger(typedOperation.order)) {
        return error("$.operation", "INVALID_PLACEMENT", "Layer and order must be safe integers.");
      }
      replacement = { ...current, placement: { layer: typedOperation.layer, order: typedOperation.order } };
      break;
    case "relation": {
      if (!hasOwn(typedOperation, "parent") && !hasOwn(typedOperation, "references")) {
        return error("$.operation", "EMPTY_RELATION", "Relation must explicitly set or clear parent or references.");
      }
      const relations = { ...current.relations };
      if (hasOwn(typedOperation, "parent")) {
        if (typedOperation.parent === null) delete relations.parent;
        else if (typeof typedOperation.parent !== "string" || typedOperation.parent.length === 0) {
          return error("$.operation.parent", "INVALID_RELATION", "Parent must be a non-empty node ID or null.");
        } else relations.parent = typedOperation.parent;
      }
      if (hasOwn(typedOperation, "references")) {
        if (typedOperation.references === null) delete relations.references;
        else if (!Array.isArray(typedOperation.references) || typedOperation.references.some((id) => typeof id !== "string" || id.length === 0)) {
          return error("$.operation.references", "INVALID_RELATION", "References must be non-empty node IDs or null.");
        } else relations.references = [...typedOperation.references];
      }
      replacement = { ...current, relations };
      break;
    }
    case "delete": {
      const dependent = graph.nodes
        .filter((node) => node.identity.id !== typedOperation.id &&
          (node.relations.parent === typedOperation.id || node.relations.references?.includes(typedOperation.id)))
        .map((node) => node.identity.id)
        .sort(compareText);
      if (dependent.length > 0) {
        return error("$.operation.id", "NODE_REFERENCED", `Node is referenced by: ${dependent.join(", ")}`);
      }
      return buildGraph(
        graph.nodes.filter((node) => node.identity.id !== typedOperation.id),
        graph.metadata,
      );
    }
  }

  const nodes = [...graph.nodes];
  nodes[index] = replacement;
  return buildGraph(nodes, graph.metadata);
}

export function applyEditorOperations(graph: SceneGraph, operations: readonly EditorOperation[]): EditorResult {
  if (!Array.isArray(operations)) {
    return error("$.operations", "INVALID_OPERATIONS", "Editor operations must be an array.");
  }

  let current = graph;
  for (let index = 0; index < operations.length; index += 1) {
    const result = applyEditorOperation(current, operations[index]);
    if (result.ok === false) {
      return {
        ok: false,
        errors: result.errors.map((item) => ({
          ...item,
          path: item.path.startsWith("$.operation")
            ? `$.operations[${index}]${item.path.slice("$.operation".length)}`
            : `$.operations[${index}]${item.path.slice(1)}`,
        })),
      };
    }
    current = result.graph;
  }
  return { ok: true, graph: current };
}
