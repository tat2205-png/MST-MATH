import { MathProblemIR, MathSolution, MathVerification } from "../../src/types/mathSchema.js";
import { createHash } from "node:crypto";
import { validateDeterministicVerification, validateMathGateResult } from "./mathRuntimeSchema.js";
import { deterministicLinearSystemVerifier, normalizeLinearSystemSource } from "./deterministicLinearSystemVerifier.js";

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
      if (!["LINEAR_EQUATION", "QUADRATIC_EQUATION", "LINEAR_SYSTEM_2X2", "LINEAR_INEQUALITY", "QUADRATIC_INEQUALITY", "RATIONAL_INEQUALITY", "UNSUPPORTED"].includes(String(deterministicVerification.problemType))) {
        reasons.push("Deterministic verification problem type is missing or invalid.");
      }
      const provenance = deterministicVerification.provenance;
      if (!Array.isArray(provenance) || !provenance.some((item) => isRecord(item) && item.kind === "SOURCE_LITERAL" && item.trustedForAutomation === true)) {
        reasons.push("Trusted source provenance is missing.");
      }
      if (deterministicVerification.problemType === "LINEAR_SYSTEM_2X2") {
        const source = normalizeLinearSystemSource(String(problemIR?.latex || ""));
        const expectedFingerprint = createHash("sha256").update(source).digest("hex");
        if (deterministicVerification.sourceFingerprint !== expectedFingerprint) reasons.push("Linear system source fingerprint does not match current source.");
        const sourceSegments = source.split(";");
        const sourceRecords = Array.isArray(provenance) ? provenance.filter((item) => isRecord(item) && item.kind === "SOURCE_LITERAL" && item.trustedForAutomation === true) : [];
        if (sourceRecords.length !== 2 || sourceRecords.some((item, index) => item.id !== `source_equation_${index + 1}` || item.value !== sourceSegments[index] || item.sourceField !== "problemIR.latex")) reasons.push("Both source equations need matching trusted source provenance.");
        const expectedTrace = ["NORMALIZE_EQUATION_1", "NORMALIZE_EQUATION_2", "COMPUTE_DETERMINANT", "CLASSIFY_SYSTEM", "SOLVE_EXACT_RATIONAL", "SUBSTITUTE_EQUATION_1", "SUBSTITUTE_EQUATION_2"];
        if (!Array.isArray(deterministicVerification.derivationTrace) || deterministicVerification.derivationTrace.length !== expectedTrace.length || deterministicVerification.derivationTrace.some((item, index) => !isRecord(item) || item.type !== expectedTrace[index] || !Array.isArray(item.derivedFrom) || item.derivedFrom.length !== 2)) reasons.push("Linear system derivation trace is incomplete or malformed.");
        const candidate = deterministicVerification.systemSolution;
        if (!isRecord(candidate)) reasons.push("Canonical linear system candidate is missing.");
        else if (candidate.type === "POINT" && (typeof candidate.x !== "string" || typeof candidate.y !== "string" || Object.keys(candidate).length !== 3)) reasons.push("Canonical point candidate coordinates are malformed.");
        else if ((candidate.type === "NO_SOLUTION" || candidate.type === "INFINITE_SOLUTIONS") && Object.keys(candidate).length !== 1) reasons.push("Canonical classification candidate is malformed.");
        const recomputed = deterministicLinearSystemVerifier.verify(problemIR, solution);
        if (recomputed.status !== "DETERMINISTIC_PASS" || recomputed.classification !== deterministicVerification.classification || JSON.stringify(recomputed.systemSolution) !== JSON.stringify(deterministicVerification.systemSolution)) reasons.push("Deterministic system result does not match a fresh verification.");
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
