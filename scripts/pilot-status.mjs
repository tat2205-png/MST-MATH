import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const evidencePath = path.join(root, "render_output", "pilot-evidence", "latest.json");

function git(args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", shell: false });
  if (result.status !== 0) return "UNKNOWN";
  return (result.stdout ?? "").trim();
}

const branch = git(["branch", "--show-current"]);
const head = git(["rev-parse", "HEAD"]);
const worktree = git(["status", "--porcelain"]);
let machine = null;
if (fs.existsSync(evidencePath)) {
  try {
    machine = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
  } catch {
    machine = null;
  }
}

const g1 = branch === "pilot/mst-math-internal-demo-v1" && worktree !== "UNKNOWN" && worktree.trim() === "" ? "PASS" : "BLOCK";
const g2 = machine?.finalStatus === "PASS" && machine?.head === head ? "PASS" : machine ? "STALE_OR_BLOCK" : "PENDING";
const g3 = "PENDING_REAL_GOLDEN_E2E";
const g4 = "PENDING_HUMAN_APPROVAL";

console.log("");
console.log("MST-MATH INTERNAL DEMO PILOT V1");
console.log("================================");
console.log(`BRANCH .......... ${branch}`);
console.log(`HEAD ............ ${head}`);
console.log(`WORKTREE ........ ${worktree === "" ? "CLEAN" : worktree === "UNKNOWN" ? "UNKNOWN" : "DIRTY"}`);
console.log("");
console.log(`G1 BASELINE ..... ${g1}`);
console.log(`G2 MACHINE ...... ${g2}`);
console.log(`G3 REAL E2E ..... ${g3}`);
console.log(`G4 HUMAN ........ ${g4}`);
console.log("");
if (machine) {
  console.log(`LAST_MACHINE_SHA  ${machine.head ?? "UNKNOWN"}`);
  console.log(`LAST_MACHINE_RUN  ${machine.runId ?? "UNKNOWN"}`);
  console.log(`LAST_MACHINE      ${machine.finalStatus ?? "UNKNOWN"}`);
  if (machine.blocker) console.log(`BLOCKER ......... ${machine.blocker}`);
}
console.log("");
console.log("INTERNAL_DEMO_GO = only when G1/G2/G3/G4 are all PASS and P0=P1=0");
console.log("");

if (g1 !== "PASS" || g2 !== "PASS") process.exitCode = 1;
