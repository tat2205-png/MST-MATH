import { DeterministicInequalityResult, InequalityInterval, MathProblemIR, MathSolution } from "../../src/types/mathSchema.js";

type Polynomial = [number, number, number];
type Parsed = { type: DeterministicInequalityResult["problemType"]; source: string; polynomial: Polynomial; operator: string; denominator?: Polynomial };
const normalize = (value: string) => value.replace(/[\u0000$]/g, "").replace(/\\leq|\\le/g, "<=").replace(/\\geq|\\ge/g, ">=").replace(/[≤]/g, "<=").replace(/[≥]/g, ">=").replace(/[−–—]/g, "-").replace(/\s+/g, "").toLowerCase();
const gcd = (a: number, b: number): number => { while (b) [a, b] = [b, a % b]; return Math.abs(a) || 1; };
const rational = (n: number, d = 1) => { const sign = d < 0 ? -1 : 1; const divisor = gcd(n, d); return { n: sign * n / divisor, d: sign * d / divisor }; };
const format = (v: { n: number; d: number }) => v.d === 1 ? String(v.n) : `${v.n}/${v.d}`;
const parsePoly = (raw: string): Polynomial | null => { const value = raw.startsWith("(") && raw.endsWith(")") ? raw.slice(1, -1) : raw; if (!value || /[^0-9x+\-^]/.test(value)) return null; const result: Polynomial = [0, 0, 0]; for (const term of value.replace(/-/g, "+-").split("+").filter(Boolean)) { const variable = term.match(/^([+-]?\d+)?x(?:\^2)?$/); const constant = term.match(/^([+-]?\d+)$/); if (!variable && !constant) return null; const degree = variable ? (term.includes("^2") ? 2 : 1) : 0; result[degree] += Number(variable ? variable[1] || 1 : constant![1]); } return result; };
const subtract = (a: Polynomial, b: Polynomial): Polynomial => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const multiply = (a: Polynomial, b: Polynomial): Polynomial | null => { const r = [0, 0, 0, 0, 0]; for (let i = 0; i <= 2; i++) for (let j = 0; j <= 2; j++) r[i + j] += a[i] * b[j]; return r[3] || r[4] ? null : [r[0], r[1], r[2]]; };
const evaluate = (p: Polynomial, x: number) => p[0] + p[1] * x + p[2] * x * x;
const roots = (p: Polynomial): number[] | null => { if (p[2] === 0) return p[1] ? [-p[0] / p[1]] : null; const delta = p[1] * p[1] - 4 * p[2] * p[0]; if (delta < 0) return []; const root = Math.sqrt(delta); if (!Number.isInteger(root)) return null; return [...new Set([(-p[1] - root) / (2 * p[2]), (-p[1] + root) / (2 * p[2])])]; };
const interval = (left: string, right: string, leftClosed: boolean, rightClosed: boolean): InequalityInterval => ({ left, right, leftClosed, rightClosed });
const parseCandidate = (solution: MathSolution): { intervals: InequalityInterval[] } | null => { const value = solution?.verification_data?.solutionSet; if (!value || typeof value !== "object" || !Array.isArray((value as any).intervals)) return null; return value as { intervals: InequalityInterval[] }; };
const compareSets = (a: InequalityInterval[], b: InequalityInterval[]) => JSON.stringify(a) === JSON.stringify(b);

function parse(raw: string): Parsed | null {
  const source = normalize(raw); const match = source.match(/^(.*?)(<=|>=|<|>)(.*)$/); if (!match) return null;
  const [, left, operator, right] = match; const rationalLeft = left.match(/^\(([^()]+)\)\/\(([^()]+)\)$/);
  if (rationalLeft && right === "0") { const numerator = parsePoly(rationalLeft[1]); const denominator = parsePoly(rationalLeft[2]); if (!numerator || !denominator || denominator[2] || !denominator[1]) return null; return { type: "RATIONAL_INEQUALITY", source, polynomial: numerator, operator, denominator }; }
  const a = parsePoly(left); const b = parsePoly(right); if (!a || !b) return null; const polynomial = subtract(a, b); if (!polynomial[1] && !polynomial[2]) return null; return { type: polynomial[2] ? "QUADRATIC_INEQUALITY" : "LINEAR_INEQUALITY", source, polynomial, operator };
}

export class DeterministicInequalityVerifier {
  public verify(problemIR: MathProblemIR, solution: MathSolution): DeterministicInequalityResult {
    const parsed = parse(problemIR.latex || "");
    const base = { engine: "DETERMINISTIC_V1" as const, variable: "x", criticalPoints: [], signAnalysis: [], checks: [], reasons: [], sourceEquation: normalize(problemIR.latex || ""), normalizedSourceEquation: normalize(problemIR.latex || ""), sourceHash: problemIR.sourceHash };
    if (!parsed) return { ...base, status: "UNSUPPORTED", problemType: "LINEAR_INEQUALITY", reasons: ["Inequality is outside deterministic V1 scope."], checks: [{ type: "SUPPORTED_INEQUALITY", passed: false, detail: "Unsupported inequality grammar." }] };
    const rawRoots = roots(parsed.polynomial); if (rawRoots === null) return { ...base, status: "HUMAN_REVIEW_REQUIRED", problemType: parsed.type, reasons: ["Critical points are not exact rational values."] };
    const critical = [...rawRoots, ...(parsed.denominator && roots(parsed.denominator) || [])].sort((a, b) => a - b); const points = [...new Set(critical)].map((v) => format(rational(v)));
    const boundaries = ["-INF", ...points, "+INF"]; const signs: Array<{ interval: InequalityInterval; sign: "POSITIVE" | "NEGATIVE" | "ZERO" }> = [];
    for (let i = 0; i < boundaries.length - 1; i++) { const left = boundaries[i], right = boundaries[i + 1]; const sample = left === "-INF" && right === "+INF" ? 0 : left === "-INF" ? Number(right) - 1 : right === "+INF" ? Number(left) + 1 : (Number(left) + Number(right)) / 2; const signValue = evaluate(parsed.polynomial, sample) / (parsed.denominator ? evaluate(parsed.denominator, sample) : 1); signs.push({ interval: interval(left, right, false, false), sign: signValue > 0 ? "POSITIVE" : signValue < 0 ? "NEGATIVE" : "ZERO" }); }
    const accepts = (sign: number) => parsed.operator === ">" ? sign > 0 : parsed.operator === ">=" ? sign >= 0 : parsed.operator === "<" ? sign < 0 : sign <= 0;
    const expectedIntervals: InequalityInterval[] = []; for (let i = 0; i < signs.length; i++) if (accepts(signs[i].sign === "POSITIVE" ? 1 : signs[i].sign === "NEGATIVE" ? -1 : 0)) expectedIntervals.push(signs[i].interval);
    for (let i = 0; i < points.length; i++) { const value = Number(points[i]); const sign = evaluate(parsed.polynomial, value) / (parsed.denominator ? evaluate(parsed.denominator, value) || Number.NaN : 1); if (Number.isFinite(sign) && accepts(sign)) { const existing = expectedIntervals.find((v) => v.right === points[i]); if (existing) existing.rightClosed = true; const next = expectedIntervals.find((v) => v.left === points[i]); if (next) next.leftClosed = true; } }
    const candidate = parseCandidate(solution); if (!candidate) return { ...base, status: "HUMAN_REVIEW_REQUIRED", problemType: parsed.type, criticalPoints: points, signAnalysis: signs, expectedSolutionSet: { intervals: expectedIntervals }, reasons: ["Candidate interval set is missing or malformed."] };
    const validIntervals = candidate.intervals.every((v) => v && typeof v.left === "string" && typeof v.right === "string" && typeof v.leftClosed === "boolean" && typeof v.rightClosed === "boolean"); const matches = validIntervals && compareSets(candidate.intervals, expectedIntervals);
    const sourceProvenance = problemIR.provenance?.find((item) => item.value === problemIR.latex) || problemIR.provenance?.find((item) => item.sourceField === "text");
    return { ...base, status: matches ? "DETERMINISTIC_PASS" : "DETERMINISTIC_FAIL", problemType: parsed.type, criticalPoints: points, signAnalysis: signs, expectedSolutionSet: { intervals: expectedIntervals }, candidateSolutionSet: candidate, checks: [{ type: "INTERVAL_SET_COMPARISON", passed: matches, detail: matches ? "Candidate interval set matches deterministic sign analysis." : "Candidate interval set differs from deterministic sign analysis." }], reasons: matches ? [] : ["Candidate interval set is incorrect."], provenance: [{ id: "source_inequality", kind: sourceProvenance?.kind || "PROVIDER_INFERRED", value: parsed.source, sourceField: sourceProvenance?.sourceField || "problemIR.latex", trustedForAutomation: sourceProvenance?.trustedForAutomation === true }] };
  }
}
export const deterministicInequalityVerifier = new DeterministicInequalityVerifier();