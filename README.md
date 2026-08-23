# Math AI Video Studio V1

Local production workflow for verified high-school mathematics explanations and real Manim MP4 rendering. Deterministic Math verification remains authoritative; optional visual AI is not required.

## Requirements

- Node.js 20+ and npm
- Python 3.10+
- Manim Community Edition available to that Python (`python -m manim --version`)
- FFmpeg and ffprobe on `PATH`
- PowerShell 7 (`pwsh`)

## Setup and launch

```powershell
npm ci
npm run studio
```

Open <http://127.0.0.1:3000>. The launcher builds once when needed, starts or safely reuses the loopback-only app and Local Render Bridge, and stops only processes it created when you press Ctrl+C.

Normal use is entirely in the app: enter a supported problem, generate the verified solution and video plan, render, run frame QA/Auto Repair when offered, then play or download the MP4.

## Development and release verification

```powershell
npm run dev
npm run bridge:start
npm run release:gate
```

`GEMINI_API_KEY` is optional. Without it, AI visual QA is reported as `SKIPPED`; deterministic frame structure and Math provenance remain required.
