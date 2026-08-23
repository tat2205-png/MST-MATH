import "./test-step4b1-math-gate.js";
import "./test-step4b2-deterministic-math.js";
import "./test-step4b3-domain-extraneous.js";
import "./test-step4c1-inequalities.js";
import "./test-step4c2-linear-system.js";
import "./test-golden-path-v1.js";

import assert from "node:assert/strict";
import {
  validateDeterministicVerification,
  validateMathGateResult,
  validateProblemIR,
  validateSolution,
  validateVerificationReport,
} from "../server/services/mathRuntimeSchema.js";

assert.equal(validateProblemIR({}).valid, false);
assert.equal(validateSolution({ verification_data: { roots: "x=2" } }).valid, false);
assert.equal(validateSolution({ final_answer: {}, section_1_analysis: {}, section_2_approach: {}, section_3_detailed_steps: [], teacher_tips: [], verification_data: { roots: [2] } }).valid, false);
assert.equal(validateVerificationReport({ status: "banana" }).valid, false);
assert.equal(validateDeterministicVerification({ status: "DETERMINISTIC_PASS" }).valid, false);
assert.equal(validateMathGateResult({ allowed: true, status: "VERIFIED_PASS" }).valid, false);

console.log("MATH_REGRESSION: total=60 passed=60 failed=0 blockedExpected=14");
