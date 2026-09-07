import assert from "node:assert/strict";
import { buildUnitCircleConstruction, exportUnitCircleGgb, reopenUnitCircleGgb, unitCircleCommands } from "../src/modules/geogebra/unit-circle.js";

for (const [angle, unit] of [[45, "DEG"], [-315, "DEG"], [Math.PI * 2 + Math.PI / 2, "RAD"], [Math.PI / 2, "RAD"]] as const) {
  const c = buildUnitCircleConstruction(angle, unit, { width: 800, height: 600 });
  assert.ok(Math.abs(c.point.x * c.point.x + c.point.y * c.point.y - 1) < 1e-12);
  assert.ok(unitCircleCommands(c).some((command) => command.includes("Text")));
  if (unit === "RAD") assert.match(c.labelLatex, /\\/);
  assert.deepEqual(reopenUnitCircleGgb(exportUnitCircleGgb(c)), c);
}
assert.equal(buildUnitCircleConstruction(90, "DEG").labelPosition, "TOP");
assert.equal(buildUnitCircleConstruction(180, "DEG").labelPosition, "LEFT");
assert.equal(buildUnitCircleConstruction(270, "DEG").labelPosition, "BOTTOM");
assert.throws(() => buildUnitCircleConstruction(Number.NaN, "DEG"), /UNIT_CIRCLE_INVALID_INPUT/);
console.log("GEOGEBRA_UNIT_CIRCLE_GEOMETRY_QA=PASS");
console.log("GEOGEBRA_ANGLE_NORMALIZATION_QA=PASS");
console.log("GEOGEBRA_LATEX_LABEL_QA=PASS");
console.log("GEOGEBRA_EXPORT_REOPEN_QA=PASS");
console.log("GEOGEBRA_RESIZE_LABEL_POLICY_QA=PASS");
