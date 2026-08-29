import type { CodingAgent } from "./codingAgent.ts";
import { CodexCodingAgentAdapter } from "./codexAgent.ts";
import { FakeCodingAgent } from "./codingAgent.ts";

export type AgentProvider = "none" | "fake" | "codex";
export function selectAgent(provider: AgentProvider = (process.env.IA_AGENT_PROVIDER as AgentProvider | undefined) ?? "none"): CodingAgent | null {
  if (provider === "none") return null;
  if (provider === "fake") return new FakeCodingAgent({ status: "NOT_AVAILABLE", provider: "fake", exitCode: null, changedFiles: [], stdoutSummary: "Fake provider requires explicit test injection", stderrSummary: "", startedAt: new Date().toISOString(), finishedAt: new Date().toISOString() });
  if (provider === "codex") return new CodexCodingAgentAdapter();
  throw new Error(`Unsupported agent provider: ${provider}`);
}