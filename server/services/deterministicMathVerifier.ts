import { DeterministicVerificationCheck, DeterministicVerificationResult, MathProblemIR, MathSolution } from "../../src/types/mathSchema.js";

type Fraction = { n: number; d: number };
type Polynomial = [number, number, number];
type EquationType = "LINEAR_EQUATION" | "QUADRATIC_EQUATION";
type ParsedEquation = { type: EquationType; source: string; polynomial: Polynomial; denominator?: Polynomial; radical?: Polynomial; transformation?: "CLEAR_DENOMINATOR" | "SQUARE_BOTH_SIDES" };

function gcd(a: number, b: number): number { while (b) [a, b] = [b, a % b]; return Math.abs(a) || 1; }
function q(n: number, d = 1): Fraction { if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) throw new Error("Invalid rational"); const sign = d < 0 ? -1 : 1; const divisor = gcd(n, d); return { n: sign * n / divisor, d: sign * d / divisor }; }
function add(a: Fraction, b: Fraction): Fraction { return q(a.n * b.d + b.n * a.d, a.d * b.d); }
function mul(a: Fraction, b: Fraction): Fraction { return q(a.n * b.n, a.d * b.d); }
function format(value: Fraction): string { return value.d === 1 ? String(value.n) : `${value.n}/${value.d}`; }
function parseFraction(raw: string): Fraction | null { const match = raw.match(/^(-?\d+)(?:\/(\d+))?$/); return match ? q(Number(match[1]), match[2] ? Number(match[2]) : 1) : null; }
function normalize(raw: string): string { return raw.replace(/[\u0000$]/g, "").replace(/\\left|\\right/g, "").replace(/\\frac\{(-?\d+)\}\{(\d+)\}/g, "$1/$2").replace(/\\sqrt\{([^{}]+)\}/g, "sqrt($1)").replace(/[²]/g, "^2").replace(/[−–—]/g, "-").replace(/\s+/g, "").toLowerCase(); }
function unwrap(raw: string): string { return raw.startsWith("(") && raw.endsWith(")") ? raw.slice(1, -1) : raw; }
function parsePolynomial(raw: string): Polynomial | null {
  const value = unwrap(raw); if (!value || /[^0-9x+\-^/]/.test(value)) return null;
  const result: Polynomial = [0, 0, 0];
  for (const term of value.replace(/-/g, "+-").split("+").filter(Boolean)) {
    const variable = term.match(/^([+-]?\d+)?x(?:\^2)?$/); const constant = term.match(/^([+-]?\d+(?:\/\d+)?)$/);
    const coefficient = parseFraction(variable ? variable[1] || "1" : constant?.[1] || "");
    if (!coefficient || coefficient.d !== 1) return null;
    result[variable ? (term.includes("^2") ? 2 : 1) : 0] += coefficient.n;
  }
  return result;
}
function subtract(a: Polynomial, b: Polynomial): Polynomial { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function multiplyPolynomial(a: Polynomial, b: Polynomial): Polynomial | null { const result = [0, 0, 0, 0, 0]; for (let i = 0; i <= 2; i++) for (let j = 0; j <= 2; j++) result[i + j] += a[i] * b[j]; return result[3] || result[4] ? null : [result[0], result[1], result[2]]; }
function evaluate(polynomial: Polynomial, value: Fraction): Fraction { return add(add(q(polynomial[0]), mul(q(polynomial[1]), value)), mul(q(polynomial[2]), mul(value, value))); }
function parseEquation(raw: string): ParsedEquation | null {
  const source = normalize(raw); if (!source || (source.match(/=/g) || []).length !== 1) return null;
  const [left, right] = source.split("="); const radical = left.match(/^sqrt\(([^()]+)\)$/);
  if (radical) { const radicand = parsePolynomial(radical[1]); const rightPolynomial = parsePolynomial(right); const square = rightPolynomial && multiplyPolynomial(rightPolynomial, rightPolynomial); if (!radicand || !rightPolynomial || rightPolynomial[2] || radicand[2] || !square) return null; const polynomial = subtract(radicand, square); return { type: polynomial[2] ? "QUADRATIC_EQUATION" : "LINEAR_EQUATION", source, polynomial, radical: radicand, transformation: "SQUARE_BOTH_SIDES" }; }
  const fraction = left.match(/^\(([^()]+)\)\/\(([^()]+)\)$/);
  if (fraction) { const numerator = parsePolynomial(fraction[1]); const denominator = parsePolynomial(fraction[2]); const rightPolynomial = parsePolynomial(right); const product = denominator && rightPolynomial && multiplyPolynomial(denominator, rightPolynomial); if (!numerator || !denominator || !rightPolynomial || denominator[2] || !denominator[1] || !product) return null; const polynomial = subtract(numerator, product); return { type: polynomial[2] ? "QUADRATIC_EQUATION" : "LINEAR_EQUATION", source, polynomial, denominator, transformation: "CLEAR_DENOMINATOR" }; }
  const leftPolynomial = parsePolynomial(left); const rightPolynomial = parsePolynomial(right); if (!leftPolynomial || !rightPolynomial) return null; const polynomial = subtract(leftPolynomial, rightPolynomial); if (!polynomial[1] && !polynomial[2]) return null; return { type: polynomial[2] ? "QUADRATIC_EQUATION" : "LINEAR_EQUATION", source, polynomial };
}
function solve(polynomial: Polynomial): Fraction[] | "NO_REAL_ROOTS" | "IRRATIONAL" { if (!polynomial[2]) return [q(-polynomial[0], polynomial[1])]; const delta = polynomial[1] * polynomial[1] - 4 * polynomial[2] * polynomial[0]; if (delta < 0) return "NO_REAL_ROOTS"; const root = Math.sqrt(delta); if (!Number.isInteger(root)) return "IRRATIONAL"; const values = [q(-polynomial[1] + root, 2 * polynomial[2])]; if (root) values.push(q(-polynomial[1] - root, 2 * polynomial[2])); return values; }
function makeResult(status: DeterministicVerificationResult["status"], type: DeterministicVerificationResult["problemType"], reasons: string[], checks: DeterministicVerificationCheck[], details: Partial<DeterministicVerificationResult> = {}): DeterministicVerificationResult { return { status, engine: "DETERMINISTIC_V1", problemType: type, checks, reasons, ...details }; }

export class DeterministicMathVerifier {
  public verify(problemIR: MathProblemIR, solution: MathSolution): DeterministicVerificationResult {
    const sourceEquation = problemIR.latex || ""; const parsed = parseEquation(sourceEquation);
    if (!parsed) return makeResult("UNSUPPORTED", "UNSUPPORTED", ["Source equation is outside deterministic V1.1 scope."], [{ type: "SUPPORTED_EQUATION", passed: false, detail: "Unsupported equation grammar." }], { sourceEquation: normalize(sourceEquation), normalizedSourceEquation: normalize(sourceEquation) });
    const domainChecks: NonNullable<DeterministicVerificationResult["domainChecks"]> = []; const excludedValues: string[] = [];
    if (parsed.denominator) { const excluded = solve(parsed.denominator); if (!Array.isArray(excluded)) return makeResult("HUMAN_REVIEW_REQUIRED", parsed.type, ["Denominator restriction is not exactly solvable."], [], { sourceEquation: parsed.source, normalizedSourceEquation: parsed.source }); for (const value of excluded) { const valueText = format(value); excludedValues.push(valueText); domainChecks.push({ expression: parsed.source, restriction: `x != ${valueText}`, passed: true, reason: "Denominator must be non-zero." }); } }
    if (parsed.radical) domainChecks.push({ expression: parsed.source, restriction: "radicand >= 0 and right side >= 0", passed: true, reason: "Principal real square root domain." });
    const transformations = parsed.transformation ? [{ type: parsed.transformation, before: parsed.source, after: `${parsed.polynomial[2]}x^2+${parsed.polynomial[1]}x+${parsed.polynomial[0]}=0`, mayIntroduceExtraneousRoots: parsed.transformation === "SQUARE_BOTH_SIDES" }] : [];
    const solved = solve(parsed.polynomial); if (solved === "IRRATIONAL") return makeResult("HUMAN_REVIEW_REQUIRED", parsed.type, ["Irrational roots are outside exact rational V1.1 output."], [], { variable: "x", sourceEquation: parsed.source, normalizedSourceEquation: parsed.source, transformations, domainChecks, excludedValues });
    const expected = solved === "NO_REAL_ROOTS" ? [] : solved; const expectedSolutions = expected.map(format); const noRealRoots = solution?.verification_data?.noRealRoots === true; const rawRoots = solution?.verification_data?.roots;
    if (!Array.isArray(rawRoots) && !noRealRoots) return makeResult("HUMAN_REVIEW_REQUIRED", parsed.type, ["Candidate roots are unavailable in a trusted structured field."], [], { variable: "x", sourceEquation: parsed.source, normalizedSourceEquation: parsed.source, transformations, domainChecks, excludedValues });
    const candidateSolutions = Array.isArray(rawRoots) ? rawRoots.filter((value): value is string | number => typeof value === "string" || typeof value === "number").map(String) : []; const candidates = candidateSolutions.map(parseFraction);
    if (candidates.some((value) => !value)) return makeResult("HUMAN_REVIEW_REQUIRED", parsed.type, ["Candidate roots are not exact rational values."], [], { variable: "x", expectedSolutions, candidateSolutions, sourceEquation: parsed.source, normalizedSourceEquation: parsed.source, transformations, domainChecks, excludedValues });
    const unique = (values: string[]) => [...new Set(values)];
    const transformedExtraneous: string[] = [];
    const verifiedExpected: string[] = [];
    for (const expectedValue of expected) {
      const denominatorValid = !parsed.denominator || evaluate(parsed.denominator, expectedValue).n !== 0;
      const radicand = parsed.radical && evaluate(parsed.radical, expectedValue);
      const radicalValid = !parsed.radical || (radicand!.n >= 0 && expectedValue.n >= 0 && radicand!.n * expectedValue.d * expectedValue.d === expectedValue.n * expectedValue.n * radicand!.d);
      if (denominatorValid && radicalValid) verifiedExpected.push(format(expectedValue)); else transformedExtraneous.push(format(expectedValue));
    }
    const extraneousSolutions: string[] = [...transformedExtraneous]; const verifiedSolutions: string[] = [];
    for (const candidate of candidates as Fraction[]) { const value = format(candidate); const denominatorValid = !parsed.denominator || evaluate(parsed.denominator, candidate).n !== 0; const radicand = parsed.radical && evaluate(parsed.radical, candidate); const radicalValid = !parsed.radical || (radicand!.n >= 0 && candidate.n >= 0 && radicand!.n * candidate.d * candidate.d === candidate.n * candidate.n * radicand!.d); const originalValid = parsed.radical ? radicalValid : denominatorValid && evaluate(parsed.polynomial, candidate).n === 0; if (denominatorValid && originalValid) verifiedSolutions.push(value); else if (!extraneousSolutions.includes(value)) extraneousSolutions.push(value); }
    const verified = unique(verifiedSolutions); const expectedSet = unique(verifiedExpected); const candidateSet = unique(candidateSolutions); const candidateDomainPassed = candidateSet.every((value) => !extraneousSolutions.includes(value)); const setPassed = candidateSet.length === expectedSet.length && expectedSet.every((value) => candidateSet.includes(value)); const checks = [{ type: "DOMAIN_RESTRICTIONS", passed: candidateDomainPassed, detail: candidateDomainPassed ? "All candidates satisfy domain restrictions." : `Invalid candidates: ${extraneousSolutions.join(", ")}.` }, { type: "ORIGINAL_EQUATION_SUBSTITUTION", passed: candidateDomainPassed, detail: candidateDomainPassed ? "Candidates satisfy the original equation." : "A candidate is extraneous in the original equation." }, { type: "ROOT_SET_COMPARISON", passed: setPassed, detail: setPassed ? "Candidate and expected root sets match." : "Candidate roots are missing or contain extra roots." }]; const passed = candidateDomainPassed && setPassed && (solved !== "NO_REAL_ROOTS" || noRealRoots);
    const sourceProvenance = problemIR.provenance?.find((item) => item.value === problemIR.latex) || problemIR.provenance?.find((item) => item.sourceField === "text");
    const sourceKind = sourceProvenance?.kind || "PROVIDER_INFERRED";
    const sourceTrusted = sourceProvenance?.trustedForAutomation === true;
    return makeResult(passed ? "DETERMINISTIC_PASS" : "DETERMINISTIC_FAIL", parsed.type, passed ? [] : checks.filter((check) => !check.passed).map((check) => check.detail), checks, { variable: "x", sourceEquation: parsed.source, normalizedSourceEquation: parsed.source, transformedEquation: transformations[0]?.after || parsed.source, expectedSolutions, candidateSolutions, domainChecks, excludedValues, extraneousSolutions, verifiedSolutions: verified, transformations, sourceHash: problemIR.sourceHash, normalizedSourceHash: problemIR.normalizedSourceHash, provenance: [
      { id: "source_equation", kind: sourceKind, value: parsed.source, sourceField: sourceProvenance?.sourceField || "problemIR.latex", trustedForAutomation: sourceTrusted },
      ...verified.map((value) => ({ id: `derived_root_${value}`, kind: "DETERMINISTIC_DERIVED" as const, value: `x=${value}`, derivedFrom: ["source_equation"], derivationRule: parsed.transformation === "CLEAR_DENOMINATOR" ? "CLEAR_DENOMINATOR_AND_SUBSTITUTE" : parsed.transformation === "SQUARE_BOTH_SIDES" ? "SQUARE_AND_SUBSTITUTE" : "SOLVE_POLYNOMIAL", trustedForAutomation: true })),
    ] });
  }
}
export const deterministicMathVerifier = new DeterministicMathVerifier();
