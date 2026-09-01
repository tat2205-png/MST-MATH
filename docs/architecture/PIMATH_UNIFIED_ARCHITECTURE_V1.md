# PIMATH / MATH AI — Unified Architecture V1

## Identity

- Umbrella: PiMath / MATH AI
- Application: Math AI Studio
- Standards layer: NA-MATH

## Canonical pipeline

IMAGE / WORD / PDF
→ INGEST / PARSE / NORMALIZE
→ MATH + LOGIC + PEDAGOGY
→ STRUCTURED SOURCE
→ OUTPUT GENERATORS
→ QA
→ EXPORT

## Output families

- Lecture
- Worksheet
- Lesson Plan
- Teacher Plan
- Digital Competency
- GeoGebra 2D
- GeoGebra 3D
- Fold / Unfold
- Video
- Assessment: School / THPTQG / VSAT / SAT
- Games: Olympia / Crossword
- Language modes: VI / EN / Bilingual

## Authority invariants

- GDPT 2018 is the governing curriculum layer.
- KNTT is an instructional/content routing layer.
- Mathematical semantics precede rendering.
- Geometry Engine precedes GeoGebra / Three.js / Manim render adapters.
- Visual Pedagogy validates and plans; it does not create a competing design system.
- Locked NA-MATH standards remain immutable.
- Existing version axes must not be collapsed.

## Migration policy

V1 standardization is registry-first and non-destructive.

No bulk source moves are authorized until:
1. authority registry QA passes;
2. locked-standard QA passes;
3. regression passes;
4. each path migration has a bounded integration plan.
