# MST-MATH Semantic Icon System V1.1

Status: **LOCKED / CANONICAL / APPROVED / HUMAN-APPROVED**  
Machine standard ID: `MST-MATH-DNA-SEMANTIC-ICONS-V1.1`  
Product display name: `MST-MATH`  
Migrated from: `PIMATH-DNA-SEMANTIC-ICONS-V1.1` (compatibility/history only)  

## Decision
MST-MATH uses **one semantic icon authority for every renderer**.

> AUTHOR ONCE — RENDER MANY — SAME ICON SEMANTICS

A semantic role resolves to the same canonical SVG master asset across PDF, DOCX, HTML, Slides, and Video. Renderer adapters may change transport/embedding only; they may not substitute icon identity.

## Canonical roles
`LEARNING_OBJECTIVE`, `CONCEPT`, `DEFINITION`, `FORMULA`, `EXAMPLE`, `NOTE`, `IMPORTANT`, `WARNING`, `TIP`, `QUESTION`, `EXERCISE`, `SOLUTION`, `ANSWER`, `GEOMETRY`, `GRAPH`, `TABLE`, `ACTIVITY`.

Compatibility roles `QUESTION_SOURCE`, `SOLUTION_REASONING`, `GEOMETRY_FIGURE`, and `RESULT_SUCCESS` remain semantically bound to the core roles.

## Visual DNA
- master format SVG; viewBox `0 0 24 24`; minimal academic line; stroke `1.55`;
- `currentColor`; monochrome/grayscale safe;
- no gradients, emoji, 3D iconography, or independent palette;
- icons are semantic navigation aids, not decoration.

## Governance
1. No module may define a competing canonical icon set.
2. No renderer may silently substitute an unregistered icon.
3. Missing roles fail closed.
4. Color inherits canonical semantic context.
5. New semantic roles require an explicit successor/amendment.
6. PiMath machine IDs and old asset paths are compatibility/history only after `MST_MATH_CANONICAL_ID_MIGRATION_V1`.
7. P01 learning material and P07 video consume this same MST-MATH authority.

## Canonical source
Machine-readable authority: `registry/mst-math-dna-icons-v1.1.json`.

SVG masters: `assets/mst-math-icons/`.
