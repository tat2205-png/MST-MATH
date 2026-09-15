# MST-MATH Unified Mathematical Visual Standard V1.0

Status: CANONICAL CANDIDATE  
Scope: GDPT 2018 / Kết nối tri thức visual representation, corpus governance, and renderer validation  
Policy: Additive, registry/contract-first, non-destructive  
Implementation contract: `src/modules/visual-pedagogy/unified-visual-standard.ts`

## 1. Canonical principle

MST-MATH does not draw mathematical figures from appearance.

It constructs validated mathematical representations from semantic truth, applies GDPT 2018/KNTT conventions, MathType-compatible notation and the MST GeoGebra visual grammar, selects a pedagogically appropriate representation/view/layout, and renders only after mathematical, pedagogical and visual validation pass.

No valid semantic/geometry state means no final mathematical figure.

## 2. Authority boundaries

Existing architecture remains authoritative:

- `MATH_IR` owns canonical mathematical semantics.
- `GEOMETRY_ENGINE` owns canonical semantic geometry.
- `VISUAL_PEDAGOGY` plans and validates; it does not redefine mathematical truth or replace Geometry Engine.
- `GEOGEBRA` remains a non-authoritative interactive output adapter.
- Renderer defaults are never mathematical authority.

This standard adds visual-governance contracts only. It does not authorize bulk source moves, renderer replacement, breaking API changes, or redesign of existing production paths.

## 3. Authority Resolution Matrix

Authority is domain-aware rather than a single universal ranking.

| Conflict | Resolution |
|---|---|
| Mathematical Truth vs any other authority | Mathematical Truth wins; contradictory source requires FAIL/REVIEW, not silent repair |
| Explicit Source Evidence vs AI inference | Source Evidence wins |
| GDPT2018/KNTT vs international best practice | GDPT2018/KNTT wins for curriculum convention |
| GDPT2018/KNTT vs renderer/GeoGebra defaults | GDPT2018/KNTT wins |
| Pedagogical Purpose vs aesthetics | Pedagogical Purpose wins |
| MST Publication Profile vs tool defaults | MST Profile wins |
| Accessibility/readability vs aesthetics | Accessibility/readability wins |
| Assessment no-answer-leak vs decorative clarity | No-answer-leak wins; choose another valid representation if needed |
| Metric vs View Fidelity | Resolve from task semantics and explicit metadata; never guess |

Practical fallback order when scopes overlap:

`MATHEMATICAL_TRUTH → SOURCE_EVIDENCE → GDPT2018/KNTT → PEDAGOGICAL_PURPOSE → MST_PROFILE → INTERNATIONAL_REFERENCE → TOOL_DEFAULT`

## 4. MathType-compatible notation profile

MathType is the visual/structural reference for mathematical notation, not the semantic authority.

Canonical direction:

`Semantic Math IR → MathType-compatible notation structure → OMML / MathML / LaTeX / SVG/PDF/figure label adapter`

The notation layer governs, at minimum:

- fractions, radicals, superscripts/subscripts;
- integrals, sums, products, matrices and fences;
- Greek letters and mathematical alphabets;
- vector notation and accents;
- upright/italic function-variable policy;
- mathematical spacing and scalable delimiters.

The existing decision remains unchanged: editable MathType OLE is an optional future output adapter and does not enter Input/OCR/Canonical IR.

## 5. MST GeoGebra Publication Profile

GeoGebra is the visual grammar reference for geometric primitives, not the source of mathematical truth and not a UI-style authority.

Covered primitives include:

- point, segment, line, ray, vector;
- polygon, circle, arc, conic;
- angle and relation markers;
- axes, ticks, grid and coordinate plots;
- function graphs and geometric transformations.

MST-MATH owns publication overrides such as stroke hierarchy, point sizing, label readability, black/white behavior, assessment disclosure, safe bounds and output layout.

A renderer may be GeoGebra, SVG, TikZ, PGFPlots, Asymptote, Word/PDF vector output or another deterministic adapter. Conformance is to the MST visual grammar, not to GeoGebra UI defaults.

## 6. Unified 2D/3D model

There is one semantic geometry standard. 2D and 3D are representation modes of the same model.

Shared concepts include:

`Point, Segment, Ray, Line, Vector, Curve, Circle, Arc, Conic, Polygon, Face, Plane, Surface, Solid, Axis, CoordinateSystem, Angle, Region, Transform, Constraint, Relation`.

3D adds view/projection/depth/visibility processing; it does not create a separate mathematical truth model.

Canonical 3D flow:

`Validated 3D Geometry → View/Projection → Deterministic Visibility/Occlusion → Projected Geometry → MST Visual Grammar → Render`

Visible/hidden edges must derive from geometry plus view, not from visual guessing.

2D also has explicit view state: bounds, scale, aspect, padding and optional rotation. Therefore both 2D and 3D follow `Geometry → View → Render`.

## 7. Fidelity metadata

Every pattern that needs fidelity control uses three independent dimensions:

- `TOPOLOGICAL_FIDELITY`: incidence, connectivity, adjacency and relation structure;
- `METRIC_FIDELITY`: lengths, angles, ratios and scale;
- `VIEW_FIDELITY`: whether the source view must be preserved or may be optimized.

Examples:

- proof-oriented spatial figure: topology EXACT, metric NOT_TO_SCALE, view OPTIMIZED;
- verified function graph: topology EXACT, metric EXACT, view CONTROLLED;
- source photograph used as evidence: topology SOURCE_PRESERVED, metric as verified/unknown, view SOURCE_PRESERVED.

## 8. Pedagogical Disclosure Gate (G7)

The validator reads `pedagogical_purpose` and the task target before deciding which derived objects may be visible.

| Purpose | Rule |
|---|---|
| `GIVEN_ONLY` | Show stated assumptions plus structure required to read the task. Do not reveal a derived target/result. |
| `SCAFFOLDED` | Allow validated intermediate states/facts selected by the learning design. Do not reveal the final target/result. |
| `EXPLANATORY` | Allow validated steps and final result for worked explanation; emphasis follows the current explanatory step. |
| `FULL_SOLUTION` | Allow complete validated construction/reasoning/result annotations for solution/reference material. |

A mathematically correct figure still fails if it discloses an answer beyond the allowed pedagogical purpose.

## 9. Family Semantic Contracts

Families use contracts, not brittle object-count thresholds.

Each contract defines:

- `REQUIRED`: semantic data needed for the representation to have meaning;
- `CONDITIONAL`: requirements triggered by task/context;
- `INVARIANTS`: facts that may never be violated;
- `FORBIDDEN_INFERENCE`: facts AI/renderers may not invent.

Initial machine-readable contracts cover:

- `COORDINATE_AND_FUNCTION`;
- `PLANE_GEOMETRY`;
- `SPATIAL_GEOMETRY`.

Core family registry remains extensible rather than closed:

1. Algebraic Representation
2. Coordinate & Function
3. Plane Geometry
4. Spatial Geometry
5. Transformation & Process
6. Statistics & Probability
7. Mathematical Modeling
8. Real-world Evidence

Extension families may be added through versioned registry entries without redefining the core standard.

## 10. Shared primitive / reusability architecture

Rules for reusable primitives are defined once and adapted by family.

Examples:

- `Axis`: shared scale/tick/label ownership; coordinate and statistics adapters may specialize behavior.
- `Grid`: shared low visual weight; coordinate grids may be standard, geometry grids are optional and never assumed.
- `Point`: semantic ownership, readable marker, no invented point.
- `Label`: owner association, collision-free placement, safe bounds.
- `Arrow`: arrow class and direction are semantic; vector, axis and transformation arrows are not interchangeable.
- `Region`: boundary semantics are preserved; fill/color is never the sole information carrier.

## 11. Label Placement Corpus

Label placement is a dedicated corpus/engine concern.

A golden case should record:

- semantic owner;
- preferred zones and anchors;
- forbidden regions;
- minimum clearance policy;
- geometry/text collision cases;
- multiple acceptable placements where appropriate;
- hard negatives explaining why a placement is invalid.

The system must not assume one absolute offset is the only valid solution across all output sizes.

## 12. Real-world Source Evidence Manifest

Evidence-bearing real-world items should record, where relevant:

- source hash and version;
- license evidence;
- capture/measurement method;
- verified quantities, units and uncertainty;
- verification authority;
- mathematical abstraction objects and constraints;
- location only when mathematically necessary and permitted.

Context-only imagery and evidence-bearing imagery are distinct. Evidence-bearing source data must not be replaced by invented generative imagery.

## 13. Automation boundary

LLM/AI, deterministic engines and human review have different responsibilities.

AI may propose parses, candidate construction plans, label anchors and pedagogically useful views. It may not invent missing mathematical facts, upgrade uncertain relations to truth, select hidden edges by appearance, choose an unsupported cut/fold hinge, or treat generative pixels as mathematical authority.

Deterministic engines own constraint solving, relation validation, function plotting, projection, visibility/occlusion, collision scoring, safe-bounds checks and rendering where defined.

Human review is required only for genuine ambiguity, new golden acceptance, unresolved tied placements/views, or high-stakes pedagogical/accessibility judgment. Deterministic results should not be escalated to human review by default.

## 14. Corpus maturity and release state

Pattern maturity is a vector rather than a single misleading score:

`SPEC, GOLDEN, NEGATIVE, LABEL, ACCESS, CROSS_GRADE, DEPLOY, FEEDBACK`, each on `0..3`.

Release states:

- `DRAFT`
- `VALIDATED`
- `PILOT`
- `PRODUCTION`
- `DEPRECATED`

Critical weak dimensions block promotion even if other dimensions are mature.

## 15. Unified validation gates

The canonical gate order is:

- `G0 SOURCE_AND_PROVENANCE`
- `G1 MATHEMATICAL_SEMANTICS`
- `G2 RELATIONS_AND_CONSTRAINTS`
- `G3 GEOMETRY_CONSTRUCTION`
- `G4 VIEW_AND_PROJECTION`
- `G5 VISIBILITY`
- `G6 MATHTYPE_COMPATIBLE_NOTATION`
- `G7 PEDAGOGICAL_DISCLOSURE`
- `G8 VISUAL_AND_LAYOUT`
- `G9 OUTPUT_AND_ACCESSIBILITY`

Conflict-resolution rule:

1. Find the earliest failed gate.
2. Fix that root cause first.
3. Recompute all downstream artifacts.
4. Rerun downstream gates.
5. Add a regression example for a new reproducible production defect.

Do not optimize layout while an earlier semantic/geometry gate is failing.

## 16. Pilot Pattern Contract Tests

Before expanding to the full 70–100-pattern KNTT corpus, validate the architecture on three patterns:

### TRIANGLE

Stress: incidence/relations, geometry markers, label placement.

Must forbid invented right angles, equal sides, midpoints and ambiguous/overlapping labels.

### FUNCTION_GRAPH

Stress: exact mathematics, domain/discontinuity handling, axes/ticks/scale and deterministic plotting.

Must forbid freehand curves, joining across discontinuities, wrong scales and invented intercepts/asymptotes.

### SPATIAL_LINE_PLANE

Stress: unified 3D model, projection and deterministic visibility.

Must forbid treating a visual crossing as a spatial intersection, artistic hidden-edge choice, and invented faces/edges.

Only after these three patterns pass contract tests, goldens, hard negatives, label cases, accessibility and output render review should the corpus expand broadly.

## 17. Negative corpus

Every important pattern should include hard negatives that are plausible-looking but invalid.

Negative examples should identify the violated contract/gate, e.g. wrong vector direction, unsupported relation marker, curve through a discontinuity, hidden edge selected visually, label ownership ambiguity, or answer leakage in assessment mode.

## 18. Print, color and accessibility

Color may reinforce meaning but must not be the sole carrier of mathematical meaning.

Every production golden should remain understandable in its required print profile. Semantic IR should support generation of accessible figure descriptions; accessibility is derived from semantics rather than retrofitted from pixels.

## 19. Scope boundary for this synchronization

This synchronization is deliberately non-destructive and consistent with the current stabilization directive.

Included now:

- authority matrix;
- G7 rubric;
- initial family contracts;
- label/source-evidence contract types;
- AI/deterministic/human automation boundary;
- extension-ready taxonomy;
- shared primitive reusability map;
- maturity/release model;
- G0–G9 workflow;
- three pilot pattern contracts;
- executable contract checks.

Not included now:

- renderer rewrites;
- Geometry Engine redesign;
- source/module relocation;
- bulk corpus generation;
- MathType OLE implementation;
- changes to locked NA-MATH standards;
- production behavior changes without targeted evidence.

Primary objective remains: `MAKE CURRENT MST-MATH WORK — NO IMPROVEMENT YET`.
