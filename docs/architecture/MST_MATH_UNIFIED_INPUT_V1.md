# MST-MATH Unified Input V1

Status: PROPOSED / SUCCESSOR WORKSTREAM
Branch: `feature/mst-math-unified-input-v1`
Policy: NON-DESTRUCTIVE. Existing LOCKED/CANONICAL contracts are not edited in place.

## 1. Release gate

MST-MATH DEMO MUST remain CLOSED until the real-input acceptance suite passes for Word, PDF, and image inputs containing mixed Vietnamese text, mathematical notation/formulas, tables, and figures/diagrams.

A source is not considered successfully ingested merely because text can be extracted. Successful ingestion means the semantic reading order and all supported content classes are represented with provenance and without silent loss.

## 2. Required input families

### Word

Required compatibility:
- `.docx` native Word text and layout
- native OMML equations
- legacy MathType / Equation Editor OLE equations (MTEF compatibility import)
- embedded raster images
- EMF/WMF/VML/drawing assets when present
- tables and basic reading order
- `.doc` compatibility through a controlled conversion adapter before canonical parsing; binary `.doc` is not made a canonical parser format

### PDF

Required compatibility:
- born-digital PDF
- scanned PDF
- hybrid PDF (text layer + scanned/embedded page regions)
- text extraction with page/region provenance
- formula recognition to normalized LaTeX
- figure/diagram extraction or preservation as page-region assets
- tables and reading order where recoverable
- no silent fallback from unreadable math to plain text

### Image

Required compatibility:
- PNG/JPEG as minimum; TIFF/WebP may be added by the image decoder adapter
- full-page worksheets/exam pages and cropped questions
- mixed Vietnamese text + formulas
- printed formulas to normalized LaTeX
- figures/diagrams detected and preserved as separate assets/regions
- source coordinates retained for every recognized block

## 3. Canonical ingest contract

All input adapters converge on the existing canonical `DocumentIR` rather than creating independent downstream pipelines.

Logical flow:

`SOURCE -> TYPE/SIGNATURE DETECTION -> STRUCTURAL EXTRACTION -> LAYOUT/REGION DETECTION -> TEXT/MATH/FIGURE CLASSIFICATION -> MATH NORMALIZATION -> DOCUMENT IR -> INPUT QA -> DOWNSTREAM MST-MATH PIPELINE`

Required semantic content classes:
- text
- math
- figure
- table

Every derived content item must retain:
- source document
- source hash
- page/paragraph/region location when available
- extraction/recognition method
- confidence when recognition is probabilistic
- warnings/review state if below acceptance threshold

## 4. Word strategy

### Native OMML

Keep the existing OMML parser as the preferred deterministic path.

### Legacy MathType / OLE

Replace the current blanket `LEGACY_MATHTYPE_UNSUPPORTED` behavior with a compatibility decoder:

`DOCX relationship -> word/embeddings/*.bin -> OLE compound file -> Equation Native/EquationNative/Equation stream -> MTEF parser -> normalized LaTeX -> math node`

The decoder MUST be fail-closed. A failed MTEF parse must retain the original OLE asset and produce a review diagnostic; it must never invent a formula.

MTEF is an import compatibility format, not the canonical MST-MATH math representation.

### Embedded figures

Preserve source assets and their relation to paragraphs/tables. Existing WMF/EMF/VML reconstruction paths remain specialized figure adapters and must not be conflated with equation OCR.

## 5. PDF strategy

Tiered extraction:
1. validate PDF and inspect pages
2. deterministic text extraction for born-digital text
3. recover embedded/vector/raster figures when possible
4. render only pages/regions that require visual recognition
5. classify regions as text / math / figure / table
6. formula recognition -> LaTeX
7. preserve figures as assets rather than OCR text
8. merge all blocks back into page reading order

`pdftotext` alone is insufficient for this gate because it cannot establish complete math/figure preservation for scanned or mixed STEM documents.

## 6. Image strategy

Image ingestion is a semantic OCR pipeline, not an asset-only import.

Required steps:
1. validate image signature
2. normalize orientation/resolution
3. layout/region detection
4. region classification
5. Vietnamese text OCR
6. formula OCR -> normalized LaTeX
7. figure/diagram region preservation
8. reading-order reconstruction
9. DocumentIR creation

## 7. Recognition providers

Use a provider interface so canonical architecture does not depend on one vendor.

Recommended policy:
- deterministic/native extraction first
- local OCR/math recognition where confidence and regression quality are sufficient
- optional high-accuracy remote STEM OCR adapter for difficult PDF/image regions
- provider output is never accepted directly as canonical; it passes Math/Document QA first

Secrets/API keys must remain server-side and outside source control.

## 8. Fail-closed requirements

The ingest gate fails or requires review when any of the following occurs:
- a formula region is detected but no parseable normalized math is produced
- an OLE equation exists but MTEF decode fails
- a figure is dropped or replaced by OCR text
- page/paragraph reading order cannot be reconciled without an explicit warning
- source asset/provenance is lost
- source bytes are mutated

No `PASS` may contain `*_UNSUPPORTED`, `*_NEEDS_FALLBACK`, unreadable-math, or lost-figure diagnostics.

## 9. Real Golden acceptance suite

The gate requires real, user-derived documents rather than synthetic fixtures only.

Minimum matrix:
- Word: native OMML only
- Word: legacy MathType only
- Word: mixed OMML + MathType + raster/vector figures
- Word: tables containing equations and figures
- PDF: born-digital math document
- PDF: scanned math document
- PDF: hybrid document with figures
- Image: clean printed page
- Image: low-quality photographed page
- Image: formula + geometry/graph illustration

For every golden source compare:
- content count by class
- formula semantic equivalence
- no lost formulas
- no lost figures
- reading order
- source traceability
- deterministic rerun/hash behavior where applicable

## 10. Demo release criteria

`INPUT_WORD_REAL_GOLDEN=PASS`

`INPUT_MATHTYPE_MTEF=PASS`

`INPUT_PDF_DIGITAL=PASS`

`INPUT_PDF_SCANNED=PASS`

`INPUT_IMAGE_MIXED_STEM=PASS`

`INPUT_FIGURE_PRESERVATION=PASS`

`INPUT_MATH_NORMALIZATION=PASS`

`INPUT_PROVENANCE=PASS`

`INPUT_FAIL_CLOSED=PASS`

Only after all required gates pass may `MST_MATH_DEMO_INPUT_GATE=OPEN` be reported.
