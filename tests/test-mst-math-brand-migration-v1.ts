import assert from "node:assert/strict";
import brandRoot from "../registry/brand-root.json";
import outputProfiles from "../registry/output-profiles.json";
import standards from "../registry/standards.json";
import {
  MST_MATH_DNA,
  PIMATH_DNA,
  resolveBrand,
  resolveExamRuntimeAuthority,
  resolveGeoGebraCanonicalBinding,
  resolvePdfLatexAuthority,
} from "../src/config/naMathBrandRoot.ts";
import { resolveRendererAdapterValue } from "../src/config/mstMathRendererProvenance.ts";
import { ExportService } from "../server/services/exportService.ts";

assert.equal(brandRoot.standardId, "MST-MATH-DNA-V1.0");
assert.equal(brandRoot.displayName, "MST-MATH DNA");
assert.equal(brandRoot.codeRoot, "MST_MATH_DNA");
assert.equal(brandRoot.architecture.product, "MST-MATH");
assert.equal(resolveBrand(), MST_MATH_DNA);
assert.equal(PIMATH_DNA, MST_MATH_DNA, "Legacy PiMath code export must be a compatibility alias, not a parallel authority");

const legacyRootAlias = brandRoot.legacyAliases.find((entry) => entry.id === "PIMATH-DNA-V1.0");
assert.equal(legacyRootAlias?.classification, "COMPATIBILITY_ALIAS");
assert.equal(legacyRootAlias?.aliasOf, "MST-MATH-DNA-V1.0");
assert.equal(legacyRootAlias?.authority, false);

assert.equal(outputProfiles.parentBrandId, "MST-MATH-DNA-V1.0");
for (const profileId of ["P06_EXAM_SCHOOL", "P06_EXAM_THPTQG", "P06_EXAM_DGNL", "P06_EXAM_VSAT", "P06_EXAM_SAT"] as const) {
  const profile = outputProfiles.profiles.find((entry) => entry.profileId === profileId);
  assert.equal(profile?.inheritedFrom, "MST-MATH-DNA-V1.0");
}
const legacyVideoProfile = outputProfiles.profiles.find((entry) => entry.profileId === "PIMATH_VIDEO_VISUAL_CANONICAL_V2.0");
assert.equal(legacyVideoProfile?.inheritedFrom, "PIMATH-DNA-V1.0");
assert.equal(legacyVideoProfile?.resolvedInheritedFrom, "MST-MATH-DNA-V1.0");

const mstRoot = standards.standards.find((entry) => entry.id === "MST-MATH-DNA-V1.0");
const piRoot = standards.standards.find((entry) => entry.id === "PIMATH-DNA-V1.0");
assert.equal(mstRoot?.status, "LOCKED_CANONICAL_GLOBAL");
assert.equal(piRoot?.status, "COMPATIBILITY_ALIAS");
assert.equal(piRoot?.aliasOf, "MST-MATH-DNA-V1.0");

for (const exam of ["THPTQG", "DGNL", "SAT", "VSAT"] as const) {
  const runtime = resolveExamRuntimeAuthority(exam);
  assert.equal(runtime.authority, "MST-MATH-DNA-V1.0");
  assert.equal(runtime.profile.parentBrandId, "MST-MATH-DNA-V1.0");
  assert.equal(runtime.canOverrideMstMathDna, false);
}

const geogebra = resolveGeoGebraCanonicalBinding();
assert.equal(geogebra.authoritySource, "MST_MATH_DNA");
assert.equal(geogebra.provenance.root, "MST-MATH-DNA-V1.0");
assert.equal(resolveRendererAdapterValue("x", "test").upstream, "MST-MATH-DNA-V1.0");
assert.equal(resolvePdfLatexAuthority("P03_WORKSHEET").brand.standardId, "MST-MATH-DNA-V1.0");

const tex = new ExportService().generateStandaloneTeX(
  { domain: "Algebra", topic: "Brand migration", grade: "10", problem: "x=1", given: [], find: [] } as never,
  {
    section_1_analysis: { problem_essence: "", identified_pattern: "", pitfalls_and_traps: [], core_theorems: [] },
    section_2_approach: { strategy_overview: "", roadmap_steps: [], formulas_needed: [] },
    section_3_detailed_steps: [],
    final_answer: { value: "1", summary_text: "" },
  } as never,
  null,
  null,
  "P03_WORKSHEET",
);
assert.match(tex, /% MST-MATH \/ MST-MATH-DNA-V1\.0 \/ P03_WORKSHEET/);
assert.doesNotMatch(tex, /% PiMath \/ MST-MATH-DNA-V1\.0/);

console.log("MST_MATH_CANONICAL_ROOT_QA=PASS");
console.log("MST_MATH_OUTPUT_PROFILE_PARENT_QA=PASS");
console.log("MST_MATH_ACTIVE_PROFILE_LINEAGE_QA=PASS");
console.log("PIMATH_LEGACY_VIDEO_LINEAGE_COMPATIBILITY_QA=PASS");
console.log("MST_MATH_RUNTIME_AUTHORITY_QA=PASS");
console.log("PIMATH_COMPATIBILITY_ALIAS_NOT_AUTHORITY_QA=PASS");
console.log("MST_MATH_GENERATED_OUTPUT_IDENTITY_QA=PASS");
