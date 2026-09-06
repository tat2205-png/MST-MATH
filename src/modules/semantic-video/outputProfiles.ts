import type { LatexBackendConfig, OutputProfile, OutputProfileId } from "./types.js";

const percentSafeArea = (top: number, right: number, bottom: number, left: number) => ({
  top,
  right,
  bottom,
  left,
});

/**
 * P0 profiles are intentionally small in number. The same semantic source must
 * render to both classroom/TV and social-video canvases without rewriting the
 * mathematics.
 */
export const OUTPUT_PROFILES: Readonly<Record<OutputProfileId, OutputProfile>> = Object.freeze({
  V01_TEACHER_CLEAN_16_9: Object.freeze({
    id: "V01_TEACHER_CLEAN_16_9",
    name: "Teacher Clean 16:9",
    width: 1920,
    height: 1080,
    fps: 30,
    aspectRatio: "16:9",
    stage: "P0_DEMO",
    safeArea: percentSafeArea(0.06, 0.05, 0.06, 0.05),
    teacherOverlay: false,
    captions: "optional",
  }),
  V02_SOCIAL_MATH_9_16: Object.freeze({
    id: "V02_SOCIAL_MATH_9_16",
    name: "Social Math 9:16",
    width: 1080,
    height: 1920,
    fps: 30,
    aspectRatio: "9:16",
    stage: "P0_DEMO",
    safeArea: percentSafeArea(0.08, 0.06, 0.12, 0.06),
    teacherOverlay: false,
    captions: "recommended",
  }),
  V03_TEACHER_OVERLAY: Object.freeze({
    id: "V03_TEACHER_OVERLAY",
    name: "Teacher Overlay 16:9",
    width: 1920,
    height: 1080,
    fps: 30,
    aspectRatio: "16:9",
    stage: "P1_PILOT",
    safeArea: percentSafeArea(0.06, 0.05, 0.06, 0.05),
    teacherOverlay: true,
    captions: "optional",
  }),
});

export const DEFAULT_LATEX_BACKEND: Readonly<LatexBackendConfig> = Object.freeze({
  engine: "lualatex",
  templateId: "MST_MATH_VIDEO_LATEX_V1",
  unicodeText: true,
  failOnLatexError: true,
});

export function getOutputProfile(id: OutputProfileId): OutputProfile {
  const profile = OUTPUT_PROFILES[id];
  return {
    ...profile,
    safeArea: { ...profile.safeArea },
    metadata: profile.metadata ? { ...profile.metadata } : undefined,
  };
}

export function createLatexBackendConfig(overrides: Partial<LatexBackendConfig> = {}): LatexBackendConfig {
  return {
    ...DEFAULT_LATEX_BACKEND,
    ...overrides,
    metadata: overrides.metadata ? { ...overrides.metadata } : undefined,
  };
}
