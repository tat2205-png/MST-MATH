# NA-MATH CANONICAL LAYOUT SPEC V1.0

**Project umbrella:** PiMath / MATH AI  
**Software implementation:** Math AI Studio  
**Standards/publishing layer:** NA-MATH  

**Status:** CANONICAL RECOVERY SPEC  
**Purpose:** Reconcile and enforce already-approved layout decisions. This specification MUST NOT be used to redesign locked layouts.

---

## 1. AUTHORITY

Authority order:

`MASTER > APPROVED ARTIFACT > ORCHESTRATOR > MODULE TASK`

Principle:

**AUTOMATE EXECUTION, NOT AUTHORITY.**

Rules:

1. Any artifact or decision marked `LOCKED`, `CANONICAL`, `APPROVED`, `MASTER`, or `DONE` is immutable unless an explicit higher-authority replacement exists.
2. A module, agent, renderer, Codex task, or orchestrator MUST NOT invent a replacement style.
3. If authoritative values are missing or conflicting, the system MUST fail closed and report `AUTHORITATIVE_LAYOUT_UNRESOLVED`.
4. `NA-MATH SYSTEM V2.6`, `NA-MATH-LAYOUT V1.3`, `NA-MATH-TEXTBOOK-STYLE V1.0`, and `NA-MATH STUDENT WORKSPACE V1.2` are separate version axes. Do not collapse them into a single version number.

---

## 2. RECOVERED TIMELINE

### Stage A — Early prototypes
Status: `UNVERIFIED / NON-CANONICAL`

Historical experiments existed before the locked standards. Exact version-by-version records for a distinct `NA-MATH-LAYOUT V1.0`, `V1.1`, or `V1.2` have not been recovered with sufficient authoritative evidence.

**Rule:** Do not reconstruct or promote missing early versions from memory.

### Stage B — NA-MATH-TEXTBOOK-STYLE V1.0
Status: `STYLE_LOCK=ON`

Recovered canonical document structure includes:

`Learning Objectives → Why It Matters → Explore → Key Concept → Example → Check Your Understanding → Practice → Challenge → Summary`

A4 textbook presentation and source fidelity are preserved. Real images are illustrative and must not silently become mathematical givens.

### Stage C — NA-MATH STUDENT WORKSPACE V1.2
Status: `ESTABLISHED`

Locked behavior includes:

- student solutions OFF where required;
- handwriting/workspace optimization;
- answer key at end where required;
- compact pagination;
- mathematical correctness over cosmetic assumptions.

### Stage D — NA-MATH-LAYOUT V1.3
Status: `CANONICAL / LOCKED`

Core rules:

- A4 document layout;
- approximately `3/4 text – 1/4 illustration` when appropriate;
- consistent educational icons;
- deterministic math and geometry;
- no text/figure overlap;
- no renderer-side redesign.

Locked content-type colors:

- Learning material: `#1E63B5`
- Worksheet: `#2F8F68`
- Exercise/Test: `#6B4FA3`
- Video: `#E57C38`

### Stage E — Canonical video layout
Status: `APPROVED ARTIFACT / MUST CONFORM`

Recovered approved demo structure:

**QUESTION TOP → SOLUTION LEFT → GEOMETRY RIGHT**

Structural constraints:

1. The question occupies the upper region.
2. The lower region contains solution and visual areas.
3. The solution region is on the left.
4. The geometry/graph/animation region is on the right.
5. Regions MUST NOT overlap.
6. Math and labels MUST remain inside safe render bounds.
7. The geometry region MUST be driven by mathematical provenance, not visual symmetry.
8. The renderer MUST NOT add auxiliary points or alter geometric relationships merely to improve appearance.

Approved evidence artifacts:

- `04_demo_video_bai_giang_math_safe.pdf`
- `04_demo_video_bai_giang_math_safe_v2.pdf`

### Stage F — NA-MATH SYSTEM BASELINE V2.6
Status: `INTEGRATED / LOCKED`

V2.6 is a system baseline. It does NOT replace the version identities or meaning of:

- `NA-MATH-LAYOUT V1.3`
- `NA-MATH-TEXTBOOK-STYLE V1.0`
- `NA-MATH STUDENT WORKSPACE V1.2`
- geometry/visual locks.

### Stage G — NA-MATH TYPOGRAPHY STANDARD V1.0
Status: `LOCKED TYPOGRAPHY OVERLAY`

This newer typography layer supersedes ONLY older typography-role defaults. It MUST NOT change Layout V1.3 geometry, color, workspace, pagination intent, visual lock, Math IR, Document IR, Question Bank behavior, or source immutability.

Canonical roles:

- Document title: STIX Two Text Bold — 20/24 pt
- Chapter/major part: STIX Two Text Bold — 16/20 pt
- Section/topic L1: XCharter Bold — 13.5/17 pt
- Section/topic L2: XCharter Semibold — 12/15 pt
- Body/question: Libertinus Serif — 11/14 pt
- Inline math: Libertinus Math — 11 pt
- Display math: Libertinus Math — 11.5–12 pt
- Note/method/warning: Libertinus Serif — 10/13 pt
- Data tables: Libertinus Serif — 10 pt default
- Caption: Libertinus Serif or XCharter — 9.5/12 pt
- Figure/graph/geometry labels: Libertinus Math or XCharter — 9.5 pt
- Header: XCharter or STIX Two Text — 9 pt
- Footer/page number: XCharter — 8.5 pt
- Answer key: Libertinus Serif — 9.5 pt

Student-readable text MUST NOT be below 9 pt.

Older references that use Source Sans 3 as canonical title/label typography are superseded by this typography layer only.

---

## 3. VIDEO LAYOUT CONTRACT

Canonical semantic regions:

```text
┌────────────────────────────────────────────────────────────┐
│                         QUESTION                           │
├──────────────────────────────┬─────────────────────────────┤
│                              │                             │
│           SOLUTION           │          GEOMETRY           │
│                              │      / GRAPH / ANIMATION    │
│                              │                             │
└──────────────────────────────┴─────────────────────────────┘
```

This diagram defines relationships, not invented pixel dimensions.

### Required invariants

- `QUESTION.isTop = true`
- `QUESTION.above(SOLUTION) = true`
- `QUESTION.above(GEOMETRY) = true`
- `SOLUTION.leftOf(GEOMETRY) = true`
- `overlap(QUESTION, SOLUTION) = false`
- `overlap(QUESTION, GEOMETRY) = false`
- `overlap(SOLUTION, GEOMETRY) = false`
- all student-visible text and math remain inside safe bounds;
- geometry provenance must be valid;
- no assumption may be added for visual balance.

### Forbidden runtime behavior

The application MUST NOT:

- stack solution below geometry;
- move geometry to the left of solution;
- replace the three-region layout with an automatically selected template;
- resize text below the typography floor to hide overflow;
- allow text/text, text/figure, text/axis, or text/table-border collisions;
- invent a point, label, edge, angle, perpendicularity, midpoint, or symmetry;
- silently fall back to a different layout when content overflows.

Overflow MUST trigger controlled reflow or QA failure, not a style replacement.

---

## 4. DOCUMENT LAYOUT CONTRACT

Document layout MUST preserve:

- A4;
- content-type color identity;
- textbook hierarchy;
- deterministic figures;
- consistent cards/icons;
- no overlap;
- answer key placement rules;
- student-workspace rules;
- source mathematical meaning.

The renderer may reflow spacing and pagination to solve collision, but MUST NOT redesign the canonical visual language.

---

## 5. GEOMETRY / VISUAL LOCK

Canonical visual rules include:

- geometry semantics first;
- deterministic rendering;
- no freehand or generative-image geometry for canonical mathematical diagrams;
- no added assumptions or auxiliary points unless mathematically required;
- visible/hidden edges determined by the approved view;
- avoid overlapping labels/edges;
- preserve source mathematical meaning.

A visually pleasing but mathematically unproven placement is invalid.

---

## 6. FAIL-CLOSED QA GATES

A render is `PASS` only when all applicable gates pass:

1. `LAYOUT_PROFILE_RESOLVED`
2. `CANONICAL_LAYOUT_ID_MATCH`
3. `QUESTION_TOP`
4. `SOLUTION_LEFT`
5. `GEOMETRY_RIGHT`
6. `NO_REGION_OVERLAP`
7. `NO_TEXT_TEXT_COLLISION`
8. `NO_TEXT_FIGURE_COLLISION`
9. `NO_TEXT_AXIS_COLLISION`
10. `NO_TEXT_TABLE_BORDER_COLLISION`
11. `SAFE_BOUNDS_PASS`
12. `TYPOGRAPHY_ROLE_PASS`
13. `MIN_READABLE_SIZE_PASS`
14. `GEOMETRY_PROVENANCE_PASS`
15. `SOURCE_IMMUTABILITY_PASS`

If any mandatory gate fails:

`RENDER_ACCEPTANCE = FAIL`

The application MUST NOT silently downgrade the gate.

---

## 7. CANONICAL PROFILE SELECTION

For teaching-video renders that include both a worked solution and a mathematical visual:

`profile = NA_MATH_VIDEO_QSG_V1`

where `QSG = Question / Solution / Geometry`.

The profile must resolve to the approved semantic layout:

`Question top → Solution left → Geometry right`.

No generic or adaptive layout selector may override this profile.

---

## 8. MIGRATION / REPAIR RULE

When the current app disagrees with this spec:

1. classify the defect as `CANONICAL_LAYOUT_CONFORMANCE_BUG`;
2. locate the currently wired layout/profile resolver;
3. locate the approved video artifact/profile already present in the repo;
4. wire the runtime to that profile;
5. do not create a new visual design;
6. add deterministic conformance tests;
7. render a representative acceptance case;
8. require human visual acceptance before declaring completion.

---

## 9. DO-NOT-PROMOTE RULE

Any historical item for which authoritative evidence is incomplete MUST remain one of:

- `UNVERIFIED`
- `UNKNOWN`
- `NEEDS_REVALIDATION`

It MUST NOT be promoted to `LOCKED`, `APPROVED`, `CANONICAL`, or `DONE` by inference.

---

## 10. ACCEPTANCE STATEMENT

The implementation is conformant only if:

**the app reproduces the approved layout logic rather than inventing a new one.**

For video with problem + solution + geometry:

**QUESTION TOP / SOLUTION LEFT / GEOMETRY RIGHT is mandatory.**
