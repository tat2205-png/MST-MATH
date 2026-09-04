# MST-MATH Canonical ID Migration V1

Status: **APPROVED / CONTROLLED MIGRATION**

## Decision
MST-MATH is now the primary product identity in both human-facing and machine-canonical layers.

Canonical root: `MST-MATH-DNA-V1.0`  
Code root: `MST_MATH_DNA`

All `PIMATH*` identities are compatibility/history only. They may be accepted by explicit alias resolvers but must not be emitted as new canonical authority.

## Migration rule
`PiMath active authority → MST-MATH canonical authority`

`PiMath historical identifier → compatibility alias → MST-MATH authority`

No source semantics, mathematical meaning, geometry semantics, locked typography, color, layout, assessment semantics, or IR contracts are changed by this brand/authority migration.

## Canonical active files
- `registry/mst-math-brand-root.json`
- `registry/mst-math-dna-global-baseline-v1.0.json`
- `registry/mst-math-dna-global-baseline-v1.1.json`
- `registry/mst-math-dna-icons-v1.1.json`
- `registry/mst-math-dna-dynamic-geometry-visualization-v1.0.json`
- `src/config/mstMathBrandRoot.ts`
- `src/config/mstMathRendererProvenance.ts`
- `standards/MST_MATH_ACCESSIBILITY_CANONICAL_V1_0/`
- `standards/MST_MATH_VOICE_NARRATION_CANONICAL_V1_0/`
- `standards/MST_MATH_VIDEO_VISUAL_CANONICAL_V2_0/`

## Compatibility
Legacy paths/IDs are retained only where needed for old artifacts and callers. Git history remains the immutable historical record.
