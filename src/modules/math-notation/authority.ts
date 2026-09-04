import registryJson from "../../../registry/pimath-dna-math-notation-v1.0.json";
import {
  prepareMathNotationExpression,
  validateMathNotationRegistry,
  type MathNotationOutputChannel,
  type MathNotationRegistry,
} from "./index.js";

export const DEFAULT_MST_MATH_NOTATION_PROFILE = "VN_GDPT2018" as const;

export const MST_MATH_NOTATION_REGISTRY = registryJson as MathNotationRegistry;

const validation = validateMathNotationRegistry(MST_MATH_NOTATION_REGISTRY);
if (validation.status === "FAIL") {
  throw new Error(`MST_MATH_NOTATION_REGISTRY_INVALID: ${JSON.stringify(validation.issues)}`);
}

export function prepareMstMathNotation(
  source: string,
  options: { profileId?: string; output?: MathNotationOutputChannel } = {},
) {
  return prepareMathNotationExpression(MST_MATH_NOTATION_REGISTRY, source, {
    profileId: options.profileId ?? DEFAULT_MST_MATH_NOTATION_PROFILE,
    ...(options.output ? { output: options.output } : {}),
  });
}
