# MST-MATH — DATA CALL / PROCESSING LINE RE-AUDIT V2

DATE=2026-09-05
MODE=READ_ONLY_AUDIT
STATUS=CONTROL_ROOM_APPROVED_DIRECTION_IMPLEMENTATION_HOLD

## Executive conclusion

MST-MATH is correctness-oriented and increasingly efficient, but the end-to-end data call line is not yet optimal. PR #31 solves a major Question Bank repeated-read problem, but the next bottlenecks are transport/object duplication, split source-ingest authority, figure payload amplification, and full-artifact browser/server bouncing.

The correct optimization target is:

`DECODE ONCE → NORMALIZE ONCE → CLASSIFY ONCE → VERIFY CONDITIONALLY → CACHE EVIDENCE → RENDER ON DEMAND`

Extended target:

`SOURCE → SOURCE ROUTER → BINARY HASH → CANONICAL SOURCE ARTIFACT → SEMANTIC IR → CONDITIONAL QA → VERIFIED ARTIFACT ENVELOPE → INTENT ROUTER → MINIMUM REQUIRED DAG → RENDER ON DEMAND`

## Current lines

### Teacher document line

`Browser File → DataURL/base64 → JSON POST → Buffer/Uint8Array → Safe Clean → Document/Question processing → Question Bank → Question DTO → figure bytes → base64 data URLs → Browser`

Issues:
- base64 inflates input size;
- file is copied multiple times;
- query/import DTOs may embed large figure data URLs;
- questionForClient clones binary payload before replacing figures;
- readiness/export/game can request additional full bank views.

### Studio line

`Browser File/Text → base64/JSON → ProblemParser AI → ProblemIR → Browser → Solve API → Browser → Verify API → Browser → Visual API → Browser → Video API`

Issues:
- full semantic artifacts bounce through the browser after every stage;
- PDF/DOCX Studio input is a parallel path from canonical Teacher/Document ingest;
- non-text binary source hash is not established before AI extraction;
- ProblemIR repeats source text across several fields;
- both step endpoints and full-pipeline endpoint exist;
- Visual/Video AI generate renderer-specific code too early.

## Priority risks

### P0/P1 — Split document ingest authority

Teacher DOCX uses canonical safe-clean/document/question processing while Studio can send PDF/DOCX directly as provider binary input. This is both an efficiency problem and a provenance/authority problem.

Decision:
`ONE SOURCE ROUTER / ONE CANONICAL INGEST ENTRY`

### P0/P1 — Figure DTO amplification

Binary figure payload must not travel inside routine Question DTO/search responses.

Decision:
`QUESTION DTO = SEMANTIC DATA + ASSET REFS`
`ASSET BYTES = LAZY CONTENT-ADDRESSED DELIVERY`

### P1 — Artifact bounce

Downstream calls should use artifact IDs/content hashes rather than retransmitting ProblemIR/Solution/Verification/VisualSpec wholesale.

Decision:
`SERVER-SIDE ARTIFACT STORE + VERIFIED ARTIFACT ENVELOPE`

### P1 — BankContext

PR #31 caches decoded JSON and makes Assessment single-snapshot. Next step is an internal immutable revision context so readiness/export/game/search can reuse one trusted snapshot/index set without repeated full structuredClone operations.

Decision:
`LOAD/INDEX ONCE PER REVISION/REQUEST → READ MANY`

### P1 — Full-scan text search

PR #31 still scans all questions for free-text queries. Defer storage migration until benchmark.

Decision:
`BENCHMARK → REVISION SEARCH INDEX OR SQLITE FTS`

### P1 — Whole-snapshot writes + embedded asset bytes

JSON replacement still serializes/writes the entire bank and stores figure bytes as base64.

Decision:
Evaluate content-addressed AssetStore before/with SQLite migration; preserve QuestionIR semantics.

### P1 — Fabricated visuals

VisualPlanner fallback invents generic geometry/graph data on provider failure.

Decision:
`PROVIDER FAILURE → NOT_RUN/REVIEW_REQUIRED`, never fabricated geometry in authoritative path.

### P1 — Premature renderer generation

Visual AI currently emits semantic spec + TikZ/Asymptote/GeoGebra. Video AI emits scene design + full Manim Python.

Decision:
`VisualIR → requested renderer`
`SceneIR/Timeline → deterministic Manim compiler`

## Revised implementation packages

DL-0 OBSERVABILITY
- bytes-in/out per API
- latency p50/p95
- bank revision
- repository cache hit/miss
- structured-clone count/bytes where measurable
- AI calls/tokens
- candidate set size

DL-1 LIGHTWEIGHT DTO / LAZY ASSET
- remove binary/data URLs from default Question DTO
- confirmed asset refs only
- lazy asset endpoint
- optional thumbnails

DL-2 BINARY UPLOAD / SOURCE HASH
- multipart/binary upload
- SHA-256 original bytes before transformation/provider
- eliminate DataURL/base64 JSON as default document transport

DL-3 UNIFIED SOURCE ROUTER
- text/image/PDF/DOCX routing
- canonical document path for documents
- ProblemParser consumes canonical normalized artifact

DL-4 ARTIFACT ENVELOPE
- content-addressed source/problem/solution/verification artifacts
- browser passes IDs + hashes
- invalidation on semantic change

DL-5 BANK CONTEXT
- request/revision-scoped immutable snapshot
- byId/stats/search metadata indexes
- reuse across readiness/export/game

DL-6 INTENT DAG
- target PARSE/SOLVE/VERIFY/VISUAL/VIDEO
- execute only required ancestors
- deterministic-first verification where supported

DL-7 SEMANTIC RENDER PIPELINE
- fail-closed visual planning
- VisualIR renderer-on-demand
- SceneIR/Timeline deterministic compiler

DL-8 DOCX FAST PATH
- preserve all safety checks
- no rewrite/re-zip when preflight proves no transformation required

DL-9 SCALE BENCHMARK
- 1k / 10k / 50k questions
- snapshot size
- cold/hot load
- search p50/p95
- assessment
- import candidate count
- write time
- RSS/heap
- decide AssetStore / persistent index / SQLite

## What must not be removed in the name of performance

- provenance
- source hash
- DocumentIR / QuestionIR authority
- deterministic verification
- fail-closed QA
- export guard
- human approval
- zero-inference

Optimization rule:

`REMOVE DUPLICATE WORK, NOT SAFETY RESPONSIBILITY.`

## Control status

PR31=CI_GREEN_DRAFT_NOT_MERGED
MAC_B3=RUNNING_REPORT_PENDING
NEW_SOURCE_TASK=HOLD
NEXT_ACTION=REPORT_VERIFY_RECONCILE_ASSIGN
