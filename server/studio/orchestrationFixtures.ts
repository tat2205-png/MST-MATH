import { createSceneGraph } from "../../image-animation/core/scene-graph/index.js";

export function createTriangleAreaSceneGraph() {
  return createSceneGraph([
    {
      identity: { id: "triangle" },
      geometry: { kind: "polygon", points: [{ x: -2, y: -1 }, { x: 2, y: -1 }, { x: 0, y: 2 }] },
      style: { stroke: "#2563eb", strokeWidth: 2 },
      placement: { layer: 1, order: 0 },
      relations: {},
      metadata: { geometryLocked: true },
    },
    {
      identity: { id: "answer" },
      geometry: { kind: "label", position: { x: 0, y: -2 }, text: "Area = 6" },
      style: {},
      placement: { layer: 2, order: 0 },
      relations: {},
      metadata: { authority: "exact" },
    },
  ]);
}

export function solveDeterministicFixture(fixture: string) {
  if (fixture === "linear_equation") {
    return Object.freeze({ kind: "math-solution", expression: "2x + 3 = 7", variable: "x", value: 2, verified: true });
  }
  if (fixture === "triangle_area") {
    return Object.freeze({ kind: "math-solution", expression: "A = (4 × 3) / 2", value: 6, unit: "square units", verified: true });
  }
  throw new TypeError("Unsupported deterministic Studio fixture.");
}
