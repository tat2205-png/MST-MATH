# Final App Convergence Audit

Task: `MAS-FINAL-APP-CONVERGENCE-01`  
Audit date: 2026-08-30  
Baseline: branch `audit/na-doc-04r-visual-architecture`, commit `c5f2754584eb122ae4353bd4a4a088f904b7f64d`  
Latest release: `v1.3.0`

## Conclusion

Math AI Studio is already a coherent v1.3 teacher application rather than a collection that needs redesign. The authoritative path is the Vietnamese `TeacherWorkspace` backed by `TeacherWorkflowService` and the existing Question Bank, assessment, classroom game, solution/video, document-export, Studio Orchestrator, Math IR, geometry, and verification modules. This run preserves that architecture.

`CONVERGENCE_AUDIT_QA=PASS`: repository structure, history, release tags, project-status evidence, source, tests, scripts, standards, Manim toolkit, and image-animation boundaries were inspected. Runtime release certification remains blocked by host capabilities and sandbox networking, not by a discovered P0 source defect.

## Current architecture and subsystem status

| Subsystem | Status | Repository evidence / release interpretation |
|---|---|---|
| Teacher workflow | COMPLETE | Import, review, approve, search/select, assessment, game, video preparation, preview/export UI and service are integrated. |
| Question Bank | COMPLETE | Segmentation, normalization, persistence, deduplication, search, stable IDs, provenance, assessments and reuse have deterministic suites. |
| Document import | PARTIAL | DOCX is authoritative and tested with OMML, figures, Vietnamese and immutability. PDF/image import is not advertised by the current UI and remains unsupported. |
| Document Engine | COMPLETE | Renderer-independent document/component/workspace contracts exist and consume NA-MATH V2.6. |
| DOCX export | COMPLETE | Native OMML, SVG figures, pagination/layout, package safety and golden corpus pass. |
| PDF export | COMPLETE | Authoritative LuaLaTeX path passes on macOS after platform-specific argument/cache hardening. |
| Math IR | COMPLETE | Preserved as the canonical semantic source; no replacement or parallel IR added. |
| Math verification | COMPLETE | Deterministic equation, domain, inequality and linear-system gates fail closed; 60/60 executed cases pass with 14 expected blocked cases. |
| Exam QA | COMPLETE | Deterministic structural/language/math QA adapter exists; uncertain content remains review/blocked. |
| Geometry/dynamic geometry | COMPLETE | Existing Math IR-based geometry, construction, constraint, workspace and validation suites pass. |
| Graph engine | PARTIAL | Existing supported corpus passes, but heuristic parsing/domain/asymptote inference is not safe as a universal math authority. Visual-pedagogy safety contracts quarantine unverified inference; broader replacement is deferred. |
| Fold/unfold | COMPLETE | Fold, pattern-fold, developable surface and shortest-path suites pass. |
| LuaDraw | PARTIAL | Contract/routing passes and compile invocation is cross-platform; real LuaDraw package runtime is not available on this host. |
| Manim/video | PARTIAL | Orchestration, timeline, compiler and artifact contracts pass. Real canary is unavailable because `python`/Manim is absent. |
| Image animation | PARTIAL | Core scene/timeline/router and adapter contracts exist; optional depth/segmentation/Blender/generative runtimes remain capability-gated. |
| Studio Orchestrator | COMPLETE | Routing, feature flags, runtime fallback, execution trace, validation and multi-engine canary contracts pass. |
| TTS/audio | PARTIAL | Edge TTS and FFmpeg boundaries exist; real Python/TTS runtime is unavailable on this host. |
| NA-MATH baseline | COMPLETE | Locked V2.6 tokens, roles, geometry standards, document integration, and QA remain authoritative and unchanged. |
| Student/assessment workflow | COMPLETE | Student answer isolation, assessment materialization/export, game flow and source immutability pass. |
| Accessibility/responsive UX | COMPLETE | Teacher surface provides labels, keyboard focus treatment, responsive layout, loading state and double-submit prevention; deterministic UX contract passes. |
| Persistence/error handling | COMPLETE | Question persistence and fail-closed diagnostics pass; optional engines report availability rather than fabricating success. |
| Release/CI | PARTIAL | TypeScript, architecture, build, deterministic suites and release gate exist. PowerShell and live bridge requirements prevent full gate execution on this host. |

## FC-01 classification

| Concept | Classification | Decision |
|---|---|---|
| Renderer-neutral visual semantics | ALREADY_COMPLETE | Math IR and Geometry Engine retained. |
| Semantic geometry construction | ALREADY_COMPLETE | Dynamic geometry/constraint engines retained. |
| Cross-renderer mathematical QA | PARTIAL_AND_REQUIRED | Additive visual-pedagogy validation and cross-renderer semantic comparison complete the release safety envelope. |
| Shared NA-MATH design tokens | ALREADY_COMPLETE | Locked V2.6 baseline retained. |
| Educational component registry | ALREADY_COMPLETE | Existing document component registry retained. |
| Pedagogical scene planning | PARTIAL_AND_REQUIRED | Bounded planning contract added without replacing Visual Planner/Video Planner. |
| Manim semantic motion grammar | PARTIAL_AND_REQUIRED | Semantic transition vocabulary added at the planning boundary. |
| Mathematical transition graph | NOT_REQUIRED_FOR_RELEASE | Deferred; no release-critical workflow needs a second graph engine. |
| Golden visual regression corpus | PARTIAL_AND_REQUIRED | Deterministic semantic golden corpus added; pixel/runtime corpus remains environment-dependent. |

`FC_01_VISUAL_PEDAGOGY_RELEASE_REQUIREMENTS=PASS` via `npm run qa:visual-pedagogy`.

## Duplicate responsibility and safety boundary

Math IR remains the source of mathematical truth. Geometry Engine, graph specifications, fold models, server `GeometrySpec`, image-animation scene graphs and renderer adapters are domain/output contracts, not competing authorities. Renderers may transform validated coordinates for display but may not infer roots, domains, relations, construction points, visibility, topology, or solution steps. Unknown semantics resolve to `REVIEW_REQUIRED` or `UNSUPPORTED`.

The graph engine is the most important residual risk: its current supported regression corpus is green, but its heuristic parser/analyzers must not be generalized or treated as independent verification. Fixing every future graph family is P2, outside this frozen release scope.

## Release critical path evidence

The deterministic fixture proves:

`DOCX import → immutable source blocks/OMML/figures → review → approved Question Bank ID → search/select → assessment/game reuse → verified solution/video job → JSON/DOCX/PDF export`

The workflow preserves source document provenance and Question IDs, isolates student answers/solutions, prevents duplicate submissions in the UI, and fails closed for unsupported/uncertain input. PDF and image import are explicitly unsupported rather than silently OCR'd or converted.

## Blockers and deferred scope

### P0 blockers

None found in the supported deterministic product scope.

### P1 release-certification blockers

1. The current host has no `python` command or Manim installation, so a real MP4 canary cannot run.
2. The current host has no `pwsh`, so the existing PowerShell release gate/launcher cannot run as documented.
3. The managed execution sandbox denies loopback `listen`, so four HTTP API suites and live bridge/server QA cannot execute here. Their service/validation/orchestration contracts pass.

### P2 deferred (7)

1. Official PDF import.
2. Official image/OCR import.
3. Broader verified graph-family semantics beyond the frozen corpus.
4. Persistent public MP4 artifact storage/reopen routing.
5. Pixel-level cross-renderer golden corpus on a provisioned runtime host.
6. Full tablet/mobile browser automation beyond deterministic responsive contracts.
7. Optional segmentation/depth/Blender/generative runtime integration.

### P3 future (4)

1. Additional renderer families.
2. General mathematical transition graph authoring.
3. Expanded classroom-game modes.
4. New document/media style systems (explicitly disallowed for this release).

## Release critical path

1. Reproduce deterministic QA on a normal host with loopback networking.
2. Install/verify Python, Manim, Edge TTS and PowerShell 7 according to the runbook.
3. Start and verify the local bridge, then run the existing release gate and real golden runtime.
4. If all runtime gates pass, prepare the next version using repository release conventions; do not guess a version from this audit.

