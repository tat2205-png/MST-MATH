# MST-MATH OUTPUT VISUAL IDENTITY V1.0 — PROPOSAL

STATUS: DRAFT_FOR_HUMAN_APPROVAL for visual candidates.  
LOCKED POLICY: `MST_MATH_OUTPUT_CONTENT_PRESENTATION_POLICY_V1.0`.  
ROOT: `MST-MATH-DNA-V1.0`.

## 1. Governing model

`MST-MATH DNA → Output Profile → Locked Content Presentation Policy → Output Visual Profile → Assembly IR → Renderer → Pre-export QA → Artifact`

Renderers are consumers, not authorities.

## 2. Human-approved mandatory output rules

The product owner explicitly approved the following rules on 2026-09-05:

- Every document artifact is A4. Video is the exception; interactive-only surfaces are not page artifacts.
- Learning documents and video contain no MST-MATH promotion, no Math AI Studio promotion, no logo, no watermark, no marketing tagline and no promotional header/footer/intro/outro.
- Visible identity in learning artifacts is content-only: learning-content title, required learning content, mathematically necessary labels and the corresponding semantic icon.
- A math figure must remain wholly inside the visual ownership region of its question and answer/options block. It must not drift into the next question or unrelated content.
- Figures preserve aspect ratio; no distortion, unsafe crop, overlap with text/options/margins, blur, pixelation or page splitting.
- Vector is preferred. Raster used for print must retain at least 300 effective dpi and remain legible at final A4 size.
- If a question plus its primary figure does not fit safely, move the whole question to the next page before shrinking the figure to an unreadable size.
- Every A4 question-bearing document ends with an answer section covering all questions that require answers.
- No answer-bearing artifact may be exported until `ANSWER_QA_PASS`.

## 3. Required answer QA before export

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

## 4. Existing authorities retained

- `MST-MATH-DNA-V1.0`
- `NA_MATH_LAYOUT_V1_3`
- `NA_MATH_TYPOGRAPHY_STANDARD_V1_0`
- `NA_MATH_OUTPUT_COLOR_SYSTEM_V1_0`
- `MST-MATH-DNA-SEMANTIC-ICONS-V1.1`
- `NA_MATH_DESIGN_SYSTEM_V1_3`
- `MST_MATH_ACCESSIBILITY_CANONICAL_V1.0`
- `NA_MATH_SYSTEM_BASELINE_V2_6`
- `NA_MATH_GEOMETRY_RULES_V1_8_GEO8`

## 5. Visual candidates still requiring Golden Case / human visual approval

- `MST_MATH_OUTPUT_VISUAL_PROFILE_REGISTRY_V1.0`
- `MST_MATH_VIDEO_TYPE_SCALE_V1.0`
- `MST_MATH_GAME_VISUAL_SYSTEM_V1.0`
- `MST_MATH_BRAND_APPLICATION_POLICY_V1.0` for product UI only.

## 6. Output summary

- P01 Learning Material: A4, content-first, Deep Navy semantic identity, answers at end when questions are present.
- P02 Lesson Plan: A4 teacher document, content-first.
- P03 Worksheet: A4 writable student document; figures never overlap workspace.
- P04 Exercise Sheet: A4; keep question + primary figure together; answers at end.
- P05/P06 Test/Exam: A4; minimal formal composition; complete answer section at end; hard answer-QA gate.
- P07 Video: 16:9, no promotional branding; only learning title/content and relevant semantic icons.
- P08/P09: interactive geometry/fold surfaces follow existing geometry authority.
- P10 Game: classroom display; math readability first.
- P11/P12: interactive product surfaces; UI branding rules are separate from artifact rules.

## 7. Promotion blockers

Before the visual candidate registry is promoted to LOCKED/CANONICAL:

- remediate app pseudo-logo / brand hierarchy;
- remediate hard-coded UI colors;
- validate P07 video type scale;
- validate P10 classroom game visual system;
- enforce locked output policy in every renderer/export path;
- verify A4 figure-layout QA;
- enforce hard Answer QA before export.

## 8. Final rule

`CONTENT FIRST — MATHEMATICS VERIFIED — PEDAGOGY VERIFIED — FIGURE LEGIBLE — A4 DOCUMENTS — ANSWERS AT END — NO PROMOTIONAL BRANDING`
