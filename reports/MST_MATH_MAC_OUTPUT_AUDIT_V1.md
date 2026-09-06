# MST-MATH Mac Output Audit V1

- Mission: `MST_MATH_MAC_OUTPUT_COMPLETION_V1`
- Worktree: `/Users/mac/Projects/mst-math-output-completion-v1`
- Branch: `fix/mst-math-output-completion-v1`
- Baseline: `142f5ca3d5b705043743b08868678b65aa1bf04e` (verified with `git show`)
- Reference PDF: `1. MIN MAX -HH PHẲNG(1).pdf` — **MISSING** (not found under workspace or `/Users/mac/Projects`)

## Findings

The verified baseline contains a native semantic DOCX renderer under `src/modules/document-export/docx/`, including OMML math serialization, embedded figures, styles, layout and structural numbering support in the related existing Mac branch. It does not contain a P01 HTML renderer or a PDF renderer/preview pipeline. `server/services/exportService.ts` emits standalone TeX for the legacy `MathProblemIR` route and is not a profile-to-preview-to-HTML/PDF/DOCX P01 pipeline.

The output registry marks product scope separately from repository implementation. P01 is present in `registry/output-profiles.json`, but registry presence is not implementation evidence.

## Target matrix

| Target | Implementation | Artifact | QA | Gap/dependency |
|---|---|---|---|---|
| Profile selection | registry only; no P01 consumer flow verified | none | NOT_RUN | teacher workflow / preview contract |
| HTML | NOT_FOUND | none | NOT_RUN | renderer missing |
| PDF | TeX generator only; no P01 PDF renderer | none | NOT_RUN | renderer, pagination, visual reference |
| DOCX | native package renderer with OMML and figures | not generated in this run | BLOCKED | dependencies and external worktree write restriction |
| Icons | semantic icon authority and SVG assets exist | not generated | NOT_RUN | renderer adapters not unified |
| P01 layout | contract/registry references exist | none | NOT_RUN | two exercises/page and writing-area policy not executable here |
| Real golden E2E | INPUT real golden unavailable | none | BLOCKED | INPUT dependency and missing reference PDF |

No implementation change was made to INPUT parser/OCR/MathType extraction or shared IR. No locked/canonical/approved authority was edited.

