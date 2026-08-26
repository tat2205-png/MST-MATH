# MATH AI STUDIO — DEVELOPMENT CHANGELOG

> Record of verified milestones and meaningful project changes.

---

## Unreleased

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
