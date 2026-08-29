# Next-version Roadmap

## Policy

- `1.3.1`: current frozen release.
- `1.3.2`: reserved for critical maintenance and regressions only.
- `1.4.0`: next feature release on `develop/v1.4.0`.
- `main`: feature freeze remains ON.

## Ordered roadmap

### Phase 0 — v1.4 baseline and guards

Priority: P0. Target: v1.4.0. Dependency: clean post-release baseline.
Risk: low. Acceptance: clean isolated branch, release tag ancestor, guards
preserved. Release-blocking: yes for v1.4 development start.

### Phase 1 — E2E-TEACHER-01

Priority: P1. Target: v1.4.0. Dependency: existing teacher workflow and real
runtime. Risk: high integration risk. Acceptance: complete teacher workflow
passes against the real runtime with targeted regression coverage.
Release-blocking: yes for the v1.4.0 teacher workflow objective.

### Phase 2 — Document Converter completion

Priority: P1. Target: v1.4.0 or staged v1.4.x. Dependency: current document
pipeline. Risk: medium/high compatibility risk. Acceptance: unified source
document conversion is covered by deterministic tests. Release-blocking:
feature-dependent.

### Phase 3 — PDF/image ingestion

Priority: P2. Target: v1.4.x. Dependency: converter completion and safe media
handling. Risk: high parser/security risk. Acceptance: supported inputs,
validation, and failure paths are tested. Release-blocking: no for v1.4.0
baseline.

### Phase 4 — Exam QA continuation

Priority: P2. Target: v1.4.x. Dependency: existing Exam QA contracts.
Risk: medium regression risk. Acceptance: EXAM-QA-3/4/5 each has targeted
passing evidence. Release-blocking: no for the baseline.

### Later — NLS human review and optional visual QA

Priority: P3. Target: v1.4.x. Dependencies: human review for NLS-SOURCE-02H;
optional credentials for Gemini QA. Risk: workflow and external-service risk.
Acceptance: review decisions are recorded; deterministic frame QA remains
authoritative. Release-blocking: no; Gemini credentials are never mandatory.
