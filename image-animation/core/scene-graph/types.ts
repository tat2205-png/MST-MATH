export type NodeKind =
  | "point"
  | "segment"
  | "polyline"
  | "polygon"
  | "circle"
  | "label"
  | "arrow"
  | "image_layer";

export interface Vec2 {
  x: number;
  y: number;
}

export interface PointGeometry extends Vec2 {
  readonly kind: "point";
}

export interface SegmentGeometry {
  readonly kind: "segment";
  start: Vec2;
  end: Vec2;
}

export interface PolylineGeometry {
  readonly kind: "polyline";
  points: readonly Vec2[];
  closed?: false;
}

export interface PolygonGeometry {
  readonly kind: "polygon";
  points: readonly Vec2[];
}

export interface CircleGeometry {
  readonly kind: "circle";
  center: Vec2;
  radius: number;
}

export interface LabelGeometry {
  readonly kind: "label";
  position: Vec2;
  text: string;
  anchor?: "start" | "middle" | "end";
}

export interface ArrowGeometry {
  readonly kind: "arrow";
  start: Vec2;
  end: Vec2;
  headLength?: number;
  headWidth?: number;
}

export interface ImageLayerGeometry {
  readonly kind: "image_layer";
  position: Vec2;
  width: number;
  height: number;
  source: string;
}

export type Geometry =
  | PointGeometry
  | SegmentGeometry
  | PolylineGeometry
  | PolygonGeometry
  | CircleGeometry
  | LabelGeometry
  | ArrowGeometry
  | ImageLayerGeometry;

export interface NodeIdentity {
  readonly id: string;
  readonly name?: string;
}

export interface VisualStyle {
  readonly visible?: boolean;
  readonly opacity?: number;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly fill?: string;
  readonly fontFamily?: string;
  readonly fontSize?: number;
  readonly fontWeight?: number | string;
}

export interface LayerPlacement {
  readonly layer: number;
  readonly order: number;
}

export interface NodeRelations {
  readonly parent?: string;
  readonly references?: readonly string[];
}

export type MetadataValue =
  | null
  | boolean
  | number
  | string
  | readonly MetadataValue[]
  | { readonly [key: string]: MetadataValue };

export type NodeMetadata = Readonly<Record<string, MetadataValue>>;

export interface SceneNode<G extends Geometry = Geometry> {
  readonly identity: NodeIdentity;
  readonly geometry: G;
  readonly style: VisualStyle;
  readonly placement: LayerPlacement;
  readonly relations: NodeRelations;
  readonly metadata: NodeMetadata;
}

export interface SceneGraph {
  readonly version: 1;
  readonly nodes: readonly SceneNode[];
  readonly metadata: NodeMetadata;
}

export type SceneNodeInput<G extends Geometry = Geometry> = Omit<
  SceneNode<G>,
  "identity" | "style" | "placement" | "relations" | "metadata"
> & {
  readonly identity?: Omit<NodeIdentity, "id"> & { readonly id?: string };
  readonly style?: VisualStyle;
  readonly placement?: Partial<LayerPlacement>;
  readonly relations?: NodeRelations;
  readonly metadata?: NodeMetadata;
};

export interface ValidationIssue {
  readonly path: string;
  readonly code: string;
  readonly message: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ValidationIssue[];
}
