import { spawnSync } from "node:child_process";
import process from "node:process";

const result = spawnSync("npm", ["run", "qa:regression"], { stdio: "inherit", shell: true });
if (result.error) {
  console.error(`NOT_AVAILABLE: ${result.error.message}`);
  process.exit(2);
}
process.exit(result.status === 0 ? 0 : 1);