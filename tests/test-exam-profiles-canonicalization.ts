import assert from "node:assert/strict";
import registry from "../registry/output-profiles.json";
import { MST_MATH_DNA, resolveOutputProfile } from "../src/config/naMathBrandRoot.ts";

const profiles = new Map(registry.profiles.map((p) => [p.profileId, p]));
const thpt = resolveOutputProfile("P06_EXAM_THPTQG") as any;
const dgnl = resolveOutputProfile("P06_EXAM_DGNL") as any;
const sat = resolveOutputProfile("P06_EXAM_SAT") as any;

const expectedProfileIds = [
  "P01_LEARNING_MATERIAL",
  "P02_LESSON_PLAN",
  "P03_WORKSHEET",
  "P04_EXERCISE_SHEET",
  "P05_TEST",
  "P06_EXAM_SCHOOL",
  "P06_EXAM_THPTQG",
  "P06_EXAM_DGNL",
  "P06_EXAM_VSAT",
  "P06_EXAM_SAT",
  "P07_VIDEO",
  "PIMATH_VIDEO_VISUAL_CANONICAL_V2.0",
  "P08_GEOGEBRA",
  "P09_FOLD",
  "P10_GAME",
  "P11_DIGITAL_AI_LESSON",
  "P12_APP_UI",
] as const;
const actualProfileIds = registry.profiles.map((profile) => profile.profileId);
assert.equal(new Set(actualProfileIds).size, actualProfileIds.length, "Profile IDs must be unique");
assert.deepEqual(actualProfileIds, expectedProfileIds, "Profile registry membership/order changed unexpectedly");
assert.equal(actualProfileIds.includes("PIMATH_VIDEO_VISUAL_CANONICAL_V2.0"), true);
assert.equal(registry.profiles.find((profile) => profile.profileId === "PIMATH_VIDEO_VISUAL_CANONICAL_V2.0")?.canonical, true);
assert.equal(registry.profiles.find((profile) => profile.profileId === "PIMATH_VIDEO_VISUAL_CANONICAL_V2.0")?.approved, true);
assert.deepEqual(["P06_EXAM_SCHOOL", "P06_EXAM_THPTQG", "P06_EXAM_DGNL", "P06_EXAM_VSAT", "P06_EXAM_SAT"], registry.profiles.filter(p => p.profileId.startsWith("P06_EXAM_")).map(p => p.profileId));
assert.equal(registry.aliases.P06_EXAM_THPT.aliasOf, "P06_EXAM_THPTQG");
assert.equal(registry.aliases.P06_EXAM_THPT.status, "COMPATIBILITY_ALIAS");
assert.equal(resolveOutputProfile("P06_EXAM_THPT").profileId, "P06_EXAM_THPTQG");
for (const p of [thpt, dgnl, sat]) { assert.equal(p.inheritedFrom, MST_MATH_DNA.standardId); assert.equal(p.answerPagePolicy.required, true); assert.equal(p.answerPagePolicy.answersOnly, true); assert.equal(p.answerPagePolicy.solutions, false); }
assert.deepEqual([thpt.examSpec.parts.PART_I.questions, thpt.examSpec.parts.PART_II.questions, thpt.examSpec.parts.PART_III.questions], [12, 4, 6]);
assert.equal(thpt.examSpec.promptCount, 34); assert.equal(thpt.examSpec.questionCount, 22); assert.equal(thpt.examSpec.durationMinutes, 90);
assert.deepEqual(dgnl.examSpec.questionRange, [61, 90]); assert.equal(dgnl.examSpec.keepQuestionTogether, true); assert.equal(dgnl.examSpec.columns, 1);
assert.deepEqual(dgnl.answerPagePolicy.groups, ["61-70", "71-80", "81-90"]);
assert.deepEqual(sat.examSpec.responseTypes, ["MULTIPLE_CHOICE", "STUDENT_PRODUCED_RESPONSE"]); assert.equal(sat.examSpec.modules.length, 2); assert.equal(sat.examSpec.sprDedicatedResponseArea, true);
assert.deepEqual(sat.answerPagePolicy.dynamicGroups.length, 4);
assert.equal(profiles.get("P06_EXAM_THPT"), undefined);
console.log("MST_MATH_EXAM_PROFILES_QA=PASS");
