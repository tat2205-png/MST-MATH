# v1.4.0 Release Validation Evidence

| Gate | Result | Evidence |
|---|---|---|
| Teacher E2E | PASS | `tests/test-teacher-workflow-ux01.ts`, prior real runtime evidence |
| Document Converter | PASS | `npm run qa:docx` |
| PDF/Image ingest | PASS | `npm run qa:ingest` |
| Exam QA | PASS | `tests/test-exam-qa.ts`, `test-exam-qa-logic.ts`, `test-exam-qa-language.ts` |
| Question Bank | PASS | QB-1A through QB-2D; global regression |
| DOCX | PASS | DOCX-1A through DOCX-1F |
| Math Engine | PASS | `math-regression.ts`, 60/60 |
| Geometry | PASS | geometry and dynamic geometry regression suites |
| Fold | PASS | fold, developable, pattern, and shortest-path suites |
| Video | PASS | real Local Render Bridge and video regression evidence |
| TypeScript | PASS | `npm run lint` |
| Architecture | PASS | 0 errors; 3 non-blocking warnings |
| Build | PASS | `npm run build` |
| Accessibility | PASS | teacher workflow UX evidence |
| Responsive | PASS | teacher workflow UX evidence |
| Global Regression | PASS | `npm run qa:regression`, 70/70 |
| Optional visual AI | SKIPPED_OPTIONAL | No Gemini credential; deterministic QA authoritative |
