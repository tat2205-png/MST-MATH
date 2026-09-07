# MST-MATH GeoGebra Interactive Learning Architecture V1

Status: **DRAFT / PROPOSED / NON-CANONICAL**  
Mode: **ADDITIVE / NON-DESTRUCTIVE / COMPATIBILITY-FIRST**  
Depends on: `MST_MATH_DNA_DYNAMIC_GEOMETRY_VISUALIZATION_V1.0`  
Product output family: `P08_GEOGEBRA`

## 1. Decision

MST-MATH should extend P08 from “GeoGebra visualization” into a layered **Interactive Learning system** capable of producing:

- dynamic figures;
- self-contained activities;
- sequenced lessons;
- chapter/book structures comparable in pedagogical richness to strong GeoGebraBooks;
- randomized formative assessment;
- Open Middle tasks;
- guided construction tasks;
- 2D/3D exploration and modeling.

This proposal does **not** replace the locked Dynamic Geometry standard. It adds learning orchestration above it.

## 2. Current-state critique

### 2.1 What the existing architecture gets right

The locked Dynamic Geometry authority already establishes the most important boundary:

- mathematics first, visualization second;
- no unauthorized inference;
- GeoGebra is a primary authoring/visualization tool but not mathematical authority;
- DGK remains canonical geometry computation/state authority;
- semantic IDs, dependencies, movement domains, geometric constraints, and target quantities must be preserved;
- visual min/max is not proof;
- renderer/adapter must not own mathematical truth.

These decisions should remain unchanged.

### 2.2 Gap: current `ConstructionIR` is not a generic learning construction IR

`src/modules/geogebra/construction-ir.ts` currently contains a compact V1 type and a `parseV3FoldCommand()` implementation hard-coded around a specific fold problem. Its object taxonomy is insufficient for the learned corpus.

Missing or under-modeled object families include:

- angle/angle sector;
- vector;
- arc/sector;
- conic;
- function/curve;
- text/math text;
- input box;
- button;
- checkbox/toggle;
- list/set;
- image;
- surface;
- 3D solid;
- net;
- cross section;
- histogram/bar;
- answer/state objects;
- random generator state.

**Recommendation:** keep existing compatibility behavior, but introduce a genuinely generic semantic construction contract in a successor/additive layer. Do not rewrite the FOLD parser in place.

### 2.3 Gap: `tools.ts` is currently a placeholder registry

The current AI construction tool entries are mapped from IDs with empty input/output types and empty semantic effects. This is not enough for planning, validation, or automatic tool routing.

A production tool specification needs:

- typed prerequisites;
- typed outputs;
- mathematical preconditions;
- geometry relations established;
- learner visibility;
- authoring-only vs student-available scope;
- reversible/reset behavior;
- adapter command mapping;
- QA assertions.

### 2.4 Gap: runtime API is geometry-control oriented, not learning-activity oriented

The current generic runtime supports command evaluation, set value/visibility/color, object deletion, and listeners. It lacks first-class contracts for:

- reading learner state/value/text;
- answer submission/check lifecycle;
- reset/new-problem lifecycle;
- hints and staged reveals;
- animation/timeline state;
- trace control;
- input validation;
- generated target provenance;
- progress/completion state;
- custom tool permissions;
- student/teacher modes;
- accessibility metadata;
- robust viewport/overlay QA.

Do not solve this by placing opaque JavaScript directly into every applet. Add an activity orchestration contract above the generic runtime.

### 2.5 Gap: current authoring UI policy cannot be the universal learner policy

The existing Dynamic Geometry standard states that the toolbar is visible and authoring tools are full. That is appropriate for authoring or explicit construction-skill activities, but the learned corpus shows that many strong student activities intentionally expose only a small semantic control set.

**Proposed distinction:**

- `AUTHORING_MODE`: full toolbar/tools, editable scene;
- `STUDENT_ACTIVITY_MODE`: restricted controls/tools defined by ActivityIR;
- `PRESENTATION_MODE`: manipulation controls only, no structural editing;
- `ASSESSMENT_MODE`: response controls + permitted manipulation, with anti-leak reveal policy.

The locked standard must not be silently mutated; this distinction belongs in a successor/candidate learning-layer standard.

## 3. Target layered architecture

```text
SOURCE / TEACHER REQUEST / CURRICULUM AUTHORITY
                │
                ▼
        PEDAGOGICAL PLANNER
                │
                ▼
             BOOK IR
                │
                ▼
            LESSON IR
                │
                ▼
           ACTIVITY IR
      ┌─────────┼──────────┐
      ▼         ▼          ▼
 GEOMETRY IR  ASSESSMENT  INTERACTION
      │          IR           IR
      └─────────┼──────────┘
                ▼
      GEOGEBRA ADAPTER PLAN
                │
                ▼
       GEOGEBRA RUNTIME/.GGB
                │
                ▼
       QA + GOLDEN ACCEPTANCE
```

Mathematical truth remains in semantic math/geometry authorities. `ActivityIR` only orchestrates learning behavior.

## 4. Proposed IR layers

### 4.1 `GeoGebraBookIR`

Suggested fields:

- `bookId`, `title`, `grade`, `curriculumRefs`;
- `chapters[]`;
- `differentiationModel`;
- `progressPolicy`;
- `language`;
- `templateDependencies[]`;
- `sourceProvenance[]`.

### 4.2 `GeoGebraLessonIR`

Suggested fields:

- `lessonId`, `learningObjectives[]`;
- `prerequisites[]`;
- `phaseSequence[]`;
- `activities[]`;
- `remediationRoutes[]`;
- `challengeRoutes[]`;
- `estimatedMinutes`;
- `completionRule`.

Recommended phase vocabulary:

`WARM_UP`, `PREDICT`, `DISCOVERY`, `GUIDED_QUESTION`, `QUICK_CHECK`, `REMEDIATION`, `CONCEPTUALIZE`, `PRACTICE`, `OPEN_MIDDLE`, `CHALLENGE`, `REFLECTION`.

### 4.3 `GeoGebraActivityIR`

Suggested fields:

- `activityId`;
- `activityType`;
- `learningObjective`;
- `geometrySceneRef`;
- `learnerActions[]`;
- `controls[]`;
- `allowedTools[]`;
- `prompts[]`;
- `assessmentRef`;
- `hintPolicy`;
- `revealPolicy`;
- `resetPolicy`;
- `newProblemPolicy`;
- `completionRule`;
- `visualOverlayPolicy`;
- `accessibility`;
- `telemetry/progress` metadata where applicable.

### 4.4 `AssessmentIR`

Must support more than typed answers.

Response kinds:

- `NUMBER`;
- `EXACT_EXPRESSION`;
- `TEXT`;
- `MULTIPLE_CHOICE`;
- `BOOLEAN_SET`;
- `POINT_POSITION`;
- `OBJECT_RELATION`;
- `GRAPH_STATE`;
- `CONSTRUCTION_STATE`;
- `DISTRIBUTION_STATE`;
- `MULTI_SLOT_OPEN_MIDDLE`.

Generator contract:

- `targetGenerator`;
- `feasibleDomain`;
- `solvabilityProof/check`;
- `seed/provenance`;
- `solutionCountExpectation`;
- `checker`;
- `partialChecks[]`;
- `feedbackRules[]`.

### 4.5 `InteractionIR`

Interaction primitives:

- drag point/object;
- slider;
- checkbox/toggle;
- input box;
- button;
- restricted tool invocation;
- stage/timeline slider;
- reveal/hide;
- animate/trace;
- reset;
- new randomized problem;
- multi-workspace clone;
- camera/3D view control.

### 4.6 `VisualOverlayIR`

This layer should implement the object-anchored clean-overlay direction.

Required fields:

- `anchorObjectId`;
- `anchorKind` (`POINT`, `SEGMENT_MIDPOINT`, `NORMAL_OFFSET`, `REGION_CENTROID`, `VIEWPORT_EDGE`);
- preferred offset;
- minimum separation;
- collision group;
- priority;
- viewport clamp;
- leader-line policy;
- hide/relocate fallback.

Fixed absolute screen coordinates should be treated as a last-resort compatibility mode.

## 5. Canonical activity engine families

The implementation should expose parameterized engines instead of one-off scripts.

### A. `EXPLORATION_SEQUENCE`

Manipulate → observe → guided prompt → measure/reveal → generalize.

### B. `STAGED_TRANSFORMATION_PROOF`

Timeline of transformations with invariant-preserving steps. Supports Translate/Rotate/Dilate/Mirror/intersections and conditional visibility.

### C. `CONSTRUCTION_TASK`

Learner creates required objects with a restricted tool set; semantic checkpoints verify progress.

### D. `RANDOMIZED_SELF_CHECK`

Guaranteed-solvable target generation + response + Check/New Problem/reset.

### E. `OPEN_MIDDLE_CONSTRAINT`

Many valid solutions, uniqueness constraints, alternate solution requests, optional optimization.

### F. `DYNAMIC_EQUATION_ANATOMY`

Binds equation parameters to graph/geometric semantics.

### G. `DIRECT_MANIPULATION_RESPONSE`

Answer is encoded in scene state, e.g. graph region, point position, histogram shape, or solid dimensions.

### H. `REPRESENTATION_TRANSLATOR`

Converts and verifies multiple representations of one mathematical object.

### I. `MULTIPLE_SOLUTION_WORKSPACE`

Reuses one canonical manipulative for several distinct constructions.

### J. `STATISTICS_MANIPULATION`

Directly edit data/distribution representations, then inspect derived statistics.

### K. `CROSS_SECTION_3D`

Moves a cutting plane through a solid and preserves semantic cross-section state.

### L. `SURFACE_OF_REVOLUTION`

Maps a 2D profile/curve to a rotational surface with parameterized axis and domain.

### M. `MULTI_STRATEGY_CONSTRUCTION`

Chooses construction route based on learner level/objective.

### N. `COGNITIVE_CONFLICT`

Predict → manipulate → contradiction → diagnose hidden condition → explain.

## 6. Template registry model

Each reusable template should record:

- `templateId`;
- canonical normalized XML hash where relevant;
- mathematical topic tags;
- interaction tags;
- pedagogical family;
- supported grade bands;
- required GeoGebra features;
- source provenance;
- safety/licensing notes if retained;
- parameters;
- checker capability;
- known limitations;
- QA goldens.

A template instance must reference the template ID plus parameters/prompts. It must not duplicate the whole canonical template record.

## 7. Dedupe/ingest architecture

```text
ZIP/GGB/HTML
  ↓
OUTER_SHA_DEDUPE
  ↓
PACKAGE_CLASSIFIER
  ↓
AUTHORED_CONTENT_EXTRACTOR
  ↓
EMBEDDED_GGB_SHA_DEDUPE
  ↓
GEOGEBRA_XML_NORMALIZE + SHA
  ↓
COMMAND/SCRIPT/OBJECT ANALYSIS
  ↓
PEDAGOGICAL_FAMILY_CLASSIFIER
  ↓
TEMPLATE REGISTRY + PROVENANCE
```

Offline GeoGebra runtime assets must be excluded from authored-content statistics.

## 8. Randomization and checker policy

### 8.1 Solvability

Every generated target must be one of:

- generated from a constructive solution;
- selected from a precomputed feasible set;
- accepted only after an authoritative solver/verifier confirms feasibility.

### 8.2 Checker separation

Prefer semantic checkers such as:

- relation equality;
- distance/angle relation;
- graph region equivalence;
- construction invariant;
- exact expression equivalence;
- list uniqueness;
- distribution/statistical property.

GeoGebra conditional text can render feedback, but must not become the only opaque source of answer truth when MST-MATH can model the checker semantically.

### 8.3 Partial checks

Support multi-stage tasks such as coordinate distance:

`Δx/Δy → exact radical → decimal approximation`.

A final binary check should not erase useful diagnostic information.

## 9. Hint/reveal policy

Hints should have explicit levels:

- `H1_ATTENTION`: direct attention to a feature;
- `H2_RELATION`: name a relation without giving the answer;
- `H3_CONSTRUCTION`: reveal auxiliary geometry;
- `H4_FORMULA`: reveal relevant formula/theorem;
- `SOLUTION`: only when policy permits.

Every reveal can declare:

- manual unlock;
- after N failed attempts;
- after prerequisite phase;
- teacher-only;
- never in assessment mode.

Delayed geometric reveals in Open Middle/proof activities must be preserved.

## 10. Authoring vs learner modes

### `AUTHORING_MODE`

- full toolbar;
- object list/algebra view as needed;
- editable construction;
- template instrumentation/QA.

### `STUDENT_ACTIVITY_MODE`

- only specified semantic controls;
- optional restricted construction tools;
- structural objects protected;
- hints/check/reset/new problem available by policy.

### `ASSESSMENT_MODE`

- no answer-leaking overlays;
- deterministic seed/provenance when required;
- attempt tracking;
- restricted reveals;
- checker result separated from visible solution.

### `PRESENTATION_MODE`

- high readability;
- minimal controls;
- no accidental editing.

## 11. P08 output structure proposal

Do not create a competing top-level output family. Extend `P08_GEOGEBRA` with submodes/capabilities:

- `P08_FIGURE`;
- `P08_ACTIVITY`;
- `P08_LESSON`;
- `P08_BOOK`.

This should be integrated through a successor/candidate profile after human approval. Existing P08 compatibility must remain intact.

## 12. Lesson/book composition

Target differentiated lesson structure:

```text
LESSON
├─ Warm-up / Predict
├─ Discovery
├─ Guided Question(s)
├─ Quick Check
├─ Remediation branch
├─ Conceptualization
├─ Generated Practice
├─ Open Middle
├─ Challenge
└─ Reflection / Progress
```

A book composes lessons into chapters and may reuse the same template with different prompts/parameters.

The teacher should be able to request, for example:

> Tạo bài tự học Toán 10 về đường tròn lượng giác, 45 phút, có nhập góc, kéo điểm, 3 Quick Check, remediation và 1 challenge.

The system then plans the full lesson, not merely one `.ggb` scene.

## 13. QA gates

### `GEO_MATH_QA`

- mathematical correctness;
- semantic relation preservation;
- domain constraints;
- no unauthorized inference.

### `GEO_CONSTRUCTION_QA`

- dependencies valid;
- no undefined objects;
- valid movement domain;
- invariant preserved under representative drags/sliders.

### `GEO_RANDOM_QA`

- generated target feasible;
- checker agrees with canonical solver;
- reset/new-problem cleanly replaces state;
- no stale correctness flags.

### `GEO_PEDAGOGY_QA`

- phase order valid;
- hints do not leak answers early;
- challenge is downstream of prerequisites;
- direct manipulation matches learning objective;
- student controls are neither insufficient nor excessive.

### `GEO_VISUAL_QA`

- no overlap/collision;
- labels remain anchored near objects;
- no meaningful object obscured;
- math labels stay legible during drag/animation;
- 3D opacity/camera state remains interpretable;
- object-anchored overlays stay inside viewport.

### `GEO_ACTIVITY_QA`

- Check button works;
- partial feedback works;
- Hint policy works;
- New Problem works;
- Reset works;
- completion state is reachable;
- all learner paths terminate or intentionally remain exploratory.

### `GEO_BOOK_QA`

- prerequisites before dependent activities;
- differentiation routes are coherent;
- duplicate templates are referenced rather than cloned;
- progress/completion rules are consistent.

## 14. Golden cases required before promotion

At minimum:

1. **Unit circle / trigonometry interactive lesson** — input angle, movable point, representation conversion, self-check.
2. **Open Middle linear relations** — parallel/perpendicular parameterized engine.
3. **Histogram lesson sequence** — construct named distributions → context modeling → Open Middle statistics.
4. **3D solid lesson** — cross section or build-a-solid target with guaranteed-solvable generator.
5. **Transformation proof** — rigid-motion or dissection proof using a structured stage timeline.
6. **Full lesson/book** — Discovery → Remediation → Conceptualization → Challenge with reusable templates.

Promotion requires human pedagogical and visual approval, not only code tests.

## 15. Forbidden shortcuts

- modifying locked Dynamic Geometry V1.0 in place;
- treating GeoGebra scripts as mathematical authority;
- copying third-party book UI/branding verbatim;
- hard-coding a separate engine per lesson when one parameterized template is sufficient;
- random problem generation without solvability validation;
- using fixed label coordinates when semantic anchoring is available;
- showing full toolbar in all learner activities;
- embedding solution-revealing geometry before the learner response when the pedagogy requires delayed reveal;
- counting repeated activity instances as unique corpus knowledge.

## 16. Promotion decision

This architecture should remain `DRAFT / NON-CANONICAL` until:

- IR contracts are implemented additively;
- at least the six golden cases pass;
- P08 integration is regression-tested;
- existing FOLD/GeoGebra routes remain source-compatible;
- human visual/pedagogical acceptance is recorded.

Only then should a successor GeoGebra Interactive Learning standard be proposed for locking.