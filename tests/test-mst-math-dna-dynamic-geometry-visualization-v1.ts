import assert from "node:assert/strict";
import master from "../registry/mst-math-dna-dynamic-geometry-visualization-v1.0.json";
import standards from "../registry/standards.json";
import baseline from "../registry/mst-math-dna-global-baseline-v1.0.json";

const ids = [
  "MST_MATH_DNA_GEOGEBRA_FOLD_LAYOUT_V1.0",
  "MST_MATH_DNA_GEOGEBRA_2D_DYNAMIC_VISUALIZATION_V1.0",
  "MST_MATH_DNA_GEOGEBRA_2D_MIN_MAX_VISUALIZATION_V1.0",
  "MST_MATH_DEVELOPABLE_GEOMETRY_KERNEL_V1.0",
];
assert.equal(standards.standards.find((s) => s.id === master.id)?.path, "registry/mst-math-dna-dynamic-geometry-visualization-v1.0.json");
assert.equal(master.status, "LOCKED");
assert.equal(master.canonical, true);
assert.equal(master.approved, true);
assert.equal(master.humanApproved, true);
assert.equal(master.owner, "MST_MATH_DNA");
assert.equal(master.root, "MST-MATH-DNA-V1.0");
assert.equal(master.toolAuthority.geogebra.productRole, "PRIMARY_VISUALIZATION_AND_AUTHORING_TOOL");
assert.equal(master.toolAuthority.geogebra.authorityRole, "ADAPTER_BOUNDARY_NON_AUTHORITATIVE");
assert.equal(master.toolAuthority.dgk.role, "CANONICAL_GEOMETRY_COMPUTATION_AND_STATE_KERNEL");
assert.equal(master.foldUnfold.oneCanonicalModel, true);
assert.deepEqual(master.foldUnfold.foldProgress.domain, [0, 1]);
for (const id of ids) {
  const entry = standards.standards.find((s) => s.id === id);
  assert.ok(entry);
  assert.equal(entry?.root, master.id);
}
assert.equal(baseline.id, "MST_MATH_DNA_GLOBAL_BASELINE_V1.0");
console.log("MST_MATH_DYNAMIC_GEOMETRY_AUTHORITY_QA=PASS");
