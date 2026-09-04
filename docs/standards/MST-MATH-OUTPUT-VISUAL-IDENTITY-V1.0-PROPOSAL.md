# MST-MATH OUTPUT VISUAL IDENTITY V1.0 — PROPOSAL

STATUS: DRAFT_FOR_HUMAN_APPROVAL for visual candidates.  
LOCKED POLICY: `MST_MATH_OUTPUT_CONTENT_PRESENTATION_POLICY_V1.1`.  
SUPERSEDES: `MST_MATH_OUTPUT_CONTENT_PRESENTATION_POLICY_V1.0`.  
ROOT: `MST-MATH-DNA-V1.0`.

## 1. Governing model

`MST-MATH DNA → Output Profile → Locked Content Presentation Policy → Output Visual Profile → Assembly IR → Renderer → Pre-export QA → Artifact`

Renderers are consumers, not authorities.

## 2. Human-approved mandatory output rules

The product owner explicitly approved the following rules on 2026-09-05:

- Every document artifact is A4. Video is the exception; interactive-only surfaces are not page artifacts.
- Learning documents and video contain no MST-MATH promotion, no Math AI Studio promotion, no logo, no watermark, no marketing tagline and no promotional header/footer/intro/outro.
- Visible identity in learning artifacts is content-only: learning-content title, required learning content, mathematically necessary labels, page number and the corresponding semantic icon.
- A math figure must remain wholly inside the visual ownership region of its question and answer/options block. It must not drift into the next question or unrelated content.
- Figures preserve aspect ratio; no distortion, unsafe crop, overlap with text/options/workspace/margins, blur, pixelation or page splitting.
- Vector is preferred. Raster used for print must retain at least 300 effective dpi and remain legible at final A4 size.
- If a question plus its primary figure does not fit safely, move the whole question to the next page before shrinking the figure to an unreadable size.
- Every A4 question-bearing document ends with an answer section covering all questions that require answers.
- No answer-bearing artifact may be exported until `ANSWER_QA_PASS`.
- Every A4 page shows an Arabic page number at bottom center, including first page and answer pages; no promotional footer accompanies it.

## 3. Pedagogical reflow / question reordering

P01 Learning Material, P03 Worksheet, P07 Video and P11 Digital AI Lesson may reorder independent questions/examples to reduce meaningless whitespace, but page filling is always a lower priority than pedagogy and mathematical dependency.

Allowed only when:

- the questions belong to the same pedagogical cluster or equivalent learning role;
- prerequisite/dependency relations remain valid;
- concept precedes its first required application;
- intended scaffolding and difficulty progression are preserved;
- shared stem/subquestions remain together;
- scenario continuity and references to previous results remain valid;
- source IDs/provenance are preserved and rendered numbering is regenerated consistently.

Forbidden when reordering would:

- cross a dependency edge;
- reveal a result or method too early;
- break discovery → formalization → practice → application flow;
- split a shared-stem group;
- remove intentional writing space merely to increase density.

`Student writing space`, `figure clearance`, `section separation` and an intentional pedagogical pause are meaningful space, not meaningless whitespace.

## 4. Student ruled workspace — P01 and P03

Every question in P01 Learning Material and P03 Worksheet receives question-owned ruled writing space, including multiple-choice questions.

Standard:

- notebook-like ruled lines;
- line pitch: `7.0 mm ± 0.5 mm`;
- thin print-safe line: approx. `0.35 pt`;
- no decorative grid and no long workspace label;
- semantic icon marker only when needed;
- workspace remains adjacent to or clearly owned by its question;
- figure and workspace never overlap;
- where suitable for figure questions: ruled workspace left, figure right.

Minimum ruled rows:

- Multiple Choice: 2 rows;
- True/False: 3 rows;
- Short Answer: 4 rows;
- Constructed Response: 6 rows;
- Open Investigation: 8 rows.

Rows may increase for multi-step calculation, geometry reasoning, graph/table analysis, real-world modeling or justification. They may never be reduced below the minimum merely to fill the page.

## 5. Required answer QA before export

The system must challenge the answer/key rather than merely copy it. Required checks include:

- source fidelity;
- mathematical correctness;
- logical validity;
- domain/boundary correctness;
- numeric correctness;
- units/dimensions;
- geometry invariants;
- answer-to-question alignment;
- option-key alignment;
- pedagogical appropriateness;
- curriculum appropriateness;
- real-world assumption and result plausibility when applicable.

MCQ must verify that the key agrees with the computed/proved result and that distractors do not accidentally create multiple correct answers. True/False checks each statement independently. Short-answer checks accepted equivalent forms, rounding and units when specified.

Any correctness-affecting `FAIL`, `NEED_MORE_INFORMATION` or warning blocks export.

## 6. Existing authorities retained

- `MST-MATH-DNA-V1.0`
- `NA_MATH_LAYOUT_V1_3`
- `NA_MATH_TYPOGRAPHY_STANDARD_V1_0`
- `NA_MATH_OUTPUT_COLOR_SYSTEM_V1_0`
- `MST-MATH-DNA-SEMANTIC-ICONS-V1.1`
- `NA_MATH_DESIGN_SYSTEM_V1_3`
- `MST_MATH_ACCESSIBILITY_CANONICAL_V1.0`
- `NA_MATH_SYSTEM_BASELINE_V2_6`
- `NA_MATH_GEOMETRY_RULES_V1_8_GEO8`

## 7. Visual candidates still requiring Golden Case / human visual approval

- `MST_MATH_OUTPUT_VISUAL_PROFILE_REGISTRY_V1.0`
- `MST_MATH_VIDEO_TYPE_SCALE_V1.0`
- `MST_MATH_GAME_VISUAL_SYSTEM_V1.0`
- `MST_MATH_BRAND_APPLICATION_POLICY_V1.0` for product UI only.

## 8. Output summary

- P01 Learning Material: A4; adaptive ruled notes for every question; pedagogically safe reorder; page number bottom center; answers at end.
- P02 Lesson Plan: A4 teacher document; page number bottom center.
- P03 Worksheet: A4 writable student document; adaptive ruled notes for every question; pedagogically safe reorder; figures never overlap workspace; page number bottom center.
- P04 Exercise Sheet: A4; keep question + primary figure together; page number bottom center; answers at end.
- P05/P06 Test/Exam: A4; minimal formal composition; page number bottom center; complete answer section at end; hard answer-QA gate.
- P07 Video: 16:9, no promotional branding; pedagogically safe question/example reorder only; no reordering that breaks one-focus-per-scene.
- P08/P09: interactive geometry/fold surfaces follow existing geometry authority.
- P10 Game: classroom display; math readability first.
- P11: interactive learning surface; pedagogically safe reorder only.
- P12: product UI; UI branding rules are separate from artifact rules.

## 9. Promotion blockers

Before the visual candidate registry is promoted to LOCKED/CANONICAL:

- remediate app pseudo-logo / brand hierarchy;
- remediate hard-coded UI colors;
- validate P07 video type scale;
- validate P10 classroom game visual system;
- enforce locked output policy V1.1 in every renderer/export path;
- verify A4 figure-layout QA;
- enforce hard Answer QA before export;
- implement dependency-aware pedagogical reflow;
- implement P01/P03 ruled workspace with minimum row guarantees;
- implement bottom-center page numbering in every A4 renderer.

## 10. Final rule

`CONTENT FIRST — MATHEMATICS VERIFIED — PEDAGOGY VERIFIED — FLOW PRESERVED — FIGURE LEGIBLE — STUDENT WRITING SPACE PRESERVED — A4 DOCUMENTS — PAGE NUMBERED — ANSWERS AT END — NO PROMOTIONAL BRANDING`
