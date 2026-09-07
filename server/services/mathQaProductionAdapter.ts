import type { DocumentIR } from "../../src/modules/document-engine/document-ir.js";
import { runMathQA, type MathQAInput, type MathQAQuestion, type MathQAResult } from "../../src/modules/math-qa-v1/index.js";
import { deterministicMathVerifier } from "./deterministicMathVerifier.js";
import type { MathProblemIR, MathSolution } from "../../src/types/mathSchema.js";

const candidateRoots = (value: string): string[] | undefined => {
  const roots = value.split(/[,;]|\s+or\s+/i).map(item => item.trim()).filter(Boolean);
  return roots.length ? roots : undefined;
};

function problemFor(expression: { raw: string; sourceLocation?: string }): MathProblemIR {
  return {
    problem: expression.raw, latex: expression.raw, domain: "Đại số & Giải tích", topic: "Deterministic equation verification", grade: "Lớp 10",
    given: [], find: [], entities: [], constraints: [], ambiguities: [], confidence: 1, status: "PASS",
    sourceHash: expression.sourceLocation, provenance: [{ id: "source_equation", kind: "SOURCE_LITERAL", value: expression.raw, sourceField: "problemIR.latex", trustedForAutomation: true }],
  };
}

function verifyQuestion(question: MathQAQuestion): MathQAQuestion {
  const expression = question.expressions.length === 1 ? question.expressions[0] : undefined;
  const candidate = question.providedAnswer ?? question.expectedAnswer;
  if (!expression || !candidate) return { ...question, answerVerification: { status: "UNVERIFIED", verifier: "deterministicMathVerifier", evidence: "Missing exactly one supported expression or structured candidate answer." } };
  const problem = problemFor(expression);
  const solution = { verification_data: { roots: candidateRoots(candidate) } } as unknown as MathSolution;
  const result = deterministicMathVerifier.verify(problem, solution);
  const evidence = JSON.stringify({ questionId: question.id, sourceLocation: expression.sourceLocation, source: expression.raw, verifier: "deterministicMathVerifier", status: result.status, candidateSolutions: result.candidateSolutions });
  return { ...question, answerVerification: { status: result.status === "DETERMINISTIC_PASS" ? "VERIFIED" : result.status === "UNSUPPORTED" ? "UNSUPPORTED" : "UNVERIFIED", verifier: "deterministicMathVerifier", evidence } };
}

/** Server-only orchestration: invokes the existing deterministic verifier before Math QA. */
export function runProductionMathQA(input: MathQAInput): MathQAResult {
  const questions = (input.questions ?? []).map(verifyQuestion);
  return runMathQA({ ...input, questions });
}

export type ProductionMathQAInput = { raw: DocumentIR; normalized: MathQAInput["normalized"]; questions: MathQAQuestion[] };
