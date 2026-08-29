# NA-MATH-GEOMETRY-RULES V1.0

Status: GEOMETRY_BASELINE_CANDIDATE
Layout dependency: NA-MATH-LAYOUT V1.3 CANONICAL — LOCKED

## 0. Separation rule

This package controls geometry only.

It MUST NOT change:
- the V1.3 header/footer,
- card placement,
- column ratios,
- typography hierarchy,
- brand colors,
- component arrangement,
- document/worksheet/exercise/video layout.

Geometry may request a larger figure safe-box when mathematically necessary, but may not redesign the layout.

---

## 1. Core pipeline

GIVEN DATA
→ SEMANTIC GEOMETRY
→ DERIVED RELATIONS WITH PROVENANCE
→ VIEW PROFILE
→ PARALLEL PROJECTION
→ EDGE VISIBILITY TABLE
→ LABEL PLACEMENT
→ GEOMETRY QA
→ RENDER

Forbidden pipeline:

DRAW A NICE FIGURE
→ visually guess relationships
→ add perpendicular/parallel/equality/centers/hidden edges

Core rule:

GEOMETRY FIRST — PROJECTION SECOND — VISIBILITY THIRD — LABELS FOURTH — STYLE LAST.

---

## 2. Fail-closed provenance

Every important relation must have provenance:

- GIVEN
- CONSTRUCTED
- DERIVED
- CONFIRMED

The renderer may not invent:
- perpendicularity,
- parallelism,
- equal lengths,
- midpoint,
- center,
- cyclic quadrilateral,
- altitude,
- projection foot,
- hidden edge,
- auxiliary line.

If a required relation is not proven:

GEOMETRY_STATUS = UNPROVEN
PUBLISH = BLOCKED

---

## 3. Projection standard

Default school-textbook geometry uses parallel projection / affine-style schematic representation.

Must preserve where applicable:
- collinearity,
- point-on-line incidence,
- intersection structure,
- parallelism,
- correspondence of prism/box edges,
- ratios on the same line when encoded by the construction.

Do not infer actual metric angle or length from the projected drawing.

---

## 4. Visible / hidden edges

Visibility is selected from an explicit VIEW_PROFILE.

Do not decide dashed/solid style from:
- "looks farther back",
- vertical screen position,
- arbitrary perspective,
- aesthetic preference.

Line styles:
- visible edge → solid,
- hidden edge → dashed,
- partially hidden edge → split only if the view profile/topology requires it.

A mathematical auxiliary segment is NOT automatically a hidden edge.
A plane outline is NOT a solid edge unless the problem contains a solid with that edge.

---

## 5. Label rules

Labels are placed after geometry and visibility are resolved.

Required:
- no label-label collision,
- no label-edge collision,
- no label-point collision,
- no label over right-angle / equality / parallel markers,
- label association must remain unambiguous.

Prime notation:
A′, B′, C′, D′
must use a true prime glyph or the production math renderer.

---

## 6. Triangular prism — locked front-to-back view

Canonical profile:
TRIANGULAR_PRISM_FRONT_TO_BACK_KNTT

For prism ABC.A′B′C′:

Required relations:
- AA′ ∥ BB′ ∥ CC′
- AB ∥ A′B′
- BC ∥ B′C′
- CA ∥ C′A′

Locked visual orientation:
- C and C′ are the front vertices.
- AB is the rear edge of the lower triangular base.

VISIBLE / SOLID:
- CA
- CB
- C′A′
- C′B′
- CC′
- AA′
- BB′
- A′B′

HIDDEN / DASHED:
- AB

This is a VIEW PROFILE, not a universal visibility truth for every possible camera direction.

---

## 7. Trapezoid base profile

Canonical ID:
TRAPEZOID_BASE_LARGE_TOP_HORIZONTAL

If the problem gives a trapezoid with two base lengths:

- the larger base is drawn horizontal,
- the larger base is above the smaller base,
- the smaller base is below,
- the represented ratio of the two bases should match the given ratio when the problem supplies numerical lengths,
- do not add isosceles symmetry,
- do not add right angles,
- do not center the smaller base unless given/derived.

Example:
AB ∥ CD, AB = 6, CD = 3
→ AB horizontal above CD
→ display ratio AB:CD = 2:1.

---

## 8. Pyramid altitude rule

A pyramid altitude must be represented vertical in the approved textbook view ONLY AFTER the altitude relation is given or derived.

Do not create an altitude because the apex "looks centered".

Canonical rule:
PYRAMID_ALTITUDE_VERTICAL_IF_PROVEN

If SH ⟂ (base plane) is CONFIRMED:
- SH may be rendered vertical in the approved profile,
- H must be placed by its mathematical construction,
- H is not automatically the center, midpoint, centroid, circumcenter, or incenter.

---

## 9. Perpendicular side-plane altitude derivation

Canonical inference template:
PERP_SIDE_PLANE_TO_BASE_ALTITUDE

Given:
- (SAB) ⟂ (ABCD)
- (SAB) ∩ (ABCD) = AB
- SH ⊂ (SAB)
- SH ⟂ AB

Then:
- SH ⟂ (ABCD)
- SH is an altitude of the pyramid.

Rendering:
- only after the derived relation is CONFIRMED,
- SH can be vertical,
- H lies on AB as constructed,
- do not put H at the midpoint unless independently proven.

---

## 10. Equal lateral distances to base vertices

Canonical inference template:
EQUAL_SA_SB_SC_CIRCUMCENTER

Given:
SA = SB = SC.

Let H be the orthogonal projection of S onto (ABC).

Then, after valid derivation:
HA = HB = HC,
so H is the circumcenter of triangle ABC.

Rendering rule:
- never place H at a visually convenient "center",
- first verify HA = HB = HC,
- then use the circumcenter construction of triangle ABC.

---

## 11. Two right angles → cyclic base construction

Canonical inference template:
RIGHT_ANGLES_TO_CYCLIC_FOOT_PROFILE

Given:
∠SBA = 90°
∠SCA = 90°.

When the proof/construction establishes H in (ABC) such that:
BH ⟂ AB
CH ⟂ AC

and proves SH ⟂ (ABC),

the engine may also mark:
HBAC cyclic

ONLY after the cyclic relation is proven.

Do not add a circle before proof confirmation.

---

## 12. Box / parallelepiped

For ABCD.A′B′C′D′:
- corresponding edges remain parallel,
- the second face is generated by a common projected translation direction,
- hidden edges are defined by the active view profile,
- do not guess dashed edges from "back" alone.

When highlighting skew lines:
- verify no intersection,
- verify nonparallel directions,
- verify non-coplanarity in the semantic model.

---

## 13. Skew lines

Two lines a and b are skew only if:

- intersection(a,b) = ∅,
- direction(a) is not parallel to direction(b),
- no plane contains both lines.

Preferred source of truth:
semantic 3D model.

The 2D projection may visually cross.
A projected crossing is NOT a 3D intersection.

Never place an intersection point at a projected crossing unless the semantic geometry contains that intersection.

---

## 14. Skew lines on parallel planes

Canonical ID:
PARALLEL_PLANES_SKEW_LINES_CANONICAL

Required:
- (P) ∥ (Q)
- a lies in (P)
- b lies in (Q)
- a is not parallel to b

Visual rules:
- draw (P) and (Q) as two parallelograms with the same orientation family,
- corresponding plane-outline directions are parallel,
- keep clear separation,
- draw a and b with visibly nonparallel projected directions,
- do not connect (P) and (Q) with decorative dashed or vertical guide segments,
- do not imply a prism unless a prism actually exists,
- do not create a false intersection marker.

---

## 15. Auxiliary constructions

Only draw an auxiliary point/line/plane when:
- it is GIVEN,
- it is explicitly CONSTRUCTED in the solution,
- or it is DERIVED and needed by the current reasoning step.

Auxiliary construction lifecycle:
DECLARED
→ VERIFIED
→ DRAWN
→ optionally HIGHLIGHTED

No decorative auxiliary geometry.

---

## 16. Right-angle symbols

A right-angle marker may be drawn only when:
- the perpendicular relation is GIVEN or CONFIRMED,
- the marker location corresponds to the actual mathematical foot/intersection,
- the selected projection does not make the marker misleading.

If a 3D perpendicular relation cannot be shown unambiguously in projection:
use annotation/text rather than a decorative square.

---

## 17. Geometry QA gates

Every publishable 3D figure must pass:

1. INPUT_PROVENANCE_QA
2. TOPOLOGY_QA
3. INCIDENCE_QA
4. PARALLEL_RELATION_QA
5. PERPENDICULAR_RELATION_QA where relevant
6. VIEW_PROFILE_QA
7. PROJECTION_CONSISTENCY_QA
8. EDGE_VISIBILITY_TABLE_QA
9. AUXILIARY_GEOMETRY_QA
10. LABEL_COLLISION_QA
11. SYMBOL_PLACEMENT_QA
12. PRIME_GLYPH_QA
13. SGK_NOTATION_QA
14. NO_VISUAL_INFERENCE_QA

If any required gate fails:
PUBLISH_GEOMETRY = BLOCKED

---

## 18. Current implementation order

GEO-1  Geometry semantic schema
GEO-2  View-profile registry
GEO-3  Edge-visibility resolver
GEO-4  Label-placement / collision solver
GEO-5  Pyramid altitude inference templates
GEO-6  Prism / box / trapezoid canonical profiles
GEO-7  Skew-line and parallel-plane profiles
GEO-8  Golden geometry QA corpus
GEO-9  Integrate into V1.3 locked layouts without layout changes

The layout remains locked throughout GEO-1…GEO-9.
