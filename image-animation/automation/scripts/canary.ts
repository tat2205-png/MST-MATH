import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { CodexCodingAgentAdapter } from "../agents/codexAgent.ts";
import { TaskExecutionSandbox } from "../agents/taskSandbox.ts";
import { loadTaskSpec } from "../orchestrator/orchestrator.ts";
import { discoverProviders } from "../agents/providerDiscovery.ts";

const root = process.cwd();
const canaryPath = path.join(root, "image-animation", "fixtures", "agent-canary", "canary.txt");
const spec = loadTaskSpec(root, "IA-CANARY-001");
const provider = discoverProviders(["codex"])[0];
if (provider.status !== "AVAILABLE") { console.log("REAL_AGENT_CANARY=NOT_AVAILABLE"); process.exit(2); }
writeFileSync(canaryPath, "BEFORE\n", "utf8");
try {
  const sandbox = new TaskExecutionSandbox(root, spec.expectedBranch, spec);
  const evidence = await sandbox.executeAsync(new CodexCodingAgentAdapter(), spec.id, 1, [], "IMPLEMENT");
  const content = readFileSync(canaryPath, "utf8").trim();
  const passed = content === "AFTER" && evidence.blockers.length === 0 && evidence.repositoryGuard.status === "PASS" && evidence.before.head === evidence.after.head && evidence.before.branch === evidence.after.branch;
  console.log(JSON.stringify({ REAL_AGENT_CANARY: passed ? "PASS" : "FAIL", agentStatus: evidence.result.status, exitCode: evidence.result.exitCode, stdoutSummary: evidence.result.stdoutSummary, stderrSummary: evidence.result.stderrSummary, changedFiles: evidence.after.changedFiles.filter((file) => file === "image-animation/fixtures/agent-canary/canary.txt"), repositoryGuard: evidence.repositoryGuard.status, blockers: evidence.blockers }, null, 2));
  process.exitCode = passed ? 0 : 1;
} finally {
  writeFileSync(canaryPath, "BEFORE\n", "utf8");
}