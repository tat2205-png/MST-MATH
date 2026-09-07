# MST-MATH Input PC Final Closeout V5

## MathType closeout

All 148 `Equation.DSMT4` objects are valid semantic equations. The five previously unresolved objects contain valid MTEF v5 / DSMT7 `Equation Native` payloads, not empty objects. `mtef-py` parsed their ASTs successfully but returned empty LaTeX because template selectors 15 (`tmINTEG`) and 21 (`tmINTOP`) were absent from its renderer. The bridge now handles only those encountered selectors using already-parsed child ASTs. Re-running the real DOCX produces 148 math blocks, 148 decoded equations, zero unresolved objects, and no MathType diagnostics.

## Image pipeline

The existing local Paddle 3.2.2 / PaddleOCR 3.7.0 runtime is reused. Real image Goldens pass through `scripts/local-semantic-vision.py`, which initializes PPStructureV3 once per image invocation and maps ordered regions with bbox/provider provenance. The two image Goldens pass with 18 and 25 regions respectively.

## Scanned PDF

The scanned Golden has 125 pages. `pdftoppm` is available and the same semantic adapter is proven on direct images, but the production batch page-raster-to-DocumentIR adapter is not implemented. The runner therefore remains BLOCKED and does not claim text-only OCR success.

## Hybrid PDF

The hybrid Golden has 118 pages. Native text extraction passes, but coordinate normalization, raster-region semantic analysis, native/OCR reconciliation, deterministic deduplication, and DocumentIR mapping are not implemented. It remains BLOCKED.

## Regression

`npm run qa:input-v1` returns exit code 1 by fail-closed policy. Manifest, Word text, OMML, MathType, figure, digital PDF, and both image Goldens pass. Lint, build, and existing ingestion regression pass. Prior evidence V1–V4 remains untouched, and `uv.lock` remains unrelated and unstaged.

## Remaining blockers

Only the scanned-PDF batch semantic adapter and hybrid PDF reconciliation/deduplication remain. No valid MathType equation remains unresolved.

`MATHPIX_REQUIRED=FALSE`; `MST_MATH_DEMO_INPUT_GATE=CLOSED`.
