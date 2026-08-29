# MATH AI STUDIO — PROJECT CONTROL

> Single Source of Truth for Math AI Studio development.

Last updated: MANUAL

---

# CURRENT PRIORITY

## ▶ NOW

MAS-INT-02 — Post-UX-01 final convergence complete

## ⏭ NEXT

E2E-TEACHER-01 — deferred

---

# PROJECT STATUS

| # | Module | Status | Progress | Current Task | Next |
|---|---|---|---:|---|---|
| 01 | Math AI Studio Core | 🟢 STABLE | 100% | REL-02 complete | Release-candidate review |
| 02 | Image Animation Engine | 🟢 STABLE | 90% | IA-7 Runtime | Segmentation Runtime |
| 03 | NA Math Visual Engine | 🟡 ACTIVE | 60% | MV-0 | Dynamic Dependencies |
| 04 | Fold / Unfold Engine | 🟡 ACTIVE | 72% | Pattern Authoring | Cut / Crease / Fold |
| 05 | Question Bank | 🟢 STABLE | 100% | QB-3A acceptance | Program baseline frozen |
| 06 | Document Engine | 🟡 ACTIVE | 60% | QB DOCX pipeline complete | PDF/image ingestion remains separately scoped |
| 07 | NA Math Textbook Style | 🟡 ACTIVE | 65% | Renderer QA | Layout Stability |
| 08 | Exam Generator | ⚪ PLANNED | 20% | Architecture | After Question Bank |
| 09 | Classroom Game Engine | ⚪ PLANNED | 15% | Architecture | After Question Bank |
| 10 | Student Assessment | ⚪ PLANNED | 15% | Architecture | After Question Bank |

---

# STATUS LEGEND

- 🟢 STABLE — completed and QA verified
- 🟡 ACTIVE — currently being developed
- 🔵 NEXT — next scheduled work
- 🟠 BLOCKED — blocked by dependency/runtime
- 🔴 FAIL — QA/runtime failure
- ⚪ PLANNED — not started

---

# CURRENT RELEASE

CURRENT_MODULE=QUESTION_BANK
CURRENT_TASK=MAS-INT-02
TASK_STATUS=PROGRAM_COMPLETE
BRANCH=integration/mas-post-ux01-final-convergence
HEAD=SEE_NPM_RUN_PROJECT_STATUS
QA=MAS_INT_02_ALL_MANDATORY_GATES_PASS
BLOCKERS=NONE
WORKTREE=SEE_NPM_RUN_PROJECT_STATUS
NEXT_TASK=E2E-TEACHER-01_DEFERRED

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

Release versions are authoritative through annotated Git tags. The npm package
metadata is synchronized to the published final release version (`1.3.1`).
The annotated `v1.3.1` tag and GitHub Release are immutable publication
records. No new product features should be committed directly to `main`.

## REL-01 VERIFIED RELEASE EVIDENCE

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

The Local Render Bridge is a mandatory release-QA prerequisite. Start it with
`npm run bridge:start` and verify `http://127.0.0.1:8765/health` reports
`READY` before running `npm run release:gate`.

## QUESTION BANK PROGRAM

QB-1A through QB-2D are complete. QB-3A final acceptance verifies the complete
DOCX → Question Bank → Assessment → Game / Solution-Video / Export program.
The executable acceptance map is recorded in `QB_3A_ACCEPTANCE.md`.

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
