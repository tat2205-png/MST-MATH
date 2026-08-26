# MV_ARCH_00 Reuse and Integration Audit

## 1. Executive summary

This is a documentation-only, read-first audit of checkpoint `cc95fa18da603aadec19f84c320a894a5e306b2b` on `feature/mv-arch-00`. No Math Visual feature, engine, adapter, schema migration, or source refactor was implemented.

The repository already has valuable brownfield assets: a verified problem/solution pipeline, deterministic algebra gates, a programmatic function-graph engine and SVG renderer, a versioned geometry artifact contract with LuaDraw validation/rendering, Manim planning and composition helpers, narration and cinematic camera timelines, a secure local render bridge, frame QA/repair contracts, and a feature-flagged engine registry/orchestrator. These should be reused behind adapters, not replaced.

The repository does **not** contain a universal semantic scene, dependency/constraint propagation kernel, command/history model, or universal serializer. It also does not contain a Fold Studio implementation at this checkpoint. The only tracked uses of “fold” are unrelated prose/YAML terminology. Consequently Fold ownership, schemas, geometry, renderer, saved-state, and compatibility boundaries cannot be determined. Under the task's fail-closed rules this makes `MV_ARCH_00=FAIL` and `MV0_READY_TO_IMPLEMENT=NO`, even though all runnable baseline source QA passed.

GeoGebra is not integrated: it is represented only by optional generated command strings and UI display/export. LuaDraw is a real, mature specialized artifact renderer. Manim is a real planning/composition/render pipeline, but its scene plan is not a semantic math scene.

## 2. Baseline

| Item | Result |
|---|---|
| Repository root | `D:\math-ai-video-studio\math-ai-video-studio-github` |
| Base checkpoint / current HEAD | `cc95fa18da603aadec19f84c320a894a5e306b2b` (exact match) |
| Current branch | `feature/mv-arch-00` |
| Source branch | `develop/v1.2` (task-declared; compared through `origin/develop/v1.2`) |
| Local commits ahead | 1 commit ahead of `origin/develop/v1.2` |
| Tracked worktree | Clean |
| Untracked | `.serena/.gitignore`, `.serena/project.yml`, `independently` |
| Package manager | npm, root `package-lock.json`; the nested `openclaw-extension-windows-fix` is a separate pnpm project |
| Node | v24.19.0 |
| Python | 3.14.7 |
| Manim | Community v0.19.2 |
| FFmpeg / ffprobe | 9.0, both available |

The pre-existing `.serena/` directory and zero-byte `independently` file were not read as product source, modified, moved, staged, or deleted.

### Baseline QA

| Contract | Command | Result |
|---|---|---|
| Architecture | `npm run arch:check` | PASS with 0 errors and 4 warnings |
| TypeScript | `npm run lint` (`tsc --noEmit`) | PASS |
| Build | `npm run build` | PASS; Vite reported a non-failing large-chunk warning |
| Regression | `npm run qa:regression` | PASS, 14/14 suites |
| Manim toolkit | `python -m unittest tests.test_manim_toolkit` | PASS, 6/6; deprecation warnings only |
| LuaDraw runtime | `python scripts/doctor_luadraw.py` | PASS, real temporary LuaLaTeX/LuaDraw smoke render |
| Full server health | `npm run qa:quick` / `qa:full` | NOT_TESTED; avoids starting or interacting with project/OpenClaw services during audit |
| Actual Manim MP4/frame gate | `npm run release:gate` / `scripts/run-golden-runtime.ts` | NOT_TESTED; would start/use external runtime services and create durable run artifacts |

Architecture warnings already present: `VisualTab` imports `GraphEngine` directly; `IntegrationDrawer` imports a server adapter directly; `pronunciation.ts` is orphaned; and dependency-cruiser flags Vite's dependency classification. The first two are relevant boundary-bypass risks for future integration.

## 3. Repository architecture map

```text
React UI (src/components, src/App.tsx)
  -> browser workflow/services
  -> Express API (server.ts)
     -> parse / solve / deterministic verification gate
     -> visual planner -> VisualSpecification / GraphSpec
     -> video planner -> VideoSpecification / ManimScene
     -> renderer adapter or secure local bridge -> Manim -> MP4/frames/log
     -> frame QA -> optional bounded repair loop
     -> explicit geometry endpoint -> GeometrySpec validator -> LuaDraw -> PDF/SVG

Cross-cutting contracts: src/types/*
Routing boundary: server/studio/engineRegistry.ts + studioOrchestrator.ts
Specialized renderer helpers: manim_toolkit/*, server/geometry/*
QA: tests/*, scripts/run-regression.mjs, scripts/dev-loop.ps1, scripts/release-gate.ps1
```

Foundational modules are the shared types, deterministic verification/gates, manifest/path validation, geometry validation, capability registry, and secure render bridge. Product-specific modules are the current React tabs, cinematic presentation planner, provider prompts, and repair UI.

Dependency direction is not fully enforced: two UI-to-engine/server imports bypass the preferred Studio boundary. No circular dependency error was reported. Several parallel representations exist: `VisualSpecification`, `GraphSpec`, `GeometrySpec`, `ManimScene`/`VideoSpecification`, `MasterCanvas`, `NarrationTimeline`, `GoldenScene`, and local render manifests. They describe different stages and should not be collapsed by migration; adapters should translate from a new semantic scene into each stage.

## 4. Reuse inventory

The decision register below is the source of the summary counts.

| Name / location | Responsibility and public interface | Maturity / tests | Classification | Risk and rationale |
|---|---|---|---|---|
| `MathProblemIR`, provenance, math gate (`src/types/mathSchema.ts`, verification services) | Source-grounded problem entities, textual constraints, verified solution state | Strong for supported algebra; regression-covered | REUSE_WITH_ADAPTER | Semantic seed data, but entities/relations are strings and not a live object graph |
| Deterministic verifiers (`server/services/deterministic*`) | Exact supported equations, inequalities, 2x2 systems | Strong, 60-case math suite | REUSE_AS_IS | Keep authoritative and fail-closed; semantic core may call it |
| `VisualSpecification` | Generic visual elements, coordinates, camera, TikZ/Asymptote/GeoGebra strings | Partial, planner/workflow tests | REUSE_WITH_ADAPTER | Presentation IR lacks dependencies, invariants, typed relations, versioning |
| `GraphSpec` | Function type/domain/features/samples/viewport/render config/verification | Strong for supported functions, 8/8 tests | REUSE_WITH_ADAPTER | Preserve as compiled graph artifact, not universal scene |
| `GraphEngine` | Parse/classify/analyze/sample/verify function graphs | Strong | REUSE_AS_IS | Do not duplicate expression sampling and feature analysis |
| `GraphRenderer.tsx` | React SVG axes/grid/branches/features | Strong for graph UI | REUSE_AS_IS | Specialized SVG output; consume compiled graph data |
| `GeometrySpec` v1.0 | Vertices/edges/faces/net/labels/dimensions/provenance | Strong for current polyhedral/net path | REUSE_WITH_ADAPTER | Narrow artifact schema, valuable stable target |
| Geometry validator/fingerprint | Structural, manifold, net, provenance gates | Strong, contract-tested | REUSE_AS_IS | Must remain authoritative for LuaDraw path |
| Geometry router | Feature-flagged backend selection | Small, tested | EXTEND_SAFELY | Add routes through registry without changing defaults |
| LuaDraw engine | Safe local TeX/TikZ generation and PDF/SVG artifacts | Strong; contract + real smoke | REUSE_WITH_ADAPTER | Specialized renderer; semantic meaning belongs above it |
| `ManimScene` / `VideoSpecification` | Pedagogic scene list, target IDs, animation commands, narration, generated Python | Mature pipeline contract | REUSE_WITH_ADAPTER | Target strings and generated Python are compiled output, not semantic identity |
| Python Manim toolkit | UI containers, LaTeX, 2D helpers, projection/intersection, axes, golden scene | Additive, 6 tests | REUSE_WITH_ADAPTER | Useful renderer-side helpers; numerical geometry should not become semantic truth |
| `NarrationTimeline` | Ordered cues, time ranges, visual/camera actions, QA | Partial | EXTEND_SAFELY | Reuse temporal contracts; keep distinct from construction history |
| `MasterCanvas` | Knowledge regions, connections, camera targets/shots | Partial, deterministic tests | EXTEND_SAFELY | Reuse presentation layout; not a math scene graph |
| Local render manifest/bridge | Secure single-file project, jobs, artifacts, ffprobe/frame extraction | Strong security/regression coverage | REUSE_AS_IS | Protected runtime boundary |
| Renderer adapter | Server-side render job abstraction | Partial; includes simulator fallback | REUSE_WITH_ADAPTER | Future production path must not treat simulator completion as real render proof |
| Studio registry/orchestrator | Capability discovery and feature-flagged routing | Tested | EXTEND_SAFELY | Natural integration seam; keep disabled-by-default rollout |
| Universal semantic object/dependency kernel | Typed math identity, dependencies, constraints, relation evaluation | Absent | NEW_COMPONENT_REQUIRED | Minimum MV-0 gap |
| Dynamic recalculation/case/event kernel | Propagation, critical transitions, mathematical versus layout state | Absent | NEW_COMPONENT_REQUIRED | Required for GeoGebra-like scientific behavior |
| Construction command/history | Reversible semantic mutations, snapshots/undo-redo | Absent | NEW_COMPONENT_REQUIRED | Narration and repair histories are not construction history |
| Universal versioned scene serializer/registry | Stable discriminated object persistence and migrations | Absent | NEW_COMPONENT_REQUIRED | Existing serializers are stage-specific JSON contracts |
| Existing HTTP APIs and pipeline order | Public browser/server compatibility | Regression-covered | DO_NOT_TOUCH | Add endpoints/versioned fields only |
| Existing saved schemas/render manifests | Geometry 1.0, visual/video/local render shapes | Regression-covered | DO_NOT_TOUCH | Adapt, never reinterpret in place |
| Fold boundary | No implementation present in checkpoint | Cannot test | DO_NOT_TOUCH | Do not invent or integrate until its source/contracts are available |

Counts: `REUSE_AS_IS=5`, `REUSE_WITH_ADAPTER=7`, `EXTEND_SAFELY=3`, `NEW_COMPONENT_REQUIRED=4`, `DO_NOT_TOUCH=3`.

## 5. Fold audit

`FOLD_AUDIT=FAIL` (fail-closed absence). No tracked Fold application, engine, models, meshes, fold/cut/crease operations, camera, renderer, serializer, UI, or tests exist in this checkpoint. Therefore a reliable Fold reuse map cannot be produced.

- FOLD_REUSE_MAP: unavailable until the actual Fold source/checkpoint is provided.
- FOLD_PROTECTED_BOUNDARIES: all unknown Fold public APIs, project files, geometry/state schemas, render behavior, and tests are presumptively protected.
- FOLD_SHARED_UTILITY_CANDIDATES: none may be approved from this repository state.
- FOLD_ADAPTER_CANDIDATES: conceptually a one-way semantic-scene-to-Fold adapter first; bidirectional conversion only after identity and losslessness are proven.
- FOLD_DUPLICATION_RISKS: HIGH. Creating 3D solids, meshes, projections, hidden edges, nets, or transformations before auditing Fold could duplicate or contradict it.

## 6. Manim and animation audit

`MANIM_AUDIT=PASS`.

The planning contract is `VideoSpecification.scenes[]` with `ManimScene`, string `visual_objects`, target-based `ManimAnimation`, narration, and generated `manim_python_code`. Separate temporal representations include narration cues and cinematic camera shots. Object IDs are strings scoped by the plan; there is no shared registry or enforced scene binding. `VideoPlannerService` compiles provider output/fallback Python. `manim_toolkit` supplies additive composition primitives. The renderer adapter and local bridge manage projects, jobs, MP4/frame/log artifacts, runtime status, ffprobe-backed validation, and frame QA/repair.

- MANIM_REUSE_MAP: keep planner schemas, toolkit, local bridge, artifacts, ffprobe/frame gates, QA, and skill modules.
- MANIM_PROTECTED_BOUNDARIES: `VideoSpecification`, local manifest validation, loopback/token security, job/artifact shapes, runtime/frame truthfulness, generated Python path.
- MANIM_ADAPTER_CANDIDATES: `NA Math Scene -> compiled ManimScene/VideoSpecification`; semantic IDs become stable target names; a renderer compiler maps typed objects/actions to toolkit or Manim primitives.
- MANIM_TIMELINE_REUSE: reuse narration and camera timelines as output timelines; do not use them as semantic construction history.
- MANIM_SCENE_REUSE: reuse as a render/pedagogy DTO, not as the universal scene.
- MANIM_DUPLICATION_RISKS: HIGH for a second animation timeline, renderer job system, artifact protocol, or geometry helper library.

## 7. LuaDraw audit

`LUADRAW_AUDIT=PASS`.

LuaDraw is an explicit, feature-flagged specialized renderer implementing `GeometryEngine.render(GeometrySpec, outputDir)`. It validates a fingerprinted 1.0 geometry contract, enforces workspace-contained output, emits metadata/QA JSON plus PDF/SVG, and invokes LuaLaTeX and dvisvgm without a shell. Current supported semantic surface is polygon/coordinate 2D and polyhedron/polyhedron-net data; the renderer presently emits TikZ polygons/labels from net or vertex coordinates. It is not a live scene, dependency system, or state store.

- LUADRAW_REUSE_MAP: validator, fingerprint, `GeometrySpec`, router flags, output security, artifacts, and QA.
- LUADRAW_PROTECTED_BOUNDARIES: schema 1.0, provenance fingerprint, artifact names/shapes, default-disabled routing.
- LUADRAW_ADAPTER_CANDIDATES: compile a supported semantic-scene projection into `GeometrySpec`; optionally import only trusted metadata with explicit loss reporting.

## 8. GeoGebra audit

`GEOGEBRA_AUDIT=NOT_PRESENT`.

There is no embed, runtime API bridge, synchronization, construction import/export, slider handling, persistence, or integration test. `VisualSpecification.geogebra_commands?: string[]`, the visual-planner prompt, and a UI code tab are the entire footprint.

- REUSED: command text display/export only.
- WRAPPED: nothing yet.
- LEFT_EXTERNAL: GeoGebra runtime, construction engine, dynamic solver, sliders, loci.
- NOT_DUPLICATED: do not rebuild GeoGebra wholesale; implement only curriculum-required semantic behavior and use an optional adapter later.
- GEOGEBRA_DUPLICATION_RISK: HIGH if “GeoGebra-like” is interpreted as cloning its UI/kernel before MV-0 needs are proven.

## 9. Existing universal-core discovery

| Concept | Exists / current name / location | Maturity | Reuse / gaps / recommendation |
|---|---|---|---|
| MathObject | PARTIAL: `MathEntity`, `VisualElement`, geometry/graph records | Fragmented | Adapter; define minimal discriminated semantic identity |
| MathScene / SceneObject | PARTIAL: `VisualSpecification`, `ManimScene`, `GoldenScene`, `MasterCanvas` | Output-specific | New semantic scene; preserve all DTOs as adapter targets |
| DependencyGraph | NO | — | New minimal acyclic dependency declarations/evaluator boundary |
| Constraint | PARTIAL: textual `MathConstraint` | Parsing-oriented | Adapter; add typed declarative constraint references later |
| Relation | PARTIAL: `MathEntity.relations?: string[]` | Unstructured | Adapter; typed relation with evidence/status required |
| Measurement | PARTIAL: `GeometryDimension` | Artifact-specific | Adapter; derived live measurement absent |
| Transformation | PARTIAL: algebra trace and Manim animation types | Different meanings | Do not merge; introduce semantic transform contract |
| DynamicParameter | NO | — | New optional parameter value/domain contract |
| MathEvent | NO | — | New typed semantic transition/critical-event envelope |
| MathState | PARTIAL: React `AppState`, render/repair states | Product/runtime state | Keep separate; new semantic snapshot required |
| History / Command / UndoRedo | NO for mathematical construction | — | New minimal append-only commands/history; no UI in MV-0 |
| Serializer | PARTIAL: normal JSON bodies/files, geometry metadata, manifests | Multiple unversioned/versioned DTOs | New versioned semantic serializer, adapters around legacy DTOs |
| ObjectRegistry | PARTIAL: engine capability registry, IDs within DTOs | Not object lifecycle | Add scene-local semantic registry only |
| Expression | PARTIAL: graph parser strings and deterministic polynomial parsing | Strong but narrow | Reuse engines; MV-0 stores source/canonical expression without inventing CAS |
| SemanticObject | NO unified equivalent | — | New minimal base contract |

Current components cannot distinguish `VISUAL_LAYOUT_CHANGE` from `MATHEMATICAL_STATE_CHANGE` in a general way. Graph viewport and MasterCanvas positions are layout, while problem/geometry data are mathematical, but there is no explicit state-channel invariant or propagation model.

## 10. Existing visual capability matrix

| Capability | Support | Reusable components | Missing / duplication risk |
|---|---|---|---|
| Set/Venn | PARTIAL | `set` entity, probability planner prompt | No set operations/regions/dynamics; medium |
| Number line/intervals | PARTIAL | inequality intervals/sign analysis | No renderer or movable endpoints; medium |
| Function graphs | STRONG | GraphEngine, GraphSpec, SVG renderer | Parameter propagation/loci; high duplication risk |
| Inequality regions | PARTIAL | deterministic inequality verifier, shaded-region visual element | 2D half-plane solver/renderer; medium |
| Euclidean geometry | PARTIAL | visual primitives, Manim helpers | semantic construction/constraints; high |
| Geometric transformations | PARTIAL | Manim `Transform`/`Rotate`, algebra traces | semantic transforms/invariants; high |
| Conics | PARTIAL | generic circle/curve/function paths | conic semantics/classification; medium |
| Vectors 2D/3D | PARTIAL | entity/visual vector and coordinates | operations/dependencies; medium |
| Spatial geometry | PARTIAL | GeometrySpec polyhedra/nets, 3D visual fields | general solids/relations; high, especially unknown Fold |
| Oxy | STRONG/PARTIAL | Graph engine/renderer, coordinate visual spec | dynamic construction; high |
| Oxyz | PARTIAL | 3D coordinates/camera, Manim axes | analytic kernel/projections; high |
| Projection/technical drawing | PARTIAL | Manim point-line projection helper, camera fields | orthographic/axonometric semantics; high and Fold-blocked |
| Graph theory/networks | NONE | no mathematical graph topology (function graph is unrelated) | new knowledge engine after MV-0; low current collision |
| Combinatorics visuals | NONE | domain labels only | new later; low |
| Statistics | PARTIAL | visual type/prompt only | datasets/scales/charts; medium |
| Probability | PARTIAL | visual type/prompt only | events, distributions, trees; medium |
| Random variables | NONE | none | new later; low |
| Calculus visuals | PARTIAL/STRONG | function graphs, extrema/inflection/asymptotes | derivative/integral semantic overlays; high |
| Optimization | PARTIAL | domain/visual type | feasible regions/objective dynamics; medium |
| Financial timelines | NONE | narration timeline is not finance | new later; low |

The proposed kernel is sufficiently general for the listed Kết nối tri thức domains only if knowledge engines remain plugins above a small dimension-agnostic semantic object/dependency layer. Curriculum identifiers must never enter primitive geometry or render contracts.

## 11. Duplicate-risk analysis

`DUPLICATE_ENGINE_RISK=HIGH`.

| Existing implementation | Why duplication is dangerous | Recommended reuse strategy |
|---|---|---|
| GraphEngine + GraphSpec + SVG renderer | A second parser/sampler/viewport produces disagreeing roots, domains, and plots | Treat GraphSpec as a compiled artifact and embed/link it from semantic objects |
| GeometrySpec/validator/LuaDraw | A second polyhedron/net/provenance path breaks trusted artifacts | Compile semantic geometry into schema 1.0 through an adapter |
| Unknown Fold Studio | Its geometry/mesh/projection/state ownership cannot be seen | Block 3D/Fold design until source audit |
| Manim scene/video/local bridge | Parallel scenes, timelines, jobs, artifacts, and truth gates drift | Compile to existing VideoSpecification and bridge protocol |
| VisualSpec, MasterCanvas, narration timeline | Collapsing distinct layout, camera, narration, and math state corrupts meanings | Keep bounded contexts and explicit mapping adapters |
| JSON schemas/manifests | In-place “unification” breaks APIs and saved projects | New versioned semantic envelope plus non-destructive adapters |

## 12. Breaking-change analysis

`BREAKING_CHANGE_RISK=HIGH`.

- HIGH — Fold compatibility is unknowable. Mitigation: obtain/audit the actual Fold source and fixtures before any 3D or bidirectional adapter work.
- HIGH — replacing `VisualSpecification`, `GraphSpec`, `GeometrySpec`, or `VideoSpecification`. Mitigation: append optional versioned references and compile through adapters; retain legacy endpoints and snapshots.
- HIGH — using one timeline for semantic history, narration, camera, and animation. Mitigation: separate clocks and use correlations by stable IDs.
- HIGH — treating renderer simulation or generated Python as verified mathematical state. Mitigation: semantic authority stays upstream; real runtime + artifact + frame gates remain mandatory.
- MEDIUM — UI imports bypassing public boundaries. Mitigation: add a facade in a future isolated change, with regression tests; do not refactor during MV-0.
- MEDIUM — GeoGebra command strings mistaken for synchronized constructions. Mitigation: mark export-only until an explicit tested adapter exists.
- MEDIUM — serializer/version drift. Mitigation: immutable schema version, deterministic round-trip tests, unknown-field preservation, migrations only as opt-in copies.

## 13. Proposed minimum-change architecture

Do not create a second application or engine hierarchy. Add a small shared semantic package beside existing types, then integrate through the existing registry:

```text
src/lib/mathScene/                 # recommended only after Fold blocker clears
  contracts/                       # IDs, objects, scene, dependency declarations
  state/                           # immutable state + commands/history
  serialization/                   # versioned deterministic JSON
  index.ts                         # sole public facade

server/adapters/mathScene/         # later compiler/adapters
  toGraphSpec.ts
  toGeometrySpec.ts
  toVideoSpecification.ts
  toVisualSpecification.ts
  toFold.ts                        # blocked until Fold audit
  geogebraCommands.ts              # optional/export-only initially
```

Existing engines remain siblings behind `StudioEngineRegistry`. The semantic core owns mathematical identity and dependencies; dynamic kernels evaluate domain-specific rules; knowledge engines contribute typed objects/operations; output adapters compile immutable snapshots. Layout/camera/narration/render jobs remain output concerns.

## 14. Proposed MV-0 contract

MV-0 must contain contracts and deterministic round-trip behavior only—no UI, tools, geometry algorithms, 3D, or renderer integration.

| Concept | Reuse existing | Existing location | Adapter | New code | Why |
|---|---|---|---|---|---|
| MathObject | Partial | `MathEntity`, IDs across specs | YES | YES | Stable ID, kind, metadata, semantic payload |
| MathScene | Partial | Visual/Manim/MasterCanvas DTOs | YES | YES | Versioned object registry and roots without output concerns |
| Dependency | No | textual references only | YES | YES | Explicit source/target/role declarations |
| Constraint | Partial | `MathConstraint` | YES | YES | Typed references and evaluation status, while preserving source text |
| Relation | Partial | `MathEntity.relations` | YES | YES | Typed relation/evidence/status |
| Transformation | Partial | algebra traces/Manim commands | YES | YES | Semantic transform distinct from animation |
| DynamicParameter | No | none | NO | YES | Value/domain/step/locked declaration only |
| MathEvent | No | runtime statuses are unrelated | NO | YES | Typed transition envelope; no event engine yet |
| MathState | Partial | product/runtime states | YES | YES | Immutable semantic snapshot with revision |
| History | No | repair history is unrelated | NO | YES | Append-only accepted commands and revisions |
| Serialization | Partial | JSON DTOs | YES | YES | `schemaVersion`, deterministic round-trip, fail-closed unknown kinds |

Minimal acceptance tests: unique IDs; dangling dependency rejection; deterministic serialization/round-trip; immutable revision increment; unknown kind/version rejection; no imports from React, Express, Manim, LuaDraw, GraphRenderer, or Fold; legacy QA unchanged. Evaluation algorithms, constraints solvers, undo UI, render adapters, and curriculum objects are out of scope.

## 15. Curriculum capability registry

`CURRICULUM_CAPABILITY_REGISTRY_RECOMMENDED=YES`, but not in MV-0. Put it above the kernel (for example `server/curriculum/` or data under a future knowledge package). Records map curriculum lesson IDs to capability IDs and version ranges; engines register capabilities through the Studio registry. Kernel primitives must not import curriculum IDs.

## 16. Adapter strategy

| Adapter | Needed | Direction | Source -> target | Risk | Priority |
|---|---|---|---|---|---|
| Fold -> NA scene | UNKNOWN/blocked | Import | Unknown Fold contract -> semantic snapshot | HIGH | Blocked |
| NA scene -> Fold | YES if Fold is retained | Export | Semantic snapshot -> unknown Fold contract | HIGH | After Fold audit |
| NA scene -> Manim | YES | Export | Snapshot/actions -> VideoSpecification/toolkit/Python | HIGH | P1 after MV-0 |
| GeoGebra <-> NA scene | NO for MV-0 | Later optional | Commands/construction API <-> snapshot | HIGH | P3 |
| LuaDraw <-> NA scene | YES, export first | Primarily export | Supported objects -> GeometrySpec 1.0 | MEDIUM | P2 |
| Question engine -> NA scene | YES later | Import | MathProblemIR/verified solution -> scene seed | MEDIUM | P1 |
| NA scene -> document renderer | YES later | Export | Snapshot -> current TeX/visual export inputs | MEDIUM | P2 |
| NA scene -> GraphSpec | YES | Export | Function object/parameters -> GraphEngine input/GraphSpec | MEDIUM | P1 |

All adapters must declare supported object kinds, preserve source IDs/provenance, report lossy fields, and fail closed rather than inventing geometry.

## 17. Legacy Protection Gate

Both `NEW_FEATURE_QA=PASS` and `LEGACY_PROTECTION_GATE=PASS` must be required.

| Gate | Exact current command/evidence |
|---|---|
| Existing architecture | `npm run arch:check` |
| Existing TypeScript | `npm run lint` |
| Existing build | `npm run build` |
| Existing tests | `npm run qa:regression` |
| Math | `npm run qa:math` (also included in regression) |
| LuaDraw contract | `node --import tsx tests/test-luadraw-contract.ts` |
| LuaDraw runtime | `npm run qa:luadraw` and opt-in `npm run qa:luadraw:smoke` |
| Manim toolkit | `python -m unittest tests.test_manim_toolkit` |
| Studio routing | `node --import tsx tests/test-studio-orchestrator.ts` |
| Runtime/server | `npm run qa:quick` / `npm run qa:full` with port-owner verification |
| Real Manim/render/artifacts | `npm run release:gate` -> full QA + `scripts/run-golden-runtime.ts` |
| API/schema/serialization | Existing regressions plus future golden fixtures and round-trip compatibility tests |
| Fold Studio | BLOCKED: no code/test command in checkpoint |
| Worktree preservation | compare tracked diff and exact pre-existing untracked paths before/after |

Future MV-0 also needs isolated unit tests and a dependency-cruiser rule preventing the semantic core from importing UI/server/render engines.

## 18. Recommended next phase

Do **not** implement MV-0 yet. First perform `MV_ARCH_00B_FOLD_SOURCE_BOUNDARY_AUDIT`: identify the repository/branch/submodule/package containing Fold Studio, place it in read-only audit scope, capture its public schemas and fixtures, and decide whether its absence here is intentional. If Fold is intentionally external, record an explicit external protected contract and representative compatibility fixtures. Then update this report and re-evaluate the proposed location before authorizing MV-0.

## 19. Files read / changed / created

Read: task attachment; `package.json`; root file inventory and tracked tree; `README.md`; `AUDIT_FIX_ROADMAP.md`; `src/types/{mathSchema,geometrySpec,graphSchema,cinematicCanvas,localRender,narrationTypes}.ts`; graph engine/renderer; browser workflow; `server.ts`; server geometry, studio registry/orchestrator, adapters, planners, runtime/golden/export services; local bridge; Manim toolkit; LuaDraw/Manim/Studio tests; regression/dev-loop/release scripts; repository-wide tracked symbol searches. Test dependencies loaded by the official suites are also reflected in QA evidence.

Changed: none of the pre-existing files.

Created: `MV_ARCH_00_REUSE_INTEGRATION_AUDIT.md` only.

## Required final summary

```text
MV_ARCH_00=FAIL
BASE_CHECKPOINT=cc95fa18da603aadec19f84c320a894a5e306b2b
CURRENT_HEAD=cc95fa18da603aadec19f84c320a894a5e306b2b
CURRENT_BRANCH=feature/mv-arch-00
SOURCE_BRANCH=develop/v1.2
WORKTREE_STATUS=DIRTY_UNTRACKED_PLUS_AUDIT_REPORT
TRACKED_WORKTREE_STATUS=CLEAN
PRE_EXISTING_UNTRACKED_PRESERVED=PASS
BASELINE_BUILD_QA=PASS
BASELINE_TEST_QA=PASS
BASELINE_TYPESCRIPT_QA=PASS
BASELINE_RUNTIME_QA=NOT_TESTED
BASELINE_RENDER_QA=NOT_TESTED
FOLD_AUDIT=FAIL
MANIM_AUDIT=PASS
GEOGEBRA_AUDIT=NOT_PRESENT
LUADRAW_AUDIT=PASS
DUPLICATE_ENGINE_RISK=HIGH
BREAKING_CHANGE_RISK=HIGH
REUSE_AS_IS_COUNT=5
REUSE_WITH_ADAPTER_COUNT=7
EXTEND_SAFELY_COUNT=3
NEW_COMPONENT_REQUIRED_COUNT=4
DO_NOT_TOUCH_COUNT=3
RECOMMENDED_MV0_LOCATION=src/lib/mathScene
RECOMMENDED_VISUAL_ENGINE_LOCATION=src/lib/mathScene plus server/adapters/mathScene; no engine implementation yet
FOLD_ADAPTER_REQUIRED=YES
MANIM_ADAPTER_REQUIRED=YES
GEOGEBRA_ADAPTER_REQUIRED=NO
LUADRAW_ADAPTER_REQUIRED=YES
CURRICULUM_CAPABILITY_REGISTRY_RECOMMENDED=YES
LEGACY_PROTECTION_PLAN=PASS
MV0_READY_TO_IMPLEMENT=NO
RECOMMENDED_NEXT_TASK=MV_ARCH_00B_FOLD_SOURCE_BOUNDARY_AUDIT
FILES_READ=attachment plus repository contracts, architecture, engines, pipelines, QA, tests, and documentation listed in section 19
FILES_CHANGED=NONE
FILES_CREATED=MV_ARCH_00_REUSE_INTEGRATION_AUDIT.md
```

The failure is a deliberate fail-closed architectural result: Fold/Manim boundaries were both required to be determined reliably, but the Fold source is absent. It is not a failure of the current build, tests, Manim toolkit, or LuaDraw runtime.
