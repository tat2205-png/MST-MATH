from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import uuid
from typing import Any

VERSION = "4.1"
MAX_TOUCHED_FILES = 20

BLOCKED_EXACT = {
    ".env",
    "AGENTS.md",
    "SOUL.md",
    "IDENTITY.md",
    "TOOLS.md",
    "USER.md",
    "scripts/autopilot.ps1",
    "scripts/autopilot_v4.py",
}
BLOCKED_PREFIXES = (
    ".git/",
    ".automation/",
    "node_modules/",
    "dist/",
    "openclaw-extension-windows-fix/",
    "contracts/",
)
BLOCKED_LOCKS = {"bun.lock", "bun.lockb", "pnpm-lock.yaml", "yarn.lock"}

DOMAIN_FAILURE_PATTERNS = (
    r"MATH_REGRESSION_QA\s+FAIL",
    r"MATH_GATE_QA\s+FAIL",
    r"GEOMETRY[_A-Z]*QA\s+FAIL",
    r"PROVENANCE_QA\s+FAIL",
    r"ZERO_INFERENCE_QA\s+FAIL",
    r"SOURCE_[A-Z_]*QA\s+FAIL",
    r"DETERMINISTIC_[A-Z_]*QA\s+FAIL",
)


class AutoPilotError(RuntimeError):
    pass


class PlanPreflightError(AutoPilotError):
    pass


def now_iso() -> str:
    return dt.datetime.now().astimezone().isoformat()


def normalize_rel(path: str) -> str:
    return path.replace("\\", "/").strip()


def is_safe_rel(path: str, dynamic_blocked: set[str] | None = None) -> bool:
    p = normalize_rel(path)
    if not p or p.startswith("/") or re.match(r"^[A-Za-z]:", p):
        return False
    if re.search(r"(^|/)\.\.(/|$)", p):
        return False
    lower = p.lower()
    if lower in {x.lower() for x in BLOCKED_EXACT}:
        return False
    if dynamic_blocked and lower in {normalize_rel(x).lower() for x in dynamic_blocked}:
        return False
    for prefix in BLOCKED_PREFIXES:
        if lower.startswith(prefix.lower()):
            return False
    if re.search(r"(^|/)\.env(\.|$)", lower):
        return False
    if lower in {x.lower() for x in BLOCKED_LOCKS}:
        return False
    return True


def write_text(path: Path, text: str, bom: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    data = text.encode("utf-8")
    if bom:
        data = b"\xef\xbb\xbf" + data
    path.write_bytes(data)


def read_text(path: Path) -> str:
    data = path.read_bytes()
    if data.startswith(b"\xef\xbb\xbf"):
        data = data[3:]
    return data.decode("utf-8")


def file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        while True:
            chunk = f.read(1024 * 1024)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def text_sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def run_cmd(args: list[str], cwd: Path, env: dict[str, str] | None = None,
            input_text: str | None = None) -> tuple[int, str]:
    proc = subprocess.run(
        args,
        cwd=str(cwd),
        env=env,
        input=input_text,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        shell=False,
    )
    return proc.returncode, proc.stdout or ""


def resolve_pwsh() -> str | None:
    candidates = [
        shutil.which("pwsh"),
        shutil.which("powershell"),
        r"C:\Program Files\PowerShell\7\pwsh.exe",
        r"C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return str(candidate)
    return None


def run_windows_cli_version(name: str, cwd: Path) -> tuple[int, str]:
    """
    Resolve CLI commands through the host PowerShell command resolver.

    npm/OpenClaw installed from npm are commonly .cmd shims on Windows.
    Calling those shims directly with Python subprocess(shell=False) is not
    reliable on every Windows/Python combination. PowerShell resolves them
    exactly the same way as the user's terminal.
    """
    ps = resolve_pwsh()
    if not ps:
        return 127, "PowerShell host not found."

    safe_name = re.sub(r"[^A-Za-z0-9_.-]", "", name)
    if safe_name != name or not safe_name:
        return 2, "Unsafe CLI name."

    command = (
        "$ErrorActionPreference='Stop'; "
        f"$cmd = Get-Command '{safe_name}' -ErrorAction Stop; "
        f"& $cmd.Source --version"
    )
    return run_cmd(
        [ps, "-NoProfile", "-NonInteractive", "-Command", command],
        cwd,
    )


def resolve_codex() -> Path | None:
    userprofile = os.environ.get("USERPROFILE")
    if userprofile:
        releases = Path(userprofile) / ".codex" / "packages" / "standalone" / "releases"
        if releases.exists():
            dirs = sorted(
                [p for p in releases.iterdir() if p.is_dir()],
                key=lambda p: p.stat().st_mtime,
                reverse=True,
            )
            for d in dirs:
                exe = d / "bin" / "codex.exe"
                setup = d / "codex-resources" / "codex-windows-sandbox-setup.exe"
                runner = d / "codex-resources" / "codex-command-runner.exe"
                if exe.exists() and setup.exists() and runner.exists():
                    return exe
    found = shutil.which("codex")
    return Path(found) if found else None


def safe_codex_env() -> dict[str, str]:
    env = os.environ.copy()
    parts = []
    for p in env.get("PATH", "").split(os.pathsep):
        if not p:
            continue
        q = p.lower().replace("/", "\\")
        if "\\microsoft\\windowsapps" in q or "\\program files\\windowsapps" in q:
            continue
        parts.append(p)

    ps7 = Path(r"C:\Program Files\PowerShell\7")
    if (ps7 / "pwsh.exe").exists():
        parts = [str(ps7)] + [p for p in parts if Path(p) != ps7]

    env["PATH"] = os.pathsep.join(parts)
    return env


def infra_failure(text: str) -> bool:
    patterns = (
        r"CreateProcessAsUserW",
        r"codex-windows-sandbox-setup\.exe",
        r"codex-command-runner\.exe",
        r"windows sandbox",
        r"SpawnChild",
        r"runner failed",
    )
    return any(re.search(p, text, flags=re.I) for p in patterns)


def ensure_schema(schema_path: Path) -> None:
    schema = {
        "type": "object",
        "properties": {
            "status": {
                "type": "string",
                "enum": [
                    "EDIT_PLAN_READY",
                    "HUMAN_REVIEW_REQUIRED",
                    "INFRASTRUCTURE_BLOCKED",
                    "NO_CHANGES",
                ],
            },
            "summary": {"type": "string"},
            "touched_files": {"type": "array", "items": {"type": "string"}},
            "operations": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "op": {"type": "string", "enum": ["replace_file", "create_file"]},
                        "path": {"type": "string"},
                        "expected_sha256": {"type": "string"},
                        "content": {"type": "string"},
                    },
                    "required": ["op", "path", "expected_sha256", "content"],
                    "additionalProperties": False,
                },
            },
            "reasons": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["status", "summary", "touched_files", "operations", "reasons"],
        "additionalProperties": False,
    }
    write_text(schema_path, json.dumps(schema, ensure_ascii=False, indent=2))


def invoke_codex(
    codex: Path,
    project_root: Path,
    schema_path: Path,
    prompt: str,
    output_path: Path,
    log_path: Path,
) -> tuple[int, dict[str, Any] | None]:
    args = [
        str(codex),
        "exec",
        "--ephemeral",
        "--sandbox",
        "read-only",
        "-C",
        str(project_root),
        "--output-schema",
        str(schema_path),
        "--output-last-message",
        str(output_path),
        "-",
    ]
    code, output = run_cmd(args, project_root, safe_codex_env(), prompt)
    write_text(log_path, output)
    print(output, end="" if output.endswith("\n") or not output else "\n")

    if infra_failure(output):
        return code, None
    if not output_path.exists():
        return code, None
    try:
        return code, json.loads(read_text(output_path))
    except Exception:
        return code, None


def base_prompt(contract: str, repair_context: str = "", domain_repair: bool = False) -> str:
    domain_rules = ""
    if domain_repair:
        domain_rules = r"""
THIS IS A DOMAIN-REGRESSION REPAIR TURN.
The authoritative contract and existing tests are FROZEN.
You may repair implementation, parser, verifier, runtime schema, routing, or gate code.
You MUST NOT edit any path under tests/ or contracts/.
You MUST NOT change mathematical expected values to make QA green.
If the contract and tests genuinely conflict or mathematical meaning is uncertain,
return HUMAN_REVIEW_REQUIRED.
"""

    return f"""# MATH AI VIDEO STUDIO — AUTOPILOT V4 TRANSACTIONAL FILE PLAN

AUTHORITATIVE CONTRACT:
{contract}

{domain_rules}

REPAIR CONTEXT:
{repair_context}

ROLE:
You are the coding/planning agent in a READ-ONLY Codex session.
Read-only is intentional. The host applies and validates your file plan.

MANDATORY:
- Read and obey AGENTS.md.
- Inspect CURRENT repository state, including uncommitted/untracked work.
- Preserve every existing user change unrelated to this task.
- No git reset, clean, commit, push, checkout, restore, or stash.
- No .env/secrets/governance/node_modules/dist/.automation/nested OpenClaw edits.
- Do not edit scripts/autopilot.ps1 or scripts/autopilot_v4.py.
- Do not edit anything under contracts/.
- Do not change package manager or competing lockfiles.
- Avoid dependency changes.
- Never weaken tests, runtime schemas, provenance, source fingerprints,
  zero-inference, deterministic math verification, geometry locks, or fail-closed gates.
- Implement the smallest coherent change.
- Semantic math/geometry/source/provenance uncertainty => HUMAN_REVIEW_REQUIRED.

FILE OPERATION CONTRACT:
- Existing file: op="replace_file".
  - Read the CURRENT file first.
  - Compute SHA-256 of the CURRENT raw file bytes using the shell
    (PowerShell Get-FileHash -Algorithm SHA256 is preferred).
  - Put that lowercase hex value in expected_sha256.
  - content must contain the COMPLETE final text of the file.
  - Preserve unrelated existing content and current behavior.
- New file: op="create_file".
  - expected_sha256 must be an empty string.
  - content is the COMPLETE new file.
- Do not use line anchors, old_text, Git patches, delete, rename, move, chmod, or binary edits.
- touched_files must exactly equal unique operation paths.
- Keep touched files <= {MAX_TOUCHED_FILES}.
- Do not merely describe intended changes; return a complete plan.

STATUS:
- EDIT_PLAN_READY = complete safe file plan ready.
- NO_CHANGES = current tree already satisfies the contract.
- HUMAN_REVIEW_REQUIRED = genuine semantic decision required.
- INFRASTRUCTURE_BLOCKED = repository/tool cannot actually be read/executed.
"""


def validate_plan(
    response: dict[str, Any],
    project_root: Path,
    dynamic_blocked: set[str] | None = None,
    domain_repair: bool = False,
) -> dict[str, str]:
    status = response.get("status")
    if status != "EDIT_PLAN_READY":
        raise PlanPreflightError(f"Unexpected plan status for validation: {status}")

    operations = response.get("operations")
    touched = response.get("touched_files")
    if not isinstance(operations, list) or not operations:
        raise PlanPreflightError("EDIT_PLAN_READY contains no operations.")
    if len(operations) > MAX_TOUCHED_FILES:
        raise PlanPreflightError(f"Too many operations: {len(operations)} > {MAX_TOUCHED_FILES}")
    if not isinstance(touched, list):
        raise PlanPreflightError("touched_files is malformed.")

    op_paths = sorted({normalize_rel(str(op.get("path", ""))) for op in operations})
    declared = sorted({normalize_rel(str(x)) for x in touched})
    if op_paths != declared:
        raise PlanPreflightError("touched_files does not exactly match operation paths.")

    simulated: dict[str, str] = {}
    seen: set[str] = set()

    for op in operations:
        kind = str(op.get("op", ""))
        rel = normalize_rel(str(op.get("path", "")))
        expected = str(op.get("expected_sha256", "")).lower().strip()
        content = op.get("content")

        if rel in seen:
            raise PlanPreflightError(f"Duplicate operation path: {rel}")
        seen.add(rel)

        if not is_safe_rel(rel, dynamic_blocked):
            raise PlanPreflightError(f"Unsafe/protected path: {rel}")
        if domain_repair and (rel.lower().startswith("tests/") or rel.lower().startswith("contracts/")):
            raise PlanPreflightError(f"Domain repair may not edit frozen tests/contracts: {rel}")
        if not isinstance(content, str):
            raise PlanPreflightError(f"Operation content must be text: {rel}")

        abs_path = project_root / Path(rel)

        if kind == "create_file":
            if expected:
                raise PlanPreflightError(f"create_file expected_sha256 must be empty: {rel}")
            if abs_path.exists():
                raise PlanPreflightError(f"create_file target already exists: {rel}")
            simulated[rel] = content
            continue

        if kind != "replace_file":
            raise PlanPreflightError(f"Unsupported operation: {kind}")

        if not abs_path.exists() or not abs_path.is_file():
            raise PlanPreflightError(f"replace_file target does not exist: {rel}")
        if not re.fullmatch(r"[0-9a-f]{64}", expected):
            raise PlanPreflightError(f"replace_file expected_sha256 is invalid: {rel}")

        actual = file_sha256(abs_path).lower()
        if actual != expected:
            raise PlanPreflightError(
                f"STALE_FILE_HASH path={rel} expected={expected} actual={actual}"
            )

        old_text = read_text(abs_path)
        if len(old_text) >= 500 and len(content) < int(len(old_text) * 0.50):
            raise PlanPreflightError(
                f"Destructive replacement rejected: {rel} new content is less than 50% of current size."
            )
        simulated[rel] = content

    return simulated


def backup_paths(project_root: Path, backup_root: Path, paths: list[str],
                 baseline: dict[str, str]) -> None:
    for rel in paths:
        if rel in baseline:
            continue
        abs_path = project_root / Path(rel)
        if abs_path.exists():
            dest = backup_root / Path(rel)
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(abs_path, dest)
            baseline[rel] = str(dest)
        else:
            baseline[rel] = "__ABSENT__"


def apply_simulated(project_root: Path, simulated: dict[str, str]) -> None:
    for rel, content in simulated.items():
        abs_path = project_root / Path(rel)
        abs_path.parent.mkdir(parents=True, exist_ok=True)

        use_crlf = False
        use_bom = False
        if abs_path.exists():
            raw = abs_path.read_bytes()
            use_bom = raw.startswith(b"\xef\xbb\xbf")
            use_crlf = b"\r\n" in raw

        normalized = content.replace("\r\n", "\n").replace("\r", "\n")
        if use_crlf:
            normalized = normalized.replace("\n", "\r\n")
        write_text(abs_path, normalized, bom=use_bom)


def rollback(project_root: Path, baseline: dict[str, str]) -> bool:
    ok = True
    for rel, saved in baseline.items():
        abs_path = project_root / Path(rel)
        try:
            if saved == "__ABSENT__":
                if abs_path.exists():
                    abs_path.unlink()
            else:
                abs_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(saved, abs_path)
        except Exception as exc:
            print(f"WARNING: rollback failed for {rel}: {exc}")
            ok = False
    return ok


def snapshot_candidate(project_root: Path, run_dir: Path, attempt: int,
                       paths: list[str]) -> None:
    snap = run_dir / "candidate-snapshots" / f"attempt-{attempt:02d}"
    for rel in paths:
        src = project_root / Path(rel)
        if src.exists() and src.is_file():
            dst = snap / Path(rel)
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)


def run_dev_loop(project_root: Path, log_path: Path) -> tuple[int, str]:
    dev_loop = project_root / "scripts" / "dev-loop.ps1"
    if not dev_loop.exists():
        raise AutoPilotError("Missing scripts\\dev-loop.ps1")
    pwsh = shutil.which("pwsh")
    if not pwsh:
        raise AutoPilotError("pwsh was not found.")
    code, output = run_cmd(
        [pwsh, "-ExecutionPolicy", "Bypass", "-File", str(dev_loop), "-Mode", "Full"],
        project_root,
    )
    write_text(log_path, output)
    print(output, end="" if output.endswith("\n") or not output else "\n")
    return code, output


def overall_pass(text: str) -> bool:
    return bool(re.search(r"OVERALL_STATUS:\s*PASS", text))


def is_domain_failure(text: str) -> bool:
    return any(re.search(p, text) for p in DOMAIN_FAILURE_PATTERNS)


def write_report(path: Path, **kwargs: Any) -> None:
    payload = {"timestamp": now_iso(), **kwargs}
    write_text(path, json.dumps(payload, ensure_ascii=False, indent=2))


def print_section(title: str) -> None:
    print()
    print("=" * 60)
    print(f" {title}")
    print("=" * 60)


def git_capture(project_root: Path, args: list[str]) -> str:
    code, output = run_cmd(["git", *args], project_root)
    return output


def bootstrap(project_root: Path, automation_root: Path, schema_path: Path,
              codex: Path | None) -> int:
    print_section("MATH AI VIDEO STUDIO — AUTOPILOT V4.1 BOOTSTRAP")
    report: dict[str, Any] = {
        "timestamp": now_iso(),
        "projectRoot": str(project_root),
        "python": sys.version.split()[0],
        "powershell": resolve_pwsh(),
        "node": None,
        "npm": None,
        "codex": None,
        "codexExecutable": str(codex) if codex else None,
        "openclaw": None,
        "devLoop": (project_root / "scripts" / "dev-loop.ps1").exists(),
        "codexStructured": False,
        "codexRepositoryRead": False,
        "hostTransactionalWrite": False,
        "overall": "FAIL",
    }

    for key in ("node", "npm", "openclaw"):
        try:
            code, out = run_windows_cli_version(key, project_root)
            if code == 0 and out.strip():
                lines = [line.strip() for line in out.splitlines() if line.strip()]
                if lines:
                    report[key] = lines[-1]
        except Exception:
            pass

    if codex:
        try:
            code, out = run_cmd([str(codex), "--version"], project_root, safe_codex_env())
            if code == 0 and out.strip():
                report["codex"] = out.splitlines()[0].strip()
        except Exception:
            pass

    if codex:
        token = "READ_OK_" + uuid.uuid4().hex
        source = automation_root / "v4-read-probe-source.txt"
        output = automation_root / "v4-read-probe-output.json"
        log = automation_root / "v4-read-probe.log"
        write_text(source, token)
        prompt = r"""Use the shell tool to read .automation\v4-read-probe-source.txt.
You MUST actually read it.
If successful return:
status=NO_CHANGES
summary=exact file contents only
touched_files=[]
operations=[]
reasons=[]
If repository/tool execution fails return INFRASTRUCTURE_BLOCKED.
"""
        try:
            exit_code, obj = invoke_codex(codex, project_root, schema_path, prompt, output, log)
            report["codexStructured"] = isinstance(obj, dict) and obj.get("status") in {
                "NO_CHANGES", "INFRASTRUCTURE_BLOCKED"
            }
            report["codexRepositoryRead"] = (
                exit_code == 0
                and isinstance(obj, dict)
                and obj.get("status") == "NO_CHANGES"
                and str(obj.get("summary", "")).strip() == token
                and not infra_failure(read_text(log))
            )
        finally:
            if source.exists():
                source.unlink()

    probe = automation_root / "v4-host-transaction-probe.txt"
    try:
        write_text(probe, "A")
        before = file_sha256(probe)
        write_text(probe, "B")
        after = file_sha256(probe)
        if before == after:
            raise AutoPilotError("Host write probe hash did not change.")
        probe.unlink()
        report["hostTransactionalWrite"] = not probe.exists()
    except Exception:
        report["hostTransactionalWrite"] = False
        if probe.exists():
            probe.unlink()

    if all([
        report["node"],
        report["npm"],
        report["codex"],
        report["openclaw"],
        report["devLoop"],
        report["codexStructured"],
        report["codexRepositoryRead"],
        report["hostTransactionalWrite"],
    ]):
        report["overall"] = "PASS"

    report_path = automation_root / "bootstrap-v4-report.json"
    write_report(report_path, **report)

    for k, v in report.items():
        print(f"{k:24}: {v}")
    print()
    print(f"BOOTSTRAP_REPORT: {report_path}")
    print(f"OVERALL_STATUS: {report['overall']}")
    print("AUTOPILOT_V4_1_READY: " + ("PASS" if report["overall"] == "PASS" else "FAIL"))
    return 0 if report["overall"] == "PASS" else 1


def load_contract(project_root: Path, task: str, contract_file_arg: str) -> tuple[str, set[str]]:
    blocked: set[str] = set()
    chunks: list[str] = []

    if contract_file_arg:
        contract_path = Path(contract_file_arg)
        if not contract_path.is_absolute():
            contract_path = (project_root / contract_path).resolve()
        if not contract_path.exists():
            raise AutoPilotError(f"Contract file does not exist: {contract_path}")
        chunks.append(read_text(contract_path))

        try:
            rel = normalize_rel(str(contract_path.relative_to(project_root)))
            blocked.add(rel)
        except ValueError:
            pass

    if task.strip():
        chunks.append(task.strip())

    if not chunks:
        raise AutoPilotError("Provide -Task or -ContractFile.")

    return "\n\n".join(chunks), blocked


def get_plan_with_retries(
    *,
    codex: Path,
    project_root: Path,
    schema_path: Path,
    run_dir: Path,
    contract: str,
    dynamic_blocked: set[str],
    max_retries: int,
    prefix: str,
    repair_context: str = "",
    domain_repair: bool = False,
) -> tuple[dict[str, Any], dict[str, str]] | tuple[dict[str, Any], None]:
    last_error = ""
    for attempt in range(max_retries + 1):
        suffix = f"{attempt:02d}"
        output = run_dir / f"{prefix}-response-{suffix}.json"
        log = run_dir / f"{prefix}-codex-{suffix}.log"

        context = repair_context
        if last_error:
            context += (
                "\n\nPREVIOUS HOST PLAN PREFLIGHT FAILED:\n"
                + last_error
                + "\nThe rejected plan made NO source changes. Re-read CURRENT files and regenerate "
                  "the COMPLETE plan. Recompute current raw-byte SHA-256 values."
            )

        print_section(
            f"AUTOPILOT V4.1 — {'REPLAN' if attempt else 'FILE PLAN'} {attempt}/{max_retries}"
        )
        exit_code, response = invoke_codex(
            codex,
            project_root,
            schema_path,
            base_prompt(contract, context, domain_repair),
            output,
            log,
        )

        if response is None:
            raise AutoPilotError("Codex produced no valid structured response.")
        status = response.get("status")
        if status in {"HUMAN_REVIEW_REQUIRED", "INFRASTRUCTURE_BLOCKED", "NO_CHANGES"}:
            return response, None
        if status != "EDIT_PLAN_READY":
            raise AutoPilotError(f"Unexpected Codex status: {status}")

        try:
            simulated = validate_plan(
                response, project_root, dynamic_blocked, domain_repair=domain_repair
            )
            return response, simulated
        except PlanPreflightError as exc:
            last_error = str(exc)
            print(f"FILE_PLAN_PREFLIGHT: FAIL\nDETAIL: {last_error}")
            if attempt >= max_retries:
                raise

    raise PlanPreflightError(last_error or "No valid plan.")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--task", default="")
    parser.add_argument("--contract-file", default="")
    parser.add_argument("--bootstrap", action="store_true")
    parser.add_argument("--max-repair-attempts", type=int, default=3, choices=(1, 2, 3))
    args = parser.parse_args()

    script_path = Path(__file__).resolve()
    project_root = script_path.parent.parent
    automation_root = project_root / ".automation"
    runs_root = automation_root / "runs"
    schema_path = automation_root / "codex-file-plan-schema-v4.json"
    automation_root.mkdir(parents=True, exist_ok=True)
    runs_root.mkdir(parents=True, exist_ok=True)
    ensure_schema(schema_path)

    codex = resolve_codex()
    if args.bootstrap or (not args.task.strip() and not args.contract_file.strip()):
        return bootstrap(project_root, automation_root, schema_path, codex)

    bootstrap_path = automation_root / "bootstrap-v4-report.json"
    if not bootstrap_path.exists():
        raise AutoPilotError("Run AutoPilot V4 bootstrap first.")
    bootstrap_data = json.loads(read_text(bootstrap_path))
    if bootstrap_data.get("overall") != "PASS":
        raise AutoPilotError("AutoPilot V4 bootstrap is not PASS.")
    if not codex:
        raise AutoPilotError("Codex executable is unavailable.")

    contract, dynamic_blocked = load_contract(project_root, args.task, args.contract_file)

    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    run_dir = runs_root / stamp
    backup_root = run_dir / "baseline-backup"
    run_dir.mkdir(parents=True, exist_ok=True)
    backup_root.mkdir(parents=True, exist_ok=True)
    final_report = run_dir / "final-report.json"

    write_text(run_dir / "contract-snapshot.txt", contract)
    write_text(run_dir / "contract-sha256.txt", text_sha256(contract))
    write_text(run_dir / "git-status-before.txt", git_capture(project_root, ["status", "--short"]))
    write_text(run_dir / "git-diff-before.txt", git_capture(project_root, ["diff", "--stat"]))

    baseline: dict[str, str] = {}
    all_touched: set[str] = set()

    try:
        response, simulated = get_plan_with_retries(
            codex=codex,
            project_root=project_root,
            schema_path=schema_path,
            run_dir=run_dir,
            contract=contract,
            dynamic_blocked=dynamic_blocked,
            max_retries=args.max_repair_attempts,
            prefix="plan",
        )

        status = response.get("status")
        if status == "INFRASTRUCTURE_BLOCKED":
            write_report(final_report, status=status, runDirectory=str(run_dir),
                         reason="; ".join(response.get("reasons", [])), rollbackOk=True)
            print(f"AUTOPILOT_STATUS: {status}\nREPORT: {final_report}")
            return 3
        if status == "HUMAN_REVIEW_REQUIRED":
            write_report(final_report, status=status, runDirectory=str(run_dir),
                         reason="; ".join(response.get("reasons", [])), rollbackOk=True)
            print(f"AUTOPILOT_STATUS: {status}\nREPORT: {final_report}")
            return 2
        if status == "NO_CHANGES":
            write_report(final_report, status=status, runDirectory=str(run_dir),
                         reason=str(response.get("summary", "")), rollbackOk=True)
            print(f"AUTOPILOT_STATUS: NO_CHANGES\nREPORT: {final_report}")
            return 0

        assert simulated is not None
        paths = sorted(simulated.keys())
        backup_paths(project_root, backup_root, paths, baseline)
        all_touched.update(paths)

        print_section("AUTOPILOT V4.1 — TRANSACTION APPLY")
        try:
            apply_simulated(project_root, simulated)
        except Exception as exc:
            rb = rollback(project_root, baseline)
            write_report(final_report, status="HOST_APPLY_FAILED",
                         runDirectory=str(run_dir), reason=str(exc), rollbackOk=rb)
            print(f"AUTOPILOT_STATUS: HOST_APPLY_FAILED\nROLLBACK_OK: {rb}\nREPORT: {final_report}")
            return 4

        snapshot_candidate(project_root, run_dir, 0, sorted(all_touched))

        print_section("AUTOPILOT V4.1 — FULL DEV LOOP")
        qa_log = run_dir / "qa-00.log"
        qa_exit, qa_text = run_dev_loop(project_root, qa_log)
        if qa_exit == 0 and overall_pass(qa_text):
            write_report(final_report, status="PASS", runDirectory=str(run_dir),
                         repairAttempts=0, qaLog=str(qa_log), rollbackOk=True)
            print(f"AUTOPILOT_STATUS: PASS\nREPORT: {final_report}")
            return 0

        current_qa_log = qa_log
        current_qa_text = qa_text

        for repair in range(1, args.max_repair_attempts + 1):
            domain = is_domain_failure(current_qa_text)
            qa_tail = "\n".join(current_qa_text.splitlines()[-260:])
            repair_context = f"""The CURRENT candidate tree failed Full Dev Loop.
Failure class: {'DOMAIN_REGRESSION' if domain else 'CODE_OR_INTEGRATION'}.
Repair attempt: {repair}/{args.max_repair_attempts}.

FULL DEV LOOP FAILURE TAIL:
{qa_tail}
"""
            response, simulated = get_plan_with_retries(
                codex=codex,
                project_root=project_root,
                schema_path=schema_path,
                run_dir=run_dir,
                contract=contract,
                dynamic_blocked=dynamic_blocked,
                max_retries=args.max_repair_attempts,
                prefix=f"repair-{repair:02d}",
                repair_context=repair_context,
                domain_repair=domain,
            )

            status = response.get("status")
            if status == "HUMAN_REVIEW_REQUIRED":
                snapshot_candidate(project_root, run_dir, repair, sorted(all_touched))
                rb = rollback(project_root, baseline)
                write_report(final_report, status="HUMAN_REVIEW_REQUIRED",
                             runDirectory=str(run_dir), repairAttempts=repair,
                             qaLog=str(current_qa_log),
                             reason="; ".join(response.get("reasons", [])),
                             rollbackOk=rb)
                print(f"AUTOPILOT_STATUS: HUMAN_REVIEW_REQUIRED\nROLLBACK_OK: {rb}\nREPORT: {final_report}")
                return 2
            if status == "INFRASTRUCTURE_BLOCKED":
                snapshot_candidate(project_root, run_dir, repair, sorted(all_touched))
                rb = rollback(project_root, baseline)
                write_report(final_report, status="INFRASTRUCTURE_BLOCKED",
                             runDirectory=str(run_dir), repairAttempts=repair,
                             qaLog=str(current_qa_log),
                             reason="; ".join(response.get("reasons", [])),
                             rollbackOk=rb)
                print(f"AUTOPILOT_STATUS: INFRASTRUCTURE_BLOCKED\nROLLBACK_OK: {rb}\nREPORT: {final_report}")
                return 3
            if status == "NO_CHANGES" or simulated is None:
                break

            paths = sorted(simulated.keys())
            backup_paths(project_root, backup_root, paths, baseline)
            all_touched.update(paths)

            try:
                apply_simulated(project_root, simulated)
            except Exception as exc:
                snapshot_candidate(project_root, run_dir, repair, sorted(all_touched))
                rb = rollback(project_root, baseline)
                write_report(final_report, status="HOST_APPLY_FAILED",
                             runDirectory=str(run_dir), repairAttempts=repair,
                             qaLog=str(current_qa_log), reason=str(exc), rollbackOk=rb)
                print(f"AUTOPILOT_STATUS: HOST_APPLY_FAILED\nROLLBACK_OK: {rb}\nREPORT: {final_report}")
                return 4

            snapshot_candidate(project_root, run_dir, repair, sorted(all_touched))

            print_section(f"AUTOPILOT V4.1 — FULL DEV LOOP RETEST {repair}/{args.max_repair_attempts}")
            next_log = run_dir / f"qa-{repair:02d}.log"
            qa_exit, current_qa_text = run_dev_loop(project_root, next_log)
            current_qa_log = next_log
            if qa_exit == 0 and overall_pass(current_qa_text):
                write_report(final_report, status="PASS", runDirectory=str(run_dir),
                             repairAttempts=repair, qaLog=str(current_qa_log),
                             rollbackOk=True)
                print(f"AUTOPILOT_STATUS: PASS\nREPAIR_ATTEMPTS: {repair}\nREPORT: {final_report}")
                return 0

        snapshot_candidate(project_root, run_dir, args.max_repair_attempts + 1,
                           sorted(all_touched))
        rb = rollback(project_root, baseline)
        final_status = "HUMAN_REVIEW_REQUIRED" if is_domain_failure(current_qa_text) else "AUTO_REPAIR_EXHAUSTED"
        write_report(final_report, status=final_status, runDirectory=str(run_dir),
                     repairAttempts=args.max_repair_attempts,
                     qaLog=str(current_qa_log),
                     reason="Automatic repair limit reached. Candidate snapshots were preserved before rollback.",
                     rollbackOk=rb)
        print(f"AUTOPILOT_STATUS: {final_status}\nROLLBACK_OK: {rb}\nREPORT: {final_report}")
        return 2 if final_status == "HUMAN_REVIEW_REQUIRED" else 1

    except PlanPreflightError as exc:
        rb = rollback(project_root, baseline) if baseline else True
        write_report(final_report, status="FILE_PLAN_PREFLIGHT_EXHAUSTED",
                     runDirectory=str(run_dir), reason=str(exc), rollbackOk=rb)
        print(f"AUTOPILOT_STATUS: FILE_PLAN_PREFLIGHT_EXHAUSTED\nROLLBACK_OK: {rb}\nREPORT: {final_report}")
        return 4
    except AutoPilotError as exc:
        rb = rollback(project_root, baseline) if baseline else True
        write_report(final_report, status="INFRASTRUCTURE_BLOCKED",
                     runDirectory=str(run_dir), reason=str(exc), rollbackOk=rb)
        print(f"AUTOPILOT_STATUS: INFRASTRUCTURE_BLOCKED\nROLLBACK_OK: {rb}\nREPORT: {final_report}")
        return 3
    except Exception as exc:
        rb = rollback(project_root, baseline) if baseline else True
        write_report(final_report, status="UNEXPECTED_FAILURE",
                     runDirectory=str(run_dir), reason=repr(exc), rollbackOk=rb)
        print(f"AUTOPILOT_STATUS: UNEXPECTED_FAILURE\nROLLBACK_OK: {rb}\nREPORT: {final_report}")
        return 5


if __name__ == "__main__":
    raise SystemExit(main())
