import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, unlinkSync, writeFileSync, renameSync } from "node:fs";
import path from "node:path";
import type { FileEdit } from "../agents/codingAgent.ts";
import type { TaskSpec } from "../orchestrator/orchestrator.ts";
import { evaluateRepositoryGuard } from "./repositoryGuard.ts";

const maxBytes = 256 * 1024;
function sha256(content: Buffer): string { return createHash("sha256").update(content).digest("hex"); }
function normalize(filePath: string): string { return filePath.replaceAll("\\", "/"); }
function safePath(root: string, filePath: string): string {
  const normalized = normalize(filePath);
  if (!normalized || path.isAbsolute(normalized) || /^[A-Za-z]:/.test(normalized) || normalized.startsWith("//") || normalized.split("/").includes("..")) throw new Error(`Invalid patch path: ${filePath}`);
  const resolved = path.resolve(root, normalized);
  if (!resolved.toLowerCase().startsWith(`${path.resolve(root).toLowerCase()}${path.sep}`) || normalized === ".git" || normalized.startsWith(".git/")) throw new Error(`Patch path escapes workspace: ${filePath}`);
  if (existsSync(resolved) && lstatSync(resolved).isSymbolicLink()) throw new Error(`Symlink patch target rejected: ${filePath}`);
  return resolved;
}
export interface PatchValidation { status: "PASS" | "FAIL"; edits: FileEdit[]; violations: string[]; }
export function validatePatch(root: string, spec: TaskSpec, edits: unknown): PatchValidation {
  const violations: string[] = [];
  if (!Array.isArray(edits) || edits.length === 0) return { status: "FAIL", edits: [], violations: ["File edit proposal is empty or malformed"] };
  const valid: FileEdit[] = [];
  for (const value of edits) {
    const edit = value as Partial<FileEdit> | null;
    try {
      if (!edit || typeof edit.path !== "string" || !["CREATE", "UPDATE", "DELETE"].includes(edit.operation ?? "")) throw new Error("Malformed file edit");
      const absolute = safePath(root, edit.path);
      const relative = normalize(edit.path);
      const guard = evaluateRepositoryGuard([relative], spec);
      if (guard.status === "FAIL") throw new Error(guard.violations.join("; "));
      if (Buffer.byteLength(edit.content ?? "", "utf8") > maxBytes) throw new Error("Patch content exceeds size limit");
      const exists = existsSync(absolute);
      if (edit.operation === "CREATE" && exists) throw new Error("CREATE target already exists");
      if ((edit.operation === "UPDATE" || edit.operation === "DELETE") && (!exists || edit.beforeSha256 !== sha256(readFileSync(absolute)))) throw new Error("Patch beforeSha256 mismatch");
      if (edit.operation !== "DELETE" && typeof edit.content !== "string") throw new Error("Patch content is required");
      valid.push({ path: relative, operation: edit.operation, beforeSha256: edit.beforeSha256 ?? null, ...(edit.operation !== "DELETE" ? { content: edit.content } : {}) });
    } catch (error) { violations.push(error instanceof Error ? `${edit?.path ?? "unknown"}: ${error.message}` : String(error)); }
  }
  return { status: violations.length === 0 ? "PASS" : "FAIL", edits: violations.length === 0 ? valid : [], violations };
}

export function applyPatchTransaction(root: string, edits: FileEdit[]): { status: "PASS" | "FAIL"; changedFiles: string[]; error?: string } {
  const originals = edits.map((edit) => ({ edit, absolute: safePath(root, edit.path), existed: existsSync(safePath(root, edit.path)), content: existsSync(safePath(root, edit.path)) ? readFileSync(safePath(root, edit.path)) : null }));
  try {
    for (const { edit, absolute } of originals) {
      if (edit.operation === "DELETE") unlinkSync(absolute);
      else { mkdirSync(path.dirname(absolute), { recursive: true }); const temporary = `${absolute}.ia-tmp-${process.pid}`; writeFileSync(temporary, edit.content!, "utf8"); renameSync(temporary, absolute); }
    }
    return { status: "PASS", changedFiles: edits.map((edit) => normalize(edit.path)) };
  } catch (error) {
    for (const original of originals) { if (original.existed) writeFileSync(original.absolute, original.content!); else if (existsSync(original.absolute)) unlinkSync(original.absolute); }
    return { status: "FAIL", changedFiles: [], error: error instanceof Error ? error.message : String(error) };
  }
}