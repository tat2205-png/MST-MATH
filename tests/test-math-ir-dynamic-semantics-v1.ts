import assert from "node:assert/strict";
import {
  DependencyGraph, MATH_IR_SCHEMA_VERSION, createMathEvent, createMathScene,
  deserializeMathIR, emptySemanticUpdate, serializeMathIR, sortMathEvents,
  transitionCase, updateDynamicParameter, validateMathIR,
  type DynamicParameter, type MathDependency, type MathDocument,
} from "../src/modules/math-ir/index.js";

const dependencies: MathDependency[] = [
  { id: "dep-B", dependentId: "B", sourceIds: ["A"], kind: "derived", evaluatorRef: "fixture:B" },
  { id: "dep-C", dependentId: "C", sourceIds: ["B"], kind: "derived", evaluatorRef: "fixture:C" },
  { id: "dep-H", dependentId: "H", sourceIds: ["A", "B", "C"], kind: "projection", evaluatorRef: "geometry:projection" },
];
const graph = new DependencyGraph(dependencies);
assert.deepEqual(graph.directDependencies("H"), ["A", "B", "C"]);
assert.deepEqual(graph.dependents("A"), ["B", "H"]);
assert.deepEqual(graph.recomputationOrder(["A"]), ["B", "C", "H"]);
assert.deepEqual(graph.recomputationOrder(["A"]), graph.recomputationOrder(["A"]));
assert.equal(graph.add({ id: "dep-cycle", dependentId: "A", sourceIds: ["C"], kind: "invalid", evaluatorRef: "fixture:cycle" }).status, "FAIL");

const constraint = { id: "constraint-perpendicular", type: "perpendicular" as const, entityIds: ["AH", "BC"], fact: { origin: "unknown" as const }, mode: "WATCH" as const, status: "UNKNOWN" as const };
assert.equal({ ...constraint, status: "SATISFIED" as const }.status, "SATISFIED");
assert.equal({ ...constraint, status: "VIOLATED" as const }.status, "VIOLATED");
assert.notEqual(constraint.status, "VIOLATED");
assert.equal({ ...constraint, mode: "LOCKED" as const }.mode, "LOCKED");

const relation = { id: "relation-1", type: "perpendicular", subjectId: "AH", objectIds: ["BC"], fact: { origin: "unknown" as const }, status: "UNKNOWN" as const, classification: "unclassified" };
assert.equal({ ...relation, status: "TRUE" as const }.status, "TRUE");

const parameter: DynamicParameter = { id: "m", value: 1, domain: { kind: "range", min: 0, max: 3 }, step: 1, bindings: [{ objectId: "H", property: "expression" }] };
const parameterGraph = new DependencyGraph([{ id: "dep-H-m", dependentId: "H", sourceIds: ["m"], kind: "parameter", evaluatorRef: "fixture:m" }]);
const update = updateDynamicParameter(parameter, 2, parameterGraph);
assert.equal(update.status, "PASS"); assert.equal(update.value?.parameter.value, 2);
assert.deepEqual(update.value?.update.affectedDependentIds, ["H"]);
assert.equal(update.value?.update.events[0].kind, "PARAMETER_CHANGED");
assert.equal(updateDynamicParameter(parameter, 4).status, "FAIL");

const events = sortMathEvents([createMathEvent("b", "OBJECT_CHANGED", 1), createMathEvent("c", "OBJECT_CHANGED", 0), createMathEvent("a", "OBJECT_CHANGED", 1)]);
assert.deepEqual(events.map((event) => event.id), ["c", "a", "b"]);
assert.deepEqual(sortMathEvents(events), events);

const initialCase = { id: "case-position", family: "line-circle-relative-position", currentKey: "DISJOINT", objectIds: ["line", "circle"] };
const transitioned = transitionCase(initialCase, "TANGENT", "parameter:m", 2);
assert.equal(transitioned.state.previousKey, "DISJOINT"); assert.equal(transitioned.state.currentKey, "TANGENT");
assert.equal(transitioned.event?.kind, "CASE_CHANGED");
assert.deepEqual(transitionCase(transitioned.state, "TANGENT", "same", 3), { state: transitioned.state });

const document: MathDocument = {
  schemaVersion: MATH_IR_SCHEMA_VERSION, id: "dynamic-fixture", sections: [], problems: [], expressions: [],
  scenes: [createMathScene({
    id: "dynamic-scene", name: "Semantic contracts", dimension: "2d",
    entities: ["A", "B", "C", "H", "AH", "BC", "line", "circle"].map((id) => ({ id, type: "point" as const })),
    constraints: [constraint], relations: [relation],
    semantics: { dependencies: [...dependencies, { id: "dep-H-m", dependentId: "H", sourceIds: ["m"], kind: "parameter", evaluatorRef: "fixture:m" }], parameters: [parameter], events, cases: [transitioned.state] },
  })],
};
assert.equal(validateMathIR(document).status, "PASS", JSON.stringify(validateMathIR(document).issues));
const serialized = serializeMathIR(document); const roundTrip = deserializeMathIR(serialized);
assert.equal(roundTrip.status, "PASS"); assert.deepEqual(roundTrip.value, document); assert.equal(serializeMathIR(roundTrip.value!), serialized);

const oldDocument: MathDocument = { schemaVersion: MATH_IR_SCHEMA_VERSION, id: "old", sections: [], problems: [], scenes: [], expressions: [] };
assert.equal(deserializeMathIR(JSON.stringify(oldDocument)).status, "PASS");
const cyclic = structuredClone(document); cyclic.scenes[0].semantics!.dependencies = [...dependencies, { id: "cycle", dependentId: "A", sourceIds: ["C"], kind: "bad", evaluatorRef: "bad" }];
assert.ok(validateMathIR(cyclic).issues.some((issue) => issue.code === "DEPENDENCY_CYCLE"));
const unknown = structuredClone(document); unknown.scenes[0].semantics!.dependencies![0].sourceIds = ["missing"];
assert.ok(validateMathIR(unknown).issues.some((issue) => issue.code === "INVALID_REFERENCE"));
const duplicate = structuredClone(document); duplicate.scenes[0].semantics!.events![0].id = duplicate.scenes[0].semantics!.parameters![0].id;
assert.ok(validateMathIR(duplicate).issues.some((issue) => issue.code === "DUPLICATE_SEMANTIC_ID"));
const invalidRange = structuredClone(document); (invalidRange.scenes[0].semantics!.parameters![0].domain as any).min = 5;
assert.ok(validateMathIR(invalidRange).issues.some((issue) => issue.code === "INVALID_PARAMETER_RANGE"));
const malformedDependency = structuredClone(document) as any; malformedDependency.scenes[0].semantics.dependencies[0].sourceIds = "A";
assert.ok(validateMathIR(malformedDependency).issues.some((issue) => issue.code === "INVALID_DEPENDENCY"));
const unresolved = structuredClone(document); unresolved.scenes[0].constraints[0].status = "UNRESOLVED";
unresolved.scenes[0].relations![0].status = "UNRESOLVED";
assert.equal(validateMathIR(unresolved).status, "PASS");

assert.deepEqual(emptySemanticUpdate().events, []);
assert.equal(createMathEvent("layout", "OBJECT_CHANGED", 0, "VISUAL_CHANGE_ONLY", ["A"]).changeKind, "VISUAL_CHANGE_ONLY");
assert.equal(createMathEvent("semantic", "OBJECT_CHANGED", 1, "SEMANTIC_CHANGE", ["A"]).changeKind, "SEMANTIC_CHANGE");

console.log("MATH_IR_DYNAMIC_SEMANTICS_V1_TESTS=PASS");
