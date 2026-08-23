import type {
  GenerativeMotionArtifact,
  GenerativeMotionArtifactInput,
  GenerativeMotionProvenance,
} from "./types.ts";

export * from "./types.ts";

function requireNonEmpty(value: unknown, name: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${name} must be a non-empty string.`);
  }
}

function normalizeProvenance(value: GenerativeMotionProvenance): GenerativeMotionProvenance {
  requireNonEmpty(value.providerId, "Generative provider ID");
  requireNonEmpty(value.promptDigest, "Generative prompt digest");
  if (value.model !== undefined) requireNonEmpty(value.model, "Generative model");
  return Object.freeze({
    providerId: value.providerId,
    ...(value.model === undefined ? {} : { model: value.model }),
    promptDigest: value.promptDigest,
  });
}

export function createGenerativeMotionArtifact(
  input: GenerativeMotionArtifactInput,
): GenerativeMotionArtifact {
  requireNonEmpty(input.id, "Generative artifact ID");
  requireNonEmpty(input.source, "Generative artifact source");
  const mediaTypes = new Set(["video/mp4", "video/webm", "image/gif"]);
  if (!mediaTypes.has(input.mediaType)) {
    throw new TypeError("Generative artifact media type must be video/mp4, video/webm, or image/gif.");
  }
  return Object.freeze({
    version: 1 as const,
    id: input.id,
    source: input.source,
    mediaType: input.mediaType,
    authoritative: false as const,
    geometryAuthority: "none" as const,
    provenance: normalizeProvenance(input.provenance),
    warning: "GENERATIVE_OUTPUT_IS_NON_AUTHORITATIVE" as const,
  });
}

export function assertGenerativeMotionIsNonAuthoritative(
  value: unknown,
): asserts value is GenerativeMotionArtifact {
  if (typeof value !== "object" || value === null ||
      (value as { authoritative?: unknown }).authoritative !== false ||
      (value as { geometryAuthority?: unknown }).geometryAuthority !== "none" ||
      (value as { warning?: unknown }).warning !== "GENERATIVE_OUTPUT_IS_NON_AUTHORITATIVE") {
    throw new TypeError("Generative motion must be explicitly non-authoritative.");
  }
}
