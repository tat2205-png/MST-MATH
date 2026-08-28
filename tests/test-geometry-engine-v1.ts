import assert from "node:assert/strict";
import { mathSceneToLuaDrawSpec } from "../server/geometry/mathIrLuaDrawAdapter.js";
import { validateGeometrySpec } from "../server/geometry/geometryValidator.js";
import {
  GEO_FIXTURES, getGeometryCapabilityMatrix, normalizeGeometryScene, renderGeometry,
  routeGeometry, selectGeometryRenderer, validateGeometryScene,
} from "../src/modules/geometry-engine/index.js";

for (const scene of [GEO_FIXTURES.triangle, GEO_FIXTURES.isoscelesTriangle, GEO_FIXTURES.circle, GEO_FIXTURES.graph, GEO_FIXTURES.pyramid, GEO_FIXTURES.perpendicularPyramid]) {
  assert.equal(validateGeometryScene(scene).status, "PASS", scene.id);
  const normalized = normalizeGeometryScene(scene);
  assert.equal(normalized.status, "PASS", scene.id);
  assert.ok(normalized.scene);
}

assert.ok(GEO_FIXTURES.isoscelesTriangle.constraints.some((constraint) => constraint.type === "equal_length" && constraint.fact.origin === "given"));
assert.ok(GEO_FIXTURES.perpendicularPyramid.constraints.some((constraint) => constraint.type === "line_perpendicular_plane" && constraint.fact.origin === "given"));

const missing = validateGeometryScene(GEO_FIXTURES.missingPoint);
assert.equal(missing.status, "FAIL");
assert.ok(missing.issues.some((issue) => issue.code === "MISSING_ENTITY_REFERENCE"));
const zero = validateGeometryScene(GEO_FIXTURES.zeroLengthSegment);
assert.equal(zero.status, "FAIL");
assert.ok(zero.issues.some((issue) => issue.code === "ZERO_LENGTH_SEGMENT"));
const mixed = validateGeometryScene(GEO_FIXTURES.mixedDimension);
assert.equal(mixed.status, "FAIL");
assert.ok(mixed.issues.some((issue) => issue.code === "MIXED_2D_3D_CONFLICT"));

const duplicate = structuredClone(GEO_FIXTURES.triangle); duplicate.entities[1].id = duplicate.entities[0].id;
assert.ok(validateGeometryScene(duplicate).issues.some((issue) => issue.code === "DUPLICATE_ENTITY_ID"));
const invalidPolygon = structuredClone(GEO_FIXTURES.triangle) as any; invalidPolygon.entities.find((entity: any) => entity.type === "triangle").vertexIds = ["point-A", "point-A", "point-C"];
assert.ok(validateGeometryScene(invalidPolygon).issues.some((issue) => issue.code === "INVALID_POLYGON"));
const invalidCircle = structuredClone(GEO_FIXTURES.circle) as any; invalidCircle.entities.find((entity: any) => entity.type === "circle").centerPointId = "segment-OA";
assert.ok(validateGeometryScene(invalidCircle).issues.some((issue) => issue.code === "INVALID_CIRCLE"));
const invalidPlane = structuredClone(GEO_FIXTURES.pyramid) as any; invalidPlane.entities.find((entity: any) => entity.type === "plane").pointIds = ["point-A", "point-B"];
assert.ok(validateGeometryScene(invalidPlane).issues.some((issue) => issue.code === "INVALID_PLANE"));
const invalidSolid = structuredClone(GEO_FIXTURES.pyramid) as any; invalidSolid.entities.find((entity: any) => entity.type === "pyramid").apexPointId = "base-ABCD";
assert.ok(validateGeometryScene(invalidSolid).issues.some((issue) => issue.code === "INVALID_SOLID"));
const unknownEntity = structuredClone(GEO_FIXTURES.triangle) as any; unknownEntity.entities[0].type = "renderer_mesh";
assert.ok(validateGeometryScene(unknownEntity).issues.some((issue) => issue.code === "UNSUPPORTED_GEOMETRY_ENTITY"));

const normalizedTriangle = normalizeGeometryScene(GEO_FIXTURES.triangle).scene!;
assert.ok(normalizedTriangle.renderCoordinates.every((coordinate) => coordinate.origin === "visual_only"));
assert.ok(normalizedTriangle.warnings.every((warning) => warning.code === "VISUAL_ONLY_LAYOUT"));
assert.equal(GEO_FIXTURES.triangle.entities.filter((entity) => entity.type === "point").every((point) => point.semanticCoordinate?.dimension === "unknown"), true);

const svgRoute = selectGeometryRenderer(normalizedTriangle, { target: "svg" });
assert.equal(svgRoute.renderer, "svg"); assert.equal(svgRoute.available, true);
const svg = renderGeometry(GEO_FIXTURES.triangle, { target: "svg" });
assert.ok(svg.output?.kind === "svg"); assert.match(svg.output.content, /^<svg/); assert.match(svg.output.content, /<polygon/);
assert.equal(renderGeometry(GEO_FIXTURES.triangle, { target: "svg" }).output && (renderGeometry(GEO_FIXTURES.triangle, { target: "svg" }).output as any).content, svg.output.content);

const tikz = renderGeometry(GEO_FIXTURES.triangle, { target: "tikz", latexNative: true });
assert.ok(tikz.output?.kind === "tikz"); assert.match(tikz.output.content, /\\begin\{tikzpicture\}/); assert.match(tikz.output.content, /\\draw/);

const animated = structuredClone(GEO_FIXTURES.triangle); animated.animations = [{ id: "animation-1", type: "appear", targetIds: ["triangle-ABC"] }];
const manim = routeGeometry(animated);
assert.equal(manim.route.renderer, "manim"); assert.equal(manim.route.available, false); assert.equal(manim.route.status, "PARTIAL");
const three = routeGeometry(GEO_FIXTURES.pyramid, { interaction: true });
assert.equal(three.route.renderer, "threejs"); assert.equal(three.route.available, false);
const geogebra = routeGeometry(GEO_FIXTURES.triangle, { dynamicGeometry: true });
assert.equal(geogebra.route.renderer, "geogebra"); assert.equal(geogebra.route.available, false);
const graphRoute = routeGeometry(GEO_FIXTURES.graph);
assert.equal(graphRoute.route.renderer, "geogebra"); assert.equal(graphRoute.route.available, false);

const unsupported = routeGeometry(GEO_FIXTURES.unsupportedRenderer, { target: "svg" });
assert.equal(unsupported.route.status, "FAIL");
assert.ok(unsupported.route.unsupported.some((issue) => issue.code === "UNSUPPORTED_RENDER_TARGET"));

const matrix = getGeometryCapabilityMatrix();
assert.equal(matrix.length, 6);
assert.equal(matrix.find((item) => item.id === "svg")?.available, true);
assert.equal(matrix.find((item) => item.id === "threejs")?.available, false);
assert.equal(matrix.find((item) => item.id === "geogebra")?.capabilities.dynamicGeometry, "yes");

const luaDraw = mathSceneToLuaDrawSpec(GEO_FIXTURES.triangle);
assert.equal(luaDraw.status, "PASS", luaDraw.errors.join(" "));
assert.equal(validateGeometrySpec(luaDraw.spec!).status, "PASS");

const unsafe = structuredClone(GEO_FIXTURES.triangle); unsafe.entities[0].id = "../../payload";
assert.ok(validateGeometryScene(unsafe).issues.some((issue) => issue.code === "UNSAFE_RENDERER_PAYLOAD"));
const nan = structuredClone(GEO_FIXTURES.triangle); (nan.entities[0] as any).semanticCoordinate = { dimension: "2d", x: Number.NaN, y: 0 };
assert.ok(validateGeometryScene(nan).issues.some((issue) => issue.code === "NAN_COORDINATE"));
const infinity = structuredClone(GEO_FIXTURES.triangle); (infinity.entities[0] as any).semanticCoordinate = { dimension: "2d", x: Number.POSITIVE_INFINITY, y: 0 };
assert.ok(validateGeometryScene(infinity).issues.some((issue) => issue.code === "INFINITE_COORDINATE"));

console.log("GEOMETRY_ENGINE_V1_TESTS=PASS");
