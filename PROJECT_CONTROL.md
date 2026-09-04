# MST-MATH — PROJECT CONTROL / MASTER STATUS

> Operational source of truth for the current MST-MATH stabilization and convergence program.
>
> This file records present repository truth, approved architectural direction, active blockers, and release gates. Historical release records remain immutable and are not rewritten here.

LAST_UPDATED=2026-09-04
CONTROL_MODE=STABILIZATION
EXECUTION_MODEL=SINGLE_EXECUTOR_PC
MAC_WORKSTREAM=FULL_FREEZE
FEATURE_EXPANSION=FROZEN
MAIN_PROMOTION=BLOCKED_UNTIL_STABLE_BASELINE

---

# 1. PRODUCT IDENTITY

PRODUCT_UMBRELLA=MST-MATH
APPLICATION=Math AI Studio
STANDARDS_LAYER=NA-MATH

Approved target identity architecture:

`MST-MATH → MST-MATH-DNA-V1.0 → canonical authorities → output profiles → renderers`

Legacy `PIMATH-*` machine IDs and certified PiMath history are preserved for compatibility/history. No blind global rename is allowed.

Repository note: the full MST-MATH brand migration is still isolated on a draft branch/PR and is NOT yet converged into the stabilization baseline.

---

# 2. CURRENT REPOSITORY TRUTH

MAIN_BRANCH=main
MAIN_HEAD=598b35a42b284ab17d7de6ba3023458a36e8f42d
MAIN_STATUS=FROZEN_FOR_STABILIZATION
MAIN_BRANCH_PROTECTION=OFF
MAIN_REQUIRED_CHECKS=OFF

CONVERGENCE_BRANCH=integration/mst-math-convergence-v1
CONVERGENCE_CI_HARDENING_BASE=05384e5feeb35ea865db759a7ae5c332e2f990db
CONVERGENCE_STATUS=ACTIVE_STABILIZATION_SURFACE

PC_AUTHORITY_BRANCH=fix/mst-math-canonical-question-integrity-v1
PC_AUTHORITY_HEAD=cc34f55c9ca4341a3ae0c0b45c8caab0f179736a
PC_RECONCILIATION_BRANCH=integration/mst-math-convergence-pc-reconcile-v1
PC_RECONCILIATION_HEAD=cc34f55c9ca4341a3ae0c0b45c8caab0f179736a
PC_RECONCILIATION_STATUS=NOT_YET_RECONCILED_WITH_LATEST_CONVERGENCE

MAC_BRANCH=feature/mac-b-human-acceptance-remediation-v1
MAC_HEAD=acf9e6b8973ca06486e8733960defd755ea8f8c9
MAC_STATUS=FROZEN_PRESERVE_REMOTE_EVIDENCE

BRAND_BRANCH=chore/mst-math-brand-migration-v1
BRAND_HEAD=f38fbc066fd9bd539e72b6a7acaebcb6940be350
BRAND_PR=8
BRAND_PR_STATUS=DRAFT_NOT_READY_TO_MERGE

PC_CONVERGENCE_PR=12
PC_CONVERGENCE_PR_STATUS=DRAFT_CONFLICTING_NOT_READY_TO_MERGE

---

# 3. CURRENT STABILIZATION PRIORITY

## S1 — CI baseline

Required:
- Architecture check PASS
- TypeScript/typecheck PASS
- Production build PASS
- Full regression PASS
- Canonical brand / Semantic Icon contract PASS

CI environment defects identified and corrected without weakening tests:
1. XeLaTeX missing on Ubuntu runner → provisioned.
2. `pdftotext` missing on Ubuntu runner → `poppler-utils` provisioned.

CI_CERTIFICATION=IN_PROGRESS
DO_NOT_MARK_FULL_CI_PASS_UNTIL_COMPLETED_GREEN_RUN

## S2 — PC clean reconciliation

Reconcile published PC Question/Input/Backend authority into the latest convergence baseline using a clean dedicated worktree.

Preserve:
- Semantic Icon V1.1
- QuestionIR discriminated authority
- canonical question identity
- Unified Input certification
- TeacherWorkflowReadinessAuthority
- authoritative assessment QA
- source lineage
- server export guard
- fail-closed behavior

Strict exclusions:
- do not import pre-existing dirty Video portability work
- do not import Mac UI delta yet

## S3 — One authoritative runtime truth

Question/Input/Assessment/QA/Export must PASS on one converged SHA, not on separate branches.

## S4 — Authority cleanup

After PC reconciliation:
- resolve active Semantic Icon V1.0/V1.1 conflicts without rewriting history
- converge MST-MATH brand identity safely
- remove renderer-local authority drift
- preserve compatibility IDs

## S5 — Teacher Workspace

Mac machine is no longer active. Existing remote Mac work is preserved as evidence and may be selectively reintegrated later from a clean convergence base.

Teacher Workspace reintegration is NOT a prerequisite for core P01 document-output proof unless the acceptance test explicitly exercises that UI.

## S6 — P01 real golden case

Minimum proof:

`REAL DOCX → ingest → DocumentIR → validation → semantic learning pipeline → P01 → PDF + DOCX + HTML`

Must prove:
- no content loss
- math typography correctness
- semantic icon identity
- figure/table association
- provenance
- accessibility
- semantic equivalence across outputs

Slides/Video follow when their production adapters are authoritative.

## S7 — release governance

Before promotion to `main`:
- branch protection ON
- PR-only changes
- required CI checks ON
- no force push
- stable convergence candidate PASS

---

# 4. CORE ARCHITECTURE — LOCKED DIRECTION

Primary teacher workflow:

`Nguồn → Xử lý → Thiết kế → QA → Xuất`

Rules:
- UI does not own business truth.
- AI is contextual, not one chatbot per feature.
- AI proposes; deterministic engines validate; QA gates; renderers publish.
- Math QA is mandatory.
- provenance and source fidelity are mandatory.
- no renderer may silently redefine mathematical meaning.

AUTHORING_PRINCIPLE=AUTHOR_ONCE_RENDER_MANY
SEMANTIC_PRINCIPLE=SAME_SOURCE_SAME_MEANING_ACROSS_OUTPUTS

---

# 5. SEMANTIC ICON SYSTEM

ACTIVE_TARGET_AUTHORITY=MST-MATH Semantic Icon System V1.1
MACHINE_ID=PIMATH-DNA-SEMANTIC-ICONS-V1.1
MAIN_COMMIT=598b35a42b284ab17d7de6ba3023458a36e8f42d
STATUS=LOCKED_CANONICAL_APPROVED_ON_MAIN

Core educational semantic roles remain the existing 17-role V1.1 authority plus compatibility roles.

Operational certification is still incomplete because:
- some active V1.0 references remain
- real PDF/DOCX/HTML/Slides/Video adapter consumption is not fully proven
- P01 multi-render golden case is pending

Tracking: GitHub Issue #11.

---

# 6. WORKSPACE NAVIGATION ICON DIRECTION

DECISION_ID=MST-MATH-WORKSPACE-ICON-DIRECTION-V1.0
STATUS=LOCKED_DIRECTION_IMPLEMENTATION_HOLD

Home/workspace navigation will use MST-MATH-owned **Friendly Academic SVG icons** inspired by the instant recognition of:

`📚 📝 📄 📐 🎬 🎮`

Unicode emoji are reference imagery only, not production canonical assets.

Approved navigation semantic roles:
- WORKSPACE_LESSON
- WORKSPACE_ASSESSMENT
- WORKSPACE_MATERIAL
- WORKSPACE_GEOMETRY
- WORKSPACE_MEDIA
- WORKSPACE_CLASSROOM

Architecture:

`ONE ICON AUTHORITY → CONTENT SEMANTIC SCOPE + WORKSPACE NAVIGATION SCOPE`

Do not mutate the 17 core educational content roles to serve navigation.

IMPLEMENTATION_TRIGGER=STABLE_BASELINE

---

# 7. TEACHER PRODUCT STRATEGY

Approved direction:
- MST-MATH remains an integrated mathematics teaching workspace, not a catalog of independent apps.
- Teacher Job-to-be-Done is a UI principle: users see tasks, not engines.
- Assessment `Generate / Matrix / Similar / Variant` are workflows/profiles of one Assessment Engine.
- Classroom and Game capabilities are roadmap-approved but not active development during stabilization.
- Game content must reuse Question/Assessment authority rather than create a new content silo.

Suggested product positioning:

`MST-MATH — Integrated AI Workspace for Mathematics Teaching & Learning`

---

# 8. SEMANTIC GEOMETRY TOOLS — ROADMAP APPROVED

REPORT=MST-MATH-EXEC-REPORT-SEMANTIC-GEOMETRY-TOOLS-20260904
DECISION=APPROVED_WITH_ARCHITECTURAL_CONSTRAINTS
CANONICAL=NO
IMPLEMENT_NOW=NO

Locked architectural directions:
- learn the COMPASS architectural pattern; do not copy `geometry_tools` as canonical core
- ONE Geometry Core
- GEOMETRY ≠ VISUAL ≠ ANIMATION
- GEOMETRIC RESULT ≠ CONSTRUCTION PROCEDURE
- Geometry Invariant QA is mandatory
- AI must not use generated Manim code as geometry source of truth
- CompassTool is the first golden case
- FOLD and Semantic Geometry Tools must reuse the same Geometry Core
- avoid registry sprawl; audit reuse of existing capability registry first

Post-stabilization sequence:

SG-0A Existing Geometry Authority Audit
→ SG-0B Contracts
→ SG-1 CompassTool Golden Case
→ SG-2 ONE SOURCE → SVG + TikZ + Manim
→ SG-3 P01 / Video / FOLD / GeoGebra integration
→ SG-4 tool expansion

No canonical/locked implementation before Architecture + Invariant + Determinism + Serialization + Multi-render + Regression + Compatibility + QA gates PASS.

---

# 9. EDUCATIONAL OUTPUT IDENTITY

STATUS=APPROVED_FOR_NEXT_CANONICAL_BASELINE_NOT_EXECUTING

Direction:
- one semantic authority across outputs
- educational content icons and workspace navigation icons remain distinct semantic scopes
- output-family accent colors must remain separate from semantic state colors
- canonical vector geometry may have derived technical representations, but renderers cannot redesign semantic identity
- accessibility intent and fallback behavior must be explicit

IMPLEMENTATION_TRIGGER=MASTER_CONVERGENCE_STABLE_BASELINE

---

# 10. OPEN P0 TRACKING

ISSUE_11=Semantic Icon V1.1 convergence and multi-render certification
ISSUE_13=Protect main and require convergence CI
ISSUE_14=Real P01 learning-material golden case

All remain OPEN until their exit criteria are evidenced.

---

# 11. ACTIVE BLOCKERS

B1=FULL_GREEN_CONVERGENCE_CI_PENDING
B2=PC_RECONCILIATION_NOT_COMPLETE
B3=PR_12_CONFLICTING
B4=MAIN_BRANCH_PROTECTION_OFF
B5=SEMANTIC_ICON_ACTIVE_V1_0_REFERENCES_REMAIN
B6=BRAND_MIGRATION_NOT_CONVERGED
B7=P01_REAL_GOLDEN_CASE_NOT_RUN
B8=VIDEO_LOCAL_PORTABILITY_WORK_REQUIRES_SAFE_DISPOSITION

No blocker may be hidden or downgraded to warning without evidence.

---

# 12. RELEASE GATE

A stable baseline requires ALL of the following on one lineage:

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
- SEMANTIC_ICON_SINGLE_SOURCE_GATE=PASS
- BRAND_IDENTITY_CONVERGENCE_GATE=PASS
- NO_HIDDEN_DIRTY_DEPENDENCY=YES

Then:
- P01_REAL_E2E_GATE=PASS
- branch protection / required checks enabled
- human acceptance appropriate to the promoted surface

Only then may the project move from STABILIZATION to controlled feature development.

---

# 13. POST-STABILIZATION PRIORITY ORDER

P1=Production Input expansion (PDF + Image through the same DocumentIR; no parallel content pipeline)
P2=Output usability / P01 / worksheet / lesson / assessment / exam exports
P3=Assessment workflow consolidation
P4=Geometry / GeoGebra / FOLD integration, beginning with SG-0A audit
P5=Classroom + Game Engine capabilities
P6=Slides / Video production expansion

Priority changes require explicit Project Supervisor approval.

---

# 14. HISTORICAL RELEASE RECORD

The existing `v1.3.1` release/tag and prior PiMath/Math AI Studio certification evidence remain historical publication records. This stabilization program does not rewrite them.

Historical evidence must not be confused with current MST-MATH convergence readiness.

---

# 15. GOVERNANCE RULES

1. Never mark DONE without executable evidence.
2. Never silently fix canonical conflicts.
3. Report `DNA_CONFLICT_DETECTED` or `DNA_GAP_DETECTED` when applicable.
4. Preserve certified history and compatibility IDs.
5. Prefer brownfield/additive convergence over rewrites.
6. No feature expansion while STABILIZATION is active.
7. No direct merge to `main` from isolated feature authority branches.
8. Resolve conflicts on controlled reconciliation surfaces, not on evidence/source branches.
9. Renderer capability is not permission to export the current artifact.
10. QA UNKNOWN is never PASS.
11. One semantic source must remain authoritative across outputs.
12. Geometry/Math correctness gates precede visual approval.

---

CURRENT_DECISION=STABILIZE_THEN_CONVERGE_THEN_CERTIFY_THEN_ACCEPT_THEN_RELEASE
NEXT_HARD_GATE=FULL_GREEN_CONVERGENCE_CI_THEN_PC_CLEAN_RECONCILIATION
