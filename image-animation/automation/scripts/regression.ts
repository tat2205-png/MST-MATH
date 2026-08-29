import { spawnSync } from "node:child_process";
import { runNpm } from "./common.ts";
import process from "node:process";

const result = runNpm(["run", "qa:regression"], true);
if (result.error) {
  console.error(`NOT_AVAILABLE: ${result.error.message}`);
  process.exit(2);
}
process.exit(result.status === 0 ? 0 : 1);