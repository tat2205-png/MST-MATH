export const MATH_IR_SCHEMA_VERSION = "math-ir/v1" as const;

export type MathIRSchemaVersion = typeof MATH_IR_SCHEMA_VERSION;
export type EntityId = string;
export type ExpressionId = string;
export type FactOrigin = "given" | "derived" | "user" | "imported" | "visual" | "unknown";

export interface MathSourceEvidence {
  id: string;
  origin: FactOrigin;
  sourceId?: string;
  sourceType?: "text" | "image" | "pdf" | "docx" | "latex" | "user";
  sourceSpan?: { start: number; end: number };
  excerpt?: string;
  confidence?: number;
  ruleId?: string;
  evidenceIds?: string[];
}

export interface MathMetadata {
  title?: string;
  description?: string;
  language?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  sourceEvidence?: MathSourceEvidence[];
  adapterMetadata?: Record<string, unknown>;
}

export interface MathExpression {
  id: ExpressionId;
  raw?: string;
  latex?: string;
  normalized?: string;
  variables?: string[];
  unit?: string;
  metadata?: MathMetadata;
}

export type SemanticCoordinate =
  | { dimension: "2d"; x: number; y: number }
  | { dimension: "3d"; x: number; y: number; z: number }
  | { dimension: "unknown" };

export type LayoutCoordinate =
  | { dimension: "2d"; x: number; y: number }
  | { dimension: "3d"; x: number; y: number; z: number };

interface EntityBase<T extends string> {
  id: EntityId;
  type: T;
  label?: string;
  semanticCoordinate?: SemanticCoordinate;
  layoutCoordinate?: LayoutCoordinate;
  expressionIds?: ExpressionId[];
  metadata?: MathMetadata;
}

export interface PointEntity extends EntityBase<"point"> {}
export interface LineEntity extends EntityBase<"line"> { pointIds: [EntityId, EntityId]; }
export interface RayEntity extends EntityBase<"ray"> { startPointId: EntityId; throughPointId: EntityId; }
export interface SegmentEntity extends EntityBase<"segment"> { startPointId: EntityId; endPointId: EntityId; }
export interface VectorEntity extends EntityBase<"vector"> { startPointId?: EntityId; endPointId?: EntityId; components?: number[]; }
export interface PlaneEntity extends EntityBase<"plane"> { pointIds?: EntityId[]; equationExpressionId?: ExpressionId; }
export interface PolygonEntity extends EntityBase<"polygon"> { vertexIds: EntityId[]; }
export interface TriangleEntity extends EntityBase<"triangle"> { vertexIds: [EntityId, EntityId, EntityId]; sideIds?: [EntityId, EntityId, EntityId]; }
export interface QuadrilateralEntity extends EntityBase<"quadrilateral"> { vertexIds: [EntityId, EntityId, EntityId, EntityId]; sideIds?: [EntityId, EntityId, EntityId, EntityId]; }
export interface CircleEntity extends EntityBase<"circle"> { centerPointId: EntityId; radiusExpressionId?: ExpressionId; }
export interface ArcEntity extends EntityBase<"arc"> { circleId: EntityId; startPointId: EntityId; endPointId: EntityId; }
export interface SphereEntity extends EntityBase<"sphere"> { centerPointId: EntityId; radiusExpressionId?: ExpressionId; }
export interface CylinderEntity extends EntityBase<"cylinder"> { baseCenterIds: [EntityId, EntityId]; radiusExpressionId?: ExpressionId; }
export interface ConeEntity extends EntityBase<"cone"> { apexPointId: EntityId; baseCenterPointId: EntityId; radiusExpressionId?: ExpressionId; }
export interface PrismEntity extends EntityBase<"prism"> { prismKind?: "triangular" | "general"; baseSides?: number; baseMode?: "regular" | "explicit_convex"; baseFaceIds: [EntityId, EntityId]; faceIds: EntityId[]; }
export interface PyramidEntity extends EntityBase<"pyramid"> { pyramidKind?: "square" | "general"; baseSides?: number; baseMode?: "regular" | "explicit_convex"; apexPointId: EntityId; baseFaceId: EntityId; faceIds?: EntityId[]; }
export interface PolyhedronEntity extends EntityBase<"polyhedron"> { solidKind?: "polyhedron" | "cube" | "rectangular_prism" | "tetrahedron"; vertexIds: EntityId[]; edgeIds: EntityId[]; faceIds: EntityId[]; }
export interface CoordinateAxes2DEntity extends EntityBase<"coordinate_axes_2d"> { xLabel?: string; yLabel?: string; }
export interface CoordinateAxes3DEntity extends EntityBase<"coordinate_axes_3d"> { xLabel?: string; yLabel?: string; zLabel?: string; }
export interface FunctionGraphEntity extends EntityBase<"function_graph"> { expressionId: ExpressionId; axesId?: EntityId; domainExpressionId?: ExpressionId; }
export interface LabelEntity extends EntityBase<"label"> { text: string; targetEntityId?: EntityId; }
export interface MeasurementEntity extends EntityBase<"measurement"> { targetEntityId: EntityId; valueExpressionId: ExpressionId; }
export interface AngleMarkerEntity extends EntityBase<"angle_marker"> { pointIds: [EntityId, EntityId, EntityId]; }
export interface RightAngleMarkerEntity extends EntityBase<"right_angle_marker"> { pointIds: [EntityId, EntityId, EntityId]; }

export type MathEntity =
  | PointEntity | LineEntity | RayEntity | SegmentEntity | VectorEntity | PlaneEntity
  | PolygonEntity | TriangleEntity | QuadrilateralEntity | CircleEntity | ArcEntity
  | SphereEntity | CylinderEntity | ConeEntity | PrismEntity | PyramidEntity | PolyhedronEntity
  | CoordinateAxes2DEntity | CoordinateAxes3DEntity | FunctionGraphEntity | LabelEntity
  | MeasurementEntity | AngleMarkerEntity | RightAngleMarkerEntity;

export const MATH_ENTITY_TYPES = [
  "point", "line", "ray", "segment", "vector", "plane", "polygon", "triangle",
  "quadrilateral", "circle", "arc", "sphere", "cylinder", "cone", "prism", "pyramid",
  "polyhedron", "coordinate_axes_2d", "coordinate_axes_3d", "function_graph", "label",
  "measurement", "angle_marker", "right_angle_marker",
] as const;

export type MathConstraintType =
  | "parallel" | "perpendicular" | "equal_length" | "equal_angle" | "midpoint"
  | "collinear" | "coplanar" | "point_on_line" | "point_on_segment" | "point_on_circle"
  | "point_on_plane" | "line_on_plane" | "intersection" | "tangent" | "distance"
  | "angle" | "radius" | "diameter" | "congruent" | "similar"
  | "line_parallel_plane" | "line_perpendicular_plane" | "plane_parallel_plane"
  | "plane_perpendicular_plane";

export const MATH_CONSTRAINT_TYPES: readonly MathConstraintType[] = [
  "parallel", "perpendicular", "equal_length", "equal_angle", "midpoint", "collinear",
  "coplanar", "point_on_line", "point_on_segment", "point_on_circle", "point_on_plane",
  "line_on_plane", "intersection", "tangent", "distance", "angle", "radius", "diameter",
  "congruent", "similar", "line_parallel_plane", "line_perpendicular_plane",
  "plane_parallel_plane", "plane_perpendicular_plane",
];

export interface MathFact {
  origin: FactOrigin;
  sourceId?: string;
  confidence?: number;
  ruleId?: string;
  evidenceIds?: string[];
}

export interface MathConstraint {
  id: string;
  type: MathConstraintType;
  entityIds: EntityId[];
  expressionId?: ExpressionId;
  fact: MathFact;
  metadata?: MathMetadata;
}

export interface MathRelation {
  id: string;
  type: string;
  subjectId: EntityId;
  objectIds: EntityId[];
  expressionId?: ExpressionId;
  fact: MathFact;
  metadata?: MathMetadata;
}

export interface MathStyle {
  id: string;
  entityIds?: EntityId[];
  visible?: boolean;
  strokeStyle?: string;
  fillStyle?: string;
  lineStyle?: "solid" | "dashed" | "dotted";
  lineWidth?: number;
  opacity?: number;
  labelPlacement?: "auto" | "above" | "below" | "left" | "right" | "center" | "custom-offset";
  labelOffset?: [number, number];
  zIndex?: number;
  hiddenEdge?: boolean;
}

export type MathCamera =
  | { dimension: "2d"; viewport: { minX: number; maxX: number; minY: number; maxY: number }; zoom?: number }
  | { dimension: "3d"; position: [number, number, number]; target: [number, number, number]; up: [number, number, number]; zoom?: number; projection: "perspective" | "orthographic" };

export interface MathAnimation {
  id: string;
  type: "appear" | "disappear" | "highlight" | "transform" | "move" | "rotate" | "fold" | "camera";
  targetIds: string[];
  duration?: number;
  startTime?: number;
  parameters?: Record<string, unknown>;
}

export interface MathAnnotation {
  id: string;
  text?: string;
  expressionId?: ExpressionId;
  targetEntityIds?: EntityId[];
  fact?: MathFact;
}

export interface MathScene {
  id: string;
  name: string;
  dimension: "2d" | "3d";
  entities: MathEntity[];
  expressions?: MathExpression[];
  constraints: MathConstraint[];
  relations?: MathRelation[];
  camera?: MathCamera;
  styles?: MathStyle[];
  labelIds?: EntityId[];
  annotations?: MathAnnotation[];
  animations?: MathAnimation[];
  metadata?: MathMetadata;
}

export interface MathSolutionStep {
  id: string;
  explanation?: string;
  expressionIds?: ExpressionId[];
  derivedConstraintIds?: string[];
  metadata?: MathMetadata;
}

export interface MathProblem {
  id: string;
  statement: string;
  problemType?: string;
  expressions: MathExpression[];
  entities: MathEntity[];
  constraints: MathConstraint[];
  relations?: MathRelation[];
  givens: string[];
  targets: string[];
  solutionSteps?: MathSolutionStep[];
  sceneIds: string[];
  metadata?: MathMetadata;
  sourceEvidence?: MathSourceEvidence[];
}

export type MathDocumentBlock =
  | { id: string; type: "paragraph"; text: string; expressionIds?: ExpressionId[]; metadata?: MathMetadata }
  | { id: string; type: "heading"; level: number; text: string; expressionIds?: ExpressionId[]; metadata?: MathMetadata }
  | { id: string; type: "equation"; expressionId: ExpressionId; display: boolean; metadata?: MathMetadata }
  | { id: string; type: "list_item"; level: number; ordered: boolean; text: string; expressionIds?: ExpressionId[]; metadata?: MathMetadata }
  | { id: string; type: "page_break"; metadata?: MathMetadata }
  | { id: string; type: "problem_reference"; problemId: string; metadata?: MathMetadata }
  | { id: string; type: "image_reference"; assetId: string; caption?: string; metadata?: MathMetadata }
  | { id: string; type: "table_reference"; tableId: string; caption?: string; metadata?: MathMetadata };

export interface MathDocumentSection {
  id: string;
  title?: string;
  blocks: MathDocumentBlock[];
  metadata?: MathMetadata;
}

export interface MathAssetReference {
  id: string;
  kind: "image" | "table" | "attachment";
  uri?: string;
  mimeType?: string;
  metadata?: MathMetadata;
}

export interface MathDocument {
  schemaVersion: MathIRSchemaVersion;
  id: string;
  title?: string;
  sections: MathDocumentSection[];
  problems: MathProblem[];
  scenes: MathScene[];
  expressions: MathExpression[];
  assets?: MathAssetReference[];
  metadata?: MathMetadata;
}
