# v1.6 Teacher Pilot Specification

## Preparation

Use the existing golden DOCX corpus (`tests/golden/docx/GOLDEN_00_FOUNDATION.docx` through `GOLDEN_05_COMBINED_MATH_DOCUMENT.docx`) and one teacher-supplied representative DOCX when available. Keep source files local and preserve their hashes. Expected outputs are reviewed against the canonical document, Question Bank, export, and video contracts.

## Self-pilot scenarios

| ID | Task | Expected evidence |
|---|---|---|
| PILOT-01 | Import real DOCX mathematics document | source identity and import result |
| PILOT-02 | Review/correct imported questions | correction count and traceability |
| PILOT-03 | Store/search Question Bank | selected IDs and search result |
| PILOT-04 | Create worksheet | output accepted and source preserved |
| PILOT-05 | Create assessment | assessment and answer manifest separated |
| PILOT-06 | Generate answer key/solution | teacher-only output and provenance |
| PILOT-07 | Export DOCX | native structure and fidelity review |
| PILOT-08 | Export PDF | layout, Unicode, and math review |
| PILOT-09 | Generate representative solution video | runtime artifacts and field score |
| PILOT-10 | Complete workflow end-to-end | one linked evidence record |

## External waves

Wave 1: 2–3 teachers; Wave 2: 5–10 teachers. Each participant uses the same task order and records usability feedback separately from automated QA. No simulated participant results are allowed.

## Evaluation

For each output record result, retries, manual corrections, blocking severity, acceptance, and a short non-identifying note. A teacher may reject an output for usability without implying a software regression; mathematical or provenance defects are always escalated.
