import assert from "node:assert/strict";
import {
  assertGeometryLocked,
  createScalarClaim,
  serializeGeometryLock,
  validateGeometryLock,
  validateScalarClaim,
  type GeometryLockDocument,
} from "../../core/geometry-lock/index.ts";

const exact = (value: number) => createScalarClaim("exact", value);

const valid: GeometryLockDocument = {
  version: 1,
  points: [
    { id: "A", x: exact(0), y: exact(0) },
    { id: "B", x: exact(4), y: exact(0) },
    { id: "C", x: exact(0), y: exact(3) },
    { id: "label-anchor", x: createScalarClaim("estimated", 1), y: createScalarClaim("proposed", 1) },
    { id: "pending", x: createScalarClaim("unknown"), y: createScalarClaim("unknown") },
  ],
  segments: [{ id: "AB", start: { point: "A" }, end: { point: "B" } }],
  polygons: [{ id: "triangle", points: ["A", "B", "C"] }],
  circles: [{ id: "circle-A", center: "A", radius: exact(2) }],
  labels: [{ id: "label-A", anchor: "label-anchor" }],
  layers: [{ id: "geometry-layer", order: 0, members: ["AB", "triangle", "circle-A", "label-A"] }],
  relations: [{ id: "perpendicular", kind: "perpendicular", from: "AB", to: "triangle", authority: "exact" }],
};

const accepted = validateGeometryLock(valid);
assert.equal(accepted.locked, true);
assert.deepEqual(accepted.evidence, []);
assert.doesNotThrow(() => assertGeometryLocked(valid));
assert.equal(serializeGeometryLock(valid), JSON.stringify(valid));

assert.deepEqual(createScalarClaim("unknown"), { authority: "unknown" });
assert.deepEqual(createScalarClaim("proposed", 2), { authority: "proposed", value: 2 });
assert.deepEqual(createScalarClaim("estimated", 2), { authority: "estimated", value: 2 });
assert.deepEqual(createScalarClaim("exact", 2), { authority: "exact", value: 2 });
assert.throws(() => createScalarClaim("exact", Number.NaN), /MISSING_CLAIM_VALUE/);
assert.ok(validateScalarClaim({ authority: "unknown", value: 0 }).some((item) => item.code === "UNKNOWN_HAS_VALUE"));
assert.ok(validateScalarClaim({ authority: "estimated" }).some((item) => item.code === "MISSING_CLAIM_VALUE"));

const invalid: unknown = {
  ...valid,
  points: [...valid.points, { id: "A", x: exact(1), y: exact(1) }],
  segments: [
    { id: "bad-endpoint", start: { point: "missing" }, end: { point: "missing" } },
  ],
  polygons: [
    { id: "bad-polygon", points: ["A", "B", "A"] },
  ],
  circles: [
    { id: "bad-circle", center: "missing", radius: exact(0) },
  ],
  labels: [
    { id: "bad-label", anchor: "missing" },
  ],
  layers: [
    { id: "layer-one", order: 0, members: ["bad-circle", "missing"] },
    { id: "layer-two", order: 0, members: ["bad-circle"] },
  ],
  relations: [
    { id: "bad-relation", kind: "", from: "missing", to: "bad-circle", authority: "verified" },
  ],
};

const rejected = validateGeometryLock(invalid);
assert.equal(rejected.locked, false);
const codes = new Set(rejected.evidence.map((item) => item.code));
for (const code of [
  "DUPLICATE_ID",
  "MISSING_POINT_REFERENCE",
  "DEGENERATE_SEGMENT",
  "REPEATED_POLYGON_POINT",
  "INVALID_RADIUS",
  "DUPLICATE_LAYER_ORDER",
  "MISSING_LAYER_MEMBER",
  "DUPLICATE_LAYER_MEMBER",
  "INVALID_RELATION_KIND",
  "MISSING_RELATION_TARGET",
  "INVALID_AUTHORITY",
]) {
  assert.ok(codes.has(code), `expected evidence code ${code}`);
}

const paths = rejected.evidence.map((item) => item.path);
assert.deepEqual(paths, [...paths].sort(), "machine-readable evidence uses deterministic path ordering");
assert.throws(() => assertGeometryLocked(invalid), /Geometry Lock rejected/);

const absentCollections = validateGeometryLock({ version: 1 });
assert.equal(absentCollections.locked, false, "authority fails closed when required collections are absent");
assert.equal(absentCollections.evidence.filter((item) => item.code === "MISSING_COLLECTION").length, 7);

assert.deepEqual(
  validateGeometryLock(invalid),
  validateGeometryLock(invalid),
  "identical input produces identical evidence",
);

console.log("Geometry Lock tests: PASS");
