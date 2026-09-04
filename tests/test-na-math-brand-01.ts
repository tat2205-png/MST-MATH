import assert from "node:assert/strict";
import {
  MST_MATH_DNA,
  PIMATH_DNA,
  MST_MATH_OUTPUT_PROFILES,
  resolveBrand,
  resolveOutputProfile,
  resolveCanonicalReference,
  resolveConsumerProfile,
  resolveIcon,
  resolveIconForOutput,
  resolveComponentIcon,
  resolveComponent,
  resolvePdfLatexAuthority,
} from "../src/config/mstMathBrandRoot.ts";
import { ExportService } from "../server/services/exportService.ts";

assert.equal(MST_MATH_DNA.standardId, "MST-MATH-DNA-V1.0");
assert.equal(MST_MATH_DNA.displayName, "MST-MATH DNA");
assert.equal(MST_MATH_DNA.codeRoot, "MST_MATH_DNA");
assert.equal(MST_MATH_DNA.architecture.product, "MST-MATH");
assert.equal(MST_MATH_DNA.canonical, true);
assert.equal(MST_MATH_DNA.singleSourceOfTruth, true);
assert.equal(PIMATH_DNA, MST_MATH_DNA, "Legacy export must alias the MST-MATH root, not create a second root");
assert.equal(MST_MATH_DNA.references.icons, "MST-MATH-DNA-SEMANTIC-ICONS-V1.1");
assert.equal(MST_MATH_OUTPUT_PROFILES.length, 17);
assert.ok(MST_MATH_OUTPUT_PROFILES.every((profile) => profile.parentBrandId === "MST-MATH-DNA-V1.0"));
assert.equal(resolveBrand().architecture.application, "Math AI Studio");
assert.equal(resolveOutputProfile("P12_APP_UI").parentBrandId, MST_MATH_DNA.standardId);
assert.equal(resolveConsumerProfile("VIDEO").profileId, "MST_MATH_VIDEO_VISUAL_CANONICAL_V2.0");
assert.equal(resolveOutputProfile("PIMATH_VIDEO_VISUAL_CANONICAL_V2.0").profileId, "MST_MATH_VIDEO_VISUAL_CANONICAL_V2.0");
assert.equal(resolveCanonicalReference("system"), "NA_MATH_SYSTEM_BASELINE_V2_6");
assert.throws(() => resolveOutputProfile("UNKNOWN"), /MST_MATH_DNA_AUTHORITATIVE_TOKEN_UNRESOLVED/);

for (const consumer of ["APP_UI", "ASSESSMENT", "VIDEO", "GEOGEBRA", "FOLD", "GAME"] as const) {
  assert.equal(resolveConsumerProfile(consumer).parentBrandId, MST_MATH_DNA.standardId);
}
assert.equal(resolvePdfLatexAuthority("P03_WORKSHEET").profile.profileId, "P03_WORKSHEET");
assert.equal(resolvePdfLatexAuthority("P05_TEST").profile.profileId, "P05_TEST");
assert.equal(resolvePdfLatexAuthority("P06_EXAM_THPTQG").profile.profileId, "P06_EXAM_THPTQG");
assert.throws(() => resolvePdfLatexAuthority(), /MST_MATH_DNA_OUTPUT_PROFILE_REQUIRED/);

const p01 = resolveOutputProfile("P01_LEARNING_MATERIAL") as any;
assert.ok(p01.canonicalReferences.includes("MST-MATH-DNA-SEMANTIC-ICONS-V1.1"));
assert.deepEqual(p01.renderTargets, ["PDF", "DOCX", "HTML", "SLIDES", "VIDEO"]);
assert.equal(p01.iconIdentityPolicy, "SAME_SEMANTIC_ROLE_SAME_MASTER_ASSET");
assert.deepEqual(resolveOutputProfile("P07_VIDEO").canonicalReferences, [
  "NA_MATH_CANONICAL_LAYOUT_V1_3",
  "NA_MATH_VIDEO_VISUAL_LANGUAGE_V1_0",
  "NA_MATH_VIDEO_GOLDEN_START_MID_END_V1",
  "MST-MATH-DNA-SEMANTIC-ICONS-V1.1",
]);

const coreIconRoles = ["LEARNING_OBJECTIVE", "CONCEPT", "DEFINITION", "FORMULA", "EXAMPLE", "NOTE", "IMPORTANT", "WARNING", "TIP", "QUESTION", "EXERCISE", "SOLUTION", "ANSWER", "GEOMETRY", "GRAPH", "TABLE", "ACTIVITY"] as const;
for (const role of coreIconRoles) {
  assert.equal(resolveIcon(role).authority, "MST-MATH-DNA-SEMANTIC-ICONS-V1.1");
  assert.match(resolveIcon(role).resource, /^assets\/mst-math-icons\/.*\.svg$/);
}
for (const role of ["QUESTION_SOURCE", "SOLUTION_REASONING", "GEOMETRY_FIGURE", "RESULT_SUCCESS"] as const) {
  assert.equal(resolveIcon(role).authority, "MST-MATH-DNA-SEMANTIC-ICONS-V1.1");
  assert.match(resolveIcon(role).resource, /^assets\/mst-math-icons\/.*\.svg$/);
}
const exampleMaster = resolveIcon("EXAMPLE").resource;
for (const target of ["PDF", "DOCX", "HTML", "SLIDES", "VIDEO"] as const) {
  const resolved = resolveIconForOutput("EXAMPLE", target);
  assert.equal(resolved.resource, exampleMaster);
  assert.equal(resolved.preserveIdentity, true);
  assert.equal(resolved.identityRule, "SAME_SEMANTIC_ROLE_SAME_MASTER_ASSET");
}
assert.equal(resolveComponentIcon("learning-objective", "PDF").role, "LEARNING_OBJECTIVE");
assert.equal(resolveComponentIcon("worked-example", "DOCX").role, "EXAMPLE");
assert.equal(resolveComponentIcon("common-mistake", "HTML").role, "WARNING");
assert.equal(resolveComponentIcon("math-formula-card", "SLIDES").role, "FORMULA");
assert.equal(resolveComponentIcon("geometry-figure-card", "VIDEO").role, "GEOMETRY");
assert.equal(resolveComponentIcon("final-answer", "VIDEO").role, "ANSWER");
assert.throws(() => resolveComponentIcon("not-a-component", "PDF"), /MST_MATH_DNA_AUTHORITATIVE_TOKEN_UNRESOLVED/);
assert.equal(resolveComponent("worked-example").authority, "NA_MATH_DESIGN_SYSTEM_V1_3");
assert.equal(resolvePdfLatexAuthority("P03_WORKSHEET").canOverrideMstMathDna, false);
assert.equal(resolvePdfLatexAuthority("P03_WORKSHEET").canOverridePiMathDna, false);

const exportTeX = new ExportService().generateStandaloneTeX(
  { domain: "Algebra", topic: "Test", grade: "10", problem: "x=1", given: [], find: [] } as never,
  { section_1_analysis: { problem_essence: "", identified_pattern: "", pitfalls_and_traps: [], core_theorems: [] }, section_2_approach: { strategy_overview: "", roadmap_steps: [], formulas_needed: [] }, section_3_detailed_steps: [], final_answer: { value: "1", summary_text: "" } } as never,
  null,
  null,
  "P03_WORKSHEET",
);
assert.match(exportTeX, /MST-MATH \/ MST-MATH-DNA-V1\.0 \/ P03_WORKSHEET/);
assert.doesNotMatch(exportTeX, /% PiMath/);

console.log("MST_MATH_DNA_ROOT_EXISTS_QA=PASS");
console.log("MST_MATH_DNA_SINGLE_SOURCE_QA=PASS");
console.log("MST_MATH_OUTPUT_PROFILE_REGISTRY_QA=PASS");
console.log("MST_MATH_SEMANTIC_ICON_SINGLE_SOURCE_QA=PASS");
console.log("PIMATH_COMPATIBILITY_ALIAS_ONLY_QA=PASS");
