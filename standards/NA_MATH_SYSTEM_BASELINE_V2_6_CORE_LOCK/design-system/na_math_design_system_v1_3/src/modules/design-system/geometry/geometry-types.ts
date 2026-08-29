export type Vec3 = { x: number; y: number; z: number };

export interface GeoPoint3D {
  id: string;
  position: Vec3;
}

export interface GeoLine3D {
  id: string;
  through: [string, string];
}

export interface GeoPlane3D {
  id: string;
  points: [string, string, string];
}

export interface GeometryRelations {
  parallel?: Array<[string, string]>;
  perpendicular?: Array<[string, string]>;
  incidence?: Array<[string, string]>;
  coplanar?: Array<string[]>;
  skew?: Array<[string, string]>;
}

export interface SemanticGeometryScene {
  points: GeoPoint3D[];
  lines?: GeoLine3D[];
  planes?: GeoPlane3D[];
  relations: GeometryRelations;
}
