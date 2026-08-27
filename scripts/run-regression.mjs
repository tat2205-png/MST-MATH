import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";

const require = createRequire(import.meta.url);
const tsxCli = require.resolve("tsx/cli");

const suites = [
  "tests/math-regression.ts",
  "tests/test-graph-engine.ts",
  "tests/test-skill-engine.ts",
  "tests/test-skill-integration.ts",
  "tests/test-step5-ui-skills.ts",
  "tests/test-step6b-local-bridge.ts",
  "tests/test-step6c-smoke-test.ts",
  "tests/test-step6d-frame-input.ts",
  "tests/test-step6e-auto-repair.ts",
  "tests/test-step8a-master-canvas.ts",
  "tests/test-step8b-source-aware-invariants.ts",
  "tests/test-production-ui-workflow.ts",
  "tests/test-luadraw-contract.ts",
  "tests/test-studio-orchestrator.ts",
  "tests/test-question-bank-qb1a.ts",
  "tests/test-question-bank-qb1b.ts",
  "tests/test-question-bank-qb1c.ts",
  "tests/test-question-bank-pipeline.ts",
  "tests/test-question-bank-qb1d.ts",
  "tests/test-question-bank-qb1e.ts",
  "tests/test-question-bank-qb1f.ts",
  "tests/test-question-bank-qb2a.ts",
];

let failed = 0;

for (const suite of suites) {
  console.log(`\n============================================================`);
  console.log(` REGRESSION: ${suite}`);
  console.log(`============================================================`);

  const result = spawnSync(process.execPath, [tsxCli, suite], {
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
