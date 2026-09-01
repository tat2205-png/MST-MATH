# MAS Visual Pedagogy Convergence V1

Status: **PRODUCTION VERTICAL SLICE — OPT-IN**

Baseline audit: `NA-DOC-04R-VISUAL-ARCHITECTURE-AUDIT.md`

## Authoritative pipeline

`Math IR V1 → validated visual semantics → pedagogical plan → transition graph → motion plan → existing visual/video planners and renderer adapters`

This work adds contracts and validation envelopes only. It does not replace Math IR, Dynamic Geometry, Geometry Engine, Question Bank, Document Engine/Export, the locked NA-MATH V2.6 design system, Visual Planner, Video Planner, or any renderer.

## Phase evidence

| Gate | Result | Evidence / boundary |
|---|---|---|
| VC-00 architecture and duplication audit | PASS | Existing `NA-DOC-04R` inventory and risk map; runtime unchanged. |
| VC-01 visual semantic contract | PASS | Stable Math IR IDs, validated satisfied-constraint markers, provenance, fail-closed renderer gate. No coordinates encode truth in this model. |
| VC-02 semantic geometry | PASS | External-point tangent construction derives C/D and tangent segments from source coordinates and radius; deterministic circle, perpendicular, and equal-tangent invariants. |
| VC-03 cross-renderer QA | PASS | Renderer snapshots compare entity/relation identity rather than pixels. |
| VC-03 layout/mobile QA | PASS | Safe bounds, clipping, formula overflow, collision, and 28px minimum mobile typography for 1080×1920 plans. |
| VC-04 design tokens/components | PASS (existing authority reused) | Locked V2.6 `tokens.json`, `component-registry.ts`, and `NA_MATH_STANDARD_V2_6`; no parallel style system. Existing component registry already spans document, worksheet, assessment, and video semantics. |
| VC-05 pedagogical planner | PASS | Deterministic explicit-stage lesson, problem-solving, and proof grammars. It produces a renderer-neutral contract to be consumed before existing planners. |
| VC-06 motion grammar | PASS | Semantic motion vocabulary; verified transitions map to rewrite/substitute intent while renderer primitives remain adapter decisions. |
| VC-07 transition graph | PASS | Verified edges reference existing expression and solution-step IDs; performs no algebra or solving. |
| VC-08 golden corpus | PASS | Ten original compact cases cover algebra, inequality, proof, geometry, graph, solid, fold, document, and vertical video. |
| VC-09 app integration | PASS | `STUDIO_VISUAL_PEDAGOGY` defaults off. Existing workflows and routing remain unchanged. |
| VC-10 full QA | Pending execution | Use repository scripts only; PowerShell-only suites require PowerShell availability. |

## Responsibility boundary

- Mathematical inference: existing verified Math IR/math/construction services only.
- Visual semantics: roles, visibility, semantic color, and markers referencing validated Math IR facts.
- Coordinates: remain in Math IR/construction/layout contracts; renderers may transform but not promote screen geometry to truth.
- Styling: locked NA-MATH configuration only.
- Pedagogy and motion: structured deterministic plans; no arbitrary renderer script invention.
- Equivalence: entity/relation/visibility identity, not coordinate or pixel equality.

## Follow-on integration debt

The opt-in contract is intentionally not wired into default `VisualPlannerService` or `VideoPlannerService`. The next safe slice should add adapters at those two entry points, require the renderer input gate when the flag is enabled, and surface diagnostics in the existing developer UI. Graph inference quarantine and projection/label unification remain separate high-risk programs identified by NA-DOC-04R.
