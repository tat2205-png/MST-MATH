# MST-MATH — PROJECT CONTROL / MASTER STATUS

> Operational source of truth for the current MST-MATH stabilization and coordination program.
> Historical certification/release evidence remains immutable and is not rewritten here.

LAST_UPDATED=2026-09-05
CONTROL_MODE=STABILIZATION_AND_COORDINATION
EXECUTION_MODEL=PARALLEL_BOUNDED_PC_MAC
FEATURE_EXPANSION=FROZEN_UNLESS_INDEPENDENT_AND_EXPLICITLY_APPROVED
MAIN_PROMOTION=BLOCKED_UNTIL_STABLE_BASELINE
REPORT_GOVERNANCE=RECEIVE_AND_REVIEW_ACTIVE_WORKSTREAM_REPORTS_BEFORE_NEXT_ASSIGNMENT
CONTROL_ROOM_IS_SINGLE_CONVERGENCE_POINT=YES

---

# 0. ACTIVE CONTROL ROOM DIRECTIVE — 2026-09-05

PRIORITY=HIGH
STATUS=ACTIVE_COORDINATION

## Mac

MAC_STATUS=RUNNING
MAC_FINAL_REPORT=NOT_RECEIVED
MAC_CURRENT_TASK=CONTINUE_CURRENT_ASSIGNED_WORK
MAC_NEW_FEATURE=FORBIDDEN
MAC_PC_PROTECTED_SCOPE_TOUCH=FORBIDDEN

Local or partial PASS results do not imply workstream completion.
Mac is complete only after:

`CURRENT_TASK_COMPLETED → REQUIRED_QA_COMPLETED → FINAL_REPORT_GENERATED → REPORT_SENT_TO_CONTROL_ROOM`

## PC

PC_STATUS=PRESERVE_AND_HOLD_FOR_COORDINATION
PC_NEW_UNAPPROVED_FEATURE=HOLD
PC_CROSS_CUTTING_WRITE=FORBIDDEN_UNLESS_CONTROL_ROOM_APPROVES
PC_FULL_LEGACY_MERGE=FORBIDDEN
PC_CURRENT_BACKEND_QUESTION_BANK_STATE=PRESERVE

PC may not self-assign the next task while Mac remains active.

## Mandatory convergence cycle

`REPORT → VERIFY → PATH_COLLISION_CHECK → SEMANTIC_CONTRACT_COLLISION_CHECK → CANONICAL_GOVERNANCE_CHECK → REGRESSION_TEST_CHECK → MASTER_STATUS_UPDATE → NEXT_TASK_ASSIGNMENT`

Forbidden transition:

`MACHINE_DONE → MACHINE_SELF_ASSIGNS_NEXT_TASK`

## Shared components

SHARED_COMPONENT_POLICY=SINGLE_WRITER_AT_A_TIME

Shared components include:
- shared contracts
- canonical IR
- schemas
- metadata authorities
- API interfaces
- MST-MATH DNA / canonical standards
- cross-machine contracts

If both machines need the same shared authority:

`COLLISION_DETECTED → HOLD → CONTROL_ROOM_SELECT_OWNER`

## Canonical governance

For every `LOCKED / CANONICAL / APPROVED` component:

`IN_PLACE_EDIT=FORBIDDEN`

Required change path:

`CURRENT_CANONICAL → VERSIONED_SUCCESSOR → IMPACT_ANALYSIS → CONFLICT_CHECK → REGRESSION_TEST → HUMAN_APPROVAL → APPROVED → CANONICAL → LOCKED`

Locked rule:

`LOCKED DOES NOT MEAN UNCHANGEABLE FOREVER. LOCKED MEANS IMMUTABLE IN PLACE. ALL CHANGES REQUIRE A VERSIONED SUCCESSOR.`

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
- UNKNOWN is not PASS.
- local PASS is not workstream completion.

---

# 2. LIVE REPOSITORY / CONVERGENCE TRUTH

MAIN_BRANCH=main
MAIN_HEAD=598b35a42b284ab17d7de6ba3023458a36e8f42d
MAIN_STATUS=FROZEN_FOR_STABILIZATION
MAIN_BRANCH_PROTECTION=OFF
MAIN_REQUIRED_CHECKS=OFF

CONVERGENCE_BRANCH=integration/mst-math-convergence-v1
CONVERGENCE_HEAD=c80c8afa413e8090a14d3ea80c62db9560a1ffde
CONVERGENCE_STATUS=P0_AND_STANDARD_AUTHORITY_CONVERGED

AUTHORITY_CONVERGENCE_PR=15
AUTHORITY_CONVERGENCE_PR_STATUS=MERGED

P0_RUNTIME_TRUTH_PR=20
P0_RUNTIME_TRUTH_MERGE_COMMIT=f74f0e199e2973c2cabb214ee441f9577824bbc8
P0_RUNTIME_TRUTH_STATUS=MERGED_TO_CONVERGENCE_POST_MERGE_CI_PASSED

STANDARD_AUTHORITY_UNIFICATION_PR=25
STANDARD_AUTHORITY_UNIFICATION_MERGE_COMMIT=c80c8afa413e8090a14d3ea80c62db9560a1ffde
STANDARD_AUTHORITY_UNIFICATION_STATUS=MERGED_TO_CONVERGENCE_POST_MERGE_CI_PASSED

DATA_ACCESS_OPTIMIZATION_PR=31
DATA_ACCESS_OPTIMIZATION_BRANCH=perf/mst-math-data-access-v1
DATA_ACCESS_OPTIMIZATION_HEAD=ec733d8bb01100685f77a8e4fd589b8bba63089e
DATA_ACCESS_OPTIMIZATION_STATUS=DRAFT_CI_GREEN_NOT_MERGED
DATA_ACCESS_OPTIMIZATION_SELF_PROMOTION=FORBIDDEN

PC_AUTHORITY_BRANCH=fix/mst-math-canonical-question-integrity-v1
PC_AUTHORITY_HEAD=cc34f55c9ca4341a3ae0c0b45c8caab0f179736a
PC_AUTHORITY_STATUS=PRESERVED_AS_EVIDENCE_AUTHORITY_NOW_CONVERGED

MAC_LEGACY_BRANCH=feature/mac-b-human-acceptance-remediation-v1
MAC_LEGACY_STATUS=STALE_REFERENCE_ONLY_DO_NOT_MERGE_WHOLE

MAC_ACTIVE_BRANCH=audit/mac-b-teacher-readiness-consumer-v1
MAC_ACTIVE_BASE=4ad5c66ec5486cc0459aceff2047e75d20a0be5a
MAC_ACTIVE_STATUS=RUNNING_AUTHORIZED_BOUNDED_UI_CONSUMER_WORK

BRAND_BRANCH=chore/mst-math-brand-migration-v1
BRAND_PR=8
BRAND_STATUS=HOLD_OLD_LINEAGE_REBUILD_FROM_FRESH_CONVERGENCE_LATER

---

# 3. CURRENT WORKSTREAM STATUS

## PC — Workstream A

ROLE=BACKEND_INPUT_DOCUMENT_QUESTION_CI_SECURITY

Reports received and reviewed:
- `MST_MATH_PC_S2_REPORT`
- `MST_MATH_PC_LEGACY_CAPABILITY_AUDIT_REPORT`

Architecture decisions from legacy audit:
- MathType/MTEF semantic recovery is a valid missing capability.
- recovery must be through Document Engine adapters.
- current DocumentIR and QuestionIR remain authority.
- legacy identity authority must not return.
- full PR #4 merge/cherry-pick is forbidden.
- source-region classification is retained as a future bounded capability.

Current PC directive:

`PRESERVE_CURRENT_WORK → DO_NOT_OPEN_NEW_UNAPPROVED_TASK → PROTECT_BACKEND/QUESTION_BANK/CONTRACTS → REPORT_STATUS → WAIT_FOR_CONTROL_ROOM`

PR #31 note:
- CI PASS does not equal permission for PC to start another task.
- PR #31 remains draft and not merged while cross-machine coordination is pending.

## Mac — Workstream B

ROLE=TEACHER_WORKSPACE_UI_CONSUMER_HUMAN_ACCEPTANCE

Active task:
`MAC-B3 — AUTHORITATIVE TEACHER WORKSPACE CONSUMER`

Allowed ownership:
- `src/components/teacher/**`
- `src/services/teacherWorkflowTypes.ts`
- focused Teacher Workspace consumer tests/evidence

Forbidden:
- backend readiness authority
- QuestionIR / DocumentIR authority
- segmentation/question identity
- server export guard
- PC Input/Question paths
- Semantic Icon registry
- Brand migration
- Geometry/FOLD
- unrelated runtime/data-access branches

Required invariant:
`UI_CONSUMES_AUTHORITY; UI_DOES_NOT_RECREATE_AUTHORITY`

Mac report status:
`MST_MATH_MAC_B3_REPORT=PENDING`

Mac completion rule:

`CURRENT_TASK_COMPLETED → REQUIRED_QA_COMPLETED → FINAL_REPORT_GENERATED → REPORT_SENT_TO_CONTROL_ROOM`

---

# 4. REPORT / DECISION GOVERNANCE

Mandatory cycle:

`ASSIGN → EXECUTE → STOP → REPORT → VERIFY → RE-AUDIT → PATH_COLLISION_CHECK → SEMANTIC_CONTRACT_COLLISION_CHECK → CANONICAL_CHECK → TEST_CHECK → UPDATE_MASTER → DECIDE → NEXT_ASSIGNMENT`

Rules:
- NO REPORT → NO NEXT TASK.
- NO LIVE VERIFICATION → NO PASS CLAIM.
- NO MASTER UPDATE → NO NEW ASSIGNMENT.
- NO CROSS-WORKSTREAM CHECK → NO PARALLEL WRITE.
- a workstream that finishes first waits; it does not self-start the next task.
- partial/local PASS never equals full workstream completion.
- PC and Mac may execute in parallel but may not self-coordinate parallel writes.

Assignment contract must state:

`TASK_OWNER=PC|MAC`

`ALLOWED_PATHS=`

`FORBIDDEN_PATHS=`

`SHARED_CONTRACT_POLICY=`

`CANONICAL_POLICY=`

`REQUIRED_TESTS=`

`STOP_CONDITIONS=`

Decision states:
`ACCEPT / ACCEPT_WITH_RISK / REMEDIATE / HOLD / BLOCK / CONVERGE / CLOSE`

---

# 5. CLEANUP / DATAFLOW PROGRAM STATUS

CLEAN_UNIFY_PROGRAM=PLANNED
PLANNING_BRANCH=planning/mst-math-clean-unify-v1
IMPLEMENTATION_ROUND=HOLD_UNTIL_MACHINE_REPORT_RECONCILIATION

Dataflow principle:

`DECODE ONCE → NORMALIZE ONCE → CLASSIFY ONCE → VERIFY CONDITIONALLY → CACHE EVIDENCE → RENDER ON DEMAND`

Issue #30 tracks Dataflow Optimization.

PR #31 currently proves a bounded data-access optimization direction:
- repository snapshot cache
- snapshot query reuse
- assessment single-snapshot access
- deterministic import candidate indexes
- regression guard
- benchmark harness

PR31_CI_CORE_QUALITY=PASS
PR31_CI_QUESTION_AUTHORITY=PASS
PR31_MERGE=HOLD_FOR_CONTROL_ROOM_RECONCILIATION

Future dataflow work remains unassigned:
- binary/multipart document upload instead of base64 JSON
- lazy figure delivery
- server-side artifact IDs/content hashes
- deterministic-first verification routing
- Verified Artifact Envelope
- Visual/Scene IR renderer-on-demand
- DOCX no-op fast path
- benchmark-driven JSON vs SQLite decision

---

# 6. IDEA / IMPROVEMENT GOVERNANCE

IDEA_BACKLOG_ISSUE=23
STATUS=ACTIVE_CONTROL_BACKLOG

Governing rule:
`IDEA_CAPTURED != APPROVED != SCHEDULED != IMPLEMENTED != CANONICAL`

Lifecycle:
`CAPTURE → CLASSIFY → REVIEW → SCORE → CONFLICT_CHECK → ROADMAP_POSITION → IMPLEMENT/HOLD/REJECT → RE-AUDIT`

Retained directions include:
- Teacher Home V2 / Teacher-first launcher
- Recent Work / Quick Tools
- Friendly Academic Workspace Icons
- Classroom Tools Foundation
- Classroom Activity Engine
- Contextual AI Action Bar
- Evidence-driven QA
- AI evidence-state model
- Real-World Question Validation
- Quick Math as façade over existing Math/Graph/Verifier engines
- Semantic Geometry Tools / Compass golden case after SG-0A
- P01 real executable learning-material golden case
- provider status semantics cleanup
- legacy MathType/MTEF/OMML capability reconciliation
- dataflow optimization and benchmark-driven storage evolution

Ideas may evolve during stabilization but implementation remains HOLD unless explicitly promoted by Control Room.

---

# 7. CANONICAL / STANDARD GOVERNANCE

Active rule:

`ONE SEMANTIC FAMILY → ONE ACTIVE CANONICAL AUTHORITY`

But:

`SAME FAMILY != SAME SCOPE`

Historical/compatibility standards are preserved and not rewritten.

For locked/canonical/approved standards:
- no direct in-place semantic edit
- successor version required for semantic change
- impact analysis required
- conflict check required
- regression required
- human approval required before successor becomes canonical/locked

Semantic Icon active authority:
`PIMATH-DNA-SEMANTIC-ICONS-V1.1`

Legacy V1.0 remains compatibility/history only.

---

# 8. OPEN CONTROL ITEMS

ISSUE_11=Semantic Icon V1.1 convergence / multi-render certification
ISSUE_13=Protect main / required CI
ISSUE_14=P01 real learning-material golden case
ISSUE_21=Legacy MathType/MTEF/OMML capability reconciliation
ISSUE_22=Provider connection-state semantics
ISSUE_23=Idea & Improvement Backlog
ISSUE_24=Real-World Question Validation runtime convergence
ISSUE_28=Product/Pedagogy/AI/UX re-audit
ISSUE_30=Dataflow Optimization
PR_31=Question Bank data-access optimization draft

P0/P1 classification remains evidence-driven; no issue is closed without exit evidence.

---

# 9. ACTIVE BLOCKERS / RISKS

B1=MAC_B3_REPORT_PENDING
B2=CROSS_MACHINE_RECONCILIATION_PENDING
B3=MAIN_BRANCH_PROTECTION_OFF
B4=BRAND_MIGRATION_NOT_CONVERGED
B5=P01_REAL_GOLDEN_CASE_NOT_RUN
B6=VIDEO_LOCAL_PORTABILITY_WORK_REQUIRES_SAFE_DISPOSITION
B7=LEGACY_PR4_CAPABILITY_NOT_IMPLEMENTATION_CONVERGED
B8=PROVIDER_STATUS_SEMANTICS_NOT_YET_CLEAN
B9=QA_PROXY_PASS_DEBT_REQUIRES_EVIDENCE_DRIVEN_REMEDIATION
B10=DATAFLOW_PR31_GREEN_BUT_NOT_YET_RECONCILED_WITH_ACTIVE_MAC_WORK

No blocker may be hidden or downgraded without evidence.

---

# 10. ENGINEERING LESSONS LOCKED

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
R15 TRANSIENT EXTERNAL SECURITY-SERVICE FAILURE != PROVEN VULNERABILITY
R16 STANDARD TOOLCHAIN AMBIENT TYPES MUST BE EXPLICITLY DECLARED
R17 LOCAL_OR_PARTIAL_PASS != WORKSTREAM_COMPLETE
R18 PARALLEL_EXECUTION != PARALLEL_SELF_COORDINATION
R19 SHARED_AUTHORITY_REQUIRES_SINGLE_WRITER
R20 PERFORMANCE_OPTIMIZATION_MUST_PRESERVE_SEMANTICS_AND_BE_BENCHMARK_DRIVEN

---

# 11. STABLE BASELINE / RELEASE GATE

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

CURRENT_DECISION=MAC_CONTINUES_CURRENT_TASK_PC_PRESERVES_AND_HOLDS
NEXT_HARD_GATE=RECEIVE_MAC_B3_FINAL_REPORT_THEN_CONTROL_ROOM_RECONCILE_ACTIVE_PC_MAC_STATE
NEXT_MAJOR_ACTION=WAIT_FOR_MACHINE_REPORTS_RECONCILE_THEN_ASSIGN
NEXT_ASSIGNMENT=HOLD

CONTROL_ROOM_DIRECTIVE=REPORT_VERIFY_RECONCILE_ASSIGN
