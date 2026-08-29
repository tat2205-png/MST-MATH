# Math AI Studio V1 — Local Runbook

## 1. V1 Scope

Math AI Studio V1 is a local/internal release. Its experimental Studio execution API is disabled by default and must be enabled explicitly for local Golden Path testing. The frozen Golden Path solves, verifies, animates, narrates, renders, and audits one supported algebra example through real Gemini, Edge TTS, Manim, FFmpeg, and Frame QA runtimes.

Segmentation, depth/2.5D, Blender, and generative-motion runtimes are optional and are not required by the core V1 Golden Path.

## 2. Prerequisites

Run commands from the repository root in PowerShell on Windows.

- Node.js and npm. The repository uses npm and `package-lock.json`, but does not declare a required Node/npm version.
- Python. The repository does not declare a required Python version.
- A valid Gemini API key with available quota.
- Edge TTS Python module. The verified runtime is Edge TTS 7.2.8.
- Manim Community Edition available to Python and through the `manim` command.
- `ffmpeg` and `ffprobe` available on `PATH`.

Do not upgrade dependencies as part of normal startup or troubleshooting.

## 3. Environment Variables

Create or update the local `.env` file without committing it:

```dotenv
GEMINI_API_KEY=<your-key>
```

The real Golden Path requires `GEMINI_API_KEY`. The `.env` file is local, matches the repository's `.env*` Git-ignore rule, and must never be committed or printed.

Experimental Studio execution is controlled separately by `STUDIO_INTEGRATION_CANARY`. It is false unless its value is exactly `true`.

## 4. Gemini Readiness

Check that `.env` contains a non-empty key without displaying its value:

```powershell
$configured = (Test-Path -LiteralPath .env -PathType Leaf) -and [bool](Select-String -LiteralPath .env -Pattern '^GEMINI_API_KEY=.+$' -Quiet)
Write-Output "GEMINI_CONFIGURED=$configured"
```

This checks configuration presence only; the real Golden Path test verifies provider access.

- HTTP 429 means provider quota/capacity is unavailable. Restore provider access or quota and retry later.
- HTTP 503 means the provider is temporarily unavailable or experiencing high demand. Retry according to provider availability.

Neither condition may trigger fixture math, a simulated result, or another false-success fallback. The pipeline must fail closed.

## 5. Local Bridge

Before starting the bridge, check whether port 8765 is already listening:

```powershell
Get-NetTCPConnection -LocalPort 8765 -State Listen -ErrorAction SilentlyContinue
```

If no project bridge is listening, start the repository bridge in its own PowerShell terminal:

```powershell
python local_bridge\bridge.py
```

The bridge binds to `127.0.0.1:8765` by default. Verify it without submitting a render:

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8765/health
Invoke-RestMethod -Uri http://127.0.0.1:8765/api/capabilities
```

Readiness requires a live bridge plus available Python, Manim, FFmpeg, and ffprobe runtimes. `/api/capabilities` must report `status: READY`, `rendererId: local.manim`, `runtimeReady: true`, `manimAvailable: true`, and `ffmpegAvailable: true`.

## 6. Studio Startup

The invariant is:

```text
STUDIO_EXPERIMENTAL_EXECUTION_DEFAULT=OFF
```

For an explicitly authorized local Golden Path session, set the flag only in that PowerShell process and start Studio:

```powershell
$env:STUDIO_INTEGRATION_CANARY = "true"
npm run dev
```

Studio listens on port 3000. Before starting another instance, check the port:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
```

Do not place `STUDIO_INTEGRATION_CANARY=true` in production configuration and do not change its default behavior.

## 7. Runtime Verification

Use these safe checks:

```powershell
node --version
npm --version
python --version
python -m edge_tts --version
manim --version
ffmpeg -version | Select-Object -First 1
ffprobe -version | Select-Object -First 1
Invoke-RestMethod -Uri http://127.0.0.1:8765/health
Invoke-RestMethod -Uri http://127.0.0.1:8765/api/capabilities
```

Use the configuration-presence command in section 4 for Gemini; never print the key.

## 8. Golden Path Test

The authoritative Golden Problem is:

```text
Giải phương trình 2x - 4 = 0.
```

The expected verified result is `x = 2`.

With the local bridge ready and `.env` configured, run the existing test that enters through the Studio API and lets the Studio Orchestrator coordinate every downstream stage:

```powershell
node -r dotenv/config --import tsx tests/studio-full-video-real-phase4b.test.ts
```

Do not replace this release proof with the Phase 4A.5 component diagnostic, which calls downstream components directly.

## 9. Expected Golden Path

```text
Studio API
→ Validation
→ Studio Orchestrator
→ Gemini Math parser/solver
→ Deterministic Verifier
→ Geometry routing
→ Scene Graph
→ Motion Timeline
→ Manim Toolkit
→ Manim Compiler
→ Edge TTS
→ Renderer routing
→ local_bridge:8765
→ Manim render
→ FFmpeg composition
→ Frame QA
→ Overlap QA
→ Final Math QA
→ Artifact QA
→ Result
```

Every mandatory stage is fail-closed.

## 10. Expected PASS Gates

A successful Golden Path reports at least:

```text
STUDIO_API_TO_FINAL_ARTIFACT_QA=PASS
REAL_GOLDEN_PATH_TRACE_QA=PASS
REAL_GOLDEN_PATH_RUNTIME=PASS
END_TO_END_PIPELINE_QA=PASS
VIDEO_RENDER_QA=PASS
AUDIO_VIDEO_QA=PASS
FRAME_QA=PASS
FINAL_VIDEO_MATH_QA=PASS
```

The test also asserts an H.264 video stream, AAC audio stream, positive duration and dimensions, safe artifact metadata, and all four full-video QA states.

## 11. Artifact Behavior

The generated final MP4 is currently a temporary/internal artifact. Studio returns safe metadata—media type, status, byte size, duration, codecs, dimensions, QA state—and a SHA-256 artifact ID. Public clients do not receive arbitrary local temporary paths.

Persistent artifact storage and reliable download/reopen routing are post-V1 work. Do not imply that a temporary artifact will survive process, session, or operating-system cleanup.

## 12. Troubleshooting

### Gemini 429

Provider quota/capacity is unavailable. Do not modify the solver or enable fixture fallback. Restore provider access/quota and retry later.

### Gemini 503

The provider is temporarily unavailable or under high demand. Retry later according to provider availability. Do not weaken fail-closed behavior.

### Bridge unavailable

Check port 8765, start `python local_bridge\bridge.py` if no healthy project bridge exists, then check `/health` and `/api/capabilities`.

### Manim unavailable

Run `manim --version` and `python -c "import manim; print(manim.__version__)"`. The bridge must report Manim as installed.

### FFmpeg unavailable

Run `ffmpeg -version` and `ffprobe -version`. Both are required by bridge readiness and artifact verification.

### Frame QA failure

Treat it as a real failure. Do not bypass Frame QA or fabricate analysis results.

### TTS failure

Run `python -m edge_tts --version`. Treat generation or ffprobe-duration failure as real; do not use synthetic or silent audio.

## 13. Generated / Protected Local Files

Keep these local and uncommitted:

```text
.env
.serena/
audio/
media/
ia-canary-output.txt
```

Never use `git add .` for a release checkpoint. Inspect `git status --short` and stage only explicitly approved files.

## 14. Known V1 Limitations

- Final MP4 storage is temporary/internal; persistence is post-V1.
- The full-video Golden Path is currently specialized to the documented equation workflow.
- Segmentation core is present but its optional runtime is missing.
- Depth/2.5D core is present but its optional runtime is missing.
- Blender routing is present but its optional runtime is missing.
- Generative-motion routing is present but its optional runtime is missing.

These optional runtimes do not block the frozen deterministic V1 Golden Path.

## 15. Shutdown / Restart

For a Studio or bridge process running in the foreground, press `Ctrl+C` in that process's PowerShell terminal. Before restarting, verify that ports 3000 and 8765 are no longer listening. If a port is still occupied, identify its owning process before taking any action:

```powershell
Get-NetTCPConnection -LocalPort 3000,8765 -State Listen -ErrorAction SilentlyContinue
```

Restart the bridge first, verify its health and capabilities, and then restart Studio. Do not terminate an unidentified or unrelated process.
