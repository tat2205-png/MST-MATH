# MST-MATH INPUT → DATA PROCESSING → OUTPUT Re-Audit

Date: 2026-09-06
Status: DRAFT / OPERATIONAL AUDIT / NON-DESTRUCTIVE
Target convergence lineage: `integration/mst-math-convergence-v1`

## Executive conclusion

MST-MATH no longer lacks a major core architecture. The dominant risk before demo is evidence convergence: INPUT, processing, and OUTPUT capabilities exist across several branches and machines, but the product is not yet certified by one real-source end-to-end trace on one convergence SHA.

**Decision:** freeze feature expansion and finish `CONVERGE → PROVE → CERTIFY → RELEASE`.

Demo remains CLOSED until real INPUT, real P01 cross-output, and human acceptance are all proven on the same product lineage.

## Current truth snapshot

| Area | Status | Operational interpretation |
|---|---|---|
| G1 Convergence Truth | PASS | convergence authority established |
| G2 QA Truth | PASS | fail-closed QA authority established |
| G3 Teacher Workflow | PASS | current convergence control advanced to G4 |
| Word input | PASS on latest machine evidence | text/OMML/MathType/figure/input gate evidence substantially closed |
| Digital PDF | PASS on latest machine evidence | native/digital extraction path proven |
| Image input | PARTIAL_REAL_GOLDEN | usable path exists; real semantic golden coverage still required |
| Scanned PDF | BLOCKED | rasterization implemented but DocumentIR/reading order not yet certified |
| Hybrid PDF | BLOCKED | native path exists but coordinate mapping and native/raster reconciliation remain blockers |
| DocumentIR / QuestionIR | STRONG | do not redesign before demo |
| Question Bank / retrieval authority | STRONG | approved-only reuse and stale-lineage checks should remain fail-closed |
| QA / real-world guard | STRONG | unverified real-world data remains HUMAN_REVIEW_REQUIRED |
| P01 HTML | PASS_WITH_LIMITATIONS | KaTeX rendering available; still needs real-source E2E certification |
| P01 PDF | PASS_WITH_SYNTHETIC_LIMITATION | XeLaTeX path works; synthetic/fixture evidence is not release proof |
| P01 DOCX | CONTRACT_PASS / NATIVE_ACCEPTANCE_PENDING | native OMML architecture exists; real Word/human acceptance still required |
| Full output regression | BLOCKED | Mac recovery reported 65/78 because native `canvas.node` is missing |
| Real cross-output golden | BLOCKED | no single real source certified across HTML/PDF/DOCX on one SHA |
| G4 P01 Real Golden | CURRENT BLOCKER | primary completion gate |
| G5 Human Acceptance | PENDING | must remain separate from machine QA |

## INPUT audit

### What is correct

The correct semantic model is:

`Source → text + math + figure/diagram + reading order + provenance → DocumentIR`

MST-MATH must not degrade mathematical documents into plain OCR text or opaque page images. Probabilistic recognition evidence must remain sidecar evidence and must not silently overwrite canonical semantics.

### Word

Word is the strongest input path. Native text, OMML, structural numbering, embedded figures and legacy MathType/OLE handling have substantially mature machinery.

**Do not redefine the Word architecture before demo.** Focus only on real-golden closeout and clean convergence of the latest machine evidence.

### Scanned PDF blocker

Page rasterization alone is not acceptance. The release gate requires proof that MST-MATH reconstructs a mathematical document correctly:

- page → regions;
- text/math/figure separation;
- reading order;
- question ownership;
- formula identity;
- figure ownership;
- provenance to page/region coordinates.

Required state:

`SCANNED_PDF_PAGE_RASTERIZATION = PASS`

`SCANNED_PDF_IMAGE_PIPELINE_REUSE = PASS`

`SCANNED_PDF_DOCUMENT_IR = PASS`

`SCANNED_PDF_READING_ORDER = PASS`

### Hybrid PDF blocker

Hybrid PDF is higher risk than pure scanned PDF because native and raster content can describe the same material. The pipeline must prevent:

- duplicate text;
- duplicate formulas;
- duplicate figures;
- wrong coordinate transforms;
- wrong question ownership;
- conflicting reading order.

Required state:

`HYBRID_NATIVE_EXTRACTION = PASS`

`HYBRID_RASTER_EXTRACTION = PASS`

`HYBRID_COORDINATE_MAPPING = PASS`

`HYBRID_TEXT_RECONCILIATION = PASS`

No hybrid PASS is allowed until the system proves deterministic native/raster reconciliation.

## DATA PROCESSING audit

### Preserve the existing authority chain

`DocumentIR → QuestionIR → QA → Question Bank → consumer`

Do not replace DocumentIR/QuestionIR before demo. Current processing strengths include:

- provenance preservation;
- no automatic promotion of imported content to APPROVED;
- explicit quarantine/review paths;
- fail-closed math/domain verification;
- approved-only consumer reuse;
- stale source/hash/identity checks;
- real-world unverified content returning HUMAN_REVIEW_REQUIRED.

### Missing product-level proof

Module-level PASS is insufficient. MST-MATH still needs a single **Semantic E2E Golden** proving one real object across the whole chain:

`REAL SOURCE`

`→ Unified Ingest`

`→ DocumentIR`

`→ QuestionIR`

`→ Math/Figure/Provenance QA`

`→ Question Bank or LessonIR`

`→ P01`

`→ HTML + PDF + DOCX`

For every stage, certify these invariants:

- source identity preserved;
- question identity preserved;
- source order preserved unless an explicitly authorized pedagogical reflow records original/rendered order and reason;
- mathematical semantics preserved;
- figure ownership preserved;
- answer/key semantics preserved;
- provenance preserved;
- no silent fallback;
- any unresolved ambiguity fails closed.

## OUTPUT audit

### Current recovery strengths

P01 recovery has the correct renderer separation:

- HTML math → KaTeX;
- PDF → XeLaTeX;
- DOCX → native OMML;
- semantic source should remain one LessonIR/DocumentIR lineage.

### Release-level interpretation

`file generated` is not equivalent to `output PASS`.

Acceptance has three levels:

1. **Semantic correctness** — content, math, figures, answers, ordering and provenance are correct.
2. **Structural correctness** — document structure, equation objects, pagination, figure containment and numbering are correct.
3. **Visual/human correctness** — native Word/PDF/browser artifacts are usable in real teaching conditions.

Synthetic fixtures can validate contracts but cannot close G4.

### Cross-output Golden requirements

One authorized real source must create HTML, PDF and DOCX from one semantic lineage. Compare at minimum:

- semantic signature;
- block/question count;
- formula count and normalized formula identity;
- figure count and asset hash;
- answer/key alignment;
- source order/rendered order trace;
- source provenance;
- no missing/duplicated content.

## DevOps / governance critique

The biggest current risk is truth fragmentation across:

- `integration/mst-math-convergence-v1`;
- unified INPUT successor branches/PRs;
- P01 implementation/recovery branches/PRs;
- local PC INPUT completion evidence;
- Mac OUTPUT recovery evidence;
- separate draft notation/video/visual/retrieval successors.

Before pilot, product truth must collapse to:

`ONE CONVERGENCE SHA → ONE REAL E2E QA → ONE PILOT SHA`

Do not certify a product assembled conceptually from different SHAs.

## Mandatory next sequence

1. **FEATURE FREEZE** — no new core feature work before demo closeout.
2. **Close Scanned + Hybrid PDF INPUT** using real goldens.
3. **Reconcile latest INPUT implementation onto convergence** as a bounded successor; do not blindly merge stale/diverged branch history.
4. **Create Semantic E2E Golden** from real Word/PDF input.
5. **Reconcile P01 OUTPUT recovery** onto the same convergence lineage.
6. **Fix environment/full regression blockers**, including native `canvas.node` on the certification machine.
7. **Run real cross-output P01 certification**: HTML + PDF + DOCX from the same source and semantic lineage.
8. **Run native/human acceptance** in Word, browser and PDF viewer/print context.
9. **Freeze pilot SHA**, protect the release lineage, merge/tag only after G4/G5 PASS.

## Priority matrix

### P0 — before demo

- scanned PDF closeout;
- hybrid PDF closeout;
- real standalone image golden;
- INPUT successor convergence;
- Semantic E2E Golden;
- P01 output convergence;
- full regression;
- real cross-output golden;
- native/human acceptance;
- pilot SHA freeze and release gate.

### P1 — after product closeout

- Math Notation full cross-output assurance;
- native Slides equation path;
- rendered-frame Manim notation QA;
- GeoGebra request → automatic 2D/3D educational figure generation;
- semantic video pipeline production closeout.

### P2 — later successor work

- PostgreSQL canonical problem store migration;
- hybrid mathematical retrieval expansion;
- additional teacher-app features;
- nonessential visual redesign.

## Release policy

The following remain mandatory:

- `NO EVIDENCE → NO PASS`;
- LOCKED/CANONICAL artifacts are immutable in place;
- all changes to locked authorities require a versioned successor;
- synthetic fixture PASS does not substitute for real golden evidence;
- machine QA cannot substitute for human product acceptance;
- unresolved mathematical or document ambiguity must fail closed.

## Final state declaration

```text
MST-MATH PRODUCT STATE
==============================
ARCHITECTURE             = STRONG
G1 CONVERGENCE TRUTH     = PASS
G2 QA TRUTH              = PASS
G3 TEACHER WORKFLOW      = PASS

INPUT WORD               = PASS
INPUT DIGITAL PDF        = PASS
INPUT IMAGE              = PARTIAL_REAL_GOLDEN
INPUT SCANNED PDF        = BLOCKED
INPUT HYBRID PDF         = BLOCKED

DATA PROCESSING          = STRONG / NEEDS REAL END-TO-END PROOF

P01 HTML                 = PASS_WITH_LIMITATIONS
P01 PDF                  = PASS_WITH_SYNTHETIC_LIMITATION
P01 DOCX                 = CONTRACT_PASS / NATIVE_ACCEPTANCE_PENDING
FULL OUTPUT REGRESSION   = BLOCKED
REAL CROSS-OUTPUT GOLDEN = BLOCKED

G4 P01 REAL GOLDEN       = CURRENT BLOCKER
G5 HUMAN ACCEPTANCE      = PENDING
DEMO GATE                = CLOSED
FEATURE EXPANSION        = FROZEN
NEXT MISSION             = INPUT → REAL E2E → OUTPUT CONVERGENCE
```

## Decision

MST-MATH should not be redesigned. The next phase is not architecture expansion. It is:

**CONVERGE → PROVE → CERTIFY → RELEASE.**
