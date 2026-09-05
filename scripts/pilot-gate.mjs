import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";

const root = process.cwd();
const expectedBranch = process.env.PILOT_EXPECTED_BRANCH ?? "pilot/mst-math-internal-demo-v1";
const npmBin = process.platform === "win32" ? "npm.cmd" : "npm";
const evidenceRoot = path.join(root, "render_output", "pilot-evidence");
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const runDir = path.join(evidenceRoot, runId);
fs.mkdirSync(runDir, { recursive: true });

function git(args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", shell: false });
  if (result.status !== 0) return "UNKNOWN";
  return (result.stdout ?? "").trim();
}

function writeText(name, value) {
  fs.writeFileSync(path.join(runDir, name), value ?? "", "utf8");
}

const report = {
  schemaVersion: 1,
  pilotId: "MST-MATH-INTERNAL-DEMO-V1",
  runId,
  startedAt: new Date().toISOString(),
  expectedBranch,
  branch: git(["branch", "--show-current"]),
  head: git(["rev-parse", "HEAD"]),
  worktree: git(["status", "--porcelain"]),
  platform: process.platform,
  node: process.version,
  steps: [],
  bridge: null,
  finalStatus: "BLOCK",
};

function persist() {
  report.finishedAt = report.finishedAt ?? new Date().toISOString();
  const json = JSON.stringify(report, null, 2) + "\n";
  fs.writeFileSync(path.join(runDir, "PILOT_GATE_RESULT.json"), json, "utf8");
  fs.writeFileSync(path.join(evidenceRoot, "latest.json"), json, "utf8");

  const lines = [
    "# MST-MATH Pilot Machine Gate Report",
    "",
    `- Pilot: ${report.pilotId}`,
    `- Branch: \`${report.branch}\``,
    `- HEAD: \`${report.head}\``,
    `- Platform: \`${report.platform}\``,
    `- Node: \`${report.node}\``,
    `- Final: **${report.finalStatus}**`,
    "",
    "| Step | Status | Exit |",
    "|---|---|---:|",
    ...report.steps.map((step) => `| ${step.id} | ${step.status} | ${step.exitCode ?? ""} |`),
    "",
    `Bridge: ${report.bridge ? JSON.stringify(report.bridge) : "NOT_CHECKED"}`,
    "",
    report.finalStatus === "PASS"
      ? "`PILOT_MACHINE_GATE=PASS`"
      : "`PILOT_MACHINE_GATE=BLOCK`",
    "",
  ];
  fs.writeFileSync(path.join(runDir, "PILOT_GATE_REPORT.md"), lines.join("\n"), "utf8");
}

function block(reason) {
  report.blocker = reason;
  report.finalStatus = "BLOCK";
  report.finishedAt = new Date().toISOString();
  persist();
  console.error(`\nPILOT_MACHINE_GATE=BLOCK | ${reason}`);
  console.error(`Evidence: ${runDir}`);
  process.exitCode = 1;
}

if (report.branch !== expectedBranch) {
  block(`WRONG_BRANCH expected=${expectedBranch} actual=${report.branch}`);
} else if (report.worktree === "UNKNOWN") {
  block("GIT_STATUS_UNAVAILABLE");
} else if (report.worktree.trim().length > 0) {
  writeText("initial-git-status.txt", report.worktree + "\n");
  block("DIRTY_WORKTREE");
}

if (process.exitCode) {
  // Guard failed before any executable QA.
} else {
  console.log(`MST-MATH PILOT MACHINE GATE\nbranch=${report.branch}\nhead=${report.head}`);

  function runStep(id, command, args) {
    const stdoutPath = path.join(runDir, `${id}.stdout.log`);
    const stderrPath = path.join(runDir, `${id}.stderr.log`);
    const out = fs.openSync(stdoutPath, "w");
    const err = fs.openSync(stderrPath, "w");
    const startedAt = new Date().toISOString();
    console.log(`\n=== ${id} ===`);
    const result = spawnSync(command, args, {
      cwd: root,
      env: process.env,
      stdio: ["ignore", out, err],
      shell: false,
    });
    fs.closeSync(out);
    fs.closeSync(err);
    const exitCode = result.status ?? 1;
    const step = {
      id,
      status: exitCode === 0 ? "PASS" : "FAIL",
      exitCode,
      startedAt,
      finishedAt: new Date().toISOString(),
      stdout: path.relative(root, stdoutPath),
      stderr: path.relative(root, stderrPath),
    };
    report.steps.push(step);
    console.log(`${id}=${step.status}`);
    persist();
    return exitCode === 0;
  }

  const mandatorySteps = [
    ["qa-ci", npmBin, ["run", "qa:ci"]],
    ["qa-ingest", npmBin, ["run", "qa:ingest"]],
    ["qa-question-bank-e2e", npmBin, ["run", "qa:question-bank:e2e"]],
    ["qa-assessment", npmBin, ["run", "qa:assessment"]],
    ["qa-export", npmBin, ["run", "qa:export"]],
    ["qa-ux-01", npmBin, ["run", "qa:ux-01"]],
    ["qa-python-runtime", npmBin, ["run", "qa:python-runtime"]],
    ["qa-python-math", npmBin, ["run", "qa:python-math"]],
    ["qa-manim", npmBin, ["run", "qa:manim"]],
  ];

  let allPass = true;
  for (const [id, command, args] of mandatorySteps) {
    if (!runStep(id, command, args)) {
      allPass = false;
      report.blocker = `FAILED_STEP:${id}`;
      break;
    }
  }

  async function bridgeHealth() {
    try {
      const response = await fetch("http://127.0.0.1:8765/health", {
        signal: AbortSignal.timeout(3000),
      });
      if (!response.ok) return null;
      const body = await response.json();
      return body?.status === "READY" ? body : null;
    } catch {
      return null;
    }
  }

  async function ensureBridge() {
    const existing = await bridgeHealth();
    if (existing) {
      report.bridge = { status: "PASS", mode: "REUSED_EXISTING", health: existing };
      persist();
      return { ok: true, child: null };
    }

    const bridgeOut = fs.openSync(path.join(runDir, "bridge.stdout.log"), "w");
    const bridgeErr = fs.openSync(path.join(runDir, "bridge.stderr.log"), "w");
    const child = spawn(npmBin, ["run", "bridge:start"], {
      cwd: root,
      env: process.env,
      stdio: ["ignore", bridgeOut, bridgeErr],
      detached: process.platform !== "win32",
      shell: false,
    });
    fs.closeSync(bridgeOut);
    fs.closeSync(bridgeErr);

    for (let i = 0; i < 45; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const health = await bridgeHealth();
      if (health) {
        report.bridge = { status: "PASS", mode: "STARTED_BY_PILOT_GATE", pid: child.pid, health };
        persist();
        return { ok: true, child };
      }
      if (child.exitCode !== null) break;
    }

    report.bridge = { status: "FAIL", mode: "START_ATTEMPTED", pid: child.pid };
    persist();
    return { ok: false, child };
  }

  function stopOwnedBridge(child) {
    if (!child?.pid) return;
    try {
      if (process.platform === "win32") {
        spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
          cwd: root,
          stdio: "ignore",
          shell: false,
        });
      } else {
        process.kill(-child.pid, "SIGTERM");
      }
    } catch {
      // Cleanup failure is recorded but must not hide the real gate result.
      report.bridgeCleanup = "WARN";
    }
  }

  if (allPass) {
    const bridge = await ensureBridge();
    if (!bridge.ok) {
      allPass = false;
      report.blocker = "LOCAL_RENDER_BRIDGE_NOT_READY";
    } else {
      const goldenPass = runStep("real-golden-runtime", process.execPath, [
        "--import",
        "tsx",
        "scripts/run-golden-runtime.ts",
      ]);
      if (!goldenPass) {
        allPass = false;
        report.blocker = "FAILED_STEP:real-golden-runtime";
      }
    }
    stopOwnedBridge(bridge.child);
  }

  if (allPass) {
    const finalWorktree = git(["status", "--porcelain"]);
    report.finalWorktree = finalWorktree;
    if (finalWorktree !== "UNKNOWN" && finalWorktree.trim().length === 0) {
      report.finalStatus = "PASS";
      report.finishedAt = new Date().toISOString();
      persist();
      console.log(`\nPILOT_MACHINE_GATE=PASS`);
      console.log(`Evidence: ${runDir}`);
    } else {
      block("WORKTREE_MUTATED_BY_GATE");
    }
  } else {
    report.finalStatus = "BLOCK";
    report.finishedAt = new Date().toISOString();
    persist();
    console.error(`\nPILOT_MACHINE_GATE=BLOCK | ${report.blocker ?? "UNKNOWN"}`);
    console.error(`Evidence: ${runDir}`);
    process.exitCode = 1;
  }
}
