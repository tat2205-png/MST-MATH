# MST-MATH GeoGebra Corpus Synthesis V1

Status: **RESEARCH SYNTHESIS / NON-CANONICAL / IMPLEMENTATION INPUT**  
Date: 2026-09-07  
Scope: GeoGebra corpus reverse-engineered from the user-supplied resources learned through batches 120–176 plus the named GeoGebra ZIP resources and the GeoGebra Book reference `https://www.geogebra.org/m/eS4YAbjP`.

## 1. Purpose

This document consolidates what MST-MATH has learned from the GeoGebra corpus into reusable engineering and pedagogical knowledge. It is deliberately not a locked standard. It is evidence for the next GeoGebra architecture and must not overwrite existing locked Dynamic Geometry authority.

The central conclusion is that MST-MATH must evolve from a **GeoGebra figure generator** into a **GeoGebra Interactive Learning Activity / Lesson / Book Generator** while preserving the rule that mathematical authority remains outside the GeoGebra renderer/adapter.

## 2. Corpus handling lessons

### 2.1 Hierarchical dedupe is mandatory

The corpus repeatedly contains the same construction under different filenames, different wrapper archives, and repeated question instances. The ingest pipeline must dedupe at four levels:

1. outer archive SHA-256;
2. embedded `.ggb` SHA-256;
3. normalized `geogebra.xml` SHA-256;
4. pedagogical-family similarity.

Examples observed:

- `139.ggb`, `140.ggb`, `141.ggb`, and all three applets in “3Q: Build a Cylinder with Lateral Area” share the same construction XML;
- `135–138` are exact byte-for-byte duplicates;
- `128` and `129` have different outer archives but identical GGB members/XML;
- quiz books often display 3–7 activities but use only one underlying XML template;
- `145–163` are exact byte-for-byte duplicates of the immediately preceding named ZIP resources;
- `164(1)` is an exact duplicate of the previously learned tangent construction resource.

**Rule:** store `TEMPLATE_COUNT` and `ACTIVITY_INSTANCE_COUNT` separately. Do not inflate corpus statistics by counting cloned instances as new construction knowledge.

### 2.2 Separate authored material from GeoGebra offline runtime

Some ZIPs are full GeoGebraBooks with embedded `ggbBase64`; some are offline worksheet wrappers; some contain only links to an external activity. Runtime HTML/JS must never be mistaken for authored pedagogy.

Observed cases:

- “Exploration: Similar Triangles” is mainly an offline wrapper/static prompt;
- “4 Ways to Build a Cone” contains valuable authored text/images but no embedded construction;
- “How Fast Are You Spinning?” is external-link-only in the supplied package;
- large books include many runtime files that are irrelevant to corpus learning.

Required classifications:

`EMBEDDED_GGB` / `GEOGEBRA_BOOK` / `OFFLINE_WRAPPER` / `STATIC_AUTHORED_CONTENT` / `EXTERNAL_LINK_ONLY`.

## 3. Reusable pedagogical engine families learned

### 3.1 Exploration Sequence Engine

Pattern:

`manipulate → observe → answer guided prompt → reveal/measure → formalize → apply`

Strong evidence:

- supplementary/complementary angles (120/121);
- π discovery (“One Special Constant”, “Circumference and Radius”);
- logarithmic graph discovery;
- tangent properties;
- bearings;
- cross-section and surface-of-revolution sequences in the large 3D book.

This is the primary engine for discovery-oriented lessons.

### 3.2 Staged Proof / Transformation Engine

A long “Slide Me!” control is frequently used as a timeline. Objects are conditionally transformed with `Translate`, `Rotate`, `Dilate`, `Mirror`, `Intersect`, and visibility intervals.

Examples:

- trapezoid/parallelogram area derivations (127/133);
- circle-area sector rearrangement (134);
- Fermat/Torricelli construction and 120° structure (142);
- SSS congruence by rigid-motion superposition with orientation branching (143);
- inscribed-angle theorem by transporting angle sectors (144);
- alternate interior angles by moving angle sectors into superposition;
- parallel/perpendicular line Open Middle tasks with delayed geometric reveal.

Reusable principle: **proof by visible invariant-preserving transformation**, not animation for decoration.

### 3.3 Construction-Task Worksheet Engine

Students should sometimes build the mathematics using GeoGebra tools rather than only manipulate a finished scene.

Best example: tangent-to-circle activity where learners use Tangent, Segment, Point-on-Object, Angle, Intersect, and Distance tools, then drag, measure, conjecture, and state the theorem.

Required capabilities:

- tool-by-tool instructions;
- permitted tool subset;
- construction state checkpoints;
- invariant validation;
- “continue only when prerequisite exists” logic;
- final theorem/reflection prompt.

### 3.4 Randomized Self-Check / Question Generator

Corpus examples repeatedly implement:

`generate solvable target → learner manipulates or types response → Check → conditional feedback → New Problem/reset`.

Examples:

- 3D rectangular-prism surface-area task (135–138);
- cylinder lateral-area generator (139 family);
- slope quiz;
- ellipse standard-form quiz;
- distance in coordinate plane;
- 3D distance task;
- graphing basic inequalities (165).

Critical engineering lesson: randomization must draw from a **precomputed feasible target set** or otherwise prove target solvability. Random target generation without a feasibility guarantee is unacceptable.

### 3.5 Direct-Manipulation Answer Engine

The response should not always be typed text.

Examples:

- graphing inequalities by moving a boundary point and choosing included/open + solution direction;
- 3D distance by moving points A and B until the target distance is achieved;
- histograms by dragging bar tops;
- unit-square rectangle construction;
- conic/function graph-building activities.

MST-MATH therefore needs an answer model where the response can be **scene state**, not only a string/number.

### 3.6 Open Middle Constraint Engine

Common structure:

`many valid answers + explicit constraints + no-repeat rule + second/different solution + optimization extension`.

Observed in:

- sector area;
- arc length;
- equations of parallel lines;
- equations of perpendicular lines;
- bearing exercises;
- histogram exercise;
- coordinate quadrilateral task.

Typical checker primitives include `Mode`, `Length`, list construction, exact algebraic equality, relation tests, and conditional visual feedback.

A reusable Open Middle engine should parameterize:

- variable slots;
- allowed domain;
- uniqueness rule (value or absolute value);
- mathematical relation;
- multiple-solution requirement;
- optimization objective;
- explanation prompt.

### 3.7 Dynamic Equation-Anatomy Engine

Parabola, ellipse, hyperbola, logarithm, and trigonometric resources show that formula parameters are most effective when visually bound to geometric quantities.

Required pattern:

`equation parameter ↔ color/semantic role ↔ geometric segment/point/axis/asymptote ↔ dynamic graph`.

Notable requirements:

- conic center/vertex/focus axes and asymptote scaffolding;
- graph transformations (amplitude, period, phase shift, vertical shift);
- inverse-function relationships;
- visual linkage must be semantic, not decorative recoloring.

### 3.8 Multi-Solution Workspace

A pedagogically strong activity can reuse one manipulative multiple times with escalating prompts:

`build one solution → build a different solution → build a third → compare/generalize`.

Examples: unit-square rectangle tasks and repeated Open Middle workspaces.

Do not create separate engines when one canonical workspace plus distinct prompts is sufficient.

### 3.9 Representation Translator Engine

The bearings book demonstrates one mathematical object expressed through several representations:

- clockwise bearing from North;
- direction angle counterclockwise from East;
- quadrant/cardinal bearing notation;
- geometric vector/path representation.

MST-MATH should support representation translation as a first-class learning pattern: **convert → visualize → verify → apply in navigation/modeling**.

### 3.10 Direct-Manipulation Statistics Engine

The histogram sequence (172–176) provides a strong reusable primitive:

- learner drags bar tops;
- total/sample counts update dynamically;
- distribution shape is the learner’s construction.

This supports two stages:

1. construct named shapes: skew left/right, uniform, unimodal, bimodal, multimodal, symmetric;
2. infer plausible distribution shape from context: fair die, difficult/easy test, height distribution, restaurant traffic.

The Open Middle histogram extends this with simultaneous checks of distribution geometry, derived statistics, and digit constraints.

### 3.11 3D Geometry Exploration / Modeling Engine

High-value 3D patterns include:

- intersecting planes with opacity + intersection-line reveal (122);
- 3D transformations (125);
- prism/cylinder generator/checker tasks;
- perpendicular-bisector plane + sphere cross-section (168);
- nets/unwrapping;
- dynamic cross sections;
- surfaces of revolution;
- 3D coordinate construction;
- shortest paths on nets;
- real object → coordinate/function model → 3D model → optional AR comparison.

The large “Area, Surface Area, Volume, Cross Section, 3D” book is a high-value architecture reference because it mixes discovery, proof, creation, assessment, Open Middle, optimization, modeling, and projects in one curriculum-scale book.

### 3.12 Multi-Strategy Construction Router

“4 Ways to Build a Cone” shows that the same mathematical object can be constructed through different pathways depending on learner level or learning objective:

1. direct Cone tool;
2. circle + extrude workflow;
3. surface of revolution;
4. parametric Surface construction.

MST-MATH should choose a construction strategy based on `learningObjective`, `learnerLevel`, and whether the purpose is conceptual understanding, tool fluency, or advanced modeling.

### 3.13 Cognitive-Conflict / Visual-Paradox Pattern

“Area Changing Illusion with Insight” is a useful lesson opener:

`predict → manipulate → observe contradiction → inspect hidden condition → explain`.

This pattern should be available as a pedagogical phase, not a rendering effect.

## 4. Visual/interaction lessons

### 4.1 Object-anchored labels are required

The corpus and subsequent QA show that labels placed by fixed screen coordinates produce overlap and excessive distance from objects. MST-MATH should use object/segment/region anchors, preferred offsets, collision avoidance, viewport clamping, and leader lines only when needed.

This is consistent with the later `OBJECT-ANCHORED CLEAN OVERLAY` direction.

### 4.2 Student runtime is not authoring runtime

Many corpus activities deliberately expose only a small semantic control surface: a slider, checkbox, input box, Check button, Hint button, New Problem button, or a small allowed tool subset.

The learner-facing runtime must therefore default to **restricted activity mode**, not a permanently full GeoGebra toolbar.

### 4.3 Delayed reveal matters

In several proof/Open Middle activities, the geometric verification is intentionally hidden until after the learner commits an answer. Immediate display of the invariant can leak the solution.

Hints/reveals need explicit `unlockCondition` and `pedagogicalTiming` metadata.

## 5. GeoGebra Book / full lesson architecture learned

The reference book `https://www.geogebra.org/m/eS4YAbjP` reinforces a full lesson/book output rather than a sequence of unrelated applets.

Recommended differentiated lesson structure:

1. Warm-up / Predict;
2. Discovery;
3. Guided Questions;
4. Quick Check;
5. Remediation / Hints;
6. Conceptualization / formal knowledge;
7. Practice / generated tasks;
8. Open Middle / multiple solutions;
9. Challenge / extension;
10. reflection/progress.

At book level, chapters should support differentiation and reusable activity templates rather than duplicating construction XML for each prompt.

## 6. Canonical reusable primitives identified

Suggested template registry entries:

- `UNIT_SQUARE_MANIPULATIVE`
- `HISTOGRAM_DIRECT_MANIPULATION`
- `LINE_RELATION_OPEN_MIDDLE`
- `BASIC_INEQUALITY_GRAPH_RESPONSE`
- `BEARING_REPRESENTATION_TRANSLATOR`
- `PLANE_BISECTOR_3D`
- `FORMULA_DISSECTION_STAGE_TIMELINE`
- `CIRCLE_SECTOR_REARRANGEMENT`
- `RIGID_MOTION_SUPERPOSITION_PROOF`
- `CONIC_EQUATION_ANATOMY`
- `RANDOM_SOLVABLE_GEOMETRY_TARGET`
- `CROSS_SECTION_3D_EXPLORER`
- `SURFACE_OF_REVOLUTION_BUILDER`
- `MULTIPLE_SOLUTION_WORKSPACE`

These are **template families**, not mathematical authorities.

## 7. What should not be copied blindly

1. Do not copy a resource’s visual style just because its pedagogy is strong.
2. Do not depend on long monolithic slider scripts when a structured stage/timeline model can represent the same behavior.
3. Do not encode checker logic solely as opaque GeoGebra text conditions if MST-MATH can represent the relation semantically and generate the adapter script.
4. Do not treat `Random()` as sufficient generation logic; solvability and uniqueness expectations must be validated.
5. Do not expose full authoring tools to students unless the activity explicitly teaches construction-tool fluency.
6. Do not store repeated GeoGebraBook instances as independent templates.
7. Do not move mathematical authority into `geogebra.xml`, JavaScript, or renderer code.

## 8. Product conclusion

MST-MATH needs four GeoGebra output scales under the existing P08 family:

- **Figure** — dynamic illustration only;
- **Activity** — one interactive learning/self-check task;
- **Lesson** — sequenced activities with pedagogy and progress;
- **Book** — chapters/lessons, differentiation, reusable templates, and curriculum progression.

The next architecture must represent **geometry state, learner interaction, assessment logic, pedagogy, and lesson sequencing as separate concerns**. The existing Dynamic Geometry authority remains the mathematical/semantic base; this synthesis provides the missing learning-orchestration layer.