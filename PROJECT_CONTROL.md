# MST-MATH — PROJECT CONTROL / MASTER STATUS

> Operational source of truth for the current MST-MATH stabilization program.
> Historical certification/release evidence remains immutable and is not rewritten here.

LAST_UPDATED=2026-09-05
CONTROL_MODE=STABILIZATION
EXECUTION_MODEL=PARALLEL_BOUNDED_PC_MAC
FEATURE_EXPANSION=FROZEN
MAIN_PROMOTION=BLOCKED_UNTIL_STABLE_BASELINE
REPORT_GOVERNANCE=RECEIVE_ALL_ACTIVE_WORKSTREAM_REPORTS_BEFORE_NEXT_ASSIGNMENT

---

# 1. PRODUCT / ARCHITECTURE IDENTITY

PRODUCT_UMBRELLA=MST-MATH
APPLICATION=Math AI Studio
STANDARDS_LAYER=NA-MATH

Target identity architecture:

`MST-MATH → MST-MATH-DNA-V1.0 → canonical authorities → output profiles → renderers`

Legacy `PIMATH-*` machine IDs and certified PiMath history remain compatibility/history evidence. No blind global rename.

Primary workflow:

`Nguồn → Xử lý → Thiết kế → QA → Xuất`

Locked operating principles:
- UI does not own business truth.
- AI proposes; deterministic engines validate; QA gates; renderers publish.
- Math/Geometry correctness precedes visual approval.
- provenance/source fidelity are mandatory.
- AUTHOR ONCE — RENDER MANY.
- one semantic source must preserve meaning across outputs.

---

# 2. LIVE REPOSITORY TRUTH

MAIN_BRANCH=main
MAIN_HEAD=598b35a42b284ab17d7de6ba3023458a36e8f42d
MAIN_STATUS=FROZEN_FOR_STABILIZATION
MAIN_BRANCH_PROTECTION=OFF
MAIN_REQUIRED_CHECKS=OFF

CONVERGENCE_BRANCH=integration/mst-math-convergence-v1
CONVERGENCE_HEAD=4ad5c66ec5486cc0459aceff2047e75d20a0be5a
CONVERGENCE_STATUS=AUTHORITIES_CONVERGED_STABILIZATION_BASE

AUTHORITY_CONVERGENCE_PR=15
AUTHORITY_CONVERGENCE_PR_STATUS=MERGED
SUPERSEDED_PC_PR=12
SUPERSEDED_PC_PR_STATUS=CLOSED_SUPERSEDED

P0_RUNTIME_TRUTH_BRANCH=fix/mst-math-p0-runtime-truth-v1
P0_RUNTIME_TRUTH_PR=20
P0_RUNTIME_TRUTH_HEAD=1ed6c3d607aea1d49df615b200e7a2efc1b81057
P0_RUNTIME_TRUTH_STATUS=CI_RECERTIFICATION_IN_PROGRESS

PC_AUTHORITY_BRANCH=fix/mst-math-canonical-question-integrity-v1
PC_AUTHORITY_HEAD=cc34f55c9ca4341a3ae0c0b45c8caab0f179736a
PC_AUTHORITY_STATUS=PRESERVED_AS_EVIDENCE_AUTHORITY_NOW_CONVERGED

MAC_LEGACY_BRANCH=feature/mac-b-human-acceptance-remediation-v1
MAC_LEGACY_HEAD=acf9e6b8973ca06486e8733960defd755ea8f8c9
MAC_LEGACY_STATUS=STALE_REFERENCE_ONLY_DO_NOT_MERGE_WHOLE

MAC_ACTIVE_BRANCH=audit/mac-b-teacher-readiness-consumer-v1
MAC_ACTIVE_BASE=4ad5c66ec5486cc0459aceff2047e75d20a0be5a
MAC_ACTIVE_STATUS=AUTHORIZED_BOUNDED_UI_CONSUMER_WORK

BRAND_BRANCH=chore/mst-math-brand-migration-v1
BRAND_HEAD=f38fbc066fd9bd539e72b6a7acaebcb6940be350
BRAND_PR=8
BRAND_STATUS=HOLD_OLD_LINEAGE_REBUILD_FROM_FRESH_CONVERGENCE_LATER

---

# 3. P0 TECHNICAL STABILIZATION

Confirmed/fixed on PR #20 branch:
- Video regeneration must carry authoritative `verification` and fail closed.
- fabricated UI telemetry removed.
- `/api/studio/status` = capability/orchestrator contract.
- `/api/studio/runtime-status` = runtime engine truth contract.
- canonical Python/Manim probe uses repo-local `.venv`, not arbitrary PATH Python.
- convergence authority gates run after `core-quality` on PR and convergence push.
- explicit A3 authoritative readiness/export-guard tests added to authority CI.
- GitHub Actions checkout/setup-node upgraded to v5.
- High/Critical npm vulnerability gate added without blind auto-fix.

PC-S2 report received:
- security attempt #1 failed because npm audit endpoint returned 503.
- subsequent security gate reproduced no High/Critical dependency vulnerability.
- `NPM_SECURITY_HIGH_CRITICAL=0`.
- architecture PASS.
- typecheck exposed missing Vite `ImportMetaEnv` ambient type contract.

Control Room narrow repair:
- added `vite-env.d.ts` with `/// <reference types="vite/client" />`.
- repair commit: `1ed6c3d607aea1d49df615b200e7a2efc1b81057`.
- no dependency/runtime/domain authority changed.

CURRENT_P0_GATE=PR20_CI_RUN_18_FULL_RECERTIFICATION
DO_NOT_MERGE_PR20_UNTIL_ALL_REQUIRED_GATES_PASS

Moderate npm findings:
- remain non-P0 until separately dispositioned.
- no blind `npm audit fix`.

---

# 4. WORKSTREAM OWNERSHIP

## PC — Workstream A

ROLE=BACKEND_INPUT_DOCUMENT_QUESTION_CI_SECURITY

Current report state:
`MST_MATH_PC_S2_REPORT=RECEIVED_AND_REVIEWED`

PC-S2 final decision:
`NO_NEXT_PC_TASK_YET`

Reason:
- PR #20 recertification still running after Control Room type repair.
- active-workstream governance requires Mac report before next assignment.

Future PC direction after dual-report review:
- audit legacy PR #4 capability before reimplementation.
- focus on MathType/MTEF V5/OMML/CFB/question-boundary/source-object capability reconciliation.
- no new PDF/Image pipeline from scratch.

## Mac — Workstream B

ROLE=TEACHER_WORKSPACE_UI_CONSUMER_HUMAN_ACCEPTANCE

Active task:
`MAC-B3 — AUTHORITATIVE TEACHER WORKSPACE CONSUMER`

Allowed ownership:
- `src/components/teacher/**`
- `src/services/teacherWorkflowTypes.ts`
- focused Teacher Workspace consumer tests/evidence.

Forbidden:
- backend readiness authority
- QuestionIR / DocumentIR authority
- segmentation/question identity
- server export guard
- PC Input/Question paths
- Semantic Icon registry
- Brand migration
- Geometry/FOLD
- PR #20 runtime-truth paths

Required invariant:
`UI_CONSUMES_AUTHORITY; UI_DOES_NOT_RECREATE_AUTHORITY`

Mac report status:
`MST_MATH_MAC_B3_REPORT=PENDING`

---

# 5. REPORT / DECISION GOVERNANCE

Mandatory cycle:

`ASSIGN → EXECUTE → STOP → REPORT → VERIFY → RE-AUDIT → UPDATE MASTER → CROSS-WORKSTREAM CHECK → DECIDE → NEXT ASSIGNMENT`

Rules:
- NO REPORT → NO NEXT TASK.
- NO LIVE VERIFICATION → NO PASS CLAIM.
- NO MASTER UPDATE → NO NEW ASSIGNMENT.
- NO CROSS-WORKSTREAM CHECK → NO PARALLEL WRITE.
- receive all currently active workstream reports before issuing the next work round.
- a workstream that finishes first waits; it does not self-start the next task.

Decision states:
`ACCEPT / ACCEPT_WITH_RISK / REMEDIATE / HOLD / BLOCK / CONVERGE / CLOSE`

---

# 6. IDEA / IMPROVEMENT GOVERNANCE

IDEA_BACKLOG_ISSUE=23
STATUS=ACTIVE_CONTROL_BACKLOG

Governing rule:
`IDEA_CAPTURED != APPROVED != SCHEDULED != IMPLEMENTED != CANONICAL`

Lifecycle:
`CAPTURE → CLASSIFY → REVIEW → SCORE → CONFLICT CHECK → ROADMAP POSITION → IMPLEMENT/HOLD/REJECT → RE-AUDIT`

Initial retained directions include:
- Teacher Home V2 / Teacher-first launcher.
- Recent Work / Quick Tools.
- Friendly Academic Workspace Icons.
- Classroom Tools Foundation.
- Classroom Activity Engine.
- Question/Lesson → Activity conversion.
- Quick Math as façade over existing Math/Graph/Verifier engines.
- Semantic Geometry Tools / Compass golden case after SG-0A.
- P01 real executable learning-material golden case.
- provider status semantics cleanup.
- legacy MathType/MTEF/OMML capability reconciliation.

Ideas may evolve during stabilization but implementation remains HOLD unless explicitly promoted by Control Room.

---

# 7. SEMANTIC ICON / WORKSPACE ICON

ACTIVE_CONTENT_ICON_AUTHORITY=MST-MATH Semantic Icon System V1.1
MACHINE_ID=PIMATH-DNA-SEMANTIC-ICONS-V1.1
STATUS=LOCKED_CANONICAL_APPROVED_ON_MAIN

Operational certification remains incomplete:
- active/stale V1.0 authority references still require closure.
- real PDF/DOCX/HTML/Slides/Video consumption not fully proven.
- P01 icon multi-render golden case pending.

Tracking: Issue #11.

Workspace navigation direction:
`MST-MATH-WORKSPACE-ICON-DIRECTION-V1.0`

Roles:
- WORKSPACE_LESSON
- WORKSPACE_ASSESSMENT
- WORKSPACE_MATERIAL
- WORKSPACE_GEOMETRY
- WORKSPACE_MEDIA
- WORKSPACE_CLASSROOM

Rule:
`ONE ICON AUTHORITY → CONTENT SEMANTIC SCOPE + WORKSPACE NAVIGATION SCOPE`

Emoji are UX reference only; production uses MST-MATH-owned Friendly Academic SVG assets.

---

# 8. TEACHER EXPERIENCE / PRODUCT IDEAS

Approved direction only, implementation HOLD during stabilization:
- Teacher Job-to-be-Done UI.
- SIMPLE OUTSIDE — POWERFUL INSIDE.
- integrated Teacher Workspace, not app zoo.
- Assessment Generate/Matrix/Similar/Variant remain workflows of one Assessment Engine.
- Classroom/Game content must reuse existing Question/Assessment semantic authority.
- Teacher Home V2, Classroom Tools, Activity Engine, intelligent activity conversion are roadmap/UI-application opportunities, not new core architecture.

---

# 9. SEMANTIC GEOMETRY ROADMAP

STATUS=ROADMAP_APPROVED_IMPLEMENTATION_HOLD

Locked directions:
- ONE Geometry Core.
- GEOMETRY ≠ VISUAL ≠ ANIMATION.
- GEOMETRIC RESULT ≠ CONSTRUCTION PROCEDURE.
- Geometry Invariant QA mandatory.
- generated Manim code is not geometry source of truth.
- CompassTool = first golden case.
- FOLD and Semantic Geometry Tools reuse the same Geometry Core.

Post-stabilization:
`SG-0A Existing Geometry Authority Audit → SG-0B Contracts → SG-1 Compass → SG-2 SVG+TikZ+Manim → SG-3 integration → SG-4 expansion`

---

# 10. OPEN CONTROL ITEMS

ISSUE_11=Semantic Icon V1.1 convergence / multi-render certification
ISSUE_13=Protect main / required CI
ISSUE_14=P01 real learning-material golden case
ISSUE_19=P0 runtime truth / API uniqueness / CI truthfulness
ISSUE_21=Legacy MathType/MTEF/OMML capability reconciliation
ISSUE_22=Provider connection-state semantics
ISSUE_23=Idea & Improvement Backlog

P0/P1 classification remains evidence-driven; no issue is closed without exit evidence.

---

# 11. ACTIVE BLOCKERS / RISKS

B1=PR20_FULL_RECERTIFICATION_NOT_YET_GREEN
B2=MAC_B3_REPORT_PENDING
B3=MAIN_BRANCH_PROTECTION_OFF
B4=SEMANTIC_ICON_ACTIVE_V1_0_REFERENCES_REMAIN
B5=BRAND_MIGRATION_NOT_CONVERGED
B6=P01_REAL_GOLDEN_CASE_NOT_RUN
B7=VIDEO_LOCAL_PORTABILITY_WORK_REQUIRES_SAFE_DISPOSITION
B8=LEGACY_PR4_CAPABILITY_ORPHAN_NOT_YET_RECONCILED
B9=PROVIDER_STATUS_SEMANTICS_NOT_YET_CLEAN

No blocker may be hidden or downgraded without evidence.

---

# 12. ENGINEERING LESSONS LOCKED

R1 FILE SAME != AUTHORITY SAME
R2 LINEAGE IS A DEPENDENCY
R3 ONE URL = ONE PUBLIC CONTRACT
R4 UI MUST NOT INVENT RUNTIME TRUTH
R5 CLOUD CI MUST NOT FAKE LOCAL-CORPUS CERTIFICATION
R6 REGENERATION MUST NOT BYPASS VERIFICATION
R7 CORRECTNESS > CI SPEED
R8 CANONICAL RUNTIME != RANDOM SYSTEM RUNTIME
R9 PR GREEN != POST-MERGE AUTHORITY GREEN
R10 STALE BRANCH != USELESS BRANCH
R11 AUDIT EXISTING CAPABILITY BEFORE REIMPLEMENTING
R12 FREEZE PRODUCER CONTRACT DURING CONSUMER WORK
R13 SMALL BOUNDED PR > MASS CLEANUP
R14 CRITICAL AUTHORITY TESTS REQUIRE EXPLICIT CI GATES
R15 TRANSIENT EXTERNAL SECURITY-SERVICE FAILURE != PROVEN VULNERABILITY; RETRY/DIAGNOSE BEFORE MUTATING DEPENDENCIES
R16 STANDARD TOOLCHAIN AMBIENT TYPES MUST BE EXPLICITLY DECLARED WHEN APPLICATION CODE USES THEM

---

# 13. STABLE BASELINE / RELEASE GATE

Required on one lineage:
- CONVERGENCE_CI=PASS
- ARCHITECTURE_GATE=PASS
- TYPECHECK_GATE=PASS
- BUILD_GATE=PASS
- REGRESSION_GATE=PASS
- QUESTION_AUTHORITY_GATE=PASS
- UNIFIED_INPUT_GATE=PASS
- AUTHORITATIVE_QA_GATE=PASS
- EXPORT_GUARD_GATE=PASS
- FAIL_CLOSED_GATE=PASS
- P0_RUNTIME_TRUTH_GATE=PASS
- SEMANTIC_ICON_SINGLE_SOURCE_GATE=PASS
- BRAND_IDENTITY_CONVERGENCE_GATE=PASS
- NO_HIDDEN_DIRTY_DEPENDENCY=YES

Then:
- P01_REAL_E2E_GATE=PASS
- branch protection + required checks ON
- Human Acceptance appropriate to promoted product surface

Only then may the project leave STABILIZATION.

---

CURRENT_DECISION=PC_S2_REPORT_REVIEWED_WAIT_FOR_PR20_RECERTIFICATION_AND_MAC_B3_REPORT
NEXT_HARD_GATE=RECEIVE_MAC_B3_REPORT_PLUS_PR20_FULL_GREEN_THEN_CONTROL_ROOM_DUAL_REPORT_REVIEW
NEXT_ASSIGNMENT=HOLD
