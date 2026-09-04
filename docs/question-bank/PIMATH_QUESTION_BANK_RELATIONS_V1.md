# PiMath Question Bank Relations V1

This extension keeps `QuestionObject` as the canonical question authority. It adds a backward-compatible `relations` sidecar to `QuestionBankSnapshot`; schema-version 1 snapshots without the sidecar remain loadable.

## Policy

Relations are deterministic and source-format agnostic. `EXACT_DUPLICATE` has precedence over every other relation and retains the first valid source-order occurrence. The redundant QuestionObject is removed from the canonical bank, while `DuplicateAuditRecord` preserves its id, source document/hash/locations, evidence, and policy version. This never deletes or modifies DOCX, PDF, PNG, JPG, or other source files.

Parametric variants keep all questions and may share a deterministic `QuestionFamily`. Shared stem, shared data, and shared figure keep all questions; a figure identity alone is never duplication. Dependencies and derived relations are retained as links and do not synthesize missing context. Source conflicts are never auto-resolved and require review. Similarity that cannot be proven is review-only.

## Architecture and pipeline

The existing ingest, canonical extraction, normalization/QA, `QuestionObject`, `questionFingerprint`, bank service, repository, search, assessment, and export contracts are reused. Relation analysis runs after canonical extraction and before insertion in `QuestionBankService`. No PDF/image parser, OCR engine, Electron logic, parallel IR, second repository, or parallel dedup engine is introduced.

The V1 comparison preserves canonical math objects and values, including signs, fractions, powers, roots, inequalities, coordinates, units, options, statements, and subquestions. Answer/solution disagreement prevents silent deduplication and is recorded as source conflict. AI has no destructive authority: fuzzy AI auto-delete and auto-merge are forbidden.

## Known limits and future integration

V1 only assigns relations that existing canonical structures prove safely. Dependency, shared-data, and richer semantic-family suggestions require upstream canonical evidence and are intentionally not inferred from wording. Desktop integration may consume the sidecar through the existing repository/search service in a later workstream.
