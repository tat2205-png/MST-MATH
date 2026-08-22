import {
  loadSkillCore,
  loadSkillModules,
  SkillMetadata,
  SkillReferenceName,
} from "./skillLoader.js";

export type VideoTaskMode =
  | "MATH_SOLVE"
  | "GRAPH_2D"
  | "GEOMETRY_2D"
  | "GEOMETRY_3D"
  | "ORTHOGRAPHIC_PROJECTION"
  | "INFOGRAPHIC"
  | "CAMERA"
  | "NARRATION"
  | "MANIM_VIDEO_CREATE"
  | "MANIM_VIDEO_REPAIR"
  | "VIDEO_QA";

export interface SkillRoute {
  skillName: string;
  modules: SkillReferenceName[];
}

export interface ActiveSkillContext {
  skillName: string;
  mode: VideoTaskMode;
  metadata: SkillMetadata;
  coreInstruction: string;
  activeModules: SkillReferenceName[];
  references: Record<string, string>;
}

const DEFAULT_SKILL_NAME = "manim-cinematic-video";

const ROUTE_MAP: Record<VideoTaskMode, SkillReferenceName[]> = {
  MATH_SOLVE: ["MATH_GEOMETRY_QA"],
  GRAPH_2D: ["MATH_GEOMETRY_QA"],
  GEOMETRY_2D: ["MATH_GEOMETRY_QA"],
  GEOMETRY_3D: ["MATH_GEOMETRY_QA"],
  ORTHOGRAPHIC_PROJECTION: ["MATH_GEOMETRY_QA"],
  INFOGRAPHIC: ["STYLE_REFERENCE_FACEBOOK_V1", "VISUAL_SYSTEM", "CAMERA_DIRECTOR"],
  CAMERA: ["CAMERA_DIRECTOR"],
  NARRATION: ["NARRATION_SYNC"],
  MANIM_VIDEO_CREATE: [
    "STYLE_REFERENCE_FACEBOOK_V1",
    "CAMERA_DIRECTOR",
    "VISUAL_SYSTEM",
    "MATH_GEOMETRY_QA",
    "NARRATION_SYNC",
    "WORKFLOW",
  ],
  MANIM_VIDEO_REPAIR: [
    "MATH_GEOMETRY_QA",
    "CAMERA_DIRECTOR",
    "NARRATION_SYNC",
    "WORKFLOW",
  ],
  VIDEO_QA: [
    "MATH_GEOMETRY_QA",
    "CAMERA_DIRECTOR",
    "NARRATION_SYNC",
    "WORKFLOW",
  ],
};

/**
 * Deterministic routing for video task modes
 */
export function routeSkill(mode: VideoTaskMode): SkillRoute {
  const modules = ROUTE_MAP[mode];
  if (!modules) {
    throw new Error(`Unknown video task mode: "${mode}"`);
  }

  return {
    skillName: DEFAULT_SKILL_NAME,
    modules: [...modules],
  };
}

/**
 * Builds the active skill context for the requested mode
 * Loads core instructions and only the selectively required module references
 */
export async function buildActiveSkillContext(
  mode: VideoTaskMode
): Promise<ActiveSkillContext> {
  const route = routeSkill(mode);
  const coreSkill = await loadSkillCore(route.skillName);
  const selectiveReferences = await loadSkillModules(route.skillName, route.modules);

  return {
    skillName: route.skillName,
    mode,
    metadata: coreSkill.metadata,
    coreInstruction: coreSkill.coreInstruction,
    activeModules: route.modules,
    references: selectiveReferences,
  };
}
