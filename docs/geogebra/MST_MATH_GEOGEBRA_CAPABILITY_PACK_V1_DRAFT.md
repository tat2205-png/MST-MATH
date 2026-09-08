# MST-MATH GeoGebra / Dynamic Mathematics Capability Pack V1 — DRAFT

Status: **PROPOSED / NON-CANONICAL / NON-DESTRUCTIVE**

This proposal converts the reverse-engineered GeoGebra corpus into reusable MST-MATH capability assets while preserving all currently locked/canonical architecture boundaries.

## 1. Architectural decision

GeoGebra remains a renderer / interaction capability beneath canonical semantic authority. It does **not** become a new source of truth, a new primary retrieval store, or a gateway required by PDF/DOCX/HTML outputs.

```text
INPUT
  -> Extraction / Normalization
  -> Canonical Math / Question / Document IR
  -> Intent Planner
       |-> Existing static outputs: PDF / DOCX / HTML / Slides
       `-> Dynamic-math intent
            -> GeoGebra capability retrieval
            -> GeoGebra planner
            -> GeoGebra Construction IR
            -> GeoGebra compiler/runtime
            -> GeoGebra-specific QA
            -> .ggb / interactive HTML / optional snapshots
```

## 2. Relationship with current canonical GeoGebra authority

The repository already has a locked canonical master standard `PIMATH_DNA_DYNAMIC_GEOMETRY_VISUALIZATION_V1.0`, generic GeoGebra runtime contracts, and a Construction IR boundary. This proposal **inherits** those authorities. It does not edit or supersede them.

Locked/canonical registries must remain unchanged until an explicit successor-version promotion is approved.

## 3. Five logical assets

### 3.1 MST-MATH GeoGebra Pattern Library

Purpose: reusable capability patterns learned from the corpus.

Examples:

- constraint-preserving constructions;
- hidden backstage construction;
- path-constrained draggable points;
- angle-sector transport and overlay;
- preserve-source / animate-derived-copy;
- parameter/timeline/reasoning slider separation;
- fold/unfold/net sequences;
- regular-n-gon cross-section kernels;
- function-defined 3D cross-section surfaces;
- projective vanishing-point constructions;
- unit-circle-to-function-graph synchronization;
- open-middle / inverse dynamic tasks.

**Boundary:** this registry must not be merged into the primary Question Bank or curriculum-content retrieval index.

### 3.2 GeoGebra Visual Style System

Visual styling is renderer-specific and must remain downstream of mathematical semantics.

Use semantic roles such as:

- `BACKGROUND_TEACHING`;
- `GIVEN_OBJECT`;
- `ACTIVE_CONCEPT`;
- `TARGET_OBJECT`;
- `AUXILIARY_OBJECT`;
- `CURRENT_CROSS_SECTION`;
- `SURFACE_PRIMARY`;
- `SURFACE_SECONDARY`;
- `RESULT`;
- `ERROR_STATE`.

Style controls include background, semantic color, fill, opacity, stroke width, line type, point size, label placement, grid/axes policy, and view layout.

Do **not** place literal GeoGebra colors or visual constants in canonical Math IR.

### 3.3 GeoGebra Construction / Animation Grammar

This is the highest-risk asset and therefore remains GeoGebra-specific.

Canonical semantic IR may describe a rotation, a standard-position angle, a fold, a cross-section, or a transformation. It must not contain GeoGebra execution details such as `If[t<1,...]`, raw GeoGebraScript, or renderer object labels.

The GeoGebra planner/compiler may use whitelisted primitives such as:

- Point / PointOnObject / PointInRegion;
- Segment / Line / Ray;
- Circle / Arc / Sector;
- Polygon / Plane / Surface;
- Intersection;
- Rotate / Translate / Dilate / Mirror;
- Sequence;
- piecewise state and conditional visibility;
- parameter, timeline, and reasoning sliders.

Animation principle:

> Animate mathematical state, not pixels.

### 3.4 GeoGebra Pedagogy & Assessment Patterns

Generated activities are derived artifacts, not canonical Question Bank entries.

Recommended lesson sequence:

```text
OBSERVE -> NOTICE -> WONDER -> PREDICT -> MANIPULATE -> TEST
-> CONJECTURE -> FORMALIZE -> PROVE -> APPLY
```

Supported derived activity patterns may include construction tasks, drag-to-target, open-middle tasks, inverse tasks, parametric generators, short response, progressive hints, and instant feedback.

Promotion of a generated activity into a canonical question requires Math QA, pedagogy QA, and human approval.

### 3.5 GeoGebra QA Rules

GeoGebra QA is namespaced. A GeoGebra failure must not block unrelated PDF/DOCX/HTML outputs unless the request explicitly depends on the GeoGebra-derived asset.

Minimum QA checks:

- mathematical correctness;
- preserved constraints while dragging;
- degenerate-state safety;
- orientation robustness;
- semantic visual hierarchy;
- exact mathematical animation;
- resettable interaction state;
- no dead/unreachable construction branches;
- safe display labels;
- accessibility not based on color alone.

## 4. Retrieval architecture

The system must explicitly distinguish:

```text
CONTENT RETRIEVAL
  = curriculum / source / canonical math / question content

CAPABILITY RETRIEVAL
  = GeoGebra pattern / visual / pedagogy / QA profiles
```

Correct order:

```text
Content retrieval
 -> Intent planning
 -> if dynamic-math needed: capability retrieval
```

Do not put GeoGebra pattern documents in the same primary retrieval namespace as Question Bank or source-backed curriculum content.

## 5. Data authority and output impact

### Must remain unchanged

- INPUT ingestion and source authority;
- extraction and normalization;
- canonical Math / Question / Document IR;
- Question Bank authority;
- existing PDF/DOCX/HTML renderer independence;
- canonical content retrieval.

### New derived capability

- GeoGebra Construction IR;
- GeoGebra compiler/runtime;
- `.ggb` output;
- interactive HTML output;
- optional GeoGebra-rendered SVG/PNG snapshots for static renderers.

Static renderers must not require GeoGebra runtime availability.

## 6. Corpus ingestion policy

External `.ggb` / GeoGebraBook materials are research inputs only.

Pipeline:

```text
External corpus
 -> deduplicate
 -> parse ZIP / ggbBase64
 -> inspect geogebra.xml / scripts
 -> classify by subject and technique
 -> extract generalized pattern
 -> normalize to MST semantic roles
 -> regenerate with whitelisted grammar
```

Forbidden path:

```text
External corpus -> copy raw third-party script -> execute in MST-MATH
```

This protects security, maintainability, provenance, and architecture authority.

## 7. Subject taxonomy for the corpus

### Core MST-MATH topics

- Geometry 2D;
- Geometry 3D;
- Trigonometry;
- Probability & Statistics;
- Oxy coordinate geometry;
- Oxyz coordinate geometry;
- Conic sections;
- transformations;
- fold / unfold / nets;
- function graphs;
- inequalities and regions;
- optimization;
- technical drawing / perspective.

### KNTT specialized-topic extension

#### Grade 10

- three-variable linear systems;
- mathematical induction and binomial theorem;
- conic sections and applications.

#### Grade 11

- plane transformations;
- graph theory;
- technical drawing elements.

#### Grade 12

- discrete random variables and characteristics;
- optimization, including linear programming and calculus;
- financial mathematics.

Each corpus entry should be tagged by subject, grade/topic, mathematical intent, construction family, interaction type, animation type, visual profile, pedagogy pattern, and QA requirements.

## 8. Visual analysis dimensions for every corpus pattern

For every unique construction, record:

- canvas/background;
- 2D/3D view dimensions;
- axes/grid policy;
- free vs dependent points;
- hidden helper objects;
- object colors and semantic roles;
- fill/alpha;
- stroke width and line type;
- point style and size;
- display labels and placement;
- object visibility conditions;
- control placement;
- camera/view orientation;
- synchronized multiple views;
- before/after or proof-timeline layout.

The goal is to learn a visual grammar, not copy each applet's palette verbatim.

## 9. Folding / flattening / technical construction focus

Maintain a dedicated pattern family for:

- 3D solid -> hinge/edge -> rotation -> flat net;
- flat net -> fold sequence -> 3D solid;
- vertex/edge/face identity preservation;
- corresponding labels across 2D and 3D;
- shortest-path-on-surface problems;
- surface area derivation;
- perspective with one/two/three vanishing points;
- visible/hidden line hierarchy;
- orthographic and technical drawing layouts.

## 10. Pre-demo rollout

For the demo, use a feature flag and Git-versioned registry. Do not require a database migration solely for the corpus registry.

Recommended demo representative golden set:

1. 2D constraint-preserving geometry;
2. unit-circle trigonometry with synchronized graph;
3. Oxy inequality region with correct boundary semantics;
4. Oxyz plane/line/section visualization;
5. fold/unfold net with identity preservation;
6. regular cross-section 3D solid;
7. conic plane intersection;
8. probability/statistics interactive task;
9. technical drawing/perspective pattern;
10. assessment/open-middle activity with reset and feedback.

Promotion requires representative Math QA, interaction QA, visual QA, deterministic reopen/export evidence, and human acceptance.

## 11. Non-goals for V1

- no rewrite of canonical Math IR;
- no replacement of existing GeoGebra runtime boundaries;
- no mandatory GeoGebra dependency for static output;
- no auto-promotion of AI-generated activities into Question Bank;
- no direct execution of raw third-party scripts;
- no modification of currently locked canonical registries.

## 12. Decision

Proceed as a **sidecar capability successor proposal**. Keep the five logical assets but implement them primarily as two architectural components:

1. **Versioned Capability Registry** — patterns, visual profiles, pedagogy profiles, QA profiles.
2. **GeoGebra Planner/Compiler** — renderer-specific construction and animation grammar.

This structure minimizes retrieval pollution, prevents renderer leakage into canonical semantics, keeps static outputs independent, and allows corpus learning to improve MST-MATH without reopening locked architecture.
