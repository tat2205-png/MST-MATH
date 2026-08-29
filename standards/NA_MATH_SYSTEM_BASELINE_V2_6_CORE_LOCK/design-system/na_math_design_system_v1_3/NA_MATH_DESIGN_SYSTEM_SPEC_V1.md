# NA-MATH-DESIGN-SYSTEM V1.3

## 1. Scope
Baseline design system for Math AI Studio outputs:
1. Tài liệu học tập
2. Phiếu học tập
3. Phiếu bài tập
4. Video bài giảng

## 2. Design principles
- Modern, minimal, scientific, calm, readable.
- Inspired by contemporary US/Canada mathematics textbooks in visual hierarchy, whitespace, modularity, and iconography.
- Mathematical notation follows Vietnamese GDPT 2018 and SGK Kết nối tri thức.
- Visual style never overrides mathematical correctness.
- 2D and 3D figures preserve mathematical relations.
- No text/label/figure collision.
- Same brand language across print and video.

## 3. Brand system
Primary: deep navy
Secondary: teal
Neutral: warm white / cool gray
Functional accent: amber for notes, purple for extension, blue/teal for learning content.

## 4. Typography
Body: Libertinus Serif
Math: Libertinus Math
UI/labels: Source Sans 3
Vietnamese fallback: Noto Serif / Noto Sans
Avoid low-contrast gray text and browser-dependent math glyphs.

## 5. Core semantic components
- Khởi động
- Khám phá
- Hình thành kiến thức
- Định nghĩa
- Định lí
- Tính chất
- Công thức
- Ví dụ
- Chú ý
- Ghi nhớ
- Luyện tập
- Vận dụng
- Bài tập
- Câu hỏi
- Hướng dẫn giải
- Kết luận

Each component has:
icon + semantic color + title hierarchy + container style + spacing rules.

## 6. Layout families
### 6.1 Tài liệu học tập
- A4 portrait
- Large chapter/lesson hierarchy
- 65–75% main content, 25–35% visual/support content
- Strong learning blocks, examples, notes, summaries

### 6.2 Phiếu học tập
- A4 portrait
- Writable spaces are first-class layout objects
- Clear task flow: Khởi động → Khám phá → Hình thành kiến thức → Luyện tập → Vận dụng
- High whitespace, moderate density

### 6.3 Phiếu bài tập
- A4 portrait
- Higher density than worksheet
- Clear levels: Nhận biết / Thông hiểu / Vận dụng / Vận dụng cao
- Compact but readable

### 6.4 Video 16:9
- Top problem bar: 18–22% height
- Bottom region split ~58% solution / 42% figure
- Same semantic icons, colors, typography hierarchy
- Safe margin and collision-free math

## 7. Mathematical notation policy
- Use Vietnamese textbook notation.
- Coordinates use semicolons where SGK convention requires: A(x_0;y_0;z_0)
- Plane notation: (P), (Q), (α)
- Vectors: \vec{a}, \overrightarrow{AB}
- Perpendicular: \perp
- Parallel: \parallel
- Membership: \in, \notin
- No Unicode substitutions for mathematical formulas in production.
- Production rendering must use LaTeX/MathML/OMML/SVG depending on target.

## 8. Geometry style
### 8.1 2D
- Primary edges solid and clear
- Construction lines thinner/lighter
- Labels auto-offset
- Angle/right-angle/equality/parallel markers standardized
- No misleading distortions

### 8.2 3D
- Visible edges solid
- Hidden edges dashed only when truly hidden
- Plane fills low-opacity
- Perspective chosen for interpretability, not decoration
- Perpendicular foot and spatial relationships explicit
- Skew lines must be represented so non-coplanarity is visually understandable
- Parallel planes must be visually consistent and lines on them must not be drawn misleadingly parallel unless mathematically parallel

## 9. QA gates
- Typography QA
- Math notation QA
- Collision QA
- Overflow QA
- Brand consistency QA
- Geometry relation QA
- Hidden-edge QA
- Label placement QA
- Video safe-zone QA
- Asset integrity QA

## 10. Release acceptance
The same mathematical content must render consistently across all 4 layout families and pass all QA gates.


## 11. Extended Component Library (V1.1)

### 11.1 Learning Objective
Purpose: state what students should know/do after the section.
Structure: icon + title + 1–3 concise objectives.
Default tone: blue.
Use in: document, worksheet, video intro.

### 11.2 Key Idea
Purpose: emphasize conceptual essence rather than memorization.
Structure: icon + short statement + optional formula.
Default tone: teal.
Use in: document, video.

### 11.3 Worked Example
Purpose: model complete mathematical reasoning.
Fixed semantic structure:
Problem → Analysis → Guidance → Detailed Solution → Conclusion.
Default tone: green.
Use in: document, worksheet, video.

### 11.4 Try It
Purpose: immediate low-stakes practice after an example.
Structure: prompt + compact workspace / revealable answer.
Default tone: blue.
Use in: worksheet, document.

### 11.5 Common Mistake
Purpose: warn about frequent conceptual or notation errors.
Structure: warning icon + incorrect pattern + correction.
Default tone: amber.
Must never use alarming red unless safety-critical.

### 11.6 Hint
Purpose: scaffold without revealing the complete solution.
Structure: icon + one concise cue.
Default tone: teal.
Supports collapsed/reveal behavior in interactive outputs.

### 11.7 Checkpoint
Purpose: quick formative check after a concept.
Structure: 1–3 short questions.
Default tone: purple.
Use in: document, worksheet, video pause.

### 11.8 Summary
Purpose: close a lesson/section with essential knowledge.
Structure: key facts + formulas + conditions + common cautions.
Default tone: navy.

### 11.9 Math Formula Card
Purpose: present a formula with meaning and conditions.
Structure:
Formula → Conditions → Symbol meanings → When to use.
Math must be rendered by the production math engine, never plain Unicode substitutes.

### 11.10 Geometry Figure Card
Purpose: present a 2D/3D figure as a first-class semantic object.
Structure:
Figure → Caption → Named relations → Optional construction steps → QA status.
Must pass geometry, hidden-edge, and label-collision QA.

### 11.11 Solution Steps
Purpose: reusable step-by-step solution component.
Structure:
Step number → reasoning → transformation → optional figure cue.
Shared across document and video.

### 11.12 Final Answer
Purpose: clearly expose the final result without excessive visual weight.
Structure: conclusion label + exact mathematical result.
Default tone: green.


## 12. Advanced Pedagogical Components (V1.2)

### 12.1 Prerequisite / Kiến thức cần nhớ
Purpose: recall prerequisite knowledge before a new concept.
Structure:
- icon + title
- 2–5 prerequisite facts
- optional mini-check
Default tone: blue.
Use in: document, worksheet, video intro.

### 12.2 Concept Map / Sơ đồ kiến thức
Purpose: show the conceptual structure and relationships within a lesson.
Structure:
- central concept
- related concepts
- directional or relational connectors
- optional hierarchy levels
Default tone: teal.
Use in: document, worksheet summary, video overview.
Must remain readable and avoid decorative complexity.

### 12.3 Compare / So sánh – Phân biệt
Purpose: prevent confusion between closely related concepts.
Structure:
- two or more concepts
- comparison dimensions
- similarities
- differences
- optional deciding rule
Default tone: purple.
Use in: document, worksheet, video.

### 12.4 Strategy / Chiến lược giải
Purpose: teach recognition and method selection before detailed solving.
Structure:
- recognition cues
- decision rule
- preferred method
- common traps
Default tone: teal.
Use in: document, worksheet, video.
Must not duplicate detailed solution steps.

### 12.5 Proof / Chứng minh
Purpose: provide a dedicated formal reasoning component.
Structure:
- Giả thiết
- Kết luận / Cần chứng minh
- Lập luận
- Kết luận chứng minh
Default tone: blue.
Use in: document, worksheet, assessment solutions, video.
Must preserve SGK/GDPT 2018 notation and logical order.

### 12.6 Real-world Connection / Kết nối thực tế
Purpose: connect mathematics to authentic phenomena, data, or practical problems.
Structure:
- context
- quantities
- mathematical relationship/model
- question
- interpretation
Default tone: green.
Use in: document, worksheet, assessment, video.
Rule: start from a real phenomenon/data/problem, not a story invented merely to fit a formula.

### 12.7 Focus / Đang xét
Purpose: visually identify the exact mathematical object currently being discussed.
Structure:
- compact label
- target object(s)
- optional synchronized highlight cue
Default tone: teal.
Use primarily in: video and interactive views.
Must not cover labels, formulas, or geometric relations.

## 13. V1.2 component governance
- Every component must have a pedagogical role.
- Components are not decorative cards.
- Similar components must not duplicate semantic purpose.
- The same semantic component must preserve identity across Document / Worksheet / Assessment / Video.
- Geometry-bearing components require Geometry QA.
- Formula-bearing components require production Math Renderer.


## 14. Deterministic 3D Geometry Standard (V1.3)

### 14.1 Core rule
Geometry-first → projection-second → visibility-third → labels-fourth → styling-last.

No 3D mathematical figure may be generated from free-form visual approximation alone.

### 14.2 Representation model
Every 3D figure must originate from a semantic geometric model:
- points
- lines
- segments
- planes
- faces
- solids
- incidence relations
- parallel relations
- perpendicular relations
- coplanarity
- intersection relations
- midpoint / projection / foot relations
- construction dependencies

### 14.3 Projection policy
Default textbook representation for school geometry:
- parallel projection / affine-style schematic projection
- no arbitrary perspective distortion for core mathematical figures
- corresponding parallel edges remain parallel in the drawing
- collinearity is preserved
- incidence is preserved
- ratios on the same line or on parallel lines are preserved when required by the construction

### 14.4 Prism policy
For prism ABC.A'B'C':
- AA' ∥ BB' ∥ CC'
- AB ∥ A'B'
- BC ∥ B'C'
- CA ∥ C'A'
- both bases must correspond consistently
- hidden edges are determined from viewpoint/visibility, not manually guessed

### 14.5 Rectangular box / parallelepiped policy
For ABCD.A'B'C'D':
- ABCD and A'B'C'D' are corresponding parallelograms in the projected representation
- AA' ∥ BB' ∥ CC' ∥ DD'
- AB ∥ CD ∥ A'B' ∥ C'D'
- AD ∥ BC ∥ A'D' ∥ B'C'
- hidden edges must be computed consistently from the selected view

### 14.6 Pyramid policy
For pyramid S.ABCD:
- base vertices preserve cyclic order
- side edges join S to each base vertex
- hidden base edges and hidden side edges depend on viewpoint
- altitude / projection feet are only drawn if they are part of the mathematical construction
- right-angle markers are attached to the actual perpendicular relation, not placed decoratively

### 14.7 Skew lines policy
Two lines a and b are represented as skew only if the semantic model verifies:
- no intersection
- not parallel
- not coplanar

Preferred representations:
1. choose two verified skew edges/lines in a known solid
2. one line in a plane, the other line outside that plane
3. lines lying in two parallel planes, provided the model verifies they are not parallel

The 2D projection must not imply a false intersection. If projected traces cross visually while the 3D lines do not intersect, use depth/visibility cues or alternate projection.

### 14.8 Parallel planes policy
For (P) ∥ (Q):
- both planes use the same projected orientation family
- corresponding directions are parallel
- separation is visually clear
- any line a ⊂ (P), b ⊂ (Q) must respect their actual 3D relation
- do not draw a and b with misleading equal slope if they are meant to be skew

### 14.9 Visible / hidden edge policy
- visible edge: solid
- hidden edge: dashed
- partially hidden edge: split into visible and hidden segments if necessary
- do not mark an edge hidden merely because it is "toward the back"
- face transparency must not override topological visibility logic

### 14.10 Label placement policy
Labels are placed after projection and visibility resolution.
Required:
- no label-label overlap
- no label-edge overlap unless intentionally attached
- no label-point overlap
- preserve clear association with the intended object
- use directional offset candidates
- use leader line only when needed
- never obscure right-angle, parallel, equality, or incidence markers

### 14.11 Circle / surface policy
- projected circles may appear as ellipses under oblique parallel projection
- cylinder, cone, frustum must preserve axis/base relationships
- axis, radius, height, generatrix are semantic objects
- hidden arcs use dashed convention where appropriate

### 14.12 3D Geometry QA gates
A 3D figure cannot be published unless all required checks pass:
- GEOMETRY_RELATION_QA
- PROJECTION_CONSISTENCY_QA
- VISIBILITY_QA
- HIDDEN_EDGE_QA
- LABEL_COLLISION_QA
- SYMBOL_PLACEMENT_QA
- TOPOLOGY_QA
- SGK_NOTATION_QA

### 14.13 Rendering responsibility
Core mathematical 3D figures must be produced by deterministic geometry engines
(e.g. NA Math Visual Engine / GeoGebra bridge / LuaDraw / TikZ / Manim geometry),
not by unconstrained image generation.

Image generation may be used only for non-mathematical decorative context or real-world illustration,
never as the source of truth for exact geometric relations.
