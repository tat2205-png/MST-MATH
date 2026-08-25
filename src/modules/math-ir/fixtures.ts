import { createConstraint, createMathDocument, createMathProblem, createMathScene, createPlane, createPoint, createSegment } from "./factories.js";
import type { MathDocument } from "./types.js";

const given = { origin: "given" as const, sourceId: "source-statement", confidence: 1 };

export const triangleFixture: MathDocument = createMathDocument({
  id: "document-triangle-abc",
  title: "Isosceles triangle ABC",
  sections: [{ id: "section-triangle", blocks: [{ id: "problem-ref-triangle", type: "problem_reference", problemId: "problem-triangle" }] }],
  problems: [createMathProblem({
    id: "problem-triangle",
    statement: "Triangle ABC with AB = AC.",
    problemType: "geometry_2d",
    entities: [
      createPoint("point-A", "A"), createPoint("point-B", "B"), createPoint("point-C", "C"),
      createSegment("segment-AB", "point-A", "point-B", "AB"),
      createSegment("segment-AC", "point-A", "point-C", "AC"),
      createSegment("segment-BC", "point-B", "point-C", "BC"),
      { id: "triangle-ABC", type: "triangle", label: "ABC", vertexIds: ["point-A", "point-B", "point-C"], sideIds: ["segment-AB", "segment-BC", "segment-AC"] },
    ],
    constraints: [createConstraint("constraint-equal-ab-ac", "equal_length", ["segment-AB", "segment-AC"], given)],
    givens: ["constraint-equal-ab-ac"], targets: [], sceneIds: ["scene-triangle"],
    sourceEvidence: [{ id: "source-statement", origin: "given", sourceType: "text", excerpt: "AB = AC", confidence: 1 }],
  })],
  scenes: [createMathScene({
    id: "scene-triangle", name: "Triangle ABC", dimension: "2d",
    entities: [
      createPoint("point-A", "A"), createPoint("point-B", "B"), createPoint("point-C", "C"),
      createSegment("segment-AB", "point-A", "point-B"), createSegment("segment-AC", "point-A", "point-C"), createSegment("segment-BC", "point-B", "point-C"),
      { id: "triangle-ABC", type: "triangle", vertexIds: ["point-A", "point-B", "point-C"], sideIds: ["segment-AB", "segment-BC", "segment-AC"] },
    ], constraints: [createConstraint("constraint-equal-ab-ac", "equal_length", ["segment-AB", "segment-AC"], given)],
  })],
});

export const circleFixture: MathDocument = createMathDocument({
  id: "document-circle-o", title: "Circle O",
  problems: [createMathProblem({
    id: "problem-circle", statement: "A lies on the circle centered at O; OA is a radius.", problemType: "geometry_2d",
    expressions: [{ id: "expression-radius", raw: "r", latex: "r", normalized: "r", variables: ["r"] }],
    entities: [createPoint("point-O", "O"), createPoint("point-A", "A"), createSegment("segment-OA", "point-O", "point-A", "OA"), { id: "circle-O", type: "circle", centerPointId: "point-O", radiusExpressionId: "expression-radius" }],
    constraints: [
      createConstraint("constraint-a-on-circle", "point_on_circle", ["point-A", "circle-O"], given),
      createConstraint("constraint-oa-radius", "radius", ["segment-OA", "circle-O"], given, "expression-radius"),
    ], givens: ["constraint-a-on-circle", "constraint-oa-radius"], targets: [], sceneIds: ["scene-circle"],
  })],
  scenes: [createMathScene({
    id: "scene-circle", name: "Circle centered at O", dimension: "2d",
    expressions: [{ id: "expression-radius", latex: "r", normalized: "r" }],
    entities: [createPoint("point-O", "O"), createPoint("point-A", "A"), createSegment("segment-OA", "point-O", "point-A"), { id: "circle-O", type: "circle", centerPointId: "point-O", radiusExpressionId: "expression-radius" }],
    constraints: [createConstraint("constraint-a-on-circle", "point_on_circle", ["point-A", "circle-O"], given), createConstraint("constraint-oa-radius", "radius", ["segment-OA", "circle-O"], given, "expression-radius")],
  })], expressions: [], sections: [],
});

export const graphFixture: MathDocument = createMathDocument({
  id: "document-graph-x2", title: "Graph y = x²",
  expressions: [{ id: "expression-y-x2", raw: "y = x^2", latex: "y=x^2", normalized: "y=x^2", variables: ["x", "y"] }],
  problems: [createMathProblem({
    id: "problem-graph", statement: "Plot y = x².", problemType: "function_graph",
    expressions: [{ id: "expression-y-x2", raw: "y = x^2", latex: "y=x^2", normalized: "y=x^2", variables: ["x", "y"] }],
    entities: [{ id: "axes-oxy", type: "coordinate_axes_2d", xLabel: "x", yLabel: "y" }, { id: "graph-y-x2", type: "function_graph", expressionId: "expression-y-x2", axesId: "axes-oxy" }],
    givens: ["expression-y-x2"], targets: ["graph-y-x2"], sceneIds: ["scene-graph"],
  })],
  scenes: [createMathScene({
    id: "scene-graph", name: "Oxy graph", dimension: "2d",
    expressions: [{ id: "expression-y-x2", raw: "y = x^2", latex: "y=x^2", normalized: "y=x^2", variables: ["x", "y"] }],
    entities: [{ id: "axes-oxy", type: "coordinate_axes_2d", xLabel: "x", yLabel: "y" }, { id: "graph-y-x2", type: "function_graph", expressionId: "expression-y-x2", axesId: "axes-oxy" }],
    camera: { dimension: "2d", viewport: { minX: -5, maxX: 5, minY: -1, maxY: 10 } },
  })], sections: [],
});

const pyramidEntities = [
  createPoint("point-S", "S"), createPoint("point-A", "A"), createPoint("point-B", "B"), createPoint("point-C", "C"), createPoint("point-D", "D"),
  createSegment("segment-SA", "point-S", "point-A", "SA"),
  { id: "base-ABCD", type: "quadrilateral" as const, label: "ABCD", vertexIds: ["point-A", "point-B", "point-C", "point-D"] as [string, string, string, string] },
  createPlane("plane-ABCD", ["point-A", "point-B", "point-C", "point-D"], "(ABCD)"),
  { id: "pyramid-S-ABCD", type: "pyramid" as const, label: "S.ABCD", apexPointId: "point-S", baseFaceId: "base-ABCD" },
];

export const pyramidFixture: MathDocument = createMathDocument({
  id: "document-pyramid", title: "Pyramid S.ABCD",
  problems: [createMathProblem({
    id: "problem-pyramid", statement: "Pyramid S.ABCD with SA perpendicular to plane (ABCD).", problemType: "geometry_3d",
    entities: pyramidEntities, constraints: [createConstraint("constraint-sa-perpendicular-base", "line_perpendicular_plane", ["segment-SA", "plane-ABCD"], given)],
    givens: ["constraint-sa-perpendicular-base"], targets: [], sceneIds: ["scene-pyramid"],
  })],
  scenes: [createMathScene({
    id: "scene-pyramid", name: "Pyramid S.ABCD", dimension: "3d", entities: pyramidEntities,
    constraints: [createConstraint("constraint-sa-perpendicular-base", "line_perpendicular_plane", ["segment-SA", "plane-ABCD"], given)],
    camera: { dimension: "3d", position: [6, 5, 4], target: [0, 0, 0], up: [0, 0, 1], projection: "perspective" },
  })], sections: [], expressions: [],
});

export const malformedFixture: unknown = {
  schemaVersion: "math-ir/v1", id: "document-malformed", sections: [], problems: [], expressions: [],
  scenes: [{
    id: "scene-malformed", name: "Malformed", dimension: "2d", expressions: [], constraints: [
      { id: "constraint-missing", type: "parallel", entityIds: ["segment-missing", "segment-bad"], fact: { origin: "unknown" } },
    ],
    entities: [
      { id: "point-A", type: "point" }, { id: "point-A", type: "point" },
      { id: "segment-bad", type: "segment", startPointId: "point-A", endPointId: "point-missing" },
    ],
  }],
};
