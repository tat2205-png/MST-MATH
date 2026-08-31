#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const repo = resolve(process.cwd());
const evidenceDir = join(repo, "agency/evidence/runtime-canary");
const schemaPath = join(repo, "agency/runtime/role-output.schema.json");
const agentsDir = process.env.CODEX_AGENTS_DIR || join(process.env.HOME || "", ".codex/agents");
mkdirSync(evidenceDir, { recursive: true });

const sources = [
  "docs/project/PROJECT_MASTER_MAP.md",
  "project-state/PIMATH-PROJECT-STATE.json"
];

const steps = [
  {
    taskId: "CANARY-TASK-01",
    invocationId: "canary-product-manager-01",
    role: "Product Manager",
    slug: "product-manager",
    output: "product-manager.json",
    nextOwner: "Multi-Agent Systems Architect",
    instruction: "Extract only the currently authorized GAME_SYSTEM, GAME-01 name, and reference status from the two authoritative sources. Do not propose or implement game details."
  },
  {
    taskId: "CANARY-TASK-02",
    invocationId: "canary-architecture-review-01",
    role: "Multi-Agent Systems Architect",
    slug: "multi-agent-systems-architect",
    output: "architecture-review.json",
    nextOwner: "Test Automation Engineer",
    inputs: ["product-manager.json"],
    instruction: "Independently review whether the recorded multi-game architecture permits future templates without duplicating or changing the Question Bank. Treat Product Manager output as evidence, not as your own work."
  },
  {
    taskId: "CANARY-TASK-03",
    invocationId: "canary-test-automation-01",
    role: "Test Automation Engineer",
    slug: "test-automation-engineer",
    output: "test-automation.json",
    nextOwner: "Evidence Collector",
    inputs: ["product-manager.json", "architecture-review.json"],
    instruction: "Verify artifact schema, exact role identities, distinct invocation IDs, separate output paths, and consistency with the authoritative sources. Do not alter earlier artifacts."
  },
  {
    taskId: "CANARY-TASK-04",
    invocationId: "canary-evidence-collector-01",
    role: "Evidence Collector",
    slug: "evidence-collector",
    output: "evidence-index.json",
    nextOwner: "Reality Checker",
    inputs: ["product-manager.json", "architecture-review.json", "test-automation.json"],
    instruction: "Collect only actual canary evidence and identify its paths. Do not modify implementation or certify release readiness."
  },
  {
    taskId: "CANARY-TASK-05",
    invocationId: "canary-reality-checker-01",
    role: "Reality Checker",
    slug: "reality-checker",
    output: "reality-check.json",
    nextOwner: "Human Release Approver",
    inputs: ["product-manager.json", "architecture-review.json", "test-automation.json", "evidence-index.json"],
    instruction: "Independently decide whether evidence proves separate role invocations, separate lead/reviewer artifacts, evidence collection, no self-certification, and no silent fallback. You may return BLOCK. Do not modify earlier outputs or implementation."
  }
];

function failClosed(taskId, role, reason, filename) {
  const result = {
    schema: "MWS_AGENCY_ROLE_OUTPUT/1.0",
    invocation_id: `fail-closed-${taskId.toLowerCase()}`,
    task_id: taskId,
    role_name: role,
    role_source: "UNAVAILABLE",
    status: "BLOCK",
    findings: [reason, "No generic fallback was invoked."],
    evidence_refs: [],
    checks_performed: ["Required role path resolution"],
    unresolved_risks: ["Required role unavailable"],
    next_owner: "Human Release Approver",
    gate_status: "BLOCK"
  };
  writeFileSync(join(evidenceDir, filename), `${JSON.stringify(result, null, 2)}\n`, { flag: "wx" });
}

if (process.argv.includes("--negative")) {
  const invalid = join(agentsDir, "required-reviewer-intentionally-unavailable.toml");
  if (existsSync(invalid)) throw new Error("Negative fixture unexpectedly resolved to a real role");
  failClosed("CANARY-NEGATIVE-01", "Required Reviewer (intentionally unavailable)", "Required reviewer role definition was not found.", "negative-fallback.json");
  process.exit(0);
}

for (const step of steps) {
  const rolePath = join(agentsDir, `${step.slug}.toml`);
  const outputPath = join(evidenceDir, step.output);
  const eventPath = join(evidenceDir, step.output.replace(/\.json$/, ".events.jsonl"));
  if (!existsSync(rolePath)) {
    failClosed(step.taskId, step.role, `Required official role missing at ${rolePath}`, step.output);
    process.exit(2);
  }
  if (existsSync(outputPath) || existsSync(eventPath)) throw new Error(`Refusing to overwrite canary artifact for ${step.role}`);
  const inputPaths = (step.inputs || []).map((name) => `agency/evidence/runtime-canary/${name}`);
  for (const input of inputPaths) {
    if (!existsSync(join(repo, input))) throw new Error(`Required prior evidence missing: ${input}`);
  }
  const prompt = [
    `Invocation identity: ${step.invocationId}`,
    `You are the official Agency role: ${step.role}.`,
    `Read and follow the installed role definition at ${rolePath}.`,
    `Task ID: ${step.taskId}.`,
    step.instruction,
    `Authoritative sources: ${sources.join(", ")}.`,
    inputPaths.length ? `Prior evidence inputs: ${inputPaths.join(", ")}.` : "Prior evidence inputs: none.",
    `Your role_source must be ${rolePath}.`,
    `Your role_name must be ${step.role}.`,
    `Your invocation_id must be ${step.invocationId}.`,
    `Your next_owner must be ${step.nextOwner}.`,
    "Work read-only. Return only the structured JSON required by the provided output schema. Do not expose hidden chain-of-thought; provide concise checks and evidence references."
  ].join("\n");
  const run = spawnSync("codex", [
    "exec", "--ephemeral", "--sandbox", "read-only", "--json",
    "--output-schema", schemaPath,
    "--output-last-message", outputPath,
    "--cd", repo,
    prompt
  ], { encoding: "utf8", env: process.env });
  if (run.status !== 0) {
    writeFileSync(eventPath.replace(/\.events\.jsonl$/, ".failed.events.jsonl"), run.stdout || "", { flag: "wx" });
    process.stderr.write(run.stderr || `Codex invocation failed for ${step.role}\n`);
    process.exit(run.status || 3);
  }
  writeFileSync(eventPath, run.stdout || "", { flag: "wx" });
  const parsed = JSON.parse(readFileSync(outputPath, "utf8"));
  if (parsed.role_name !== step.role || parsed.invocation_id !== step.invocationId || parsed.role_source !== rolePath) {
    throw new Error(`Role identity validation failed for ${step.role}`);
  }
}
