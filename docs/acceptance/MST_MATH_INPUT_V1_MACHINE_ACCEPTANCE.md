# MST-MATH INPUT V1 — Machine Acceptance

Generated: 2026-09-07 08:57:33 +07:00

## Repository

- Branch: fix/mst-math-input-complete-pc-v1
- Source HEAD before closeout commit: 4cfcfc85c654270e39ce4c20f22b79dbda58fa49
- QA command: `npm run qa:input-v1`
- QA exit code: 0

## Reproducibility condition

The final QA was executed with:

- `PYTHONIOENCODING` unset
- `PYTHONUTF8` unset
- PDF-only filter unset
- PDF-name filter unset

UTF-8 output protection is implemented inside
`scripts/local-semantic-pdf.py`.

## Runtime

- Node: v24.19.0
- npm: 11.17.0
- Python: Python 3.11.16
- Paddle: 3.3.1

## Final Golden Matrix

| Golden | Text | Math | Figure | Structure | Overall | Errors |
|---|---|---|---|---|---|---|
| 01-word-text | PASS | PASS | PASS | PASS | PASS | 0 |
| 03-word-mathtype | PASS | PASS | PASS | PASS | PASS | 0 |
| 05-word-real-figure | PASS | PASS | PASS | PASS | PASS | 0 |
| 06-pdf-digital | PASS | PASS | PASS | PASS | PASS | 0 |
| 07-pdf-scanned | PASS | PASS | PASS | PASS | PASS | 0 |
| 08-pdf-hybrid | PASS | PASS | PASS | PASS | PASS | 0 |
| 02-word-omml-successor | PASS | PASS | PASS | PASS | PASS | 0 |
| 09-image-text-math | PASS | PASS | PASS | PASS | PASS | 0 |
| 10-image-math-figure | PASS | PASS | PASS | PASS | PASS | 0 |

## PDF long-run evidence

- 07-pdf-scanned: 125/125 pages, PASS
- 08-pdf-hybrid: 118/118 pages, PASS

## Manifest

- Validation: PASS
- Rows: 9
- Missing referenced assets: 0
- Unregistered Golden assets: 0

## Golden SHA-256

| Golden | File | SHA-256 |
|---|---|---|
| 01-word-text | 01-word-text.docx | B417784378602E475FE8112575FB9CD12E8CDAC3E48F9F14FA564C46AF49C39C |
| 03-word-mathtype | 03-word-mathtype.docx | E838E277002C61D0CFF22B565A7D012DE259F7FE39701030D5DCD71AD197F471 |
| 05-word-real-figure | 05-word-real-figure.docx | E838E277002C61D0CFF22B565A7D012DE259F7FE39701030D5DCD71AD197F471 |
| 06-pdf-digital | 06-pdf-digital.pdf | AB34E09D6371EE4892BA9B02AE4DB20E777AFB4851BB1084BB6A28C3BB3A2633 |
| 07-pdf-scanned | 07-pdf-scanned.pdf | 8A0B6D802EE874F60FD61F83CAC42A3C89F993D68E59B936DF6669338524C750 |
| 08-pdf-hybrid | 08-pdf-hybrid.pdf | 9159B9B002FD18377601803A76FB4E6617C9DA285B43918E553C8EEE012C3570 |
| 02-word-omml-successor | 02-word-omml-successor.docx | 4865CC613FB6F94F8D1A5FDADEE804F91A8C6D0A760501D6B0088ED10D92F0C6 |
| 09-image-text-math | 09-image-text-math.jpg | C68BE38621B09CBA0E8702017C675D9803606786A118356CBC9AE2A2A97502FD |
| 10-image-math-figure | 10-image-math-figure.jpg | 3369F4C498388FA5B3CDF08DD3FFEB14DD44467B65C5A995F4176E34BDB69D13 |

Complete evidence SHA-256 manifest:

`docs/acceptance/MST_MATH_INPUT_V1_EVIDENCE_SHA256.csv`

## Machine gates

WORD_INPUT_GATE=PASS

PDF_INPUT_GATE=PASS

IMAGE_INPUT_GATE=PASS

MANIFEST=PASS

REAL_GOLDEN_REGRESSION=PASS

INPUT_REAL_GOLDEN_GATE=PASS

READY_FOR_HUMAN_GATE_DECISION=TRUE

MST_MATH_DEMO_INPUT_GATE=CLOSED

## Release status

This document certifies machine acceptance only.

Human Acceptance is still required before INPUT V1 can become an
accepted release candidate.

The final canonical tag must not be created on this feature/fix branch.
