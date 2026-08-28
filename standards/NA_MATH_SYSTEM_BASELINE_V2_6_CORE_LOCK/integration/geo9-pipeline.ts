// GEO-9 — Pipeline orchestration contract.
//
// GIVEN DATA
// -> SEMANTIC GEOMETRY
// -> INFERENCE / PROVENANCE
// -> VIEW PROFILE
// -> PARALLEL PROJECTION
// -> EDGE VISIBILITY
// -> LABEL PLACEMENT
// -> GEOMETRY QA
// -> V1.3 FIGURE SLOT ADAPTER
// -> CLIPPED RENDER
//
// The last two stages cannot mutate the V1.3 layout.

export const GEO9_PIPELINE = [
  'semantic-geometry',
  'inference-provenance',
  'view-profile',
  'parallel-projection',
  'edge-visibility',
  'label-placement',
  'geometry-qa',
  'locked-v13-figure-slot',
  'clipped-render',
] as const;

export const GEO9_HARD_GUARDS = {
  layoutBaseline: 'NA-MATH-LAYOUT-V1.3-CANONICAL',
  layoutStatus: 'LOCKED',
  layoutMutationAllowed: false,
  clipToFigureSlot: true,
  freeFormImageGenerationForCoreMath: false,
  geometryRegressionRequired: true,
} as const;
