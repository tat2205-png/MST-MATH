import { circleFixture, graphFixture, pyramidFixture, triangleFixture, type MathScene } from "../math-ir/index.js";

export const GEO_FIXTURES = {
  triangle: structuredClone(triangleFixture.scenes[0]),
  isoscelesTriangle: structuredClone(triangleFixture.scenes[0]),
  circle: structuredClone(circleFixture.scenes[0]),
  graph: structuredClone(graphFixture.scenes[0]),
  pyramid: structuredClone(pyramidFixture.scenes[0]),
  perpendicularPyramid: structuredClone(pyramidFixture.scenes[0]),
  missingPoint: {
    id: "geo-missing-point", name: "Missing point", dimension: "2d", constraints: [],
    entities: [{ id: "point-A", type: "point" }, { id: "segment-AB", type: "segment", startPointId: "point-A", endPointId: "point-B" }],
  } as MathScene,
  zeroLengthSegment: {
    id: "geo-zero-length", name: "Zero length", dimension: "2d", constraints: [],
    entities: [
      { id: "point-A", type: "point", semanticCoordinate: { dimension: "2d", x: 0, y: 0 } },
      { id: "point-B", type: "point", semanticCoordinate: { dimension: "2d", x: 0, y: 0 } },
      { id: "segment-AB", type: "segment", startPointId: "point-A", endPointId: "point-B" },
    ],
  } as MathScene,
  mixedDimension: {
    id: "geo-mixed", name: "Mixed dimensions", dimension: "2d", constraints: [],
    entities: [{ id: "point-A", type: "point", semanticCoordinate: { dimension: "3d", x: 0, y: 0, z: 1 } }],
  } as MathScene,
  unsupportedRenderer: structuredClone(pyramidFixture.scenes[0]),
};
