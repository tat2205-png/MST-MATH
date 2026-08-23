import type { FailureEvidence, TaskSpec } from "../orchestrator/orchestrator.ts";
import type { CodingAgentMode } from "./codingAgent.ts";

export function buildAgentInstructions(spec: TaskSpec, evidence: FailureEvidence[], attempt: number, mode: CodingAgentMode): string {
  return [`TASK=${spec.id}`, `MODE=${mode}`, `ATTEMPT=${attempt}`, `GOAL=${spec.goal}`, `WORK ONLY IN: ${spec.allowedPaths.join(", ")}`, `FORBIDDEN: ${spec.forbiddenPaths.join(", ")}`, "Do not weaken, skip, delete, or rewrite tests to obtain PASS.", "Do not change architecture.", "Do not commit, reset, stash, clean, or switch branches.", "Run only necessary commands and return changed files.", `FAILURE_EVIDENCE=${JSON.stringify(evidence)}`].join("\n");
}