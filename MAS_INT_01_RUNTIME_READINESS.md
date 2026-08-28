# MAS-INT-01 Runtime Readiness

Verified on 2026-08-28 from recovery branch
`integration/mas-int-01-finalize`.

MAS_INT_01_STATUS=PASS

OVERALL_STATUS=POST_QB_STUDIO_INTEGRATION_READY

POST_QB_STUDIO_SOURCE_BASELINE=c848cf55edd1675a6254ce66569ab6ad4a7a2f3b

POST_QB_STUDIO_BASELINE=PENDING_FINAL_ACCEPTANCE_HEAD

POST_QB_STUDIO_BASELINE_STATUS=PENDING_CLEAN_CHECKOUT

REQUIRED_RUNTIME_BLOCKERS=NONE

QUESTION_BANK_BASELINE=943186335bcc380994111cac6535aefd3ac9e2a9

RELEASE_BASELINE=e6edcfd737e3fc4c575bf42e87822317deee914f

RELEASE_BASELINE_TAG=v1.3-rc.1

NEXT_TASK=UX-01

## Scope and ancestry

The source baseline is the merge of the frozen Question Bank baseline into the
existing Studio/DOCX line. Git ancestry checks prove that it contains the
Question Bank baseline, Studio/DOCX parent `1c4e2898b0e9ec5224e839f2fa11bae875d969b2`,
and release baseline `e6edcfd737e3fc4c575bf42e87822317deee914f`.
The recovery adds checkpoint evidence only and does not add product features.

## Runtime readiness matrix

| Component | Required? | Availability | Version / implementation | Health | Integration QA | Classification | Blocker | Evidence |
|---|---:|---|---|---|---|---|---|---|
| Node.js | Yes | Available | v24.19.0 | PASS | `lint`, `build`, `qa:ci` PASS | REQUIRED_PASS | No | Direct version and repository gates |
| npm | Yes | Available | 11.17.0, `package-lock.json` | PASS | `qa:full` package-manager gate PASS | REQUIRED_PASS | No | Direct version and lockfile inspection |
| Build runtime | Yes | Available | Vite 6.4.3 + esbuild | PASS | Production client/server build PASS | REQUIRED_PASS | No | `npm run build` |
| Filesystem | Yes | Available | Repository-local persistence/artifacts | PASS | Atomicity and path-safety QA PASS | REQUIRED_PASS | No | QB-1D/QB-2D regression |
| Git | Yes | Available | 2.55.0.windows.3 | PASS | ancestry and clean-state checks PASS | REQUIRED_PASS | No | Direct Git inspection |
| Math Engine | Yes | Available | Deterministic parser/solver/verifier | PASS | 60/60 math regression PASS | REQUIRED_PASS | No | `tests/math-regression.ts` |
| Math Verification | Yes | Available | Fail-closed math gate | PASS | solution/video math gate PASS | REQUIRED_PASS | No | QB-2C and live video runtime |
| Exam QA | Yes | Available | language and mathematical logic validators | PASS | Question normalization adapter PASS | REQUIRED_PASS | No | QB-1B integrated regression |
| Question Bank | Yes | Available | QB-1A through QB-2D | PASS | 25-suite regression PASS | REQUIRED_PASS | No | `npm run qa:regression` |
| DOCX import | Yes | Available | deterministic DOCX/OMML ingestion | PASS | import-to-bank E2E PASS | REQUIRED_PASS | No | QB-1A through QB-1E |
| DOCX export | Yes | Available | NA-MATH Word exporter | PASS | structure/math/figure/roundtrip PASS | REQUIRED_PASS | No | QB-2D and DOCX suites |
| OMML | Yes | Available | import parser and native export | PASS | OMML parsing and DOCX math PASS | REQUIRED_PASS | No | QB-1A/QB-2D regression |
| LaTeX | Yes | Available | deterministic conversion/export | PASS | conversion/compile/fidelity PASS | REQUIRED_PASS | No | QB-1A/QB-2D regression |
| PDF | Yes | Available | existing assessment delivery path | PASS | layout/content/math/artifact PASS | REQUIRED_PASS | No | QB-2D regression |
| Manim | Yes | Available | Community v0.19.2 | PASS | real render canary PASS | REQUIRED_PASS | No | bridge health and `qa:question-video:runtime` |
| LuaDraw | No | Available | MiKTeX LuaLaTeX + LuaDraw package | PASS | doctor, smoke render, contract PASS | OPTIONAL_PASS | No | `npm run qa:luadraw` |
| Local Render Bridge | Yes | Available | golden-path-v1.3, loopback port 8765 | READY | real MP4/frame artifact path PASS | REQUIRED_PASS | No | `/health` and live video runtime |
| Auto Repair | Yes | Available | OpenClaw 2026.7.1-2 | PASS | real repair smoke PASS | REQUIRED_PASS | No | `npm run qa:full` |
| Math Visual | No | Available | existing VisualTab/graph/visual planner | PASS | graph and Studio routing PASS | OPTIONAL_PASS | No | integrated regression |
| Dynamic Geometry / GeoGebra | No | GeoGebra host absent; repository geometry router available | validated 2D/3D contracts | PASS for router | geometry and graph regression PASS | NOT_AVAILABLE_NON_BLOCKING | No | executable and registry inspection |
| Fold / Unfold | No | Not present in this frozen candidate | separate later branch | NOT_APPLICABLE | Not part of Post-QB path | NOT_AVAILABLE_NON_BLOCKING | No | source-tree and ancestry inspection |
| Image Animation core | No | Orchestration capability available | Studio registry/adapters | PASS | registry routing covered | OPTIONAL_PASS | No | engine-registry inspection |
| Segmentation runtime | No | Core abstraction only | Studio registry | NOT_TESTED | Outside Post-QB path | NOT_AVAILABLE_NON_BLOCKING | No | registry classification |
| Depth runtime | No | Runtime absent | optional depth adapter | NOT_AVAILABLE | Outside Post-QB path | NOT_AVAILABLE_NON_BLOCKING | No | registry classification |
| Blender runtime | No | Executable absent; router only | optional Blender route | NOT_AVAILABLE | Outside Post-QB path | NOT_AVAILABLE_NON_BLOCKING | No | executable and registry inspection |
| TTS/audio | No | deterministic fallback available; `edge-tts` absent | EdgeTtsEngine + FFprobe | AVAILABLE | narration contracts PASS | OPTIONAL_PASS | No | source/runtime and regression inspection |
| AI providers | No | credentials not configured | optional provider adapters | SKIPPED | false-positive fixture QA PASS | NOT_AVAILABLE_NON_BLOCKING | No | frame QA and `.env.example` |

## Verified gates

- TypeScript: `npm run lint` — PASS.
- Build: `npm run build` — PASS.
- Architecture: `npm run arch:check` — PASS with 0 errors and 4 existing warnings.
- Regression: `npm run qa:regression` — 25/25 suites PASS.
- QA CI: `npm run qa:ci` — PASS.
- QA Full: `npm run qa:full` — PASS, including server health, OpenClaw
  health, real repair smoke, and post-repair TypeScript/build.
- Post-QB live video: `npm run qa:question-video:runtime` — PASS with a
  real MP4 and START/KEY/END PNG artifacts.
- LuaDraw: `npm run qa:luadraw` — PASS.
- Vietnamese, math, figure, Question ID traceability, source immutability,
  student/teacher answer isolation, configuration, feature-flag, and artifact
  checks — PASS through the registered QB and Studio suites.
- Optional Gemini frame analysis — SKIPPED because credentials are absent;
  deterministic frame structure and math provenance remained PASS.

## Architecture warnings

The architecture gate reports four non-blocking existing warnings: two
review-required UI boundary imports, one orphan pronunciation utility, and one
duplicate dependency-type warning for Vite. It reports zero errors.

## Acceptance convention

This evidence commit is the source checkpoint to validate from a clean
temporary worktree. A documentation-only acceptance commit records its hash as
`POST_QB_STUDIO_BASELINE` after the clean-checkout gates pass, avoiding an
impossible self-referential commit hash.
