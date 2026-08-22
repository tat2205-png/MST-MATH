import { DeterministicVerificationResult, MathProblemIR, MathSolution, MathVerification } from "../../src/types/mathSchema.js";

export interface RuntimeValidationResult { valid: boolean; errors: string[]; }
const record = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const arrayOfStrings = (value: unknown) => Array.isArray(value) && value.every((item) => typeof item === "string");

export function validateProblemIR(value: unknown): RuntimeValidationResult {
  const errors: string[] = [];
  if (!record(value)) return { valid: false, errors: ["ProblemIR must be an object."] };
  for (const field of ["problem", "latex", "domain", "topic", "grade", "status"]) if (typeof value[field] !== "string" || !value[field]) errors.push(`ProblemIR.${field} must be a non-empty string.`);
  for (const field of ["given", "find", "entities", "constraints", "ambiguities"]) if (!Array.isArray(value[field])) errors.push(`ProblemIR.${field} must be an array.`);
  if (typeof value.confidence !== "number") errors.push("ProblemIR.confidence must be a number.");
  if (value.status && !["PASS", "READY", "COMPLETE", "NEED_MORE_INFORMATION", "WARNING", "FAIL", "AMBIGUOUS", "INCONSISTENT"].includes(String(value.status))) errors.push("ProblemIR.status is unknown.");
  return { valid: errors.length === 0, errors };
}

export function validateSolution(value: unknown): RuntimeValidationResult {
  const errors: string[] = [];
  if (!record(value)) return { valid: false, errors: ["Solution must be an object."] };
  for (const field of ["section_1_analysis", "section_2_approach", "final_answer"]) if (!record(value[field])) errors.push(`Solution.${field} must be an object.`);
  if (!Array.isArray(value.section_3_detailed_steps)) errors.push("Solution.section_3_detailed_steps must be an array.");
  if (!Array.isArray(value.teacher_tips)) errors.push("Solution.teacher_tips must be an array.");
  if (record(value.final_answer) && (typeof value.final_answer.value !== "string" || typeof value.final_answer.latex !== "string")) errors.push("Solution.final_answer fields are malformed.");
  if (record(value.verification_data) && value.verification_data.roots !== undefined && !arrayOfStrings(value.verification_data.roots)) errors.push("Solution.verification_data.roots must be an array of strings.");
  return { valid: errors.length === 0, errors };
}

export function validateVerificationReport(value: unknown): RuntimeValidationResult {
  const errors: string[] = [];
  if (!record(value)) return { valid: false, errors: ["VerificationReport must be an object."] };
  if (!["CONFIRMED_VALID", "FLAGGED_CONCERNS"].includes(String(value.verification_seal))) errors.push("VerificationReport.verification_seal is missing or invalid.");
  if (!["PASS", "WARNING", "FAIL", "NEED_MORE_INFORMATION"].includes(String(value.status))) errors.push("VerificationReport.status is missing or unknown.");
  if (!Array.isArray(value.checks) || value.checks.length === 0) errors.push("VerificationReport.checks must be a non-empty array.");
  if (!Array.isArray(value.discrepancies)) errors.push("VerificationReport.discrepancies must be an array.");
  for (const field of ["symbolic_correctness", "numeric_soundness", "logical_deduction", "geometry_invariants", "domain_and_boundaries", "units_and_dimensions", "counter_example_search"]) if (!record(value[field])) errors.push(`VerificationReport.${field} is missing or malformed.`);
  return { valid: errors.length === 0, errors };
}

export function validateDeterministicVerification(value: unknown): RuntimeValidationResult {
  const errors: string[] = [];
  if (!record(value)) return { valid: false, errors: ["DeterministicVerification must be an object."] };
  if (!["DETERMINISTIC_PASS", "DETERMINISTIC_FAIL", "UNSUPPORTED", "HUMAN_REVIEW_REQUIRED"].includes(String(value.status))) errors.push("DeterministicVerification.status is missing or unknown.");
  if (value.engine !== "DETERMINISTIC_V1") errors.push("DeterministicVerification.engine is invalid.");
  if (!["LINEAR_EQUATION", "QUADRATIC_EQUATION", "LINEAR_INEQUALITY", "QUADRATIC_INEQUALITY", "RATIONAL_INEQUALITY", "UNSUPPORTED"].includes(String(value.problemType))) errors.push("DeterministicVerification.problemType is invalid.");
  if (!Array.isArray(value.checks) || !Array.isArray(value.reasons)) errors.push("DeterministicVerification checks/reasons are malformed.");
  if (value.verifiedSolutions !== undefined && !arrayOfStrings(value.verifiedSolutions)) errors.push("DeterministicVerification.verifiedSolutions must be an array of strings.");
  if (value.extraneousSolutions !== undefined && !arrayOfStrings(value.extraneousSolutions)) errors.push("DeterministicVerification.extraneousSolutions must be an array of strings.");
  if (String(value.problemType).includes("INEQUALITY")) {
    if (!Array.isArray(value.criticalPoints) || !Array.isArray(value.signAnalysis)) errors.push("DeterministicInequalityResult critical points/sign analysis are malformed.");
    for (const setName of ["expectedSolutionSet", "candidateSolutionSet"]) if (value[setName] !== undefined && (!record(value[setName]) || !Array.isArray(value[setName].intervals))) errors.push(`DeterministicInequalityResult.${setName} is malformed.`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateMathGateResult(value: unknown): RuntimeValidationResult {
  if (!record(value) || typeof value.allowed !== "boolean" || !["VERIFIED_PASS", "BLOCKED", "HUMAN_REVIEW_REQUIRED"].includes(String(value.status)) || !Array.isArray(value.reasons)) return { valid: false, errors: ["MathGateResult is malformed."] };
  return { valid: true, errors: [] };
}

export function assertRuntimeValid(result: RuntimeValidationResult, label: string): void {
  if (!result.valid) throw new Error(`VALIDATION_FAIL: ${label}: ${result.errors.join(" ")}`);
}

export type RuntimeMathTypes = { problemIR: MathProblemIR; solution: MathSolution; verification: MathVerification; deterministic: DeterministicVerificationResult };