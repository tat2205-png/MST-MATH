import fs from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const controlPath = path.join(root, "PROJECT_CONTROL.md");

function runGit(command) {
  try {
    return execSync(command, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "UNKNOWN";
  }
}

function extractSection(content, heading, nextHeadingPattern) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `##\\s+${escaped}\\s*\\r?\\n+([\\s\\S]*?)(?=\\r?\\n${nextHeadingPattern}|$)`,
    "i"
  );

  return content.match(regex)?.[1]?.trim() ?? "UNKNOWN";
}

const branch = runGit("git branch --show-current");
const head = runGit("git rev-parse --short HEAD");
const status = runGit("git status --porcelain");

const worktree =
  status === "UNKNOWN"
    ? "UNKNOWN"
    : status.length === 0
      ? "CLEAN"
      : "DIRTY";

console.log("");
console.log("╔════════════════════════════════════════════════════╗");
console.log("║             MATH AI STUDIO CONTROL               ║");
console.log("╠════════════════════════════════════════════════════╣");
console.log(`  Repository : ${path.basename(root)}`);
console.log(`  Branch     : ${branch || "UNKNOWN"}`);
console.log(`  HEAD       : ${head}`);
console.log(`  Worktree   : ${worktree}`);

if (!fs.existsSync(controlPath)) {
  console.log("╠════════════════════════════════════════════════════╣");
  console.log("  PROJECT_CONTROL.md : NOT FOUND");
  console.log("╚════════════════════════════════════════════════════╝");
  process.exitCode = 1;
} else {
  const content = fs.readFileSync(controlPath, "utf8");

  const now = extractSection(
    content,
    "▶ NOW",
    "##\\s+⏭\\s+NEXT|---|#\\s+"
  );

  const next = extractSection(
    content,
    "⏭ NEXT",
    "---|#\\s+"
  );

  const currentModule =
    content.match(/^CURRENT_MODULE=(.*)$/m)?.[1]?.trim() ?? "UNKNOWN";

  const currentTask =
    content.match(/^CURRENT_TASK=(.*)$/m)?.[1]?.trim() ?? "UNKNOWN";

  const taskStatus =
    content.match(/^TASK_STATUS=(.*)$/m)?.[1]?.trim() ?? "UNKNOWN";

  const blockers =
    content.match(/^BLOCKERS=(.*)$/m)?.[1]?.trim() ?? "UNKNOWN";

  console.log("╠════════════════════════════════════════════════════╣");
  console.log(`  NOW        : ${now}`);
  console.log(`  NEXT       : ${next}`);
  console.log("╠════════════════════════════════════════════════════╣");
  console.log(`  Module     : ${currentModule}`);
  console.log(`  Task       : ${currentTask}`);
  console.log(`  Status     : ${taskStatus}`);
  console.log(`  Blockers   : ${blockers}`);
  console.log("╚════════════════════════════════════════════════════╝");
}

console.log("");
