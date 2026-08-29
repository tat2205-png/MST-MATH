# KNTT MATH SYSTEM UPDATE — V2.4

Status: PASS

## Canonical Symbol Registry
Locked:
`NA_MATH_KNTT_SYMBOL_STANDARD_V1_0`

## Resolver pipeline
SOURCE_MATH
→ SEMANTIC_PARSE
→ CANONICAL_SYMBOL_LOOKUP
→ GDPT2018_KNTT_NORMALIZATION
→ MATH_ENGINE_RENDER
→ SYMBOL_QA
→ OUTPUT

## Fail-closed rules
- Unknown math symbol → BLOCK_RENDER
- Raw Unicode math symbol → BLOCK_RENDER
- Plain-text math glyph → BLOCK_RENDER
- Ambiguous notation variant → REVIEW_REQUIRED
- Math Engine bypass → BLOCK_RENDER

## Fonts
- Body: Libertinus Serif
- Math: Libertinus Math
- UI/labels: Source Sans 3
- Vietnamese fallback: Noto Serif / Noto Sans

## Preserved
- Layout V1.3 byte-identical
- Geometry V2.2 rules preserved
- Math notation V2.3 rules preserved
