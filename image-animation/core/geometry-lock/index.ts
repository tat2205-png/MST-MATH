import type {
  GeometryAuthority,
  GeometryLockDocument,
  GeometryLockEvidence,
  GeometryLockResult,
  ScalarClaim,
} from "./types.ts";

export * from "./types.ts";

const AUTHORITIES = new Set<GeometryAuthority>([
  "unknown",
  "proposed",
  "estimated",
  "exact",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function compareEvidence(a: GeometryLockEvidence, b: GeometryLockEvidence): number {
  return a.path < b.path ? -1 : a.path > b.path ? 1 :
    a.code < b.code ? -1 : a.code > b.code ? 1 :
    a.message < b.message ? -1 : a.message > b.message ? 1 : 0;
}

export function validateScalarClaim(
  value: unknown,
  path = "$",
): readonly GeometryLockEvidence[] {
  const evidence: GeometryLockEvidence[] = [];
  if (!isRecord(value)) {
    return [{ path, code: "INVALID_CLAIM", message: "Scalar claim must be an object." }];
  }

  if (typeof value.authority !== "string" || !AUTHORITIES.has(value.authority as GeometryAuthority)) {
    evidence.push({
      path: `${path}.authority`,
      code: "INVALID_AUTHORITY",
      message: "Authority must be unknown, proposed, estimated, or exact.",
    });
    return evidence;
  }

  if (value.authority === "unknown") {
    if (Object.prototype.hasOwnProperty.call(value, "value")) {
      evidence.push({
        path: `${path}.value`,
        code: "UNKNOWN_HAS_VALUE",
        message: "An unknown claim must not contain a numeric value.",
      });
    }
  } else if (!finite(value.value)) {
    evidence.push({
      path: `${path}.value`,
      code: "MISSING_CLAIM_VALUE",
      message: `${value.authority} claims require a finite numeric value.`,
    });
  }
  return evidence;
}

export function createScalarClaim(authority: "unknown"): ScalarClaim;
export function createScalarClaim(
  authority: Exclude<GeometryAuthority, "unknown">,
  value: number,
): ScalarClaim;
export function createScalarClaim(authority: GeometryAuthority, value?: number): ScalarClaim {
  const claim: unknown = authority === "unknown" ? { authority } : { authority, value };
  const evidence = validateScalarClaim(claim);
  if (evidence.length > 0) {
    throw new TypeError(evidence.map((item) => `${item.path} [${item.code}] ${item.message}`).join("\n"));
  }
  return claim as ScalarClaim;
}

export function validateGeometryLock(value: unknown): GeometryLockResult {
  const evidence: GeometryLockEvidence[] = [];
  const add = (path: string, code: string, message: string): void => {
    evidence.push({ path, code, message });
  };

  if (!isRecord(value)) {
    return {
      locked: false,
      evidence: [{ path: "$", code: "INVALID_DOCUMENT", message: "Geometry Lock document must be an object." }],
    };
  }

  if (value.version !== 1) {
    add("$.version", "INVALID_VERSION", "Geometry Lock version must be 1.");
  }

  const collectionNames = [
    "points",
    "segments",
    "polygons",
    "circles",
    "labels",
    "layers",
    "relations",
  ] as const;
  for (const name of collectionNames) {
    if (!Array.isArray(value[name])) {
      add(`$.${name}`, "MISSING_COLLECTION", `${name} must be an array.`);
    }
  }

  const points = Array.isArray(value.points) ? value.points : [];
  const segments = Array.isArray(value.segments) ? value.segments : [];
  const polygons = Array.isArray(value.polygons) ? value.polygons : [];
  const circles = Array.isArray(value.circles) ? value.circles : [];
  const labels = Array.isArray(value.labels) ? value.labels : [];
  const layers = Array.isArray(value.layers) ? value.layers : [];
  const relations = Array.isArray(value.relations) ? value.relations : [];

  const allIds = new Set<string>();
  const pointIds = new Set<string>();

  const register = (
    item: unknown,
    path: string,
    kind: string,
    point = false,
  ): item is Record<string, unknown> => {
    if (!isRecord(item)) {
      add(path, "INVALID_ENTRY", `${kind} must be an object.`);
      return false;
    }
    if (typeof item.id !== "string" || item.id.length === 0) {
      add(`${path}.id`, "INVALID_ID", `${kind} ID must be a non-empty string.`);
      return true;
    }
    if (allIds.has(item.id)) {
      add(`${path}.id`, "DUPLICATE_ID", `Duplicate geometry ID: ${item.id}`);
    } else {
      allIds.add(item.id);
      if (point) pointIds.add(item.id);
    }
    return true;
  };

  points.forEach((item, index) => register(item, `$.points[${index}]`, "Point", true));
  segments.forEach((item, index) => register(item, `$.segments[${index}]`, "Segment"));
  polygons.forEach((item, index) => register(item, `$.polygons[${index}]`, "Polygon"));
  circles.forEach((item, index) => register(item, `$.circles[${index}]`, "Circle"));
  labels.forEach((item, index) => register(item, `$.labels[${index}]`, "Label"));
  layers.forEach((item, index) => register(item, `$.layers[${index}]`, "Layer"));
  relations.forEach((item, index) => register(item, `$.relations[${index}]`, "Relation"));

  const requirePoint = (reference: unknown, path: string): void => {
    if (typeof reference !== "string" || reference.length === 0) {
      add(path, "INVALID_POINT_REFERENCE", "Point reference must be a non-empty string.");
    } else if (!pointIds.has(reference)) {
      add(path, "MISSING_POINT_REFERENCE", `Point does not exist: ${reference}`);
    }
  };

  points.forEach((item, index) => {
    const path = `$.points[${index}]`;
    if (!isRecord(item)) return;
    evidence.push(...validateScalarClaim(item.x, `${path}.x`));
    evidence.push(...validateScalarClaim(item.y, `${path}.y`));
  });

  segments.forEach((item, index) => {
    const path = `$.segments[${index}]`;
    if (!isRecord(item)) return;
    for (const endpoint of ["start", "end"] as const) {
      const endpointValue = item[endpoint];
      if (!isRecord(endpointValue)) {
        add(`${path}.${endpoint}`, "INVALID_ENDPOINT", "Endpoint must contain a point reference.");
      } else {
        requirePoint(endpointValue.point, `${path}.${endpoint}.point`);
      }
    }
    const start = isRecord(item.start) ? item.start.point : undefined;
    const end = isRecord(item.end) ? item.end.point : undefined;
    if (typeof start === "string" && start === end) {
      add(path, "DEGENERATE_SEGMENT", "Segment endpoints must be distinct.");
    }
  });

  polygons.forEach((item, index) => {
    const path = `$.polygons[${index}]`;
    if (!isRecord(item)) return;
    if (!Array.isArray(item.points)) {
      add(`${path}.points`, "INVALID_POLYGON", "Polygon points must be an array.");
      return;
    }
    if (item.points.length < 3) {
      add(`${path}.points`, "TOO_FEW_POLYGON_POINTS", "Polygon requires at least three point references.");
    }
    item.points.forEach((point, pointIndex) => requirePoint(point, `${path}.points[${pointIndex}]`));
    const stringPoints = item.points.filter((point): point is string => typeof point === "string");
    if (new Set(stringPoints).size !== stringPoints.length) {
      add(`${path}.points`, "REPEATED_POLYGON_POINT", "Polygon topology cannot repeat a point reference.");
    }
  });

  circles.forEach((item, index) => {
    const path = `$.circles[${index}]`;
    if (!isRecord(item)) return;
    requirePoint(item.center, `${path}.center`);
    const radiusEvidence = validateScalarClaim(item.radius, `${path}.radius`);
    evidence.push(...radiusEvidence);
    if (isRecord(item.radius) && item.radius.authority !== "unknown" && finite(item.radius.value) && item.radius.value <= 0) {
      add(`${path}.radius.value`, "INVALID_RADIUS", "Known circle radius must be positive.");
    }
  });

  labels.forEach((item, index) => {
    const path = `$.labels[${index}]`;
    if (!isRecord(item)) return;
    requirePoint(item.anchor, `${path}.anchor`);
  });

  const layerOrders = new Set<number>();
  const layeredMembers = new Set<string>();
  layers.forEach((item, index) => {
    const path = `$.layers[${index}]`;
    if (!isRecord(item)) return;
    if (!Number.isSafeInteger(item.order)) {
      add(`${path}.order`, "INVALID_LAYER_ORDER", "Layer order must be a safe integer.");
    } else if (layerOrders.has(item.order as number)) {
      add(`${path}.order`, "DUPLICATE_LAYER_ORDER", `Duplicate layer order: ${item.order}`);
    } else {
      layerOrders.add(item.order as number);
    }
    if (!Array.isArray(item.members)) {
      add(`${path}.members`, "INVALID_LAYER_MEMBERS", "Layer members must be an array.");
      return;
    }
    item.members.forEach((member, memberIndex) => {
      const memberPath = `${path}.members[${memberIndex}]`;
      if (typeof member !== "string" || member.length === 0 || !allIds.has(member)) {
        add(memberPath, "MISSING_LAYER_MEMBER", `Layer member does not exist: ${String(member)}`);
      } else if (layeredMembers.has(member)) {
        add(memberPath, "DUPLICATE_LAYER_MEMBER", `Geometry belongs to more than one layer: ${member}`);
      } else {
        layeredMembers.add(member);
      }
    });
  });

  relations.forEach((item, index) => {
    const path = `$.relations[${index}]`;
    if (!isRecord(item)) return;
    if (typeof item.kind !== "string" || item.kind.length === 0) {
      add(`${path}.kind`, "INVALID_RELATION_KIND", "Relation kind must be a non-empty string.");
    }
    for (const endpoint of ["from", "to"] as const) {
      const target = item[endpoint];
      if (typeof target !== "string" || target.length === 0 || !allIds.has(target)) {
        add(`${path}.${endpoint}`, "MISSING_RELATION_TARGET", `Relation target does not exist: ${String(target)}`);
      }
    }
    if (typeof item.authority !== "string" || !AUTHORITIES.has(item.authority as GeometryAuthority)) {
      add(`${path}.authority`, "INVALID_AUTHORITY", "Relation authority must be unknown, proposed, estimated, or exact.");
    }
  });

  evidence.sort(compareEvidence);
  return { locked: evidence.length === 0, evidence };
}

export function assertGeometryLocked(value: unknown): asserts value is GeometryLockDocument {
  const result = validateGeometryLock(value);
  if (!result.locked) {
    throw new TypeError(
      `Geometry Lock rejected:\n${result.evidence.map((item) => `${item.path} [${item.code}] ${item.message}`).join("\n")}`,
    );
  }
}

export function serializeGeometryLock(value: unknown): string {
  assertGeometryLocked(value);
  return JSON.stringify(value);
}
