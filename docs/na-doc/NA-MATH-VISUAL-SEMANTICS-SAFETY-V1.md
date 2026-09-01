# NA-MATH Visual Semantics Safety V1.0 — Architecture Lock

Status: **PLANNED / LOCKED CONTRACT**. No future subsystem described here is implemented by NA-DOC-03.

## Canonical future pipeline

`Question / Document / Math IR → Mathematical Semantics → Validated Math Visual Semantics → Validation Gate → Renderer`

The renderer must not infer or solve mathematics. If required semantics are unverified, `RENDER_ALLOWED=NO`.

Planned sequence:

1. `NA-DOC-04R` — existing visual architecture audit.
2. `NA-DOC-04A0` — common math visual safety contract.
3. `NA-DOC-04A1` — coordinate geometry contract.
4. `NA-DOC-04A2` — function graph contract.
5. `NA-DOC-04A3` — vector geometry contract.
6. `NA-DOC-04A4` — solid geometry contract.
7. `NA-DOC-04B` — validated math visual renderer.
8. `NA-DOC-05` — DOCX/LaTeX/PDF integration.

## Common hard invariants

- `NO_INVENTED_POINT`, `NO_INVENTED_LINE`, `NO_INVENTED_VERTEX`, `NO_INVENTED_EDGE`, `NO_INVENTED_FACE`, `NO_INVENTED_LABEL`.
- `NO_INVENTED_RELATION`, `NO_VISUAL_RELATION_INFERENCE`.
- `NO_INVENTED_PARALLELISM`, `NO_INVENTED_PERPENDICULARITY`, `NO_INVENTED_EQUAL_LENGTH`.
- `NO_INVENTED_ALTITUDE`, `NO_INVENTED_HEIGHT_FOOT`, `NO_INVENTED_CENTER`, `NO_INVENTED_DIAGONAL`, `NO_INVENTED_AUXILIARY_LINE`.
- `RENDERER_MUST_NOT_SOLVE_MATH`.

## Coordinate geometry lock

Coordinate semantics must preserve Ox/Oy orientation, origin O, ticks, numbers, unit, scale, and viewport. Default `xUnitScale=yUnitScale` unless explicit validated semantics require otherwise.

Hard invariants: `NO_INVENTED_INTERCEPT`, `NO_INVENTED_REGION`, `NO_INVENTED_SOLUTION_VERTEX`, and `NO_INVENTED_COORDINATE_LABEL`. Student workspace must contain no solution curve, region, vertices, or answer annotations.

## Function graph lock

Locked minimum families are `CUBIC`, `RATIONAL`, `EXPONENTIAL`, `LOGARITHMIC`, and `TRIGONOMETRIC`.

Hard invariants include `NO_TEMPLATE_SHAPE_DRAWING`, `NO_INVENTED_FUNCTION`, `NO_INVENTED_DOMAIN`, `NO_INVENTED_ZERO`, `NO_INVENTED_INTERCEPT`, `NO_INVENTED_EXTREMUM`, `NO_INVENTED_ASYMPTOTE`, `NO_INVENTED_DISCONTINUITY`, `NO_INVENTED_HOLE`, `NO_INVENTED_PERIOD`, `NO_INVENTED_PHASE`, `NO_INVENTED_BRANCH`, and `NO_CONNECT_ACROSS_DISCONTINUITY`. `GRAPH_SAMPLE_POINT != MATHEMATICAL_POINT`.

A cubic cannot use a generic S template. Denominator zero does not automatically establish a vertical asymptote. A transformed exponential does not automatically have asymptote `y=0`. A transformed logarithm does not automatically have domain `x>0` or asymptote `x=0`. Trigonometric graphs must preserve validated amplitude, period, phase, vertical shift, angle unit, and discontinuities. If angle unit is unverified, `GRAPH_RENDER_ALLOWED=NO`.

## Vector geometry lock

Keep `POINT`, `SEGMENT`, `VECTOR`, `SCALAR`, and `VECTOR_RENDER_INSTANCE` distinct. Point is not vector; segment AB is not vector AB; free vector is not position vector. For vector AB, `TAIL=A`, `HEAD=B`, and endpoint order is immutable. Render copies create no mathematical points.

Locked operations are vector+vector→vector, vector-vector→vector, scalar×vector→vector, magnitude(vector)→scalar, and dot(vector,vector)→scalar. Never infer parallel, perpendicular, same direction, or opposite direction visually. The zero vector has magnitude 0 and undefined direction. Student output contains no solution/result vectors.

## Solid geometry lock

Minimum families: `REGULAR_TETRAHEDRON`, `PRISM`, `REGULAR_PRISM`, `PYRAMID`, `REGULAR_PYRAMID`, `RECTANGULAR_BOX`, `CUBE`, `CYLINDER`, `CONE`, `FRUSTUM_CONE`, and `SPHERE`.

`SEMANTIC_3D_OBJECT != PROJECTED_2D_GEOMETRY`. True 3D length/angle is not projected screen length/angle. Generic prism is not automatically right; generic pyramid is not automatically regular. Do not invent centers, altitudes, height feet, right angles, diagonals, sections, or auxiliary lines.

View profiles must be deterministic. Visible/hidden edges derive from validated topology, view direction, and occlusion—not visual guess. Keep `CIRCLE_3D`, `PROJECTED_ELLIPSE`, and `ELLIPSE_2D` distinct. A frustum does not imply a parent apex. A sphere receives no decorative equator/great-circle ellipse unless source/task semantics define it. Preserve source vertex ordering and correspondence; do not move mathematical vertices for label layout.

## Source versus solution visual lock

- `SOURCE_GRAPH != SOLUTION_GRAPH`
- `SOURCE_VECTOR != SOLUTION_VECTOR`
- `SOURCE_SOLID_FIGURE != SOLUTION_SOLID_FIGURE`
- Global invariant: `SOURCE_VISUAL != SOLUTION_VISUAL`

Explicit source visual information may remain in the original question. Solution-generated visual information must never leak into student output.
