# MST-MATH INPUT V1 - Pre-Tag Integrity Audit

Generated: 2026-09-07 10:21:46 +07:00

## Machine Acceptance

Machine acceptance commit: 4283dcfa7c8c98c95ce9d7d9f74ad3777d7ea9df
Result count: 9
Manifest: PASS
Scanned PDF pages: 125
Hybrid PDF pages: 118
No long-running OCR was rerun during this audit.

## Paddle Runtime Provenance

Expected QA Paddle: 3.2.2
Base metadata version: 3.3.1
Base import version: 3.3.1
Filesystem has 3.2.2: True
Filesystem has 3.3.1: True
Usable 3.2.2 candidate probe: True
Source mentions 3.2.2: True
QA log mentions 3.2.2: True
QA log mentions 3.3.1: False
Semantic provider string 3.2.2: True
QA_RUNTIME_PROVENANCE_PASS=True
AUTHORITATIVE_QA_PADDLE_VERSION=3.2.2

## Golden SHA-256 Audit

Golden | File | Bytes | SHA-256
--- | --- | ---: | ---
01-word-text | 01-word-text.docx | 17403 | B417784378602E475FE8112575FB9CD12E8CDAC3E48F9F14FA564C46AF49C39C
03-word-mathtype | 03-word-mathtype.docx | 715309 | E838E277002C61D0CFF22B565A7D012DE259F7FE39701030D5DCD71AD197F471
05-word-real-figure | 05-word-real-figure.docx | 715309 | E838E277002C61D0CFF22B565A7D012DE259F7FE39701030D5DCD71AD197F471
06-pdf-digital | 06-pdf-digital.pdf | 893716 | AB34E09D6371EE4892BA9B02AE4DB20E777AFB4851BB1084BB6A28C3BB3A2633
07-pdf-scanned | 07-pdf-scanned.pdf | 22411085 | 8A0B6D802EE874F60FD61F83CAC42A3C89F993D68E59B936DF6669338524C750
08-pdf-hybrid | 08-pdf-hybrid.pdf | 19243609 | 9159B9B002FD18377601803A76FB4E6617C9DA285B43918E553C8EEE012C3570
02-word-omml-successor | 02-word-omml-successor.docx | 3821 | 4865CC613FB6F94F8D1A5FDADEE804F91A8C6D0A760501D6B0088ED10D92F0C6
09-image-text-math | 09-image-text-math.jpg | 298652 | C68BE38621B09CBA0E8702017C675D9803606786A118356CBC9AE2A2A97502FD
10-image-math-figure | 10-image-math-figure.jpg | 247155 | 3369F4C498388FA5B3CDF08DD3FFEB14DD44467B65C5A995F4176E34BDB69D13

## Duplicate Golden Groups

SHA256 E838E277002C61D0CFF22B565A7D012DE259F7FE39701030D5DCD71AD197F471 -> 03-word-mathtype, 05-word-real-figure

## Golden 03 / 05

GOLDEN_03_05_BYTE_IDENTICAL=True

If the same DOCX intentionally exercises both MathType and real-figure
coverage, Human Acceptance must explicitly confirm dual-purpose use.
If duplication is accidental, Human Acceptance must stop.

## Release State

INPUT_MACHINE_ACCEPTANCE=PASS
RUNTIME_PROVENANCE=PASS
HUMAN_INPUT_ACCEPTANCE=PENDING
FINAL_CANONICAL_TAG=NOT_CREATED
MST_MATH_DEMO_INPUT_GATE=CLOSED
