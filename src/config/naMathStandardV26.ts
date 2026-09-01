import colorSystem from "../../standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/design-system/color-system/NA_MATH_OUTPUT_COLOR_SYSTEM_V1_0.json";
import tokens from "../../standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/design-system/na_math_design_system_v1_3/src/modules/design-system/tokens/tokens.json";
import qaContracts from "../../standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/system-lock/NA_MATH_SYSTEM_CORE_LOCK_POLICY_V2_6.json";
import canonicalVideoLayout from "../../standards/NA_MATH_CANONICAL_LAYOUT_SPEC_V1_0/na-math-canonical-layout.v1.1.json";
import videoVisualLanguage from "../../standards/NA_MATH_VIDEO_VISUAL_LANGUAGE_V1_0/na-math-video-visual-language.v1.0.json";
import goldenVideoReference from "../../standards/NA_MATH_VIDEO_GOLDEN_START_MID_END_V1/na-math-video-golden-start-mid-end.v1.json";
import iconAuthority from "../../registry/pimath-dna-icons.json";
import canonicalVideoV2 from "../../standards/PIMATH_VIDEO_VISUAL_CANONICAL_V2_0/pimath-video-visual-canonical-v2.0.json";
import { resolveMathNotationAuthority, resolveSemanticGeometryAuthority } from "./naMathBrandRoot.js";

export type NaMathOutputIdentity = "learning_material" | "worksheet" | "exercise_sheet" | "video";
export type CanonicalMathStatus = "PASS" | "BLOCK_RENDER" | "REVIEW_REQUIRED";

const canonicalVideo = canonicalVideoLayout.video;
const mathNotationAuthority = resolveMathNotationAuthority();
const semanticGeometryAuthority = resolveSemanticGeometryAuthority();

export const NA_MATH_VIDEO_PROFILE = {
  id: canonicalVideoV2.id,
  canonicalProfileId: canonicalVideoV2.id,
  canonicalLayoutId: canonicalVideo.canonicalLayoutId,
  semanticOrder: canonicalVideo.semanticOrder,
  canvas: { ...canonicalVideo.canvas, fps: 30 },
  macroLayout: canonicalVideo.macroLayout,
  behavior: canonicalVideo.behavior,
  visualLanguage: videoVisualLanguage,
  goldenReference: goldenVideoReference,
  iconAuthority,
  iconRoles: { question: "QUESTION_SOURCE", solution: "SOLUTION_REASONING", figure: "GEOMETRY_FIGURE", result: "RESULT_SUCCESS" } as const,
  colors: {
    background: "#FCFCFA",
    video: "#E57C38",
    panelStroke: tokens.color.neutral.line,
    panelFill: tokens.color.neutral.paper,
  },
  typography: {
    title: "STIX Two Text Bold",
    section: "XCharter",
    body: "Libertinus Serif",
    question: "Libertinus Serif",
    math: "Libertinus Math",
    label: "XCharter",
  },
  regions: {
    topSafe: [-6.25, 6.25, 2.18, 3.32] as const,
    leftSafe: [-6.35, -0.25, -3.32, 1.08] as const,
    rightSafe: [0.25, 6.35, -3.32, 1.08] as const,
    topPanel: { width: 13.25, height: 1.62, center: [0, 2.78] as const },
    leftPanel: { width: 6.55, height: 5.35, center: [-3.42, -1.08] as const },
    rightPanel: { width: 6.55, height: 5.35, center: [3.42, -1.08] as const },
    problem: { maxWidth: 12.1, maxHeight: 0.98, center: [0, 2.72] as const },
    solution: { maxWidth: 5.75, maxHeight: 3.90, center: [-3.42, -1.15] as const },
    visual: { maxWidth: 5.65, maxHeight: 3.90, center: [3.42, -1.15] as const },
  },
  sizes: {
    panelTitle: 25,
    questionTag: 23,
    body: { min: 24, max: 26 },
    stepTitle: 29,
    math: { min: 27, max: 32 },
    result: 36,
    label: { min: 20, max: 24 },
  },
  spacing: {
    questionBlockGap: 0.12,
    solutionBlockGap: { min: 0.18, max: 0.24 },
  },
  animation: ["Write", "Create", "TransformMatchingTex", "Indicate", "Circumscribe", "Highlight", "light Camera zoom"] as const,
  layout: "approved two-frame teacher-video mapping" as const,
  noVisualPolicy: "KEEP_RIGHT_REGION_EMPTY" as const,
  proseEngine: "Text/VText" as const,
  mathEngine: "MathTex" as const,
} as const;

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

const canonicalCommands = new Set(
  Object.values(mathNotationAuthority.symbolRegistry.categories)
    .flat()
    .flatMap((entry) => `${entry[1]} ${entry[2]}`.match(/\\[A-Za-z]+/g) ?? []),
);

function validateMathSource(source: string): { status: CanonicalMathStatus; reasons: string[] } {
  const reasons: string[] = [];
  const rawSymbols = mathNotationAuthority.symbolRegistry.forbidden_raw_unicode_examples.filter((symbol) => source.includes(symbol));
  if (rawSymbols.length) reasons.push(`RAW_UNICODE_MATH:${rawSymbols.join(",")}`);
  const unknownCommands = [...new Set(source.match(/\\[A-Za-z]+/g) ?? [])].filter(
    (command) => !canonicalCommands.has(command),
  );
  if (unknownCommands.length) reasons.push(`UNKNOWN_CANONICAL_SYMBOL:${unknownCommands.join(",")}`);
  return reasons.length ? { status: "BLOCK_RENDER", reasons } : { status: "PASS", reasons: [] };
}

export const NA_MATH_STANDARD_V2_6 = deepFreeze({
  id: "NA_MATH_STANDARD_V2_6" as const,
  baseline: qaContracts.baseline_name,
  status: qaContracts.status,
  canonicalAssetRoot: "standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK" as const,
  layout: {
    id: semanticGeometryAuthority.profiles.layout_contract.layout_id,
    status: semanticGeometryAuthority.profiles.layout_contract.status,
    tokens: tokens.layout,
  },
  video: NA_MATH_VIDEO_PROFILE,
  colorSystem,
  typography: tokens.typography,
  mathNotation: mathNotationAuthority.policy,
  symbolRegistry: mathNotationAuthority.symbolRegistry,
  semanticGeometry: {
    pipeline: semanticGeometryAuthority.manifest.core_pipeline,
    rules: semanticGeometryAuthority.profiles.rules,
  },
  approvedGeometryProfiles: semanticGeometryAuthority.profiles,
  qaContracts,
  validateMathSource,
});

export function getNaMathOutputContract(identity: NaMathOutputIdentity) {
  return NA_MATH_STANDARD_V2_6.colorSystem.output_contracts[identity];
}
