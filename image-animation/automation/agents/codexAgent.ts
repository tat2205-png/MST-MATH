import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import type { CodingAgent, CodingAgentRequest, CodingAgentResult, FileEdit } from "./codingAgent.ts";
import { redactSensitive } from "./redaction.ts";

export const APPROVED_WORKSPACE = "D:\\math-ai-image-animation";
export const CODEX_EXECUTABLE = "C:\\Users\\tat22\\AppData\\Local\\Programs\\OpenAI\\Codex\\bin\\codex.exe";
const forbiddenFlags = ["--dangerously-bypass-approvals-and-sandbox", "--dangerously-bypass-hook-trust", "--add-dir", "--skip-git-repo-check", "--ignore-rules", "danger-full-access"];

export interface CodexAdapterOptions { executable?: string; timeoutMs?: number; automationRoot?: string; }
export function validateCodexArgs(args: string[]): void {
  if (args.some((arg) => forbiddenFlags.some((flag) => arg === flag || arg.includes(flag)))) throw new Error("Unsafe Codex option rejected");
}

export function buildCodexArgs(workspace = APPROVED_WORKSPACE, schemaPath: string, outputPath: string, mutationMode: "DIRECT_WRITE" | "HOST_APPLIED_PATCH" = "DIRECT_WRITE"): string[] {
  if (path.resolve(workspace).toLowerCase() !== path.resolve(APPROVED_WORKSPACE).toLowerCase()) throw new Error("Codex workspace is not the approved project root");
  const controlledRoot = path.resolve(APPROVED_WORKSPACE, "image-animation", "automation", "temp").toLowerCase();
  for (const filePath of [schemaPath, outputPath]) if (!path.resolve(filePath).toLowerCase().startsWith(`${controlledRoot}${path.sep}`)) throw new Error("Codex output path is outside the controlled automation area");
  const args = ["exec", "-C", APPROVED_WORKSPACE, "-s", mutationMode === "HOST_APPLIED_PATCH" ? "read-only" : "workspace-write", ...(mutationMode === "DIRECT_WRITE" ? ["--approve-for-me"] : []), "--ephemeral", "--ignore-user-config", "--color", "never", "--json", "--output-schema", schemaPath, "-o", outputPath, "-"];
  validateCodexArgs(args);
  return args;
}

export class CodexCodingAgentAdapter implements CodingAgent {
  private readonly executable: string;
  private readonly timeoutMs: number;
  private readonly automationRoot: string;
  public lastInvocation: { executable: string; args: string[]; shell: false; stdin: true } | null = null;

  constructor(options: CodexAdapterOptions = {}) {
    this.executable = options.executable ?? CODEX_EXECUTABLE;
    this.timeoutMs = options.timeoutMs ?? 120000;
    this.automationRoot = options.automationRoot ?? path.join(APPROVED_WORKSPACE, "image-animation", "automation", "temp");
  }

  execute(request: CodingAgentRequest): CodingAgentResult {
    return this.result("NOT_AVAILABLE", null, "Use executeAsync for real Codex execution", new Date().toISOString());
  }

  async executeAsync(request: CodingAgentRequest): Promise<CodingAgentResult> {
    const startedAt = new Date().toISOString();
    if (path.resolve(request.workspace).toLowerCase() !== path.resolve(APPROVED_WORKSPACE).toLowerCase()) return this.result("FAIL", null, "Workspace is not the approved project root", startedAt);
    if (!existsSync(this.executable)) return this.result("NOT_AVAILABLE", null, "Codex executable not available", startedAt);
    mkdirSync(this.automationRoot, { recursive: true });
    const schemaPath = path.join(this.automationRoot, `${request.taskId}-result.schema.json`);
    copyFileSync(path.join(APPROVED_WORKSPACE, "image-animation", "automation", "schemas", "coding-agent-result.schema.json"), schemaPath);
    const outputPath = path.join(this.automationRoot, `${request.taskId}-${request.attempt}-last-message.txt`);
    const mutationMode = request.mutationMode === "DIRECT_WRITE" ? "DIRECT_WRITE" : "HOST_APPLIED_PATCH";
    const args = buildCodexArgs(request.workspace, schemaPath, outputPath, mutationMode);
    this.lastInvocation = { executable: this.executable, args, shell: false, stdin: true };
    const child = spawn(this.executable, args, { cwd: APPROVED_WORKSPACE, shell: false, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk: Buffer) => { stdout = `${stdout}${chunk.toString()}`.slice(-10000); });
    child.stderr?.on("data", (chunk: Buffer) => { stderr = `${stderr}${chunk.toString()}`.slice(-10000); });
    child.stdin?.end(request.instructions);
    return await new Promise((resolve) => {
      let timedOut = false;
      const timeout = setTimeout(() => { timedOut = true; child.kill(); }, this.timeoutMs);
      child.on("close", (code) => {
        clearTimeout(timeout);
        const rawLastMessage = existsSync(outputPath) ? readFileSync(outputPath, "utf8") : "";
        const lastMessage = rawLastMessage ? redactSensitive(rawLastMessage).slice(-4000) : "LAST_MESSAGE_MISSING";
        let fileEdits: FileEdit[] | undefined;
        try { const parsed = JSON.parse(rawLastMessage) as { fileEdits?: FileEdit[] }; fileEdits = Array.isArray(parsed.fileEdits) ? parsed.fileEdits : undefined; } catch { fileEdits = undefined; }
        const durationMs = Date.parse(new Date().toISOString()) - Date.parse(startedAt);
        for (const filePath of [schemaPath, outputPath]) if (existsSync(filePath)) unlinkSync(filePath);
        resolve({ ...this.result(timedOut ? "TIMEOUT" : code === 0 ? "COMPLETED" : "FAIL", timedOut ? null : code, redactSensitive(stdout).slice(-2000), startedAt, timedOut ? "AGENT_TIMEOUT" : redactSensitive(stderr).slice(-2000)), fileEdits, executionEvidence: { taskId: request.taskId, provider: "codex", executionStatus: timedOut ? "TIMEOUT" : code === 0 ? "COMPLETED" : "FAILED", exitCode: timedOut ? null : code, finishedAt: new Date().toISOString(), durationMs, workspace: APPROVED_WORKSPACE, sandboxMode: mutationMode === "HOST_APPLIED_PATCH" ? "read-only" : "workspace-write", argumentSummary: args, stdinBytes: Buffer.byteLength(request.instructions), stdoutSummary: redactSensitive(stdout).slice(-2000), stderrSummary: timedOut ? "AGENT_TIMEOUT" : redactSensitive(stderr).slice(-2000), lastMessage, claimedChangedFiles: [], actualAgentDelta: [], jsonlEvents: redactSensitive(stdout).split(/\r?\n/).filter(Boolean).slice(-20) } });
      });
      child.on("error", (error) => { clearTimeout(timeout); for (const filePath of [schemaPath, outputPath]) if (existsSync(filePath)) unlinkSync(filePath); resolve(this.result("NOT_AVAILABLE", null, "", startedAt, redactSensitive(error.message))); });
    });
  }

  private result(status: CodingAgentResult["status"], exitCode: number | null, stdoutSummary: string, startedAt: string, stderrSummary = ""): CodingAgentResult {
    return { status, provider: "codex", exitCode, changedFiles: [], stdoutSummary, stderrSummary, startedAt, finishedAt: new Date().toISOString() };
  }
}