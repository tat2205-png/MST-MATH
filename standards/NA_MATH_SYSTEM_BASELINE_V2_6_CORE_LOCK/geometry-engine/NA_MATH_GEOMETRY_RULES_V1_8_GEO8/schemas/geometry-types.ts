// NA-MATH-GEOMETRY-RULES V1.1 — GEO-1
// Semantic geometry is the source of truth.
// Layout remains NA-MATH-LAYOUT V1.3 CANONICAL — LOCKED.

export type Provenance =
  | 'GIVEN'
  | 'CONSTRUCTED'
  | 'DERIVED'
  | 'CONFIRMED';

export type VerificationStatus =
  | 'UNPROVEN'
  | 'PARTIAL'
  | 'VERIFIED'
  | 'REJECTED';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type GeometryObjectKind =
  | 'point'
  | 'line'
  | 'segment'
  | 'ray'
  | 'plane'
  | 'face'
  | 'polygon'
  | 'circle'
  | 'solid'
  | 'marker';

export interface GeometryObjectBase {
  id: string;
  kind: GeometryObjectKind;
  label?: string;
  provenance: Provenance;
  dependencies?: string[];
  metadata?: Record<string, string | number | boolean>;
}

export interface Point3D extends GeometryObjectBase {
  kind: 'point';
  position?: Vec3;
  construction?: {
    type:
      | 'free'
      | 'intersection'
      | 'projection-foot'
      | 'midpoint'
      | 'circumcenter'
      | 'incenter'
      | 'centroid'
      | 'custom';
    refs?: string[];
  };
}

export interface Line3D extends GeometryObjectBase {
  kind: 'line';
  through: [string, string];
}

export interface Segment3D extends GeometryObjectBase {
  kind: 'segment';
  endpoints: [string, string];
}

export interface Ray3D extends GeometryObjectBase {
  kind: 'ray';
  origin: string;
  through: string;
}

export interface Plane3D extends GeometryObjectBase {
  kind: 'plane';
  definition:
    | { type: 'three-points'; points: [string, string, string] }
    | { type: 'point-normal'; point: string; normal: Vec3 }
    | { type: 'point-two-directions'; point: string; directions: [Vec3, Vec3] };
}

export interface Face3D extends GeometryObjectBase {
  kind: 'face';
  vertices: string[];
  planeId?: string;
}

export interface Polygon3D extends GeometryObjectBase {
  kind: 'polygon';
  vertices: string[];
  planeId?: string;
}

export interface Circle3D extends GeometryObjectBase {
  kind: 'circle';
  center: string;
  planeId: string;
  throughPoint?: string;
  radius?: number;
}

export interface Solid3D extends GeometryObjectBase {
  kind: 'solid';
  solidType:
    | 'prism'
    | 'pyramid'
    | 'parallelepiped'
    | 'box'
    | 'cylinder'
    | 'cone'
    | 'frustum'
    | 'custom';
  vertices: string[];
  edges: string[];
  faces?: string[];
}

export interface MarkerObject extends GeometryObjectBase {
  kind: 'marker';
  markerType:
    | 'right-angle'
    | 'parallel'
    | 'equal-length'
    | 'angle'
    | 'highlight';
  refs: string[];
}

export type GeometryObject =
  | Point3D
  | Line3D
  | Segment3D
  | Ray3D
  | Plane3D
  | Face3D
  | Polygon3D
  | Circle3D
  | Solid3D
  | MarkerObject;

export type RelationType =
  | 'parallel'
  | 'perpendicular'
  | 'incidence'
  | 'intersection'
  | 'disjoint'
  | 'coplanar'
  | 'noncoplanar'
  | 'skew'
  | 'equal-length'
  | 'equal-angle'
  | 'midpoint'
  | 'projection-foot'
  | 'altitude'
  | 'circumcenter'
  | 'incenter'
  | 'centroid'
  | 'cyclic'
  | 'contains'
  | 'lies-in'
  | 'same-direction-family';

export interface GeometryRelation {
  id: string;
  type: RelationType;
  objects: string[];
  provenance: Provenance;
  status: VerificationStatus;
  evidence?: string[];
  dependencies?: string[];
  note?: string;
}

export interface EdgeStyleRule {
  edgeId: string;
  style: 'solid' | 'dashed';
  source: 'VIEW_PROFILE';
}

export interface LabelPlacementHint {
  objectId: string;
  preferred:
    | 'above'
    | 'below'
    | 'left'
    | 'right'
    | 'above-left'
    | 'above-right'
    | 'below-left'
    | 'below-right';
  minOffset?: number;
}

export interface ParallelProjectionProfile {
  mode: 'parallel';
  basis?: {
    ex: Vec2;
    ey: Vec2;
    ez: Vec2;
  };
}

export interface ViewProfile {
  id: string;
  projection: ParallelProjectionProfile;
  edgeStyles: EdgeStyleRule[];
  labelHints?: LabelPlacementHint[];
  metadata?: Record<string, string | number | boolean>;
}

export interface GeometryClaim {
  relationId: string;
  requiredForRender?: boolean;
}

export interface SemanticGeometryScene {
  schemaVersion: '1.1.0';
  id: string;
  title: string;

  layoutContract: {
    layoutId: 'NA-MATH-LAYOUT-V1.3-CANONICAL';
    layoutStatus: 'LOCKED';
    geometryMayChangeLayout: false;
  };

  objects: GeometryObject[];
  relations: GeometryRelation[];
  claims?: GeometryClaim[];

  activeViewProfileId: string;
  availableViewProfiles: ViewProfile[];

  verificationStatus: VerificationStatus;

  renderPolicy: {
    noVisualInference: true;
    failClosed: true;
    allowUnverifiedDecorativeGeometry: false;
  };
}
