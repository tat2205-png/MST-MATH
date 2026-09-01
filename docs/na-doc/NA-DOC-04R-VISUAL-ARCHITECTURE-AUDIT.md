# NA-DOC-04R — Mathematical Visual Architecture Audit

Status: **AUDIT COMPLETE — RUNTIME UNCHANGED**

Baseline: `8f2918982fa7e58deb77e43c5bb713bd2da3e3d4`

Branch: `audit/na-doc-04r-visual-architecture`

Scope: repository evidence only; no NA-DOC-04A0–04B implementation.

## Executive conclusion

Math AI Studio already contains a useful semantic spine in `src/modules/math-ir/` and a renderer-neutral routing layer in `src/modules/geometry-engine/`. It does **not** yet have one validated mathematical visual model used by every output. Function graph analysis, interactive construction, fold/solid construction, LuaDraw projection, Three.js display, image-animation/Manim generation, and the locked NA-MATH V2.6 standards tree remain separate paths with partially duplicated responsibilities.

The highest-risk runtime path is `src/lib/graphEngine/`: it extracts expressions from prose, classifies functions with regular expressions, derives domains/features/asymptotes, samples curves, selects a viewport, and then labels the result as verified. Several derivations are correct only for narrow recognized forms, while fallbacks can claim all-real domain or infer an asymptote from denominator zero without cancellation analysis. The geometry engine is safer at its semantic boundary, but its deterministic `visual_only` coordinates can become concrete output, and its function-graph sampling is explicitly delegated to adapters. The server LuaDraw engine projects 3D with a fixed affine formula and does not calculate occlusion.

NA-DOC-04A0 should therefore add a fail-closed safety envelope around existing Math IR—not a new engine. Renderers must accept validated visual semantics and must not extract, solve, infer, or construct mathematics.

## 1. Visual system inventory

| Module | Path | Responsibility | Input | Output | Performs math | Visual only | Duplicate/risk | Risk |
|---|---|---|---|---|---|---|---|---|
| Math IR V1 | `src/modules/math-ir/` | Points, lines, rays, segments, vectors, planes, solids, axes, graphs, constraints, camera, style | structured IR | `MathScene` | represents facts | no | canonical semantic candidate | LOW |
| Geometry Engine V1 | `src/modules/geometry-engine/` | validation, reference resolution, normalization, capability routing, SVG/TikZ/LuaDraw/Manim adapters | `MathScene` | normalized scene / renderer output | limited classification | yes | graph sampling delegated; visual coordinate fallback | MEDIUM |
| Graph Engine | `src/lib/graphEngine/` | parse, classify, domain/features, roots/extrema/asymptotes, viewport, sampling, verification | prose/LaTeX string | `GraphSpec` | **yes** | partly | separate graph semantic model | CRITICAL |
| SVG graph renderer | `src/components/graph/GraphRenderer.tsx` | axes/grid/ticks/labels/path drawing | `GraphSpec` | SVG DOM | no new roots | yes | independent x/y transforms, fixed label offsets | MEDIUM |
| Dynamic geometry | `src/modules/dynamic-geometry/` | constructions, intersections, projection, transforms, constraints, snapping | `MathScene` + explicit command | updated `MathScene` | **yes** | Three adapter | appropriate only as explicit construction service | HIGH |
| Constraint orchestration/runtime | `src/modules/constraint-orchestration/`, `src/modules/intelligent-math-runtime/`, `src/modules/dynamic-workspace/` | dependencies, recomputation, workspace interaction | structured scene/events | semantic updates | yes | no | overlaps construction lifecycle | MEDIUM |
| Fold/solid engine | `src/modules/fold-3d/` | topology, canonical solids/nets, folding, developable surfaces, Three/Manim/SVG/TikZ boundaries | `MathScene` or solid parameters | fold scenes/mappings | **yes** | partly | separate solid model and canonical generators | HIGH |
| Pattern fold | `src/modules/pattern-fold/` | sheet construction, partition, fold transforms | pattern sheet | transformed pattern/scene | yes | partly | separate geometry representation | HIGH |
| Surface shortest path | `src/modules/surface-shortest-path/` | unfolds surfaces and solves routes | fold topology/surface points | route | **yes** | no | solution-generating visual data | HIGH |
| Server LuaDraw | `server/geometry/` | validate `GeometrySpec`, fixed 3D projection, TikZ/LuaDraw artifact | `GeometrySpec` | TeX/PDF/SVG artifact | projection | yes | parallel server geometry model | HIGH |
| Studio renderer adapters | `server/studio/adapters/` | route LuaDraw/Manim/image animation | job/visual plan | render artifact/job | partly upstream | yes | different capability contracts | MEDIUM |
| Image animation | `image-animation/core/`, `image-animation/renderers/` | locked 2D scene graph, edits, Manim/Blender/generative adapters | scene graph/timeline | scripts/artifacts | geometry transforms | yes | separate node geometry | HIGH |
| Manim toolkit | `manim_toolkit/` | geometry primitives, projection and relation markers, scene utilities | generated Python calls | video frames | helper math | yes | can construct markers independently | HIGH |
| Visual/video planners | `server/services/visualPlanner.ts`, `videoPlanner.ts`, `masterCanvasPlanner.ts`, `visualFrameQAService.ts` | choose assets/renderers and frame plans | question/solution/job | visual plan | heuristic selection | no | provenance/solution boundary incomplete | HIGH |
| DOCX visual path | `src/modules/document-export/docx/figures.ts`, Question Bank assets/export | embed verified SVG/images/figures | asset/figure | DOCX package | no | yes | depends on upstream correctness | LOW |
| NA-MATH V2.6 locked standard | `standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/.../NA_MATH_GEOMETRY_RULES_V1_8_GEO8/` | canonical builders, inference catalog, profiles, visibility, labels, QA | standard-specific scene | validated standard artifacts | **yes** | partly | partially integrated through config, parallel types | HIGH |

Other discovered visual technologies are configuration/capability paths rather than one canonical runtime: TikZ, SVG, Three.js, LuaDraw, Manim, Blender and generative image animation. Canvas/GeoGebra appear as capability or UI concerns; repository evidence does not establish a canonical Canvas mathematical renderer.

## 2. Pipeline map

### Renderer-neutral geometry path

`MathScene` → `validateGeometryScene` → `resolveGeometryEntities` → `normalizeGeometryScene` → `selectGeometryRenderer` → SVG/TikZ/LuaDraw/Manim adapter.

- Semantic source: Math IR V1.
- Inference: scene classification and renderer requirements; missing coordinates receive deterministic `visual_only` candidates.
- Construction: none by contract.
- Projection: adapter-specific; not centralized.
- Labels: semantic labels plus adapter placement.
- Call sites: geometry tests, fold topology, LuaDraw compatibility.

### Function graph path

raw prose/LaTeX → `FunctionParser` → `FunctionClassifier` → `DomainAnalyzer` → `FeatureAnalyzer` → `ViewportEngine` → `SamplingEngine` → `GraphVerifier` → `GraphRenderer`.

- Semantic source: unstructured user text, not Math IR.
- Inference: expression extraction, equation reinterpretation, function family, domain, roots, intercepts, extrema, asymptotes and discontinuities.
- Renderer: SVG React component.
- Call sites: `src/components/tabs/VisualTab.tsx`, graph and skill-integration tests.

### Interactive construction path

`MathScene` + explicit construction command → `executeConstructionCommand` → dependency rebuild/recompute → renderer snapshot → Three.js adapter.

- Math operations include midpoint, intersections, projection, parallel/perpendicular constructions, transforms, point-on-object and 3D plane operations.
- These operations are legitimate only when explicitly requested by validated semantics; they must never be silently invoked by a renderer.

### Solid/fold path

Math IR solid or canonical parameter input → topology/canonical solid/developable construction → fold state/net/surface mapping → Three.js, SVG, TikZ or Manim boundary.

- Construction and projection responsibilities are distributed.
- `canonical-solids.ts` and `n-gonal-solids.ts` supply deterministic coordinates and perspective cameras; these are generated models, not source-preserving general solid semantics.

### Server document/video path

question/source assets/solution → visual planner → LuaDraw/Manim/image-animation adapter → artifact → DOCX/video/export consumer.

- DOCX embedding is visually passive.
- Mathematical validity and source-versus-solution provenance are not uniformly enforced at the common adapter boundary.

## 3. Coordinate geometry risk matrix

| Path/function | Current behavior | Classification | Risk |
|---|---|---|---|
| `math-ir/types.ts` axes/points/lines/rays/segments | represents supplied entities | VALID_VISUAL_SEMANTICS | LOW |
| `geometry-engine/normalize.ts::visualCandidate` | invents deterministic render coordinates for points lacking coordinates | VALID_VISUAL_TRANSFORM only if never read as mathematics; otherwise UNSAFE_HEURISTIC | HIGH |
| `dynamic-geometry/construction-engine.ts` | explicitly creates intersections, projections, parallel/perpendicular lines and constrained points | MATHEMATICAL_INFERENCE, command-authorized | HIGH |
| `dynamic-geometry/index.ts::normalizeDynamicGeometry` | auto-generates point/segment/circle labels | UNSAFE_HEURISTIC for source fidelity | MEDIUM |
| `GraphRenderer.tsx` | generates Ox/Oy, grid, ticks, numbers and origin; independently scales axes | VALID_VISUAL_TRANSFORM with aspect-distortion risk | MEDIUM |
| Graph feature/viewport engines | invent intercept points, solution features, labels and a viewport from inferred math | MATHEMATICAL_INFERENCE | CRITICAL |
| server `luadrawEngine.ts` | fixed `x + .5z`, `y + .35z` projection; labels above points | UNSAFE_HEURISTIC | HIGH |

There is no single coordinate contract preserving origin, equal unit scale, validated viewport, label provenance and source/solution role across renderers. Inequality/half-plane/feasible-region support was not found as a unified canonical implementation; any such behavior remains renderer/planner-specific or absent.

## 4. Function graph risk matrix

| Location | Finding | Classification | Risk |
|---|---|---|---|
| `functionParser.ts` | extracts formulas from Vietnamese prose and converts `f(x)=g(x)` into a zero equation | MATHEMATICAL_INFERENCE | HIGH |
| `classifier.ts` | family and coefficients selected using substring/regex heuristics | UNSAFE_HEURISTIC | CRITICAL |
| `domainAnalyzer.ts` | solves only simple linear radical/log/denominator forms; unsupported fallback may return all reals | UNSAFE_HEURISTIC | CRITICAL |
| `featureAnalyzer.ts` quadratic/linear/cubic | calculates roots, vertex, critical and inflection points | MATHEMATICAL_INFERENCE | HIGH |
| `featureAnalyzer.ts` rational | treats a linear denominator zero as vertical asymptote without cancellation/hole analysis | UNSAFE_HEURISTIC | CRITICAL |
| exponential/log/trig handling | no evidence of a complete transformation-aware symbolic contract for domain, asymptote, period, phase and angle unit | UNCLEAR/INCOMPLETE | CRITICAL |
| `samplingEngine.ts` | splits only at known inferred singularities; removes out-of-clamp points but can leave adjacent sample gaps connected | UNSAFE_HEURISTIC | HIGH |
| `viewportEngine.ts` | derives viewport from inferred features; contains a defect using `turningPoint.x` as a y extent | UNSAFE_HEURISTIC | HIGH |
| `graphVerifier.ts` | validates generated roots numerically but declares domain/asymptote separation PASS largely from construction, not independent proof | UNSAFE_VERIFICATION | CRITICAL |
| `GraphRenderer.tsx` | draws supplied branches; fixed pixel canvas and independent scale, fixed label offset | VISUAL_TRANSFORM | MEDIUM |

No generic S-shape cubic template was found; cubics are sampled. However family detection and coefficient extraction can misclassify expressions. There is no sufficiently strong evidence that transformed exponential/logarithmic/trigonometric functions, holes, arbitrary rational functions, angle units or branch discontinuities are fail-closed.

## 5. Vector geometry risk matrix

- Math IR distinguishes `point`, `segment`, `vector` and expression values, but `VectorEntity` has optional endpoints or components and does not explicitly distinguish free vector, position vector and renderer instance.
- Endpoint order is represented by `startPointId`/`endPointId`; adapters must preserve it.
- `geometry-engine/references.ts` resolves vector endpoint references but no central vector-algebra validator was found.
- `dynamic-geometry/construction-engine.ts` uses tuple vectors internally for transformations, dot/cross/norm and direction construction; these computational tuples are not the same as semantic vector entities.
- `dynamic-geometry/three-adapter.ts` handles lines/rays/segments but no canonical vector arrow path was established.
- `manim_toolkit/geometry_tools.py` and generated animation paths can create arrows/parallel/perpendicular markers without a common validated vector semantic gate.
- No evidence establishes a uniform zero-vector policy, free/position-vector distinction, immutable vector render copies, or student solution-vector isolation.

Classification: **PARTIAL, HIGH risk**. Renderers must not infer direction relations, reverse endpoints, rescale semantic magnitude, or create result vectors.

## 6. Solid geometry risk matrix

| Subsystem | Supported evidence | Risk |
|---|---|---|
| Math IR / Geometry Engine | prism, pyramid, polyhedron, sphere, cylinder, cone plus 3D points/faces/camera; validates references | MEDIUM: semantic types are broad, regularity/source provenance not formalized |
| `fold-3d/canonical-solids.ts` | deterministic canonical cube/prism/pyramid-style models and perspective camera | HIGH if substituted for an arbitrary source solid |
| `fold-3d/n-gonal-solids.ts` | generated n-gonal prisms/pyramids with canonical coordinates | HIGH: generated regular/canonical layout must be explicit |
| `fold-3d/topology.ts` | topology derived from supplied faces/segments through normalized geometry | MEDIUM |
| developable surfaces | cylinder, cone, conical frustum; nets and surface mappings | MEDIUM: mathematically substantive but parameter-explicit and tested |
| server LuaDraw | polyhedron projection; faces/edges from `GeometrySpec` | HIGH: fixed projection, no geometric occlusion |
| Three fold adapters | mesh/fold visualization | MEDIUM: renderer mapping separate from Math IR camera/visibility policy |
| V2.6 standards tree | profiles, inference catalogs, projection/visibility/labels and golden cases | HIGH architectural duplication; strongest safety knowledge is not the universal runtime gate |

No runtime evidence supports automatically treating a generic prism as right, a generic pyramid as regular, or creating altitude/center/foot/diagonal/section. The standards tree contains guarded pyramid-altitude inference catalogs, but those rules must remain a mathematical-semantics service and must never be moved into renderer code. Sphere is represented in Math IR, but consistent production rendering and the distinction between a 3D circle projection and an intrinsic 2D ellipse are not established. Frustum support is present in developable-fold types rather than the base Math IR solid union.

## 7. View and projection analysis

- Math IR supports explicit perspective/orthographic 3D camera and 2D viewport.
- Generated fold solids hard-code deterministic perspective cameras; the locked school standard prefers approved parallel projection. These policies conflict by subsystem.
- LuaDraw applies a fixed affine projection and does not derive visible/hidden edges from camera and occlusion.
- Geometry Engine takes `hiddenEdge` IDs from style metadata; visibility is supplied, not computed.
- Standards `edge-visibility-resolver.ts` and view profiles form another policy path, including name normalization and locked edge expectations.
- Three.js naturally projects mesh geometry but no repository-wide proof ties its occlusion results to TikZ/LuaDraw/Manim edge styles.
- Screen length/angle are not explicitly asserted equal to mathematical length/angle, but multiple adapters expose projected coordinates without a common type preventing that misuse.

Result: deterministic projection exists within individual fixtures/profiles, not across the same semantic solid in all renderers. Risk **HIGH**.

## 8. Label and annotation analysis

- Math IR keeps semantic point coordinates separate from `labelPlacement` and `labelOffset`; this is the correct boundary.
- The locked V2.6 label solver moves label candidates and blocks collisions without moving points; it is the strongest current implementation but is not the universal renderer service.
- GraphRenderer uses fixed offsets and does not collision-solve.
- LuaDraw always places vertex labels `above` unless an explicit position is supplied.
- Dynamic geometry auto-generates labels and renames segment labels after point rename; useful for authoring, unsafe for imported-source immutability unless explicitly requested.
- Manim toolkit can create right-angle, parallel and other markers directly. These helpers are visual constructors and do not prove the underlying relation.
- No evidence was found of runtime code moving mathematical point/vertex coordinates solely for label collision. The risk is auto-created/suppressed/misplaced annotation, not point mutation.

## 9. Source versus solution visuals

There is no repository-wide explicit `SOURCE_GRAPH`/`SOLUTION_GRAPH`, `SOURCE_VECTOR`/`SOLUTION_VECTOR`, or `SOURCE_SOLID_FIGURE`/`SOLUTION_SOLID_FIGURE` discriminator. Question Bank preserves source figures/assets and document contracts isolate answers/solutions; NA-DOC-01S forbids solution graphs, shaded regions and answer annotations in student workspaces. Those protections do not form a common visual provenance gate for graph, geometry, video and export adapters.

Status: **PARTIAL**. Risk: **HIGH**. Teacher solution-derived visual plans can only be proven safe per call site, not by type-level architecture. Future validated visual semantics must carry immutable provenance and audience; `SOURCE_VISUAL != SOLUTION_VISUAL` must be mandatory.

## 10. Cross-renderer consistency

Overall classification: **INCONSISTENT**.

- SVG/TikZ Geometry Engine adapters consume normalized Math IR, but graph SVG consumes separate `GraphSpec`.
- LuaDraw converts Math IR into a separate `GeometrySpec` and uses its own projection.
- Fold Three.js/SVG/TikZ/Manim adapters consume fold-specific models.
- Image animation uses another 2D scene graph.
- V2.6 standards define richer projection/visibility/label rules than general runtime adapters.
- DOCX embeds upstream assets and therefore reproduces whichever geometry that upstream path produced.

Neutral serialization and deterministic per-module tests exist; equivalence of mathematical geometry across renderers is not currently a release gate.

## 11. Duplicated mathematical logic

| Mathematical responsibility | Canonical candidate | Existing copies | Safe future migration |
|---|---|---|---|
| visual semantic entities | Math IR V1 | `GraphSpec`, `GeometrySpec`, fold types, pattern types, image-animation scene graph, V2.6 schemas | adapt, do not replace; validated visual model references Math IR IDs |
| function analysis | future 04A2 over a validated expression service | Graph parser/classifier/domain/features/verifier | quarantine heuristic path; adapters consume validated branches/features |
| coordinate viewport/scale | future 04A1 | graph viewport + React transform + Math IR viewport + adapter bounds | one validated viewport/unit contract |
| intersections/projections/relations | explicit semantic construction service | dynamic geometry, Manim helpers, standards inference catalogs | require operation provenance and validation result |
| solid topology | Math IR topology + future 04A4 | fold topology, server `GeometrySpec`, canonical solids, standards schemas | adapters from validated topology; preserve source ordering |
| 3D projection/visibility | future 04A4 validated view | LuaDraw affine projection, Three cameras, fold mappings, standard view profiles/edge resolver | approved deterministic profile plus geometry-derived occlusion |
| label placement | common post-projection adapter service | V2.6 solver, GraphRenderer offsets, LuaDraw `above`, Manim placement | reuse solver behavior without changing semantic coordinates |

## 12. File protection and migration map

### Files that must not be rewritten

- `src/modules/math-ir/**`
- `src/modules/document-engine/**`
- `src/modules/document-export/**`
- `src/modules/question-bank/**`
- `src/modules/geometry-engine/**`
- `src/modules/dynamic-geometry/**`
- `src/modules/fold-3d/**`
- `server/geometry/**`
- `standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/**`
- existing graph, DOCX, Question Bank, geometry, fold and NA-DOC regression tests

These are protected working systems or locked baselines. Future work adds safety contracts/adapters and migrates call sites incrementally.

### Files safe to extend

- New narrowly scoped contracts and validators under the existing `src/modules/geometry-engine/` or an evidence-backed sibling inside the existing math/document architecture.
- `src/modules/geometry-engine/index.ts` only to expose an approved contract.
- Focused tests under `tests/` and documentation under `docs/na-doc/`.
- Renderer adapters only after 04A0–04A4 define validated inputs; no renderer math.

### Files to deprecate later, not now

- Direct raw-text-to-`GraphSpec` production routing after a validated 04A2 path exists.
- Parallel `GeometrySpec`/fold/image-animation semantic fields that can become lossless adapter DTOs.
- Renderer-local label, projection and relation-marker decisions superseded by validated common contracts.

### Files with unsafe inference

- `src/lib/graphEngine/functionParser.ts`
- `src/lib/graphEngine/classifier.ts`
- `src/lib/graphEngine/domainAnalyzer.ts`
- `src/lib/graphEngine/featureAnalyzer.ts`
- `src/lib/graphEngine/viewportEngine.ts`
- `src/lib/graphEngine/samplingEngine.ts`
- `src/lib/graphEngine/graphVerifier.ts`
- `src/modules/geometry-engine/normalize.ts` (`visual_only` fallback boundary)
- `src/modules/dynamic-geometry/construction-engine.ts` if invoked without explicit semantic command
- `src/modules/dynamic-geometry/index.ts` (automatic labels)
- `server/geometry/luadrawEngine.ts`
- `manim_toolkit/geometry_tools.py` if marker helpers are treated as proof
- canonical solid generators if used as substitutes for source geometry

## 13. QA inventory and gaps

Existing evidence includes `tests/test-graph-engine.ts`, `test-geometry-engine-v1.ts`, dynamic-geometry suites, LuaDraw contract tests, DOCX geometry golden package tests, fold/developable/n-gonal/Three-viewer suites, Question Bank/source-aware tests and Manim toolkit tests.

### Coordinate gaps

- equal x/y unit-scale invariant and viewport provenance;
- no-invented point/intercept/region/solution-vertex tests across adapters;
- explicit coordinate-label provenance;
- inequality/half-plane/feasible-region fail-closed suite.

### Function graph gaps

- cancellation/hole versus denominator-zero asymptote;
- transformed exponential/log domain and asymptotes;
- trig angle unit, amplitude/period/phase/discontinuities;
- arbitrary rational branch splitting and no connection across discontinuity;
- classifier adversarial expressions and unsupported-domain fail-closed behavior;
- independent verification rather than verification of self-generated features.

### Vector gaps

- point/segment/vector/scalar/free/position/render-instance distinctions;
- immutable tail/head, zero-vector direction, magnitude preservation;
- operation result types and no renderer-created result vector;
- source/solution vector audience isolation.

### Solid gaps

- generic versus regular/right family distinctions;
- source vertex order and correspondence across every renderer;
- camera-derived occlusion/hidden edges and cross-renderer golden equivalence;
- no invented center/altitude/foot/diagonal/section/auxiliary line;
- sphere/frustum semantics and circle/projected-ellipse/intrinsic-ellipse distinction;
- proof that projected lengths/angles never become semantic measurements.

## 14. Recommended future boundary

`Question / Document / Math IR` → `Mathematical Semantics` → `NA-MATH Visual Semantics Safety` → `Validated Visual Model` → `Renderer Adapter`.

Every validated object must retain semantic ID, immutable provenance (`SOURCE` or `SOLUTION`), audience, validation evidence and permission to render. Unknown or unverified mathematics must produce `RENDER_ALLOWED=NO`. Renderers may project, clip, tessellate and place labels; they may not solve, infer relations, create mathematical entities or alter topology.

### NA-DOC-04A0 — Common Visual Safety Contract

- Add validation/provenance/audience/result types around Math IR V1.
- Lock no-invention invariants for objects, labels and relations.
- Separate semantic, layout, sampled-render and annotation coordinates.
- Require source/solution role, validation evidence and fail-closed `renderAllowed`.
- Define adapter conformance without implementing geometry families.

### NA-DOC-04A1 — Coordinate Geometry Contract

- Validated axes/origin/unit/ticks/numbers/viewport/equal-scale policy.
- Typed point/line/ray/segment/region provenance.
- No inferred intercept, region, solution vertex or coordinate label.
- Student workspace exclusion of solution geometry.

### NA-DOC-04A2 — Function Graph Contract

- Validated expression, exact domain, angle unit, discontinuities and branches.
- Distinguish mathematical features from sample points.
- Family-specific contracts for cubic, rational, exponential, logarithmic and trigonometric functions.
- Independent fail-closed validation before sampling/rendering.

### NA-DOC-04A3 — Vector Geometry Contract

- Distinct point, segment, scalar, vector, free/position vector and render instance.
- Immutable tail/head and typed operations; zero-vector direction undefined.
- No visually inferred relations or renderer-created results.

### NA-DOC-04A4 — Solid Geometry Contract

- Validated topology, family qualifiers, source ordering and deterministic view profile.
- Separate semantic 3D geometry, projected 2D geometry and labels.
- Geometry/occlusion-derived edge visibility.
- Explicit auxiliary constructions only; circle/ellipse distinctions.

Recommended order: **04A0 → 04A1 → 04A2 → 04A3 → 04A4**. Coordinate and graph contracts should precede vector and solid integration because they expose the most immediate production inference risks and establish shared viewport/sample concepts.

### NA-DOC-04B — Validated renderer adapter layer

- Accept validated models only.
- Map semantic IDs losslessly to SVG/TikZ/LuaDraw/Three.js/Manim/DOCX/video artifacts.
- Implement projection, clipping, tessellation and label placement without mathematical inference.
- Add cross-renderer semantic fingerprints and golden equivalence gates.

## 15. Blockers

- No universal source/solution visual provenance type.
- Multiple semantic DTOs and construction engines have no common validation envelope.
- Graph analysis is heuristic and its verifier is not independent.
- Projection, hidden-edge and label policies differ across runtime and locked standards.
- No cross-renderer mathematical-equivalence test suite.
- Several powerful construction helpers are callable without a universal proof that the request came from validated semantics.

These blockers do not block completing this audit. They block safe implementation of a universal visual renderer until 04A0 establishes the common fail-closed contract.

## Audit disposition

- `RUNTIME_CHANGED=NO`
- `DEFAULT_PIPELINE_CHANGED=NO`
- `RELEASE_CONFIG_CHANGED=NO`
- `NA_DOC_04A0_STARTED=NO`
- `NA_DOC_04A1_STARTED=NO`
- `NA_DOC_04A2_STARTED=NO`
- `NA_DOC_04A3_STARTED=NO`
- `NA_DOC_04A4_STARTED=NO`
- `NA_DOC_04B_STARTED=NO`
