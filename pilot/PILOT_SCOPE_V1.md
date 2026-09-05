# MST-MATH INTERNAL PILOT V1 — SCOPE CONTRACT

STATUS=PROVISIONAL_PENDING_MAC_CONVERGENCE
PILOT_ID=MST-MATH-INTERNAL-PILOT-V1
PILOT_BRANCH=pilot/mst-math-internal-v1
BASELINE_SOURCE=integration/mst-math-convergence-v1
BASELINE_SOURCE_SHA=655e21d01a2536566d99cb7df944ee870896ff1e
FEATURE_FREEZE=ENABLED_AFTER_FINAL_BASELINE
HUMAN_ACCEPTANCE_REQUIRED=YES
SELF_CERTIFICATION_FORBIDDEN=YES

## Purpose

Prove the smallest complete teacher workflow needed for an internal MST-MATH demo/pilot without turning pilot closure into a full-production release program.

## What this pilot must prove

1. A teacher can ingest an authorized real DOCX source.
2. Detected questions preserve source identity/provenance and can enter the Question Bank through existing authority gates.
3. A teacher can review/select questions through the Teacher Workspace.
4. Deterministic mathematics/answer QA remains authoritative and fail-closed.
5. The application can create usable assessment/learning-material artifacts through supported output paths.
6. An eligible verified problem can generate a solution/video through the real runtime.
7. Unsupported or insufficient inputs are blocked rather than fabricated.
8. Normal demo use is app-first; terminal commands are certification/operations only.

## Pilot critical path

SOURCE → DOCX INGEST → DOCUMENT/QUESTION AUTHORITY → QUESTION BANK → TEACHER WORKSPACE → MATH/QA → ASSESSMENT / LEARNING MATERIAL → PDF/DOCX → VERIFIED SOLUTION/VIDEO → OUTPUT QA

## Explicitly outside Internal Pilot V1

The following must not block Internal Pilot V1 unless they break the critical path above:

- large-scale PostgreSQL/retrieval migration;
- new vector/search infrastructure;
- broad P01–P12 completion;
- new classroom-game variants;
- analytics expansion;
- public multi-user SaaS/deployment scaling;
- visual redesign unrelated to P0/P1 usability;
- successor standards that are not runtime-certified for the pilot path.

## Change policy after final freeze

Allowed changes:
- P0 correctness/data-loss/security defects;
- P1 critical-workflow defects;
- pilot runtime blockers;
- regression fixes required to restore a previously passing gate.

Deferred changes:
- feature expansion;
- cosmetic-only redesign;
- architecture replacement not required by pilot evidence;
- unrelated refactors.

Every post-freeze fix must create a new pilot RC and rerun Gate 2 and affected Gate 3 cases from zero.

## Gate model

- G1 BASELINE: final convergence SHA selected, clean and frozen.
- G2 MACHINE: fresh current-SHA machine certification passes.
- G3 REAL E2E: Golden A/B/C plus Negative A pass with evidence.
- G4 HUMAN: Product Owner completes human acceptance; P0=0 and P1=0.

Internal Pilot GO requires G1=PASS, G2=PASS, G3=PASS, G4=PASS.

## Current authority note

This branch intentionally starts from convergence SHA `655e21d...`. That convergence commit explicitly records that Mac structural-numbering work remains separate and must later be transplanted onto the updated convergence lineage. Therefore G1 is PROVISIONAL, not PASS, until that workstream is reconciled or explicitly excluded by the Human Product Owner.
