# Math AI Studio v1.5.0 Roadmap

This is a planning document only. No v1.5 implementation is authorized by this task.

## P0 — Release/integrity blockers

None identified from the v1.4 release evidence.

## P1 — High-value approved completion

| ID | Title | Why | Dependencies | Risk | Acceptance | Blocking | Scope | Source |
|---|---|---|---|---|---|---|---|---|
| V15-DOC-01 | Document pipeline refinement | Address the remaining separately scoped document-engine work after the verified v1.4 converter baseline. | Existing Document IR, DOCX/OMML, LaTeX/PDF paths | Medium | Deterministic conversion and round-trip preservation remain green. | Feature-dependent | Focused | v1.3.1 roadmap and v1.4 release evidence |
| V15-NLS-01 | NLS-SOURCE-02H human review | Complete only the preserved human-review workflow if explicitly approved. | Human review decisions and existing source registry | High | Review provenance is recorded; no unverified content is promoted. | No | Focused | Deferred scope and preserved branch |

## P2 — Improvements

| ID | Title | Why | Dependencies | Risk | Acceptance | Blocking | Scope | Source |
|---|---|---|---|---|---|---|---|
| V15-ARCH-01 | Resolve reviewed architecture warnings | Reduce known boundary/dependency warnings without changing runtime behavior. | Architecture baseline and dependency review | Medium | Warning count decreases without new violations; full regression remains 70/70. | No | Small | v1.4 architecture audit |
| V15-QA-01 | Broaden deterministic ingest corpus | Increase confidence across approved PDF/image variations without adding formats or OCR. | Approved ingest contract | Medium | Additional malformed, metadata, and asset fixtures pass fail-closed checks. | No | Small | v1.4 ingest QA |

## P3 — Optional/experimental

| ID | Title | Why | Dependencies | Risk | Acceptance | Blocking | Scope | Source |
|---|---|---|---|---|---|---|---|
| V15-VIS-01 | Optional visual AI evaluation | Assess whether credentialed visual analysis adds value beyond deterministic frame QA. | Optional credentials and explicit approval | High | It remains additive and cannot override deterministic gates. | No | Experimental | v1.4 optional visual-QA status |

## Non-goals

- No NLS promotion without human review.
- No duplicate document, math, Question Bank, PDF, geometry, fold, video, or render pipelines.
- No cloud OCR or mandatory AI dependency.
- No framework migration or dependency upgrade without a proven blocker.
- No v1.5 feature implementation in this archive task.
- No branch creation, tag movement, or release-history rewriting.
