import { MathProblemIR, MathSolution, MathVerification } from "../../src/types/mathSchema.js";
import { validateDeterministicVerification, validateMathGateResult } from "./mathRuntimeSchema.js";

export type MathGateStatus = "VERIFIED_PASS" | "BLOCKED" | "HUMAN_REVIEW_REQUIRED";

export interface MathGateResult {
  allowed: boolean;
  status: MathGateStatus;
  reasons: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function evaluateMathGate(
  problemIR: MathProblemIR | null | undefined,
  solution: MathSolution | null | undefined,
  verification: MathVerification | null | undefined
): MathGateResult {
  const reasons: string[] = [];

  if (!problemIR || problemIR.status !== "PASS") {
    reasons.push(`Problem status is not resolved: ${problemIR?.status || "MISSING"}.`);
  }

  if (!solution || !isRecord(solution)) {
    reasons.push("Solution is missing or malformed.");
  }

  if (!isRecord(verification)) {
    reasons.push("Verification report is missing or malformed.");
  } else {
    if (verification.status !== "PASS") {
      reasons.push(`Verification status is not PASS: ${String(verification.status || "MISSING")}.`);
    }
    if (verification.verification_seal !== "CONFIRMED_VALID") {
      reasons.push("Verification seal is not CONFIRMED_VALID.");
    }
    if (!Array.isArray(verification.checks) || verification.checks.length === 0) {
      reasons.push("Verification checks are missing or empty.");
    }
    if (!Array.isArray(verification.discrepancies)) {
      reasons.push("Verification discrepancies are missing or malformed.");
    }
    const deterministicVerification = verification.deterministicVerification;
    if (!isRecord(deterministicVerification)) {
      reasons.push("Deterministic V1 verification is missing or malformed.");
    } else {
      const deterministicSchema = validateDeterministicVerification(deterministicVerification);
      if (!deterministicSchema.valid) reasons.push(...deterministicSchema.errors);
      if (deterministicVerification.status !== "DETERMINISTIC_PASS") {
        reasons.push(`Deterministic verification is not PASS: ${String(deterministicVerification.status || "MISSING")}.`);
      }
      if (deterministicVerification.engine !== "DETERMINISTIC_V1") {
        reasons.push("Deterministic verification engine is missing or invalid.");
      }
      if (!Array.isArray(deterministicVerification.checks) || deterministicVerification.checks.length === 0) {
        reasons.push("Deterministic verification checks are missing or empty.");
      }
      if (!Array.isArray(deterministicVerification.reasons)) {
        reasons.push("Deterministic verification reasons are missing or malformed.");
      }
      if (!["LINEAR_EQUATION", "QUADRATIC_EQUATION", "LINEAR_INEQUALITY", "QUADRATIC_INEQUALITY", "RATIONAL_INEQUALITY", "UNSUPPORTED"].includes(String(deterministicVerification.problemType))) {
        reasons.push("Deterministic verification problem type is missing or invalid.");
      }
      const provenance = deterministicVerification.provenance;
      if (!Array.isArray(provenance) || !provenance.some((item) => isRecord(item) && item.kind === "SOURCE_LITERAL" && item.trustedForAutomation === true)) {
        reasons.push("Trusted source provenance is missing.");
      }
    }
  }

  const result = reasons.length > 0
    ? {
        allowed: false,
        status: reasons.some((reason) => reason.includes("NEED_MORE_INFORMATION") || reason.includes("AMBIGUOUS") || reason.includes("INCONSISTENT") || reason.includes("provenance")) ? "HUMAN_REVIEW_REQUIRED" as const : "BLOCKED" as const,
        reasons,
      }
    : { allowed: true, status: "VERIFIED_PASS" as const, reasons: [] };
  if (!validateMathGateResult(result).valid) {
    return { allowed: false, status: "HUMAN_REVIEW_REQUIRED", reasons: ["Math gate result is malformed."] };
  }
  if (reasons.length > 0) {
    const requiresHumanReview = reasons.some((reason) =>
      reason.includes("NEED_MORE_INFORMATION") || reason.includes("AMBIGUOUS") || reason.includes("INCONSISTENT")
    );
    return {
      allowed: false,
      status: requiresHumanReview ? "HUMAN_REVIEW_REQUIRED" : "BLOCKED",
      reasons,
    };
  }

  return { allowed: true, status: "VERIFIED_PASS", reasons: [] };
}
