# MST-MATH — Data Processing + Retrieval Authority Completion Cut

DATE=2026-09-05
STATUS=IMPLEMENTED_ON_COMPLETION_CUT / CI_REQUIRED
BRANCH=integration/mst-math-completion-cut-v1
CHANGE_MODE=ADDITIVE / NON-DESTRUCTIVE
CANONICAL_IN_PLACE_CHANGE=false

## Purpose

Reconcile the safety fixes from `fix/mst-math-data-retrieval-authority-v1` onto the latest convergence lineage after Question Bank data-access optimization and Mac DOCX structural-numbering convergence. The older fix branch is intentionally not merged wholesale because it diverged from newer performance and DocumentIR work.

## Preserved authorities

- QuestionObject / QuestionIR schema and stable identity are unchanged.
- Source/provenance and current Question Bank repository remain runtime authority.
- No PostgreSQL, vector index, OpenSearch, Qdrant, Neo4j, or new search authority is introduced.
- Existing optimized snapshot query/index path is preserved.
- Review/admin `getById()` remains unrestricted by design.

## Completion fixes

### Invalid filters fail closed

Runtime-invalid question type, bank status, duplicate state, or relation type no longer drops the invalid constraint and broadens retrieval. The result is empty with `UNKNOWN_FILTER`.

### Approved consumer lookup

`QuestionSearchService.getApprovedById()` exposes an explicit APPROVED-only lookup for consumer reuse without changing review/admin semantics.

### Assessment reuse authority

`AssessmentService.materialize()` rehydrates from the current repository revision and blocks when a selected question:

- no longer exists (`ASSESSMENT_QUESTION_NOT_FOUND`),
- is no longer APPROVED (`ASSESSMENT_QUESTION_NOT_APPROVED`), or
- no longer matches the stored type/source document/source hash (`ASSESSMENT_QUESTION_STALE`).

### Classroom Game reuse authority

Both student question materialization and submission now revalidate the current question against the assessment/game reference. Missing, downgraded, or stale-lineage questions fail closed via `GAME_QUESTION_NOT_FOUND`, `GAME_QUESTION_NOT_APPROVED`, or `GAME_QUESTION_STALE`.

## Regression

`tests/test-question-bank-retrieval-authority-v1.ts` verifies:

- invalid status/relation filters fail closed;
- APPROVED-only lookup;
- assessment reuse after approval downgrade;
- assessment stale lineage;
- classroom-game reuse after approval downgrade;
- classroom-game stale lineage.

The test is registered in `scripts/run-regression.mjs` alongside the existing data-access performance and DOCX structural-numbering convergence gates.

## Residual focused follow-up

`TeacherWorkflowService.prepareVideo(questionId)` must be audited on the Completion Cut for the same current-APPROVED/current-lineage boundary. This is a bounded follow-up (`VIDEO_REUSE_AUTHORITY_QA`), not authorization for a broad teacher-workflow rewrite.

## Successor storage policy

`MST-MATH Problem Knowledge Base + Retrieval Architecture V1.0` remains a post-demo DRAFT/PROPOSED successor. Its storage/search migration is not part of this Completion Cut.

## Certification rule

Implementation and test definition do not equal certification. This Completion Cut is not eligible for convergence or demo freeze until CI/regression evidence passes on its exact SHA.
