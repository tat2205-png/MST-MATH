# PiMath Phase 3C — Dynamic Geometry / FOLD Boundary Migration Plan V1

Status: IMPLEMENTATION CANDIDATE

Mode:

BOUNDED / COMPATIBILITY-FIRST / NON-DESTRUCTIVE

## Goal

Remove FOLD-domain implementation ownership from the canonical Dynamic Geometry
module while preserving all existing public imports and behavior.

## Current discovery

DYNAMIC_GEOMETRY_TS_FILE_COUNT=3

PATTERN_FOLD_COUPLED_FILE_COUNT=1

FOLD3D_COUPLED_FILE_COUNT=1

GEOMETRY_ENGINE_DIRECT_FILE_COUNT=1

All three couplings are located in:

src/modules/dynamic-geometry/index.ts

Canonical construction core:

src/modules/dynamic-geometry/construction-engine.ts

## Current legacy coupling

Dynamic Geometry index currently consumes:

- fold-3d Vec2
- PatternSheet
- PatternResult
- PatternIssue
- ConstructionOperation
- ConstructionPoint
- ObjectFreedom
- Geometry Engine planar containsPoint

These dependencies belong to the legacy PatternSheet/FOLD compatibility layer.

## Target boundary

MATH_IR
→ DYNAMIC_GEOMETRY_CONSTRUCTION_ENGINE
→ CONSTRAINT_ORCHESTRATION
→ WORKSPACE / RENDERER

FOLD-specific route:

GEOMETRY_ENGINE
→ PATTERN_FOLD
→ PATTERN_FOLD_DYNAMIC_GEOMETRY_ADAPTER

## Compatibility

Existing imports from:

src/modules/dynamic-geometry/index.ts

must remain source-compatible.

The legacy PatternSheet-oriented symbols remain available through that path via
explicit compatibility re-export.

## Canonical ownership

CANONICAL_DYNAMIC_GEOMETRY_CORE=
src/modules/dynamic-geometry/construction-engine.ts

FOLD_COMPATIBILITY_IMPLEMENTATION=
src/modules/pattern-fold/dynamic-geometry-adapter.ts

## Forbidden

- Algorithm rewrite.
- MathIR schema mutation.
- PatternSheet schema mutation.
- Breaking dynamic-geometry public imports.
- Bulk source movement.
- Changes to Geometry Engine authority.
- Changes to locked standards.
- Changes to Foundation V1.
- Changes to Phase 2 architecture contract.
- Removing compatibility before regression PASS.
