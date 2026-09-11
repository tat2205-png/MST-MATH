# MST-07 — Rectangular Prism Fold G1 Specification

Status: `G1_DESIGN_ONLY`  
Decision: `APPROVE_HYBRID_G1_PATTERN`  
Implementation: `NOT_STARTED`

This document is a design specification only. It creates no `.ggb`, does not change the corpus, and does not replace Canonical Document/Question/Math/Figure IR. Mathematical truth belongs to the canonical Math IR and Geometry Engine; GeoGebra is a non-authoritative interactive output adapter.

## 1. Authority boundary

`135.ggb` is `PARTIAL SOURCE REFERENCE`, SHA-256 `12b8ae406b74b7cc56c8ff0d567bfae8a6b5ede446df736065c26626c209dfbd`. Its XML proves a `Prism` command with six named face outputs and `Net[d,openclose]`, plus numeric/button/boolean objects and 3D view/style records. It does not prove six rectangular faces, valid adjacency, an explicit hinge graph, shared timeline, staged reveal, or reset. Those items are `NEW_TEACHER_APPROVED_PATTERN` and must be mathematically specified independently.

The earlier `89.ggb` is excluded as rectangular-prism authority. Its confirmed SHA is `076c3c8fddc562c222d4c0cb69ec4f480c5edce5ebc83959abf0a92bb7e62913`; it is a curved-panel folding construction. Only its Rotate/visibility/slider/fill/background techniques may inform visual reference.

## 2. Mathematical model

Let `L,W,H > 0`. Use a right-handed world frame with the base face in `z=0`:

- `F0 = B(L,W)` is the fixed base, vertices `(0,0,0),(L,0,0),(L,W,0),(0,W,0)`.
- `F1 = front(L,H)`, `F2 = right(W,H)`, `F3 = back(L,H)`, `F4 = left(W,H)`, `F5 = top(L,W)`.
- Every face has four vertices, opposite sides equal, adjacent sides perpendicular, and dimensions exactly from `{L,W,H}`.
- Face IDs and edge IDs are stable and independent of display labels.
- `F0` is the stationary root face. At `t=0` all six faces form one valid planar net; at `t=1` the transformed faces form the closed rectangular prism with shared edges coincident and outward normals consistently oriented.

### Proposed net

Use the cross net rooted at `F0`: `F1` attached to the `y=0` edge, `F2` to `x=L`, `F3` to `y=W`, `F4` to `x=0`, and `F5` attached along the explicitly identified `A1→B1` edge of `F1` opposite `F0`. This gives the adjacency graph `{F0-F1,F0-F2,F0-F3,F0-F4,F1-F5}` and six distinct rectangles. The layout is a `NEW_TEACHER_APPROVED_PATTERN`; it is not claimed as evidence from 135.ggb.

### Endpoint proof obligation

At `t=0`, every face is planar in the net plane, with the declared shared edge endpoints equal. At `t=1`, each child is obtained by rigid rotation around its parent shared edge. Rigid rotation preserves four vertices, edge lengths, right angles, and face area. The hinge graph is a tree, so induction from `F0` proves each shared parent-child edge coincides at closure; the six oriented rectangles therefore form the intended rectangular prism. This proof is a design obligation to be checked independently of GeoGebra.

## 3. Face, edge, and hinge graph

Ordered vertex IDs are `A=(0,0,0)`, `B=(L,0,0)`, `C=(L,W,0)`,
`D=(0,W,0)`; `F1=(A,B,B1,A1)`, `F2=(B,C,C1,B1)`,
`F3=(C,D,D1,C1)`, `F4=(D,A,A1,D1)`, and `F5=(A1,B1,B2,A2)`.
`A1,B1,C1,D1,A2,B2` are existing face-model vertex IDs.

| Hinge | Parent → child | Edge endpoints | Axis | Direction | Target angle | Dependency | Visibility | Authority |
|---|---|---|---|---|---:|---|---|---|
| `H01` | `F0→F1` | `A→B`; child `A→B` | `L`; `L`; `d(A,B)=L=d(A,B)` | `(+1,0,0)` | `+π/2` RH | root `F0` | optional guide; helper hidden | `NEW_TEACHER_APPROVED_PATTERN` |
| `H02` | `F0→F2` | `B→C`; child `B→C` | `W`; `W`; `d(B,C)=W=d(B,C)` | `(0,+1,0)` | `+π/2` RH | root `F0` | same policy | `NEW_TEACHER_APPROVED_PATTERN` |
| `H03` | `F0→F3` | `C→D`; child `C→D` | `L`; `L`; `d(C,D)=L=d(C,D)` | `(-1,0,0)` | `+π/2` RH | root `F0` | same policy | `NEW_TEACHER_APPROVED_PATTERN` |
| `H04` | `F0→F4` | `D→A`; child `D→A` | `W`; `W`; `d(D,A)=W=d(D,A)` | `(0,-1,0)` | `+π/2` RH | root `F0` | same policy | `NEW_TEACHER_APPROVED_PATTERN` |
| `H15` | `F1→F5` | `A1→B1`; child `A2→B2` | `L`; `L`; `d(A1,B1)=L=d(A2,B2)` | `(+1,0,0)` in transformed `F1` frame | `+π/2` RH | after `F1` transform | same policy | `NEW_TEACHER_APPROVED_PATTERN` |

The expanded columns are, in order: parent endpoints; child endpoints;
parent length; child length; equality proof; directed axis; signed target.
The graph has six nodes and five edges `{H01,H02,H03,H04,H15}`; it is
connected and acyclic because every child has one parent rooted at `F0`.

The pedagogical hinge is a visible thin colored segment/arc only when the hinge checkbox is on. Helper axes are construction objects, hidden by default, and never the final visible edge. Construction objects may carry stable IDs; final edges must be derived from transformed face vertices and must not be duplicated by helper geometry.

## 4. Shared timeline and per-face functions

Use one clamped parameter `t = clamp(t_raw,0,1)`. `t=0` is fully open net; `t=1` is fully closed prism. A slider may move forward or backward; pause preserves the exact current `t`; reset sets `t=0` and restores the open camera.

Staged reveal is continuous and piecewise:

- `0 ≤ t ≤ 0.20`: net visible, labels/helpers available, no hinge motion.
- `0.20 < t ≤ 0.35`: reveal `H01…H04`; faces remain at net positions.
- `0.35 < t ≤ 0.85`: fold base children using `u=(t-0.35)/0.50`; use smoothstep `S(u)=u²(3-2u)`.
- `0.85 < t ≤ 1`: fold `F5` through its parent `F1` using `v=(t-0.85)/0.15`; keep all earlier transforms fixed and continuous.

For each face, `T_i^net` is its rectangular net transform. Axes use the
ordered endpoints in the hinge table and positive angles use the right-hand
rule. With `S(x)=x²(3-2x)`, the complete functions on `[0,1]` are:

```text
theta_1(t) = 0                      for 0≤t≤0.35
             (π/2)S((t-0.35)/0.50) for 0.35<t≤0.85
             π/2                    for 0.85<t≤1
theta_2(t) = 0                      for 0≤t≤0.35
             (π/2)S((t-0.35)/0.50) for 0.35<t≤0.85
             π/2                    for 0.85<t≤1
theta_3(t) = 0                      for 0≤t≤0.35
             (π/2)S((t-0.35)/0.50) for 0.35<t≤0.85
             π/2                    for 0.85<t≤1
theta_4(t) = 0                      for 0≤t≤0.35
             (π/2)S((t-0.35)/0.50) for 0.35<t≤0.85
             π/2                    for 0.85<t≤1
theta_5(t) = 0                      for 0≤t≤0.85
             (π/2)S((t-0.85)/0.15) for 0.85<t≤1
```

Thus no interval is undefined. At each boundary `b`, left limit, point
value, and right limit agree because `S(0)=0` and `S(1)=1`; hence
`lim(t→b-)theta_i(t)=theta_i(b)=lim(t→b+)theta_i(t)`. The transforms are:

- `T0(t)=T0^net`.
- `Ti(t)=T0(t) ∘ R_H0i_local(theta_i(t)) ∘ Ti^net` for `i=1..4`.
- `T5(t)=T1(t) ∘ R_H15_local(theta_5(t)) ∘ T5^local`.

Therefore H15 moves with `T1(t)` and is never a fixed global axis. Reverse
motion uses the same functions while decreasing `t`; no second clock exists.

At each piecewise boundary, the angle is zero or the prior endpoint angle, and `S(0)=0,S(1)=1`; therefore transforms are position-continuous. Derivative continuity is required within each smoothstep interval. Out-of-range slider values clamp. The dependency order is `F0 → F1…F4 → F5`.

At `t=0`, all angles are zero, so every face equals its net transform: all
faces are in the net plane and the cross layout has disjoint interiors.
At `t=1`, the symbolic target result is:

| Face | Plane | Outward normal | Dimensions |
|---|---|---|---|
| `F0` | `z=0` | `+z` | `L×W` |
| `F1` | `y=0` | `-y` | `L×H` |
| `F2` | `x=L` | `+x` | `W×H` |
| `F3` | `y=W` | `+y` | `L×H` |
| `F4` | `x=0` | `-x` | `W×H` |
| `F5` | `z=H` | `+z` | `L×W` |

The base is fixed; side faces are perpendicular to it; opposite side faces
are parallel; and F5 is parallel to and coincident with the opposite base
boundary. Hinge endpoint equalities plus rigid rotations give identical
coordinates for every paired edge. Hence there are no gaps, reflections, or
flipped faces, and the result is `[0,L]×[0,W]×[0,H]`.

## 5. State machine

| State | Entry | Visible objects | Interaction | Camera | Transition/reset |
|---|---|---|---|---|---|
| `RESET` | load/reset | net, labels optional; helpers hidden | slider enabled | open 2D/3D framing | → `NET_VISIBLE` |
| `NET_VISIBLE` | `t=0` | six net faces | drag slider, play | net overview | → `HINGES_REVEALED` when hinge toggle on |
| `HINGES_REVEALED` | reveal toggle | hinge guides visible | slider/play/pause | overview with hinge emphasis | → `FOLDING` when `t>0.35` |
| `FOLDING` | `0.35<t<1` | moving faces, optional labels | slider, play/pause, camera orbit | target-following 3D | → `FOLDED` at `t=1`; reverse → `REVERSE_UNFOLD` |
| `FOLDED` | `t=1` | closed prism, final edges | pause/camera/reset/reverse | closed prism view | → `REVERSE_UNFOLD` or `RESET` |
| `PAUSED` | pause action | freeze exact current visibility | slider/camera/reset | unchanged | resume or reset |
| `REVERSE_UNFOLD` | decreasing `t` | inverse staged motion | slider/play/pause | continuous | → `NET_VISIBLE` at `t=0` |

## 6. Interaction map

Controls: one slider `t`; play/pause; reset; label checkbox; helper/hinge checkbox. Camera orbit/pan/zoom is allowed and never changes mathematical state. Dragging faces, vertices, hinges, or helper axes is forbidden. No second animation parameter, hidden independent timer, or script branch may alter face transforms. Checkbox changes are visual-only and must not mutate geometry.

## 7. Visual specification

Use semantic face colors consistently between net and solid: `F0 #4F81BD`, `F1 #70AD47`, `F2 #ED7D31`, `F3 #A5A5A5`, `F4 #FFC000`, `F5 #4472C4`, with contrast checked before native implementation. Background is pastel `#BCD4E6` where compatible with the locked visual authority. Hinge guides use a high-contrast accent and thin stroke; helpers use dashed low-opacity neutral stroke and are hidden by default. Faces use consistent fill/opacity and edge thickness; points use one stable point size.

Labels are Text/LaTeX, object-anchored to face centroids or stable offset anchors, never floating screen coordinates. Collision avoidance requires non-overlap with labels, hinge guides, and edges; if collision occurs, use deterministic alternate anchors. Axes/grid are off unless needed to teach coordinates. The 2D viewport shows the net; the 3D viewport shows the prism and folding. Camera presets are stored for open, intermediate, and closed states; no native camera evidence exists yet.

## 8. Metadata contract

Store this specification as a versioned GeoGebra capability sidecar, not as a competing canonical IR. Required metadata fields: `moduleId=MST-07`; `goldenId=GOLDEN_RECTANGULAR_PRISM_FOLD`; `subject=Mathematics`; `gradeRange=6-8`; `topic=FOLD_UNFOLD_NETS`; `learningObjective=connect rectangular-prism net adjacency to rigid folding`; `constructionVersion=G1.0.0`; `authoritySources=[135.ggb partial, NA-MATH_GEOMETRY_FOLD_VISUAL_STANDARD_V1, NEW_TEACHER_APPROVED_PATTERN]`; `teacherApprovalStatus=APPROVE_HYBRID_G1_PATTERN`; `geoP1ToP11Status=DESIGN_MAPPING_ONLY`; `nativeValidationStatus=NOT_RUN_NEEDS_NATIVE_RUNTIME`; `exportReopenStatus=NOT_RUN_NEEDS_NATIVE_RUNTIME`.

The metadata is an adapter/capability record and must not duplicate or replace Canonical Document/Question/Math/Figure IR.

## 9. GEO-P1…P11 mapping

| Gate | Requirement | G1 design evidence | Corpus authority | New teacher-approved portion | Validation method | Current status |
|---|---|---|---|---|---|---|
| P1 | reference match | 135 Prism/Net and locked visual standard named | 135 partial | hybrid boundary | XML-to-spec trace | `PARTIAL` |
| P2 | construction | stable faces/edges/frames specified | 135 Prism/face outputs | six-rectangle model | mathematical model review | `PARTIAL` |
| P3 | dependency | hinge tree and parent order | 135 dependency evidence only partial | explicit graph | graph audit | `PARTIAL` |
| P4 | helper visibility | helper/hinge distinction and defaults | 135 style records | hidden-helper contract | object visibility test | `PARTIAL` |
| P5 | interaction | one `t`, play/pause/reset map | 135 numeric/button evidence only | shared timeline | native interaction test | `NOT_RUN_NEEDS_NATIVE_RUNTIME` |
| P6 | color/fill | semantic palette and consistent face mapping | 135 style records | six-face semantic mapping | native visual test | `PARTIAL` |
| P7 | line/point style | stroke/point rules | 135 style records | deterministic style contract | native visual test | `PARTIAL` |
| P8 | labels | Text/LaTeX anchors and collision rule | 135 text/style reference | label policy | native visual test | `PARTIAL` |
| P9 | viewport/background | open/intermediate/closed camera presets | 135 3D view/background records | pedagogical viewport | native reopen test | `NOT_RUN_NEEDS_NATIVE_RUNTIME` |
| P10 | pedagogy | state machine and observe-to-formalize flow | 135 only partial pedagogy evidence | approved hybrid interaction | teacher review | `NOT_RUN_NEEDS_NATIVE_RUNTIME` |
| P11 | native compatibility | no implementation yet | 135 native source reference | none until build | export/close/reopen/script preservation | `NOT_RUN_NEEDS_NATIVE_RUNTIME` |

No gate is `PASS_NATIVE` at G1.

## 10. Acceptance tests to run later

Specify, but do not run: mathematical endpoint test; adjacency test; hinge-axis test; timeline boundary test; continuity test; reverse-motion test; visibility test; reset test; label-overlap visual test; export test; close/reopen test; script/object preservation test. Each test must compare canonical mathematical expectations against the GeoGebra adapter output and record native reopen evidence.

## 11. G1 exit criteria and risks

G1 is complete as a design artifact only after this specification and its authority mapping are reviewed. It is not implementation approval. Remaining risks are native GeoGebra syntax/runtime compatibility, camera and label collision behavior, proof of exact rectangle adjacency in the generated artifact, and teacher visual acceptance. The smallest safe next step is independent audit of this G1 specification; only after that may a separately authorized implementation create a `.ggb`.
