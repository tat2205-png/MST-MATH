# MST-MATH — PROJECT CONTROL

> Operational status file for the current repository. Development rules and authority are defined by the current operating override in `AGENTS.md`. Historical Math AI Studio release records below are retained as evidence only and must not be used to certify the current MST-MATH working baseline.

Last updated: 2026-09-17

---

# CURRENT PRIORITY

## ▶ NOW

MST-MATH — repair and certify the existing working baseline on Windows PC. No improvement or feature expansion.

## ⏭ NEXT

Windows native certification: release gate, Local Render Bridge, current real input goldens, and artifact review on the exact repair SHA.

---

# CURRENT MST-MATH STATUS

CURRENT_MODULE=MST_MATH_CORE
CURRENT_TASK=WORKING_BASELINE_REPAIR
TASK_STATUS=NOT_TESTED
BRANCH=repair/mst-math-working-baseline-2026-09-17
HEAD=SEE_NPM_RUN_PROJECT_STATUS
QA=STATIC_RELEASE_CHECKS_PASS_ON_REPAIR_BRANCH_WINDOWS_CERTIFICATION_NOT_TESTED
BLOCKERS=WINDOWS_NATIVE_RELEASE_GATE_AND_CURRENT_REAL_GOLDENS_NOT_TESTED
WORKTREE=SEE_NPM_RUN_PROJECT_STATUS
NEXT_TASK=WINDOWS_NATIVE_CERTIFICATION
WORKING_BASELINE=NOT_TESTED

Current certification authority is Windows PC. GitHub Actions static checks are necessary evidence but are not sufficient to set `WORKING_BASELINE=PASS`.

---

# HISTORICAL MATH AI STUDIO STATUS SNAPSHOT

The section below is retained to preserve the published v1.3.1 history. Its `STABLE`, `COMPLETE`, and `BLOCKERS=NONE` statements describe that historical release/program state only; they are not current MST-MATH certification claims.

| # | Module | Historical Status | Progress | Historical Task | Historical Next |
|---|---|---|---:|---|---|
| 01 | Math AI Studio Core | 🟢 STABLE | 100% | REL-02 complete | Release-candidate review |
| 02 | Image Animation Engine | 🟢 STABLE | 90% | IA-7 Runtime | Segmentation Runtime |
| 03 | NA Math Visual Engine | 🟡 ACTIVE | 60% | MV-0 | Dynamic Dependencies |
| 04 | Fold / Unfold Engine | 🟡 ACTIVE | 72% | Pattern Authoring | Cut / Crease / Fold |
| 05 | Question Bank | 🟢 STABLE | 100% | QB-3A acceptance | Program baseline frozen |
| 06 | Document Engine | 🟡 ACTIVE | 60% | QB DOCX pipeline complete | PDF/image ingestion separately scoped at that time |
| 07 | NA Math Textbook Style | 🟡 ACTIVE | 65% | Renderer QA | Layout Stability |
| 08 | Exam Generator | ⚪ PLANNED | 20% | Architecture | After Question Bank |
| 09 | Classroom Game Engine | ⚪ PLANNED | 15% | Architecture | After Question Bank |
| 10 | Student Assessment | ⚪ PLANNED | 15% | Architecture | After Question Bank |

---

# STATUS LEGEND

For current MST-MATH certification use only: `PASS`, `FAIL`, `BLOCKED`, `NOT_TESTED`, `REVIEW_REQUIRED`.

Historical emoji states below are retained only for the old Math AI Studio snapshot:

- 🟢 STABLE — completed and QA verified in the historical program
- 🟡 ACTIVE — being developed in the historical program
- 🔵 NEXT — next scheduled historical work
- 🟠 BLOCKED — historical dependency/runtime blocker
- 🔴 FAIL — historical QA/runtime failure
- ⚪ PLANNED — historical not-started state

---

# HISTORICAL RELEASE v1.3.1

HISTORICAL_CURRENT_MODULE=QUESTION_BANK
HISTORICAL_CURRENT_TASK=MAS-INT-02
HISTORICAL_TASK_STATUS=PROGRAM_COMPLETE
HISTORICAL_BRANCH=integration/mas-post-ux01-final-convergence
HISTORICAL_QA=MAS_INT_02_ALL_MANDATORY_GATES_PASS
HISTORICAL_BLOCKERS=NONE
HISTORICAL_NEXT_TASK=E2E-TEACHER-01_DEFERRED

QUESTION_BANK_PROGRAM=COMPLETE
QUESTION_BANK_BASELINE=943186335bcc380994111cac6535aefd3ac9e2a9
MAS_INT_01=COMPLETE
POST_QB_STUDIO_INTEGRATION=READY
POST_QB_STUDIO_BASELINE=f9865122223df3dcdfc1051dbc73ba7a6fc5dc3f
POST_QB_STUDIO_BASELINE_STATUS=FROZEN_FOR_UX_01
REQUIRED_RUNTIME_BLOCKERS=NONE
UX_01=COMPLETE
TEACHER_GOLDEN_WORKFLOW=AVAILABLE
TEACHER_GOLDEN_WORKFLOW_BASELINE=32d015717a6f383cd7249966a5e663bbd8d2337b
TEACHER_GOLDEN_WORKFLOW_BASELINE_STATUS=FROZEN_FOR_E2E_TEACHER_01
MAS_INT_02=COMPLETE
POST_UX01_FINAL_CONVERGENCE=READY
POST_UX01_FINAL_CONVERGENCE_BASE=ab7d97894f4e76310b2898f9dc23a756ab093918
POST_UX01_UX01_BASE=19f2763e821d6e93e4f03f1eb1310a05ac31711e

FEATURE_FREEZE=ENABLED
RELEASE=v1.3.1
STATUS=PUBLISHED_FROZEN
TAG=v1.3.1
RELEASE_HEAD=57956cd3d55482e8252d7ece1b2d617831c492f0
MAINTENANCE_LINE=1.3.x
MAIN_POLICY=RELEASE_STABLE
MAINTENANCE_POLICY=HOTFIX_ONLY

Release versions are authoritative through annotated Git tags. The historical npm package metadata was synchronized to the published final release version (`1.3.1`). The annotated `v1.3.1` tag and GitHub Release remain immutable publication records.

## HISTORICAL REL-01 VERIFIED RELEASE EVIDENCE

- Architecture QA: PASS
- TypeScript QA: PASS
- Build QA: PASS
- Math regression: 60/60 PASS
- Regression suites: 14/14 PASS
- Exam QA: PASS
- Studio integration: PASS
- Auto Repair: PASS with Local Render Bridge healthy on port 8765
- Source QA Full: PASS
- QA CI: PASS
- Release Gate: PASS
- Golden Path: PASS

These are historical v1.3.1 results, not evidence for the current MST-MATH repair SHA.

## HISTORICAL QUESTION BANK PROGRAM

QB-1A through QB-2D were complete. QB-3A final acceptance verified the historical DOCX → Question Bank → Assessment → Game / Solution-Video / Export program. The executable acceptance map is recorded in `QB_3A_ACCEPTANCE.md`.

QUESTION_BANK_TASK=QB-3A
QUESTION_BANK_STATUS=PROGRAM_COMPLETE
QUESTION_BANK_BRANCH=feature/qb-document-pipeline
QUESTION_BANK_HEAD=SEE_GIT_BRANCH
QUESTION_BANK_REGRESSION=25_OR_MORE_SUITES_REQUIRED
QUESTION_BANK_FEATURE_FREEZE=ENABLED
QUESTION_BANK_BLOCKERS=NONE
QUESTION_BANK_NEXT_TASK=NONE_QUESTION_BANK_PROGRAM_COMPLETE

---

# PROJECT RULES

1. Never mark a task DONE without QA evidence.
2. Do not overwrite or rewrite stable engines unnecessarily.
3. Prefer additive/brownfield integration.
4. Every completed task must update this file.
5. Every completed task must define NEXT_TASK.
6. Branch and HEAD must be recorded after meaningful milestones.
7. FAIL or BLOCKED states must never be hidden.
8. Do not change roadmap priority without explicit approval.
9. Current MST-MATH certification claims must follow `AGENTS.md`, use the restricted status vocabulary, and use Windows PC as the production authority.