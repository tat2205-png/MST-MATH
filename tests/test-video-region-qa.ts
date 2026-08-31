import assert from "node:assert/strict";
import { NA_MATH_VIDEO_PROFILE } from "../src/config/naMathStandardV26.js";
import { validateVideoRegionConformance } from "../server/services/videoRegionQa.js";

const regions = {
  top: NA_MATH_VIDEO_PROFILE.regions.topSafe,
  left: NA_MATH_VIDEO_PROFILE.regions.leftSafe,
  right: NA_MATH_VIDEO_PROFILE.regions.rightSafe,
};

const good = validateVideoRegionConformance({
  regions,
  question: { left: -5, right: 5, top: 3.1, bottom: 2.4 },
  solutionTitle: { left: -5.5, right: -3, top: 0.8, bottom: 0.4 },
  solution: { left: -5.4, right: -1, top: 0.2, bottom: -2.5 },
  answer: { left: -5.4, right: -2.5, top: -2.7, bottom: -3.1 },
});
assert.equal(good.pass, true);

const oldBad = validateVideoRegionConformance({
  regions,
  question: { left: -5, right: 5, top: 3.1, bottom: 2.4 },
  solutionTitle: { left: -3, right: 2, top: 2.8, bottom: 2.3 },
  solution: { left: -7, right: 1, top: 1.5, bottom: -2.5 },
  answer: { left: -4, right: -1, top: -3.4, bottom: -3.8 },
});
assert.equal(oldBad.pass, false);
assert.deepEqual(oldBad.issues, [
  "SOLUTION_TITLE_OUTSIDE_LEFT_REGION",
  "SOLUTION_OUTSIDE_LEFT_REGION",
  "ANSWER_OUTSIDE_LEFT_REGION",
  "QUESTION_SOLUTION_TITLE_OVERLAP",
]);
console.log("OLD_BAD_Q28_FRAME_DETECTED=YES\nOLD_BAD_Q28_REGION_QA=FAIL_EXPECTED\nOLD_BAD_Q28_OVERLAP_QA=FAIL_EXPECTED\nFRAME_QA_FALSE_POSITIVE_FIXED=YES\nVIDEO_REGION_QA=PASS");
