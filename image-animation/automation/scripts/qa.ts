import { spawnSync } from "node:child_process";
import process from "node:process";
import { getTrackedChangeSummary, runRepositoryGuard } from "./common.ts";

type GateStatus = "PASS" | "FAIL" | "NOT_AVAILABLE";

function commandGate(name: string, command: string, args: string[]): GateStatus {
  const result = spawnSync(command, args, { stdio: "inherit", shell: true });
  const status: GateStatus = result.error ? "NOT_AVAILABLE" : result.status === 0 ? "PASS" : "FAIL";
  console.log(`${name}=${status}`);
  return status;
}

const guard = runRepositoryGuard();
const changeSummary = getTrackedChangeSummary();
console.log(`IA-G0 REPOSITORY_GUARD=${guard.status}`);
if (guard.violations.length > 0) console.error(guard.violations.join("\n"));

const typeScript = commandGate("IA-G1 TYPESCRIPT_QA", "npm", ["run", "lint"]);
const unit = commandGate("IA-G2 UNIT_QA", "tsx", ["image-animation/tests/repository-guard.test.ts"]);
const regression = commandGate("IA-G9 REGRESSION_QA", "npm", ["run", "ia:regression"]);
const finalStatus = guard.status === "PASS" && typeScript === "PASS" && unit === "PASS" && regression === "PASS" ? "PASS" : "FAIL";
console.log(`IA_FINAL_QA=${finalStatus}`);
console.log(JSON.stringify({
  TASK: "IA-0A.1",
  STATUS: finalStatus,
  FILES_ADDED: changeSummary.added,
  FILES_MODIFIED: changeSummary.modified,
  GATES: {
    "IA-G0": guard.status,
    "IA-G1": typeScript,
    "IA-G2": unit,
    "IA-G9": regression,
  },
  REPAIR_COUNT: 0,
  BLOCKERS: guard.violations,
  FINAL: finalStatus,
}, null, 2));
process.exit(finalStatus === "PASS" ? 0 : 1);