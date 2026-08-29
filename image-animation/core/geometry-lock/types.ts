export type GeometryAuthority = "unknown" | "proposed" | "estimated" | "exact";

export type ScalarClaim =
  | { readonly authority: "unknown" }
  | { readonly authority: "proposed" | "estimated" | "exact"; readonly value: number };

export interface PointLock {
  readonly id: string;
  readonly x: ScalarClaim;
  readonly y: ScalarClaim;
}

export interface EndpointLock {
  readonly point: string;
}

export interface SegmentLock {
  readonly id: string;
  readonly start: EndpointLock;
  readonly end: EndpointLock;
}

export interface PolygonLock {
  readonly id: string;
  readonly points: readonly string[];
}

export interface CircleLock {
  readonly id: string;
  readonly center: string;
  readonly radius: ScalarClaim;
}

export interface LabelLock {
  readonly id: string;
  readonly anchor: string;
}

export interface LayerLock {
  readonly id: string;
  readonly order: number;
  readonly members: readonly string[];
}

export interface RelationLock {
  readonly id: string;
  readonly kind: string;
  readonly from: string;
  readonly to: string;
  readonly authority: GeometryAuthority;
}

export interface GeometryLockDocument {
  readonly version: 1;
  readonly points: readonly PointLock[];
  readonly segments: readonly SegmentLock[];
  readonly polygons: readonly PolygonLock[];
  readonly circles: readonly CircleLock[];
  readonly labels: readonly LabelLock[];
  readonly layers: readonly LayerLock[];
  readonly relations: readonly RelationLock[];
}

export interface GeometryLockEvidence {
  readonly path: string;
  readonly code: string;
  readonly message: string;
}

export interface GeometryLockResult {
  readonly locked: boolean;
  readonly evidence: readonly GeometryLockEvidence[];
}
