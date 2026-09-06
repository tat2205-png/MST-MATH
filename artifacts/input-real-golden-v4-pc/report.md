# MST-MATH Input PC Blocker Recovery V4

## Runtime recovery

The original local environment used Python 3.11.16, Paddle 3.3.1, PaddleOCR 3.7.0, NumPy 2.3.5, and OpenCV 4.10.0. Import, tensor creation, and PPStructureV3 initialization passed, but real inference failed in Paddle's Windows static oneDNN/PIR executor with `ConvertPirAttribute2RuntimeAttribute not supported`.

A bounded isolated repair was completed without changing global Python or project lockfiles: Paddle 3.2.2 was installed in an ignored local package overlay and used with the existing PaddleOCR 3.7.0 models. Real inference then passed on both image Goldens. This establishes:

`PADDLE_FAILURE_CLASS=PADDLE_3_3_1_WINDOWS_ONEDNN_PIR_OPERATOR_INCOMPATIBILITY`

`PADDLE_ROOT_CAUSE=Paddle 3.3.1 static executor/model incompatibility on this Windows runtime`

The runner now auto-selects the known local Paddle environment and overlay, while retaining environment overrides.

## Image results

The production runner invokes `scripts/local-semantic-vision.py`, which maps PPStructureV3 ordered regions into semantic TEXT, MATH, FIGURE, and OTHER classes with bounding boxes, confidence, and provider provenance. `09-image-text-math.jpg` passed with 17 text and 1 math region. `10-image-math-figure.jpg` passed with 19 text, 4 math, and 2 figure regions.

## PDFs

The existing runner still passes digital PDF. Scanned PDF has 125 pages and hybrid PDF has 118 pages. Rasterization tools are present, but the batch page-raster semantic adapter and native/OCR reconciliation are not yet wired into DocumentIR. Both remain BLOCKED. No OCR-only or partial-page result was promoted to PASS.

Hybrid deduplication remains unimplemented; required future rules are native-source preference, bbox/text overlap reconciliation, and math-semantic precedence over OCR text.

## MathType

The Golden contains 148 valid CFB OLE objects with ProgID `Equation.DSMT4`. Each contains `CompObj`, `Ole`, `ObjInfo`, and `Equation Native` streams. A full-OLE probe with the existing `mtef-py` bridge decoded 143 objects to non-empty LaTeX and returned `MTEF_EMPTY_LATEX` for 5 objects. Because five real objects remain unresolved, the gate stays BLOCKED under no-silent-loss policy. Preview formats are preserved but not treated as semantic recovery.

## QA status

`npm run qa:input-v1` runs successfully with the repaired runtime and returns exit code 1 because MathType, scanned PDF, and hybrid PDF remain blocked. Manifest, Word text/OMML/figure, digital PDF, and both image Goldens pass. Prior V1–V3 evidence remains untouched. `uv.lock` remains unrelated and unstaged.

## Remaining blockers

1. Implement batch scanned-PDF page rasterization into the shared semantic image adapter and DocumentIR.
2. Implement hybrid PDF native/raster region reconciliation and deterministic deduplication.
3. Resolve the five `Equation.DSMT4` objects that produce empty LaTeX, or prove they are semantically empty without silently discarding them.

`MATHPIX_REQUIRED=FALSE` and `MST_MATH_DEMO_INPUT_GATE=CLOSED` remain unchanged.
