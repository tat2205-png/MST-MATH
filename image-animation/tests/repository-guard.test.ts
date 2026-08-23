import assert from "node:assert/strict";
import { evaluateRepositoryGuard } from "../automation/gates/repositoryGuard.ts";

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

console.log(`Repository Guard tests: ${cases.length}/${cases.length} passed`);