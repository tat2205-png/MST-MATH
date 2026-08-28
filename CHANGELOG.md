# MATH AI STUDIO — DEVELOPMENT CHANGELOG

> Record of verified milestones and meaningful project changes.

---

## Post-QB Studio Integration — MAS-INT-01 — 2026-08-28

### Finalized

- Recovered and verified candidate `c848cf55edd1675a6254ce66569ab6ad4a7a2f3b`.
- Persisted the required and optional runtime-readiness matrix.
- Preserved Question Bank baseline `943186335bcc380994111cac6535aefd3ac9e2a9`
  and release tag `v1.3-rc.1`.

### QA

- TypeScript, build, architecture, 25/25 regression, QA CI, and QA Full: PASS.
- Real Question Bank → Studio → Manim MP4/frame artifact path: PASS.
- Local Render Bridge and Auto Repair: PASS.
- Missing optional AI credentials: non-blocking; deterministic QA remained PASS.

### Next

- UX-01 — Teacher Golden Workflow.

## Question Bank Program — QB-3A — 2026-08-28

### Accepted

- QB-1A through QB-1F: deterministic DOCX ingestion, normalization, figures,
  persistence, reload, search/filter, and safe reuse.
- QB-2A through QB-2D: assessment, classroom game, solution/video integration,
  and deterministic JSON/LaTeX/DOCX/PDF delivery.
- Student/teacher answer isolation, program-wide source traceability, stable
  Question IDs, and fail-closed diagnostics.

### QA

- Question Bank feature freeze: ENABLED
- Regression baseline: 25 suites minimum
- Real Question → Video runtime: PASS with Local Render Bridge READY
- Actual JSON, LaTeX, DOCX, PDF, MP4, and frame artifacts: PASS
- Final acceptance matrix: `QB_3A_ACCEPTANCE.md`

### Scope

- No new Question Bank feature, database, UI, provider, engine, or export format
  was added during QB-3A.
- Existing release tag `v1.3-rc.1` remains frozen and unchanged.

## v1.3-rc.1 — 2026-08-27

### Added

- PROJECT_CONTROL.md
- MASTER ROADMAP
- Centralized Math AI Studio project tracking
- Release-gate prerequisite diagnostic for the Local Render Bridge

### Changed

- Normalized project control and roadmap state for the REL-02 feature freeze.
- Documented the mandatory Local Render Bridge health prerequisite on port 8765.

### Fixed

- None

### QA

- REL-01: READY_FOR_RELEASE_CANDIDATE
- REL-02: RC_PACKAGED
- REL-03: release version resolved as `v1.3-rc.1`
- Architecture QA: PASS
- TypeScript QA: PASS
- Build QA: PASS
- Math regression: 60/60 PASS
- Regression suites: 14/14 PASS
- Exam QA: PASS
- Studio integration: PASS
- Auto Repair: PASS
- Source QA Full: PASS
- QA CI: PASS
- Release Gate: PASS
- Golden Path: PASS

### Runtime prerequisites

- The release gate requires the repository Local Render Bridge to report
  `READY` at `http://127.0.0.1:8765/health`.
- `GEMINI_API_KEY` remains optional; offline visual-AI fixture messages are not
  release failures when deterministic frame and math provenance checks pass.

---

# CHANGELOG RULES

Only record meaningful milestones.

Each completed development milestone should include:

- Date
- Module
- Task ID
- Branch
- Commit
- QA result
- Important changes
- Known limitations
- Next recommended task

Never record a task as completed without QA evidence.
