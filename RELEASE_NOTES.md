# Math AI Studio — Validated Release Candidate

## Release status

The canonical `main` branch contains the validated release commit
`4b2ea1f91f85fad00baf2f321b086c02c7037032`.

The release version is intentionally unresolved. The repository currently
contains conflicting signals (`package.json` is `0.0.0`, the README identifies
v1.3 RC 1, and existing tags include `v1.3-rc.2` and `v1.3.0`). An owner must
select the RC/final version before tagging or publication.

## Included stabilization

- NLS source registry and deterministic structure validation.
- Locked Python 3.14.7 runtime with Manim 0.21.0.
- Validated NumPy, SymPy, SciPy, and Z3 math stack.
- Question Bank, DOCX/export, Exam QA, and teacher UX regression coverage.
- Manim, document, and video pipeline validation.
- Bounded auto-repair with deterministic START/KEY/END frame gating.
- Real runtime Golden Path from verified question through MP4 and frame artifacts.

## Runtime requirements

- Node.js 20+ and npm.
- Python 3.14.x with the checked-in `uv.lock` environment.
- Manim 0.21.x, FFmpeg, ffprobe, XeLaTeX, and dvisvgm.
- Local Render Bridge at `http://127.0.0.1:8765/health` reporting `READY`.
- Start the bridge with `npm run bridge:start`.
- `GEMINI_API_KEY` is optional; deterministic frame structure and math
  provenance remain authoritative.

## Validation evidence

- `npm run release:gate`: PASS on canonical `main`.
- TypeScript, build, architecture, math, content, media, and security gates:
  PASS.
- Math regression: 60/60 PASS.
- Runtime Golden Path: PASS, including MP4, START, KEY, and END artifacts.
- Optional Gemini visual analysis: SKIPPED because credentials are unavailable.
- Architecture reported three non-blocking warnings and zero errors.

## Known limitations and deferred work

- NLS-SOURCE-02H remains excluded and deferred.
- E2E-TEACHER-01 remains deferred.
- Document Converter expansion remains deferred.
- PDF/image ingestion remains deferred.
- EXAM-QA-3, EXAM-QA-4, and EXAM-QA-5 remain deferred.
- Optional Gemini visual QA remains unavailable without credentials.

## Publication decision

Canonical main is technically validated. Publication remains blocked until the
owner resolves the release version and tag naming convention. No tag, push,
remote release, or production deployment was performed.
