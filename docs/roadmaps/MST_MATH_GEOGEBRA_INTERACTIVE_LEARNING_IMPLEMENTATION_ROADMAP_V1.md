# MST-MATH GeoGebra Interactive Learning Implementation Roadmap V1

Status: **DRAFT EXECUTION PLAN / NON-CANONICAL**  
Base architecture: `MST-MATH GeoGebra Interactive Learning Architecture V1`  
Constraint: preserve existing P08/FOLD behavior and locked Dynamic Geometry authority.

## 1. Objective

Implement the learned GeoGebra corpus patterns as reusable MST-MATH engines rather than one-off applets. The target is a production path from a teacher request to a validated `.ggb` activity, lesson, or GeoGebraBook-style package with explicit pedagogy, assessment, reset/hint logic, and QA.

## 2. Workstream G0 — Corpus Registry and Dedupe

### Deliverables

- `GeoGebraCorpusManifest` contract;
- outer ZIP SHA-256 dedupe;
- embedded GGB SHA-256 dedupe;
- normalized `geogebra.xml` SHA-256 dedupe;
- package classifier (`GEOGEBRA_BOOK`, `EMBEDDED_GGB`, `OFFLINE_WRAPPER`, `STATIC_AUTHORED_CONTENT`, `EXTERNAL_LINK_ONLY`);
- template-vs-instance accounting;
- source provenance;
- pedagogical-family tags.

### Acceptance

- exact duplicates such as 139/140/141 and 145–163 collapse correctly;
- repeated quiz instances count as one template + N activity instances;
- runtime HTML assets do not enter authored-content metrics.

## 3. Workstream G1 — Additive Learning IR Contracts

### Deliverables

Add contracts without replacing existing FOLD compatibility code:

- `GeoGebraBookIR`;
- `GeoGebraLessonIR`;
- `GeoGebraActivityIR`;
- `GeoGebraAssessmentIR`;
- `GeoGebraInteractionIR`;
- `GeoGebraVisualOverlayIR`;
- generic construction/object taxonomy extension.

### Required object/control coverage

Geometry:

`Point`, `Segment`, `Line`, `Ray`, `Vector`, `Polygon`, `Circle`, `Arc`, `Sector`, `Angle`, `Conic`, `Function`, `Curve`, `Plane`, `Surface`, `Solid`, `Net`, `CrossSection`, `Histogram`.

Controls/content:

`Slider`, `InputBox`, `Button`, `Checkbox`, `Text`, `MathText`, `List`, `RandomState`, `Measure`, `Image`, `Guide`.

### Acceptance

- no breaking change to existing public GeoGebra/FOLD imports;
- existing regression suite remains green;
- a lesson can be represented without embedding opaque executable script as its only semantic description.

## 4. Workstream G2 — Runtime Capability Layer

### Deliverables

Extend generic runtime behind compatibility wrappers with capabilities such as:

- read numeric/text/object state;
- deterministic reset;
- new-problem lifecycle;
- check lifecycle;
- hint/reveal state;
- animation/stage state;
- trace toggle;
- restricted tool permissions;
- view/camera presets;
- student/authoring/assessment/presentation mode;
- progress/completion events.

### Important design rule

Do not turn the runtime into mathematical authority. Runtime executes an already validated activity plan.

## 5. Workstream G3 — Core Reusable Engines

Implement in this order because each unlocks several learned activities.

### G3.1 `RANDOMIZED_SELF_CHECK`

Capabilities:

- deterministic seed;
- feasible target selection;
- checker;
- partial feedback;
- Check/New Problem/Reset.

Golden candidates:

- slope quiz;
- distance in coordinate plane;
- build cylinder/prism with target area.

### G3.2 `DIRECT_MANIPULATION_RESPONSE`

Golden candidates:

- basic inequality graphing;
- move A/B to create target 3D distance;
- histogram shape.

### G3.3 `OPEN_MIDDLE_CONSTRAINT`

Capabilities:

- slot domain;
- no-repeat/no-repeat-absolute-values;
- exact relation checker;
- second distinct solution;
- min/max optimization.

Golden candidates:

- parallel/perpendicular equations;
- arc length/sector area;
- bearing;
- histogram.

### G3.4 `STAGED_TRANSFORMATION_PROOF`

Replace monolithic “Slide Me!” scripting with a structured stage/timeline model that compiles to GeoGebra visibility/transform state.

Golden candidates:

- trapezoid/circle area derivation;
- rigid-motion SSS congruence;
- inscribed-angle theorem;
- Fermat/Torricelli construction.

### G3.5 `CONSTRUCTION_TASK`

Capabilities:

- allowed tool subset;
- semantic construction checkpoints;
- prerequisite object validation;
- final invariant verification.

Golden candidate:

- tangent properties construction lesson.

### G3.6 `DYNAMIC_EQUATION_ANATOMY`

Parameter/semantic binding for parabola, ellipse, hyperbola, logarithm, and trig graphs.

### G3.7 `STATISTICS_MANIPULATION`

Direct bar dragging + derived-statistic evaluation + qualitative distribution classification.

### G3.8 `REPRESENTATION_TRANSLATOR`

First implementation: bearings / direction angles / quadrant notation.

## 6. Workstream G4 — 3D Learning Engines

### G4.1 `CROSS_SECTION_3D`

- plane parameterization;
- semantic section object;
- valid domain;
- area/perimeter measurements where requested;
- camera/opacity defaults.

### G4.2 `SURFACE_OF_REVOLUTION`

- 2D profile input;
- axis of revolution;
- domain/parameter controls;
- generated surface;
- optional relation to volume/modeling lessons.

### G4.3 `SOLID_BUILD_TARGET`

- generated dimensions/target property;
- guaranteed-solvable target;
- direct manipulation of dimensions;
- net/unfold hint when relevant.

### G4.4 `REAL_OBJECT_MODELING`

Longer-term workflow:

`source measurements/image → coordinate/function model → 3D model → comparison/AR presentation`.

This must remain mathematically validated and should not use generative imagery as geometry authority.

## 7. Workstream G5 — Lesson / Book Composer

### Deliverables

Teacher request planner that selects templates and composes:

`Warm-up → Discovery → Guided Questions → Quick Check → Remediation → Conceptualization → Practice → Open Middle → Challenge → Reflection`.

### Differentiation

Support branches:

- `NEEDS_REMEDIATION`;
- `ON_LEVEL`;
- `READY_FOR_CHALLENGE`.

Do not require adaptive AI for V1; rule-based branching is sufficient if deterministic and auditable.

### Reuse rule

One construction template may appear in several activities with different prompts. LessonIR references it rather than cloning XML.

## 8. Workstream G6 — Visual and Interaction QA

Implement object-anchored overlay rules:

- label anchored to point/segment/region;
- collision detection;
- minimum distance;
- viewport clamp;
- leader line fallback;
- stage-aware visibility;
- 2D/3D readability.

### Required tests

- representative drag sweeps;
- slider endpoints and intermediate states;
- viewport resize;
- text localization length changes;
- hidden/revealed objects;
- dense geometry scenes.

Goal: eliminate the known failure mode where labels overlap or drift far from the object.

## 9. Workstream G7 — Pedagogy and Assessment QA

### Hard gates

`GEO_MATH_QA_PASS`  
`GEO_CONSTRUCTION_QA_PASS`  
`GEO_RANDOM_QA_PASS`  
`GEO_ACTIVITY_QA_PASS`  
`GEO_VISUAL_QA_PASS`  
`GEO_PEDAGOGY_QA_PASS`

For books additionally:

`GEO_BOOK_QA_PASS`.

### Fail-closed cases

- random target with no verified solution;
- checker disagrees with canonical math verifier;
- stale state after Reset/New Problem;
- reveal leaks the answer before submission when prohibited;
- label collision obscures a required mathematical object;
- learner can edit protected structural objects in assessment mode;
- lesson prerequisite order is broken.

## 10. Workstream G8 — P08 Output Integration

Preserve `P08_GEOGEBRA` and add internal output modes/capabilities:

- `FIGURE`;
- `ACTIVITY`;
- `LESSON`;
- `BOOK`.

Do not mutate the canonical output registry until the candidate architecture is approved and golden cases pass.

## 11. Golden-case program

### Golden 1 — Unit-circle self-learning lesson

Target features:

- input angle;
- point moves on unit circle;
- coterminal/standard-position representation;
- coordinate → sin/cos connection;
- 3 Quick Checks;
- hint path;
- generated practice;
- challenge.

### Golden 2 — Open Middle line relation

One parameterized engine must support both parallel and perpendicular targets, uniqueness rules, delayed geometric reveal, alternate solution, and slope optimization.

### Golden 3 — Histogram sequence

One direct-manipulation primitive must support:

- named shape construction;
- scenario modeling;
- Open Middle numerical/statistical checking.

### Golden 4 — 3D build/check task

Example: cylinder/prism or distance target with guaranteed feasible generation and optional unfold/cross-section hint.

### Golden 5 — Transformation proof

Use a structured timeline rather than opaque monolithic scripting.

### Golden 6 — Full differentiated lesson/book

At least one complete book/lesson must include Discovery, Remediation, Conceptualization, generated formative check, Open Middle, Challenge, and progress/completion behavior.

## 12. Suggested engineering sequence

```text
G0 Corpus/Dedupe
  ↓
G1 IR Contracts
  ↓
G2 Runtime Capabilities
  ↓
G3 Core Engines
  ↓
G6 Visual QA + G7 Assessment QA
  ↓
G4 3D Engines
  ↓
G5 Lesson/Book Composer
  ↓
G8 P08 Integration
  ↓
Golden Acceptance
  ↓
Candidate Standard Promotion
```

QA should be developed alongside each engine, not deferred to the end.

## 13. What Codex/agent automation should do

Good agent tasks:

- corpus hashing/dedupe;
- XML object/command/script inventory;
- template extraction;
- IR schema implementation;
- checker/unit-test generation;
- regression tests;
- adapter generation from validated semantic plans;
- golden-state screenshots/data capture.

Human approval remains required for:

- pedagogical sequence quality;
- whether hints are appropriately timed;
- visual cleanliness/readability;
- curriculum fit;
- locking/promoting new standards.

## 14. Definition of Done for V1

The GeoGebra Interactive Learning V1 work is not done when MST-MATH can merely emit a `.ggb` file.

It is done when a teacher can request a lesson and MST-MATH can deterministically produce a validated activity/lesson that:

1. preserves authoritative mathematics;
2. provides the intended learner interactions;
3. checks answers or construction state correctly when applicable;
4. supports hint/reset/new-problem behavior where requested;
5. contains no label collisions or unusable controls;
6. can be regenerated from recorded provenance;
7. passes the required GeoGebra QA gates;
8. composes into a coherent differentiated lesson/book;
9. keeps existing P08/FOLD routes regression-safe;
10. is human-approved before any new standard is locked.