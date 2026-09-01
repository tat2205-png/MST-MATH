import assert from "node:assert/strict";
import registry from "../registry/output-profiles.json";
import { resolveExamRuntimeAuthority, resolveMathNotationAuthority, resolveSemanticGeometryAuthority } from "../src/config/naMathBrandRoot.ts";
import { NA_MATH_STANDARD_V2_6 } from "../src/config/naMathStandardV26.ts";

const expected = { THPTQG: "P06_EXAM_THPTQG", DGNL: "P06_EXAM_DGNL", SAT: "P06_EXAM_SAT", VSAT: "P06_EXAM_VSAT" } as const;
for (const [exam, profileId] of Object.entries(expected) as Array<[keyof typeof expected, (typeof expected)[keyof typeof expected]]>) {
  const resolved = resolveExamRuntimeAuthority(exam);
  assert.equal(resolved.profile.profileId, profileId);
  assert.equal(resolved.profile.parentBrandId, "PIMATH-DNA-V1.0");
  assert.equal(resolved.authority, "PIMATH-DNA-V1.0");
  assert.equal(resolved.renderer, "EXISTING_EXAM_RENDERER");
  assert.equal(resolved.canOverridePiMathDna, false);
  assert.equal(registry.profiles.some((profile) => profile.profileId === profileId), true);
  console.log(`${exam}_PROFILE_RESOLVED=PASS`);
  console.log(`${exam}_RUNTIME_AUTHORITY=PASS`);
}

const thpt = resolveExamRuntimeAuthority("THPTQG").profile;
const dgnl = resolveExamRuntimeAuthority("DGNL").profile;
const sat = resolveExamRuntimeAuthority("SAT").profile;
const vsat = resolveExamRuntimeAuthority("VSAT").profile;
assert.equal(thpt.examSpec.parts.PART_I.questions, 12);
assert.deepEqual(dgnl.examSpec.questionRange, [61, 90]);
assert.deepEqual(sat.examSpec.responseTypes, ["MULTIPLE_CHOICE", "STUDENT_PRODUCED_RESPONSE"]);
assert.equal(vsat.inheritedFrom, "PIMATH-DNA-V1.0");
assert.deepEqual(vsat.visualReferences, ["PIMATH-DNA-V1.0"]);
assert.equal(resolveMathNotationAuthority().provenance.root, "PIMATH-DNA-V1.0");
assert.equal(resolveSemanticGeometryAuthority().provenance.root, "PIMATH-DNA-V1.0");
assert.equal(NA_MATH_STANDARD_V2_6.video.canonicalProfileId, "PIMATH_VIDEO_VISUAL_CANONICAL_V2.0");
console.log("NO_GENERIC_PROFILE_OVERRIDE=PASS");
console.log("NO_PARALLEL_EXAM_AUTHORITY=PASS");
console.log("OUTPUT_PROFILE_REGISTRY_QA=PASS");
console.log("MATH_NOTATION_AUTHORITY_COMPATIBILITY=PASS");
console.log("SEMANTIC_GEOMETRY_AUTHORITY_COMPATIBILITY=PASS");
console.log("VIDEO_CANONICAL_COMPATIBILITY=PASS");
