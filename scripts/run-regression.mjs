import { spawnSync } from "node:child_process";
import process from "node:process";

const suites = [
  "tests/math-regression.ts",
  "tests/test-graph-engine.ts",
  "tests/test-skill-engine.ts",
  "tests/test-skill-integration.ts",
  "tests/test-step5-ui-skills.ts",
  "tests/test-step6b-local-bridge.ts",
  "tests/test-step6c-smoke-test.ts",
  "tests/test-step6d-frame-input.ts",
  "tests/test-step8a-master-canvas.ts",
  "tests/test-step8b-source-aware-invariants.ts",
];

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
let failed = 0;

for (const suite of suites) {
  console.log(`\n============================================================`);
  console.log(` REGRESSION: ${suite}`);
  console.log(`============================================================`);

  const result = spawnSync(npx, ["tsx", suite], {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: false,
    env: process.env,
  });

  if (result.error) {
    console.error(`FAILED TO START: ${result.error.message}`);
    failed += 1;
    continue;
  }

  if (result.status !== 0) {
    console.error(`FAILED: ${suite} (exit ${result.status})`);
    failed += 1;
  } else {
    console.log(`PASS: ${suite}`);
  }
}

console.log(`\n============================================================`);
console.log(` REGRESSION SUMMARY: ${suites.length - failed}/${suites.length} suites passed`);
console.log(`============================================================`);

process.exit(failed === 0 ? 0 : 1);
