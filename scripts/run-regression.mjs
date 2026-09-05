import { spawnSync } from "node:child_process";
import process from "node:process";

const suites = [
  "tests/test-mv2-constraint-orchestration.ts",
  "tests/test-mv2-dev-inspector.ts",
  "tests/test-math-ir-dynamic-semantics-v1.ts",
  "tests/test-mv1-construction-engine.ts",
  "tests/test-mv3-dynamic-workspace.ts",
  "tests/test-mv4-intelligent-math-runtime.ts",
  "tests/test-dynamic-geometry-ux-v1.ts",
  "tests/test-fold-studio-master.ts",
  "tests/test-developable-viewer-remediation-v1.ts",
  "tests/test-interactive-fold-remediation-v1.ts",
  "tests/test-interactive-fold-authoring-v1.ts",
  "tests/test-fold-studio-integration-v1.ts",
  "tests/test-pattern-fold-v1.ts",
  "tests/test-surface-shortest-path-viewer-v1.ts",
  "tests/test-surface-shortest-path-remediation-v1.ts",
  "tests/test-surface-shortest-path-v1.ts",
  "tests/test-developable-surfaces-v1.ts",
  "tests/test-n-gonal-fold-v1.ts",
  "tests/test-fold-3d-viewer-v1.ts",
  "tests/test-fold-3d-v1.ts",
  "tests/test-geometry-engine-v1.ts",
  "tests/test-document-engine-v1.ts",
  "tests/test-math-ir-v1.ts",
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
  "tests/test-mst-math-docx-structural-numbering-convergence-v1.ts",
  "tests/test-question-bank-qb1d.ts",
  "tests/test-question-bank-qb1e.ts",
  "tests/test-question-bank-qb1f.ts",
  "tests/test-question-bank-qb2a.ts",
  "tests/test-question-bank-data-access-performance-v1.ts",
  "tests/test-question-bank-qb2b.ts",
  "tests/test-question-bank-qb2c.ts",
  "tests/test-question-bank-qb2d.ts",
  "tests/studio-engine-registry.test.ts",
  "tests/studio-image-animation-adapter.test.ts",
  "tests/studio-luadraw-adapter.test.ts",
  "tests/studio-integration-canary.test.ts",
  "tests/studio-status-api.test.ts",
  "tests/studio-canary-api.test.ts",
  "tests/studio-api-validation.test.ts",
  "tests/studio-runtime-status.test.ts",
  "tests/studio-feature-flag.test.ts",
  "tests/studio-orchestrator-phase3.test.ts",
  "tests/studio-capability-planner-phase3.test.ts",
  "tests/studio-routing-policy-phase3.test.ts",
  "tests/studio-runtime-fallback-phase3.test.ts",
  "tests/studio-execution-trace-phase3.test.ts",
  "tests/studio-multi-engine-canary-phase3.test.ts",
  "tests/studio-execute-api-phase3.test.ts",
  "tests/studio-frame-qa-phase4a4.test.ts",
  "tests/studio-full-video-phase4b.test.ts",
  "tests/studio-manim-timeline-phase4a3.test.ts",
  "tests/studio-real-math-phase4a1.test.ts",
  "tests/studio-real-render-contract-phase4a2.test.ts",
  "tests/test-word-preflight-safe-clean-v1.ts",
  "tests/test-teacher-word-preflight-integration-v1.ts",
  "tests/test-mcq-four-option-adaptive-layout-v1.ts",
  "tests/test-pimath-unified-input-certification-readonly-v1.ts",
  "tests/test-teacher-workflow-ux01.ts",
];

let failed = 0;

for (const suite of suites) {
  console.log(`\n============================================================`);
  console.log(` REGRESSION: ${suite}`);
  console.log(`============================================================`);

  const result = spawnSync(process.execPath, ["--import", "tsx", suite], {
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
