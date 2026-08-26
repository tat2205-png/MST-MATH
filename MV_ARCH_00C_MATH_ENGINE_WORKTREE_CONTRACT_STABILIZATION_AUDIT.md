# MV_ARCH_00C Math Engine Worktree Contract Stabilization Audit

## 1. Executive summary

The authoritative future shared contracts are present in the Math Engine worktree at:

- `src/modules/math-ir`
- `src/modules/geometry-engine`

They are semantically coherent, renderer-neutral, versioned where persistence requires it, exposed through public barrels, actively imported by Fold and Document Engine code, and protected by passing focused tests. They eliminate the need for a second `src/lib/mathScene` or another geometry foundation.

They are **not yet stable for implementation reuse** because every file in both modules is untracked, absent from every reachable Git history entry, and not ignored. Their direct tests and `server/geometry/mathIrLuaDrawAdapter.ts` are also untracked. Committed Fold files import them, so the current branch HEAD is not a self-contained reproduction of the passing worktree.

The minimum stabilization path requires no behavioral change: preserve the exact current contract files in an authorized, reviewable checkpoint; include their tests and regression registration; document the public boundaries; and verify both Fold and primary legacy gates. No schema redesign, source move, Fold refactor, or new Math Visual engine is needed.

`MV_ARCH_00C=PASS` because the authoritative contracts, dirty dependencies, duplication controls, and minimum stabilization path are now known. `MV0_READY_TO_IMPLEMENT=NO` remains correct until that zero-behavior stabilization is completed.

## 2. Baseline and preservation

### Primary worktree

| Field | Value |
|---|---|
| Repository | `D:\math-ai-video-studio\math-ai-video-studio-github` |
| HEAD | `cc95fa18da603aadec19f84c320a894a5e306b2b` |
| Branch | `feature/mv-arch-00` |
| Tracked status | CLEAN |
| Pre-existing untracked | `.serena/`, `independently`, `MV_ARCH_00_REUSE_INTEGRATION_AUDIT.md`, `MV_ARCH_00B_FOLD_SOURCE_BOUNDARY_AUDIT.md` |

### Math Engine worktree

| Field | Value |
|---|---|
| Repository | `D:\math-ai-video-studio\math-ai-video-studio-math-engine` |
| HEAD | `c9b677829b9790ea1452003cc3128ec8f3244af7` |
| Branch | `feature/math-production-engine-v1` |
| Tracked status | DIRTY: 8 modified files |
| Untracked status | DIRTY: protected source, tests, browser smokes, local `.serena` state |

Modified tracked paths captured before inspection:

- `scripts/run-regression.mjs`
- `src/components/dev/Fold3DViewer.tsx`
- `src/components/dev/PatternFoldViewerPanel.tsx`
- `src/modules/fold-3d/developable-surfaces.ts`
- `src/modules/fold-3d/developable-three-adapter.ts`
- `src/modules/pattern-fold/engine.ts`
- `src/modules/pattern-fold/index.ts`
- `src/modules/pattern-fold/types.ts`

Untracked relevant groups captured before inspection:

- `.serena/`
- `src/modules/math-ir/**`
- `src/modules/geometry-engine/**`
- `server/geometry/mathIrLuaDrawAdapter.ts`
- `src/modules/document-engine/**`
- `src/modules/fold-3d/n-gonal-solids.ts`
- `src/modules/pattern-fold/{authoring,studio-authoring}.ts`
- `src/components/dev/PatternAuthoringCompletionPanel.tsx`
- Math IR, Geometry, Document, Fold, authoring and browser-smoke tests listed by `git ls-files --others --exclude-standard`

None of those paths is ignored. None of the Math IR/Geometry contract paths has reachable Git history. No source, test, Git index, or existing documentation was modified by this audit.

## 3. File-state classification

| Path group | Tracking state | Runtime role | Classification |
|---|---|---|---|
| `src/modules/math-ir/*.ts` | UNTRACKED | Production contract imported by Fold, Geometry and Document modules | WORKTREE_ONLY + NEEDS_STABILIZATION |
| `src/modules/math-ir/README.md` | UNTRACKED | Contract documentation | WORKTREE_ONLY + stabilization evidence |
| `src/modules/math-ir/fixtures.ts` | UNTRACKED | Test fixtures; also public-exported today | TEST-ORIENTED, unstable public exposure |
| `src/modules/geometry-engine/*.ts` | UNTRACKED | Production validation/normalization/routing/adapters | WORKTREE_ONLY + NEEDS_STABILIZATION |
| `src/modules/geometry-engine/README.md` | UNTRACKED | Contract documentation | WORKTREE_ONLY + stabilization evidence |
| `src/modules/geometry-engine/fixtures.ts` | UNTRACKED | Test fixtures; public-exported today | TEST-ORIENTED, unstable public exposure |
| `server/geometry/mathIrLuaDrawAdapter.ts` | UNTRACKED | Production compatibility adapter | WORKTREE_ONLY + NEEDS_STABILIZATION |
| `tests/test-math-ir-v1.ts` | UNTRACKED | Contract test | TEST-ONLY, required for stabilization |
| `tests/test-geometry-engine-v1.ts` | UNTRACKED | Contract/integration test | TEST-ONLY, required for stabilization |
| Fold files importing Math IR/Geometry | TRACKED COMMITTED, plus other dirty Fold paths | Production Fold domain | PRODUCTION, protected |
| `scripts/run-regression.mjs` | TRACKED MODIFIED | Regression registration | WORKTREE_ONLY modification, review before stabilization |

No evidence marks the TypeScript contract sources as generated. They are hand-authored production code with READMEs, public barrels, direct production imports and dedicated tests.

## 4. Math IR contract audit

`MATH_IR_CONTRACT_AUDIT=PASS` for discovery and semantic quality; reuse readiness remains blocked by tracking state.

### Public entrypoint

`src/modules/math-ir/index.ts`, exporting:

- `types.ts`
- `factories.ts`
- `fixtures.ts`
- `serialization.ts`
- `validation.ts`

The barrel is functional but should be stabilized with a deliberate decision on whether fixtures belong in the production public surface.

### Stable semantic surface

| Contract | Current behavior | Classification |
|---|---|---|
| `MATH_IR_SCHEMA_VERSION` | Literal `math-ir/v1` | STABLE_REUSE after checkpoint |
| `EntityId`, `ExpressionId` | Stable string references | STABLE_REUSE |
| `MathDocument` | Versioned root containing sections, problems, scenes, expressions and assets | STABLE_REUSE |
| `MathScene` | Renderer-neutral 2D/3D scene with entities, constraints, relations, camera, styles, annotations and animations | STABLE_REUSE |
| `MathEntity` union | 24 typed geometry/visual entities | STABLE_REUSE |
| semantic/layout coordinates | Explicit mathematical versus presentation coordinate distinction | STABLE_REUSE |
| `MathConstraint` | Typed high-school geometry relationship + fact provenance | STABLE_REUSE |
| `MathRelation` | Subject/object IDs, expression and fact provenance | STABLE_WITH_ADAPTER |
| `MathExpression` | Raw/LaTeX/normalized strings and variables/unit | STABLE_WITH_ADAPTER; not a CAS AST |
| `MathFact` / source evidence | Origin/confidence/rules/evidence chains | STABLE_REUSE |
| `MathStyle`, `MathCamera`, `MathAnnotation` | Renderer-neutral presentation hints | STABLE_WITH_ADAPTER |
| factories | Small deterministic defaults for points, segments, planes, constraints, scenes/problems/documents | STABLE_REUSE |
| validation | Schema, IDs, references, entity kinds, constraints, relations, numbers, circular references | STABLE_REUSE |
| serialization | Validate-before-JSON and non-throwing fail-closed import | STABLE_REUSE |

### Unstable or incomplete surface

- All files are WORKTREE_ONLY, so none is a stable repository contract yet.
- `EntityBase` is intentionally internal; consumers use the union, which is appropriate.
- `MathRelation.type` remains a free string rather than a versioned relation vocabulary.
- `MathAnimation.parameters` is untyped and combines generic presentation actions with a Fold action name.
- `MathAnimation` has time values but no explicit timeline identifier/reference.
- There is no dependency graph, evaluator, dynamic parameter, math event, case state, command/history or undo/redo contract.
- `MathConstraint` records facts but does not define propagation/evaluation semantics.
- `MathExpression` is textual and does not define a symbolic AST or canonical evaluator contract.
- The public barrel exports fixtures, which may unnecessarily enlarge the production API.
- JSON output is valid and deterministic for insertion-ordered inputs, but canonical key ordering/hash semantics are not specified.
- There is no explicit compatibility/migration registry beyond exact `math-ir/v1` validation.

### Worktree dependencies

Production dependents include:

- committed `fold-3d/types.ts`, `topology.ts`, `scene.ts`, `canonical-solids.ts`
- untracked `fold-3d/n-gonal-solids.ts`
- every Geometry Engine module
- untracked Document Engine types, mapper and LaTeX serializer
- untracked LuaDraw adapter

### Versioning status

`MATH_IR_VERSIONING_STATUS=SCHEMA_VERSION_PRESENT_AND_TESTED_BUT_WORKTREE_ONLY_NO_MIGRATION_POLICY`.

The `math-ir/v1` literal and round-trip test are strong foundations. Stabilization should freeze representative golden fixtures and explicitly state that new optional fields are additive while incompatible changes require a new schema version and converter.

### Required output

```text
MATH_IR_PUBLIC_ENTRYPOINT=src/modules/math-ir/index.ts
MATH_IR_STABLE_SURFACE=types, stable IDs, MathDocument, MathScene, entities, constraints, provenance, semantic/layout coordinates, validation, serialization, factories
MATH_IR_UNSTABLE_SURFACE=all worktree-only; free-form relation type; untyped animation parameters; no dependency/dynamic/event/case/history contracts; fixtures exported publicly
MATH_IR_WORKTREE_DEPENDENCIES=Fold 3D, Geometry Engine, Document Engine, LuaDraw adapter, focused tests
MATH_IR_VERSIONING_STATUS=math-ir/v1 exists and round-trips; repository checkpoint and migration policy absent
```

## 5. Geometry Engine contract audit

`GEOMETRY_ENGINE_CONTRACT_AUDIT=PASS` for discovery and boundary design; reuse readiness is blocked by worktree-only provenance.

### Public entrypoint

`src/modules/geometry-engine/index.ts`, exporting types, reference resolution, validation, normalization, capabilities, adapters, router and fixtures.

### Stable surface

| Subsystem | Current behavior | Classification |
|---|---|---|
| renderer types/capabilities | Six renderer IDs and explicit capability levels | STABLE_REUSE after checkpoint |
| reference resolution | ID-based resolution with missing/duplicate diagnostics | STABLE_REUSE |
| scene validation | IDs, finite coordinates, dimensions, primitive references and solid structure | STABLE_REUSE |
| normalized scene | Resolved entities, classification, render coordinates, hidden edges, graph hints and warnings | STABLE_WITH_ADAPTER |
| semantic/layout/visual-only origin | Never silently promotes generated layout into math truth | STABLE_REUSE |
| route options/result | Explicit requested capabilities, availability and unsupported reasons | STABLE_WITH_ADAPTER |
| adapter interface | `canRender`/`render` over normalized scenes | STABLE_WITH_ADAPTER |
| SVG/TikZ adapters | Deterministic basic 2D output | EXTEND_SAFELY |
| LuaDraw adapter boundary | MathScene -> existing GeometrySpec 1.0 + fingerprint | STABLE_WITH_ADAPTER |

### Missing or unstable surface

- Entire module is WORKTREE_ONLY.
- It defines geometry contracts and renderer normalization, not a computational geometry kernel.
- No general vector math, transform abstraction, intersection API, projection operation, measurement evaluator, topology/mesh model or dynamic update engine exists here.
- Circles without evaluated radii use clearly flagged visual-only constants.
- Function graphs are hints; sampling remains in the primary GraphEngine.
- `threejs` and `geogebra` are capability contracts only; `manim` is a compatibility target, not an executable compiler.
- The generic adapter table declares Three.js unavailable even though Fold has direct Three.js adapters. This is a bounded-context distinction but requires documentation to avoid misleading consumers.
- `GeometryRendererOutput` supports only SVG, TikZ, LuaDraw GeometrySpec and a Manim scene contract; no Fold output belongs here.
- Fixtures are exported from the public barrel.

### Coupling

`GEOMETRY_ENGINE_FOLD_COUPLING=LOW_ONE_WAY`: Geometry Engine imports Math IR only. Fold imports Geometry Engine normalization. Geometry Engine does not import Fold, nets, hinges, cuts or creases.

`GEOMETRY_ENGINE_WORKTREE_DEPENDENCIES=math-ir (untracked), GeometrySpec/validator (tracked legacy), mathIrLuaDrawAdapter (untracked), focused tests (untracked)`.

The low one-way coupling is the correct boundary and must be protected by dependency rules.

## 6. Authoritative concept map

| Concept | Authoritative location | Status | Reuse mode | Adapter required | Gap |
|---|---|---|---|---|---|
| MathObject | `math-ir/types.ts` `MathEntity` | WORKTREE_ONLY, semantically mature | STABLE_REUSE after stabilization | YES from primary `MathEntity` | No generic non-entity object base |
| MathIR | `MathDocument`, `math-ir/v1` | WORKTREE_ONLY | STABLE_REUSE | YES | Migration policy/checkpoint |
| Scene | `MathScene` | WORKTREE_ONLY | STABLE_REUSE | YES from VisualSpec/Manim/Fold artifacts | Dynamic state/evaluation absent |
| ObjectId | `EntityId=string` plus validator | WORKTREE_ONLY | STABLE_REUSE | YES for legacy IDs | No namespacing/lifecycle registry |
| GeometryPrimitive | Math IR entity union | WORKTREE_ONLY | STABLE_REUSE | YES | Algorithms deliberately separate |
| Vector2D | `VectorEntity.components` / Fold `Vec2` | PARTIAL | STABLE_WITH_ADAPTER | YES | No dimension-safe generic vector value contract |
| Vector3D | `VectorEntity.components` / Fold `Vec3` | PARTIAL | STABLE_WITH_ADAPTER | YES | Same gap |
| Transform | Fold `Mat4` and MathAnimation transform | PARTIAL/FOLD-COUPLED | DO_NOT_USE_AS_UNIVERSAL_YET | YES | Generic semantic transform contract absent |
| Relation | `MathRelation` | WORKTREE_ONLY, partial vocabulary | STABLE_WITH_ADAPTER | YES | Typed relation registry/evaluation absent |
| Dependency | NONE | ABSENT | New minimal concept later | N/A | Sources/targets/evaluator/propagation |
| Constraint | `MathConstraint` | WORKTREE_ONLY, declarative | STABLE_REUSE | YES | Evaluation/propagation status absent |
| Measurement | `MeasurementEntity` + expression | WORKTREE_ONLY, declarative | STABLE_WITH_ADAPTER | YES | Live evaluator absent |
| Projection | `MathCamera.projection`; renderer coordinate projection | PARTIAL | DO_NOT_USE_AS_GEOMETRIC_PROJECTION | YES | Projection object/operation/result absent |
| Serialization | `serializeMathIR` / `deserializeMathIR` | WORKTREE_ONLY, versioned | STABLE_REUSE | YES for legacy DTOs | Canonical hashing/migrations absent |
| TimelineReference | `MathAnimation.startTime/duration` | PARTIAL | EXTEND_EXISTING | YES to narration/camera/Manim | Explicit timeline/track/correlation ID absent |

This table is authoritative for avoiding duplicates. Fold tuple math remains implementation support, not the universal semantic type source.

## 7. Dirty-worktree dependency analysis

`SHARED_CORE_DEPENDS_ON_DIRTY_WORKTREE=YES`.

| Path | Required by | Tracking state | Risk | Stabilization required |
|---|---|---|---|---|
| `src/modules/math-ir/types.ts` | all Math IR consumers; committed Fold types/topology/scenes | UNTRACKED | Critical contract loss; committed HEAD cannot typecheck alone | YES |
| `math-ir/index.ts` | all public imports | UNTRACKED | Public entrypoint loss | YES |
| `math-ir/validation.ts` | serialization, tests, future trust gates | UNTRACKED | Invalid refs/data could bypass intended gate | YES |
| `math-ir/serialization.ts` | saved Math IR | UNTRACKED | schema round-trip contract loss | YES |
| `math-ir/factories.ts` | fixtures/importers/consumers | UNTRACKED | construction defaults drift | YES |
| `math-ir/README.md` | contract intent and exclusions | UNTRACKED | boundary ambiguity | YES |
| `math-ir/fixtures.ts` | tests/golden examples | UNTRACKED | compatibility evidence loss | YES, preferably test surface |
| all `geometry-engine/*.ts` | committed Fold topology and future render routing | UNTRACKED | Fold compilation/normalization boundary loss | YES |
| `server/geometry/mathIrLuaDrawAdapter.ts` | Geometry contract test and future LuaDraw integration | UNTRACKED | duplicate or incompatible adapter risk | YES if adapter included in baseline |
| `tests/test-math-ir-v1.ts` | Math IR compatibility | UNTRACKED | no regression proof | YES |
| `tests/test-geometry-engine-v1.ts` | geometry + LuaDraw compatibility | UNTRACKED | no boundary proof | YES |
| `scripts/run-regression.mjs` additions | execution of new suites | TRACKED MODIFIED | tests may exist but not run in gate | YES after separating concurrent edits |

Additional reproducibility dependencies outside the shared core—such as untracked `fold-3d/n-gonal-solids.ts` exported by the tracked Fold barrel—must be handled by the broader worktree checkpoint, but they do not change the authoritative Math IR/Geometry decision.

## 8. Minimum stabilization plan

`STABILIZATION_REQUIRED=YES`.

`BEHAVIOR_CHANGE_REQUIRED=NO`.

Smallest safe future change set, not performed here:

1. Capture a fresh read-only manifest and hashes of every protected relevant file because concurrent authoring is active.
2. On an explicitly authorized stabilization branch/workflow, add the exact current Math IR production files, Geometry Engine production files, READMEs, focused tests and LuaDraw adapter without reformatting or semantic edits.
3. Review `scripts/run-regression.mjs` and register only the intended tests while preserving its unrelated concurrent Fold additions.
4. Decide whether fixtures remain exported by production barrels; the zero-change baseline may preserve the exports first and narrow them only in a later compatible change.
5. Add contract documentation stating `math-ir/v1` compatibility rules, Math IR authority, one-way `geometry-engine -> math-ir` and `fold -> geometry-engine` dependencies, and renderer/Fold exclusions.
6. Run TypeScript, focused contracts, all Fold suites, the primary legacy regression/build, LuaDraw contracts and Manim gates.
7. Confirm the resulting clean checkpoint can typecheck from Git alone in a fresh worktree. This is the essential stabilization acceptance test.

Stabilization scope:

```text
src/modules/math-ir/**
src/modules/geometry-engine/**
server/geometry/mathIrLuaDrawAdapter.ts
tests/test-math-ir-v1.ts
tests/test-geometry-engine-v1.ts
intended regression-runner registration
contract boundary documentation
```

The wider dirty Math Engine branch needs a separate preservation/reconciliation decision for other untracked Fold/Document/authoring work. Do not bundle or discard that work implicitly.

## 9. MV-0 redefinition

MV-0 is no longer “create a universal Math Scene foundation.” That foundation substantially exists. MV-0 should be renamed conceptually to **Math IR Dynamic Semantics Gap**, performed only after stabilization.

| Candidate | Already exists | Extend existing | New code required | Recommended location |
|---|---|---|---|---|
| MathObject/ObjectId | YES | NO | NO | reuse `math-ir/types.ts` |
| MathIR/MathScene | YES | NO | NO | reuse `math-ir/types.ts` |
| Constraint | YES declaratively | Later evaluator status only if required | NO for base contract | `math-ir/types.ts` |
| Relation | YES | Typed vocabulary/evaluation later | NO for base contract | `math-ir/types.ts` or registry beside it |
| Measurement | YES declaratively | Live evaluation later | NO for base contract | reuse Math IR entity |
| Serialization/version | YES | Migration registry later | NO for V1 | `math-ir/serialization.ts` |
| Dependency | NO | N/A | YES | future `src/modules/math-ir/dependencies.ts` |
| DynamicParameter | NO | N/A | YES | future `src/modules/math-ir/dynamic.ts` |
| MathEvent | NO | N/A | YES | future `src/modules/math-ir/events.ts` |
| CaseState | NO | N/A | YES | future `src/modules/math-ir/cases.ts` |
| Transformation | PARTIAL | YES | YES, minimal typed semantic extension | future Math IR transformation contract; Fold Mat4 stays internal |
| TimelineReference | PARTIAL | YES | YES, minimal correlation/track extension | extend Math IR animation contract compatibly |

Counts for these twelve candidates:

```text
MV0_NEW_CODE_COUNT=4
MV0_REUSE_COUNT=6
MV0_EXTENSION_COUNT=2
```

Dependency, DynamicParameter, MathEvent and CaseState should remain contract-only in the first authorized phase. No solver, UI, geometry tool, renderer or Fold migration belongs in MV-0.

## 10. Future visual engine boundary

`src/modules/geometry-engine` is confirmed as the reusable geometry foundation after stabilization. It should remain responsible for validation, reference resolution, normalization, capability negotiation and renderer-neutral adapter contracts—not curriculum reasoning or Fold behavior.

Recommended repository-conforming structure:

```text
src/modules/math-ir/                 # universal semantic contract
src/modules/geometry-engine/         # generic geometry normalization/routing
src/modules/math-visual/              # future visual orchestration only
  core/                               # dynamic scene evaluation using Math IR
  knowledge/                          # domain packs, no renderer imports
    sets/
    functions/
    euclidean/
    vectors/
    statistics/
  reasoning/                          # cases/events/loci later
  adapters/                           # client-safe adapter facades

src/modules/fold-3d/                 # unchanged specialized engine
src/modules/pattern-fold/             # unchanged specialized engine
server/geometry/                      # existing server/LuaDraw boundary
server/adapters/                      # Manim/document/server integrations
```

Names under `math-visual` are architectural recommendations only; no directory should be created until stabilization passes. Curriculum lesson IDs belong in a registry above knowledge packs, never in Math IR or Geometry Engine.

## 11. Adapter boundaries

```text
FOLD_ADAPTER_BOUNDARY=MathScene -> geometry normalization -> FoldTopology/FoldScene; Fold-specific nets/state remain in src/modules/fold-3d and pattern-fold
MANIM_ADAPTER_BOUNDARY=MathScene or compiled math-visual snapshot -> existing VideoSpecification/ManimScene/toolkit/local-render contracts
LUADRAW_ADAPTER_BOUNDARY=MathScene -> server/geometry/mathIrLuaDrawAdapter.ts -> existing GeometrySpec 1.0 -> existing validator/LuaDrawEngine
GEOGEBRA_FUTURE_BOUNDARY=MathScene snapshot <-> optional external construction adapter with explicit supported kinds, provenance and loss reporting; no runtime in core
```

Adapters must preserve stable IDs and provenance, state their supported entity kinds, report lossy mappings, and fail closed. They must not reinterpret layout coordinates as mathematical facts.

## 12. Legacy regression contract

Exact current protection:

| Area | Required tests/commands |
|---|---|
| Math IR | `node --import tsx tests/test-math-ir-v1.ts` |
| Geometry Engine + LuaDraw adapter | `node --import tsx tests/test-geometry-engine-v1.ts` |
| Fold core | `test-fold-3d-v1`, `test-n-gonal-fold-v1`, `test-developable-surfaces-v1`, `test-pattern-fold-v1` |
| Fold integration/authoring | `test-fold-studio-integration-v1`, `test-fold-studio-master`, authoring/remediation and viewer suites |
| Fold browser route | browser Fold/developable/authoring smokes with explicitly managed server/browser |
| Manim | primary `tests/test-studio-orchestrator.ts`, Python `tests/test_manim_toolkit.py`, local bridge/render suites and real golden runtime when available |
| LuaDraw | primary `tests/test-luadraw-contract.ts`, `scripts/doctor_luadraw.py`, opt-in real smoke |
| Primary legacy | `npm run arch:check`, `npm run lint`, `npm run build`, `npm run qa:regression` |

Current audit verification:

- Math Engine `npm run lint`: PASS.
- Math IR V1: PASS.
- Geometry Engine V1: PASS.
- Fold 3D V1: PASS.
- Fold Studio integration: PASS.

Mandatory future rule:

```text
NEW_FEATURE_QA=PASS
AND
LEGACY_PROTECTION_GATE=PASS
```

The gate must run from a reproducible Git checkout, not rely on untracked source.

## 13. Risk assessment

`DUPLICATE_ENGINE_RISK=HIGH` until the existing worktree-only modules are stabilized. The most dangerous duplicate would be `src/lib/mathScene`; other high-risk duplicates are a second entity/constraint vocabulary, geometry normalizer, scene serializer, renderer router, LuaDraw adapter, Fold transform math or Manim bridge.

`BREAKING_CHANGE_RISK=HIGH` because committed Fold code currently relies on untracked contracts. Once a clean contract checkpoint exists and adapters/golden fixtures are enforced, the residual integration risk should fall to medium without changing Fold behavior.

Fold, Manim and LuaDraw can all remain behaviorally unchanged. Future work attaches at their existing adapter boundaries.

## 14. Recommended next task

`MV_STAB_01_MATH_IR_GEOMETRY_ZERO_BEHAVIOR_CHECKPOINT`

This should be an explicitly authorized stabilization task, not MV-0 implementation. Its goal is to preserve the exact reviewed contracts and tests in Git, reconcile only regression registration, prove a clean checkout, and make no behavior changes. Because the worktree contains unrelated concurrent work, the task must begin with a file-level manifest and must not stage paths outside its approved scope.

## 15. Files read / changed / created

Read: both worktree Git baselines/status/provenance; prior audit reports; all Math IR production contracts and documentation; all Geometry Engine production contracts and documentation; LuaDraw compatibility adapter; dependency imports; focused Math IR/Geometry/Fold tests; regression registration; relevant Fold contracts for coupling verification.

Changed: no pre-existing file.

Created: `MV_ARCH_00C_MATH_ENGINE_WORKTREE_CONTRACT_STABILIZATION_AUDIT.md` in the primary repository.

## 16. Required final summary

```text
MV_ARCH_00C=PASS
PRIMARY_HEAD=cc95fa18da603aadec19f84c320a894a5e306b2b
PRIMARY_BRANCH=feature/mv-arch-00
MATH_ENGINE_HEAD=c9b677829b9790ea1452003cc3128ec8f3244af7
MATH_ENGINE_BRANCH=feature/math-production-engine-v1
MATH_ENGINE_TRACKED_STATUS=DIRTY_8_MODIFIED_PATHS
MATH_ENGINE_UNTRACKED_STATUS=DIRTY_PROTECTED_WORKTREE_SOURCE_AND_TESTS
MATH_IR_CONTRACT_AUDIT=PASS
GEOMETRY_ENGINE_CONTRACT_AUDIT=PASS
MATH_IR_STABLE_FOR_REUSE=NO
GEOMETRY_ENGINE_STABLE_FOR_REUSE=NO
SHARED_CORE_DEPENDS_ON_DIRTY_WORKTREE=YES
STABILIZATION_REQUIRED=YES
BEHAVIOR_CHANGE_REQUIRED=NO
AUTHORITATIVE_MATH_IR_LOCATION=D:\math-ai-video-studio\math-ai-video-studio-math-engine\src\modules\math-ir
AUTHORITATIVE_GEOMETRY_LOCATION=D:\math-ai-video-studio\math-ai-video-studio-math-engine\src\modules\geometry-engine
MV0_NEW_CODE_COUNT=4
MV0_REUSE_COUNT=6
MV0_EXTENSION_COUNT=2
RECOMMENDED_MV0_LOCATION=src/modules/math-ir
RECOMMENDED_VISUAL_ENGINE_LOCATION=src/modules/geometry-engine plus future src/modules/math-visual adapters/knowledge packs
FOLD_CAN_REMAIN_UNCHANGED=YES
MANIM_CAN_REMAIN_UNCHANGED=YES
LUADRAW_CAN_REMAIN_UNCHANGED=YES
DUPLICATE_ENGINE_RISK=HIGH
BREAKING_CHANGE_RISK=HIGH
MV0_READY_TO_IMPLEMENT=NO
RECOMMENDED_NEXT_TASK=MV_STAB_01_MATH_IR_GEOMETRY_ZERO_BEHAVIOR_CHECKPOINT
FILES_CHANGED=NONE
FILES_CREATED=MV_ARCH_00C_MATH_ENGINE_WORKTREE_CONTRACT_STABILIZATION_AUDIT.md
```
