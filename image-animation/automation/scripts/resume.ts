import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { loadTaskSpec } from "../orchestrator/orchestrator.ts";

const root = process.cwd();
const statePath = path.join(root, "image-animation", "automation", "state", "project-state.json");
const specRoot = path.join(root, "image-animation", "automation", "specs");
const dryRun = process.argv.includes("--dry-run");
const noCommit = process.argv.includes("--no-commit");

export const LOCKED_ROADMAP = ["IA-11.0", "IA-11.1", "IA-11.2", "IA-11.3", "IA-11.4", "IA-11.5", "IA-11.6", "IA-11.7", "IA-11.8", "IA-11.9"] as const;

const definitions: Record<string, { title: string; goal: string; paths: string[]; requirements: string[] }> = {
  "IA-1.1": { title: "Scene Graph Core", goal: "Implement a deterministic typed Scene Graph with stable IDs, validation, ordering, and serialization.", paths: ["image-animation/core/scene-graph/**", "image-animation/tests/scene-graph/**"], requirements: ["Support point, segment, polyline, polygon, circle, label, arrow, and image_layer.", "Separate identity, geometry, visual style, layer, relations, and metadata.", "Keep geometry separate from animation."] },
  "IA-2.1": { title: "Geometry Lock", goal: "Implement deterministic fail-closed Geometry Lock authority with machine-readable evidence.", paths: ["image-animation/core/geometry-lock/**", "image-animation/tests/geometry-lock/**"], requirements: ["Validate point references, endpoints, polygon topology, circles, label anchors, layers, and relations.", "Unknown, proposed, estimated, and exact must remain distinct."] },
  "IA-3.1": { title: "Manim Compiler", goal: "Compile approved Scene Graphs into deterministic Manim output without reinterpreting geometry.", paths: ["image-animation/renderers/manim/**", "image-animation/tests/manim/**"], requirements: ["Scene Graph remains source of truth.", "Support visually meaningful V1 object types and deterministic layout guards."] },
  "IA-4.1": { title: "Motion Timeline", goal: "Implement a validated Animation Timeline contract referencing Scene Graph IDs.", paths: ["image-animation/core/timeline/**", "image-animation/tests/timeline/**"], requirements: ["Support appear, disappear, move, highlight, draw, fade, scale, and camera focus.", "Reject invalid references, negative duration, bad ordering, and conflicts."] },
  "IA-5.1": { title: "Manual Image Editor", goal: "Implement deterministic Scene Graph editing operations that never silently invent geometry.", paths: ["image-animation/core/editor/**", "image-animation/tests/editor/**"], requirements: ["Support add, edit, delete, rename, layer, relation, lock, and unlock operations.", "Every operation returns a valid graph or deterministic errors."] },
  "IA-6.1": { title: "Image Understanding", goal: "Implement replaceable image-understanding proposal interfaces and candidate Scene Graph review flow.", paths: ["image-animation/adapters/image-understanding/**", "image-animation/tests/image-understanding/**"], requirements: ["AI output remains proposed until explicitly approved.", "Do not hard-code a paid provider."] },
  "IA-7.1": { title: "Segmentation", goal: "Implement provider-neutral segmentation contracts and offline fixtures attached to Scene Graph objects/layers.", paths: ["image-animation/adapters/segmentation/**", "image-animation/tests/segmentation/**"], requirements: ["Segmentation cannot redefine locked geometry.", "Report unavailable model runtime truthfully."] },
  "IA-8.1": { title: "Depth and 2.5D", goal: "Implement estimated depth contracts, 2.5D scene representation, and deterministic renderer routing.", paths: ["image-animation/adapters/depth/**", "image-animation/renderers/two-point-five-d/**", "image-animation/tests/depth/**"], requirements: ["Keep source image, exact geometry, and estimated depth distinct.", "Estimated depth is never mathematical ground truth."] },
  "IA-9.1": { title: "Blender Router", goal: "Implement deterministic Blender routing and artifact contracts from validated graph plus timeline.", paths: ["image-animation/renderers/blender/**", "image-animation/tests/blender/**"], requirements: ["Blender is optional and runtime status is truthful.", "Do not make Blender mandatory for all tasks."] },
  "IA-10.1": { title: "Generative Motion Router and V1 Demo", goal: "Implement policy-controlled generative motion routing, Frame QA evidence rules, and a deterministic V1 demo.", paths: ["image-animation/renderers/router/**", "image-animation/renderers/generative/**", "image-animation/qa/frame/**", "image-animation/demo/**", "image-animation/tests/v1/**"], requirements: ["Exact mathematical geometry routes to deterministic renderers.", "Generative output is non-authoritative.", "Frame QA cannot pass without actual frame evidence.", "Provide reproducible end-to-end demo instructions and artifacts."] },
  "IA-11.0": { title: "V1.1 Runtime Discovery", goal: "Implement truthful, read-only runtime capability discovery and environment-isolation contracts.", paths: ["image-animation/runtime/discovery/**", "image-animation/tests/runtime-discovery/**"], requirements: ["Detect Node, npm, Python, FFmpeg, Manim, GPU/CUDA, Blender, and optional model stacks without system mutation.", "Report AVAILABLE, NOT_AVAILABLE, or NOT_TESTED with evidence.", "Use shell:false child processes only."] },
  "IA-11.1": { title: "V1.1 Segmentation Runtime", goal: "Harden provider-neutral segmentation runtime integration with truthful capability status.", paths: ["image-animation/adapters/segmentation/**", "image-animation/runtime/segmentation/**", "image-animation/tests/segmentation-runtime/**"], requirements: ["Segmentation proposals attach to Scene Graph objects or layers and never redefine locked geometry.", "Provide deterministic fixtures and a real smoke path only when runtime is available."] },
  "IA-11.2": { title: "V1.1 Depth Runtime", goal: "Harden provider-neutral depth inference and 2.5D runtime integration.", paths: ["image-animation/adapters/depth/**", "image-animation/renderers/two-point-five-d/**", "image-animation/runtime/depth/**", "image-animation/tests/depth-runtime/**"], requirements: ["Keep image coordinates, exact Scene Graph geometry, and estimated depth distinct.", "Support layer depth, parallax, camera motion, separation, and object-plane transforms."] },
  "IA-11.3": { title: "V1.1 Blender Runtime", goal: "Integrate a controlled optional Blender runtime adapter with validated contracts.", paths: ["image-animation/renderers/blender/**", "image-animation/runtime/blender/**", "image-animation/tests/blender-runtime/**"], requirements: ["Use shell:false controlled invocation and bounded artifacts.", "Never reinterpret locked geometry and report unavailable executable truthfully."] },
  "IA-11.4": { title: "V1.1 Generative Runtime", goal: "Implement provider-neutral generative motion runtime adapters with deterministic authority policy.", paths: ["image-animation/renderers/generative/**", "image-animation/runtime/generative/**", "image-animation/tests/generative-runtime/**"], requirements: ["Generative output is never authoritative for exact geometry.", "Credentials and unavailable providers are reported truthfully without blocking deterministic renderers."] },
  "IA-11.5": { title: "V1.1 Renderer Router Hardening", goal: "Harden deterministic renderer selection across Manim, 2.5D, Blender, and generative routes.", paths: ["image-animation/renderers/router/**", "image-animation/tests/router-runtime/**"], requirements: ["Exact and diagram geometry route to Manim.", "Parallax and depth motion route to 2.5D.", "Generative-only exact geometry routing fails deterministically."] },
  "IA-11.6": { title: "V1.1 Frame QA Runtime", goal: "Implement artifact-backed Frame QA with truthful PASS, FAIL, NOT_TESTED, and RUNTIME_NOT_AVAILABLE outcomes.", paths: ["image-animation/qa/frame/**", "image-animation/runtime/frame/**", "image-animation/tests/frame-runtime/**"], requirements: ["Inspect real readable frame evidence when available.", "Detect corrupt, blank, missing, wrong-sized, and structurally inconsistent frames.", "Never pass from source inspection alone."] },
  "IA-11.7": { title: "V1.1 End-to-End Pipeline", goal: "Build a reproducible image-to-video pipeline using the strongest locally available deterministic path.", paths: ["image-animation/pipeline/**", "image-animation/demo/**", "image-animation/tests/pipeline-runtime/**"], requirements: ["Exercise image understanding, review, Geometry Lock, timeline, routing, rendering, artifact, and Frame QA integration.", "Use Manim when optional runtimes are unavailable."] },
  "IA-11.8": { title: "V1.1 Performance and Artifacts", goal: "Add correctness-preserving cache, timeout, cancellation, and artifact lifecycle hardening.", paths: ["image-animation/runtime/cache/**", "image-animation/runtime/artifacts/**", "image-animation/tests/performance-runtime/**", ".gitignore"], requirements: ["Use content hashing and deterministic invalidation.", "Keep temporary outputs bounded and outside repository root.", "Do not weaken correctness for speed."] },
  "IA-11.9": { title: "V1.1 Release QA", goal: "Validate the complete V1.1 runtime pipeline and produce a machine-readable release report.", paths: ["image-animation/release/**", "image-animation/tests/release-runtime/**"], requirements: ["Run fresh deterministic core, runtime capability, routing, Frame QA, end-to-end, security, package, build, and regression checks.", "Report optional runtime absence truthfully."] },
};

function run(executable: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
  const npmCli = path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
  return spawnSync(executable === "npm" ? process.execPath : executable, executable === "npm" ? [npmCli, ...args] : args, { cwd: root, stdio: "inherit", encoding: "utf8", shell: false, env });
}
function runCaptured(executable: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
  const npmCli = path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
  const result = spawnSync(executable === "npm" ? process.execPath : executable, executable === "npm" ? [npmCli, ...args] : args, { cwd: root, stdio: "pipe", encoding: "utf8", shell: false, env });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result;
}
function writeAtomic(filePath: string, value: unknown): void {
  const temporary = `${filePath}.ia-tmp-${process.pid}`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temporary, filePath);
}
function ensureTaskSpec(taskId: string, write = true): boolean {
  if (!LOCKED_ROADMAP.includes(taskId as typeof LOCKED_ROADMAP[number])) return false;
  const specPath = path.join(specRoot, `${taskId}.json`);
  if (!existsSync(specPath) && !write) return Boolean(definitions[taskId]);
  if (!existsSync(specPath) && write) {
    const definition = definitions[taskId];
    writeAtomic(specPath, { id: taskId, title: definition.title, phase: taskId.split(".")[0], goal: definition.goal,
      allowedPaths: [...definition.paths, `image-animation/automation/specs/${taskId}.json`],
      forbiddenPaths: ["server/**", "src/**", "tests/**", "openclaw-extension-windows-fix/**"],
      protectedPaths: [], architectureProtectedPaths: ["image-animation/automation/**"], agentAllowedPaths: definition.paths,
      requirements: definition.requirements, requiredTests: ["npm run lint", "npm run ia:task-test", "npm run ia:qa", "npm run ia:regression"],
      taskQa: ["npm run lint", "npm run ia:task-test"], passCriteria: ["Task tests pass.", "All deterministic gates pass.", "Changes remain within allowed paths."],
      requiredGates: ["IA-G0", "IA-G1", "IA-G2", "IA-G3", "IA-G9"], maxRepairAttempts: 3, architectureChangeAllowed: false, expectedBranch: "feature/image-animation-foundation" });
  }
  try { loadTaskSpec(root, taskId); return true; } catch { return false; }
}
function nextTask(taskId: string): string {
  const index = LOCKED_ROADMAP.indexOf(taskId as typeof LOCKED_ROADMAP[number]);
  if (index < 0) throw new Error("PROJECT_STATE_TRANSITION_FAIL");
  return LOCKED_ROADMAP[index + 1] ?? "ROADMAP_COMPLETE";
}
function stop(reason: string, taskId: string, repairCount = 0): never {
  console.log(JSON.stringify({ IA_AUTOPILOT: "BLOCKED", CURRENT_TASK: taskId, REPAIR_COUNT: repairCount, STOP_REASON: reason }, null, 2));
  process.exit(1);
}

if (run("npm", ["run", "ia:doctor"]).status !== 0) stop("IA_DOCTOR_FAIL", "UNKNOWN");
if ((process.env.IA_AGENT_PROVIDER ?? "none") !== "codex" && !dryRun) stop("PROVIDER_NOT_AVAILABLE", "UNKNOWN");

while (true) {
  const state = JSON.parse(readFileSync(statePath, "utf8"));
  const taskId = state.currentTask as string;
  if (taskId === "ROADMAP_COMPLETE") { console.log(JSON.stringify({ IA_AUTOPILOT: "PASS", STOP_REASON: "ROADMAP_COMPLETE", PROJECT_STATE: "ROADMAP_COMPLETE" }, null, 2)); break; }
  if (!taskId || state.humanGate !== "NONE") stop(state.humanGate || "HUMAN_GATE_REQUIRED", taskId || "UNKNOWN", state.repairCount ?? 0);
  if (state.lastCompletedTask === taskId) stop("PROJECT_STATE_TRANSITION_FAIL", taskId, state.repairCount ?? 0);
  if (!ensureTaskSpec(taskId, !dryRun)) stop("HUMAN_GATE_REQUIRED", taskId, state.repairCount ?? 0);
  if (dryRun) { console.log(JSON.stringify({ IA_AUTOPILOT: "READY_TO_EXECUTE", CURRENT_TASK: taskId, PROVIDER: process.env.IA_AGENT_PROVIDER ?? "none", DRY_RUN: true, ROADMAP_TASKS: LOCKED_ROADMAP.length })); break; }

  let repairs = 0;
  let passed = false;
  let failureEvidence = "";
  const existingQa = runCaptured("npm", ["run", "ia:task-test", "--", taskId], { ...process.env, IA_TASK_ID: taskId });
  if (existingQa.status === 0) {
    const env = { ...process.env, IA_TASK_ID: taskId };
    const qa = runCaptured("npm", ["run", "ia:qa"], env);
    passed = qa.status === 0 && run("npm", ["run", "ia:regression"], env).status === 0;
    if (!passed) failureEvidence = `${qa.stdout ?? ""}\n${qa.stderr ?? ""}`.slice(-6000);
  }
  else failureEvidence = `${existingQa.stdout ?? ""}\n${existingQa.stderr ?? ""}`.slice(-6000);
  while (!passed && repairs < 3) {
    const buildEnv = { ...process.env, IA_FAILURE_EVIDENCE: failureEvidence };
    const build = run("npm", ["run", "ia:build", "--", taskId, "--repair", String(repairs + 1)], buildEnv);
    if (build.status === 0) {
      const env = { ...process.env, IA_TASK_ID: taskId };
      const taskQa = runCaptured("npm", ["run", "ia:task-test", "--", taskId], env);
      const qa = taskQa.status === 0 ? runCaptured("npm", ["run", "ia:qa"], env) : taskQa;
      const regression = qa.status === 0 ? run("npm", ["run", "ia:regression"], env) : qa;
      passed = taskQa.status === 0 && qa.status === 0 && regression.status === 0;
      if (!passed) failureEvidence = `${qa.stdout ?? ""}\n${qa.stderr ?? ""}`.slice(-6000);
    }
    if (!passed) repairs += 1;
  }
  if (!passed) stop("AUTO_REPAIR_EXHAUSTED", taskId, 3);

  const following = nextTask(taskId);
  const completed = following === "ROADMAP_COMPLETE";
  writeAtomic(statePath, { ...state, currentPhase: completed ? "R9" : `R${following.split(".")[1]}`, lastCompletedTask: taskId, currentTask: following, nextTask: following,
    repairCount: repairs, automationHealth: "PASS", autopilotStatus: completed ? "ROADMAP_COMPLETE" : "RUNNING", humanGate: "NONE", updatedAt: new Date().toISOString() });
  if (!noCommit) {
    const spec = loadTaskSpec(root, taskId);
    const stagedPaths = [...spec.allowedPaths.map((entry) => entry.replace(/\/\*\*$/, "")), "image-animation/automation/state/project-state.json"];
    const message = taskId === "IA-11.9" ? "feat(image-animation): complete V1.1 runtime pipeline" : `feat(image-animation): complete ${taskId}`;
    if (run("git", ["add", "--", ...stagedPaths]).status !== 0 || run("git", ["commit", "-m", message]).status !== 0) stop("CHECKPOINT_FAIL", taskId, repairs);
  }
  console.log(JSON.stringify({ IA_AUTOPILOT: "TASK_PASS", TASK: taskId, REPAIR_COUNT: repairs, NEXT_TASK: following }, null, 2));
}
