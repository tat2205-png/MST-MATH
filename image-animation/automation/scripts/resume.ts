import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const statePath = path.join(root, "image-animation", "automation", "state", "project-state.json");
const taskSpecPath = path.join(root, "image-animation", "automation", "specs", "IA-1.1.json");
const dryRun = process.argv.includes("--dry-run");

function run(command: string, args: string[], inherit = false) {
  if (command === "npm") return spawnSync(process.execPath, [path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js"), ...args], { cwd: root, stdio: inherit ? "inherit" : "pipe", encoding: "utf8", shell: false });
  return spawnSync(command, args, { cwd: root, stdio: inherit ? "inherit" : "pipe", encoding: "utf8", shell: false });
}
function writeAtomic(filePath: string, value: unknown): void {
  const temporary = `${filePath}.ia-tmp-${process.pid}`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temporary, filePath);
}
function ensureTaskSpec(taskId: string, write = true): boolean {
  if (existsSync(taskSpecPath)) return true;
  if (taskId !== "IA-1.1") return false;
  const spec = {
    id: "IA-1.1", title: "Scene Graph Core", phase: "IA-1", goal: "Implement the approved provider-neutral Scene Graph Core with geometry separate from animation.",
    allowedPaths: ["image-animation/core/scene-graph/**", "image-animation/tests/scene-graph/**", "image-animation/automation/specs/IA-1.1.json"],
    forbiddenPaths: ["server/**", "src/**", "tests/**", "image-animation/fixtures/**", "openclaw-extension-windows-fix/**"],
    protectedPaths: [], architectureProtectedPaths: [], agentAllowedPaths: ["image-animation/core/scene-graph/**"],
    requirements: ["Support point, segment, polyline, polygon, circle, label, arrow, and image_layer.", "Keep GEOMETRY separate from ANIMATION.", "Do not add SAM2, Depth Anything, Blender, Vision AI, or generative video."],
    requiredTests: ["npm run lint", "npm run ia:qa", "npm run ia:regression"], taskQa: ["npm run lint", "npm run ia:qa"],
    passCriteria: ["All deterministic QA gates pass.", "All changes remain in approved Scene Graph paths."], requiredGates: ["IA-G0", "IA-G1", "IA-G2", "IA-G9"],
    maxRepairAttempts: 3, architectureChangeAllowed: false, expectedBranch: "feature/image-animation-foundation",
  };
  if (write) writeAtomic(taskSpecPath, spec);
  return true;
}

const doctor = run("npm", ["run", "ia:doctor"], true);
if (doctor.status !== 0) { console.log(JSON.stringify({ IA_AUTOPILOT: "BLOCKED", STOP_REASON: "IA_DOCTOR_FAIL" })); process.exit(1); }
const state = JSON.parse(readFileSync(statePath, "utf8"));
const taskId = state.currentTask;
if (!taskId || state.humanGate !== "NONE") { console.log(JSON.stringify({ IA_AUTOPILOT: "BLOCKED", CURRENT_TASK: taskId, STOP_REASON: state.humanGate || "HUMAN_GATE_REQUIRED" }, null, 2)); process.exit(1); }
if (state.currentTask === state.nextTask && state.lastCompletedTask === state.currentTask) { console.log(JSON.stringify({ IA_AUTOPILOT: "BLOCKED", STOP_REASON: "PROJECT_STATE_TRANSITION_FAIL" })); process.exit(1); }
if (!ensureTaskSpec(taskId, !dryRun)) { console.log(JSON.stringify({ IA_AUTOPILOT: "BLOCKED", STOP_REASON: "HUMAN_GATE_REQUIRED", CURRENT_TASK: taskId })); process.exit(1); }
if (dryRun) { console.log(JSON.stringify({ IA_AUTOPILOT: "READY_TO_EXECUTE", CURRENT_TASK: taskId, PROVIDER: process.env.IA_AGENT_PROVIDER ?? "none", DRY_RUN: true })); process.exit(0); }
if ((process.env.IA_AGENT_PROVIDER ?? "none") === "none") { console.log(JSON.stringify({ IA_AUTOPILOT: "BLOCKED", STOP_REASON: "PROVIDER_NOT_AVAILABLE", CURRENT_TASK: taskId })); process.exit(1); }
const build = run("npm", ["run", "ia:build", "--", taskId], true);
if (build.status !== 0) { console.log(JSON.stringify({ IA_AUTOPILOT: "BLOCKED", STOP_REASON: "TASK_EXECUTION_FAIL", CURRENT_TASK: taskId })); process.exit(1); }
const qa = run("npm", ["run", "ia:qa"], true);
const regression = run("npm", ["run", "ia:regression"], true);
if (qa.status !== 0 || regression.status !== 0) { console.log(JSON.stringify({ IA_AUTOPILOT: "BLOCKED", STOP_REASON: "DETERMINISTIC_QA_FAIL", CURRENT_TASK: taskId })); process.exit(1); }
const nextTask = taskId === "IA-1.1" ? "IA-2.1" : "ROADMAP_COMPLETE";
writeAtomic(statePath, { ...state, lastCompletedTask: taskId, currentTask: nextTask, nextTask, repairCount: 0, automationHealth: "PASS", updatedAt: new Date().toISOString() });
const add = run("git", ["add", "image-animation"]);
const commit = add.status === 0 ? run("git", ["commit", "-m", `feat(image-animation): complete ${taskId}`]) : { status: 1 };
if (commit.status !== 0) { console.log(JSON.stringify({ IA_AUTOPILOT: "BLOCKED", STOP_REASON: "CHECKPOINT_FAIL", CURRENT_TASK: taskId })); process.exit(1); }
console.log(JSON.stringify({ IA_AUTOPILOT: "PASS", TASK: taskId, CHECKPOINT: "PASS", CURRENT_TASK: nextTask, NEXT_TASK: nextTask }, null, 2));
