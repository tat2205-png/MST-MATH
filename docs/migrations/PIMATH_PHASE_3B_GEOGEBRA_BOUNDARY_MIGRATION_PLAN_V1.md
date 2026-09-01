# PiMath Phase 3B — GeoGebra Generic Boundary Migration Plan V1

Status: IMPLEMENTATION CANDIDATE

Mode:

BOUNDED / COMPATIBILITY-FIRST / NON-DESTRUCTIVE

## Goal

Decouple generic GeoGebra runtime and construction responsibilities from
Pattern FOLD-specific domain logic while preserving existing public APIs,
tests and FOLD behavior.

## Current discovery

GEOGEBRA_TS_FILE_COUNT=9

PATTERN_FOLD_COUPLED_FILE_COUNT=3

FOLD3D_COUPLED_FILE_COUNT=0

GEOMETRY_ENGINE_DIRECT_FILE_COUNT=0

MATH_IR_DIRECT_FILE_COUNT=0

DYNAMIC_GEOMETRY_DIRECT_FILE_COUNT=0

Current Pattern FOLD-coupled files:

- src/modules/geogebra/adapter.ts
- src/modules/geogebra/tool-controller.ts
- src/modules/geogebra/v3-qa.ts

## Canonical authority

GEOGEBRA_ROLE=INTERACTIVE_GEOMETRY_OUTPUT_ADAPTER

GEOGEBRA_AUTHORITY=NON_AUTHORITATIVE

FOLD_ROLE=DOMAIN_SPECIFIC_GEOMETRY

GEOMETRY_ENGINE_ROLE=CANONICAL_SEMANTIC_GEOMETRY_AUTHORITY

RENDERER_OWNS_MATH=FALSE

ADAPTER_OWNS_MATH=FALSE

## Target boundary

Generic route:

SEMANTIC_GEOMETRY
→ GEOGEBRA_CONSTRUCTION_IR
→ GEOGEBRA_RUNTIME_ADAPTER

FOLD-specific route:

FOLD_DOMAIN
→ FOLD_GEOGEBRA_ADAPTER
→ GEOGEBRA_CONSTRUCTION_IR
→ GEOGEBRA_RUNTIME_ADAPTER

## Ownership rule

Generic GeoGebra code must not own or require Pattern FOLD domain fixtures,
FOLD model state or PatternSheet authoring semantics.

Pattern FOLD-specific conversion and fixture logic belongs to the FOLD domain
boundary.

## Compatibility rule

Existing GeoGebra public imports must remain source-compatible throughout
Phase 3B.

Existing tests and current FOLD/GeoGebra UI flows must continue to work.

Compatibility re-exports or delegating wrappers are permitted during migration.

## Migration order

1. Inventory exact Pattern FOLD imports in GeoGebra.
2. Classify every import as:
   - GENERIC_CONSTRUCTION
   - FOLD_DOMAIN
   - FOLD_FIXTURE
   - QA_ONLY
3. Define renderer-independent GEOGEBRA_CONSTRUCTION_IR only if required by
   existing implementation evidence.
4. Extract FOLD-specific adapter behavior behind a compatibility boundary.
5. Preserve existing GeoGebra exports.
6. Migrate generic runtime code away from Pattern FOLD.
7. Keep QA-only FOLD fixtures separate from runtime authority.
8. Run TypeScript and build QA.
9. Run GeoGebra/FOLD/Geometry regressions.
10. Commit as one bounded Phase 3B migration only after PASS.

## Forbidden

- Bulk source moves.
- Breaking GeoGebra API changes.
- Breaking FOLD API changes.
- Rewriting FOLD algorithms.
- Rewriting GeoGebra runtime.
- Geometry schema mutation without separate authorization.
- Moving mathematical authority into GeoGebra.
- Moving mathematical authority into renderer code.
- Mutation of locked NA-MATH standards.
- Mutation of Foundation V1.
- Mutation of Phase 2 architecture contract.
- Silent replacement of existing FOLD golden fixtures.
- Declaring Phase 3B DONE before regression PASS.

## Initial physical move policy

PHYSICAL_MOVE_REQUIRED=NO_INITIAL_MOVE

Prefer:

- additive boundary files;
- delegating compatibility wrappers;
- type-only shared contracts;
- incremental import migration.

Only remove legacy coupling after regression PASS.
