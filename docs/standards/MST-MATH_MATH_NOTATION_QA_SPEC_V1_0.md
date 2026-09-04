# MST-MATH Math Notation QA Spec V1.0

Status: **DRAFT / PROPOSED / REQUIRES HUMAN APPROVAL**  
Parent standard: `PIMATH-DNA-MATH-NOTATION-V1.0`

## QA objective

Prove that mathematical notation preserves meaning from semantic source to rendered artifact and, for video, to narration.

## Gate sequence

`SOURCE SEMANTICS → TOKEN VALIDATION → MATH IR VALIDATION → RENDER VALIDATION → POST-RENDER QA → NARRATION QA (video) → RELEASE GATE`

A release MUST fail when a required gate reports semantic loss.

## Required automated checks

### Registry integrity

- unique `symbolId`;
- unique canonical semantic mapping;
- non-empty canonical LaTeX;
- non-empty Vietnamese spoken form where TTS is supported;
- declared output support;
- aliases MUST NOT collide across different semantic IDs.

### Semantic distinction cases

At minimum, regression fixtures MUST distinguish:

- `∈` vs `∉`;
- `⊂` vs `⊆`;
- `<` vs `≤`;
- `>` vs `≥`;
- `=` vs `≠`;
- `⇒` vs `⇔`;
- `∥` vs `⟂`;
- `AB` vs `\vec{AB}` vs `\overrightarrow{AB}` when the source semantics differ;
- open vs closed interval endpoints;
- exponent/subscript presence vs absence.

### Renderer checks

For each golden case, validate all enabled target channels:

- PDF/LaTeX serialization;
- DOCX/OMML output;
- HTML math rendering;
- Slides equation rendering;
- Manim/video frame rendering;
- Vietnamese TTS mapping.

The automated layer SHOULD compare semantic IDs before/after conversion. Visual golden checks complement but do not replace semantic checks.

## Post-render visual QA

For image/video outputs, reject when any required notation is:

- clipped;
- occluded;
- too small to distinguish;
- missing a sign, arrow, bar, hat, exponent, subscript, bracket, parenthesis, or delimiter;
- visually substituted by another semantic token;
- rendered with insufficient contrast to read reliably.

## Narration QA

For video:

1. narration semantic IDs MUST match displayed semantic IDs;
2. relation direction MUST be preserved;
3. negation MUST be preserved;
4. set-inclusion strength MUST be preserved;
5. vector/geometry roles MUST not be dropped;
6. narration timing MUST correspond to the displayed expression.

## Failure policy

Severity `error` / release blocking:

- semantic token unknown where meaning is required;
- alias collision;
- renderer semantic loss;
- narration meaning mismatch;
- changed interval boundary;
- changed relation/operator identity;
- missing semantic modifier.

Severity `warning` only:

- approved stylistic difference that does not change mathematical meaning or pedagogical convention.

## Golden suite baseline

The V1.0 proposal SHALL include token-level golden cases covering every registry entry plus composed high-school expressions. The initial implementation may start with token-level validation, but V1.0 cannot transition to CANONICAL/LOCKED until cross-output regression coverage is demonstrated.
