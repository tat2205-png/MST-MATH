import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

const app = read("src/App.tsx");
const header = read("src/components/Header.tsx");
const studioApi = read("server/studio/api.ts");
const runtimeStatus = read("server/studio/runtimeStatus.ts");
const server = read("server.ts");
const runtimePanel = read("src/components/StudioEngineStatusPanel.tsx");
const inputTab = read("src/components/tabs/InputTab.tsx");
const workflow = read(".github/workflows/mst-math-convergence-ci.yml");

const regenerateStart = app.indexOf("const handleRegenerateVideo = async () => {");
const regenerateEnd = app.indexOf("// Re-verify solution", regenerateStart);
assert.ok(regenerateStart >= 0 && regenerateEnd > regenerateStart, "Video regeneration handler must exist.");
const regenerate = app.slice(regenerateStart, regenerateEnd);

assert.match(
  regenerate,
  /!problemIR\s*\|\|\s*!solution\s*\|\|\s*!verification\s*\|\|\s*!visualSpec/,
  "Video regeneration must fail closed when authoritative verification is absent.",
);
assert.match(regenerate, /\bverification,/, "Video regeneration must send the authoritative verification object.");
assert.match(regenerate, /!res\.ok\s*\|\|\s*!data\.success\s*\|\|\s*!data\.videoSpec/, "Video regeneration must fail closed on HTTP/API/videoSpec failure.");
assert.match(regenerate, /data\.mathGate\?\.reasons/, "Video regeneration must surface math-gate failure reasons.");
console.log("VIDEO_REGEN_VERIFICATION_QA=PASS");

for (const fabricated of ["1 Active", "~240ms", "04 Online", "PRODUCTION_V1.0.4"]) {
  assert.equal(app.includes(fabricated) || header.includes(fabricated), false, `Fabricated UI status must be removed: ${fabricated}`);
}
assert.match(app, /import\.meta\.env\.MODE\.toUpperCase\(\)/, "Footer build context must be derived from the actual Vite build mode.");
console.log("UI_FAKE_STATUS_COUNT=0");

assert.match(studioApi, /app\.get\("\/api\/studio\/runtime-status"/, "Studio runtime truth must have a dedicated endpoint.");
assert.doesNotMatch(studioApi, /app\.get\("\/api\/studio\/status"/, "registerStudioRoutes must not shadow the capability-registry status endpoint.");
assert.match(server, /app\.get\("\/api\/studio\/status"/, "Capability registry/orchestrator status endpoint must remain registered exactly once in server.ts.");
assert.match(runtimePanel, /fetch\("\/api\/studio\/runtime-status"/, "Runtime engine UI must consume the runtime-status contract.");
assert.match(inputTab, /fetch\("\/api\/studio\/status"/, "Studio planning UI must consume the capability-registry status contract.");
console.log("STUDIO_STATUS_ROUTE_CONTRACT_QA=PASS");

assert.match(runtimeStatus, /resolveCanonicalPythonExecutable/, "Runtime probe must explicitly resolve the canonical repository Python.");
assert.match(runtimeStatus, /\.venv["',\s)]/, "Runtime probe must use the repository-local .venv contract.");
assert.match(runtimeStatus, /Scripts["',\s),]+python\.exe/, "Windows runtime probe must resolve .venv/Scripts/python.exe.");
assert.match(runtimeStatus, /bin["',\s),]+python/, "Unix runtime probe must resolve .venv/bin/python.");
assert.match(runtimeStatus, /if \(!existsSync\(pythonExecutable\)\) return false;/, "Missing canonical Python environment must fail closed.");
assert.doesNotMatch(runtimeStatus, /spawnSync\("python"/, "Runtime status must not probe an unrelated system Python.");
assert.doesNotMatch(runtimeStatus, /spawnSync\("uv"/, "Runtime status must not mutate/sync the environment during a health probe.");
console.log("CANONICAL_PYTHON_RUNTIME_PROBE_QA=PASS");

assert.match(workflow, /uses:\s*actions\/checkout@v5/, "CI must use the Node-24 generation of checkout.");
assert.match(workflow, /uses:\s*actions\/setup-node@v5/, "CI must use the Node-24 generation of setup-node.");
assert.match(workflow, /npm audit --audit-level=high/, "CI must fail on high/critical npm vulnerabilities.");
assert.match(workflow, /pc-question-authority:[\s\S]*needs:\s*core-quality/, "Authority gates must follow core-quality.");
assert.doesNotMatch(workflow, /pc-question-authority:[\s\S]*if:\s*github\.event_name\s*==\s*'pull_request'/, "Authority gates must also run on convergence pushes.");
console.log("POST_MERGE_AUTHORITY_GATE=ON");

assert.match(workflow, /tests\/test-mst-math-pc-a3-public-readiness-contract-v1\.ts/, "A3 public readiness contract must be an explicit authority CI gate.");
assert.match(workflow, /tests\/test-mst-math-pc-a3-backend-readiness-v1\.ts/, "A3 backend authority/export guard must be an explicit authority CI gate.");
console.log("AUTHORITATIVE_READINESS_CI_GATE=ON");

console.log("P0_RUNTIME_TRUTH_QA=PASS");
