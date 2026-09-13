import type { MathProblemIR, MathSolution, MathVerification } from "../../src/types/mathSchema.js";
import { evaluateMathGate, type MathGateResult } from "../services/mathVerificationGate.js";
import { ProblemParserService } from "../services/problemParser.js";
import { SolutionGeneratorService } from "../services/solutionGenerator.js";
import { SolutionVerifierService } from "../services/solutionVerifier.js";

export interface StudioMathServices {
  parse(text: string): Promise<MathProblemIR>;
  solve(problem: MathProblemIR): Promise<MathSolution>;
  verify(problem: MathProblemIR, solution: MathSolution): Promise<MathVerification>;
  gate(problem: MathProblemIR, solution: MathSolution, verification: MathVerification): MathGateResult;
}

export interface StudioMathExecution {
  readonly input: string;
  readonly parsed: Readonly<{ status: string; latex: string; topic: string }>;
  readonly result: Readonly<{ value: string; latex: string }>;
  readonly verification: Readonly<{ status: string; seal: string; deterministicStatus: string; gateStatus: string }>;
  readonly engine: "math-ai";
}

function createExistingMathServices(): StudioMathServices {
  const parser = new ProblemParserService();
  const solver = new SolutionGeneratorService();
  const verifier = new SolutionVerifierService();
  return {
    parse: (text) => parser.parseProblem({ text, sourceType: "text" }),
    solve: (problem) => solver.generateSolution(problem),
    verify: (problem, solution) => verifier.verifySolution(problem, solution),
    gate: evaluateMathGate,
  };
}

export class StudioMathExecutionAdapter {
  constructor(private readonly services: StudioMathServices = createExistingMathServices()) {}

  parse(text: string) {
    return this.services.parse(text);
  }

  solve(problem: MathProblemIR) {
    return this.services.solve(problem);
  }

  verify(problem: MathProblemIR, solution: MathSolution) {
    return this.services.verify(problem, solution);
  }

  result(text: string, problem: MathProblemIR, solution: MathSolution, verification: MathVerification): StudioMathExecution | null {
    const gate = this.services.gate(problem, solution, verification);
    if (!gate.allowed) return null;
    return Object.freeze({
      input: text,
      parsed: Object.freeze({ status: problem.status, latex: problem.latex, topic: problem.topic }),
      result: Object.freeze({ value: solution.final_answer.value, latex: solution.final_answer.latex }),
      verification: Object.freeze({
        status: verification.status,
        seal: verification.verification_seal,
        deterministicStatus: verification.deterministicVerification?.status ?? "MISSING",
        gateStatus: gate.status,
      }),
      engine: "math-ai",
    });
  }
}
