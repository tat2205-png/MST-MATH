import * as THREE from "three";
import type { FoldScene, Mat4 } from "./types.js";
import { getNAMathVisualStyle } from "../../config/naMathFoldVisualStandardV1.js";
const hexNumber=(hex:string)=>Number.parseInt(hex.slice(1),16);

export interface FoldThreeMapping {
  group: THREE.Group;
  faces: Map<string, THREE.Group>;
  meshes: Map<string, THREE.Mesh>;
  setEdgesVisible(visible: boolean): void;
  apply(scene: FoldScene): void;
  dispose(): void;
}

const validMatrix = (matrix: Mat4) => matrix.length === 16 && matrix.every(Number.isFinite);
const setMatrix = (object: THREE.Object3D, matrix: Mat4) => {
  object.matrixAutoUpdate = false;
  object.matrix.set(...matrix);
  object.matrixWorldNeedsUpdate = true;
};

export function createFoldThreeMapping(scene: FoldScene): FoldThreeMapping {
  if (!scene?.net?.faces?.length || scene.state.faceTransforms.length !== scene.net.faces.length) throw new Error("INVALID_FOLD_SCENE");
  const transforms = new Map(scene.state.faceTransforms.map((face) => [face.faceId, face.matrix]));
  const group = new THREE.Group(); group.name = scene.id;
  const faces = new Map<string, THREE.Group>(), meshes = new Map<string, THREE.Mesh>();
  for (const face of scene.net.faces) {
    if (face.vertices.length < 3 || !transforms.has(face.faceId)) throw new Error(`INVALID_FOLD_SCENE:${face.faceId}`);
    const positions: number[] = [];
    for (let index = 1; index < face.vertices.length - 1; index++) {
      for (const vertex of [face.vertices[0], face.vertices[index], face.vertices[index + 1]]) positions.push(vertex.position[0], vertex.position[1], 0);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)); geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({ color: hexNumber(getNAMathVisualStyle("base-face").color), side: THREE.DoubleSide, transparent: true, opacity: 0.88 });
    const mesh = new THREE.Mesh(geometry, material); mesh.name = face.faceId; mesh.userData.faceId = face.faceId;
    const edgeGeometry = new THREE.BufferGeometry().setFromPoints(face.vertices.map((vertex) => new THREE.Vector3(vertex.position[0], vertex.position[1], 0)));
    const edge = new THREE.LineLoop(edgeGeometry, new THREE.LineBasicMaterial({ color: hexNumber(getNAMathVisualStyle("visible-edge").color) })); edge.name = `${face.faceId}:edges`; edge.userData.foldEdgeDisplay = true;
    const faceGroup = new THREE.Group(); faceGroup.name = face.faceId; faceGroup.userData.faceId = face.faceId; faceGroup.add(mesh, edge);
    setMatrix(faceGroup, transforms.get(face.faceId)!); group.add(faceGroup); faces.set(face.faceId, faceGroup); meshes.set(face.faceId, mesh);
  }
  return {
    group, faces, meshes,
    setEdgesVisible: (visible) => faces.forEach((face) => { const edge = face.children.find((child) => child.userData.foldEdgeDisplay); if (edge) edge.visible = visible; }),
    apply: (next) => {
      if (next.solidId !== scene.solidId) throw new Error("FOLD_SCENE_SOLID_MISMATCH");
      for (const transform of next.state.faceTransforms) { if (!validMatrix(transform.matrix) || !faces.has(transform.faceId)) throw new Error(`INVALID_FOLD_TRANSFORM:${transform.faceId}`); setMatrix(faces.get(transform.faceId)!, transform.matrix); }
    },
    dispose: () => {
      group.traverse((object) => { const renderable = object as THREE.Mesh; renderable.geometry?.dispose(); const materials = renderable.material ? (Array.isArray(renderable.material) ? renderable.material : [renderable.material]) : []; materials.forEach((material) => material.dispose()); });
      group.clear(); faces.clear(); meshes.clear();
    },
  };
}

export function setFoldFaceHighlighted(mapping: FoldThreeMapping, faceId?: string) {
  mapping.meshes.forEach((mesh, id) => { const material = mesh.material as THREE.MeshStandardMaterial; material.color.setHex(hexNumber(getNAMathVisualStyle(id === faceId ? "important-vertex" : "base-face").color)); material.opacity = id === faceId ? 1 : 0.88; });
}
