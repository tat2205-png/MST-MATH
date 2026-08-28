from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

HOST = "127.0.0.1"
PORT = int(os.environ.get("LOCAL_BRIDGE_PORT", "8765"))
ROOT = Path(__file__).resolve().parent / "runs"
ROOT.mkdir(parents=True, exist_ok=True)
JOBS: dict[str, dict] = {}
LOCK = threading.Lock()
SCENE_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def detect_capabilities() -> dict:
    manim = subprocess.run(
        [sys.executable, "-c", "import manim"],
        capture_output=True,
        text=True,
        shell=False,
        timeout=15,
    )
    return {
        "python": {"installed": bool(sys.executable), "executable": sys.executable},
        "manim": {"installed": manim.returncode == 0},
        "ffmpeg": {"installed": shutil.which("ffmpeg") is not None},
        "ffprobe": {"installed": shutil.which("ffprobe") is not None},
        "openclaw": {"available": shutil.which("openclaw") is not None},
    }


CAPABILITIES = detect_capabilities()


def json_response(handler: BaseHTTPRequestHandler, status: int, body: dict):
    payload = json.dumps(body).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(payload)))
    handler.end_headers()
    handler.wfile.write(payload)


def fail_job(job_id: str, message: str, exit_code: int | None = None):
    with LOCK:
        job = JOBS[job_id]
        job.update({"status": "FAILED", "exitCode": exit_code, "error": message, "finalStatus": "FAILED"})


def run_job(job_id: str, payload: dict, workspace: Path):
    try:
        manifest = payload["manifest"]
        entry = manifest["entryFile"]
        scene = manifest["sceneName"]
        source = next(item["content"] for item in manifest["files"] if item["path"] == entry)
        script = workspace / entry
        script.parent.mkdir(parents=True, exist_ok=True)
        script.write_text(source, encoding="utf-8")
        media = workspace / "media"
        command = [sys.executable, "-m", "manim", "-ql", "--disable_caching", "--media_dir", str(media), str(script), scene]
        process = subprocess.run(command, cwd=workspace, capture_output=True, text=True, shell=False, timeout=180)
        output = (process.stdout + "\n" + process.stderr)[-12000:]
        videos = sorted(path for path in media.glob("videos/**/*.mp4") if "partial_movie_files" not in path.parts)
        if process.returncode != 0:
            fail_job(job_id, output or "Manim exited with a non-zero status.", process.returncode)
            return
        if len(videos) != 1 or not videos[0].is_file() or videos[0].stat().st_size <= 0:
            fail_job(job_id, "Manim completed without exactly one non-empty MP4.", process.returncode)
            return
        video = videos[0]
        stable_video = workspace / "golden_path.mp4"
        shutil.copy2(video, stable_video)
        compatible_video = workspace / "render.mp4"
        shutil.copy2(video, compatible_video)
        probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(video)], capture_output=True, text=True, shell=False, timeout=30)
        if probe.returncode != 0:
            fail_job(job_id, probe.stderr[-4000:] or "ffprobe failed.", process.returncode)
            return
        duration = float(json.loads(probe.stdout)["format"]["duration"])
        if duration <= 0:
            fail_job(job_id, "ffprobe reported a non-positive duration.", process.returncode)
            return
        frames = workspace / "frames"
        frames.mkdir()
        timestamps = {"START": min(1.5, max(0.05, duration - 0.2)), "KEY": min(5.0, max(0.05, duration - 0.2)), "END": max(0.05, duration - 0.2)}
        artifacts = [
            {"type": "final_video", "name": "golden_path.mp4", "pathOrUrl": f"/api/jobs/{job_id}/artifacts/golden_path.mp4", "sizeBytes": stable_video.stat().st_size},
            {"type": "preview_video", "name": "render.mp4", "pathOrUrl": f"/api/jobs/{job_id}/artifacts/render.mp4", "sizeBytes": compatible_video.stat().st_size},
        ]
        for name, timestamp in timestamps.items():
            frame = frames / f"{name}.png"
            extract = subprocess.run(["ffmpeg", "-y", "-i", str(video), "-ss", f"{min(timestamp, max(0, duration - 0.1)):.3f}", "-frames:v", "1", str(frame)], capture_output=True, text=True, shell=False, timeout=30)
            if extract.returncode != 0 or not frame.is_file() or frame.stat().st_size <= 0:
                fail_job(job_id, f"Frame extraction failed for {name}: {extract.stderr[-2000:]}", process.returncode)
                return
            artifacts.append({"type": f"{name.lower()}_frame", "name": f"{name}.png", "pathOrUrl": f"/api/jobs/{job_id}/artifacts/{name}.png", "sizeBytes": frame.stat().st_size})
        log = workspace / "render.log"
        log.write_text(output, encoding="utf-8")
        artifacts.append({"type": "render_log", "name": "render.log", "pathOrUrl": f"/api/jobs/{job_id}/artifacts/render.log", "sizeBytes": log.stat().st_size})
        with LOCK:
            JOBS[job_id].update({"status": "COMPLETED", "progress": 100, "exitCode": process.returncode, "duration": duration, "videoPath": str(video), "artifacts": artifacts, "logs": output[-4000:], "finalStatus": "RUNTIME_NOT_TESTED"})
    except Exception as exc:
        fail_job(job_id, str(exc))


class BridgeHandler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        return

    def do_GET(self):
        path = unquote(urlparse(self.path).path)
        if path == "/health":
            runtime_ready = all(CAPABILITIES[name]["installed"] for name in ("python", "manim", "ffmpeg", "ffprobe"))
            return json_response(self, 200, {"status": "READY" if runtime_ready else "DEGRADED", "bridgeVersion": "golden-path-v1.3", "capabilities": CAPABILITIES})
        if path == "/api/capabilities":
            runtime_ready = all(CAPABILITIES[name]["installed"] for name in ("python", "manim", "ffmpeg", "ffprobe"))
            return json_response(self, 200, {
                "status": "READY" if runtime_ready else "UNAVAILABLE",
                "rendererId": "local.manim",
                "manimAvailable": CAPABILITIES["manim"]["installed"],
                "ffmpegAvailable": CAPABILITIES["ffmpeg"]["installed"],
                "supportedOutputTypes": ["video/mp4"] if runtime_ready else [],
                "runtimeReady": runtime_ready,
                "capabilities": CAPABILITIES,
            })
        match = re.fullmatch(r"/api/jobs/([A-Za-z0-9_-]+)", path)
        if match:
            with LOCK:
                job = dict(JOBS.get(match.group(1), {}))
            if not job:
                return json_response(self, 404, {"error": "Job not found"})
            return json_response(self, 200, job)
        match = re.fullmatch(r"/api/jobs/([A-Za-z0-9_-]+)/artifacts", path)
        if match:
            with LOCK:
                job = JOBS.get(match.group(1))
            if not job:
                return json_response(self, 404, {"error": "Job not found"})
            return json_response(self, 200, {"artifacts": job.get("artifacts", [])})
        match = re.fullmatch(r"/api/jobs/([A-Za-z0-9_-]+)/artifacts/(START|KEY|END)\.png", path)
        if match:
            return self.serve_file(match.group(1), "frames", f"{match.group(2)}.png", "image/png")
        match = re.fullmatch(r"/api/jobs/([A-Za-z0-9_-]+)/artifacts/golden_path\.mp4", path)
        if match:
            return self.serve_file(match.group(1), "", "golden_path.mp4", "video/mp4")
        match = re.fullmatch(r"/api/jobs/([A-Za-z0-9_-]+)/artifacts/render\.mp4", path)
        if match:
            return self.serve_file(match.group(1), "", "render.mp4", "video/mp4")
        match = re.fullmatch(r"/api/jobs/([A-Za-z0-9_-]+)/artifacts/render\.log", path)
        if match:
            return self.serve_file(match.group(1), "", "render.log", "text/plain")
        return json_response(self, 404, {"error": "Not found"})

    def serve_file(self, job_id: str, folder: str, filename: str, content_type: str):
        with LOCK:
            workspace = JOBS.get(job_id, {}).get("workspace")
        if not workspace:
            return json_response(self, 404, {"error": "Job not found"})
        candidate = Path(workspace) / folder / filename if folder else Path(workspace) / filename
        if not candidate.is_file() or Path(os.path.abspath(candidate)).resolve().parent != candidate.resolve().parent:
            return json_response(self, 404, {"error": "Artifact not found"})
        data = candidate.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        if urlparse(self.path).path != "/api/jobs":
            return json_response(self, 404, {"error": "Not found"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length))
            manifest = payload.get("manifest")
            if not isinstance(manifest, dict) or manifest.get("entryFile") != "main.py" or not isinstance(manifest.get("files"), list) or len(manifest["files"]) != 1:
                raise ValueError("Invalid render manifest")
            if not SCENE_RE.fullmatch(str(manifest.get("sceneName", ""))):
                raise ValueError("Invalid scene name")
            file_item = manifest["files"][0]
            if file_item.get("path") != "main.py" or not isinstance(file_item.get("content"), str):
                raise ValueError("Unsafe or invalid file path")
            job_id = f"golden_{uuid.uuid4().hex[:12]}"
            workspace = Path(tempfile.mkdtemp(prefix=f"{job_id}_", dir=ROOT))
            with LOCK:
                JOBS[job_id] = {"jobId": job_id, "status": "RENDERING", "progress": 5, "workspace": str(workspace), "artifacts": [], "logs": []}
            run_job(job_id, payload, workspace)
            with LOCK:
                response = dict(JOBS[job_id])
            response.pop("workspace", None)
            response.pop("videoPath", None)
            return json_response(self, 200, response)
        except Exception as exc:
            return json_response(self, 400, {"status": "FAILED", "error": str(exc), "exitCode": None})


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), BridgeHandler)
    print(f"Local Render Bridge listening on http://{HOST}:{PORT}", flush=True)
    server.serve_forever()
