# MST-MATH INPUT V1 — Human Acceptance Checklist

Machine Acceptance: PASS

Human Acceptance is not automatic.

Change each completed checkbox from:

- [ ]

to:

- [x]

Save this file before typing ACCEPT_INPUT_V1 in PowerShell.

## A. Word

- [ ] 01-word-text: Vietnamese text and paragraph order match the source.
- [ ] 02-word-omml-successor: OMML formulas preserve mathematical meaning.
- [ ] 03-word-mathtype: MathType equations preserve mathematical meaning.
- [ ] 05-word-real-figure: figures remain associated with correct content.

## B. PDF Digital

- [ ] 06-pdf-digital: text, mathematics, figures, and structure are correct.

## C. PDF Scanned

Inspect at least pages:

1, 2, 25, 50, 75, 100, 124, 125.

- [ ] 07-pdf-scanned: representative pages preserve readable text.
- [ ] 07-pdf-scanned: mathematical expressions are semantically correct.
- [ ] 07-pdf-scanned: diagrams/figures are preserved appropriately.
- [ ] 07-pdf-scanned: Unicode characters are not corrupted.

## D. PDF Hybrid

Inspect at least pages:

1, 2, 25, 50, 75, 100, 117, 118.

- [ ] 08-pdf-hybrid: native and raster content reconcile correctly.
- [ ] 08-pdf-hybrid: duplicated blocks are not visible.
- [ ] 08-pdf-hybrid: reading order is pedagogically usable.
- [ ] 08-pdf-hybrid: figures remain in the correct semantic context.

## E. Images

- [ ] 09-image-text-math: OCR text/math meaning matches source image.
- [ ] 10-image-math-figure: math and figure meaning match source image.

## F. Cross-cutting requirements

- [ ] Raw source files remain unchanged.
- [ ] INPUT performs no silent spelling correction.
- [ ] No mathematical symbol is silently replaced by an OCR lookalike.
- [ ] No formula is silently dropped.
- [ ] No important figure is silently dropped.
- [ ] No figure is detached from its question/context.
- [ ] Output structure is usable by downstream Processing.
- [ ] Machine evidence corresponds to the Golden files inspected.

## Final reviewer decision

- [ ] I have actually reviewed the required representative samples.
- [ ] I approve INPUT V1 for Human Acceptance.

HUMAN_INPUT_ACCEPTANCE=PENDING

MST_MATH_DEMO_INPUT_GATE=CLOSED
