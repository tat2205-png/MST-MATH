# MST-MATH — DATAFLOW OPTIMIZATION PLAN V1

STATUS=PROPOSED
IMPLEMENTATION=HOLD

## Target principle
`DECODE ONCE -> NORMALIZE ONCE -> VERIFY CONDITIONALLY -> CACHE EVIDENCE -> RENDER ON DEMAND`

## Work packages

### DF-0 — Source Router convergence
Create one source-routing boundary that dispatches text/image/single-problem and DOCX/PDF/document inputs into existing decoders while preserving current DocumentIR/QuestionIR authority.

### DF-1 — Verified Artifact Envelope
Bind source/problem, solution, verification and hashes into an immutable/cached envelope so downstream Visual/Video/Export gates consume the same certified evidence rather than recomputing the same gate for unchanged artifacts.

### DF-2 — Deterministic-first verification
For supported deterministic problem types, run deterministic verification first. AI verification becomes secondary/adversarial/pedagogical review when needed; unsupported/ambiguous cases may route to AI plus human review.

### DF-3 — Visual semantic planning only
Visual Planner outputs semantic Visual/Geometry/Graph IR only. Remove authoritative fabricated fallbacks. TikZ/Asymptote/GeoGebra/SVG/Manim adapters compile on demand.

### DF-4 — Video plan/compile separation
Video Planner outputs pedagogical Scene/Lesson plan. Renderer compiler converts the approved semantic plan to Manim. Avoid one large AI call that simultaneously plans pedagogy and writes full renderer code.

### DF-5 — DOCX package reuse / no-op clean path
Preserve preflight and protected fingerprints, but avoid redundant ZIP inflate/deflate/reopen when no clean changes are needed. Reuse package analysis where safe.

### DF-6 — Question Bank indexing
Maintain indexes for source identity, canonical content fingerprint, variant/structure fingerprint and figure association. Compute per-question fingerprints once. Narrow relation candidates before deep comparison.

### DF-7 — Studio Orchestrator role cleanup
StudioOrchestrator remains an orchestration/diagnostics facade over existing authorities. It must not become a second content pipeline or production source of hardcoded fixture artifacts.

### DF-8 — Latency/cost observability
Measure stage latency, provider calls, token counts, bytes processed, number of repeated hashes/serializations and Question Bank candidate comparisons. Optimize from evidence rather than intuition.

## Acceptance targets
- One source-routing authority.
- No duplicate canonical pipeline.
- No renderer-specific code produced unless requested.
- No repeated gate evaluation for unchanged verified artifact.
- No fabricated visual fallback.
- Question Bank relation lookup scales by indexed candidate sets, not full corpus rescans.
- Provenance and correctness gates preserved.
