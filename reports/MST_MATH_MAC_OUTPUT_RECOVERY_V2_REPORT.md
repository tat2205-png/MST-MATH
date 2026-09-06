# MST-MATH Mac Output Recovery V2 Report

## Scope and baseline

- Mission: `MST_MATH_MAC_OUTPUT_COMPLETION` recovery V2
- Preserved V1 commit: `0d74e7262048e95a7245f9e0240e62ab102bf8e1`
- Recovery branch: `recovery/mst-math-output-completion-v2`
- P01 source: PR #61 branch `feature/g4-p01-learning-material-v1`, tip `52d3f3c57d0b3a20eb86059c48bf24f446d25322`
- P01 ancestry: direct from baseline `142f5ca3d5b705043743b08868678b65aa1bf04e`
- Integration method: cherry-picked P01 commits only; PR #61 was not merged.

The previous V1 finding was `MISSING_IN_BASELINE`, not `MISSING_IMPLEMENTATION`. P01 code provides a bounded source-backed LessonIR and HTML/DOCX/PDF renderers. No INPUT parser/OCR/MathType/shared IR code was pulled into this recovery.

## Code changes

- Added the P01 LessonIR contract, pipeline, renderers and P01 cross-output test from the identified source commits.
- Resolved the regression-list conflict minimally by adding only `tests/test-p01-learning-material-v1.ts`; unrelated suites from the source branch were not imported.
- HTML now uses KaTeX server-side with `throwOnError` and inlines KaTeX CSS, so formulas are actually typeset in the exported HTML rather than emitted as unprocessed `\\(...\\)` text.
- PDF XeLaTeX uses an available Mac font (`Helvetica`) and reports stdout/stderr on compile failure.
- Added a repeatable synthetic artifact generator script.

## QA evidence

- `npm ci --ignore-scripts`: PASS; worktree-local dependencies installed from `package-lock.json`.
- `npm run lint`: PASS.
- `npm run build`: PASS.
- `node --import tsx tests/test-p01-learning-material-v1.ts`: PASS, all P01 semantic/content/math/figure/HTML/DOCX/PDF checks.
- `npm run qa:regression`: FAIL, 65/78 suites passed. Failures are native `canvas.node` module absence in unrelated teacher/preflight suites; the P01 suite passed.
- PDF: 1 A4 page rendered with Poppler and visually inspected. Vietnamese heading, formula and table were visible; no clipping/overlap observed. The synthetic 1×1 image is visibly a black block, so this is fixture limitation and not real-figure acceptance.
- Reference comparison: `BLOCKED`; named PDF was not found.
- Native Word acceptance: `PENDING`.
- Human acceptance: `PENDING`.
- E2E real golden: `BLOCKED`; INPUT readiness/reference evidence is not satisfied.

## Artifacts

Persistent artifacts: `/Users/mac/Projects/MST-MATH-ARTIFACTS/mst-math-output-completion-v2/`

The directory contains HTML, DOCX, PDF, rendered PNG, logs, copied V1 evidence, and `manifest.sha256`. The fixture is explicitly labeled `SYNTHETIC_CONTRACT_FIXTURE_ONLY`; it is not a real golden.

## Status

P01 renderer recovery is implemented and machine-verified for the available synthetic fixture. Product completion is **PARTIAL / BLOCKED**, not canonical and not demo-ready. The remaining blockers are native canvas runtime for full regression, the missing reference PDF, real INPUT fixture/evidence, and pending native Word/human acceptance. No merge, tag or demo gate was performed.

