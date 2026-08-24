import type { GeometrySpec } from "../../src/types/geometrySpec.js";
import { fingerprintGeometry } from "./geometryValidator.js";

export function buildGoldenCubeNet(taskId = "G01_CUBE_NET"): GeometrySpec {
  const unsigned: Omit<GeometrySpec, "sourceFingerprint"> = {
    schemaVersion: "1.0", taskId, geometryType: "POLYHEDRON_NET",
    vertices: [
      { id: "A", x: 0, y: 0, z: 0 }, { id: "B", x: 1, y: 0, z: 0 },
      { id: "C", x: 1, y: 1, z: 0 }, { id: "D", x: 0, y: 1, z: 0 },
      { id: "E", x: 0, y: 0, z: 1 }, { id: "F", x: 1, y: 0, z: 1 },
      { id: "G", x: 1, y: 1, z: 1 }, { id: "H", x: 0, y: 1, z: 1 },
    ],
    edges: [["A","B"],["B","C"],["C","D"],["D","A"],["E","F"],["F","G"],["G","H"],["H","E"],["A","E"],["B","F"],["C","G"],["D","H"]].map(([a,b]) => ({ id: `e${a}${b}`, vertices: [a,b] as [string,string] })),
    faces: [
      { id: "bottom", vertices: ["A","B","C","D"] }, { id: "top", vertices: ["E","H","G","F"] },
      { id: "front", vertices: ["A","E","F","B"] }, { id: "right", vertices: ["B","F","G","C"] },
      { id: "back", vertices: ["C","G","H","D"] }, { id: "left", vertices: ["D","H","E","A"] },
    ],
    labels: ["A","B","C","D","E","F","G","H"].map((id) => ({ id: `label_${id}`, text: id, vertex: id })),
    dimensions: [
      { id: "width", edge: "eAB", value: 1, unit: "u", label: "1 u" },
      { id: "height", edge: "eAE", value: 1, unit: "u", label: "1 u" },
      { id: "depth", edge: "eBC", value: 1, unit: "u", label: "1 u" },
    ],
    adjacency: [
      { faces: ["front","bottom"], edge: "eAB" }, { faces: ["front","top"], edge: "eEF" },
      { faces: ["front","left"], edge: "eAE" }, { faces: ["front","right"], edge: "eBF" },
      { faces: ["back","bottom"], edge: "eCD" }, { faces: ["back","top"], edge: "eGH" },
      { faces: ["back","left"], edge: "eDH" }, { faces: ["back","right"], edge: "eCG" },
      { faces: ["bottom","left"], edge: "eDA" }, { faces: ["bottom","right"], edge: "eBC" },
      { faces: ["top","left"], edge: "eHE" }, { faces: ["top","right"], edge: "eFG" },
    ],
    renderOptions: { outputFormat: "PDF_SVG", widthCm: 10, heightCm: 8, strokeColor: "blue" },
    net: {
      rootFace: "front",
      faceCoordinates: {
        front: [[0,0],[1,0],[1,1],[0,1]], bottom: [[0,-1],[1,-1],[1,0],[0,0]],
        top: [[0,1],[1,1],[1,2],[0,2]], left: [[-1,0],[0,0],[0,1],[-1,1]],
        right: [[1,0],[2,0],[2,1],[1,1]], back: [[0,2],[1,2],[1,3],[0,3]],
      },
      adjacency: [
        { faces: ["front","bottom"], hingeEdge: "eAB" }, { faces: ["front","top"], hingeEdge: "eEF" },
        { faces: ["front","left"], hingeEdge: "eAE" }, { faces: ["front","right"], hingeEdge: "eBF" },
        { faces: ["top","back"], hingeEdge: "eGH" },
      ],
    },
  };
  return { ...unsigned, sourceFingerprint: fingerprintGeometry(unsigned) };
}
