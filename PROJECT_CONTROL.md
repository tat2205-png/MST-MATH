# MST-MATH — PROJECT CONTROL / MASTER STATUS

> Operational source of truth for MST-MATH release convergence. Historical evidence remains immutable in Git history, issues, PRs, and audit reports.
> The live Git branch ref is authoritative for the current convergence HEAD; this file records verified evidence/gate state and does not try to self-reference its own future merge SHA.

LAST_UPDATED=2026-09-06
CONTROL_MODE=FINAL_COMPLETION_CUT_V1
CONTROL_CONTRACT_ISSUE=52
FINAL_PRODUCT_CONVERGENCE_ISSUE=33
STATUS=EXECUTING
FEATURE_EXPANSION=FROZEN
NEW_CORE_ARCHITECTURE=FORBIDDEN
SOLE_TARGET=integration/mst-math-convergence-v1
CONVERGENCE_HEAD_AUTHORITY=LIVE_GIT_REF
PRIMARY_PRODUCT=TEACHER_WORKSPACE_PLUS_P01_GOLDEN
PRIMARY_QUALITY_RULE=NO_EVIDENCE_NO_PASS
REAL_WORLD_POLICY=FAIL_OR_REVIEW_CLOSED_UNTIL_VERIFIED
TOOLMATH_LEARNING=UX_ONLY_NO_ARCHITECTURE_COPY
NEXT_PRODUCT_MILESTONE=DEMO_BASELINE
PROMOTION=ONLY_AFTER_6_COMPLETION_GATES_PASS
CURRENT_GATE=G4_P01_REAL_GOLDEN

---

# 0. AUTHORITATIVE EXECUTION ORDER

`CI exact-head → Control Room Truth → Mac B3 evidence reconciliation → QA Truth → Teacher Workflow → P01 Real Golden → Native/Human Acceptance → Protect Main → Merge/Tag Demo`

Important correction:

`MAC_B3_RECONCILIATION` means evidence/report reconciliation, NOT code re-merge. Branch `audit/mac-b-teacher-readiness-consumer-v1@4ad5c66ec5486cc0459aceff2047e75d20a0be5a` is already an ancestor of convergence.

No task may skip forward because a later gate appears technically ready.

---

# 1. VERIFIED REPOSITORY TRUTH

MAIN_BRANCH=main
MAIN_VERIFIED_HEAD=598b35a42b284ab17d7de6ba3023458a36e8f42d
MAIN_STATUS=FROZEN_FOR_RELEASE_CONVERGENCE
MAIN_BRANCH_PROTECTION=OFF
MAIN_REQUIRED_CHECKS=OFF

SOLE_CONVERGENCE_BRANCH=integration/mst-math-convergence-v1
CONVERGENCE_HEAD_AUTHORITY=LIVE_GIT_REF
LAST_VERIFIED_RUNTIME_STABILIZATION_HEAD=24f0d0355d31737ff25133ebcfdc0faafb3527fe
FINAL_COMPLETION_CUT_CONTROL_MERGE=ac1fd402419e1983eabb1031852f8a8c84a29e56
FINAL_COMPLETION_CUT_G1_CLOSE_MERGE=4fa32b73c20da232f80534ca4c23a44f14a0e5d7
G2_QA_TRUTH_MERGE=f1be5666a78004582b54ee6185a9c2387e7e3027
G2_QA_TRUTH_POST_MERGE_CI_RUN=34003050996
G2_QA_TRUTH_POST_MERGE_CI_RUN_NUMBER=61
G2_QA_TRUTH_POST_MERGE_CI=PASS
G3_TEACHER_WORKFLOW_PR=59
G3_TEACHER_WORKFLOW_EXACT_HEAD=1e45011fff5fd28319be2b7d033b83f07c36cafd
G3_TEACHER_WORKFLOW_EXACT_HEAD_CI_RUN=34004533290
G3_TEACHER_WORKFLOW_EXACT_HEAD_CI_RUN_NUMBER=67
G3_TEACHER_WORKFLOW_EXACT_HEAD_CI=PASS
G3_TEACHER_WORKFLOW_MERGE=2fa062b70b08f45d330fe192834c7490bd37ccfe
G3_TEACHER_WORKFLOW_POST_MERGE_CI_RUN=34004729342
G3_TEACHER_WORKFLOW_POST_MERGE_CI_RUN_NUMBER=68
G3_TEACHER_WORKFLOW_POST_MERGE_CI=PASS
CONVERGENCE_STATUS=FINAL_COMPLETION_CUT_G3_CONVERGED

POST_MERGE_CORE_QUALITY=PASS
POST_MERGE_PC_QUESTION_AUTHORITY=PASS
ARCHITECTURE_GATE=PASS
TYPECHECK_GATE=PASS
BUILD_GATE=PASS
REGRESSION_GATE=PASS
QUESTION_AUTHORITY_GATE=PASS
UNIFIED_INPUT_GATE=PASS
AUTHORITATIVE_QA_EXPORT_GUARD=PASS
P0_RUNTIME_TRUTH_GATE=PASS
STANDARD_AUTHORITY_CONTRACTS=PASS

PR31_DATA_ACCESS=MERGED_AND_CERTIFIED
PR31_MERGE_SHA=655e21d01a2536566d99cb7df944ee870896ff1e

MAC_R1_STRUCTURAL_NUMBERING=CONVERGED_BY_SAFE_SUCCESSOR
MAC_R1_SUCCESSOR_PR=41
MAC_R1_SUCCESSOR_MERGE_SHA=1706fd45cea6722bbb7954b96a9381b6dd0449b9
MAC_R1_RECOVERED_SIDE_BRANCH=FORENSIC_ONLY_DO_NOT_MERGE

QA_TRUTH_STABILIZATION_PR=49
QA_TRUTH_STABILIZATION_MERGE_SHA=24f0d0355d31737ff25133ebcfdc0faafb3527fe
QA_PROXY_PASS_REMEDIATION=MERGED_CI_PASS
PROVIDER_RUNTIME_TRUTH_REMEDIATION=MERGED_CI_PASS
CURRICULUM_AI_FAIL_CLOSED_REMEDIATION=MERGED_CI_PASS
VISUAL_ZERO_INFERENCE_FAILURE_GATE=MERGED_CI_PASS
REAL_WORLD_FAIL_CLOSED_PR=57
REAL_WORLD_FAIL_CLOSED_GATE=MERGED_POST_MERGE_CI_PASS

---

# 2. MAC B3 TRUTH

B3_BRANCH=audit/mac-b-teacher-readiness-consumer-v1
B3_REMOTE_HEAD=4ad5c66ec5486cc0459aceff2047e75d20a0be5a
B3_CODE_LINEAGE_IN_CONVERGENCE=YES
B3_CODE_REMERGE_REQUIRED=NO
B3_CODE_REMERGE_FORBIDDEN=YES
B3_HISTORICAL_FINAL_REPORT=NOT_LOCATED
B3_CONTROL_ROOM_EVIDENCE_DISPOSITION=docs/operations/MST_MATH_MAC_B3_EVIDENCE_DISPOSITION_20260906.md
B3_CURRENT_CONSUMER_AUTHORITY_REGRESSION=PASS
B3_G1_EVIDENCE_RECONCILIATION=PASS

Control Room disposition:
- the missing historical standalone final report is explicitly recorded as not located;
- lineage proves B3 code is already contained in convergence;
- `tests/test-teacher-workflow-ux01.ts` verifies UI/runtime isolation, UI/storage isolation, Teacher Workflow service authority, runtime-readiness consumption, source immutability, video reuse authority, and teacher workflow smoke behavior;
- convergence regression containing that test passed before and after the Final Completion Cut control merge;
- no B3 implementation is reopened or re-merged solely to recreate historical reporting.

Invariant:
`UI_CONSUMES_AUTHORITY; UI_DOES_NOT_RECREATE_AUTHORITY`

---

# 3. SIX COMPLETION GATES

## G1 — CONVERGENCE TRUTH

Current state: PASS

Evidence:
- convergence head is resolved from the live Git ref rather than a stale hardcoded SHA
- stabilization exact-head CI PASS
- Final Completion Cut control PR exact-head CI PASS
- Final Completion Cut G1 close merge `4fa32b73...` completed
- G1 post-merge Convergence CI PASS
- Mac R1 structural-numbering convergence PASS
- B3 code lineage is contained in convergence
- B3 historical report gap explicitly dispositioned with current lineage + regression evidence

Exit:
`G1_CONVERGENCE_TRUTH=PASS`

## G2 — QA TRUTH

Current state: PASS

Verified invariants:
- no proxy PASS
- no dimension PASS without dimension-specific evidence
- CONFIGURED != CONNECTED
- unknown curriculum context remains review/unknown
- AI proposal != verified result
- provider/visual failure cannot fabricate mathematical truth
- unverified real-world values/assumptions cannot PASS

Evidence:
- QA/provider/curriculum/visual stabilization merged in PR #49
- remaining real-world fail-closed gap merged in PR #57
- real-world domain without independent verification returns `HUMAN_REVIEW_REQUIRED` with `REAL_WORLD_UNVERIFIED`
- ordinary non-real-world math behavior remains unchanged
- PR #57 exact-head Convergence CI run #60 PASS
- post-merge Convergence CI run #61 on merge `f1be5666...` PASS for core-quality and pc-question-authority

Exit:
`G2_QA_TRUTH=PASS`

## G3 — TEACHER WORKFLOW

Current state: PASS

Verified path:
`Source → Work/Process → QA → Result/Export`

Evidence:
- PR #59 removes static runtime-ready UI truth and makes Teacher Workspace consume existing backend readiness authority;
- the UI response helper accepts the existing `readiness` response envelope rather than creating a second authority;
- assessment/game/video/export affordances consume existing action-readiness capability state;
- assessment status consumes authoritative QA state;
- export re-checks current-artifact readiness immediately before action and fails closed when the artifact or requested format is not authorized;
- server-side export guard remains the final authority and validates assessment/artifact identity, source lineage, QA state, current-artifact readiness, and formats;
- authoritative assessment/question references remain the product lineage source;
- `tests/test-teacher-workflow-ux01.ts` proves real service workflow integration, source immutability, answer isolation, readiness correlation, export readiness, video reuse authority, accessibility/responsive guards, and UI authority consumption;
- PR #59 exact-head CI run #67 PASS for core-quality and pc-question-authority;
- PR #59 merged at `2fa062b70b08f45d330fe192834c7490bd37ccfe`;
- post-merge Convergence CI run #68 PASS for core-quality and pc-question-authority, including architecture, typecheck, build, regression, P0 runtime truth, public readiness/export guard, identity/provenance, and Unified Input gates.

Gate separation:
- G3 certifies machine/product Teacher Workflow on authoritative services;
- real P01 source/output certification belongs to G4;
- native teacher usability and explicit Product Owner acceptance belong to G5.

Exit:
`G3_TEACHER_WORKFLOW=PASS`

## G4 — P01 REAL GOLDEN

Current state: NOT_RUN / BLOCKING
Tracking issue: #14

Minimum required real path:
`REAL DOCX → ingest → DocumentIR → validation → Content Model → Lesson Blueprint → Activity Graph → Visual Requirements → LessonIR → P01_LEARNING_MATERIAL → QA → renderer → PDF + DOCX + HTML`

Required evidence:
- no content loss
- math correctness/typography retained
- figure/table ownership correct
- semantic icon identity consistent under current active authority
- pagination/layout valid
- semantic equivalence across minimum outputs
- provenance retained
- accessibility does not rely on icon alone

Exit:
`P01_REAL_E2E_GATE=PASS`
`P01_MATH_TYPOGRAPHY_QA=PASS`
`P01_OUTPUT_SEMANTIC_EQUIVALENCE_QA=PASS`

## G5 — NATIVE / HUMAN ACCEPTANCE

Current state: NOT_RUN / BLOCKING

Required:
- native demo runtime on target machine(s)
- Local Render Bridge/runtime dependencies where required
- real authorized artifacts, not synthetic-only fixtures
- teacher-facing usability/readability check
- P0=0
- P1=0
- explicit Human Product Owner acceptance

AI/machine evidence cannot set Human Acceptance PASS.

Exit:
`G5_NATIVE_HUMAN_ACCEPTANCE=PASS`

## G6 — RELEASE GOVERNANCE

Current state: BLOCKED_BY_G4_TO_G5

Required:
- freeze final promotion SHA
- no unresolved parallel authority that affects Demo Baseline
- main branch protection enabled or explicitly dispositioned by Product Owner
- required CI checks configured/verified
- controlled convergence→main promotion PR

Exit before promotion:
`G6_RELEASE_GOVERNANCE=PASS`

Promotion action after G1–G6 PASS:
`Protect Main → controlled merge convergence→main → post-merge CI → tag Demo Baseline`

---

# 4. OUT OF COMPLETION CUT

Forbidden unless a failed completion gate provides direct evidence that the work is necessary:
- new product features
- new core architecture
- QuestionIR semantic redesign
- DocumentIR semantic redesign
- new parallel geometry/question/document authority
- SQLite/PostgreSQL/vector/search-stack migration
- full legacy PR #4 merge
- broad canonical brand/authority rewrite
- Semantic Icon V1.2 runtime activation
- FOLD/Geometry feature expansion
- unrelated dependency/toolchain upgrades
- speculative optimization without benchmark evidence

ToolMath learning policy:
`OBSERVE UX PATTERNS → ADAPT ONLY NON-DESTRUCTIVE UX → DO NOT COPY ARCHITECTURE OR AUTHORITY MODEL`

---

# 5. REAL-WORLD VALIDATION RULE

For real-world mathematics/data:
- mathematical calculation correctness is necessary but insufficient
- source values, assumptions, units, time/context, feasibility, and answer plausibility must be verified where applicable
- unsupported or stale real-world assumptions remain REVIEW/FAIL CLOSED
- no generated story/data may be promoted to source fact

Rule:
`REAL_WORLD_UNVERIFIED → NO_PASS`

Current Completion Cut implementation:
- current schema does not contain an independent real-world source/human verification authority;
- therefore real-world domain problems fail closed to `HUMAN_REVIEW_REQUIRED` rather than inventing a PASS path;
- adding a future verified real-world authority requires a separately governed successor decision, not an implicit provider assertion.

---

# 6. AUTHORITY / VERSION GOVERNANCE

`ONE_SEMANTIC_FAMILY → ONE_ACTIVE_CANONICAL_AUTHORITY`

`LOCKED DOES NOT MEAN UNCHANGEABLE FOREVER. LOCKED MEANS IMMUTABLE IN PLACE. ALL CHANGES REQUIRE A VERSIONED SUCCESSOR.`

No Completion Cut task is authorized to activate a canonical successor unless the gate specifically requires it and Product Owner approval is explicit.

Historical `PIMATH-*` compatibility identifiers are preserved where required. Human-facing product name remains MST-MATH.

---

# 7. CURRENT BLOCKERS

B1=P01_REAL_GOLDEN_NOT_RUN
B2=NATIVE_HUMAN_ACCEPTANCE_NOT_RUN
B3=MAIN_BRANCH_PROTECTION_OFF

Not current blockers anymore:
- Control Room truth / stale hardcoded convergence head
- Mac B3 report/evidence reconciliation
- PR31 merge hold
- Mac R1 structural-numbering recovery
- QA proxy-PASS remediation
- provider configured-vs-connected remediation
- curriculum silent Grade 12/domain defaults
- fabricated visual fallback
- unverified real-world automatic PASS
- Teacher Workflow product E2E / UI authority-consumer gap

These are closed by current convergence/control evidence and must not be reopened without regression evidence.

---

# 8. CONTROL ROOM LOOP

`UPDATE → RE-AUDIT → MEASURE → COMPARE → ADJUST → DECIDE`

Mandatory lifecycle:
`DEFINE → ASSIGN → EXECUTE → VERIFY → REPORT → CONVERGE → CLOSE`

Mandatory transition rule:
`NO REPORT → NO NEXT TASK`
`NO LIVE VERIFICATION → NO PASS CLAIM`
`NO MASTER UPDATE → NO NEW ASSIGNMENT`

Decision states:
`ACCEPT / ACCEPT_WITH_RISK / REMEDIATE / HOLD / BLOCK / CONVERGE / CLOSE`

---

# 9. DEMO BASELINE EXIT

`DEMO_BASELINE=READY` only when:
- G1_CONVERGENCE_TRUTH=PASS
- G2_QA_TRUTH=PASS
- G3_TEACHER_WORKFLOW=PASS
- G4_P01_REAL_GOLDEN=PASS
- G5_NATIVE_HUMAN_ACCEPTANCE=PASS
- G6_RELEASE_GOVERNANCE=PASS

Until then:
`READY=FALSE`
`FEATURE_EXPANSION=FROZEN`
`NEW_CORE_ARCHITECTURE=FORBIDDEN`
