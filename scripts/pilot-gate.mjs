import fs from "node:fs";
import path from "node:path";
import { spawnSync, execSync } from "node:child_process";

const root = process.cwd();
const evidenceRoot = path.join(root, "render_output", "pilot-evidence");
fs.mkdirSync(evidenceRoot, { recursive: true });

function git(command) {
  try {
    return execSync(command, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    return `ERROR:${error?.message ?? "unknown"}`;
  }
}

const startedAt = new Date().toISOString();
const branch = git("git branch --show-current");
const sha = git("git rev-parse HEAD");
const initialStatus = git("git status --porcelain");
const runId = `${startedAt.replace(/[:.]/g, "-")}-${sha.slice(0, 12)}`;
const runDir = path.join(evidenceRoot, runId);
fs.mkdirSync(runDir, { recursive: true });

const manifest = {
  pilotId: "MST-MATH-INTERNAL-PILOT-V1",
  startedAt,
  branch,
  sha,
  initialWorktree: initialStatus === "" ? "CLEAN" : "DIRTY",
  gate1: "PROVISIONAL_PENDING_MAC_CONVERGENCE",
  gate2: "RUNNING",
  gate3: "PENDING_REAL_GOLDEN_EXECUTION",
  gate4: "PENDING_HUMAN_ACCEPTANCE",
  steps: [],
};

fs.writeFileSync(path.join(runDir, "manifest.json"), JSON.stringify(manifest, null, 2));
fs.writeFileSync(
  path.join(runDir, "git-state.txt"),
  `BRANCH=${branch}\nSHA=${sha}\nINITIAL_WORKTREE=${manifest.initialWorktree}\nSTATUS_RAW=\n${initialStatus}\n`,
);

function saveManifest() {
  fs.writeFileSync(path.join(runDir, "manifest.json"), JSON.stringify(manifest, null, 2));
}

function block(code, detail) {
  manifest.gate2 = "BLOCK";
  manifest.blockerCode = code;
  manifest.blockerDetail = detail;
  saveManifest();
  writeReport();
  console.error(`PILOT_MACHINE_GATE=BLOCK`);
  console.error(`BLOCKER_CODE=${code}`);
  console.error(detail);
  process.exit(1);
}

function runStep(id, command) {
  const stepStart = new Date().toISOString();
  console.log(`\n=== ${id} ===`);
  console.log(command);
  const result = spawnSync(command, {
    cwd: root,
    shell: true,
    encoding: "utf8",
    env: process.env,
    maxBuffer: 64 * 1024 * 1024,
  });
  const output = [result.stdout ?? "", result.stderr ?? ""].join("\n");
  fs.writeFileSync(path.join(runDir, `${id}.log`), output);
  const step = {
    id,
    command,
    startedAt: stepStart,
    finishedAt: new Date().toISOString(),
    exitCode: result.status ?? 1,
    status: result.status === 0 ? "PASS" : "FAIL",
  };
  manifest.steps.push(step);
  saveManifest();
  if (result.status !== 0) {
    block(`G2_${id}_FAIL`, `Step ${id} failed. See ${path.relative(root, path.join(runDir, `${id}.log`))}`);
  }
}

async function checkBridge() {
  const id = "BRIDGE_HEALTH";
  const started = new Date().toISOString();
  let status = "FAIL";
  let detail = "";
  try {
    const response = await fetch("http://127.0.0.1:8765/health", { signal: AbortSignal.timeout(10000) });
    const text = await response.text();
    detail = `HTTP=${response.status}\n${text}`;
    if (response.ok) {
      try {
        const parsed = JSON.parse(text);
        status = parsed?.status === "READY" ? "PASS" : "FAIL";
      } catch {
        status = text.includes("READY") ? "PASS" : "FAIL";
      }
    }
  } catch (error) {
    detail = String(error?.stack ?? error);
  }
  fs.writeFileSync(path.join(runDir, `${id}.log`), detail);
  manifest.steps.push({ id, command: "GET http://127.0.0.1:8765/health", startedAt: started, finishedAt: new Date().toISOString(), exitCode: status === "PASS" ? 0 : 1, status });
  saveManifest();
  if (status !== "PASS") {
    block("G2_BRIDGE_NOT_READY", "Local Render Bridge must report READY on 127.0.0.1:8765 before pilot certification.");
  }
}

function writeReport() {
  const lines = [
    "# MST-MATH INTERNAL PILOT V1 — MACHINE GATE REPORT",
    "",
    `- Run: ${runId}`,
    `- Started: ${manifest.startedAt}`,
    `- Branch: ${manifest.branch}`,
    `- SHA: ${manifest.sha}`,
    `- Initial worktree: ${manifest.initialWorktree}`,
    `- G1 Baseline: ${manifest.gate1}`,
    `- G2 Machine: ${manifest.gate2}`,
    `- G3 Real E2E: ${manifest.gate3}`,
    `- G4 Human: ${manifest.gate4}`,
    "",
    "## Steps",
    "",
    "| Step | Result | Exit |",
    "|---|---|---:|",
    ...manifest.steps.map((step) => `| ${step.id} | ${step.status} | ${step.exitCode} |`),
    "",
  ];
  if (manifest.blockerCode) {
    lines.push("## Blocker", "", `- Code: ${manifest.blockerCode}`, `- Detail: ${manifest.blockerDetail}`, "");
  }
  lines.push("## Rule", "", "This report certifies only Gate 2 machine execution on the recorded SHA. It does not certify Gate 3 real-source E2E or Gate 4 human acceptance.", "");
  fs.writeFileSync(path.join(runDir, "PILOT_GATE_REPORT.md"), lines.join("\n"));
}

if (manifest.initialWorktree !== "CLEAN") {
  block("G2_DIRTY_WORKTREE", "Pilot certification must start from a clean worktree. Commit/stash intentional changes and rerun from zero.");
}

if (!branch.startsWith("pilot/")) {
  block("G2_WRONG_BRANCH", `Expected a pilot/* branch, got ${branch}`);
}

runStep("PYTHON_RUNTIME", "npm run qa:python-runtime");
runStep("QA_CI", "npm run qa:ci");
runStep("INGEST", "npm run qa:ingest");
runStep("QUESTION_BANK_E2E", "npm run qa:question-bank:e2e");
runStep("ASSESSMENT", "npm run qa:assessment");
runStep("EXPORT", "npm run qa:export");
runStep("UX_01", "npm run qa:ux-01");
runStep("PYTHON_MATH", "npm run qa:python-math");
runStep("MANIM", "npm run qa:manim");
await checkBridge();
runStep("QUESTION_VIDEO_RUNTIME", "npm run qa:question-video:runtime");
runStep("REAL_GOLDEN_RUNTIME", "node --import tsx scripts/run-golden-runtime.ts");

manifest.gate2 = "PASS";
manifest.finishedAt = new Date().toISOString();
saveManifest();
writeReport();

const latest = {
  runId,
  runDir: path.relative(root, runDir),
  branch,
  sha,
  gate1: manifest.gate1,
  gate2: manifest.gate2,
  gate3: manifest.gate3,
  gate4: manifest.gate4,
  updatedAt: manifest.finishedAt,
};
fs.writeFileSync(path.join(evidenceRoot, "latest.json"), JSON.stringify(latest, null, 2));
console.log("\nPILOT_MACHINE_GATE=PASS");
console.log(`PILOT_SHA=${sha}`);
console.log(`EVIDENCE=${path.relative(root, runDir)}`);
