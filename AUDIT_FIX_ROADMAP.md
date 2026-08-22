# MATH AI VIDEO STUDIO — Audit, Fix & Completion Roadmap

Date: 2026-08-23

## 1. Audit result

### Confirmed working after this audit
- TypeScript static QA: PASS (`tsc --noEmit`).
- Math deterministic regression: PASS, 60/60.
- Graph Engine: PASS, 8/8.
- Skill Engine: PASS, 10/10 after CRLF frontmatter fix.
- Skill integration: PASS, 15/15.
- Step 5 UI/skill gates: PASS, 13/13.
- Step 6B Local Bridge contract tests: PASS, 12/12.
- Step 6C smoke-test contract matrix: PASS, 13/13.
- Step 6D frame-input gate: PASS.
- Step 8A master-canvas QA: PASS.
- Step 8B source-aware invariants: PASS.
- All 13 current `test-*.ts` suites pass in the audit environment after TypeScript compilation.

### Code defect repaired
`server/services/skillLoader.ts` failed to parse YAML metadata from Windows CRLF skill files. The parser now normalizes CRLF/CR to LF before parsing, restoring metadata (`name`, `version`, `description`) and bringing Skill Engine from 9/10 to 10/10.

### QA workflow repaired
A unified regression runner was added:
- `npm run qa:regression`
- `npm run qa:ci`

`qa:full` now requires both deterministic math regression and the broader regression suite before server/OpenClaw/repair gates may run.

## 2. Current limitations — do not mark production/render ready yet

### A. Phase 4C.2 linear systems is not implemented in the current worktree
The current source contains deterministic equation and inequality verification, but no active `deterministicLinearSystemVerifier.ts` and no active `test-step4c2-linear-systems.ts`. Prior automation runs attempted this phase but either rolled back or stopped at an edit plan.

Required scope for 4C.2:
- exactly two non-empty equations;
- exactly one `=` per equation;
- only variables `x` and `y`;
- exact rational coefficients/constants;
- unique / no solution / infinite solutions;
- exact rational arithmetic;
- substitution into both source equations;
- ordered source fingerprint;
- SOURCE_LITERAL provenance + deterministic derivation trace;
- provider must never override deterministic result;
- fail closed for nonlinear, third variable, symbolic parameter, malformed separators, extra `=`.

### B. Runtime video QA is intentionally incomplete until a real local render is executed
`MANIM_RUNTIME_QA` and especially frame QA must be based on real generated artifacts. No mock may promote the project to `RENDER_READY`.

### C. The Git worktree is heavily modified/untracked
Automation is more likely to produce patch conflicts or overwrite work when there is no accepted checkpoint baseline. Do not run broad autonomous edits before creating a reviewed checkpoint.

## 3. Lean completion sequence

### Gate 0 — Freeze a safe checkpoint
1. Review current `git status` and `git diff`.
2. Exclude `.env`, generated `dist`, `node_modules`, render outputs and temporary logs.
3. After human review, create one checkpoint commit/tag manually.
4. Never let an agent run `reset --hard`, `clean`, auto-commit or auto-push.

Exit condition: working baseline is recoverable in one command/commit.

### Gate 1 — Make QA the only entry point
Daily quick check:
`npm run lint`

Before accepting any source change:
`npm run qa:regression`

Before a milestone/release:
`npm run qa:full`

Rule: if any earlier gate fails, later gates are BLOCKED, not guessed PASS.

### Gate 2 — Finish Math Core before expanding UI
Implement only Phase 4C.2 next. Do not add new math domains until its contract and regression are green.

Required acceptance:
- all existing 4B/4C.1 tests unchanged and PASS;
- new 4C.2 tests PASS;
- malformed inputs return `UNSUPPORTED` exactly as specified;
- Math Gate rejects stale fingerprints and provider overrides;
- `npm run qa:regression` PASS.

### Gate 3 — Stabilize end-to-end content pipeline
Lock this sequence:
INPUT -> PARSE -> DETERMINISTIC VERIFY -> SOLUTION -> VISUAL PLAN -> MASTER CANVAS -> VIDEO PLAN -> MANIM CODE

For each stage, store:
- input fingerprint;
- output schema version;
- provenance;
- QA status;
- failure reason.

Rule: no stage may silently repair or infer protected math/geometry source data.

### Gate 4 — Local render truth test
On Windows machine:
1. Local Bridge health PASS.
2. Python PASS.
3. Manim PASS.
4. FFmpeg PASS.
5. OpenClaw health PASS.
6. Render one minimal smoke scene.
7. Require MP4 + render.log + START/KEY/END frames.
8. `MANIM_RUNTIME_QA=PASS` only for exit code 0.

### Gate 5 — Real frame QA
For each scene/frame set verify:
- math symbols and formulas;
- source geometry and labels;
- no overlap/cropping;
- safe margins;
- object visibility;
- camera target/settle/read timing;
- narration/visual synchronization.

Frame QA may trigger auto-repair only for allowed visual/code regions. Protected math/geometry mutation must fail closed and require human review.

### Gate 6 — Transactional auto-repair
One repair iteration:
DETECT -> CLASSIFY -> SNAPSHOT -> PATCH -> STATIC QA -> REGRESSION -> RENDER -> FRAME QA -> ACCEPT/ROLLBACK

Limits:
- maximum 3 repair attempts;
- smallest possible patch;
- no dependency upgrades during repair;
- no unrelated refactor;
- rollback on any regression;
- math/geometry-sensitive repairs require deterministic re-verification.

### Gate 7 — Release gate
A build is releasable only when all are PASS:
- TYPESCRIPT_QA
- BUILD_QA
- MATH_REGRESSION_QA
- TEST_REGRESSION_QA
- SERVER_QA
- OPENCLAW_HEALTH_QA when repair features are enabled
- MANIM_RUNTIME_QA
- FRAME_QA
- SECURITY_QA
- PACKAGE_MANAGER_QA

Otherwise status must remain FAIL / BLOCKED / NOT_TESTED.

## 4. Recommended next development order

1. Create reviewed Git checkpoint.
2. Implement Phase 4C.2 deterministic 2x2 linear systems.
3. Add 4C.2 to `math-regression.ts` and unified regression.
4. Run `npm run qa:full` on Windows.
5. Run real Manim smoke render through Local Bridge.
6. Run real START/KEY/END Frame QA.
7. Harden auto-repair rollback against a real failing scene.
8. Only then expand more math domains or UI features.

## 5. Operating rule for AI agents

Every coding task should be given one small contract with:
- goal;
- allowed files;
- forbidden files;
- invariants to preserve;
- tests that must pass;
- maximum repair attempts;
- explicit human-gate conditions.

Do not ask an agent to “finish the whole project” in one patch. Use one contract -> one patch -> one regression cycle.
