# MST-MATH Math Visual Semantics V0.1

Status: **DRAFT / CANDIDATE / NON-CANONICAL**

Scope: interactive mathematics, especially GeoGebra P08 outputs. This document is intentionally not a locked palette standard.

## 1. Principle

MST-MATH must not assign mathematical meaning by subject color alone.

Use two layers:

1. **Global semantic role** — stable meaning across all mathematics.
2. **Subject theme** — optional accent/tone overlay for Geometry, Algebra, Calculus, Trigonometry, Statistics, Probability, Oxy/Oxyz, Conics, and 3D.

A semantic role always wins over a subject accent.

Example: an error remains `ERROR` in every subject; a draggable point remains `DRAGGABLE_INPUT` in every subject.

---

## 2. Global visual semantic roles

Candidate roles:

- `STRUCTURAL_PRIMARY`
- `STRUCTURAL_SECONDARY`
- `AUXILIARY_CONSTRUCTION`
- `DRAGGABLE_INPUT`
- `EDITABLE_PARAMETER`
- `SELECTABLE_OPTION`
- `CURRENT_FOCUS`
- `TARGET_OBJECT`
- `MEASUREMENT`
- `CONSTRAINT`
- `INVARIANT`
- `VALIDATED_RESULT`
- `INCORRECT_STATE`
- `WARNING_STATE`
- `GUIDE_ONLY`
- `FUTURE_REVEAL`
- `BACKGROUND_GRID`
- `AXIS`
- `HIDDEN_GEOMETRY`
- `REFERENCE_OBJECT`
- `COMPARISON_OBJECT`

These roles control more than hue. They may define:

- stroke weight;
- stroke style;
- point style and size;
- fill opacity;
- label emphasis;
- layer order;
- interactive affordance;
- animation emphasis;
- visibility state.

---

## 3. Global hierarchy rules

### 3.1 Primary versus auxiliary geometry

Primary mathematical objects must visually dominate construction scaffolding.

Recommended relationship:

```text
PRIMARY stroke weight > AUXILIARY stroke weight
PRIMARY contrast > AUXILIARY contrast
PRIMARY label priority > AUXILIARY label priority
```

Auxiliary construction should remain visible enough to explain reasoning without competing with the result.

### 3.2 Draggable versus fixed points

A draggable point must be visually discoverable through at least two cues, e.g.:

- larger point size;
- distinct outline/fill treatment;
- hover/touch affordance;
- short semantic label or handle indicator.

Color alone is insufficient.

### 3.3 Fill opacity

Mathematical fills should usually be subordinate to boundaries and labels.

Default candidate ranges:

- explanatory region fill: approximately 8–18% opacity;
- active selected region: approximately 15–28%;
- 3D surface: context-dependent transparent material, preserving edges and depth cues;
- validated result fill: may increase temporarily but must not obscure notation.

These are candidate ranges, not locked constants.

### 3.4 Correct / incorrect colors

Validation colors are reserved semantic resources.

- success color is used only after mathematical validation;
- error color is used only for incorrect/invalid states;
- decorative use of validation hues is discouraged because it weakens feedback meaning.

Correctness must never be conveyed by color alone; pair with icon/text/state change.

---

## 4. Subject theme layer

Subject themes provide atmosphere and grouping, not semantic truth.

Candidate directions:

### Geometry 2D
- neutral/light warm background;
- blue-family structural accent;
- construction lines neutral/slate;
- low-opacity geometric region fills.

### Geometry 3D / Oxyz
- neutral cool background;
- blue/cyan primary objects;
- transparent surfaces;
- hidden/depth structure differentiated by opacity or line style rather than hue alone.

### Algebra
- neutral background;
- indigo/violet accent for symbolic focus;
- neutral graph scaffolding.

### Functions / Calculus
- cool neutral background;
- teal/blue function emphasis;
- derivatives/tangents/comparison objects use secondary semantic roles, not arbitrary rainbow coloring.

### Trigonometry
- neutral/light warm background;
- violet/blue accent family;
- angle, unit-circle point, coordinate, and graph should be linked through representation semantics.

### Statistics
- neutral background;
- green/teal accent family;
- histogram/bar geometry must remain editable/drag affordances when learner-controlled.

### Probability
- neutral/light warm background;
- amber accent family may be used for sample-space/event focus;
- event states must still follow global semantic roles.

### Conics
- neutral/cool background;
- curve as primary role;
- focus/directrix/asymptote as distinct semantic roles;
- equation parameters should be visually linked to corresponding geometry.

### Optimization
- neutral background;
- objective and feasible region separated semantically;
- optimum highlight only after mathematical validation.

No subject theme may override `VALIDATED_RESULT`, `INCORRECT_STATE`, accessibility constraints, or active interaction affordances.

---

## 5. Lines and segments

Candidate semantics:

- object-defining edge: solid, high-contrast;
- auxiliary construction: thinner/lower contrast;
- hidden edge: dashed or reduced-opacity according to 3D context;
- asymptote: distinct line style, subordinate to primary graph;
- axis: neutral and stable;
- locus/trace: visually distinct only when pedagogically requested;
- vector: clear arrowhead, sufficient width, semantic distinction by role.

Decorative random line styles are forbidden.

---

## 6. Points

Point style must encode interaction and semantic priority.

Candidate classes:

- fixed structural point;
- draggable control point;
- intersection/result point;
- measurement/reference point;
- temporary construction point;
- hidden/internal point.

A moving point carrying a pedagogical character or icon must remain mathematically anchored to the exact point and must not change the geometry.

---

## 7. Labels and annotations

Mathematical labels use object-anchored placement.

Required behavior:

- follow the moving object;
- maintain minimum separation from neighboring labels and geometry;
- prefer stable side/quadrant placement;
- clamp to viewport if required;
- use leader lines only when direct proximity would create ambiguity;
- hide or de-emphasize nonessential labels under crowding.

Fixed-screen positioning is reserved for UI controls, not semantic object labels.

---

## 8. Dynamic focus hierarchy

A lesson may change focus over time without redefining the object identity.

Candidate temporary roles:

- `FOCUS_NOW`
- `BACKGROUND_CONTEXT`
- `NEXT_REVEAL`
- `VALIDATED_RESULT`

Transitions may modify stroke, opacity, visibility, or label emphasis. They should not assign arbitrary new colors each step.

---

## 9. Representation-linked color semantics

When the same mathematical quantity appears in multiple representations, visual linking is allowed and encouraged.

Examples:

- parameter `a` in equation <-> geometric length controlled by `a`;
- angle `theta` <-> arc/sector <-> unit-circle point;
- bearing value <-> navigation ray;
- frequency value <-> histogram bar.

The linking color belongs to the semantic quantity, not to the screen object.

Accessibility requires a secondary cue such as label, line style, icon, or spatial correspondence.

---

## 10. Background rules

Background choice is subordinate to readability and device context.

Default principles:

- avoid saturated decorative backgrounds behind mathematics;
- maintain strong contrast for thin geometric lines;
- preserve projected-TV readability;
- avoid background grids unless mathematically useful;
- 3D backgrounds should support depth without reducing label contrast;
- subject themes may tune warmth/coolness but should remain restrained.

Dark backgrounds are allowed for specific presentation/video contexts but are not the default interactive-learning authority.

---

## 11. Accessibility

Critical meaning must survive:

- grayscale;
- common color-vision deficiencies;
- low-quality projection;
- tablet display;
- classroom viewing distance.

Use redundant coding:

```text
color + line style + size + icon + label + position/state
```

Minimum target sizes and contrast ratios should be defined by the existing MST-MATH accessibility authority rather than duplicated here.

---

## 12. QA candidates

- `VIS_ROLE_ASSIGNMENT_PASS`
- `VIS_SUBJECT_THEME_NO_SEMANTIC_OVERRIDE_PASS`
- `VIS_COLORBLIND_REDUNDANCY_PASS`
- `VIS_LABEL_COLLISION_PASS`
- `VIS_DRAG_AFFORDANCE_PASS`
- `VIS_PRIMARY_AUXILIARY_HIERARCHY_PASS`
- `VIS_FILL_OBSCURATION_PASS`
- `VIS_VALIDATION_COLOR_RESERVATION_PASS`
- `VIS_RESPONSIVE_VIEW_PASS`
- `VIS_REPRESENTATION_LINK_PASS`

---

## 13. Promotion strategy

Do not lock one global palette from corpus observation alone.

Create Golden Cases for:

1. Geometry 2D;
2. Oxyz/3D;
3. Functions/Calculus;
4. Trigonometry;
5. Statistics;
6. Probability;
7. Conics;
8. interactive assessment feedback.

Each Golden should be reviewed on laptop, tablet, classroom display, grayscale, and color-vision-deficiency simulation before promotion.
