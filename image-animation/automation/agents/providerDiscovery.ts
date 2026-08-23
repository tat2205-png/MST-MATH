import { execFileSync } from "node:child_process";

export interface ProviderAvailability { provider: string; command: string; status: "AVAILABLE" | "NOT_AVAILABLE"; }
export function discoverProviders(commands: string[] = ["codex", "claude", "openclaw"]): ProviderAvailability[] {
  return commands.map((command) => {
    try { execFileSync(process.platform === "win32" ? "where.exe" : "which", [command], { stdio: "ignore" }); return { provider: command, command, status: "AVAILABLE" }; }
    catch { return { provider: command, command, status: "NOT_AVAILABLE" }; }
  });
}