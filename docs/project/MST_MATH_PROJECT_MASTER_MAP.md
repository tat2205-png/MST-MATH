# MST-MATH — Project Master Map

Status: ACTIVE SUCCESSOR AUTHORITY  
Effective date: 2026-09-04  
Product: `MST-MATH`  
Application: `Math AI Studio`  
Standards / publishing layer: `NA-MATH`

## 1. Successor rule

MST-MATH is the active successor product identity. The former `PiMath / MATH AI` identity is retained only in historical evidence and explicit compatibility aliases.

The historical master inventory remains at `docs/project/PROJECT_MASTER_MAP.md`. It is not rewritten because it records prior decisions and evidence under the product name that existed when those decisions were made.

The active machine-readable state is `project-state/MST-MATH-PROJECT-STATE.json`.

## 2. Canonical identity hierarchy

1. Human Product Owner decisions
2. `MST-MATH-DNA-V1.0` global identity root
3. Referenced locked child standards and NA-MATH standards
4. Output profiles
5. Module adapters
6. Renderers
7. Heuristic/AI helpers

Legacy `PIMATH-DNA-V1.0` is a compatibility alias only and must not operate as a parallel authority.

## 3. Product pipeline

```text
INPUT
  Image / Word / PDF
       ↓
SAFE PREFLIGHT + INGESTION
       ↓
DocumentIR / assets / provenance
       ↓
QUESTION + KNOWLEDGE PROCESSING
       ↓
Question Bank / source packages / semantic relations
       ↓
OUTPUT ORCHESTRATION
       ├─ Learning material
       ├─ Worksheet / exercise sheet
       ├─ Lesson plan / teacher plan
       ├─ School test / THPTQG / ĐGNL / V-SAT / SAT
       ├─ GeoGebra 2D / 3D
       ├─ Fold / unfold
       ├─ Video lesson
       ├─ Classroom games
       └─ Digital competency learning artifacts
```

Brand migration must not change the mathematics, pedagogy, assessment semantics, or provenance of this pipeline.

## 4. Preserved technical authorities

- DocumentIR remains the canonical document representation.
- Existing QuestionIR / Question Bank authority remains unchanged.
- Figure reconstruction remains an asset/figure capability and must not create a parallel Question Bank.
- GeoGebra and FOLD remain adapter/runtime capabilities under semantic geometry authority.
- Existing math notation and KNTT symbol rules remain authoritative.
- Existing output profile structure remains authoritative; only brand ownership changes during this migration.

## 5. Pedagogical authority

MST-MATH continues to preserve:

- GDPT 2018 alignment.
- Kết nối tri thức mathematical notation and presentation conventions already approved in the repository.
- Mathematical correctness before visual decoration.
- Teacher usability and student cognitive clarity.
- Digital competency integration only when it has a clear pedagogical purpose.

## 6. Current migration

Active branch: `chore/mst-math-brand-migration-v1`  
Base: `feature/pimath-unified-input-v1` at `552fe9001d095aed4abc8057934767b9a04d7269`  
Plan: `docs/migrations/MST_MATH_BRAND_MIGRATION_V1.md`

Migration stages:

- M0 inventory/freeze — in progress
- M1 root identity compatibility — in progress
- M2 runtime/code rename — in progress
- M3 child-standard successor aliases — not started
- M4 active docs/paths — in progress
- M5 repository/local workspace rename — deferred
- M6 QA/promotion — not run

## 7. Safety rule for historical PiMath artifacts

Historical certification, acceptance, release, field-validation, and evidence artifacts may retain PiMath identifiers. Their old naming is part of their provenance.

Active runtime, generated output, new documentation, new scripts, and new project state must use MST-MATH. Any active use of PiMath after migration must be explicitly classified as compatibility-only.

## 8. Promotion gates

No promotion to the production/release line until all are true:

- TypeScript/lint PASS
- build PASS
- architecture QA PASS
- full regression PASS
- brand migration audit PASS
- generated output brand scan PASS
- compatibility alias QA PASS
- no semantic regression in Question Bank / DocumentIR / exam / geometry / GDPT-KNTT layers
- clean worktree / synchronized remote lineage

## 9. Repository rename policy

Do not rename the GitHub repository or local canonical workspace yet. Perform that operation only after M6 passes, so remote redirects, automation, local remotes, scripts, CI, documentation, and developer environments can be migrated in one controlled step.
