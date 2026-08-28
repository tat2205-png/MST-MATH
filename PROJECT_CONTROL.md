# MATH AI STUDIO — PROJECT CONTROL

> Single Source of Truth for Math AI Studio development.

Last updated: MANUAL

---

# CURRENT PRIORITY

## ▶ NOW

QB-3A — Question Bank final acceptance and baseline freeze

## ⏭ NEXT

Deferred to project control after Question Bank program acceptance

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
CURRENT_TASK=QB-3A
TASK_STATUS=PROGRAM_COMPLETE
BRANCH=feature/qb-document-pipeline
HEAD=SEE_NPM_RUN_PROJECT_STATUS
QA=QB_3A_ALL_MANDATORY_GATES_PASS
BLOCKERS=NONE
WORKTREE=SEE_NPM_RUN_PROJECT_STATUS
NEXT_TASK=NONE_QUESTION_BANK_PROGRAM_COMPLETE

FEATURE_FREEZE=ENABLED
RC_VERSION=v1.3-rc.1
RC_TAG=v1.3-rc.1

Release versions are authoritative through annotated Git tags. The npm package
metadata remains the existing non-published application scaffold (`0.0.0`),
consistent with the prior `v1.1` and `v1.2` release checkpoints.

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
