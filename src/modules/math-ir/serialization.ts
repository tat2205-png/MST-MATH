import type { MathDocument } from "./types.js";
import { validateMathIR, type MathIRValidationResult } from "./validation.js";

export interface MathIRDeserializeResult {
  status: "PASS" | "FAIL";
  value?: MathDocument;
  validation: MathIRValidationResult;
}

export function serializeMathIR(value: MathDocument): string {
  const validation = validateMathIR(value);
  if (validation.status === "FAIL") throw new Error(`MATH_IR_VALIDATION_FAILED: ${validation.issues.map((issue) => `${issue.code}@${issue.path}`).join(", ")}`);
  return JSON.stringify(value);
}

export function deserializeMathIR(serialized: string): MathIRDeserializeResult {
  let value: unknown;
  try {
    value = JSON.parse(serialized);
  } catch {
    const validation: MathIRValidationResult = { status: "FAIL", issues: [{ code: "INVALID_JSON", severity: "error", path: "$", message: "Serialized Math IR is not valid JSON." }] };
    return { status: "FAIL", validation };
  }
  const validation = validateMathIR(value);
  return validation.status === "PASS" ? { status: "PASS", value: value as MathDocument, validation } : { status: "FAIL", validation };
}
