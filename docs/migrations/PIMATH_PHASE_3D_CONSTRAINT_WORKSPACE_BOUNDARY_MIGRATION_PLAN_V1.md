# PiMath Phase 3D — Constraint / Workspace Boundary Migration Plan V1

Status: IMPLEMENTATION CANDIDATE

Mode:

BOUNDED / COMPATIBILITY-FIRST / NON-DESTRUCTIVE

## Discovery conclusion

The current authority direction is valid:

MATH_IR
→ DYNAMIC_GEOMETRY
→ CONSTRAINT_ORCHESTRATION
→ DYNAMIC_WORKSPACE

Geometry Engine remains canonical semantic geometry authority.

Constraint Orchestration is a solver / transaction layer.

Dynamic Workspace is an application workspace orchestrator.

Neither Constraint Orchestration nor Dynamic Workspace owns canonical
mathematical or geometry semantics.

## Discovery gates

TWO_WAY_DEPENDENCY_QA=PASS

EXPECTED_AUTHORITY_DIRECTION_QA=PASS

DYNAMIC_WORKSPACE_AUTHORITY_QA=PASS

CONSTRAINT_ORCHESTRATION_AUTHORITY_QA=PASS

FOUNDATION_IMMUTABILITY_QA=PASS

## Required implementation delta

Constraint Orchestration already imports canonical Dynamic Geometry directly:

src/modules/dynamic-geometry/construction-engine.ts

Dynamic Workspace currently consumes the Dynamic Geometry public compatibility
facade:

src/modules/dynamic-geometry/index.ts

Phase 3C established that index as a compatibility surface which also exposes
legacy Pattern FOLD APIs.

Dynamic Workspace does not consume those FOLD APIs.

Therefore Dynamic Workspace must consume canonical construction APIs directly
from:

src/modules/dynamic-geometry/construction-engine.ts

This removes the generic workspace from the legacy compatibility route while
preserving all existing Dynamic Workspace public APIs and behavior.

## Authority contract

MATH_IR
ROLE=CANONICAL_MATHEMATICAL_SEMANTIC_MODEL

GEOMETRY_ENGINE
ROLE=CANONICAL_SEMANTIC_GEOMETRY_AUTHORITY

DYNAMIC_GEOMETRY
ROLE=CONSTRUCTION_ENGINE

CONSTRAINT_ORCHESTRATION
ROLE=SOLVER_TRANSACTION_LAYER
MATHEMATICAL_AUTHORITY=NO
GEOMETRY_AUTHORITY=NO

DYNAMIC_WORKSPACE
ROLE=APPLICATION_WORKSPACE_ORCHESTRATOR
MATHEMATICAL_AUTHORITY=NO
GEOMETRY_AUTHORITY=NO

RENDERER_OWNS_MATH=FALSE

## Forbidden

- Algorithm rewrite.
- MathIR schema mutation.
- Geometry Engine authority mutation.
- Constraint solver rewrite.
- Workspace behavior rewrite.
- Public API removal or rename.
- FOLD algorithm mutation.
- Foundation V1 mutation.
- Phase 2 architecture contract mutation.
- Locked NA-MATH standard mutation.
