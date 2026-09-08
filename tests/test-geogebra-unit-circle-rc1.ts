import assert from "node:assert/strict";
import { unzipSync } from "fflate";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildUnitCircleConstruction, exportUnitCircleGgb, reopenUnitCircleGgb, unitCircleCommands, validateUnitCircleConstruction } from "../src/modules/geogebra/unit-circle.js";

const reviewArtifactPath = resolve("render_output/geogebra-v1/GEO_GOLDEN_01_UNIT_CIRCLE.ggb");

for (const [angle, unit] of [[45, "DEG"], [-315, "DEG"], [Math.PI * 2 + Math.PI / 2, "RAD"], [Math.PI / 2, "RAD"]] as const) {
  const c = buildUnitCircleConstruction(angle, unit, { width: 800, height: 600 });
  assert.ok(Math.abs(c.point.x * c.point.x + c.point.y * c.point.y - 1) < 1e-12);
  assert.ok(unitCircleCommands(c).some((command) => command.includes("Text")));
  assert.equal(validateUnitCircleConstruction(c).valid, true);
  if (unit === "RAD") assert.match(c.labelLatex, /\\/);
  assert.deepEqual(reopenUnitCircleGgb(exportUnitCircleGgb(c)), c);
}
for (const [angle, expected] of [[0, [1, 0]], [45, [Math.SQRT1_2, Math.SQRT1_2]], [90, [0, 1]], [180, [-1, 0]], [270, [0, -1]], [360, [1, 0]]] as const) {
  const c = buildUnitCircleConstruction(angle, "DEG");
  assert.ok(Math.abs(c.point.x - expected[0]) < 1e-12);
  assert.ok(Math.abs(c.point.y - expected[1]) < 1e-12);
}
const golden = buildUnitCircleConstruction(45, "DEG", { width: 800, height: 600 });
const goldenBytes = exportUnitCircleGgb(golden);
const goldenXml = new TextDecoder().decode(unzipSync(goldenBytes)["geogebra.xml"]);
assert.doesNotMatch(goldenXml, /<command name="Point"><input[^>]*a0="\(0, 0\)"/);
assert.doesNotMatch(goldenXml, /<command name="Numeric"><input[^>]*a0="[^"]+"/);
assert.match(goldenXml, /<element type="point" label="O"[\s\S]*?<coords x="0" y="0" z="1"\/>/);
assert.match(goldenXml, /<element type="point" label="M"[\s\S]*?<coords x="1" y="0" z="1"\/>/);
assert.match(goldenXml, /<element type="numeric" label="alpha"[\s\S]*?<value val="[^"]+"\/>/);
assert.match(goldenXml, /<element type="numeric" label="alpha"[\s\S]*?<slider min="0" max="6\.283185307179586" step="0\.01" absoluteScreenLocation="true"/);
assert.match(goldenXml, /<command name="Rotate"><input a0="M" a1="alpha" a2="O"\/><output a0="N"\/>/);
assert.match(goldenXml, /<command name="Ray"><input a0="O" a1="N"\/><output a0="terminalRay"\/>/);
assert.match(goldenXml, /<command name="CircularArc"><input a0="O" a1="M" a2="N"\/><output a0="angleArc"\/>/);
assert.match(goldenXml, /<command name="Vector"><input a0="arrowTail" a1="arrowHead"\/><output a0="directionArrow"\/>/);
assert.match(goldenXml, /<element type="point" label="arrowTail"><show object="false" label="false"\/>/);
assert.match(goldenXml, /<element type="point" label="arrowHead"><show object="false" label="false"\/>/);
assert.match(goldenXml, /<element type="vector" label="directionArrow"><show object="true" label="false"\/>/);
assert.doesNotMatch(goldenXml, /rotationArrow/);
assert.doesNotMatch(goldenXml, /alphaInput/);
assert.doesNotMatch(goldenXml, /resetButton/);
assert.doesNotMatch(goldenXml, /label="P"/);
assert.doesNotMatch(goldenXml, /<command name="Point"><input[^>]*a0="\([^)]*,[^)]*\)"/);
assert.deepEqual(reopenUnitCircleGgb(goldenBytes), golden);
mkdirSync(resolve("render_output/geogebra-v1"), { recursive: true });
writeFileSync(reviewArtifactPath, goldenBytes);
assert.equal(existsSync(reviewArtifactPath), true);
assert.ok(statSync(reviewArtifactPath).size > 0);
assert.deepEqual(reopenUnitCircleGgb(new Uint8Array(readFileSync(reviewArtifactPath))), golden);
assert.equal(buildUnitCircleConstruction(90, "DEG").labelPosition, "TOP");
assert.equal(buildUnitCircleConstruction(180, "DEG").labelPosition, "LEFT");
assert.equal(buildUnitCircleConstruction(270, "DEG").labelPosition, "BOTTOM");
assert.throws(() => buildUnitCircleConstruction(Number.NaN, "DEG"), /UNIT_CIRCLE_INVALID_INPUT/);
console.log("GEOGEBRA_UNIT_CIRCLE_GEOMETRY_QA=PASS");
console.log("GEOGEBRA_ANGLE_NORMALIZATION_QA=PASS");
console.log("GEOGEBRA_LATEX_LABEL_QA=PASS");
console.log("GEOGEBRA_EXPORT_REOPEN_QA=PASS");
console.log("GEOGEBRA_RESIZE_LABEL_POLICY_QA=PASS");
console.log("GEOGEBRA_UNIT_CIRCLE_DEPENDENCY_INTERACTION_QA=PASS");
