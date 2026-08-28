import { execFileSync } from "node:child_process";
import { readTaskSpec, root, runRepositoryGuard } from "./common.ts";

const spec = readTaskSpec();
const branch = execFileSync("git", ["branch", "--show-current"], { cwd: root, encoding: "utf8" }).trim();
const worktreeStatus = execFileSync("git", ["status", "--short"], { cwd: root, encoding: "utf8" }).trim() || "clean";
const guard = runRepositoryGuard();

console.log("PROJECT=MATH-AI-IMAGE-ANIMATION");
console.log("BASELINE=IA-V1.0");
console.log(`CURRENT_BRANCH=${branch}`);
console.log(`WORKTREE_STATUS=${worktreeStatus.replace(/\r?\n/g, "; ")}`);
console.log(`AUTOMATION_FOUNDATION=${guard.status === "PASS" ? "AVAILABLE" : "BLOCKED"}`);
console.log("UNIMPLEMENTED_COMPONENTS=NOT_IMPLEMENTED");