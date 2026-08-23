import type { FailureEvidence, TaskSpec } from "../orchestrator/orchestrator.ts";
import type { CodingAgentMode } from "./codingAgent.ts";

export function buildAgentInstructions(spec: TaskSpec, evidence: FailureEvidence[], attempt: number, mode: CodingAgentMode): string {
  const lines = [`PROJECT=MATH-AI-IMAGE-ANIMATION`, `WORKSPACE=D:\\math-ai-image-animation`, `TASK=${spec.id}`, `MODE=${mode}`, `ATTEMPT=${attempt}`, `GOAL=${spec.goal}`, `WORK ONLY IN: ${spec.allowedPaths.join(", ")}`, `FORBIDDEN: ${spec.forbiddenPaths.join(", ")}`, "ARCHITECTURE_LOCKED=true", "MAX_AUTO_REPAIR=3", "Do not weaken tests, delete regression tests, or change expected outputs merely to force PASS.", "Do not change architecture.", "Do not commit, reset, stash, clean, merge, rebase, or switch branches.", "Deterministic QA is the final authority; agent output cannot declare PASS.", "Run only necessary commands and return a summary of changed files."];
  if (spec.id === "IA-CANARY-001") lines.push("You are completing IA-CANARY-001 in HOST_APPLIED_PATCH mode.", "Do not attempt to edit the filesystem directly.", "Return a structured fileEdits proposal that changes exactly image-animation/fixtures/agent-canary/canary.txt from BEFORE to AFTER.", "Do not merely explain the requested change.", "Do not modify any other file.");
  lines.push(`FAILURE_EVIDENCE=${JSON.stringify(evidence)}`);
  return lines.join("\n");
}