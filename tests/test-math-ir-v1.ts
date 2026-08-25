import assert from "node:assert/strict";
import {
  MATH_IR_SCHEMA_VERSION,
  circleFixture,
  deserializeMathIR,
  graphFixture,
  malformedFixture,
  pyramidFixture,
  serializeMathIR,
  triangleFixture,
  validateMathIR,
} from "../src/modules/math-ir/index.js";

for (const fixture of [triangleFixture, circleFixture, graphFixture, pyramidFixture]) {
  const validation = validateMathIR(fixture);
  assert.equal(validation.status, "PASS", JSON.stringify(validation.issues));
  assert.equal(fixture.schemaVersion, MATH_IR_SCHEMA_VERSION);
}

const triangleScene = triangleFixture.scenes[0];
assert.equal(triangleScene.entities.filter((entity) => entity.type === "point").length, 3);
assert.equal(triangleScene.entities.filter((entity) => entity.type === "segment").length, 3);
assert.equal(triangleScene.entities.filter((entity) => entity.type === "triangle").length, 1);
assert.equal(triangleScene.constraints[0].type, "equal_length");
assert.equal(triangleScene.constraints[0].fact.origin, "given");

assert.ok(circleFixture.scenes[0].constraints.some((constraint) => constraint.type === "point_on_circle"));
assert.ok(circleFixture.scenes[0].constraints.some((constraint) => constraint.type === "radius"));
assert.ok(graphFixture.scenes[0].entities.some((entity) => entity.type === "coordinate_axes_2d"));
assert.ok(graphFixture.scenes[0].entities.some((entity) => entity.type === "function_graph"));
assert.equal(pyramidFixture.scenes[0].dimension, "3d");
assert.ok(pyramidFixture.scenes[0].entities.some((entity) => entity.type === "pyramid"));
assert.ok(pyramidFixture.scenes[0].constraints.some((constraint) => constraint.type === "line_perpendicular_plane"));

const serialized = serializeMathIR(pyramidFixture);
const roundTrip = deserializeMathIR(serialized);
assert.equal(roundTrip.status, "PASS");
assert.deepEqual(roundTrip.value, pyramidFixture);
assert.equal(roundTrip.value?.schemaVersion, MATH_IR_SCHEMA_VERSION);
assert.equal(roundTrip.value?.scenes[0].constraints[0].fact.origin, "given");

const malformed = validateMathIR(malformedFixture);
assert.equal(malformed.status, "FAIL");
assert.ok(malformed.issues.some((issue) => issue.code === "DUPLICATE_ID"));
assert.ok(malformed.issues.some((issue) => issue.code === "INVALID_REFERENCE"));

const unsupportedEntity = structuredClone(triangleFixture) as any;
unsupportedEntity.scenes[0].entities[0].type = "renderer_sprite";
assert.ok(validateMathIR(unsupportedEntity).issues.some((issue) => issue.code === "UNSUPPORTED_ENTITY_TYPE"));

const unsupportedConstraint = structuredClone(triangleFixture) as any;
unsupportedConstraint.scenes[0].constraints[0].type = "approximately_pretty";
assert.ok(validateMathIR(unsupportedConstraint).issues.some((issue) => issue.code === "UNSUPPORTED_CONSTRAINT_TYPE"));

const invalidNumber = structuredClone(graphFixture) as any;
invalidNumber.scenes[0].camera.viewport.maxX = Number.NaN;
assert.ok(validateMathIR(invalidNumber).issues.some((issue) => issue.code === "INVALID_NUMERIC_VALUE"));

const selfRelation = structuredClone(triangleFixture) as any;
selfRelation.scenes[0].relations = [{ id: "relation-self", type: "references", subjectId: "point-A", objectIds: ["point-A"], fact: { origin: "unknown" } }];
assert.ok(validateMathIR(selfRelation).issues.some((issue) => issue.code === "SELF_REFERENCE"));

const invalidJson = deserializeMathIR("{not-json");
assert.equal(invalidJson.status, "FAIL");
assert.equal(invalidJson.validation.issues[0].code, "INVALID_JSON");

const circular = structuredClone(triangleFixture) as any;
circular.metadata = { adapterMetadata: {} };
circular.metadata.adapterMetadata.circular = circular;
assert.ok(validateMathIR(circular).issues.some((issue) => issue.code === "CIRCULAR_REFERENCE"));

console.log("MATH_IR_V1_TESTS=PASS");
