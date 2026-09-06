# MST-MATH Mac Output Recovery V3 Report

## Scope

Recovery V3 continues from `24d3b7775a3d272b76913cf7db777cb90dd01f7f` on `recovery/mst-math-output-completion-v2`. V2 history and commit `0d74e7262048e95a7245f9e0240e62ab102bf8e1` remain preserved.

## Changes implemented

- KaTeX CSS is now inside a `<style>` element and every referenced KaTeX font is embedded as a data URL, so the HTML artifact is standalone.
- P01 HTML now creates real writing areas with ruled lines, explicit `2-exercises-per-page` metadata, and page breaks after each second non-section unit.
- P01 PDF now creates five ruled writing lines per exercise and inserts `\\newpage` after each second exercise unit.
- PDF typography follows the current authority preference `Libertinus Serif` when installed, with an explicit Helvetica fallback for this Mac runtime; the fallback was evidenced because Libertinus was unavailable.
- V3 fixture replaces the inherited 1×1 figure with labeled PNG figures and adds three more labeled figures, yielding six exercise units across three A4 pages.
- `npm ci --ignore-scripts` was diagnosed as the cause of missing `canvas.node`; `npm rebuild canvas --build-from-source` restored the native runtime without changing lockfiles or mocking tests.

## QA evidence

- TypeScript: **PASS** (`npm run lint`).
- Build: **PASS** (`npm run build`).
- Regression: **PASS 78/78** (`npm run qa:regression`).
- HTML: **PASS**; embedded KaTeX fonts, real writing areas, 2-exercises-per-page marker and page breaks verified.
- PDF: **PASS**; 3 A4 pages rendered with Poppler and all pages visually inspected. Formulas, Vietnamese text, labeled figures, ruled writing areas, page numbers and no clipping/overlap were observed.
- DOCX: **PASS contract/package QA**; editable OMML present and four labeled figure media parts embedded. Native Word opening remains pending.
- Fixture: `SYNTHETIC_CONTRACT_FIXTURE_ONLY`, six exercises, three pages; never called a real golden.
- Reference comparison: **BLOCKED** because `1. MIN MAX -HH PHẲNG(1).pdf` is absent.
- E2E real golden: **BLOCKED** by INPUT evidence.
- Human/native acceptance: **PENDING**.
- Demo gate: **CLOSED**.

## Artifacts

`/Users/mac/Projects/MST-MATH-ARTIFACTS/mst-math-output-completion-v3/` contains HTML, PDF, DOCX, all three rendered PNG pages, logs and `manifest.sha256`. No binary or private corpus artifact was added to Git.

