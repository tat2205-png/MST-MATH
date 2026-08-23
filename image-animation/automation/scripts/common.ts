import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { readFileSync } from "node:fs";
import process from "node:process";
import { evaluateRepositoryGuard, type RepositoryGuardResult } from "../gates/repositoryGuard.ts";
import { parseGitPorcelain } from "../gates/gitStatusParser.ts";

export const root = process.cwd();
export function runNpm(args: string[], inherit = false) {
  const npmCli = path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
  return spawnSync(process.execPath, [npmCli, ...args], { cwd: root, stdio: inherit ? "inherit" : "pipe", encoding: "utf8", shell: false });
}

export function readTaskSpec() {
  return JSON.parse(readFileSync(path.join(root, "image-animation/automation/specs/IA-0A.1.json"), "utf8"));
}

export function getChangedFiles(): string[] {
  const output = execFileSync("git", ["status", "--short", "--untracked-files=all"], { cwd: root, encoding: "utf8" });
  return parseGitPorcelain(output).map((entry) => entry.path).filter((filePath) => filePath !== "ia-canary-output.txt");
}

export function runRepositoryGuard(): RepositoryGuardResult {
  const spec = readTaskSpec();
  return evaluateRepositoryGuard(getChangedFiles(), spec);
}

export function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

export function getTrackedChangeSummary(): { added: string[]; modified: string[] } {
  const output = execFileSync("git", ["status", "--short", "--untracked-files=all"], { cwd: root, encoding: "utf8" });
  const entries = parseGitPorcelain(output).map((entry) => ({ code: entry.code, filePath: entry.path })).filter((entry) => entry.filePath !== "ia-canary-output.txt");
  return {
    added: entries.filter((entry) => entry.code === "??" || entry.code.includes("A")).map((entry) => entry.filePath),
    modified: entries.filter((entry) => entry.code !== "??" && !entry.code.includes("A")).map((entry) => entry.filePath),
  };
}