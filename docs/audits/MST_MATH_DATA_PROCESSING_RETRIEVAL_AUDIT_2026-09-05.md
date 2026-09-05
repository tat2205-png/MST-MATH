# MST-MATH — Data Processing + Retrieval Authority Audit

DATE=2026-09-05
STATUS=IMPLEMENTED_ON_FIX_BRANCH / REVIEW_REQUIRED
CHANGE_MODE=ADDITIVE / NON-DESTRUCTIVE
BASELINE=fix/mst-math-canonical-question-integrity-v1
IMPLEMENTATION_BRANCH=fix/mst-math-data-retrieval-authority-v1
CANONICAL_IN_PLACE_CHANGE=false

## 1. Decision

MST-MATH may learn product patterns from external question-bank products only when the change is additive and does not replace or weaken current semantic authority, QuestionIR compatibility, provenance, QA, persistence contracts, or output gates.

Accepted now as UI/application projections:
- browse by problem type and by source exam;
- Grade -> Chapter -> Lesson -> Problem Type navigation mapped onto existing metadata/ontology;
- selection basket storing stable question IDs, never copied question payloads as a new authority;
- visible provenance on question cards;
- quick create/export actions that call existing assessment, learning-material, solution, and renderer services.

Deferred/rejected for the current demo:
- replacing QuestionIR or current canonical contracts;
- flattening/replacing the MST-MATH taxonomy to match another product;
- making Word, LaTeX, a search document, embedding, or index the source of truth;
- bypassing QA to import a large corpus quickly;
- replacing current runtime persistence with PostgreSQL before the successor proposal is approved;
- introducing a dedicated vector/search/graph database without measured need.

## 2. Audited runtime path

```text
SOURCE DOCX
  -> Word preflight / non-destructive safe-clean
  -> Document IR parse
  -> question segmentation
  -> normalization into QuestionObject / QuestionIR-compatible structures
  -> figure association
  -> structural validation + Exam QA
  -> REVIEW or QUARANTINED
  -> duplicate / relation analysis + provenance audit
  -> Question Bank repository
  -> explicit human approval
  -> search / filter / exact-ID retrieval
  -> APPROVED-only reuse path
  -> consumer rehydration + current-authority check
  -> readiness / QA / lineage gate
  -> assessment / game / export / render
```

## 3. Existing controls confirmed

### 3.1 Ingestion is fail-closed

Imported questions are not automatically promoted to APPROVED. Structural failure, blocked Exam QA, or NOT_TESTED required QA causes QUARANTINED; otherwise new questions enter REVIEW.

### 3.2 Provenance is preserved

Question provenance includes source document/hash and source locations. The canonical-integrity baseline also preserves processing lineage for non-destructive source transformations. Exact-duplicate handling records duplicate audit provenance instead of silently treating a search index as the mathematical authority.

### 3.3 Repository remains the runtime authority

The current runtime uses the existing repository contract and JSON/memory implementations. JSON persistence validates round-trip serialization and writes through a temporary file followed by rename. Search reads the repository; it is not a separate source of truth.

### 3.4 Assessment generation is APPROVED-only

Assessment generation uses the safe reuse path and excludes duplicate / possible-duplicate candidates from final selection.

### 3.5 Export is already strongly gated

Teacher workflow readiness rehydrates current questions, checks identity and source lineage, evaluates current question QA state, and permits export only on authoritative PASS. WARN, REVIEW, UNKNOWN, and FAIL do not become export-ready.

## 4. Findings fixed in this branch

### F1 — Invalid search filters could fail open

Previous behavior emitted UNKNOWN_FILTER and then removed some invalid filter values, which could broaden the query unintentionally.

Fix:
- invalid question type, bank status, duplicate state, or relation type now fails closed;
- result is empty and includes UNKNOWN_FILTER;
- valid sort/pagination compatibility behavior is preserved.

Gate:
`INVALID_FILTER_FAIL_CLOSED_QA`

### F2 — Stale assessment reuse could bypass current authority

Assessment generation selected APPROVED questions, but later materialization used unrestricted ID lookup. A selected question could therefore be downgraded after assessment creation and still be materialized.

Fix:
- materialization distinguishes NOT_FOUND from NOT_APPROVED;
- current bankStatus must still be APPROVED;
- question type, source document, and source hash must still match the assessment reference;
- changed lineage fails as STALE.

Gates:
- `ASSESSMENT_REUSE_AUTHORITY_QA`
- `ASSESSMENT_STALE_LINEAGE_QA`

### F3 — Classroom game reused stale IDs without a current APPROVED check

Student-question materialization and answer submission previously used unrestricted ID lookup.

Fix:
- both surfaces require current APPROVED status;
- both verify type + source document + source hash against the assessment/game reference;
- downgraded or lineage-changed questions fail closed.

Gates:
- `GAME_REUSE_AUTHORITY_QA`
- `GAME_STALE_LINEAGE_QA`

## 5. Compatibility constraints preserved

This branch does NOT:
- change QuestionObject/QuestionIR schema;
- alter canonical question identity;
- change provenance fields or source identity semantics;
- alter approval workflow;
- replace repository storage;
- introduce a search index as authority;
- change assessment reference schema;
- weaken export readiness;
- merge the PostgreSQL/hybrid-retrieval successor proposal.

`getById()` remains available for review/admin surfaces. A new `getApprovedById()` is used only for consumer-safe reuse.

## 6. Residual gap intentionally not forced into this change

`TeacherWorkflowService.prepareVideo(questionId)` currently starts from unrestricted `getById()` before delegating to the Studio integration. The final video pipeline contains other math/visual gates, but the retrieval entry point should eventually consume the same APPROVED/current-lineage policy before broad production exposure.

Decision: record as follow-up rather than rewriting the large teacher-workflow surface in this focused retrieval patch without a dedicated regression pass.

Recommended follow-up gate:
`VIDEO_REUSE_AUTHORITY_QA`

## 7. Storage / search architecture decision

The current JSON repository is retained for the present demo because replacing it now would be a structural migration, not an additive UX improvement.

The existing successor proposal `MST-MATH Problem Knowledge Base + Retrieval Architecture V1.0` remains the correct place to evaluate:
- PostgreSQL as production Source of Truth;
- rebuildable lexical/fuzzy/vector/math-structure projections;
- hybrid candidate retrieval;
- fusion and domain reranking;
- unified retrieval audit trail.

That proposal must stay DRAFT/PROPOSED until its compatibility, persistence round-trip, provenance, index rebuildability, retrieval regression, and human-approval gates pass.

## 8. Demo policy after this audit

For the demo, prefer convergence over new architecture:

```text
BROWSE / SEARCH
  -> SELECT STABLE IDs
  -> CURRENT APPROVED CHECK
  -> CREATE ASSESSMENT / MATERIAL
  -> CURRENT LINEAGE + QA CHECK
  -> EXPORT / RENDER
```

Do not block the demo on PostgreSQL, vector retrieval, OpenSearch, Qdrant, Neo4j, or a large corpus.

## 9. Regression evidence added

New regression:
`tests/test-question-bank-retrieval-authority-v1.ts`

It covers:
- invalid-filter fail-closed behavior;
- APPROVED-only ID lookup;
- assessment reuse after downgrade;
- assessment stale-lineage detection;
- classroom-game reuse after downgrade;
- classroom-game stale-lineage detection.

The suite is registered in `scripts/run-regression.mjs`.

Repository CI/runtime execution status must be reported separately from test-definition status; adding a test is not equivalent to proving it has executed successfully.

## 10. Final audit classification

| Area | Classification | Action |
|---|---|---|
| Source provenance | PASS | Keep |
| Import QA / quarantine | PASS | Keep |
| Human approval boundary | PASS | Keep |
| Duplicate provenance | PASS | Keep |
| Repository as runtime authority | PASS | Keep |
| Invalid filter behavior | FIXED | Fail closed |
| Assessment initial selection | PASS | Keep APPROVED-only |
| Assessment later materialization | FIXED | Revalidate current authority |
| Game question reuse | FIXED | Revalidate current authority |
| Export readiness / lineage gate | PASS | Keep fail-closed |
| Video direct-ID entry | FOLLOW-UP | Add current-authority guard in focused change |
| PostgreSQL / hybrid retrieval | SUCCESSOR ONLY | Keep in proposal; do not force before demo |
| Noctorium-like browse/select UX | SAFE ADDITIVE | Implement as projection/application layer |

## 11. Governance conclusion

The safe rule is now explicit:

> Learn the better workflow, not a foreign authority model.

> Add UI, adapters, projections, and consumer-safe retrieval where compatible. If a change would modify LOCKED/CANONICAL semantics or persistence authority, defer it to a versioned successor with full gates and human approval.
