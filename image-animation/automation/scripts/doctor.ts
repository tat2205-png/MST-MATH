import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { discoverProviders } from "../agents/providerDiscovery.ts";
import { parseGitPorcelain } from "../gates/gitStatusParser.ts";

const root = process.cwd();
const scripts = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).scripts as Record<string, string>;
const requiredScripts = ["ia:status", "ia:qa", "ia:regression", "ia:auto", "ia:agent-status", "ia:build", "ia:doctor", "ia:resume", "ia:task-test"];
const requiredFiles = [
  "image-animation/AGENTS.md", "image-animation/automation/specs/task-spec.schema.json", "image-animation/automation/gates/repositoryGuard.ts",
  "image-animation/automation/gates/gitStatusParser.ts", "image-animation/automation/orchestrator/orchestrator.ts", "image-animation/automation/orchestrator/repairExecutor.ts",
  "image-animation/automation/agents/codingAgent.ts", "image-animation/automation/agents/taskSandbox.ts", "image-animation/automation/agents/codexAgent.ts",
  "image-animation/automation/schemas/coding-agent-result.schema.json", "image-animation/automation/scripts/build.ts", "image-animation/automation/scripts/canary.ts",
  "image-animation/automation/specs/IA-CANARY-001.json", "image-animation/fixtures/agent-canary/canary.txt",
];
const checks: Record<string, string> = {};
checks.workspace = path.resolve(root).toLowerCase() === path.resolve("D:\\math-ai-image-animation").toLowerCase() ? "PASS" : "FAIL";
checks.branch = execFileSync("git", ["branch", "--show-current"], { cwd: root, encoding: "utf8" }).trim() === "feature/image-animation-foundation" ? "PASS" : "FAIL";
checks.taskSpecs = existsSync(path.join(root, "image-animation/automation/specs/IA-0A.5.json")) ? "PASS" : "FAIL";
checks.packageScripts = requiredScripts.every((script) => typeof scripts[script] === "string") ? "PASS" : "FAIL";
checks.automationFiles = requiredFiles.every((file) => existsSync(path.join(root, file))) ? "PASS" : "FAIL";
checks.gitParser = parseGitPorcelain(" M image-animation/a.ts\n?? image-animation/b.ts")[0].path === "image-animation/a.ts" ? "PASS" : "FAIL";
checks.providerDiscovery = discoverProviders(["codex"])[0].status === "AVAILABLE" ? "PASS" : "NOT_AVAILABLE";
checks.canary = readFileSync(path.join(root, "image-animation/fixtures/agent-canary/canary.txt"), "utf8").trim() === "AFTER" ? "PASS" : "BLOCKED";
checks.hostPatchMode = existsSync(path.join(root, "image-animation/automation/gates/patchTransaction.ts")) ? "PASS" : "FAIL";
const resumeSource = readFileSync(path.join(root, "image-animation/automation/scripts/resume.ts"), "utf8");
checks.autopilotRuntime = resumeSource.includes("while (true)") && resumeSource.includes("LOCKED_ROADMAP") && resumeSource.includes("AUTO_REPAIR_EXHAUSTED") && !resumeSource.includes("shell: true") ? "PASS" : "FAIL";
const status = Object.values(checks).every((value) => value === "PASS") ? "PASS" : "FAIL";
console.log(JSON.stringify({ IA_DOCTOR: status, checks, provider: discoverProviders(["codex"])[0] }, null, 2));
process.exit(status === "PASS" ? 0 : 1);
