# MST-MATH — DATAFLOW OPTIMIZATION AUDIT V1

STATUS=STRATEGIC_AUDIT
IMPLEMENTATION=HOLD
BASELINE=integration/mst-math-convergence-v1@c80c8afa413e8090a14d3ea80c62db9560a1ffde

## Executive finding
Current architecture is correct in its core separation of source, semantic IR, QA, and rendering, but several paths over-process data or duplicate orchestration. The main optimization direction is:

`ONE SOURCE ROUTER -> ONE SEMANTIC ARTIFACT -> CONDITIONAL VALIDATION -> ON-DEMAND RENDER ADAPTERS`

Do not remove correctness gates. Remove duplicate transformations, proxy checks, premature renderer generation, and repeated full-corpus scans.

## Major findings
1. Studio E2E currently executes parse -> solve -> verify -> visual -> video as five sequential network/provider stages. Several stages repeat the same problem/solution payload and AI context.
2. Visual Planner asks generative AI to create semantic visuals plus TikZ, Asymptote, GeoGebra commands in one step even when only one output is needed. Renderer code should be produced on demand from semantic Visual/Geometry IR.
3. Video Planner asks generative AI to produce both pedagogical scene plan and full Manim Python. Planning and compilation should be separate; semantic Scene/Lesson IR should compile through renderer adapters.
4. Visual Planner contains fabricated fallback geometry/graphs. A provider failure can therefore create arbitrary coordinates/function graphs rather than fail closed. This must be removed from authoritative paths.
5. Math gate evaluation is repeated before Visual and again before Video. For deterministic types it may also recompute verification. Use a signed/immutable verified-artifact token or cached gate result bound to source+solution+verification hashes.
6. Provider-based solution verification currently runs even when deterministic verification can authoritatively resolve supported problem types. Prefer deterministic-first routing; call AI reviewer only for unsupported, ambiguous, pedagogical-review, or adversarial-check cases.
7. There are two user-facing processing models: direct Studio pipeline and Teacher Workflow/Question Bank ingestion. They should share one source routing and semantic authority layer rather than evolve as separate input architectures.
8. Teacher DOCX path always executes SAFE CLEAN and then reparses the resulting DOCX. Safe clean currently performs preflight, ZIP open/copy/clean/zip, then post-preflight. Preserve safety but add a no-op fast path when no allowed cleanup changes are required, or reuse the already-open package/metrics instead of reopening/reinflating.
9. Question Bank import scans all existing questions for duplicate detection and then scans all existing questions again for relation analysis. Fingerprints/content serializations are recomputed repeatedly. This approaches O(N^2) for growing corpora. Build persistent/indexed maps for stable source identity, canonical fingerprint, structure/variant fingerprint, and figure IDs; compute fingerprints once per question.
10. StudioOrchestrator contains a separate compatibility/experimental execution path over existing math services. Keep it as orchestration/diagnostics, not a second canonical content pipeline. Experimental fixture/hardcoded render flows must never become production authority.

## Proposed target flow

### Source ingestion
`SOURCE -> SourceRouter -> SourceArtifact`

Routes:
- Text/single problem
- Image/single problem
- DOCX/PDF multi-question document

The router chooses a decoder; it does not create parallel canonical IRs.

### Semantic processing
`SourceArtifact -> canonical semantic IR`

For a single problem: Problem/Question semantic artifact.
For a document: DocumentIR -> source-region classification -> question segmentation -> QuestionIR.

### Conditional intelligence
`semantic artifact -> classifier/router -> only-needed validators`

Examples:
- deterministic algebra verifier when supported
- geometry verifier only for geometry
- graph verifier only for graph tasks
- real-world validation only for contextual questions
- curriculum review only when metadata is missing/ambiguous

### Output
`verified semantic artifact -> output profile -> renderer adapter`

Do not generate TikZ + Asymptote + GeoGebra + Manim in advance.
Compile only the requested target.

## Performance / complexity priorities
P0 integrity:
- remove fabricated visual fallbacks
- no proxy QA PASS
- no duplicated authority pipeline

P1 latency/cost:
- deterministic-first verification routing
- verified-artifact cache/token
- semantic visual/video plan before renderer compilation
- unified SourceRouter

P1/P2 corpus scalability:
- QuestionBank fingerprint indexes
- relation candidate narrowing
- package/preflight parse reuse

## Non-goals
- no removal of provenance
- no removal of fail-closed QA
- no global rewrite
- no new QuestionIR/DocumentIR authority
- no merge of specialized validators into one generic AI validator

## Success metrics
- provider calls for common supported single-problem solve path reduced where deterministic validation is sufficient
- no repeated full verification gate recomputation across downstream steps for unchanged artifacts
- renderer generation only for requested output
- Question Bank duplicate/relation lookup based on indexes rather than all-item rescans
- zero fabricated geometry/graph fallback in authoritative runtime
- one source routing layer serving both Teacher Workspace and Advanced Studio
