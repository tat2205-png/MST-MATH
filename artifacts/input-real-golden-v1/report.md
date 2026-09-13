# MST-MATH Input Real Golden V1

Manifest: PASS (9 asset rows; page expectations are hash-bound where required).

- 01-word-text.docx: **PASS** (text=PASS, math=PASS, figure=PASS, structure=PASS)
- 03-word-mathtype.docx: **PASS** (text=PASS, math=PASS, figure=PASS, structure=PASS) — WORD_RASTER_ASSET_CLASSIFICATION_SKIPPED
- 05-word-real-figure.docx: **PASS** (text=PASS, math=PASS, figure=PASS, structure=PASS) — WORD_RASTER_ASSET_CLASSIFICATION_SKIPPED
- 06-pdf-digital.pdf: **PASS** (text=PASS, math=PASS, figure=PASS, structure=PASS)
- 07-pdf-scanned.pdf: **BLOCKED** (text=BLOCKED, math=BLOCKED, figure=BLOCKED, structure=BLOCKED)
- 08-pdf-hybrid.pdf: **BLOCKED** (text=BLOCKED, math=BLOCKED, figure=BLOCKED, structure=BLOCKED)
- 02-word-omml-successor.docx: **FAIL** (text=PASS, math=PASS, figure=PASS, structure=PASS) — UNSUPPORTED_OMML_CONSTRUCT; UNSUPPORTED_OMML_CONSTRUCT; UNSUPPORTED_OMML_CONSTRUCT; UNSUPPORTED_OMML_CONSTRUCT; UNSUPPORTED_OMML_CONSTRUCT; UNSUPPORTED_OMML_CONSTRUCT; UNSUPPORTED_OMML_CONSTRUCT; UNSUPPORTED_OMML_CONSTRUCT; UNSUPPORTED_OMML_CONSTRUCT; UNSUPPORTED_OMML_CONSTRUCT; UNSUPPORTED_OMML_CONSTRUCT; UNSUPPORTED_OMML_CONSTRUCT; UNSUPPORTED_OMML_CONSTRUCT; UNSUPPORTED_OMML_CONSTRUCT; UNSUPPORTED_OMML_CONSTRUCT; UNSUPPORTED_OMML_CONSTRUCT
- 09-image-text-math.jpg: **BLOCKED** (text=BLOCKED, math=BLOCKED, figure=BLOCKED, structure=BLOCKED) — LOCAL_PADDLE_RUNTIME_BLOCKED
- 10-image-math-figure.jpg: **BLOCKED** (text=BLOCKED, math=BLOCKED, figure=BLOCKED, structure=BLOCKED) — LOCAL_PADDLE_RUNTIME_BLOCKED

Image real Golden blocked: false

Reproduction: `npm run qa:input-v1`