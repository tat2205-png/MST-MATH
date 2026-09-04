import visualRegistry from "../../registry/mst-math-output-visual-profiles-v1.0.json";
import outputRegistry from "../../registry/output-profiles.json";
import videoTypeScale from "../../standards/MST_MATH_VIDEO_TYPE_SCALE_V1_0/mst-math-video-type-scale-v1.0.json";
import gameVisualSystem from "../../standards/MST_MATH_GAME_VISUAL_SYSTEM_V1_0/mst-math-game-visual-system-v1.0.json";
import outputContentPolicy from "../../standards/MST_MATH_OUTPUT_CONTENT_PRESENTATION_POLICY_V1_1/mst-math-output-content-presentation-policy-v1.1.json";

export const MST_MATH_OUTPUT_VISUAL_PROFILE_REGISTRY = visualRegistry;
export const MST_MATH_VIDEO_TYPE_SCALE = videoTypeScale;
export const MST_MATH_GAME_VISUAL_SYSTEM = gameVisualSystem;
export const MST_MATH_OUTPUT_CONTENT_PRESENTATION_POLICY = outputContentPolicy;

export type MstMathVisualProfileId = (typeof visualRegistry.profiles)[number]["profileId"];

const compatibilityProfileAliases: Record<string, string> = {
  P06_EXAM_THPT: "P06_EXAM_THPTQG",
  "MST_MATH_VIDEO_VISUAL_CANONICAL_V2.0": "P07_VIDEO",
  "PIMATH_VIDEO_VISUAL_CANONICAL_V2.0": "P07_VIDEO",
};

function fail(message: string): never {
  throw new Error(`MST_MATH_OUTPUT_VISUAL_PROFILE_UNRESOLVED:${message}`);
}

function canonicalOutputProfileExists(profileId: string): boolean {
  if (outputRegistry.profiles.some((profile) => profile.profileId === profileId)) return true;
  const alias = outputRegistry.aliases?.[profileId as keyof typeof outputRegistry.aliases];
  return alias?.status === "COMPATIBILITY_ALIAS";
}

export function normalizeVisualProfileId(profileId: string): string {
  return compatibilityProfileAliases[profileId] ?? profileId;
}

export function resolveOutputVisualProfile(profileId: string) {
  const normalized = normalizeVisualProfileId(profileId);
  if (!canonicalOutputProfileExists(profileId) && !canonicalOutputProfileExists(normalized)) fail(`unknown-output:${profileId}`);
  const profile = visualRegistry.profiles.find((candidate) => candidate.profileId === normalized);
  if (!profile) fail(`profile:${profileId}`);
  if (visualRegistry.root !== "MST-MATH-DNA-V1.0" || visualRegistry.governance.noParallelDesignSystem !== true) fail("registry-root-or-governance");
  return {
    profile,
    registryId: visualRegistry.id,
    root: visualRegistry.root,
    status: visualRegistry.status,
    canonicalCandidate: visualRegistry.canonicalCandidate,
    authoritative: false as const,
    rendererMayOverrideCore: false as const,
  } as const;
}

export function resolveOutputContentPresentationPolicy() {
  if (
    outputContentPolicy.id !== "MST_MATH_OUTPUT_CONTENT_PRESENTATION_POLICY_V1.1" ||
    outputContentPolicy.status !== "LOCKED_CANONICAL_APPROVED" ||
    outputContentPolicy.canonical !== true ||
    outputContentPolicy.approved !== true ||
    outputContentPolicy.humanApproved !== true ||
    outputContentPolicy.inherits !== "MST_MATH_OUTPUT_CONTENT_PRESENTATION_POLICY_V1.0" ||
    outputContentPolicy.supersedes !== "MST_MATH_OUTPUT_CONTENT_PRESENTATION_POLICY_V1.0" ||
    outputRegistry.contentPresentationPolicy !== outputContentPolicy.id
  ) {
    fail("output-content-policy");
  }
  return { ...outputContentPolicy, authoritative: true as const } as const;
}

export function resolveVideoTypeScale() {
  if (videoTypeScale.id !== "MST_MATH_VIDEO_TYPE_SCALE_V1.0" || videoTypeScale.scope !== "VIDEO_TYPE_SCALE_ONLY") fail("video-type-scale");
  return { ...videoTypeScale, authoritative: false as const } as const;
}

export function resolveGameVisualSystem() {
  if (gameVisualSystem.id !== "MST_MATH_GAME_VISUAL_SYSTEM_V1.0" || gameVisualSystem.scope !== "CLASSROOM_GAME_VISUAL_LAYER_ONLY") fail("game-visual-system");
  if (gameVisualSystem.colorBindings.noOwnPalette !== true || gameVisualSystem.iconPolicy.authority !== "MST-MATH-DNA-SEMANTIC-ICONS-V1.1") fail("game-parallel-authority");
  return { ...gameVisualSystem, authoritative: false as const } as const;
}

export function validateOutputVisualProfileCoverage(): { ok: true; covered: string[] } {
  const activeFamilies = outputRegistry.profiles
    .map((profile) => profile.profileId)
    .filter((id) => /^P(?:0[1-9]|1[0-2])_/.test(id));
  const normalizedFamilies = [...new Set(activeFamilies.map(normalizeVisualProfileId))];
  const covered = normalizedFamilies.filter((id) => visualRegistry.profiles.some((profile) => profile.profileId === id));
  const missing = normalizedFamilies.filter((id) => !covered.includes(id));
  if (missing.length) fail(`coverage:${missing.join(",")}`);
  resolveOutputContentPresentationPolicy();
  return { ok: true, covered };
}
