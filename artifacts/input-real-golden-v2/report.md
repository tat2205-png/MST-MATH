# MST-MATH Input Capability Recovery V1 — V2 Evidence

## Executive summary

The real Golden runner validates nine registered assets. A valid successor native-OMML Golden was recovered and the parser now ignores non-semantic `m:oMathPr` properties. The command remains fail-closed with exit code 1 because MathType semantic recovery, scanned/hybrid semantic OCR, and image semantic ingestion are not operational.

## OMML

The original `02-word-omml.docx` contains native OMML: 32 `m:oMath` nodes and zero `m:oMathPara` nodes. One node is empty, so it is invalid as a mandatory semantic Golden. It remains preserved outside the manifest. The successor `02-word-omml-successor.docx` has 16 native, non-empty expressions and passes production extraction.

## MathType / OLE

`03-word-mathtype.docx` contains 148 `Equation.DSMT4` OLE objects, 148 compound-file embeddings, and WMF/PNG/JPG/EMF previews. No literal MTEF payload was detected in package XML. The local bridge was attempted but semantic decoding failed; previews are not treated as semantic MathType recovery. Status: BLOCKED.

## Local OCR architecture

PaddleOCR 3.7.0 / PPStructureV3 is installed with cached layout, OCR, and formula models. Real inference on both image Goldens failed in the Windows oneDNN/PIR runtime with `ConvertPirAttribute2RuntimeAttribute not supported`. No OCR, formula, layout, or figure result was promoted to PASS.

## Images

`09-image-text-math.jpg` is a real KNTT Math 11 page 76 with Vietnamese text and probability mathematics. `10-image-math-figure.jpg` is page 77 with probability mathematics and photographic figures. Both are registered with SHA-256 provenance and remain BLOCKED pending runtime/adaptor repair.

## Results

WORD_TEXT=PASS; WORD_OMML=PASS via successor; WORD_MATHTYPE=BLOCKED; WORD_FIGURE=PASS; PDF_DIGITAL=PASS; PDF_SCANNED=BLOCKED; PDF_HYBRID=BLOCKED; IMAGE_TEXT_MATH=BLOCKED; IMAGE_MATH_FIGURE=BLOCKED.

## Validation

`npm run lint` and `git diff --check` passed. `npm run qa:input-v1` returned 1 by fail-closed policy. V1 evidence was preserved.

## Human action required

Repair the Windows Paddle runtime or provide a validated local CPU fallback; implement the Node/Python semantic adapter and hybrid deduplication; validate a local Equation.DSMT4/MTEF decoder. `MST_MATH_DEMO_INPUT_GATE` remains CLOSED.
