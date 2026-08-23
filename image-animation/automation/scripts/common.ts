import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { evaluateRepositoryGuard, type RepositoryGuardResult } from "../gates/repositoryGuard.ts";

export const root = process.cwd();

export function readTaskSpec() {
  return JSON.parse(readFileSync(path.join(root, "image-animation/automation/specs/IA-0A.1.json"), "utf8"));
}

export function getChangedFiles(): string[] {
  const output = execFileSync("git", ["status", "--short", "--untracked-files=all"], { cwd: root, encoding: "utf8" });
  return output.split(/\r?\n/).filter(Boolean).map((line) => {
    const value = line.slice(3).trim();
    if (value.includes(" -> ")) return value.split(" -> ").at(-1)!;
    return value;
  });
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
  const entries = output.split(/\r?\n/).filter(Boolean).map((line) => ({
    code: line.slice(0, 2),
    filePath: line.slice(3).trim().split(" -> ").at(-1)!,
  }));
  return {
    added: entries.filter((entry) => entry.code === "??" || entry.code.includes("A")).map((entry) => entry.filePath),
    modified: entries.filter((entry) => entry.code !== "??" && !entry.code.includes("A")).map((entry) => entry.filePath),
  };
}