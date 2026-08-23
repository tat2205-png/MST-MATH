import { createHash } from "node:crypto";
import { DeterministicVerificationResult, MathProblemIR, MathSolution, ProvenanceRecord } from "../../src/types/mathSchema.js";

type Rational = { numerator: bigint; denominator: bigint };
type Equation = { source: string; a: Rational; b: Rational; c: Rational };
type Classification = "UNIQUE_SOLUTION" | "NO_SOLUTION" | "INFINITE_SOLUTIONS";

const zero = (): Rational => ({ numerator: 0n, denominator: 1n });
const gcd = (left: bigint, right: bigint): bigint => {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b) [a, b] = [b, a % b];
  return a || 1n;
};
const rational = (numerator: bigint, denominator = 1n): Rational => {
  if (denominator === 0n) throw new Error("Invalid rational denominator");
  const sign = denominator < 0n ? -1n : 1n;
  const divisor = gcd(numerator, denominator);
  return { numerator: sign * numerator / divisor, denominator: sign * denominator / divisor };
};
const add = (left: Rational, right: Rational) => rational(left.numerator * right.denominator + right.numerator * left.denominator, left.denominator * right.denominator);
const subtract = (left: Rational, right: Rational) => rational(left.numerator * right.denominator - right.numerator * left.denominator, left.denominator * right.denominator);
const multiply = (left: Rational, right: Rational) => rational(left.numerator * right.numerator, left.denominator * right.denominator);
const equal = (left: Rational, right: Rational) => left.numerator === right.numerator && left.denominator === right.denominator;
const format = (value: Rational) => value.denominator === 1n ? String(value.numerator) : `${value.numerator}/${value.denominator}`;

function parseRational(raw: string): Rational | null {
  const match = raw.match(/^([+-]?\d+)(?:\/(\d+))?$/);
  return match ? rational(BigInt(match[1]), match[2] ? BigInt(match[2]) : 1n) : null;
}

function normalizeSource(source: string): string {
  return source.replace(/\\frac\{([+-]?\d+)\}\{(\d+)\}/g, "$1/$2").replace(/[\\{}]/g, "").replace(/\\cdot|\*/g, "").replace(/[−–—]/g, "-").replace(/\s+/g, "").toLowerCase();
}

function parseLinearExpression(raw: string): [Rational, Rational, Rational] | null {
  if (!raw) return null;
  const terms = raw.match(/[+-]?[^+-]+/g);
  if (!terms || terms.join("") !== raw) return null;
  const coefficients: [Rational, Rational, Rational] = [zero(), zero(), zero()];
  for (const term of terms) {
    const variable = term.endsWith("x") || term.endsWith("y") ? term.at(-1) : undefined;
    const coefficientText = variable ? term.slice(0, -1) : term;
    const coefficient = parseRational(coefficientText === "+" ? "1" : coefficientText === "-" ? "-1" : coefficientText || "1");
    if (!coefficient) return null;
    if (variable === "x") coefficients[1] = add(coefficients[1], coefficient);
    else if (variable === "y") coefficients[2] = add(coefficients[2], coefficient);
    else if (term.includes("x") || term.includes("y")) return null;
    else coefficients[0] = add(coefficients[0], coefficient);
  }
  return coefficients;
}

function parseEquation(raw: string): Equation | null {
  const equals = raw.indexOf("=");
  if (equals < 1 || equals !== raw.lastIndexOf("=")) return null;
  const left = parseLinearExpression(raw.slice(0, equals));
  const right = parseLinearExpression(raw.slice(equals + 1));
  if (!left || !right) return null;
  return { source: raw, a: subtract(left[1], right[1]), b: subtract(left[2], right[2]), c: subtract(right[0], left[0]) };
}

function fingerprint(source: string): string {
  return createHash("sha256").update(source).digest("hex");
}

function result(status: DeterministicVerificationResult["status"], reasons: string[], checks: DeterministicVerificationResult["checks"], details: Partial<DeterministicVerificationResult> = {}): DeterministicVerificationResult {
  return { status, engine: "DETERMINISTIC_V1", problemType: "LINEAR_SYSTEM_2X2", reasons, checks, ...details };
}

export class DeterministicLinearSystemVerifier {
  verify(problemIR: MathProblemIR, solution: MathSolution): DeterministicVerificationResult {
    const source = typeof problemIR?.latex === "string" ? normalizeSource(problemIR.latex) : "";
    if (!source) return result("INVALID_INPUT", ["Linear system source is missing or malformed."], [{ type: "VALID_INPUT", passed: false, detail: "A non-empty source string is required." }]);
    if ((source.match(/;/g) || []).length !== 1) return result("UNSUPPORTED", ["Source must contain exactly two equations separated by one semicolon."], [{ type: "SUPPORTED_SYSTEM", passed: false, detail: "Invalid equation count or separator grammar." }], { sourceEquation: source });
    const segments = source.split(";");
    const equations = segments.map(parseEquation);
    if (equations.some((equation) => !equation)) return result("UNSUPPORTED", ["Source is outside deterministic 2x2 linear-system grammar."], [{ type: "SUPPORTED_SYSTEM", passed: false, detail: "Only exact linear equations in x and y are supported." }], { sourceEquation: source });
    const [first, second] = equations as Equation[];
    const determinant = subtract(multiply(first.a, second.b), multiply(second.a, first.b));
    const augmentedA = subtract(multiply(first.a, second.c), multiply(second.a, first.c));
    const augmentedB = subtract(multiply(first.b, second.c), multiply(second.b, first.c));
    const firstCoefficientsZero = equal(first.a, zero()) && equal(first.b, zero());
    const secondCoefficientsZero = equal(second.a, zero()) && equal(second.b, zero());
    const inconsistentZeroEquation = (firstCoefficientsZero && !equal(first.c, zero())) || (secondCoefficientsZero && !equal(second.c, zero()));
    const classification: Classification = !equal(determinant, zero()) ? "UNIQUE_SOLUTION" : inconsistentZeroEquation || !equal(augmentedA, zero()) || !equal(augmentedB, zero()) ? "NO_SOLUTION" : "INFINITE_SOLUTIONS";
    const checks: DeterministicVerificationResult["checks"] = [
      { type: "NORMALIZE_EQUATION_1", passed: true, detail: "Equation 1 normalized to exact rational coefficients." },
      { type: "NORMALIZE_EQUATION_2", passed: true, detail: "Equation 2 normalized to exact rational coefficients." },
      { type: "COMPUTE_DETERMINANT", passed: true, detail: `D = ${format(determinant)}.` },
      { type: "CLASSIFY_SYSTEM", passed: true, detail: classification },
    ];
    const derivedFrom = ["source_equation_1", "source_equation_2"];
    const trace = checks.map((check) => ({ type: check.type, derivedFrom }));
    const provenance: ProvenanceRecord[] = [
      { id: "source_equation_1", kind: "SOURCE_LITERAL", value: first.source, sourceField: "problemIR.latex", trustedForAutomation: true },
      { id: "source_equation_2", kind: "SOURCE_LITERAL", value: second.source, sourceField: "problemIR.latex", trustedForAutomation: true },
    ];
    if (classification === "UNIQUE_SOLUTION") {
      const x = divide(subtract(multiply(first.c, second.b), multiply(second.c, first.b)), determinant);
      const y = divide(subtract(multiply(first.a, second.c), multiply(second.a, first.c)), determinant);
      const candidate = solution?.verification_data?.systemSolution;
      const candidatePoint = candidate && candidate.type === "POINT" && typeof candidate.x === "string" && typeof candidate.y === "string" ? { x: parseRational(candidate.x), y: parseRational(candidate.y) } : null;
      const equation1Pass = candidatePoint !== null && candidatePoint.x !== null && candidatePoint.y !== null && equal(add(multiply(first.a, candidatePoint.x), multiply(first.b, candidatePoint.y)), first.c);
      const equation2Pass = candidatePoint !== null && candidatePoint.x !== null && candidatePoint.y !== null && equal(add(multiply(second.a, candidatePoint.x), multiply(second.b, candidatePoint.y)), second.c);
      const expected = { type: "POINT" as const, x: format(x), y: format(y) };
      const candidatePass = candidatePoint !== null && candidatePoint.x !== null && candidatePoint.y !== null && equal(candidatePoint.x, x) && equal(candidatePoint.y, y) && equation1Pass && equation2Pass && Object.keys(candidate).length === 3;
      checks.push({ type: "SOLVE_EXACT_RATIONAL", passed: true, detail: `x=${expected.x}, y=${expected.y}.` }, { type: "SUBSTITUTE_EQUATION_1", passed: equation1Pass, detail: equation1Pass ? "Candidate satisfies equation 1 exactly." : "Candidate does not satisfy equation 1." }, { type: "SUBSTITUTE_EQUATION_2", passed: equation2Pass, detail: equation2Pass ? "Candidate satisfies equation 2 exactly." : "Candidate does not satisfy equation 2." });
      trace.push({ type: "SOLVE_EXACT_RATIONAL", derivedFrom }, { type: "SUBSTITUTE_EQUATION_1", derivedFrom }, { type: "SUBSTITUTE_EQUATION_2", derivedFrom });
      provenance.push({ id: "derived_solution", kind: "DETERMINISTIC_DERIVED", value: `x=${expected.x},y=${expected.y}`, derivedFrom, derivationRule: "CRAMER_RULE_EXACT_RATIONAL_AND_SUBSTITUTION", trustedForAutomation: true });
      return result(candidatePass ? "DETERMINISTIC_PASS" : "DETERMINISTIC_FAIL", candidatePass ? [] : ["Canonical point candidate is missing, malformed, incorrect, or fails substitution in both equations."], checks, { classification, systemSolution: expected, expectedSolutions: [`x=${expected.x}`, `y=${expected.y}`], candidateSolutions: candidatePoint ? [`x=${candidate.x}`, `y=${candidate.y}`] : [], sourceEquation: source, normalizedSourceEquation: source, sourceFingerprint: fingerprint(source), derivationTrace: trace, provenance });
    }
    const expected = { type: classification === "NO_SOLUTION" ? "NO_SOLUTION" as const : "INFINITE_SOLUTIONS" as const };
    const candidate = solution?.verification_data?.systemSolution;
    const candidatePass = candidate && candidate.type === expected.type && Object.keys(candidate).length === 1;
    provenance.push({ id: "derived_classification", kind: "DETERMINISTIC_DERIVED", value: classification, derivedFrom, derivationRule: "RANK_AND_DETERMINANT_CLASSIFICATION", trustedForAutomation: true });
    return result(candidatePass ? "DETERMINISTIC_PASS" : "DETERMINISTIC_FAIL", candidatePass ? [] : [`Canonical candidate must be {type:"${expected.type}"}.`], checks, { classification, systemSolution: expected, sourceEquation: source, normalizedSourceEquation: source, sourceFingerprint: fingerprint(source), derivationTrace: trace, provenance });
  }
}

function divide(left: Rational, right: Rational): Rational {
  return rational(left.numerator * right.denominator, left.denominator * right.numerator);
}

export const deterministicLinearSystemVerifier = new DeterministicLinearSystemVerifier();
export { fingerprint as linearSystemSourceFingerprint, normalizeSource as normalizeLinearSystemSource };
