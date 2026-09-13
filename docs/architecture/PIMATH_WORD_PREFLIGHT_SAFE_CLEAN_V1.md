# PIMATH WORD PREFLIGHT & SAFE CLEAN V1.0

STATUS=IMPLEMENTED_ON_FEATURE_BRANCH
MODE=FAIL_CLOSED
DNA_AUTHORITY=NO
SOURCE_OVERWRITE=FORBIDDEN
AI_SEMANTIC_AUTHORITY=NO

## Purpose

PiMath Word Preflight & Safe Clean is a conservative DOCX hygiene layer placed before canonical document ingestion. It detects technical noise and risky package features, reports a document health score, and can generate a separate `.PIMATH-CLEAN.docx` copy without rewriting PiMath DNA, mathematical meaning, geometry, or canonical source identity.

## Non-negotiable invariants

1. The uploaded/source DOCX byte array is never mutated.
2. SAFE CLEAN never overwrites the original source file.
3. Canonical Teacher Workflow ingestion continues to consume the original DOCX bytes so the existing source hash and provenance remain authoritative.
4. OMML, OLE/MathType-compatible objects, DrawingML, VML, fields, hyperlinks, tracked changes, relationships, media, and embedded objects are protected.
5. A protected package fingerprint is computed before and after cleaning. Any mismatch fails closed with `WORD_SAFE_CLEAN_QA_FAIL`.
6. Critical OOXML object counts must remain stable after cleaning.
7. Macro/ActiveX content inside a `.docx` is blocked by preflight.
8. Encrypted ZIP entries, ZIP64 packages, unsafe archive paths, oversized packages, and malformed DOCX packages are blocked.
9. SAFE CLEAN does not delete empty paragraphs, comments, tracked changes, or style definitions automatically because those may carry layout/review intent.
10. No cloud provider or AI model is required.

## SAFE CLEAN transformations

Default SAFE mode may only:

- normalize repeated ASCII spaces/tabs inside ordinary `w:t` text nodes that do not use `xml:space="preserve"`;
- remove non-semantic `w:proofErr` proofing markers;
- remove Word revision-session `w:rsid*` attributes only when tracked changes are absent;
- clear `dc:creator` and `cp:lastModifiedBy` from the generated clean copy.

Protected OOXML regions are masked and restored byte-for-byte during document XML cleaning.

## Explicitly out of scope for SAFE V1

- automatic style consolidation;
- paragraph deletion;
- automatic header/footer deletion;
- accepting/rejecting Track Changes;
- deleting comments;
- replacing fonts;
- changing PiMath typography/layout profiles;
- MathType/OMML conversion;
- image conversion;
- relationship rewrites;
- automatic promotion of the cleaned copy as the canonical source.

Those operations belong to a future reviewed `STANDARD` or `AGGRESSIVE` mode and must not be silently added to SAFE mode.

## Preflight report

The report includes:

- SHA-256 of the original input;
- health score 0–100;
- risk level `LOW | MEDIUM | HIGH | BLOCKED`;
- paragraph/table counts;
- OMML/OLE/DrawingML/VML counts;
- tracked changes/comments/fields/hyperlinks;
- style and relationship counts;
- external relationship count;
- media/embedding counts;
- macro/ActiveX count;
- repeated plain-text whitespace, empty paragraphs, and proofing markers;
- ZIP entry/uncompressed-size metrics;
- protected fingerprint;
- structured issues.

## Application integration

The backend registers:

- `GET /api/word-preflight/status`
- `POST /api/word-preflight/analyze`
- `POST /api/word-preflight/safe-clean`

`safe-clean` returns the generated DOCX as `cleanedBase64` plus the before/after QA report. The output filename is suggested as `<name>.PIMATH-CLEAN.docx`.

Teacher Workflow DOCX import runs preflight against the original bytes before Question Bank ingestion and adds `WORD_PREFLIGHT_*` diagnostics to the existing review UI. It does **not** silently ingest the cleaned copy; this preserves canonical source identity.

## Security limits

- compressed input: max 50 MiB;
- total declared uncompressed ZIP content: max 200 MiB;
- single ZIP entry: max 60 MiB;
- ZIP entries: max 20,000;
- encrypted entries: blocked;
- ZIP64: blocked in V1;
- path traversal: blocked;
- macro/ActiveX parts: blocked.

## QA

Regression suites:

- `tests/test-word-preflight-safe-clean-v1.ts`
- `tests/test-teacher-word-preflight-integration-v1.ts`

Required gates:

- TypeScript QA;
- build QA;
- Word preflight regression;
- teacher workflow regression;
- existing full regression.

No SAFE CLEAN result may be labeled PASS if source mutation, protected fingerprint drift, protected-part loss, relationship loss, or critical OOXML count drift is detected.
