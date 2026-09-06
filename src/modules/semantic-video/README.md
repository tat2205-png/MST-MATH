# MST-MATH Semantic Video Data + Output V1

Status: **DRAFT / PROPOSED / NON-DESTRUCTIVE**

Principles:

- **MATH SEMANTICS FIRST — MOTION SECOND**
- **AUTHOR ONCE — ANIMATE MANY — RENDER MANY**
- **Manim is a renderer, never the source of truth.**
- Existing `math-ir/v1` remains the semantic authority for mathematical entities, expressions, relations, constraints, scenes, and dynamic semantics.

## Why this module exists

`math-ir/v1` already models mathematical scenes and has generic animation hints. This module does **not** replace or mutate that contract. It adds the missing production boundary between verified mathematical data and output renderers:

```text
WORD / PDF / IMAGE / QUESTION BANK
                |
          ingest / normalize
                |
             Math IR
                |
       mathematical verification
                |
       solution / pedagogy plan
                |
              Visual IR
                |
             MotionIR
                |
          NarrationPlan
                |
            TimelineIR
                |
          RenderManifest
        /       |        \
     Manim     HTML     Slides
        |
 FFmpeg / compositor
        |
      Video QA
        |
       MP4
```

## Contracts

### MotionIR

MotionIR describes **why and what should move**, not the renderer API used to implement the movement.

P0 semantic primitives:

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

Example:

```ts
{
  id: "move-terms",
  primitive: "TRANSFORM_MATH",
  sourceSceneId: "linear-equation",
  semanticPurpose: "Preserve equation equivalence while moving terms.",
  pedagogicalIntent: "DERIVE",
  fromExpressionId: "eq-0",
  toExpressionId: "eq-1"
}
```

A Manim adapter may choose `TransformMatchingTex`, `ReplacementTransform`, or another suitable primitive. That choice is renderer implementation detail and must not leak back into MotionIR.

### NarrationPlan

Narration is independently addressable by cue ID. The same semantic content can therefore be re-timed or re-rendered without changing mathematics.

### TimelineIR

TimelineIR is synchronization authority for motion and narration. Every P0 motion instruction and narration cue must be scheduled exactly once. Invalid references, undeclared overlaps, negative timing, or fps mismatch fail closed.

### RenderManifest

The manifest binds:

- source `MathDocument` ID;
- MotionIR;
- NarrationPlan;
- TimelineIR;
- output profile;
- renderer target;
- LaTeX backend.

A deterministic canonical JSON representation and SHA-256 fingerprint are produced for golden/regression QA.

## Output profiles

| ID | Stage | Canvas | Purpose |
|---|---|---:|---|
| `V01_TEACHER_CLEAN_16_9` | P0 Demo | 1920x1080 @ 30 fps | TV, classroom, Classkick, YouTube |
| `V02_SOCIAL_MATH_9_16` | P0 Demo | 1080x1920 @ 30 fps | Short-form social math |
| `V03_TEACHER_OVERLAY` | P1 Pilot | 1920x1080 @ 30 fps | Teacher/camera overlay |

P0 deliberately keeps the profile set small. 3D, handwriting, and editor-specific post-production remain outside this contract.

## LaTeX backend

Default configuration uses `lualatex` for robust Unicode/Vietnamese text support, but the contract also supports `xelatex` and `pdflatex`. Rendering must fail closed when the selected backend/template fails; no renderer may silently substitute malformed math.

## Fail-closed validation

The validator checks at minimum:

- source Math IR validity;
- exact MathDocument identity;
- scene/entity/expression/relation references;
- required semantic fields for `TRANSFORM_MATH`, `CONSTRUCT`, `MOVE_POINT`, and `SHOW_RELATION`;
- narration completeness;
- timeline completeness and single scheduling;
- timeline overlap declaration;
- output dimensions, aspect ratio, and fps;
- LaTeX engine/template configuration.

## QA

Focused test:

```powershell
node --import tsx tests/test-semantic-video-data-output-v1.ts
```

Expected terminal seal:

```text
SEMANTIC_VIDEO_DATA_OUTPUT_V1_TESTS=PASS
```

Before promotion/merge, also run the repository's normal TypeScript/build/regression gates.

## Governance / compatibility

This module is additive and intentionally does not edit:

- `src/modules/math-ir/types.ts`;
- `math-ir/v1` schema version;
- geometry computation engines;
- existing Manim toolkit behavior;
- LuaDraw behavior;
- existing locked/canonical standards.

Any future change to a locked contract must follow the MST-MATH successor-version policy rather than mutating the locked version in place.
