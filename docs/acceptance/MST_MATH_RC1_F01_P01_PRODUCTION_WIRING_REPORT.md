# MST-MATH RC1 F01 — P01 production wiring

## 1. Baseline

- `BASELINE_HEAD=2b8c214d6cab397c73627923818350d1609f8f7a`
- Candidate branch: `integration/mst-math-demo-rc1`
- INPUT and Processing canonical histories were not modified.

## 2. Disconnect found

Before this change, the teacher route `/api/teacher-workflow/import` called only `TeacherWorkflowService.importDocxForRuntime` → `QuestionBankService.importDocxForRuntime` → Question Bank pipeline. The P01 source-backed route was separate at `/api/demo-rc1/p01` → `buildDemoRc1P01`, so P01 state did not reach the teacher review result.

## 3. Production call path

Before:

`TeacherWorkspace.runImport` → `POST /api/teacher-workflow/import` → `TeacherWorkflowService.importDocxForRuntime` → `QuestionBankService.importDocxForRuntime` → canonical DOCX/Question Bank parse → existing teacher review state.

After:

`TeacherWorkspace.runImport` → `POST /api/teacher-workflow/import` → `TeacherWorkflowService.importDocxForRuntime` → existing Question Bank import and Exam QA → `buildDemoRc1P01` → unified canonical source parse → `normalizeDocument` → `runProductionMathQA` → P01 LessonIR/review gate → `ImportWorkflowResult.p01` → existing teacher review surface.

The existing output authority remains:

`TeacherWorkflowService.generateAssessment` → `AssessmentService.generate` (APPROVED-only) → `TeacherWorkflowService.exportAssessment` → `QuestionBankExportService.deliver`.

No demo-only exporter was added. P01 output artifacts are only produced by the P01 service when ingestion, normalization, and canonical Math QA pass; review states produce no P01 artifacts.

## 4. Exact symbols

- P01 entry: `server/services/demoRc1P01Service.ts::buildDemoRc1P01`
- Teacher import: `server/services/teacherWorkflowService.ts::importDocxForRuntime`
- Canonical Math QA: `server/services/mathQaProductionAdapter.ts::runProductionMathQA`
- Math QA core: `src/modules/math-qa-v1/index.ts::runMathQA`
- Teacher review API: `server.ts::POST /api/teacher-workflow/approve`
- Teacher review UI: `src/components/teacher/TeacherWorkspace.tsx` review area
- Existing exporter: `server/services/teacherWorkflowService.ts::exportAssessment` → `QuestionBankExportService.deliver`

## 5. Tests

- `node --import tsx tests/test-f01-p01-production-wiring.ts`: PASS. Proves P01 import, source binding, canonical Math QA evidence, teacher review reachability, fail-closed review, no demo-fixture promotion, and reviewed-state path to existing DOCX exporter.
- `node --import tsx tests/test-teacher-workflow-ux01.ts`: PASS. Existing non-P01 teacher workflow regression.
- `npm run build`: PASS.
- `npm run lint`: PASS.
- `git diff --check`: PASS.

## 6. Real golden evidence

`REAL_P01_GOLDEN=BLOCKED_MISSING_EVIDENCE`. No authoritative real P01 golden input was located in the accessible candidate corpus. `tests/question-bank-fixture.ts` is synthetic and is explicitly used only to prove contract behavior; it is not represented as a real golden.

## 7. Remaining gaps

- Real P01 golden replay remains blocked by missing authoritative evidence.
- P01 state is surfaced in teacher review, while the existing Question Bank state remains the persistence/export authority; a durable P01 LessonIR persistence schema was not introduced.
- Correction revision persistence/revalidation remains outside F01.
- INPUT/Processing canonical contracts, Golden corpus, dependencies and Paddle were not modified.

## 8. Change accounting

Files changed:

- `server/services/demoRc1P01Service.ts`
- `server/services/teacherWorkflowService.ts`
- `src/services/teacherWorkflowTypes.ts`
- `tests/test-f01-p01-production-wiring.ts`
- `docs/acceptance/MST_MATH_RC1_F01_P01_PRODUCTION_WIRING_REPORT.md`

`CANONICAL_CONTRACT_MUTATED=FALSE` (only the existing import result type was extended with an optional P01 result field).
`OUT_OF_SCOPE_IMPLEMENTATION_ADDED=FALSE`.
`GIT_STATUS_AFTER_COMMIT=EXPECTED_CLEAN`.
