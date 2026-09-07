# MST-MATH GeoGebra Interactive Learning Architecture V1.1

Status: **DRAFT / SECOND-PASS DESIGN REVIEW / NON-CANONICAL**

Supersedes for design discussion only: `MST_MATH_GEOGEBRA_INTERACTIVE_LEARNING_ARCHITECTURE_V1.md`

This document is additive. It does not mutate any LOCKED geometry, visual, output, or brand authority.

## 1. Why a second-pass critique is necessary

The first architecture correctly moved MST-MATH from a figure generator toward interactive activities, lessons, and books. However, corpus-derived enthusiasm creates a real risk of overfitting the architecture to individual GeoGebra examples.

A robust product architecture must preserve the useful pedagogy while avoiding these failures:

1. one engine per example;
2. one IR per interaction family;
3. pedagogy hard-coded into GeoGebra scripts;
4. renderer-specific state becoming mathematical authority;
5. subject-specific color palettes becoming semantic meaning;
6. random tasks that are not deterministic or replayable;
7. activity analytics that collect more learner data than required;
8. hidden incompatibilities between desktop, tablet, touch, keyboard, and 3D;
9. lesson generation that is visually attractive but pedagogically incoherent;
10. a large taxonomy that teachers cannot author or debug.

The refined architecture therefore treats the learned GeoGebra patterns as **recipes over a small set of canonical capabilities**, not as separate runtime authorities.

---

## 2. Second-pass critique of the previous proposal

### 2.1 Fourteen named engines are useful for retrieval, but too many for the runtime core

The corpus supports patterns such as Open Middle, staged proof, cross section, equation anatomy, representation translation, histogram manipulation, and randomized self-check.

These are valuable **pedagogical recipes**. They should not all become first-class engine types in the core runtime.

Otherwise:

- features overlap heavily;
- QA logic is duplicated;
- composition becomes difficult;
- new patterns require new engine code even when existing primitives suffice.

**Refinement:** store them in a `PatternRecipeRegistry`; make the runtime depend on capabilities, interaction primitives, assessment contracts, and state transitions.

### 2.2 `BookIR -> LessonIR -> ActivityIR -> many child IRs` can become an IR explosion

Separation is good, but too many independent schemas create synchronization and migration cost.

**Refinement:** use one stable `ActivitySpec` with composable sections:

- `math`
- `construction`
- `interaction`
- `assessment`
- `visual`
- `pedagogy`
- `runtime`
- `provenance`

Lesson and Book remain orchestration containers rather than additional mathematical authorities.

### 2.3 Learner-state logic should not live only inside GeoGebra scripts

GeoGebra scripts can implement buttons, checks, reset, and visibility. But if all lesson state is encoded there, MST-MATH cannot reliably:

- replay attempts;
- compare renderers;
- validate state transitions;
- run deterministic QA;
- export the same lesson to another interactive surface later.

**Refinement:** canonical learner state lives in MST-MATH host/runtime. GeoGebra may mirror state, but it does not own it.

### 2.4 Subject palettes cannot be semantic authority

It is useful for Geometry, Trigonometry, Statistics, Calculus, Oxyz, and Probability to have different accents. But the same semantic role must remain recognizable across subjects.

For example, `ERROR`, `VALIDATED_RESULT`, `DRAGGABLE_INPUT`, `AUXILIARY_CONSTRUCTION`, and `CURRENT_FOCUS` must not change meaning merely because the lesson changes subject.

**Refinement:** semantic visual roles are global; subject palettes are controlled theme overlays.

### 2.5 “Full toolbar” versus “student mode” is not enough

Activities differ not just by toolbar visibility, but by capability permissions.

A learner may be allowed to:

- drag existing points but not create points;
- use exactly Tangent and Segment tools;
- edit numeric inputs but not definitions;
- rotate a 3D view but not alter construction objects.

**Refinement:** permissions are capability-based, not only mode-based.

### 2.6 Randomization needs deterministic provenance, not only solvability

A solvable target is necessary but insufficient.

Every generated task should record:

- generator ID/version;
- seed;
- feasible source state or witness solution;
- generated target;
- verifier ID/version.

This makes failures reproducible and allows exact regression testing.

### 2.7 “Replay student work” can become intrusive analytics

Replay is pedagogically powerful, but collecting every action by default is unnecessary.

**Refinement:** use minimal event logging, local/session scoped by default. Long-term analytics must be a separate, explicit product policy and not part of the GeoGebra core.

### 2.8 Corpus patterns must not be copied as visual identity

The corpus is evidence for interaction and pedagogy, not a style library to clone. MST-MATH must preserve its own visual semantics, accessibility rules, and copyright/provenance boundaries.

---

## 3. Refined architecture: small canonical kernel, rich recipe layer

```text
CURRICULUM / TEACHER INTENT
          |
          v
PEDAGOGICAL PLANNER
          |
          v
LESSON / BOOK COMPOSER
          |
          v
ACTIVITY SPEC
  |       |       |       |       |
 MATH  INTERACT  ASSESS  VISUAL  RUNTIME
  |       |       |       |       |
  +-------+-------+-------+-------+
                  |
          CAPABILITY RESOLVER
                  |
         +--------+--------+
         |                 |
     GEOGEBRA          OTHER RENDERER
      ADAPTER             ADAPTER
```

The architecture has seven core concerns.

### K1. Mathematical authority

Owns:

- mathematical objects;
- invariants;
- constraints;
- domains;
- target quantities;
- verified relations;
- proof/verification authority.

GeoGebra is not the authority.

### K2. Activity specification

Defines learner objective, required actions, stages, prompts, and completion conditions.

### K3. Interaction capabilities

Examples:

- `DRAG_POINT`
- `DRAG_OBJECT`
- `ADJUST_SLIDER`
- `ENTER_VALUE`
- `SELECT_OPTION`
- `TOGGLE_REVEAL`
- `CONSTRUCT_WITH_TOOL`
- `MATCH_OR_OVERLAY`
- `BUILD_STATE`
- `ROTATE_3D_VIEW`
- `SUBMIT_CHECK`

Capabilities are permissioned per activity.

### K4. Assessment contract

Answers may be:

- numeric;
- symbolic;
- boolean/multiple-choice;
- point location;
- geometric relation;
- graph state;
- construction state;
- histogram/distribution state;
- constrained Open-Middle state;
- multi-step partial state.

Assessment must return diagnostic result codes, not only true/false.

### K5. Learner state machine

Canonical default sequence:

```text
READY
 -> PREDICT
 -> EXPLORE
 -> COMMIT
 -> CHECK
 -> {CORRECT | RETRY | HINTED}
 -> EXPLAIN
 -> GENERALIZE
 -> COMPLETE
```

Not every activity uses every state, but transitions are explicit.

A key rule is `NO_PREMATURE_REVEAL`: the runtime must be able to prevent the proof, formula, or target relation from appearing before the learner commits when the pedagogy requires delayed reveal.

### K6. Visual semantics

Global semantic roles drive color, line weight, point style, opacity, labels, and hierarchy. Subject themes may modify accents but must not redefine roles.

### K7. Renderer adapter/runtime

GeoGebra receives a resolved activity state and construction plan. It may implement native interaction efficiently, but canonical math, learner state, scoring, and provenance remain outside the adapter boundary.

---

## 4. Pattern recipes, not engine proliferation

The following corpus-derived patterns become recipes over the kernel:

- `DISCOVERY_SEQUENCE`
- `STAGED_TRANSFORMATION_PROOF`
- `CONSTRUCTION_TASK`
- `RANDOMIZED_SELF_CHECK`
- `OPEN_MIDDLE`
- `EQUATION_ANATOMY`
- `DIRECT_MANIPULATION_RESPONSE`
- `REPRESENTATION_TRANSLATION`
- `MULTIPLE_SOLUTION_WORKSPACE`
- `STATISTICS_MANIPULATION`
- `CROSS_SECTION_3D`
- `SURFACE_OF_REVOLUTION`
- `MULTI_STRATEGY_CONSTRUCTION`
- `COGNITIVE_CONFLICT`

A recipe selects capabilities, learner-state phases, assessment contracts, visual roles, and renderer features.

Example:

```text
LINE_RELATION_OPEN_MIDDLE
 relation = PARALLEL | PERPENDICULAR
 capabilities = ENTER_VALUE + SUBMIT_CHECK + ADJUST_SLIDER
 reveal = DELAYED_GEOMETRIC_OVERLAY
 constraints = UNIQUE_ABSOLUTE_COEFFICIENTS
 extension = MINIMIZE_SLOPE | MAXIMIZE_SLOPE
```

This is one recipe family, not two unrelated engines.

---

## 5. First-class invariants

The corpus repeatedly shows that the strongest interactive lessons expose something that changes and something that remains invariant.

`InvariantSpec` should be first-class and may include:

- parallelism;
- perpendicularity;
- equal distance;
- equal length;
- equal angle;
- constant area;
- constant ratio;
- same intercepted arc;
- fixed locus condition;
- preserved orientation or explicitly changed orientation;
- correspondence under rigid motion;
- conserved algebraic relation.

The planner may generate prompts such as:

- predict what remains unchanged;
- test the conjecture by dragging;
- identify the invariant;
- explain why it must hold;
- generalize beyond the displayed example.

Observed stability alone is never proof authority.

---

## 6. Representation links

Many high-value corpus activities synchronize two or more representations.

Define `RepresentationLink` between semantic quantities rather than screen objects.

Examples:

- angle <-> point on unit circle <-> `(cos theta, sin theta)` <-> trig graph;
- ellipse equation <-> center <-> semi-axes <-> foci;
- bearing <-> direction angle <-> quadrant bearing <-> navigation vector;
- net <-> 3D solid <-> surface area;
- 2D profile <-> surface of revolution;
- histogram bars <-> frequency table <-> percentages/statistics.

Each link should specify:

- source semantic IDs;
- target semantic IDs;
- directionality;
- transform/derivation;
- validation rule;
- visible synchronization policy.

---

## 7. Difficulty is scaffold configuration, not only a label

Do not encode difficulty as only `EASY | MEDIUM | HARD`.

Use `ScaffoldProfile` such as:

- measurement visibility;
- grid visibility;
- tool restrictions;
- number of free variables;
- integer/rational/general parameters;
- hint count;
- hint strength;
- partial-check availability;
- target representation supplied or omitted;
- number of required distinct solutions;
- optimization extension enabled;
- proof/explanation required.

The same activity template can therefore support remediation, standard practice, and challenge.

---

## 8. Diagnostic feedback contract

`AssessmentResult` should include stable codes such as:

- `CORRECT`
- `INCOMPLETE`
- `WRONG_VALUE`
- `WRONG_SIGN`
- `WRONG_DIRECTION`
- `BOUNDARY_INCLUSION_WRONG`
- `RELATION_NOT_SATISFIED`
- `DUPLICATE_DIGIT`
- `CONSTRAINT_VIOLATION`
- `ORIENTATION_MISMATCH`
- `CONSTRUCTION_ORDER_INVALID`
- `MULTIPLE_ANSWERS_REQUIRED`
- `TARGET_UNREACHABLE`

Hints map to diagnostic codes rather than simply revealing a generic hint sequence.

---

## 9. Deterministic random generation

Required contract:

```text
Generator(seed, version)
 -> witness solution / feasible state
 -> target problem
 -> verifier(target, learner state)
```

Every generated activity stores:

- seed;
- generator version;
- witness/feasibility evidence;
- target;
- verifier version.

Random tasks must be exactly reproducible in QA.

---

## 10. Minimal learner event model

Default event capture should be minimal and pedagogically necessary:

- activity started;
- committed answer;
- check result code;
- hint requested;
- reset/new-problem;
- activity completed.

High-frequency pointer movement does not belong in the default persistent event model.

Optional replay may record a bounded local action sequence for construction activities, but persistent analytics is outside this architecture and requires separate privacy/product approval.

---

## 11. Renderer capability contract

Before choosing GeoGebra, the planner resolves capabilities such as:

- 2D geometry;
- 3D geometry;
- CAS/symbolic input;
- input boxes;
- buttons;
- sliders;
- draggable objects;
- tool-construction workflow;
- scripted visibility;
- deterministic random seed support;
- animation/timeline;
- touch support;
- keyboard accessibility;
- offline availability;
- export/snapshot support.

If required capabilities are unavailable, generation must either choose a valid fallback or fail closed. Silent degradation is forbidden when it changes pedagogy or correctness.

---

## 12. Visual interaction affordances

Learners must be able to infer what is interactive.

Visual roles must distinguish:

- draggable input;
- fixed structural object;
- selectable object;
- answer object;
- guide-only object;
- current focus;
- validated result;
- error state;
- hidden/future reveal.

Use shape, size, line style, icon, and label in addition to color. Do not encode a critical meaning by hue alone.

---

## 13. Object-anchored overlays

Labels, measurements, hints, and symbols should be semantically anchored to objects and resolved through collision avoidance.

Minimum fields:

- `anchorObjectId`;
- `anchorKind`;
- `preferredOffset`;
- `minimumSeparation`;
- `collisionGroup`;
- `priority`;
- `viewportClamp`;
- `leaderLinePolicy`.

Fixed screen coordinates are allowed only for genuine UI controls, not mathematical labels that should follow moving objects.

---

## 14. Accessibility and multi-device requirements

Interactive output must be tested for:

- mouse;
- touch;
- keyboard where feasible;
- laptop viewport;
- tablet viewport;
- classroom display/TV presentation;
- color-vision deficiency;
- sufficient contrast;
- minimum draggable target size;
- readable labels at expected viewing distance.

The same semantic object may use different layout geometry across devices while preserving mathematical identity.

---

## 15. Authoring workflow

Teacher-facing authoring should expose educational intent rather than internal engine names.

Example teacher request:

> Create a 15-minute discovery activity for the inscribed-angle theorem. Students should drag a point, make a conjecture, get two diagnostic hints, then complete one Open-Middle extension.

Planner responsibilities:

1. identify mathematical authority and prerequisites;
2. select a recipe;
3. instantiate the construction;
4. select interaction capabilities;
5. define delayed reveal;
6. generate assessment and hints;
7. assign visual semantics;
8. resolve renderer capabilities;
9. run QA;
10. return editable teacher controls.

The teacher must be able to override prompt text, difficulty/scaffolding, hint availability, and allowed tools without editing GeoGebra XML.

---

## 16. QA after second-pass critique

Required gates:

### Mathematical
- `GEO_MATH_QA_PASS`
- `GEO_INVARIANT_QA_PASS`
- `GEO_SOLVABILITY_QA_PASS`

### Construction/runtime
- `GEO_CONSTRUCTION_QA_PASS`
- `GEO_STATE_MACHINE_QA_PASS`
- `GEO_DETERMINISM_QA_PASS`
- `GEO_RENDERER_CAPABILITY_QA_PASS`

### Assessment/pedagogy
- `GEO_ASSESSMENT_QA_PASS`
- `GEO_DIAGNOSTIC_FEEDBACK_QA_PASS`
- `GEO_NO_PREMATURE_REVEAL_QA_PASS`
- `GEO_PEDAGOGY_QA_PASS`

### Visual/accessibility
- `GEO_VISUAL_SEMANTICS_QA_PASS`
- `GEO_OVERLAY_COLLISION_QA_PASS`
- `GEO_ACCESSIBILITY_QA_PASS`
- `GEO_RESPONSIVE_QA_PASS`

### Lesson/book
- `GEO_LESSON_DEPENDENCY_QA_PASS`
- `GEO_BOOK_QA_PASS`

A fail in correctness, solvability, state transitions, or pedagogical sequencing blocks publication.

---

## 17. Revised Golden Cases

Golden cases should test capabilities, not only topics.

1. **Unit-circle multi-representation lesson**
   - angle input;
   - draggable point;
   - unit-circle coordinate link;
   - sin/cos link;
   - delayed check/hint;
   - responsive layout.

2. **Parameterized line-relation Open Middle**
   - parallel and perpendicular from one recipe;
   - uniqueness constraint;
   - delayed geometric proof;
   - optimization extension.

3. **Histogram progression**
   - construct named distributions;
   - context-to-shape modeling;
   - statistical Open Middle;
   - diagnostic checks.

4. **Deterministic 3D generated task**
   - guaranteed-solvable target;
   - exact seed replay;
   - direct manipulation;
   - check/new problem/hint.

5. **Transformation proof**
   - rigid-motion choreography;
   - invariant tracking;
   - orientation branch;
   - no premature reveal.

6. **Differentiated full lesson/book**
   - discovery;
   - remediation;
   - conceptualization;
   - practice;
   - Open Middle;
   - challenge;
   - lesson dependency validation.

7. **Accessibility/device golden**
   - same activity on laptop, tablet, and presentation display;
   - semantic identity preserved;
   - controls remain usable and labels collision-free.

---

## 18. Governance decision

V1.1 remains a design candidate.

Do not:

- register it as LOCKED;
- replace existing Dynamic Geometry authority;
- move mathematical authority into GeoGebra;
- hard-code corpus-specific colors or scripts as canonical behavior;
- persist detailed learner telemetry by default;
- count repeated activity instances as distinct templates.

Promotion requires implementation evidence, Golden Case results, and human pedagogical/visual approval.
