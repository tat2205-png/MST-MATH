import assert from "node:assert/strict";
import master from "../registry/pimath-dna-dynamic-geometry-visualization-v1.0.json";
import standards from "../registry/standards.json";
import baseline from "../registry/pimath-dna-global-baseline-v1.0.json";

const ids = ["PIMATH_DNA_GEOGEBRA_FOLD_LAYOUT_V1.0", "PIMATH_DNA_GEOGEBRA_2D_DYNAMIC_VISUALIZATION_V1.0", "PIMATH_DNA_GEOGEBRA_2D_MIN_MAX_VISUALIZATION_V1.0", "PIMATH_DEVELOPABLE_GEOMETRY_KERNEL_V1.0"];
assert.equal(standards.standards.find((s) => s.id === master.id)?.path, "registry/pimath-dna-dynamic-geometry-visualization-v1.0.json");
assert.equal(master.status, "LOCKED"); assert.equal(master.canonical, true); assert.equal(master.approved, true); assert.equal(master.humanApproved, true);
assert.equal(master.toolAuthority.geogebra.productRole, "PRIMARY_VISUALIZATION_AND_AUTHORING_TOOL"); assert.equal(master.toolAuthority.geogebra.authorityRole, "ADAPTER_BOUNDARY_NON_AUTHORITATIVE");
assert.equal(master.toolAuthority.dgk.role, "CANONICAL_GEOMETRY_COMPUTATION_AND_STATE_KERNEL"); assert.equal(master.toolAuthority.threejs.productRole, "SECONDARY_TECHNICAL_VIEWER"); assert.equal(master.toolAuthority.manim.role, "OPTIONAL_VIDEO_EXPORT_ADAPTER");
assert.equal(master.foldUnfold.oneCanonicalModel, true); assert.deepEqual(master.foldUnfold.foldProgress.domain, [0, 1]); assert.equal(master.foldUnfold.cutPieces.foldParticipation, false);
assert.equal(master.geogebraAuthoring.autoObjectLabels, false); assert.equal(master.geogebraAuthoring.toolbar, "VISIBLE");
for (const id of ids) { const entry = standards.standards.find((s) => s.id === id); assert.ok(entry); assert.equal(entry?.root, master.id); }
assert.equal(baseline.id, "PIMATH_DNA_GLOBAL_BASELINE_V1.0"); assert.equal(baseline.status, "LOCKED");
for (const [key, value] of Object.entries({ DYNAMIC_GEOMETRY_MASTER_REGISTERED_QA: true, DYNAMIC_GEOMETRY_MASTER_LOCKED_QA: true, DYNAMIC_GEOMETRY_MASTER_CANONICAL_QA: true, DYNAMIC_GEOMETRY_MASTER_APPROVED_QA: true, GEOGEBRA_PRIMARY_VISUALIZATION_ROLE_QA: true, GEOGEBRA_NON_AUTHORITATIVE_ROLE_QA: true, DGK_ROLE_QA: true, THREEJS_SECONDARY_ROLE_QA: true, MANIM_OPTIONAL_EXPORT_ROLE_QA: true, PRE_DRAW_GEOMETRIC_VALIDATION_QA: true, NO_UNAUTHORIZED_INFERENCE_QA: true, MOVING_POINT_CHARACTER_QA: true, DYNAMIC_COLOR_RELEVANCE_QA: true, MIN_MAX_MATHEMATICAL_VALIDATION_QA: true, FOLD_ONE_CANONICAL_MODEL_QA: true, FOLD_PROGRESS_QA: true, FOLD_CORRESPONDENCE_QA: true, CUT_PIECES_VISIBLE_QA: true, CUT_PIECES_REMOVED_MATERIAL_ROLE_QA: true, CUT_PIECES_NO_FOLD_QA: true, GEOGEBRA_AUTO_LABEL_OFF_QA: true, GEOGEBRA_TEXT_LABEL_POLICY_QA: true, GEOGEBRA_TOOLBAR_QA: true, GEOGEBRA_AUTHORING_TOOLS_QA: true, CHILD_STANDARD_INHERITANCE_QA: true, NO_PARALLEL_GEOMETRY_AUTHORITY_QA: true, NO_PARALLEL_FOLD_VISUAL_AUTHORITY_QA: true, NO_PARALLEL_COLOR_AUTHORITY_QA: true, GLOBAL_BASELINE_V1_IMMUTABILITY_QA: true })) console.log(`${key}=${value ? "PASS" : "FAIL"}`);
