from __future__ import annotations
import json, os, re, shutil, subprocess, sys, tempfile, threading, uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

HOST, PORT = "127.0.0.1", int(os.environ.get("LOCAL_BRIDGE_PORT", "8765"))
ROOT = Path(__file__).resolve().parent / "runs"
ROOT.mkdir(parents=True, exist_ok=True)
JOBS, LOCK = {}, threading.Lock()
SCENE_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")

def detect_capabilities():
    manim = subprocess.run([sys.executable, "-c", "import manim"], capture_output=True, text=True, shell=False, timeout=15)
    return {"python": {"installed": bool(sys.executable)}, "manim": {"installed": manim.returncode == 0}, "ffmpeg": {"installed": shutil.which("ffmpeg") is not None}, "ffprobe": {"installed": shutil.which("ffprobe") is not None}, "openclaw": {"available": shutil.which("openclaw") is not None}}

CAPABILITIES = detect_capabilities()
def ready(): return all(CAPABILITIES[name]["installed"] for name in ("python", "manim", "ffmpeg", "ffprobe"))
def respond(handler, status, body):
    payload = json.dumps(body).encode()
    handler.send_response(status); handler.send_header("Content-Type", "application/json"); handler.send_header("Content-Length", str(len(payload))); handler.end_headers(); handler.wfile.write(payload)
def fail(job_id, message, code=None):
    with LOCK: JOBS[job_id].update({"status": "FAILED", "exitCode": code, "error": message, "finalStatus": "FAILED"})

def run_job(job_id, payload, workspace):
    try:
        manifest, entry = payload["manifest"], payload["manifest"]["entryFile"]
        source = next(item["content"] for item in manifest["files"] if item["path"] == entry)
        script, media = workspace / entry, workspace / "media"
        script.write_text(source, encoding="utf-8")
        process = subprocess.run([sys.executable, "-m", "manim", "-ql", "--disable_caching", "--media_dir", str(media), str(script), manifest["sceneName"]], cwd=workspace, capture_output=True, text=True, shell=False, timeout=180)
        output = (process.stdout + "\n" + process.stderr)[-12000:]
        videos = sorted(path for path in media.glob("videos/**/*.mp4") if "partial_movie_files" not in path.parts)
        if process.returncode or len(videos) != 1 or videos[0].stat().st_size <= 0: return fail(job_id, output or "Manim render failed.", process.returncode)
        target = workspace / "render.mp4"; shutil.copy2(videos[0], target)
        probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(target)], capture_output=True, text=True, shell=False, timeout=30)
        if probe.returncode: return fail(job_id, "ffprobe failed.", probe.returncode)
        duration = float(json.loads(probe.stdout)["format"]["duration"])
        if duration <= 0: return fail(job_id, "ffprobe reported a non-positive duration.", probe.returncode)
        log = workspace / "render.log"; log.write_text(output, encoding="utf-8")
        artifacts = [{"type": "preview_video", "name": "render.mp4", "pathOrUrl": f"/api/jobs/{job_id}/artifacts/render.mp4", "sizeBytes": target.stat().st_size}, {"type": "render_log", "name": "render.log", "pathOrUrl": f"/api/jobs/{job_id}/artifacts/render.log", "sizeBytes": log.stat().st_size}]
        with LOCK: JOBS[job_id].update({"status": "COMPLETED", "progress": 100, "exitCode": 0, "duration": duration, "artifacts": artifacts, "logs": output[-4000:], "finalStatus": "RUNTIME_NOT_TESTED"})
    except Exception as exc: fail(job_id, type(exc).__name__)

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_): pass
    def do_GET(self):
        path = unquote(urlparse(self.path).path)
        if path == "/health": return respond(self, 200, {"status": "READY" if ready() else "DEGRADED", "bridgeVersion": "studio-render-v1", "capabilities": CAPABILITIES})
        if path == "/api/capabilities":
            state = ready(); return respond(self, 200, {"status": "READY" if state else "UNAVAILABLE", "rendererId": "local.manim", "capabilities": CAPABILITIES, "manimAvailable": CAPABILITIES["manim"]["installed"], "ffmpegAvailable": CAPABILITIES["ffmpeg"]["installed"], "supportedOutputTypes": ["video/mp4"] if state else [], "runtimeReady": state})
        match = re.fullmatch(r"/api/jobs/([A-Za-z0-9_-]+)(?:/artifacts)?", path)
        if match:
            with LOCK: job = dict(JOBS.get(match.group(1), {}))
            if not job: return respond(self, 404, {"error": "Job not found"})
            return respond(self, 200, {"artifacts": job.get("artifacts", [])} if path.endswith("/artifacts") else {key: value for key, value in job.items() if key != "workspace"})
        match = re.fullmatch(r"/api/jobs/([A-Za-z0-9_-]+)/artifacts/(render\.mp4|render\.log)", path)
        if match:
            with LOCK: workspace = JOBS.get(match.group(1), {}).get("workspace")
            candidate = Path(workspace).resolve() / match.group(2) if workspace else None
            if not candidate or candidate.parent != Path(workspace).resolve() or not candidate.is_file(): return respond(self, 404, {"error": "Artifact not found"})
            data = candidate.read_bytes(); self.send_response(200); self.send_header("Content-Type", "video/mp4" if candidate.suffix == ".mp4" else "text/plain"); self.send_header("Content-Length", str(len(data))); self.end_headers(); return self.wfile.write(data)
        return respond(self, 404, {"error": "Not found"})
    def do_POST(self):
        if urlparse(self.path).path != "/api/jobs": return respond(self, 404, {"error": "Not found"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 1_000_000: raise ValueError("Invalid request size")
            payload, manifest = json.loads(self.rfile.read(length)), None
            manifest = payload.get("manifest")
            if not isinstance(manifest, dict) or manifest.get("entryFile") != "main.py" or not SCENE_RE.fullmatch(str(manifest.get("sceneName", ""))) or not isinstance(manifest.get("files"), list) or len(manifest["files"]) != 1: raise ValueError("Invalid render manifest")
            item = manifest["files"][0]
            if item.get("path") != "main.py" or not isinstance(item.get("content"), str) or len(item["content"]) > 500_000: raise ValueError("Unsafe source file")
            job_id = f"render_{uuid.uuid4().hex[:12]}"; workspace = Path(tempfile.mkdtemp(prefix=f"{job_id}_", dir=ROOT)).resolve()
            with LOCK: JOBS[job_id] = {"jobId": job_id, "status": "RENDERING", "progress": 5, "workspace": str(workspace), "artifacts": [], "logs": []}
            run_job(job_id, payload, workspace)
            with LOCK: result = {key: value for key, value in JOBS[job_id].items() if key != "workspace"}
            return respond(self, 200, result)
        except Exception as exc: return respond(self, 400, {"status": "FAILED", "error": str(exc), "exitCode": None})

if __name__ == "__main__": ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
