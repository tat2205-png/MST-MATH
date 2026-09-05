# MST-MATH — PROJECT CONTROL / MASTER STATUS

> Operational source of truth for the current MST-MATH stabilization, coordination, and final-product convergence program.
> Historical certification/release evidence remains immutable and is not rewritten here.

LAST_UPDATED=2026-09-05
CONTROL_MODE=FINAL_PRODUCT_CONVERGENCE
EXECUTION_MODEL=PARALLEL_BOUNDED_PC_MAC
FEATURE_EXPANSION=FROZEN_UNLESS_INDEPENDENT_AND_EXPLICITLY_APPROVED
MAIN_PROMOTION=BLOCKED_UNTIL_STABLE_BASELINE
REPORT_GOVERNANCE=RECEIVE_AND_REVIEW_ACTIVE_WORKSTREAM_REPORTS_BEFORE_NEXT_ASSIGNMENT
CONTROL_ROOM_IS_SINGLE_CONVERGENCE_POINT=YES
FINAL_PRODUCT_CONVERGENCE_ISSUE=33

---

# 0. ACTIVE CONTROL ROOM DIRECTIVE

PRIORITY=HIGH
STATUS=ACTIVE_COORDINATION

## Mac

MAC_STATUS=RUNNING
MAC_FINAL_REPORT=NOT_RECEIVED
MAC_CURRENT_TASK=MAC-B3_AUTHORITATIVE_TEACHER_WORKSPACE_CONSUMER
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

`REPORT → VERIFY → PATH_COLLISION_CHECK → SEMANTIC_CONTRACT_COLLISION_CHECK → CANONICAL_GOVERNANCE_CHECK → REGRESSION_TEST_CHECK → CONVERGE → MASTER_STATUS_UPDATE → NEXT_TASK_ASSIGNMENT`

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

Target architecture:

`MST-MATH → product DNA/root → canonical authorities → output profiles → QA → renderers`

Legacy PiMath history and compatibility IDs are preserved until a controlled successor migration is reconciled on the current convergence lineage. No blind global rename and no side-lineage canonical promotion.

Primary workflow:

`Nguồn → Xử lý → Thiết kế → QA → Xuất`

Locked operating principles:
- UI does not own business truth.
- AI proposes; deterministic/specialist engines validate; QA gates; renderers publish.
- Math/Geometry correctness precedes visual approval.
- provenance/source fidelity are mandatory.
- AUTHOR ONCE — RENDER MANY.
- one semantic source must preserve meaning across outputs.
- UNKNOWN is not PASS.
- local PASS is not workstream completion.
- one semantic family has one active canonical authority.

---

# 2. LIVE REPOSITORY / CONVERGENCE TRUTH

MAIN_BRANCH=main
MAIN_HEAD=598b35a42b284ab17d7de6ba3023458a36e8f42d
MAIN_STATUS=FROZEN_FOR_STABILIZATION
MAIN_BRANCH_PROTECTION=OFF
MAIN_REQUIRED_CHECKS=OFF

SOLE_CONVERGENCE_BRANCH=integration/mst-math-convergence-v1
CONVERGENCE_HEAD=c80c8afa413e8090a14d3ea80c62db9560a1ffde
CONVERGENCE_STATUS=P0_AND_STANDARD_AUTHORITY_CONVERGED

P0_RUNTIME_TRUTH_PR=20
P0_RUNTIME_TRUTH_MERGE_COMMIT=f74f0e199e2973c2cabb214ee441f9577824bbc8
P0_RUNTIME_TRUTH_STATUS=MERGED_POST_MERGE_CI_PASS

STANDARD_AUTHORITY_UNIFICATION_PR=25
STANDARD_AUTHORITY_UNIFICATION_MERGE_COMMIT=c80c8afa413e8090a14d3ea80c62db9560a1ffde
STANDARD_AUTHORITY_UNIFICATION_STATUS=MERGED_POST_MERGE_CI_PASS

DATA_ACCESS_OPTIMIZATION_PR=31
DATA_ACCESS_OPTIMIZATION_HEAD=ec733d8bb01100685f77a8e4fd589b8bba63089e
DATA_ACCESS_OPTIMIZATION_STATUS=DRAFT_CI_GREEN_NOT_MERGED
DATA_ACCESS_OPTIMIZATION_CLASS=DIRECT_CONVERGENCE_CANDIDATE

MAC_ACTIVE_BRANCH=audit/mac-b-teacher-readiness-consumer-v1
MAC_REMOTE_HEAD=4ad5c66ec5486cc0459aceff2047e75d20a0be5a
MAC_ACTIVE_STATUS=RUNNING_LOCAL_WORK_NOT_YET_REPORTED

---

# 3. OPEN PR CONVERGENCE MATRIX

Rule:

`SIDE_LINEAGE_PR != DIRECT_MERGE_CANDIDATE`

All active feature/authority work must eventually be reconciled against the sole convergence branch.

## PR #31 — Question Bank data access

CLASS=DIRECT_CONVERGENCE_CANDIDATE
STATUS=DRAFT_CI_GREEN
BASE=integration/mst-math-convergence-v1
DECISION=MERGE_HOLD_UNTIL_MAC_B3_REPORT_AND_COLLISION_REVIEW

## PR #26 — Canonical MST-MATH migration

CLASS=SELECTIVE_TRANSPLANT_REQUIRED
STATUS=DRAFT
BASE=main_STALE_RELATIVE_TO_CONVERGENCE
RISK=84_FILES_SHARED_AUTHORITY_REGISTRY_RUNTIME_IDENTITY
DECISION=DO_NOT_DIRECT_MERGE

Before transplant:
- reconcile current standards-family authority
- reconcile compatibility-ID policy
- separate human-facing brand migration from machine-authority migration
- rerun full convergence gates

## PR #27 — Output Visual Identity

CLASS=DEPENDENT_TRANSPLANT_AFTER_IDENTITY_RECONCILIATION
STATUS=DRAFT
BASE=PR26_SIDE_LINEAGE
DECISION=DO_NOT_DIRECT_MERGE

Preserve:
- approved content-presentation policy
- pedagogical reflow rules
- student workspace rules
- answer/end-of-document policy

But split authority payload from runtime implementation and re-certify on convergence.

## PR #29 — Math Notation Assurance

CLASS=VALUABLE_TRANSPLANT_REQUIRED
STATUS=DRAFT
BASE=main_STALE_RELATIVE_TO_CONVERGENCE
TARGETED_CI=PASS
FULL_CONVERGENCE_CERTIFICATION=NOT_YET_DONE
DECISION=DO_NOT_DIRECT_MERGE

Preserve registry/adapter/test design, but transplant only after authority collision review and broader output evidence.

## PR #32 — Semantic Icons V1.2

CLASS=HUMAN_APPROVED_SUCCESSOR_HOLD
STATUS=DRAFT
BASE=PR27_SIDE_LINEAGE
REPO_LEVEL_CI=NOT_PROVEN
RUNTIME_ACTIVATION=FORBIDDEN
DECISION=IMPORT_AS_INACTIVE_VERSIONED_SUCCESSOR_ONLY_AFTER_CONVERGENCE_REVIEW

## PR #9 — Input/Output + P01 architecture docs

CLASS=DOC_ONLY_TRANSPLANT_CANDIDATE
STATUS=DRAFT
DECISION=TRANSPLANT_DOCS_TO_CURRENT_CONVERGENCE; DO_NOT_MERGE_OLD_BASE

## PR #8 — Old brand migration

CLASS=SUPERSEDE_CANDIDATE_EVIDENCE_ONLY
STATUS=DRAFT
DECISION=DO_NOT_MERGE; RETAIN_HISTORY_UNTIL_SUCCESSOR_RECONCILIATION_COMPLETE

## PR #4 — Legacy Document/Question Bank

CLASS=FORENSIC_SOURCE_ONLY
STATUS=DRAFT
DECISION=NO_FULL_MERGE

Selective future recovery only:
- CFB
- MathType/MTEF semantic recovery
- OMML completion
- source-region classification if corpus proves need

Current DocumentIR / QuestionIR remain authority.

---

# 4. CURRENT WORKSTREAM STATUS

## PC — Workstream A

ROLE=BACKEND_INPUT_DOCUMENT_QUESTION_CI_SECURITY

Reports received and reviewed:
- `MST_MATH_PC_S2_REPORT`
- `MST_MATH_PC_LEGACY_CAPABILITY_AUDIT_REPORT`

Architecture decisions:
- MathType/MTEF semantic recovery is a valid missing capability.
- recovery must be through Document Engine adapters.
- current DocumentIR and QuestionIR remain authority.
- legacy identity authority must not return.
- full PR #4 merge/cherry-pick is forbidden.
- source-region classification is future bounded capability.

Current directive:

`PRESERVE_CURRENT_WORK → NO_NEW_UNAPPROVED_TASK → PROTECT_BACKEND/QUESTION_BANK/CONTRACTS → WAIT_FOR_CONTROL_ROOM`

## Mac — Workstream B

ROLE=TEACHER_WORKSPACE_UI_CONSUMER_HUMAN_ACCEPTANCE
ACTIVE_TASK=MAC-B3_AUTHORITATIVE_TEACHER_WORKSPACE_CONSUMER
REPORT=MST_MATH_MAC_B3_REPORT_PENDING

Required invariant:

`UI_CONSUMES_AUTHORITY; UI_DOES_NOT_RECREATE_AUTHORITY`

Allowed ownership:
- `src/components/teacher/**`
- `src/services/teacherWorkflowTypes.ts`
- focused consumer tests/evidence

Forbidden:
- backend readiness authority
- QuestionIR / DocumentIR authority
- segmentation/question identity
- server export guard
- PC Input/Question paths
- semantic icon registry
- brand migration
- Geometry/FOLD
- unrelated data-access work

---

# 5. FINAL PRODUCT CONVERGENCE PROGRAM

TRACKING_ISSUE=33
TARGET=ONE_STABLE_PRODUCT_LINEAGE

## C0 — Governance truth
1. receive Mac B3 final report
2. verify report against actual diff/tests
3. collision-check Mac vs current convergence and PR #31
4. update Master Control

## C1 — Stabilization convergence
1. converge PR #31 if collision-free
2. post-merge convergence CI
3. remediate evidence-driven QA / proxy-PASS debt
4. remediate provider runtime-state semantics
5. open only bounded data-call improvements

## C2 — Product authority convergence
1. create identity successor from fresh convergence
2. transplant Math Notation Assurance
3. transplant Output Content Presentation policy
4. import Semantic Icons V1.2 as inactive approved successor
5. activate no successor without root/binding successor + regression + human approval

## C3 — Teacher product surface
1. authoritative Teacher Workspace
2. Teacher Home / Advanced Studio boundary
3. Contextual AI Actions
4. evidence-driven QA UI
5. accessibility/classroom readability

## C4 — Input fidelity and data scale
1. selective MathType/MTEF recovery
2. lightweight DTO + lazy figure assets
3. binary upload + original-byte SHA256
4. unified Source Router
5. Verified Artifact Envelope / BankContext
6. benchmark 1k/10k/50k → decide FTS/SQLite/AssetStore

## C5 — Output/golden products
1. P01 real learning-material golden
2. DOCX/PDF/HTML/Slides/Video cross-render certification
3. output-policy enforcement
4. semantic-icon multi-render certification
5. human acceptance

## C6 — Promotion

Promote convergence to main only after stable-baseline gates and appropriate human acceptance pass on one lineage.

---

# 6. CLEANUP / DATAFLOW PROGRAM

CLEAN_UNIFY_PROGRAM=ACTIVE_PLANNING
PLANNING_BRANCH=planning/mst-math-clean-unify-v1
IMPLEMENTATION_ROUND=HOLD_UNTIL_MAC_REPORT_RECONCILIATION
DATAFLOW_ISSUE=30

Core rule:

`DECODE ONCE → NORMALIZE ONCE → CLASSIFY ONCE → VERIFY CONDITIONALLY → CACHE EVIDENCE → RENDER ON DEMAND`

PR #31 proves:
- repository decoded-snapshot cache
- pure snapshot query path
- assessment single-snapshot access
- deterministic candidate indexes
- regression guard
- benchmark harness

PR31_CI_CORE_QUALITY=PASS
PR31_CI_QUESTION_AUTHORITY=PASS
PR31_MERGE=HOLD

Next data-line priorities after report gate:
1. observability bytes/latency/cache/AI calls
2. lightweight Question DTO + lazy assets
3. multipart/binary upload + source hash
4. unified Source Router
5. artifact IDs/content hashes
6. shared BankContext
7. intent DAG + deterministic-first routing
8. fail-closed VisualIR / SceneIR renderer split
9. benchmark-driven storage evolution

Optimization rule:

`REMOVE_DUPLICATE_WORK_NOT_SAFETY_RESPONSIBILITY`

---

# 7. CANONICAL / STANDARD GOVERNANCE

Active rule:

`ONE_SEMANTIC_FAMILY → ONE_ACTIVE_CANONICAL_AUTHORITY`

But:

`SAME_FAMILY != SAME_SCOPE`

Historical/compatibility standards are preserved and not rewritten.

For locked/canonical/approved standards:
- no direct in-place semantic edit
- successor version required
- impact analysis required
- conflict check required
- regression required
- human approval required before canonical/locked activation

Current semantic-icon runtime authority on convergence remains V1.1 until a versioned successor binding is explicitly certified and approved.

PR #32 V1.2 is an approved successor candidate, not active runtime authority.

---

# 8. OPEN CONTROL ITEMS

ISSUE_11=Semantic Icon convergence / multi-render certification
ISSUE_13=Protect main / required CI
ISSUE_14=P01 real learning-material golden case
ISSUE_21=Legacy MathType/MTEF/OMML capability reconciliation
ISSUE_22=Provider connection-state semantics
ISSUE_23=Idea & Improvement Backlog
ISSUE_24=Real-World Question Validation
ISSUE_28=Product/Pedagogy/AI/UX re-audit
ISSUE_30=Dataflow Optimization
ISSUE_33=Final Product Convergence V1

PR_31=DATA_ACCESS_DIRECT_CONVERGENCE_CANDIDATE
PR_26=IDENTITY_TRANSPLANT_REQUIRED
PR_27=OUTPUT_VISUAL_TRANSPLANT_REQUIRED
PR_29=NOTATION_TRANSPLANT_REQUIRED
PR_32=ICON_SUCCESSOR_HOLD
PR_9=P01_DOC_TRANSPLANT_CANDIDATE
PR_8=OLD_BRAND_SUPERSEDE_CANDIDATE
PR_4=LEGACY_FORENSIC_SOURCE_ONLY

---

# 9. ACTIVE BLOCKERS / RISKS

B1=MAC_B3_REPORT_PENDING
B2=CROSS_MACHINE_RECONCILIATION_PENDING
B3=MAIN_BRANCH_PROTECTION_OFF
B4=PRODUCT_IDENTITY_SIDE_LINEAGES_NOT_RECONCILED
B5=P01_REAL_GOLDEN_CASE_NOT_RUN
B6=VIDEO_LOCAL_PORTABILITY_WORK_REQUIRES_SAFE_DISPOSITION
B7=LEGACY_PR4_CAPABILITY_NOT_IMPLEMENTATION_CONVERGED
B8=PROVIDER_STATUS_SEMANTICS_NOT_YET_CLEAN
B9=QA_PROXY_PASS_DEBT_REQUIRES_EVIDENCE_DRIVEN_REMEDIATION
B10=PR31_GREEN_BUT_HELD_FOR_MAC_COLLISION_REVIEW
B11=PR26_PR27_PR29_PR32_SIDE_LINEAGE_CHAIN_REQUIRES_TRANSPLANT_NOT_MERGE

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
R15 TRANSIENT_EXTERNAL_FAILURE != PROVEN_VULNERABILITY
R16 STANDARD_TOOLCHAIN_TYPES_MUST_BE_EXPLICIT
R17 LOCAL_OR_PARTIAL_PASS != WORKSTREAM_COMPLETE
R18 PARALLEL_EXECUTION != PARALLEL_SELF_COORDINATION
R19 SHARED_AUTHORITY_REQUIRES_SINGLE_WRITER
R20 PERFORMANCE_OPTIMIZATION_MUST_PRESERVE_SEMANTICS_AND_BE_BENCHMARK_DRIVEN
R21 ONE_PROJECT=ONE_CONVERGENCE_TARGET
R22 HUMAN_APPROVED_SUCCESSOR != ACTIVE_RUNTIME_AUTHORITY
R23 SIDE_LINEAGE_GREEN != SAFE_DIRECT_MERGE

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
- STANDARD_AUTHORITY_GATE=PASS
- PRODUCT_IDENTITY_CONVERGENCE_GATE=PASS
- DATAFLOW_REGRESSION_GATE=PASS
- NO_PARALLEL_ACTIVE_AUTHORITY=YES
- NO_HIDDEN_DIRTY_DEPENDENCY=YES

Then:
- P01_REAL_E2E_GATE=PASS
- cross-output golden evidence as required
- branch protection + required checks ON or explicit release-blocking disposition
- Human Acceptance appropriate to promoted product surface

Only then may the project leave STABILIZATION and be promoted to `main` by controlled PR.

---

CURRENT_DECISION=FINAL_PRODUCT_CONVERGENCE_PROGRAM_ACTIVE_BUT_WRITE_CONVERGENCE_HOLDS_FOR_MAC_B3_REPORT
NEXT_HARD_GATE=RECEIVE_MAC_B3_FINAL_REPORT_THEN_VERIFY_AND_COLLISION_CHECK
NEXT_CONVERGENCE_CANDIDATE=PR31_IF_MAC_COLLISION_CHECK_PASS
NEXT_ASSIGNMENT=HOLD

CONTROL_ROOM_DIRECTIVE=REPORT_VERIFY_RECONCILE_CONVERGE_ASSIGN
