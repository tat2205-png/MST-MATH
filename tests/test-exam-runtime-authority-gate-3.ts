import assert from "node:assert/strict";
import registry from "../registry/output-profiles.json";
import { resolveExamRuntimeAuthority, resolveMathNotationAuthority, resolveSemanticGeometryAuthority } from "../src/config/mstMathBrandRoot.ts";
import { NA_MATH_STANDARD_V2_6 } from "../src/config/naMathStandardV26.ts";

const expected = { THPTQG: "P06_EXAM_THPTQG", DGNL: "P06_EXAM_DGNL", SAT: "P06_EXAM_SAT", VSAT: "P06_EXAM_VSAT" } as const;
for (const [exam, profileId] of Object.entries(expected) as Array<[keyof typeof expected, (typeof expected)[keyof typeof expected]]>) {
  const resolved = resolveExamRuntimeAuthority(exam);
  assert.equal(resolved.profile.profileId, profileId);
  assert.equal(resolved.profile.parentBrandId, "MST-MATH-DNA-V1.0");
  assert.equal(resolved.authority, "MST-MATH-DNA-V1.0");
  assert.equal(resolved.renderer, "EXISTING_EXAM_RENDERER");
  assert.equal(resolved.canOverrideMstMathDna, false);
  assert.equal(resolved.canOverridePiMathDna, false);
  assert.equal(registry.profiles.some((profile) => profile.profileId === profileId), true);
  console.log(`${exam}_MST_MATH_RUNTIME_AUTHORITY=PASS`);
}

const thpt = resolveExamRuntimeAuthority("THPTQG").profile as any;
const dgnl = resolveExamRuntimeAuthority("DGNL").profile as any;
const sat = resolveExamRuntimeAuthority("SAT").profile as any;
const vsat = resolveExamRuntimeAuthority("VSAT").profile as any;
assert.equal(thpt.examSpec.parts.PART_I.questions, 12);
assert.deepEqual(dgnl.examSpec.questionRange, [61, 90]);
assert.deepEqual(sat.examSpec.responseTypes, ["MULTIPLE_CHOICE", "STUDENT_PRODUCED_RESPONSE"]);
assert.equal(vsat.inheritedFrom, "MST-MATH-DNA-V1.0");
assert.deepEqual(vsat.visualReferences, ["MST-MATH-DNA-V1.0"]);
assert.equal(resolveMathNotationAuthority().provenance.root, "MST-MATH-DNA-V1.0");
assert.equal(resolveSemanticGeometryAuthority().provenance.root, "MST-MATH-DNA-V1.0");
assert.equal(NA_MATH_STANDARD_V2_6.video.canonicalProfileId, "MST_MATH_VIDEO_VISUAL_CANONICAL_V2.0");
console.log("MST_MATH_EXAM_RUNTIME_AUTHORITY_GATE=PASS");
