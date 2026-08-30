# Math AI Studio 1.6.0 Release Candidate

## Release status

V1.6 is locally ready for release-candidate promotion from
`develop/v1.6.0`. No tag, push, npm publication, or production deployment has
been performed.

## Completed scope

- Canonical real-DOCX import through Document, Math, and Asset IR.
- Stable source identity and numbering for all 158 imported questions.
- Question Bank pagination across four pages.
- Canonical WMF/EMF/VML handling, including the verified Q37 composite.
- Teacher assessment, answer isolation, DOCX, and XeLaTeX-first PDF/TeX export.
- macOS Local Render Bridge startup through the locked `uv` environment.

## Runtime requirements

- Node.js 20+ and npm.
- Python 3.14.x with the checked-in `uv.lock` environment.
- Manim 0.21.x, FFmpeg, ffprobe, XeLaTeX, and dvisvgm.
- Local Render Bridge at `http://127.0.0.1:8765/health` reporting `READY`.
- Start the bridge with `npm run bridge:start`.
- `GEMINI_API_KEY` is optional; deterministic frame structure and math
  provenance remain authoritative.

## Real-source validation

The immutable source `Full-Toán thực tế 10.docx` was verified at SHA-256
`7f26811b8588672cbb9029af3d43b7752ba36c149ec2e9e4caf9c01153c0c23d`.
Import produced 158 distinct questions and preserved the source checksum.
Human browser validation passed pagination through Câu 158 and the complete Q37
bridge/cable composite.

Two distinct unsupported `EQARR` constructs remain intentionally fail-closed
and reviewable. They are expected unsupported inputs, not regressions.

## QA status

- TypeScript: PASS.
- Build: PASS.
- Architecture: PASS, 0 errors and 3 non-blocking warnings.
- Global regression: 70/70 PASS.
- Pilot-01: PASS; solution/video is N/A where no machine-verified explicit
  answer exists.
- Real Question-to-Manim runtime: PASS.

## Publication status

- Candidate branch: `develop/v1.6.0`
- Push performed: no
- Tag created: no
- Production deployment: no
