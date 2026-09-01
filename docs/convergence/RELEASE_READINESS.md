# Release Readiness — MAS-FINAL-APP-CONVERGENCE-01

Status: **BLOCKED pending provisioned-host runtime certification**

The supported deterministic application scope is source-ready: TypeScript, architecture check (warnings only), production build, teacher workflow, document pipeline, Math/Geometry/Fold engines, Question Bank, assessment/game/video contracts, NA-MATH V2.6, DOCX/PDF export, accessibility/responsive contracts, and 66 non-network regression suites pass. The macOS PDF and LuaDraw compiler invocations are now portable and fail closed.

Release publication is not authorized by this task and no version is guessed. The current latest release is `v1.3.0`; the target release must be selected through the existing release process after runtime certification.

## Required external validation

- Provision `python`, Manim and Edge TTS.
- Provision PowerShell 7 for the repository's existing launcher/release gate, or separately authorize a future cross-platform launcher task.
- Run outside a sandbox that forbids loopback listeners.
- Verify bridge health/capabilities, then execute `npm run release:gate`.
- Execute the real Manim/FFmpeg golden runtime and mobile 9:16 frame review.

## Known limitations

- Supported import format is DOCX. PDF/image import is not claimed.
- Real MP4 generation depends on optional external runtimes and provider configuration.
- Final MP4 storage remains temporary/internal as documented in the v1 runbook.
- Graph inference is safe only for the existing verified supported corpus; unknown forms must remain review/unsupported.

`RELEASE_CANDIDATE_READY=BLOCKED`

