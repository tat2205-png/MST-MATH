# Math AI Studio 1.4.0

## Release status

The v1.4.0 release candidate contains the verified teacher workflow, document
converter, approved PDF/image ingest, Exam QA integration, and Unicode-safe
Question Bank PDF export path.

## Completed scope

- NLS source registry and deterministic structure validation.
- Locked Python 3.14.7 runtime with Manim 0.21.0.
- Validated NumPy, SymPy, SciPy, and Z3 math stack.
- Question Bank, DOCX/export, Exam QA, and teacher UX regression coverage.
- Manim, document, and video pipeline validation.
- Bounded auto-repair with deterministic START/KEY/END frame gating.
- Real runtime Golden Path from verified question through MP4 and frame artifacts.
- Teacher Golden Workflow E2E through export.
- Deterministic PDF/image ingest with fail-closed validation and traceability.
- Exam QA language, logic, symbol, reference, geometry, and scope gates.
- Unicode-safe QB-2D PDF text extraction.

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

## Deferred and optional scope

- NLS-SOURCE-02H remains excluded and deferred.
- NLS-SOURCE-02H remains deferred and preserved.
- Optional Gemini visual QA remains unavailable without credentials.
- Optional visual AI is non-blocking.

## QA status

- TypeScript: PASS.
- Build: PASS.
- Architecture: PASS, 0 errors and 3 non-blocking warnings.
- Global regression: 70/70 PASS.

## Publication status

Math AI Studio v1.3.1 has been published.

- Canonical branch: `main`
- Release tag: `v1.3.1`
- Released source commit: `57956cd3d55482e8252d7ece1b2d617831c492f0`
- GitHub Release: published
- npm package publication: not performed
- Production deployment: not performed
