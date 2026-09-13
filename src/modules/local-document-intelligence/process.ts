import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
const run = promisify(execFile);
export interface ProcessResult { stdout: string; stderr: string; }
export type ProcessRunner = (command: string, args: string[], timeoutMs: number) => Promise<ProcessResult>;
export const QWEN_RUNTIME_DEFAULT_TIMEOUT_MS = 120000;
export const QWEN_RUNTIME_MAX_TIMEOUT_MS = 180000;
export function resolveQwenRuntimeTimeout(requested?: number): number { return Number.isFinite(requested) && (requested as number) > 0 ? Math.min(requested as number, QWEN_RUNTIME_MAX_TIMEOUT_MS) : QWEN_RUNTIME_DEFAULT_TIMEOUT_MS; }
export const safeProcessRunner: ProcessRunner = async (command, args, timeoutMs) => { const result = await run(command, args, { timeout: timeoutMs, windowsHide: true, shell: false, maxBuffer: 4 * 1024 * 1024 }); return { stdout: result.stdout, stderr: result.stderr }; };
export async function probe(runner: ProcessRunner, command: string, args = ["--version"]): Promise<{ status: "AVAILABLE" | "UNAVAILABLE"; version?: string; issue?: string }> { try { const r = await runner(command, args, 5000); return { status: "AVAILABLE", version: (r.stdout || r.stderr).trim().split(/\r?\n/)[0].slice(0, 200) }; } catch (error) { return { status: "UNAVAILABLE", issue: error instanceof Error ? error.message : "runtime unavailable" }; } }
export async function jsonBridge(runner: ProcessRunner, command: string, args: string[], request: unknown, timeoutMs: number): Promise<unknown> { const qwenRuntime = command === process.execPath && args.some((arg) => arg.includes("qwen3vl")); const effectiveTimeoutMs = qwenRuntime ? resolveQwenRuntimeTimeout(timeoutMs) : timeoutMs; const bridgeRequest = qwenRuntime && typeof request === "object" && request !== null ? { ...(request as Record<string, unknown>), timeoutMs: effectiveTimeoutMs } : request; const r = await runner(command, [...args, JSON.stringify(bridgeRequest)], effectiveTimeoutMs); if (r.stdout.length > 4 * 1024 * 1024) throw new Error("provider output exceeds limit"); try { return JSON.parse(r.stdout); } catch { throw new Error("provider returned malformed JSON"); } }

export function certifiedPython(): string | undefined {
  const configured = process.env.PIMATH_DOCUMENT_PYTHON;
  const candidates = [configured, "D:\\PiMathRuntime\\local-document-intelligence\\python-v1\\Scripts\\python.exe", resolve(process.cwd(), "..\\PiMathRuntime\\local-document-intelligence\\python-v1\\Scripts\\python.exe")].filter(Boolean) as string[];
  return candidates.find((p) => existsSync(p));
}
export function certifiedBridge(name: string): string { return resolve(process.env.PIMATH_RUNTIME_BRIDGE_ROOT ?? resolve(process.cwd(), "tools\\pimath-local-runtime"), name); }
