# MST-MATH INPUT V1 — Human Acceptance Checklist

Machine Acceptance: PASS

Human Acceptance is not automatic.

Change each completed checkbox from:



to:


Save this file before typing ACCEPT_INPUT_V1 in PowerShell.

## A. Word

- [x] 01-word-text: Vietnamese text and paragraph order match the source.
- [x] 02-word-omml-successor: OMML formulas preserve mathematical meaning.
- [x] 03-word-mathtype: MathType equations preserve mathematical meaning.
- [x] 05-word-real-figure: figures remain associated with correct content.

## B. PDF Digital

- [x] 06-pdf-digital: text, mathematics, figures, and structure are correct.

## C. PDF Scanned

Inspect at least pages:

1, 2, 25, 50, 75, 100, 124, 125.

- [x] 07-pdf-scanned: representative pages preserve readable text.
- [x] 07-pdf-scanned: mathematical expressions are semantically correct.
- [x] 07-pdf-scanned: diagrams/figures are preserved appropriately.
- [x] 07-pdf-scanned: Unicode characters are not corrupted.

## D. PDF Hybrid

Inspect at least pages:

1, 2, 25, 50, 75, 100, 117, 118.

- [x] 08-pdf-hybrid: native and raster content reconcile correctly.
- [x] 08-pdf-hybrid: duplicated blocks are not visible.
- [x] 08-pdf-hybrid: reading order is pedagogically usable.
- [x] 08-pdf-hybrid: figures remain in the correct semantic context.

## E. Images

- [x] 09-image-text-math: OCR text/math meaning matches source image.
- [x] 10-image-math-figure: math and figure meaning match source image.

## F. Cross-cutting requirements

- [x] Raw source files remain unchanged.
- [x] INPUT performs no silent spelling correction.
- [x] No mathematical symbol is silently replaced by an OCR lookalike.
- [x] No formula is silently dropped.
- [x] No important figure is silently dropped.
- [x] No figure is detached from its question/context.
- [x] Output structure is usable by downstream Processing.
- [x] Machine evidence corresponds to the Golden files inspected.

## Final reviewer decision

- [x] I have actually reviewed the required representative samples.
- [x] I approve INPUT V1 for Human Acceptance.

HUMAN_INPUT_ACCEPTANCE=PASS

MST_MATH_DEMO_INPUT_GATE=CLOSED



## G. Runtime and release integrity

- [x] I reviewed MST_MATH_INPUT_V1_PRETAG_INTEGRITY_AUDIT.md.
- [x] I verified the authoritative INPUT QA Paddle runtime provenance.
- [x] I did not change any Paddle/Python package during acceptance.
- [x] I reviewed the SHA-256 duplicate report for all 9 Golden assets.
- [x] I specifically inspected 03-word-mathtype and 05-word-real-figure.
