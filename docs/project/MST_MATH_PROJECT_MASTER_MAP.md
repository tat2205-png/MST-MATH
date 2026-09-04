# MST-MATH — Project Master Map

Status: **MASTER / ACTIVE IDENTITY MAP**  
Canonical root: `MST-MATH-DNA-V1.0`  
Migration: `MST_MATH_CANONICAL_ID_MIGRATION_V1`

## Identity
The active product identity is **MST-MATH**. New machine-canonical authorities, registries, runtime provenance, output metadata, tests, and documentation updates must use MST-MATH naming.

Legacy `PiMath`, `PIMATH*`, and former PiMath-prefixed project artifacts are **history / compatibility only**. They may be consulted for lineage and may be accepted through explicit compatibility aliases, but they cannot become or emit new canonical authority.

## Architecture continuity
The migration changes product/authority identity only. Existing verified semantic architecture remains in force unless separately superseded:

`SOURCE → SEMANTIC IR → CORE ENGINES → OUTPUT PROFILE → RENDERER / ADAPTER → QA → ARTIFACT`

Core invariants remain:
- semantic truth precedes rendering;
- mathematics and geometry are not renderer-owned;
- output profiles cannot override global canonical semantics;
- locked layout, typography, color, notation, accessibility, voice, icon, component, and geometry authorities resolve from MST-MATH DNA and referenced locked child standards;
- unresolved authority fails closed;
- AUTHOR ONCE — RENDER MANY remains the multi-output principle.

## Active canonical entry points
- `registry/mst-math-brand-root.json`
- `registry/standards.json`
- `registry/authority.json`
- `registry/output-profiles.json`
- `registry/outputs.json`
- `registry/mst-math-migration-v1.json`
- `project-state/MST-MATH-PROJECT-STATE.json`
- `src/config/mstMathBrandRoot.ts`

## Historical source preservation
The former `docs/project/PROJECT_MASTER_MAP.md` and `project-state/PIMATH-PROJECT-STATE.json` remain immutable historical/lineage sources. Their old names do not define current product identity after this migration.
