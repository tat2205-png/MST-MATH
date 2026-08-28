import assert from "node:assert/strict";
import {
  FOLD_FIXTURES, buildFoldTopology, computeFoldState, createFoldScene,
  createManimFoldBoundary, createThreeJsFoldBoundary, foldNetToSvg,
  foldNetToTikz, generateCanonicalNet, updateFoldScene, validateFoldState,
  validateFoldTopology, validateNet,
} from "../src/modules/fold-3d/index.js";

const expected = {
  cube: [8, 12, 6], rectangularPrism: [8, 12, 6], triangularPrism: [6, 9, 5],
  tetrahedron: [4, 6, 4], squarePyramid: [5, 8, 5],
} as const;
const distance = (a: number[], b: number[]) => Math.hypot(...a.map((value, index) => value - b[index]));
const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

for (const [name, source] of Object.entries(FOLD_FIXTURES)) {
  const topologyResult = buildFoldTopology(source);
  assert.equal(topologyResult.status, "PASS", `${name}: ${JSON.stringify(topologyResult.issues)}`);
  const topology = topologyResult.value!;
  assert.deepEqual([topology.vertices.length, topology.edges.length, topology.faces.length], expected[name as keyof typeof expected]);
  assert.equal(topology.vertices.length - topology.edges.length + topology.faces.length, 2);
  assert.equal(topology.edges.every((edge) => edge.incidentFaceIds.length === 2 && !edge.boundary), true);
  assert.equal(validateFoldTopology(topology).status, "PASS");

  const netResult = generateCanonicalNet(topology);
  assert.equal(netResult.status, "PASS", `${name}: ${JSON.stringify(netResult.issues)}`);
  const net = netResult.value!;
  assert.equal(net.faces.length, topology.faces.length);
  assert.equal(net.hinges.length, topology.faces.length - 1);
  assert.equal(validateNet(net, topology).status, "PASS");

  for (const progress of [0, 0.5, 1]) {
    const stateResult = computeFoldState(net, progress);
    assert.equal(stateResult.status, "PASS");
    const state = stateResult.value!;
    assert.deepEqual(state.faceTransforms.find((face) => face.faceId === net.rootFaceId)?.matrix, identity);
    for (const transformed of state.faceTransforms) {
      const flat = net.faces.find((face) => face.faceId === transformed.faceId)!;
      for (let i = 0; i < flat.vertices.length; i++) for (let j = i + 1; j < flat.vertices.length; j++) {
        assert.ok(Math.abs(distance(flat.vertices[i].position, flat.vertices[j].position) - distance(transformed.transformedVertices[i].position, transformed.transformedVertices[j].position)) < 1e-7, `${name}: rigid face`);
      }
    }
  }

  const folded = computeFoldState(net, 1).value!;
  for (const vertex of topology.vertices) {
    const occurrences = folded.faceTransforms.flatMap((face) => face.transformedVertices.filter((item) => item.vertexId === vertex.id).map((item) => item.position));
    for (const occurrence of occurrences.slice(1)) assert.ok(distance(occurrences[0], occurrence) < 1e-6, `${name}: vertex ${vertex.id} did not close`);
  }

  const scene = createFoldScene(source, 0).value!;
  assert.ok(scene);
  assert.equal(scene.faceCorrespondence.length, topology.faces.length);
  assert.equal(scene.edgeCorrespondence.length, topology.edges.length);
  const returned = updateFoldScene(updateFoldScene(scene, 1).value!, 0).value!;
  assert.deepEqual(returned.state, scene.state);
  assert.equal(createThreeJsFoldBoundary(scene).status, "PARTIAL");
  assert.equal(createManimFoldBoundary(scene).status, "PARTIAL");
  assert.match(foldNetToSvg(scene).output!, /^<svg/);
  assert.match(foldNetToTikz(scene).output!, /\\begin\{tikzpicture\}/);
}

const rectangular = buildFoldTopology(FOLD_FIXTURES.rectangularPrism).value!;
assert.deepEqual(rectangular.metadata.dimensions, { length: 2, width: 3, height: 5 });
const rectangularPositions = new Map(rectangular.vertices.map((vertex) => [vertex.id, vertex.foldedPosition]));
const rectangularFaceDimensions = rectangular.faces.map((face) => [...new Set(face.vertexIds.map((id, index) => distance(rectangularPositions.get(id)!, rectangularPositions.get(face.vertexIds[(index + 1) % face.vertexIds.length])!)))].sort((a, b) => a - b).join("x"));
assert.deepEqual([...new Set(rectangularFaceDimensions)].sort(), ["2x3", "2x5", "3x5"]);
const tetraNet = generateCanonicalNet(buildFoldTopology(FOLD_FIXTURES.tetrahedron).value!).value!;
assert.ok(tetraNet.hinges.some((hinge) => Math.abs(Math.abs(hinge.targetAngleRadians) - Math.PI / 2) > 0.1));

const brokenTopology = structuredClone(rectangular);
brokenTopology.faces.pop();
assert.equal(validateFoldTopology(brokenTopology).status, "FAIL");
const missingFaceScene = structuredClone(FOLD_FIXTURES.cube); missingFaceScene.entities = missingFaceScene.entities.filter((entity) => entity.id !== "face-top");
assert.equal(buildFoldTopology(missingFaceScene).status, "FAIL");
const cubeTopology = buildFoldTopology(FOLD_FIXTURES.cube).value!;
const cubeNet = generateCanonicalNet(cubeTopology).value!;
const missingHingeFace = structuredClone(cubeNet); missingHingeFace.hinges[0].childFaceId = "fold-face-missing";
assert.ok(validateNet(missingHingeFace, cubeTopology).issues.some((issue) => issue.code === "MISSING_HINGE_REFERENCE"));
const disconnected = structuredClone(cubeNet); disconnected.hinges.pop();
assert.ok(validateNet(disconnected, cubeTopology).issues.some((issue) => issue.code === "DISCONNECTED_NET"));
const cyclic = structuredClone(cubeNet); cyclic.hinges.push({ ...cyclic.hinges[0], id: "hinge-cycle", parentFaceId: cyclic.hinges[0].childFaceId, childFaceId: cyclic.hinges[0].parentFaceId });
assert.ok(validateNet(cyclic, cubeTopology).issues.some((issue) => issue.code === "CYCLIC_FOLD_TREE"));
for (const progress of [Number.NaN, Number.POSITIVE_INFINITY, -0.1, 1.1]) assert.equal(computeFoldState(cubeNet, progress).status, "FAIL");
const invalidState = computeFoldState(cubeNet, 0).value!; invalidState.faceTransforms[0].matrix[0] = Number.NaN;
assert.ok(validateFoldState(invalidState, cubeNet).issues.some((issue) => issue.code === "NAN_TRANSFORM"));
const infiniteState = computeFoldState(cubeNet, 0).value!; infiniteState.faceTransforms[0].matrix[0] = Number.POSITIVE_INFINITY;
assert.ok(validateFoldState(infiniteState, cubeNet).issues.some((issue) => issue.code === "INFINITE_TRANSFORM"));
const unsupported = structuredClone(FOLD_FIXTURES.cube) as any; unsupported.entities.find((entity: any) => entity.type === "polyhedron").solidKind = "dodecahedron";
assert.equal(buildFoldTopology(unsupported).status, "UNSUPPORTED");
const unsafe = structuredClone(FOLD_FIXTURES.cube); unsafe.entities[0].id = "../../payload";
assert.equal(buildFoldTopology(unsafe).status, "FAIL");
const extreme = structuredClone(FOLD_FIXTURES.cube) as any; extreme.entities.find((entity: any) => entity.type === "point").layoutCoordinate.x = 1e12;
assert.equal(buildFoldTopology(extreme).status, "FAIL");

console.log("FOLD_3D_ENGINE_V1_TESTS=PASS");
