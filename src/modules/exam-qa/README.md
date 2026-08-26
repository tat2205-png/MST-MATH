# NA Math Exam QA & Marker Engine

This additive module consumes normalized exam/question data and returns deterministic structural QA results. It is downstream of document parsing and the Question Bank; it does not parse DOCX/PDF/image input, mutate questions, solve mathematics, or participate in current production orchestration.

Data flow: normalized exam source → schema/structural validators → per-question issues and validator evidence → fail-closed status → neutral marker answer data. `READY` requires every configured required validator to execute. A missing required execution yields `NOT_TESTED`; blockers yield `BLOCKED`; errors and warnings require review under the default policy.

Issues use stable codes separately from messages. Marker answers distinguish single-choice keys, boolean statement arrays, and canonical dot-decimal short answers; Vietnamese comma formatting is display-only. Essay/unknown questions remain in the model but are marker-unsupported.

The generic Question Bank adapter is deliberately one-way and preserves unknown source fields in metadata. It does not depend on parsers or change a source schema. The required Vietnamese language validator performs conservative, deterministic punctuation, whitespace, delimiter, Unicode, connector, decimal-consistency, and unit-format diagnostics over field-level prose while preserving source text and embedded math spans. Suggestions are advisory metadata only; full dictionary or AI proofreading is not claimed.

The required mathematical logic validator builds a question-local symbol table and checks conservative geometry declarations, construction dependencies, target/option references, statement-local scope, redefinitions, self-reference, and limited explicit contradictions. It recognizes common point clusters, planes, and primed/subscripted labels. This checks formulation coherence only: it does not solve a question, prove a theorem, infer missing measurements, or verify an answer. Structured `metadata.logicSymbols` may provide parser-supplied declarations; raster figures are never inspected and unresolved figure-only references remain unverified. Required logic execution participates in the same fail-closed validator evidence as structural and language QA.

Deterministic answer verification, TNMarker template mapping/OCR, review UI, and document export remain deferred to EXAM-QA-3 through EXAM-QA-5.
