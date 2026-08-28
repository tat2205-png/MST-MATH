# GEO-1 — Semantic Geometry Schema

Status: COMPLETE / PASS

## Delivered
- Strong TypeScript geometry object model.
- Relation model with provenance and verification state.
- Locked V1.3 layout contract embedded in every scene.
- Explicit ViewProfile + EdgeStyleRule.
- Render claims that must be VERIFIED before drawing.
- Fail-closed render policy.
- JSON Schema for cross-language validation.
- Semantic QA validator.
- Golden semantic corpus.

## Golden scenes
1. Triangular prism — locked front-to-back profile.
2. Pyramid altitude from perpendicular side-plane theorem.
3. SA=SB=SC → H circumcenter after valid derivation.
4. Skew lines on two parallel planes.

## Hard invariants
- Layout cannot be changed by geometry.
- DERIVED relations require evidence.
- Render-critical claims require VERIFIED status.
- Edge solid/dashed style comes from ViewProfile.
- No visual inference.
