# MST-MATH INTERNAL DEMO PILOT V1

STATUS: PILOT_CANDIDATE
OWNER: Human Product Owner
IMPLEMENTATION_OWNER: MST-MATH Engineering
BRANCH: `pilot/mst-math-internal-demo-v1`
BASE_MAIN_SHA: `598b35a42b284ab17d7de6ba3023458a36e8f42d`
FEATURE_FREEZE: ENABLED

## Purpose

This pilot proves a bounded teacher workflow is repeatable on real mathematics content without weakening source, mathematics, QA, provenance, or fail-closed rules. It does **not** certify the complete MST-MATH product, all P01-P12 profiles, large-scale multi-user deployment, or production release.

## Pilot scope

Included:

`DOCX/Input -> canonical ingest -> Question detection/Question Bank -> Teacher Workspace -> deterministic Math/QA -> Assessment/Learning Material where implemented -> PDF/DOCX -> verified Solution/Video for eligible items`

Excluded from pilot-blocking scope unless required to repair a P0/P1 defect:

- new retrieval/database architecture;
- broad visual redesign;
- new game families;
- analytics expansion;
- repository-wide rename cleanup;
- successor standards that are not runtime-certified;
- public/cloud production deployment.

## Change policy during freeze

Allowed changes after freeze:

- P0 correctness/data-integrity/security defects;
- P1 critical-workflow defects;
- pilot evidence/harness fixes that do not change product semantics;
- narrowly scoped compatibility repairs required by a failed pilot gate.

Everything else is deferred to `POST_PILOT_BACKLOG`.

## Four gates

### G1 — PILOT BASELINE FREEZE

PASS requires:

- one pilot branch;
- exact Git SHA recorded;
- clean worktree before certification;
- pilot scope locked;
- no Draft PR is silently merged into the baseline;
- known limitations documented.

Current status: `PASS_CANDIDATE_BRANCH_CREATED`. Final freeze SHA is the head commit containing this pilot-control package.

### G2 — CURRENT-HEAD MACHINE CERTIFICATION

Run locally from the pilot branch:

```bash
npm ci
uv sync --group test
npm run pilot:gate
```

The gate is fail-closed. A historical PASS does not substitute for a fresh PASS on the exact pilot SHA.

Minimum mandatory machine checks:

- architecture;
- TypeScript;
- build;
- regression;
- document ingest;
- Question Bank E2E;
- assessment;
- export;
- Teacher Workflow UX;
- Python runtime/math;
- Manim toolkit;
- Local Render Bridge health;
- real golden runtime.

PASS token: `PILOT_MACHINE_GATE=PASS`.

### G3 — REAL E2E GOLDEN PILOT

Four cases are mandatory:

1. `GOLDEN_A_TEACHER_DOCUMENT`: real authorized DOCX -> ingest -> Question Bank -> teacher review -> Assessment -> PDF/DOCX.
2. `GOLDEN_B_VERIFIED_SOLUTION_VIDEO`: real authorized problem with explicit verified answer/solution authority -> Math verification -> solution -> Manim MP4 -> QA.
3. `GOLDEN_C_P01_STUDENT_MATERIAL`: real authorized source -> P01 learning-material path -> student artifact -> PDF.
4. `NEGATIVE_A_FAIL_CLOSED`: insufficient/unsupported source must return an explicit block/unsupported state and must not fabricate canonical content.

Synthetic fixtures may support regression but cannot alone close G3.

### G4 — HUMAN ACCEPTANCE

Engineering prepares all evidence, scenarios, issue classification, and artifacts. Human Product Owner performs the final acceptance on the exact pilot SHA.

Required:

- critical workflow completion = 100%;
- mathematical/source correctness = 100% on the Golden Set;
- `P0 = 0`;
- `P1 = 0`;
- P2/P3 may remain as documented backlog;
- final decision is explicitly `APPROVE` or `BLOCK` by the Human Product Owner.

AI/automation must never self-certify `HUMAN_UI_QA=PASS`.

## Severity

- P0: wrong mathematics/answer/source mutation/data loss/crash/canonical hallucination/security or integrity failure. Blocks demo.
- P1: core teacher workflow cannot complete, broken PDF/DOCX/video, missing question/figure/pagination corruption. Blocks demo.
- P2: usable but materially inconvenient UX/layout issue. Backlog unless it prevents the agreed demo task.
- P3: enhancement/cosmetic/new capability. Post-pilot backlog.

## Decision rule

`INTERNAL_DEMO_GO = G1_PASS && G2_PASS && G3_PASS && G4_HUMAN_APPROVED && P0==0 && P1==0`

External-teacher acceptance and classroom validation are later gates for External Beta / Field Beta and do not retroactively redefine this bounded Internal Demo gate.
