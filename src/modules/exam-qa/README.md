# NA Math Exam QA & Marker Engine

This additive module consumes normalized exam/question data and returns deterministic structural QA results. It is downstream of document parsing and the Question Bank; it does not parse DOCX/PDF/image input, mutate questions, solve mathematics, or participate in current production orchestration.

Data flow: normalized exam source → schema/structural validators → per-question issues and validator evidence → fail-closed status → neutral marker answer data. `READY` requires every configured required validator to execute. A missing required execution yields `NOT_TESTED`; blockers yield `BLOCKED`; errors and warnings require review under the default policy.

Issues use stable codes separately from messages. Marker answers distinguish single-choice keys, boolean statement arrays, and canonical dot-decimal short answers; Vietnamese comma formatting is display-only. Essay/unknown questions remain in the model but are marker-unsupported.

The generic Question Bank adapter is deliberately one-way and preserves unknown source fields in metadata. It does not depend on parsers or change a source schema. Language/typography QA, mathematical logic, deterministic answer solving, TNMarker template mapping/OCR, review UI, and document export are deferred to EXAM-QA-1 through EXAM-QA-5.

