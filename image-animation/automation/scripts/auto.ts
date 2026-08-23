import { execFileSync, spawnSync } from "node:child_process";
import process from "node:process";
import { getChangedFiles, root } from "./common.ts";
import { runOrchestrator, writeReport, type GateStatus } from "../orchestrator/orchestrator.ts";

const taskId = process.argv[2];
const dryRun = process.argv.includes("--dry-run");
if (!taskId) {
  console.error("Usage: npm run ia:auto -- <TASK_ID> [--dry-run]");
  process.exit(2);
}

const branch = execFileSync("git", ["branch", "--show-current"], { cwd: root, encoding: "utf8" }).trim();
const gates: Record<string, GateStatus> = {};
const runGates = () => {
  const result = spawnSync("npm", ["run", "ia:qa"], { cwd: root, stdio: "inherit", shell: true });
  const status: GateStatus = result.error ? "NOT_AVAILABLE" : result.status === 0 ? "PASS" : "FAIL";
  gates["IA-G1"] = status;
  gates["IA-G2"] = status;
  gates["IA-G9"] = status;
  return gates;
};

let report;
try {
  report = runOrchestrator({ root, taskId, branch, changedFiles: getChangedFiles(), dryRun, runGates });
  if (!dryRun) writeReport(root, report);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
console.log(JSON.stringify(report, null, 2));
process.exit(report.FINAL === "PASS" ? 0 : 1);