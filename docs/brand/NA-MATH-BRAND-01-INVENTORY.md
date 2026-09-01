# BRAND-01 canonical inventory

| Artifact | Path | Classification | Authority | Migration action |
|---|---|---|---|---|
| Global Brand Root | `registry/brand-root.json` | GLOBAL_ROOT_CANDIDATE → canonical | Global | Finalized by this task |
| System V2.6 | `standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK` | CANONICAL_CHILD | Locked | Reference only |
| Layout V1.3 | `standards/NA_MATH_CANONICAL_LAYOUT_SPEC_V1_0` | CANONICAL_CHILD | Locked | Reference only |
| Color system V1.0 | `.../design-system/color-system/NA_MATH_OUTPUT_COLOR_SYSTEM_V1_0.json` | CANONICAL_REFERENCE | Locked child | Reference only |
| Typography roles | `.../design-system/.../tokens/tokens.json` | CANONICAL_REFERENCE | Locked overlay | Reference only |
| Video language/golden | `standards/NA_MATH_VIDEO_*` | CANONICAL_CHILD | Locked | Reference only; human QA pending |
| Geometry/Fold | `src/config/naMathFoldVisualStandardV1.ts` | ADAPTER | Module adapter | Must resolve under root |
| Math loader | `src/config/naMathStandardV26.ts` | ADAPTER | V2.6 child loader | Compatibility path retained |
| GeoGebra | `src/modules/geogebra/*` | ADAPTER | Output adapter | No local canonical palette found |
| Olympia | `docs/game/GAME-01-OLYMPIA-REFERENCE-V1.0.md` | CANONICAL_REFERENCE | Approved preset | Reference only |
| UI icon imports | `src/components/**` | ADAPTER | Renderer/UI | No repository-wide role registry found; human decision required |

## Active parallel/bypass findings

There is no finalized second machine-readable brand root. Existing local renderer styles and direct V2.6/Fold imports are active adapters or technical values, but are not yet fully traceable through the new resolver. Direct Manim/video values in `server/services/goldenPathService.ts` and `server/integrations/questionBankStudio.ts` are duplicate/conflicting brand ownership and remain a follow-up migration item; this task records them and does not alter the rejected video design.

## Human decisions required

`ICON_AUTHORITY_MAPPING`, `COMPONENT_AUTHORITY_MAPPING`, `VOICE_AUTHORITY`, `GEOGEBRA_CANONICAL_CHILD_ARTIFACT`, `FOLD_CANONICAL_CHILD_ARTIFACT`, and `EXAM_VISUAL_PROFILE` have no complete authoritative artifact in the repository. No values were invented.
