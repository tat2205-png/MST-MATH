# Math AI Studio v1.6.0 Roadmap

This roadmap is locked for planning. No v1.6 implementation is included in this archive commit.

## Counts

P0=0
P1=2
P2=0
P3=1

## P1 — approved next-version completion

| ID | Title | Problem / goal | Dependencies | Risk | Acceptance | Blocking | Scope | Source |
|---|---|---|---|---|---|---|---|---|
| V16-ARCH-01 | Resolve reviewed architecture warnings | Remove or explicitly close the three reviewed warnings without changing canonical runtime behavior. | Architecture baseline, boundary owners | Medium | Zero release-blocking violations; full regression remains green; no parallel pipeline. | No | Focused | v1.5 known warnings and deferred V15-ARCH-01 |
| V16-QA-01 | Broaden approved ingest QA corpus | Increase deterministic coverage for approved PDF/image inputs and fail-closed cases. | Existing ingest contract and fixtures | Medium | Added fixtures preserve traceability, immutability, and fail-closed behavior. | No | Focused | v1.5 deferred scope and ingest evidence |

## P2

None selected at roadmap lock.

## P3 — optional / experimental

| ID | Title | Problem / goal | Dependencies | Risk | Acceptance | Blocking | Scope | Source |
|---|---|---|---|---|---|---|---|---|
| V16-VIS-01 | Optional visual AI evaluation | Evaluate additive visual analysis without allowing it to override deterministic QA. | Explicit approval and optional credentials | High | Disabled by default; no cloud requirement; deterministic gates remain authoritative. | No | Experimental | v1.5 optional visual-AI disposition |

## Non-goals

- No new document, math, Question Bank, geometry, fold, video, or render pipeline.
- No source-content rewriting, cloud OCR, framework migration, or unapproved dependency upgrade.
- No implementation in this planning/archive commit.
