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

export interface MathNotationProfileSemantic {
  semantic: string;
  spokenVi?: string;
}

export interface MathNotationEntry {
  symbolId: string;
  semantic: string;
  canonicalLatex: string;
  unicode: string | null;
  aliases: string[];
  spokenVi: string;
  category: string;
  profileSemantics?: Record<string, MathNotationProfileSemantic>;
  outputs: MathNotationOutputChannel[];
}

export interface MathNotationRegistry {
  standardId: string;
  version: string;
  productDisplayName: string;
  status: string;
  canonical: boolean;
  approvalRequired: boolean;
  notationProfiles?: string[];
  outputChannels: MathNotationOutputChannel[];
  failureCodes: MathNotationFailureCode[];
  entries: MathNotationEntry[];
}

export interface MathNotationIssue {
  code: MathNotationFailureCode | "MATH_NOTATION_REGISTRY_INVALID";
  message: string;
  symbolId?: string;
  token?: string;
  profileId?: string;
}

export interface MathNotationRegistryValidation {
  status: "PASS" | "FAIL";
  issues: MathNotationIssue[];
}

export interface MathNotationResolution {
  status: "PASS" | "FAIL";
  entry?: MathNotationEntry;
  effectiveSemantic?: string;
  effectiveSpokenVi?: string;
  profileId?: string;
  issue?: MathNotationIssue;
}

export interface MathNotationSemanticToken {
  token: string;
  canonicalLatex: string;
  symbolId: string;
  semantic: string;
  spokenVi: string;
  start: number;
  end: number;
}

export interface MathNotationEnvelope {
  status: "PASS" | "FAIL";
  source: string;
  canonicalLatex?: string;
  notationProfileId?: string;
  semanticTokens: MathNotationSemanticToken[];
  semanticSignature: string[];
  issues: MathNotationIssue[];
}

export interface PrepareMathNotationOptions {
  profileId?: string;
  output?: MathNotationOutputChannel;
}

function isOutputChannel(value: unknown): value is MathNotationOutputChannel {
  return typeof value === "string" && (MATH_NOTATION_OUTPUT_CHANNELS as readonly string[]).includes(value);
}

function isFailureCode(value: unknown): value is MathNotationFailureCode {
  return typeof value === "string" && (MATH_NOTATION_FAILURE_CODES as readonly string[]).includes(value);
}

function isProfileSemantics(value: unknown): value is Record<string, MathNotationProfileSemantic> {
  if (value === undefined) return true;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((item) => {
    if (!item || typeof item !== "object") return false;
    const profile = item as Partial<MathNotationProfileSemantic>;
    return typeof profile.semantic === "string"
      && profile.semantic.length > 0
      && (profile.spokenVi === undefined || (typeof profile.spokenVi === "string" && profile.spokenVi.length > 0));
  });
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
    && isProfileSemantics(entry.profileSemantics)
    && Array.isArray(entry.outputs)
    && entry.outputs.length > 0
    && entry.outputs.every(isOutputChannel);
}

function tokenKeys(entry: MathNotationEntry): string[] {
  return [entry.canonicalLatex, ...(entry.unicode ? [entry.unicode] : []), ...entry.aliases];
}

function profileIsDeclared(registry: MathNotationRegistry, profileId: string): boolean {
  return (registry.notationProfiles ?? []).includes(profileId);
}

function invalidProfile(profileId: string): MathNotationResolution {
  return {
    status: "FAIL",
    profileId,
    issue: {
      code: "MATH_NOTATION_AMBIGUITY",
      profileId,
      message: `Unknown notation profile: ${profileId}.`,
    },
  };
}

function resolveEffectiveSemantics(entry: MathNotationEntry, profileId?: string): MathNotationResolution {
  if (!entry.profileSemantics || Object.keys(entry.profileSemantics).length === 0) {
    return {
      status: "PASS",
      entry,
      effectiveSemantic: entry.semantic,
      effectiveSpokenVi: entry.spokenVi,
      ...(profileId ? { profileId } : {}),
    };
  }

  if (!profileId) {
    return {
      status: "FAIL",
      entry,
      issue: {
        code: "MATH_NOTATION_AMBIGUITY",
        symbolId: entry.symbolId,
        message: `${entry.symbolId} is profile-dependent and requires a notation profile.`,
      },
    };
  }

  const profile = entry.profileSemantics[profileId];
  if (!profile) {
    return {
      status: "FAIL",
      entry,
      profileId,
      issue: {
        code: "MATH_NOTATION_AMBIGUITY",
        symbolId: entry.symbolId,
        profileId,
        message: `${entry.symbolId} has no declared semantics for notation profile ${profileId}.`,
      },
    };
  }

  return {
    status: "PASS",
    entry,
    profileId,
    effectiveSemantic: profile.semantic,
    effectiveSpokenVi: profile.spokenVi ?? entry.spokenVi,
  };
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
  if (typeof registry.version !== "string" || registry.version.length === 0) {
    issues.push({ code: "MATH_NOTATION_REGISTRY_INVALID", message: "version is required." });
  }
  if (!Array.isArray(registry.outputChannels) || registry.outputChannels.length === 0 || !registry.outputChannels.every(isOutputChannel)) {
    issues.push({ code: "MATH_NOTATION_REGISTRY_INVALID", message: "outputChannels must contain valid declared channels." });
  }
  if (!Array.isArray(registry.failureCodes) || registry.failureCodes.length === 0 || !registry.failureCodes.every(isFailureCode)) {
    issues.push({ code: "MATH_NOTATION_REGISTRY_INVALID", message: "failureCodes must contain valid notation failure codes." });
  }
  if (registry.notationProfiles !== undefined && (!Array.isArray(registry.notationProfiles)
      || registry.notationProfiles.some((profile) => typeof profile !== "string" || profile.length === 0)
      || new Set(registry.notationProfiles).size !== registry.notationProfiles.length)) {
    issues.push({ code: "MATH_NOTATION_REGISTRY_INVALID", message: "notationProfiles must contain unique non-empty profile IDs." });
  }
  if (!Array.isArray(registry.entries)) {
    issues.push({ code: "MATH_NOTATION_REGISTRY_INVALID", message: "entries must be an array." });
    return { status: "FAIL", issues };
  }

  const declaredProfiles = new Set(Array.isArray(registry.notationProfiles) ? registry.notationProfiles : []);
  const declaredOutputs = new Set(Array.isArray(registry.outputChannels) ? registry.outputChannels : []);
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

    for (const output of entry.outputs) {
      if (!declaredOutputs.has(output)) {
        issues.push({
          code: "MATH_NOTATION_REGISTRY_INVALID",
          symbolId: entry.symbolId,
          message: `${entry.symbolId} declares output ${output} outside registry.outputChannels.`,
        });
      }
    }

    for (const profileId of Object.keys(entry.profileSemantics ?? {})) {
      if (!declaredProfiles.has(profileId)) {
        issues.push({
          code: "MATH_NOTATION_REGISTRY_INVALID",
          symbolId: entry.symbolId,
          profileId,
          message: `Undeclared notation profile ${profileId} used by ${entry.symbolId}.`,
        });
      }
    }

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

export function resolveMathNotationToken(
  registry: MathNotationRegistry,
  token: string,
  profileId?: string,
): MathNotationResolution {
  if (profileId && !profileIsDeclared(registry, profileId)) return invalidProfile(profileId);

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
  return resolveEffectiveSemantics(matches[0], profileId);
}

export function validateMathNotationRenderable(
  registry: MathNotationRegistry,
  token: string,
  output: MathNotationOutputChannel,
  profileId?: string,
): MathNotationResolution {
  const resolution = resolveMathNotationToken(registry, token, profileId);
  if (resolution.status === "FAIL" || !resolution.entry) return resolution;
  if (!resolution.entry.outputs.includes(output)) {
    return {
      status: "FAIL",
      issue: {
        code: "MATH_NOTATION_RENDER_FAILURE",
        token,
        symbolId: resolution.entry.symbolId,
        profileId,
        message: `${resolution.entry.symbolId} is not declared renderable for ${output}.`,
      },
    };
  }
  if (output === "TTS" && !resolution.effectiveSpokenVi?.trim()) {
    return {
      status: "FAIL",
      issue: {
        code: "MATH_NOTATION_NARRATION_MISMATCH",
        token,
        symbolId: resolution.entry.symbolId,
        profileId,
        message: `${resolution.entry.symbolId} has no Vietnamese narration mapping.`,
      },
    };
  }
  return resolution;
}

export function canonicalizeMathNotationToken(
  registry: MathNotationRegistry,
  token: string,
  profileId?: string,
): MathNotationResolution & { canonicalLatex?: string } {
  const resolution = resolveMathNotationToken(registry, token, profileId);
  if (resolution.status === "FAIL" || !resolution.entry) return resolution;
  return { ...resolution, canonicalLatex: resolution.entry.canonicalLatex };
}

function isAsciiLetter(character: string | undefined): boolean {
  return Boolean(character && /[A-Za-z]/.test(character));
}

function tokenMatchesAt(source: string, offset: number, token: string): boolean {
  if (!source.startsWith(token, offset)) return false;
  // LaTeX control words end at the first non-letter. Prevent matching \\in inside \\infty-like commands.
  if (/^\\[A-Za-z]+$/.test(token)) {
    const next = source[offset + token.length];
    if (isAsciiLetter(next)) return false;
  }
  return true;
}

interface IndexedNotationToken {
  token: string;
  entry: MathNotationEntry;
}

function buildExpressionTokenIndex(registry: MathNotationRegistry): IndexedNotationToken[] {
  const indexed: IndexedNotationToken[] = [];
  for (const entry of registry.entries) {
    for (const token of tokenKeys(entry)) indexed.push({ token, entry });
  }
  return indexed.sort((a, b) => b.token.length - a.token.length || a.token.localeCompare(b.token));
}

/**
 * Prepares a mathematical expression for an output adapter without pretending to parse all mathematics.
 * Math IR remains the mathematical source of truth; this function only canonicalizes registered notation
 * tokens and records a semantic signature for cross-output verification.
 */
export function prepareMathNotationExpression(
  registry: MathNotationRegistry,
  source: string,
  options: PrepareMathNotationOptions = {},
): MathNotationEnvelope {
  const registryValidation = validateMathNotationRegistry(registry);
  if (registryValidation.status === "FAIL") {
    return {
      status: "FAIL",
      source,
      ...(options.profileId ? { notationProfileId: options.profileId } : {}),
      semanticTokens: [],
      semanticSignature: [],
      issues: registryValidation.issues,
    };
  }

  if (options.profileId && !profileIsDeclared(registry, options.profileId)) {
    const resolution = invalidProfile(options.profileId);
    return {
      status: "FAIL",
      source,
      notationProfileId: options.profileId,
      semanticTokens: [],
      semanticSignature: [],
      issues: resolution.issue ? [resolution.issue] : [],
    };
  }

  const tokenIndex = buildExpressionTokenIndex(registry);
  const semanticTokens: MathNotationSemanticToken[] = [];
  const issues: MathNotationIssue[] = [];
  let canonicalLatex = "";
  let cursor = 0;

  while (cursor < source.length) {
    const match = tokenIndex.find((candidate) => tokenMatchesAt(source, cursor, candidate.token));
    if (!match) {
      canonicalLatex += source[cursor];
      cursor += 1;
      continue;
    }

    const resolution = options.output
      ? validateMathNotationRenderable(registry, match.token, options.output, options.profileId)
      : resolveMathNotationToken(registry, match.token, options.profileId);

    if (resolution.status === "FAIL" || !resolution.entry || !resolution.effectiveSemantic || !resolution.effectiveSpokenVi) {
      if (resolution.issue) issues.push(resolution.issue);
      canonicalLatex += match.token;
      cursor += match.token.length;
      continue;
    }

    const canonical = resolution.entry.canonicalLatex;
    semanticTokens.push({
      token: match.token,
      canonicalLatex: canonical,
      symbolId: resolution.entry.symbolId,
      semantic: resolution.effectiveSemantic,
      spokenVi: resolution.effectiveSpokenVi,
      start: cursor,
      end: cursor + match.token.length,
    });
    canonicalLatex += canonical;
    cursor += match.token.length;
  }

  const semanticSignature = semanticTokens.map((item) => `${item.symbolId}:${item.semantic}`);
  return {
    status: issues.length === 0 ? "PASS" : "FAIL",
    source,
    canonicalLatex: issues.length === 0 ? canonicalLatex : undefined,
    ...(options.profileId ? { notationProfileId: options.profileId } : {}),
    semanticTokens,
    semanticSignature,
    issues,
  };
}

export function verifyMathNotationSemanticSignature(
  before: MathNotationEnvelope,
  after: MathNotationEnvelope,
): MathNotationIssue | undefined {
  if (before.status === "FAIL") return before.issues[0];
  if (after.status === "FAIL") return after.issues[0];
  if (before.semanticSignature.length !== after.semanticSignature.length
      || before.semanticSignature.some((item, index) => item !== after.semanticSignature[index])) {
    return {
      code: "MATH_NOTATION_SEMANTIC_LOSS",
      message: `Notation semantic signature changed from ${JSON.stringify(before.semanticSignature)} to ${JSON.stringify(after.semanticSignature)}.`,
    };
  }
  return undefined;
}
