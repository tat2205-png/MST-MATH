# MST-MATH INTERNAL PILOT V1 — OPERATOR GUIDE

This folder is the control surface for closing the four Internal Pilot gates without weakening existing MST-MATH authority.

## Current state

G1_BASELINE=PROVISIONAL_PENDING_MAC_CONVERGENCE
G2_MACHINE=READY_TO_RUN_AFTER_FINAL_BASELINE
G3_REAL_E2E=CONTRACT_READY_CASES_NOT_YET_EXECUTED
G4_HUMAN=CHECKLIST_READY_PENDING_PRODUCT_OWNER
INTERNAL_PILOT=NOT_READY

## Why G1 is still provisional

The pilot branch was created from `integration/mst-math-convergence-v1` SHA `655e21d01a2536566d99cb7df944ee870896ff1e`. That convergence commit explicitly states that Mac structural-numbering work remains separate and must later be transplanted. The pilot tooling may be built now, but the final demo baseline must not be falsely frozen before that reconciliation is complete or explicitly excluded by the Human Product Owner.

## Gate 2 — one-command machine certification

Prerequisites:
1. final pilot branch checked out;
2. clean worktree;
3. dependencies installed (`npm ci`, `uv sync --group test`);
4. Local Render Bridge running and reporting `READY` at `http://127.0.0.1:8765/health`.

Run:

```bash
node scripts/pilot-gate.mjs
```

The runner is fail-fast and creates an immutable-per-run evidence directory under:

`render_output/pilot-evidence/<timestamp>-<sha>/`

It executes:
- Python runtime doctor;
- architecture + typecheck + build + regression (`qa:ci`);
- ingest QA;
- Question Bank E2E;
- Assessment QA;
- Export QA;
- Teacher UX-01;
- Python math QA;
- Manim QA;
- Local Render Bridge health;
- real question-video runtime;
- real Golden runtime.

A failure returns `PILOT_MACHINE_GATE=BLOCK` with an exact blocker code. A complete pass returns `PILOT_MACHINE_GATE=PASS` for the recorded SHA only.

## Pilot status

Run:

```bash
node scripts/pilot-status.mjs
```

Machine evidence from another SHA is intentionally rejected as certification for the current SHA.

## Gate 3 — real-source execution

Use `GOLDEN_E2E_V1.md`.

Required cases:
- Golden A — real Teacher Document Workflow;
- Golden B — verified real Solution + Video;
- Golden C — P01 Student Learning Material;
- Negative A — fail-closed integrity.

Do not manufacture answers, replace real sources silently, or mark a generic Question Bank path as proof of P01 completion.

## Gate 4 — human sign-off

Use `HUMAN_ACCEPTANCE_V1.md` after G1–G3 pass.

AI/machine checks may recommend GO/BLOCK but cannot set `G4_HUMAN=PASS`. Internal Pilot GO requires Product Owner approval with `P0_OPEN=0` and `P1_OPEN=0`.

## RC discipline

After final baseline freeze:
- P0/P1/blocker fixes only;
- each fix produces a new RC;
- rerun Gate 2 from zero;
- rerun every affected Gate 3 case;
- never reuse stale evidence across SHAs.

## Final GO formula

`G1=PASS && G2=PASS && G3=PASS && G4=PASS => MST_MATH_INTERNAL_PILOT=GO`
