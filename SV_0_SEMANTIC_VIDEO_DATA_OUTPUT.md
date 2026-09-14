# SV-0 — MST-MATH Semantic Video Data + Output V1

## Status

`DRAFT / PROPOSED / NON-DESTRUCTIVE`

Implementation branch: `feat/semantic-video-data-output-v1`

## Decision

MST-MATH video production adopts the following architecture boundary:

```text
INPUT -> canonical Math IR -> verification -> solution/pedagogy -> visual requirements
      -> MotionIR -> NarrationPlan -> TimelineIR -> RenderManifest
      -> renderer adapters (Manim / HTML / Slides) -> compositor -> QA -> output
```

Governing principles:

> **MATH SEMANTICS FIRST — MOTION SECOND**

> **AUTHOR ONCE — ANIMATE MANY — RENDER MANY**

> **MANIM IS A RENDERER, NOT THE SOURCE OF TRUTH**

## Existing authority reused

Repository inspection confirmed that `src/modules/math-ir` already supplies:

- `math-ir/v1` schema authority;
- stable entity and expression IDs;
- `MathScene`;
- relations and constraints;
- dynamic semantic dependencies/events/case transitions;
- renderer-generic `MathAnimation` hints;
- deterministic validation and serialization.

SV-0 therefore does **not** create a competing mathematical core and does not bump or mutate `math-ir/v1`.

## Gap closed by SV-0

The existing generic animation contract does not express enough production semantics to make educational video output deterministic across renderers. SV-0 adds a layer after Math IR that carries:

1. **MotionIR** — pedagogical/semantic motion intent;
2. **NarrationPlan** — separately addressable narration cues;
3. **TimelineIR** — timing authority linking motion and narration;
4. **OutputProfile** — deterministic canvas/fps/layout target;
5. **RenderManifest** — renderer-facing immutable production contract;
6. **fail-closed validation** — rejects missing/wrong references and incomplete schedules;
7. **canonical serialization + SHA-256 fingerprint** — golden/regression identity.

## P0 Motion primitives

- `REVEAL`
- `HIDE`
- `HIGHLIGHT`
- `TRANSFORM_MATH`
- `CONSTRUCT`
- `MOVE_POINT`
- `TRACE`
- `COMPARE`
- `FOCUS_CAMERA`
- `SHOW_RELATION`
- `SHOW_STEP`
- `PAUSE_FOR_THINK`
- `REVEAL_ANSWER`

These are semantic primitives. Manim-specific operations such as `Write`, `Create`, `FadeIn`, `TransformMatchingTex`, camera calls, and similar APIs remain renderer-adapter choices.

## Output profiles

### P0 / Demo

- `V01_TEACHER_CLEAN_16_9`: 1920x1080, 30 fps.
- `V02_SOCIAL_MATH_9_16`: 1080x1920, 30 fps.

### P1 / Pilot

- `V03_TEACHER_OVERLAY`: 1920x1080, 30 fps.

Advanced 3D, handwriting recognition, and external editor/coding-agent dependencies are deliberately outside P0.

## LaTeX

The video contract uses a configurable LaTeX backend. Default is LuaLaTeX for Unicode/Vietnamese support, with XeLaTeX and pdfLaTeX available by explicit configuration. Rendering must fail closed on LaTeX/template failure; malformed math must never be silently substituted.

## Validation gates

SV-0 rejects output when any of the following is invalid:

- source Math IR;
- MathDocument identity;
- source scene;
- entity/expression/relation references;
- semantic requirements of a motion primitive;
- narration cue content/timing;
- missing, repeated, or invalid timeline scheduling;
- undeclared timeline overlap;
- dimensions/aspect ratio/fps;
- LaTeX backend/template.

## Files added

```text
src/modules/semantic-video/types.ts
src/modules/semantic-video/outputProfiles.ts
src/modules/semantic-video/validation.ts
src/modules/semantic-video/serialization.ts
src/modules/semantic-video/compiler.ts
src/modules/semantic-video/index.ts
src/modules/semantic-video/README.md
tests/test-semantic-video-data-output-v1.ts
SV_0_SEMANTIC_VIDEO_DATA_OUTPUT.md
```

## Focused QA command

```powershell
node --import tsx tests/test-semantic-video-data-output-v1.ts
```

Expected seal:

```text
SEMANTIC_VIDEO_DATA_OUTPUT_V1_TESTS=PASS
```

Full repository TypeScript/build/regression gates remain mandatory before promotion.

## Compatibility declaration

```text
MATH_IR_SCHEMA_CHANGED=NO
MATH_IR_AUTHORITY_REPLACED=NO
GEOMETRY_ENGINE_CHANGED=NO
MANIM_TOOLKIT_CHANGED=NO
LUADRAW_CHANGED=NO
LOCKED_CANONICAL_FILE_OVERWRITTEN=NO
NEW_COMPETING_MATH_CORE=NO
RENDERER_SPECIFIC_API_IN_MOTION_IR=NO
```

## Promotion rule

SV-0 remains `DRAFT / PROPOSED` until focused QA and the repository regression gates pass and human review approves promotion. If promoted later, follow the MST-MATH successor-version governance; do not mutate locked versions in place.
