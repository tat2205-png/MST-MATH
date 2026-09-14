import registryJson from "../../../registry/pimath-dna-math-notation-v1.0.json";
import {
  prepareMathNotationExpression,
  validateMathNotationRegistry,
  type MathNotationEnvelope,
  type MathNotationOutputChannel,
  type MathNotationRegistry,
} from "./index.js";

export const DEFAULT_MST_MATH_NOTATION_PROFILE = "VN_GDPT2018" as const;

export const MST_MATH_NOTATION_REGISTRY = registryJson as MathNotationRegistry;

const validation = validateMathNotationRegistry(MST_MATH_NOTATION_REGISTRY);
if (validation.status === "FAIL") {
  throw new Error(`MST_MATH_NOTATION_REGISTRY_INVALID: ${JSON.stringify(validation.issues)}`);
}

function canonicalLatexWithSafeControlWordBoundaries(envelope: MathNotationEnvelope): string | undefined {
  if (envelope.status === "FAIL") return undefined;

  let result = "";
  let cursor = 0;
  for (const token of envelope.semanticTokens) {
    result += envelope.source.slice(cursor, token.start);
    result += token.canonicalLatex;

    const next = envelope.source[token.end];
    // A TeX control word consumes following ASCII letters. When a Unicode/alias token
    // such as ⊂ is canonicalized to \\subset immediately before B, emit a separator so
    // TeX sees "\\subset B" rather than the undefined control sequence "\\subsetB".
    if (/^\\[A-Za-z]+$/.test(token.canonicalLatex) && next && /[A-Za-z]/.test(next)) {
      result += " ";
    }
    cursor = token.end;
  }
  result += envelope.source.slice(cursor);
  return result;
}

export function prepareMstMathNotation(
  source: string,
  options: { profileId?: string; output?: MathNotationOutputChannel } = {},
): MathNotationEnvelope {
  const prepared = prepareMathNotationExpression(MST_MATH_NOTATION_REGISTRY, source, {
    profileId: options.profileId ?? DEFAULT_MST_MATH_NOTATION_PROFILE,
    ...(options.output ? { output: options.output } : {}),
  });

  if (prepared.status === "FAIL") return prepared;
  return {
    ...prepared,
    canonicalLatex: canonicalLatexWithSafeControlWordBoundaries(prepared),
  };
}
