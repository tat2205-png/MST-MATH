import assert from "node:assert/strict";
import { patchSafetyValidator } from "../server/services/patchSafetyValidator.js";
import { repairSnapshotManager } from "../server/services/repairSnapshotManager.js";

const baselineFiles = {
  "main.py": `from manim import *

formula = MathTex(r"x^2-5x+6=0")
formula.move_to(title.get_center())
`,
};
const mathContext = ["x^2-5x+6=0", "x=2", "x=3"];
const protectedFingerprints = repairSnapshotManager.generateFingerprints({
  problemText: "Giải phương trình bậc hai",
  formulas: mathContext,
  sourceFiles: baselineFiles,
});

assert.deepEqual(protectedFingerprints.formulaFingerprints, ["x^2-5x+6=0"]);

const layoutPatch = {
  file: "main.py",
  operation: "replace_range" as const,
  oldText: "formula.move_to(title.get_center())",
  newText: "formula.next_to(title, DOWN, buff=0.5)",
  category: "LAYOUT_ERROR" as const,
};
const layoutValidation = patchSafetyValidator.validatePatch({
  changes: [layoutPatch],
  projectFiles: baselineFiles,
  protectedFingerprints,
});
assert.equal(layoutValidation.valid, true);
const layoutFiles = repairSnapshotManager.applyPatch(baselineFiles, [layoutPatch]);
assert.equal(layoutFiles.success, true);
assert.equal(
  repairSnapshotManager.verifyInvariantsPreserved(layoutFiles.updatedFiles, protectedFingerprints).preserved,
  true
);

const mutationPatch = {
  ...layoutPatch,
  oldText: 'formula = MathTex(r"x^2-5x+6=0")',
  newText: 'formula = MathTex(r"x^2-5x+7=0")',
};
const mutationValidation = patchSafetyValidator.validatePatch({
  changes: [mutationPatch],
  projectFiles: baselineFiles,
  protectedFingerprints,
});
assert.equal(mutationValidation.valid, false);
assert.match(mutationValidation.errors.join("\n"), /mutates protected mathematical formula/);

const deletionPatch = {
  ...mutationPatch,
  newText: "",
};
const deletionValidation = patchSafetyValidator.validatePatch({
  changes: [deletionPatch],
  projectFiles: baselineFiles,
  protectedFingerprints,
});
assert.equal(deletionValidation.valid, false);
assert.match(deletionValidation.errors.join("\n"), /mutates protected mathematical formula/);

console.log("STEP 8B source-aware invariant regression tests passed");
