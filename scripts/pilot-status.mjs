import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const evidenceRoot = path.join(root, "render_output", "pilot-evidence");

function git(command) {
  try {
    return execSync(command, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "UNKNOWN";
  }
}

const current = {
  branch: git("git branch --show-current"),
  sha: git("git rev-parse HEAD"),
  worktree: git("git status --porcelain") === "" ? "CLEAN" : "DIRTY",
};

let latest = null;
const latestPath = path.join(evidenceRoot, "latest.json");
if (fs.existsSync(latestPath)) {
  try {
    latest = JSON.parse(fs.readFileSync(latestPath, "utf8"));
  } catch {
    latest = null;
  }
}

const sameSha = latest?.sha === current.sha;
const machine = sameSha ? latest?.gate2 ?? "UNKNOWN" : "NOT_CERTIFIED_FOR_CURRENT_SHA";
const g1 = sameSha ? latest?.gate1 ?? "PROVISIONAL_PENDING_MAC_CONVERGENCE" : "PROVISIONAL_PENDING_MAC_CONVERGENCE";
const g3 = sameSha ? latest?.gate3 ?? "PENDING" : "PENDING";
const g4 = sameSha ? latest?.gate4 ?? "PENDING" : "PENDING";
const overall = g1 === "PASS" && machine === "PASS" && g3 === "PASS" && g4 === "PASS" ? "INTERNAL_PILOT_GO" : "NOT_READY";

console.log("");
console.log("MST-MATH INTERNAL PILOT V1");
console.log("==========================");
console.log(`CURRENT_BRANCH .... ${current.branch}`);
console.log(`CURRENT_SHA ....... ${current.sha}`);
console.log(`WORKTREE .......... ${current.worktree}`);
console.log(`G1 BASELINE ....... ${g1}`);
console.log(`G2 MACHINE ........ ${machine}`);
console.log(`G3 REAL E2E ....... ${g3}`);
console.log(`G4 HUMAN .......... ${g4}`);
console.log(`PILOT_STATUS ...... ${overall}`);
if (latest) {
  console.log(`LAST_EVIDENCE ..... ${latest.runDir}`);
  if (!sameSha) console.log("EVIDENCE_NOTE ..... latest machine evidence belongs to a different SHA");
} else {
  console.log("LAST_EVIDENCE ..... NONE");
}
console.log("");
