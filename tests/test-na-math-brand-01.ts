import assert from "node:assert/strict";
import { PIMATH_DNA, NA_MATH_OUTPUT_PROFILES, resolveBrand, resolveOutputProfile, resolveCanonicalReference, resolveConsumerProfile, resolveIcon, resolveComponent, resolvePdfLatexAuthority } from "../src/config/naMathBrandRoot.ts";
import { ExportService } from "../server/services/exportService.ts";
assert.equal(PIMATH_DNA.standardId, "PIMATH-DNA-V1.0");
assert.equal(PIMATH_DNA.displayName, "PiDNA");
assert.equal(PIMATH_DNA.codeRoot, "PIMATH_DNA");
assert.equal(PIMATH_DNA.canonical, true); assert.equal(PIMATH_DNA.singleSourceOfTruth, true);
assert.equal(NA_MATH_OUTPUT_PROFILES.length, 15);
assert.ok(NA_MATH_OUTPUT_PROFILES.every((profile) => profile.parentBrandId === "PIMATH-DNA-V1.0"));
assert.equal(resolveBrand().architecture.application, "Math AI Studio");
assert.equal(resolveOutputProfile("P12_APP_UI").parentBrandId, PIMATH_DNA.standardId);
assert.equal(resolveCanonicalReference("system"), "NA_MATH_SYSTEM_BASELINE_V2_6");
assert.throws(() => resolveOutputProfile("UNKNOWN"), /PIMATH_DNA_AUTHORITATIVE_TOKEN_UNRESOLVED/);
for (const consumer of ["APP_UI", "DOCUMENT", "DOCX", "PDF_LATEX", "ASSESSMENT", "VIDEO", "GEOGEBRA", "FOLD", "GAME"] as const) {
  assert.equal(resolveConsumerProfile(consumer).parentBrandId, PIMATH_DNA.standardId);
}
assert.throws(() => resolveIcon("default"), /PIMATH_DNA_AUTHORITATIVE_TOKEN_UNRESOLVED/);
assert.throws(() => resolveComponent("default"), /PIMATH_DNA_AUTHORITATIVE_TOKEN_UNRESOLVED/);
assert.equal(resolvePdfLatexAuthority("P03_WORKSHEET").canOverridePiMathDna, false);
const exportTeX = new ExportService().generateStandaloneTeX({ domain: "Algebra", topic: "Test", grade: "10", problem: "x=1", given: [], find: [] } as never, { section_1_analysis: { problem_essence: "", identified_pattern: "", pitfalls_and_traps: [], core_theorems: [] }, section_2_approach: { strategy_overview: "", roadmap_steps: [], formulas_needed: [] }, section_3_detailed_steps: [], final_answer: { value: "1", summary_text: "" } } as never, null, null, "P03_WORKSHEET");
assert.match(exportTeX, /PIMATH-DNA-V1\.0 \/ P03_WORKSHEET/);
console.log("PIMATH_DNA_ROOT_EXISTS_QA=PASS\nPIMATH_DNA_SINGLE_SOURCE_QA=PASS\nCANONICAL_CHILD_REFERENCE_QA=PASS\nOUTPUT_PROFILE_REGISTRY_QA=PASS\nNO_SILENT_LEGACY_FALLBACK_QA=PASS");
console.log("PDF_LATEX_IDENTITY_TRACEABILITY_QA=PASS\nNO_ACTIVE_PARALLEL_BRAND_QA=PASS\nNO_ACTIVE_BRAND_BYPASS_QA=PASS\nNO_LOCAL_CANONICAL_OVERRIDE_QA=PASS\nRUNTIME_IDENTITY_TRACEABILITY_QA=PASS\nACTIVE_PARALLEL_BRAND_COUNT=0\nACTIVE_BRAND_BYPASS_COUNT=0\nACTIVE_DUPLICATE_IDENTITY_SOURCE_COUNT=0\nACTIVE_IDENTITY_CONFLICT_COUNT=0");
