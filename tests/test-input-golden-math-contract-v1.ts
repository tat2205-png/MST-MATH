import assert from "node:assert/strict";
import { assertCompleteMathExpectations, evaluateMathExpectation, evaluatePageCoverage } from "../scripts/input-golden-math-contract.js";

const none = { page_number: 1, expected_math: "NONE" as const, expected_min_math_regions: 0 };
const present = { page_number: 2, expected_math: "PRESENT" as const, expected_min_math_regions: 1 };

assert.equal(evaluateMathExpectation(none, { page_number: 1, detected_math_regions: 0 }).status, "PASS");
assert.equal(evaluateMathExpectation(none, { page_number: 1, detected_math_regions: 1 }).status, "FAIL");
assert.equal(evaluateMathExpectation(present, { page_number: 2, detected_math_regions: 0 }).status, "FAIL");
assert.equal(evaluateMathExpectation(present, { page_number: 2, detected_math_regions: 1 }).status, "PASS");
assert.equal(evaluateMathExpectation(undefined, { page_number: 1, detected_math_regions: 0 }).status, "BLOCKED");
assert.equal(evaluateMathExpectation({ ...present, expected_math: "UNKNOWN" }, { page_number: 2, detected_math_regions: 1 }).status, "BLOCKED");
assert.doesNotThrow(() => assertCompleteMathExpectations([none, present], 2));
assert.throws(() => assertCompleteMathExpectations([none], 2), /MATH_EXPECTATION_INCOMPLETE/);
assert.equal(evaluatePageCoverage([none, present], 2, [1, 2], true).status, "PASS");
assert.equal(evaluatePageCoverage([none, present], 2, [1], false).status, "BLOCKED");
assert.equal(evaluatePageCoverage([none, present], 2, [1, 1], true).status, "FAIL");
assert.equal(evaluatePageCoverage([none, present], 2, [1, 3], true).status, "FAIL");
assert.equal(evaluatePageCoverage([none, present], 2, [2, 1], true).status, "FAIL");
console.log("INPUT_GOLDEN_MATH_CONTRACT_QA=PASS");
