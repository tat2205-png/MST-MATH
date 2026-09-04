export const MATH_NOTATION_OUTPUT_CHANNELS = ["PDF", "DOCX", "HTML", "SLIDES", "VIDEO", "TTS"] as const;
export type MathNotationOutputChannel = (typeof MATH_NOTATION_OUTPUT_CHANNELS)[number];

export const MATH_NOTATION_FAILURE_CODES = [
  "MATH_NOTATION_AMBIGUITY",
  "MATH_NOTATION_UNKNOWN_TOKEN",
  "MATH_NOTATION_RENDER_FAILURE",
  "MATH_NOTATION_SEMANTIC_LOSS",
  "MATH_NOTATION_NARRATION_MISMATCH",
] as const;
export type MathNotationFailureCode = (typeof MATH_NOTATION_FAILURE_CODES)[number];

export interface MathNotationEntry {
  symbolId: string;
  semantic: string;
  canonicalLatex: string;
  unicode: string | null;
  aliases: string[];
  spokenVi: string;
  category: string;
  outputs: MathNotationOutputChannel[];
}

export interface MathNotationRegistry {
  standardId: string;
  version: string;
  productDisplayName: string;
  status: string;
  canonical: boolean;
  approvalRequired: boolean;
  outputChannels: MathNotationOutputChannel[];
  failureCodes: MathNotationFailureCode[];
  entries: MathNotationEntry[];
}

export interface MathNotationIssue {
  code: MathNotationFailureCode | "MATH_NOTATION_REGISTRY_INVALID";
  message: string;
  symbolId?: string;
  token?: string;
}

export interface MathNotationRegistryValidation {
  status: "PASS" | "FAIL";
  issues: MathNotationIssue[];
}

export interface MathNotationResolution {
  status: "PASS" | "FAIL";
  entry?: MathNotationEntry;
  issue?: MathNotationIssue;
}

function isOutputChannel(value: unknown): value is MathNotationOutputChannel {
  return typeof value === "string" && (MATH_NOTATION_OUTPUT_CHANNELS as readonly string[]).includes(value);
}

function isEntry(value: unknown): value is MathNotationEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<MathNotationEntry>;
  return typeof entry.symbolId === "string"
    && entry.symbolId.length > 0
    && typeof entry.semantic === "string"
    && entry.semantic.length > 0
    && typeof entry.canonicalLatex === "string"
    && entry.canonicalLatex.length > 0
    && (entry.unicode === null || typeof entry.unicode === "string")
    && Array.isArray(entry.aliases)
    && entry.aliases.every((alias) => typeof alias === "string" && alias.length > 0)
    && typeof entry.spokenVi === "string"
    && entry.spokenVi.length > 0
    && typeof entry.category === "string"
    && entry.category.length > 0
    && Array.isArray(entry.outputs)
    && entry.outputs.length > 0
    && entry.outputs.every(isOutputChannel);
}

function tokenKeys(entry: MathNotationEntry): string[] {
  return [entry.canonicalLatex, ...(entry.unicode ? [entry.unicode] : []), ...entry.aliases];
}

export function validateMathNotationRegistry(value: unknown): MathNotationRegistryValidation {
  const issues: MathNotationIssue[] = [];
  if (!value || typeof value !== "object") {
    return { status: "FAIL", issues: [{ code: "MATH_NOTATION_REGISTRY_INVALID", message: "Registry root must be an object." }] };
  }

  const registry = value as Partial<MathNotationRegistry>;
  if (typeof registry.standardId !== "string" || registry.standardId.length === 0) {
    issues.push({ code: "MATH_NOTATION_REGISTRY_INVALID", message: "standardId is required." });
  }
  if (!Array.isArray(registry.entries)) {
    issues.push({ code: "MATH_NOTATION_REGISTRY_INVALID", message: "entries must be an array." });
    return { status: "FAIL", issues };
  }

  const symbolIds = new Set<string>();
  const tokenOwners = new Map<string, string>();
  for (const rawEntry of registry.entries) {
    if (!isEntry(rawEntry)) {
      issues.push({ code: "MATH_NOTATION_REGISTRY_INVALID", message: "Every registry entry must satisfy the V1 notation schema." });
      continue;
    }
    const entry = rawEntry;
    if (symbolIds.has(entry.symbolId)) {
      issues.push({ code: "MATH_NOTATION_REGISTRY_INVALID", symbolId: entry.symbolId, message: `Duplicate symbolId: ${entry.symbolId}` });
    }
    symbolIds.add(entry.symbolId);

    for (const token of tokenKeys(entry)) {
      const owner = tokenOwners.get(token);
      if (owner && owner !== entry.symbolId) {
        issues.push({
          code: "MATH_NOTATION_AMBIGUITY",
          symbolId: entry.symbolId,
          token,
          message: `Token ${JSON.stringify(token)} maps to both ${owner} and ${entry.symbolId}.`,
        });
      } else {
        tokenOwners.set(token, entry.symbolId);
      }
    }
  }

  return { status: issues.length === 0 ? "PASS" : "FAIL", issues };
}

export function resolveMathNotationToken(registry: MathNotationRegistry, token: string): MathNotationResolution {
  const normalized = token.trim();
  if (!normalized) {
    return { status: "FAIL", issue: { code: "MATH_NOTATION_UNKNOWN_TOKEN", token, message: "Notation token cannot be empty." } };
  }

  const matches = registry.entries.filter((entry) => tokenKeys(entry).includes(normalized));
  if (matches.length === 0) {
    return {
      status: "FAIL",
      issue: { code: "MATH_NOTATION_UNKNOWN_TOKEN", token: normalized, message: `Unknown notation token: ${normalized}` },
    };
  }
  if (matches.length > 1) {
    return {
      status: "FAIL",
      issue: { code: "MATH_NOTATION_AMBIGUITY", token: normalized, message: `Ambiguous notation token: ${normalized}` },
    };
  }
  return { status: "PASS", entry: matches[0] };
}

export function validateMathNotationRenderable(
  registry: MathNotationRegistry,
  token: string,
  output: MathNotationOutputChannel,
): MathNotationResolution {
  const resolution = resolveMathNotationToken(registry, token);
  if (resolution.status === "FAIL" || !resolution.entry) return resolution;
  if (!resolution.entry.outputs.includes(output)) {
    return {
      status: "FAIL",
      issue: {
        code: "MATH_NOTATION_RENDER_FAILURE",
        token,
        symbolId: resolution.entry.symbolId,
        message: `${resolution.entry.symbolId} is not declared renderable for ${output}.`,
      },
    };
  }
  if (output === "TTS" && !resolution.entry.spokenVi.trim()) {
    return {
      status: "FAIL",
      issue: {
        code: "MATH_NOTATION_NARRATION_MISMATCH",
        token,
        symbolId: resolution.entry.symbolId,
        message: `${resolution.entry.symbolId} has no Vietnamese narration mapping.`,
      },
    };
  }
  return resolution;
}

export function canonicalizeMathNotationToken(registry: MathNotationRegistry, token: string): MathNotationResolution & { canonicalLatex?: string } {
  const resolution = resolveMathNotationToken(registry, token);
  if (resolution.status === "FAIL" || !resolution.entry) return resolution;
  return { ...resolution, canonicalLatex: resolution.entry.canonicalLatex };
}
