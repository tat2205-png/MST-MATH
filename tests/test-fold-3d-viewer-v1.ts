import assert from "node:assert/strict";
import * as THREE from "three";
import { FOLD_FIXTURES, createFoldScene, updateFoldScene } from "../src/modules/fold-3d/index.js";
import { createFoldThreeMapping, setFoldFaceHighlighted } from "../src/modules/fold-3d/three-viewer-adapter.js";

for (const source of Object.values(FOLD_FIXTURES)) {
  const flat = createFoldScene(source, 0).value!; const mapping = createFoldThreeMapping(flat);
  assert.equal(mapping.faces.size, flat.topology.faces.length); assert.deepEqual([...mapping.faces.keys()], flat.net.faces.map((face) => face.faceId));
  for (const face of flat.state.faceTransforms) assert.deepEqual(mapping.faces.get(face.faceId)?.matrix.toArray(), new THREE.Matrix4().set(...face.matrix).toArray());
  const folded = updateFoldScene(flat, 1).value!; mapping.apply(folded);
  for (const face of folded.state.faceTransforms) assert.deepEqual(mapping.faces.get(face.faceId)?.matrix.toArray(), new THREE.Matrix4().set(...face.matrix).toArray());
  mapping.setEdgesVisible(false); assert.equal([...mapping.faces.values()].every((face) => face.children.find((child) => child.userData.foldEdgeDisplay)?.visible === false), true);
  const selected = flat.net.faces[0].faceId; setFoldFaceHighlighted(mapping, selected); assert.equal((mapping.meshes.get(selected)?.material as THREE.MeshStandardMaterial).color.getHex(), 0xf59e0b);
  mapping.dispose(); assert.equal(mapping.faces.size, 0); assert.equal(mapping.group.children.length, 0);
}
const invalid = structuredClone(createFoldScene(FOLD_FIXTURES.cube, 0).value!); invalid.state.faceTransforms.pop();
assert.throws(() => createFoldThreeMapping(invalid), /INVALID_FOLD_SCENE/);
const cube = createFoldScene(FOLD_FIXTURES.cube, 0).value!, tetra = createFoldScene(FOLD_FIXTURES.tetrahedron, 0).value!;
const cubeMapping = createFoldThreeMapping(cube); assert.throws(() => cubeMapping.apply(tetra), /FOLD_SCENE_SOLID_MISMATCH/); cubeMapping.dispose();

console.log("FOLD_3D_VIEWER_V1_TESTS=PASS");
