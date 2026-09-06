# MST-MATH INPUT → E2E → OUTPUT Closeout Plan V1

Date: 2026-09-06
Status: DRAFT / EXECUTION PLAN / NON-DESTRUCTIVE
Target: `integration/mst-math-convergence-v1`

## Mission

Close the remaining pre-demo product gaps without adding new core architecture.

Primary objective:

`REAL INPUT → VERIFIED SEMANTIC PIPELINE → REAL P01 OUTPUT → HUMAN ACCEPTANCE → PILOT SHA`

## Operating rules

- Feature expansion is frozen until G4/G5 close.
- Do not modify LOCKED/CANONICAL authorities in place.
- Reconcile bounded successors onto convergence; do not blind-merge diverged histories.
- No synthetic-only evidence can close a real-golden gate.
- No local-only PASS can be treated as product truth until reconciled onto the certification SHA.
- One final pilot candidate must be represented by one SHA.

## Phase 1 — INPUT closeout

### P0.1 Scanned PDF

Required deliverables:

- real scanned PDF corpus;
- page rasterization evidence;
- text/math/figure region separation;
- DocumentIR construction;
- reading-order verification;
- provenance page/region coordinates;
- fail-closed low-confidence behavior;
- regression registered in the main runner.

Acceptance:

```text
SCANNED_PDF_PAGE_RASTERIZATION=PASS
SCANNED_PDF_IMAGE_PIPELINE_REUSE=PASS
SCANNED_PDF_DOCUMENT_IR=PASS
SCANNED_PDF_READING_ORDER=PASS
```

### P0.2 Hybrid PDF

Required deliverables:

- real hybrid PDF corpus;
- native extraction;
- raster extraction;
- coordinate transform/mapping;
- native/raster duplicate detection;
- text/math/figure reconciliation;
- final DocumentIR with no duplication;
- provenance for accepted native/raster region;
- regression registered in the main runner.

Acceptance:

```text
HYBRID_NATIVE_EXTRACTION=PASS
HYBRID_RASTER_EXTRACTION=PASS
HYBRID_COORDINATE_MAPPING=PASS
HYBRID_TEXT_RECONCILIATION=PASS
```

### P0.3 Standalone image

Use at least one real page/image containing all of:

- Vietnamese text;
- mathematical notation;
- geometry/graph or another real instructional figure.

Acceptance requires correct separation and ownership, not only OCR character accuracy.

## Phase 2 — INPUT convergence

Create a bounded successor based on the current convergence branch.

Reconcile only the proven INPUT capability required for demo:

- Word path;
- PDF digital/scanned/hybrid paths;
- image path;
- real-golden tests/evidence;
- dependency lock required for the accepted runtime.

Do not include unrelated feature work.

Required checks:

- `git diff --check`;
- typecheck;
- build;
- full regression;
- Unified Input gates;
- exact-head CI;
- post-merge CI.

## Phase 3 — Semantic E2E Golden

### Golden A — real DOCX

Use an authorized real DOCX containing as many of the following as possible:

- native text;
- OMML;
- embedded figures;
- structural numbering;
- MathType/OLE if an authorized real sample exists.

### Golden B — real PDF

Use one real digital/scanned/hybrid PDF that exercises the finalized PDF path.

### Required trace

For each source:

`Source → Unified Ingest → DocumentIR → QuestionIR/QA → LessonIR/P01 → HTML/PDF/DOCX`

Record at each boundary:

- source file SHA-256;
- source ID;
- block/question identity;
- normalized math identity;
- figure asset hash;
- order;
- answers/keys where applicable;
- provenance;
- review/fail state.

### E2E invariants

```text
SOURCE_ID_PRESERVED=PASS
QUESTION_IDENTITY_PRESERVED=PASS
MATH_SEMANTICS_PRESERVED=PASS
FIGURE_OWNERSHIP_PRESERVED=PASS
ORDER_PRESERVED_OR_TRACEABLE_REFLOW=PASS
ANSWER_KEY_ALIGNMENT=PASS
PROVENANCE_PRESERVED=PASS
NO_SILENT_FALLBACK=PASS
```

## Phase 4 — OUTPUT convergence

Reconcile the bounded P01 output recovery onto the same convergence lineage.

Preserve:

- one semantic LessonIR/DocumentIR authority;
- HTML KaTeX rendering;
- PDF XeLaTeX rendering;
- DOCX native OMML;
- source-backed figures only;
- no fabricated pedagogy/content;
- cross-output semantic signature.

Do not mutate shared IR simply to make one renderer easier.

## Phase 5 — environment and regression closeout

Current known output blocker includes native `canvas.node` absence on Mac recovery evidence.

Certification machine must provide:

- complete dependency install;
- native module readiness;
- exact-head typecheck;
- exact-head build;
- complete regression suite;
- no skipped suite hidden as PASS.

Acceptance:

```text
FULL_REGRESSION=PASS
SKIPPED_P0_SUITES=0
ENVIRONMENT_CERTIFIED=PASS
```

## Phase 6 — Real P01 Cross-Output Golden

Generate from the same real source and semantic lineage:

- HTML;
- PDF;
- DOCX.

Compare:

- semantic signature;
- block count;
- question count;
- formula count/identity;
- figure count/hash;
- answer/key alignment;
- provenance;
- order;
- no missing/duplicate content.

Acceptance:

```text
P01_REAL_HTML=PASS
P01_REAL_PDF=PASS
P01_REAL_DOCX=PASS
CROSS_OUTPUT_SEMANTIC_EQUIVALENCE=PASS
G4_P01_REAL_GOLDEN=PASS
```

## Phase 7 — Native / Human Acceptance

Human review must remain separate from machine QA.

### DOCX

Open in native Microsoft Word on Windows and/or macOS.

Check:

- equations are real editable equations where required;
- no formula corruption;
- figure ownership;
- page breaks;
- numbering;
- ruled workspace;
- answer pages;
- typography and baseline alignment.

### PDF

Check:

- A4 page layout;
- print-safe figures/math;
- no clipping/overlap;
- page numbering;
- answer section;
- usable density.

### HTML

Check in supported browser:

- KaTeX rendering;
- accessibility/source semantics;
- image loading;
- no content loss;
- responsive usability sufficient for pilot.

Acceptance:

```text
NATIVE_WORD_ACCEPTANCE=PASS
PDF_HUMAN_ACCEPTANCE=PASS
HTML_HUMAN_ACCEPTANCE=PASS
G5_HUMAN_ACCEPTANCE=PASS
```

## Phase 8 — Pilot freeze and release

Only after G4/G5 PASS:

1. freeze final convergence SHA;
2. run full exact-head CI;
3. create pilot/release candidate branch/tag;
4. enable required protection rules before production merge;
5. merge only the certified SHA lineage;
6. tag the approved demo/pilot version;
7. retain all evidence manifests and human acceptance records.

## Workstream ownership recommendation

### PC

Primary:

- scanned PDF;
- hybrid PDF;
- real image golden;
- INPUT dependency/runtime closeout;
- INPUT real-golden evidence.

### Mac

Primary:

- P01 renderer recovery validation;
- native Word/PDF/browser review support;
- Mac-specific native module/environment closeout;
- cross-platform comparison.

### Convergence / Control Room

Primary:

- collision review;
- bounded cherry-pick/reconciliation;
- exact-head CI;
- no parallel authority;
- evidence SHA binding;
- final pilot freeze.

## Explicitly deferred until after closeout

- new GeoGebra automation product features;
- PostgreSQL/problem knowledge base migration;
- semantic retrieval expansion;
- broad visual redesign;
- new teacher-app modules;
- nonessential video feature expansion;
- runtime activation of unrelated draft successor standards.

These remain backlog/successor work and must not block the current completion cut unless an already-locked dependency explicitly requires them.

## Completion definition

MST-MATH is ready for internal pilot only when all of the following are true on the same product lineage:

```text
INPUT_REAL_GOLDEN=PASS
SEMANTIC_E2E_GOLDEN=PASS
FULL_REGRESSION=PASS
P01_REAL_CROSS_OUTPUT=PASS
G4_P01_REAL_GOLDEN=PASS
G5_HUMAN_ACCEPTANCE=PASS
P0_OPEN=0
P1_RELEASE_BLOCKER_OPEN=0
PILOT_SHA_FROZEN=TRUE
HUMAN_PRODUCT_OWNER_APPROVAL=TRUE
```

Until then:

```text
DEMO_GATE=CLOSED
FEATURE_EXPANSION=FROZEN
```
