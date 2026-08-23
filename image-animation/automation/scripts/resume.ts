import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const doctor = spawnSync("npm", ["run", "ia:doctor"], { cwd: root, stdio: "inherit", shell: true });
if (doctor.status !== 0) {
  console.log(JSON.stringify({ IA_AUTOPILOT: "BLOCKED", STOP_REASON: "IA_DOCTOR_FAIL" }));
  process.exit(1);
}
const state = JSON.parse(readFileSync(path.join(root, "image-animation/automation/state/project-state.json"), "utf8"));
if (state.realAgentStatus !== "PASS" || state.humanGate === "IA-0A.6_REQUIRED") {
  console.log(JSON.stringify({ IA_AUTOPILOT: "BLOCKED", CURRENT_TASK: state.currentTask, NEXT_TASK: state.nextTask, STOP_REASON: state.humanGate, COMMAND: "$env:IA_AGENT_PROVIDER='codex'; npm run ia:build -- IA-CANARY-001; Remove-Item Env:\\IA_AGENT_PROVIDER" }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ IA_AUTOPILOT: "READY", CURRENT_TASK: state.currentTask, NEXT_TASK: state.nextTask }));