import type {
  Geometry,
  NodeMetadata,
  NodeRelations,
  SceneGraph,
  SceneNodeInput,
  VisualStyle,
} from "../scene-graph/index.ts";

export type EditorOperation =
  | AddOperation
  | EditOperation
  | DeleteOperation
  | RenameOperation
  | LayerOperation
  | RelationOperation
  | LockOperation
  | UnlockOperation;

export interface AddOperation {
  readonly type: "add";
  readonly node: SceneNodeInput;
}

export interface EditOperation {
  readonly type: "edit";
  readonly id: string;
  readonly geometry?: Geometry;
  readonly style?: VisualStyle;
  readonly metadata?: NodeMetadata;
}

export interface DeleteOperation {
  readonly type: "delete";
  readonly id: string;
}

export interface RenameOperation {
  readonly type: "rename";
  readonly id: string;
  readonly name: string | null;
}

export interface LayerOperation {
  readonly type: "layer";
  readonly id: string;
  readonly layer: number;
  readonly order: number;
}

export interface RelationOperation {
  readonly type: "relation";
  readonly id: string;
  readonly parent?: string | null;
  readonly references?: readonly string[] | null;
}

export interface LockOperation {
  readonly type: "lock";
  readonly id: string;
}

export interface UnlockOperation {
  readonly type: "unlock";
  readonly id: string;
}

export interface EditorError {
  readonly path: string;
  readonly code: string;
  readonly message: string;
}

export type EditorResult =
  | { readonly ok: true; readonly graph: SceneGraph }
  | { readonly ok: false; readonly errors: readonly EditorError[] };

export interface EditorRelationPatch extends NodeRelations {
  readonly parent?: string;
  readonly references?: readonly string[];
}

export const EDITOR_LOCKS_METADATA_KEY = "editorLockedNodeIds";
