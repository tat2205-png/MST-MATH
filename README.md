# Math AI Video Studio v1.4.0

Local production workflow for verified high-school mathematics explanations and real Manim MP4 rendering. Deterministic Math verification remains authoritative; optional visual AI is not required.

## Requirements

- Node.js 20+ and npm
- Python 3.14.x
- uv
- Manim Community Edition 0.21.x (locked to 0.21.0)
- FFmpeg and ffprobe on `PATH`
- XeLaTeX and dvisvgm on `PATH`
- PowerShell 7 (`pwsh`)

## Setup and launch

```powershell
npm ci
uv sync --group test
npm run studio
```

Open <http://127.0.0.1:3000>. The launcher builds once when needed, starts or safely reuses the loopback-only app and Local Render Bridge, and stops only processes it created when you press Ctrl+C.

The default surface is the Vietnamese Teacher Golden Workflow: import a DOCX,
review and approve detected questions, search/select stable Question IDs, then
create an Assessment, classroom game, verified solution/video, or
JSON/LaTeX/DOCX/PDF artifact. The original expert workflow remains available
through **Studio chuyên sâu**.

Normal use is entirely in the app: enter a supported problem, generate the verified solution and video plan, render, run frame QA/Auto Repair when offered, then play or download the MP4.

## Development and release verification

```powershell
npm run dev
npm run bridge:start
npm run qa:python-runtime
npm run qa:python-math
npm run qa:manim
npm run release:gate
```

`uv sync --group test` is the canonical Python environment command. It creates
the repository-local `.venv`, which is ignored and must never be committed, from
the checked-in `pyproject.toml` and `uv.lock`. The runtime doctor verifies Python
3.14 compatibility, Manim 0.21.x, FFmpeg, XeLaTeX, and dvisvgm without requiring
a GUI, network connection, or external AI service.

`npm run release:gate` requires the Local Render Bridge to be healthy at
`http://127.0.0.1:8765/health`. Start it in a separate PowerShell session with
`npm run bridge:start`; the release gate checks this prerequisite and fails
closed with a targeted diagnostic when it is unavailable.

`GEMINI_API_KEY` is optional. Without it, AI visual QA is reported as `SKIPPED`; deterministic frame structure and Math provenance remain required.
