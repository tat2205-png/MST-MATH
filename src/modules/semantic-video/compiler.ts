import { createLatexBackendConfig, getOutputProfile } from "./outputProfiles.js";
import { fingerprintRenderManifest, serializeRenderManifest } from "./serialization.js";
import { SEMANTIC_VIDEO_SCHEMA_VERSION } from "./types.js";
import type {
  RenderManifest,
  SemanticVideoCompileInput,
  SemanticVideoCompileResult,
} from "./types.js";
import { validateSemanticVideoManifest } from "./validation.js";

/**
 * Compile validated semantic data into the renderer-facing manifest.
 *
 * The compiler is deliberately deterministic and contains no renderer calls.
 * A Manim/HTML/Slides adapter consumes the returned manifest later.
 */
export function compileSemanticVideo(input: SemanticVideoCompileInput): SemanticVideoCompileResult {
  const outputProfile = getOutputProfile(input.outputProfileId);
  const manifest: RenderManifest = {
    schemaVersion: SEMANTIC_VIDEO_SCHEMA_VERSION,
    id: input.id,
    mathDocumentId: input.document.id,
    motion: structuredClone(input.motion),
    narration: structuredClone(input.narration),
    timeline: structuredClone(input.timeline),
    outputProfile,
    renderer: input.renderer ?? "manim",
    latex: createLatexBackendConfig(input.latex),
    metadata: input.metadata ? structuredClone(input.metadata) : undefined,
  };

  const validation = validateSemanticVideoManifest(input.document, manifest);
  if (validation.status === "FAIL") return { status: "FAIL", issues: validation.issues };

  const canonicalJson = serializeRenderManifest(manifest);
  return {
    status: "PASS",
    manifest,
    canonicalJson,
    fingerprint: fingerprintRenderManifest(manifest),
    issues: [],
  };
}
