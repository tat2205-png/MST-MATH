# MST-MATH Semantic Icon System V1.1

Status: **LOCKED / CANONICAL / APPROVED / HUMAN-APPROVED**  
Machine standard ID: `PIMATH-DNA-SEMANTIC-ICONS-V1.1`  
Product display name: `MST-MATH`  
Supersedes: `PIMATH-DNA-SEMANTIC-ICONS-V1.0`  
Compatibility rule: existing `PIMATH-*` canonical machine IDs are preserved during the MST-MATH brand migration.

## Decision

MST-MATH uses **one semantic icon authority for every renderer**.

> AUTHOR ONCE — RENDER MANY — SAME ICON SEMANTICS

A semantic role must resolve to the same canonical SVG master asset whether the content is rendered to PDF, DOCX, HTML, Slides, or Video. A renderer may adapt transport/embedding format, but it must not substitute a different icon identity.

## Canonical roles

The V1.1 core contains these semantic roles:

`LEARNING_OBJECTIVE`, `CONCEPT`, `DEFINITION`, `FORMULA`, `EXAMPLE`, `NOTE`, `IMPORTANT`, `WARNING`, `TIP`, `QUESTION`, `EXERCISE`, `SOLUTION`, `ANSWER`, `GEOMETRY`, `GRAPH`, `TABLE`, `ACTIVITY`.

The legacy V1.0 runtime roles `QUESTION_SOURCE`, `SOLUTION_REASONING`, `GEOMETRY_FIGURE`, and `RESULT_SUCCESS` remain valid compatibility roles and are semantically bound to the V1.1 core.

## Visual DNA

- master format: SVG;
- viewBox: `0 0 24 24`;
- family: minimal academic line;
- default stroke width: `1.55`;
- round caps and joins;
- `currentColor` inheritance;
- monochrome/grayscale safe;
- no gradients, emoji, 3D iconography, or independent icon palette;
- icons are semantic navigation aids, not decoration.

## Renderer contract

### PDF

Use vector SVG-to-PDF adaptation. Raster fallback is permitted only when deterministically derived from the canonical SVG master.

### DOCX

Embed the canonical SVG when supported. Compatibility PNG must be generated from that same SVG master; a manually substituted image is forbidden.

### HTML

Use inline SVG or an SVG image reference from the canonical asset.

### Slides

Use the canonical SVG as vector artwork. Raster fallback must be derived from the same SVG master.

### Video

Use the same SVG identity. Motion is only a wrapper around the icon. Allowed intro motion is restrained fade, short slide, or scale from 0.96 to 1.0. Spinning, bouncing, decorative loops, morphing into a different icon, or replacing the icon with a renderer-local graphic is forbidden.

## Component binding

The existing NA Math design-system component icon names such as `target`, `sparkles`, `book-open-check`, `triangle-alert`, and `lightbulb` are **compatibility aliases only**. They do not constitute a parallel icon authority. Runtime resolution is:

`component kind → semantic role → canonical SVG master → renderer adapter`.

Examples:

- `learning-objective` → `LEARNING_OBJECTIVE`;
- `worked-example` → `EXAMPLE`;
- `common-mistake` → `WARNING`;
- `math-formula-card` → `FORMULA`;
- `geometry-figure-card` → `GEOMETRY`;
- `solution-steps` → `SOLUTION`;
- `final-answer` → `ANSWER`.

## Governance

1. No module may define a competing canonical icon set.
2. No renderer may silently substitute an unregistered icon.
3. Missing roles fail closed.
4. Color is inherited from canonical semantic context; icons own no palette.
5. New semantic roles require an explicit successor/amendment to this authority.
6. Existing locked V1.0 assets remain immutable history/compatibility sources.
7. P01 learning material and P07 video both consume this same authority.

## Canonical source

Machine-readable authority: `registry/pimath-dna-icons-v1.1.json`.

SVG masters: `assets/pimath-icons/`.
