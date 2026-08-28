import assert from "node:assert/strict";
import { evaluateRepositoryGuard } from "../automation/gates/repositoryGuard.ts";
import { loadTaskSpec } from "../automation/orchestrator/orchestrator.ts";

const spec = {
  allowedPaths: ["image-animation/**", "package.json"],
  forbiddenPaths: ["server/**", "src/**", "tests/**"],
};

const cases = [
  ["allowed file", ["image-animation/automation/state/run.json"], "PASS"],
  ["forbidden file", ["server/services/example.ts"], "FAIL"],
  ["unrelated file", ["README.md"], "FAIL"],
  ["multiple allowed files", ["image-animation/AGENTS.md", "package.json"], "PASS"],
  ["mixture of allowed and forbidden files", ["image-animation/AGENTS.md", "src/App.tsx"], "FAIL"],
] as const;

for (const [name, files, expectedStatus] of cases) {
  const result = evaluateRepositoryGuard(files, spec);
  assert.equal(result.status, expectedStatus, name);
}

const convergenceSpec = loadTaskSpec(process.cwd(), "IA-MAS.FINAL.CONVERGENCE");
const convergenceCases = [
  ["convergence source file", ["server/studio/api.ts"], "PASS"],
  ["convergence root configuration", ["package.json", ".env.example"], "PASS"],
  ["unrelated source file", ["src/components/UnreviewedComponent.tsx"], "FAIL"],
  ["generated media", ["media/final-convergence/render.mp4"], "FAIL"],
  ["local cache", [".serena/cache/state.json"], "FAIL"],
  ["secret environment file", [".env"], "FAIL"],
] as const;

for (const [name, files, expectedStatus] of convergenceCases) {
  const result = evaluateRepositoryGuard(files, convergenceSpec);
  assert.equal(result.status, expectedStatus, name);
}

const totalCases = cases.length + convergenceCases.length;
console.log(`Repository Guard tests: ${totalCases}/${totalCases} passed`);
