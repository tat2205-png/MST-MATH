# MST-MATH RC1 F01R remote reconciliation

PR_SCOPE=F01 production wiring plus F02 SVG PDF support and CI enablement.
F01_COMMIT_SCOPE=8604f5305a4a18bbe2ff46c5215510e1140bfda8.
F02_FIX_SCOPE=SVG-to-PNG PDF transcode, targeted tests, real-golden harness, and RC1 CI workflow.

The F01R branch remains based on the verified RC1 baseline and preserves the locked INPUT and Processing lineages. The F01 changes are not reimplemented here: teacher DOCX runtime import calls the existing source-backed P01 service, which invokes the canonical Math QA adapter and returns the P01 review/output state.

## F01 production path

`TeacherWorkflowService.importDocxForRuntime` → `QuestionBankService.importDocxForRuntime` / unified ingest → `buildDemoRc1P01` → `ingestUnifiedSource` → normalization → `runProductionMathQA` → `buildP01LessonIR` → existing HTML/DOCX/PDF renderers → teacher workflow result.

The exact entry points are `server/services/teacherWorkflowService.ts:importDocxForRuntime`, `server/services/demoRc1P01Service.ts:buildDemoRc1P01`, and `server/services/mathQaProductionAdapter.ts:runProductionMathQA`. The result exposes source hash, QA state, Math QA status, diagnostics, and output formats to the existing teacher surface.

## F02 change

`src/modules/learning-material/renderers.ts:renderP01Pdf` keeps SVG bytes for HTML and DOCX. For PDF only, `transcodeSvgFigureToPng` uses pinned `@resvg/resvg-js@2.6.2` entirely in memory, rejects external resources, records original and derived SHA-256, and fails closed on invalid SVG. No INPUT, Processing, Golden, Paddle, canonical tag, or locked contract was modified.

## Validation

- `npm ci`: PASS.
- `npm audit --audit-level=high`: PASS (exit 0; existing report contains 3 moderate advisories, no high-or-critical gate failure).
- `npm run arch:check`: PASS (0 errors; 5 pre-existing warnings).
- `npm run lint`: PASS.
- `npm run build`: PASS.
- `npm run qa:regression`: PASS, 71/71 suites.
- F01, demo P01, SVG transcode, and real-golden tests: PASS.
- `git diff --check`: PASS.

Scope accounting is limited to this PR's F01/F02 paths; this report does not certify unrelated RC1 backlog as out of scope.

