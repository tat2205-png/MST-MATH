# AUTOPILOT V4.1 — Transactional File Plan

V4 replaces the fragile V2/V3 patch/anchor model.

## Structural fixes

1. **No Git patch generation.**
2. **No `old_text` anchors.**
3. Existing-file edits are full-file transactional replacements guarded by the current raw-byte SHA-256.
4. Stale files automatically trigger a re-plan; no source is changed by a rejected plan.
5. Every task contract is snapshotted and hashed for every run.
6. Candidate source is preserved in `.automation/runs/<run>/candidate-snapshots/` before rollback.
7. A math/geometry/provenance regression no longer causes immediate rollback:
   - tests/contracts are frozen,
   - implementation-only repair is attempted automatically up to 3 times,
   - Human Gate occurs only for real semantic uncertainty or exhausted domain repair.
8. Host write failures are transactionally rolled back.
9. The dirty working tree is preserved: only files touched by AutoPilot are backed up/restored.
10. No commit, push, reset, clean, checkout, restore, or stash is performed.

## Install

Extract this package into the project root so these paths exist:

- `scripts\autopilot.ps1`
- `scripts\autopilot_v4.py`
- `contracts\PHASE_4C2_LINEAR_SYSTEM_V1.md`

Keep the existing `scripts\dev-loop.ps1`.

## Bootstrap

```powershell
pwsh -ExecutionPolicy Bypass `
  -File ".\scripts\autopilot.ps1" `
  -Bootstrap
```

Expected:

```text
OVERALL_STATUS: PASS
AUTOPILOT_V4_1_READY: PASS
```

## Continue Phase 4C.2 automatically

```powershell
pwsh -ExecutionPolicy Bypass `
  -File ".\scripts\autopilot.ps1" `
  -ContractFile ".\contracts\PHASE_4C2_LINEAR_SYSTEM_V1.md"
```

Do not intervene while the state machine is running.

Possible final states:

- `PASS`
- `NO_CHANGES`
- `HUMAN_REVIEW_REQUIRED`
- `AUTO_REPAIR_EXHAUSTED`
- `FILE_PLAN_PREFLIGHT_EXHAUSTED`
- `INFRASTRUCTURE_BLOCKED`
- `HOST_APPLY_FAILED`
- `UNEXPECTED_FAILURE`

## State machine

Contract
→ Codex read-only full-file plan
→ hash/path preflight
→ transaction backup
→ apply
→ candidate snapshot
→ Full Dev Loop
→ PASS

If structural plan is stale:
→ automatic re-plan, maximum 3

If code/build/integration fails:
→ automatic repair, maximum 3

If deterministic math/geometry/provenance QA fails:
→ freeze tests + contract
→ automatic implementation-only repair, maximum 3
→ PASS or Human Gate

On final failure:
→ preserve candidate snapshots
→ rollback only AutoPilot-touched files
→ keep the user's pre-existing dirty working tree intact


## V4.1 Windows bootstrap fix

V4.1 fixes Windows CLI discovery for npm-installed commands such as `npm`
and `openclaw`.

Instead of asking Python `subprocess(shell=False)` to execute `.cmd` shims
directly, bootstrap now resolves and invokes them through the user's host
PowerShell. This mirrors the working terminal environment.

The Codex read-only probe remains independent. A failed optional command
inside the Codex sandbox does not fail bootstrap when the required random
repository token was actually read and returned correctly.
