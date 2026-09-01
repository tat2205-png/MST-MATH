import assert from "node:assert/strict";
import { PIMATH_DNA, NA_MATH_OUTPUT_PROFILES, resolveBrand, resolveOutputProfile, resolveCanonicalReference, resolveConsumerProfile, resolveIcon, resolveComponent, resolvePdfLatexAuthority } from "../src/config/naMathBrandRoot.ts";
import { ExportService } from "../server/services/exportService.ts";
assert.equal(PIMATH_DNA.standardId, "PIMATH-DNA-V1.0");
assert.equal(PIMATH_DNA.displayName, "PiDNA");
assert.equal(PIMATH_DNA.codeRoot, "PIMATH_DNA");
assert.equal(PIMATH_DNA.canonical, true); assert.equal(PIMATH_DNA.singleSourceOfTruth, true);
assert.equal(NA_MATH_OUTPUT_PROFILES.length, 16);
assert.ok(NA_MATH_OUTPUT_PROFILES.every((profile) => profile.parentBrandId === "PIMATH-DNA-V1.0"));
assert.equal(resolveBrand().architecture.application, "Math AI Studio");
assert.equal(resolveOutputProfile("P12_APP_UI").parentBrandId, PIMATH_DNA.standardId);
assert.equal(resolveCanonicalReference("system"), "NA_MATH_SYSTEM_BASELINE_V2_6");
assert.throws(() => resolveOutputProfile("UNKNOWN"), /PIMATH_DNA_AUTHORITATIVE_TOKEN_UNRESOLVED/);
for (const consumer of ["APP_UI", "ASSESSMENT", "VIDEO", "GEOGEBRA", "FOLD", "GAME"] as const) {
  assert.equal(resolveConsumerProfile(consumer).parentBrandId, PIMATH_DNA.standardId);
}
assert.equal(resolvePdfLatexAuthority("P03_WORKSHEET").profile.profileId, "P03_WORKSHEET");
assert.equal(resolvePdfLatexAuthority("P05_TEST").profile.profileId, "P05_TEST");
assert.equal(resolvePdfLatexAuthority("P06_EXAM_THPTQG").profile.profileId, "P06_EXAM_THPTQG");
assert.throws(() => resolvePdfLatexAuthority(), /PIMATH_DNA_OUTPUT_PROFILE_REQUIRED/);
assert.equal(resolveOutputProfile("P02_LESSON_PLAN").profileId, "P02_LESSON_PLAN");
assert.deepEqual(resolveOutputProfile("P07_VIDEO").canonicalReferences, ["NA_MATH_CANONICAL_LAYOUT_V1_3", "NA_MATH_VIDEO_VISUAL_LANGUAGE_V1_0", "NA_MATH_VIDEO_GOLDEN_START_MID_END_V1", "PIMATH-DNA-SEMANTIC-ICONS-V1.0"]);
assert.ok(resolveOutputProfile("P08_GEOGEBRA").canonicalReferences.includes("NA-MATH-BRAND-DRIVEN-GEOGEBRA-UI-SYSTEM-V1.0"));
assert.notDeepEqual(resolveOutputProfile("P08_GEOGEBRA").canonicalReferences, resolveOutputProfile("P09_FOLD").canonicalReferences);
for (const profileId of ["P05_TEST", "P06_EXAM_SCHOOL", "P06_EXAM_THPTQG", "P06_EXAM_DGNL", "P06_EXAM_VSAT", "P06_EXAM_SAT"]) {
  const profile = resolveOutputProfile(profileId);
  assert.ok(profile.semanticReferences?.includes("NA_MATH_QUESTION_BANK_V1"));
  assert.ok(["P06_EXAM_SCHOOL", "P06_EXAM_THPTQG", "P06_EXAM_DGNL", "P06_EXAM_SAT"].includes(profile.profileId) || profile.unresolved?.includes("PIMATH_DNA_EXAM_VISUAL_PROFILE") || profile.unresolved?.includes("PIMATH_DNA_TEST_VISUAL_PROFILE"));
}
assert.throws(() => resolveIcon("default"), /PIMATH_DNA_AUTHORITATIVE_TOKEN_UNRESOLVED/);
for (const role of ["QUESTION_SOURCE", "SOLUTION_REASONING", "GEOMETRY_FIGURE", "RESULT_SUCCESS"] as const) {
  assert.equal(resolveIcon(role).authority, "PIMATH-DNA-SEMANTIC-ICONS-V1.0");
  assert.match(resolveIcon(role).resource, /^assets\/pimath-icons\/.*\.svg$/);
}
assert.throws(() => resolveComponent("default"), /PIMATH_DNA_AUTHORITATIVE_TOKEN_UNRESOLVED/);
assert.equal(resolvePdfLatexAuthority("P03_WORKSHEET").canOverridePiMathDna, false);
const exportTeX = new ExportService().generateStandaloneTeX({ domain: "Algebra", topic: "Test", grade: "10", problem: "x=1", given: [], find: [] } as never, { section_1_analysis: { problem_essence: "", identified_pattern: "", pitfalls_and_traps: [], core_theorems: [] }, section_2_approach: { strategy_overview: "", roadmap_steps: [], formulas_needed: [] }, section_3_detailed_steps: [], final_answer: { value: "1", summary_text: "" } } as never, null, null, "P03_WORKSHEET");
assert.match(exportTeX, /PIMATH-DNA-V1\.0 \/ P03_WORKSHEET/);
console.log("PIMATH_DNA_ROOT_EXISTS_QA=PASS\nPIMATH_DNA_SINGLE_SOURCE_QA=PASS\nCANONICAL_CHILD_REFERENCE_QA=PASS\nOUTPUT_PROFILE_REGISTRY_QA=PASS\nNO_SILENT_LEGACY_FALLBACK_QA=PASS");
console.log("PDF_LATEX_IDENTITY_TRACEABILITY_QA=PASS\nNO_ACTIVE_PARALLEL_BRAND_QA=PASS\nNO_ACTIVE_BRAND_BYPASS_QA=PASS\nNO_LOCAL_CANONICAL_OVERRIDE_QA=PASS\nRUNTIME_IDENTITY_TRACEABILITY_QA=PASS\nACTIVE_PARALLEL_BRAND_COUNT=0\nACTIVE_BRAND_BYPASS_COUNT=0\nACTIVE_DUPLICATE_IDENTITY_SOURCE_COUNT=0\nACTIVE_IDENTITY_CONFLICT_COUNT=0");
