import assert from "node:assert/strict";
import { RepairOrchestrator } from "../server/services/repairOrchestrator.js";
import { openClawRepairClient } from "../server/services/openclawRepairClient.js";

const source = [
  "from manim import *",
  "class RepairSmokeTest(Scene):",
  "    def construct(self):",
  "        title = Text(\"MATH AI VIDEO STUDIO\")",
  "        formula = MathTex(r\"x^2-5x+6=0\")",
  "        formula.move_to(title.get_center())",
].join("\n");

const originalFetch = globalThis.fetch;
const originalHealth = openClawRepairClient.checkHealth;
const originalInference = openClawRepairClient.runRepairInference;

try {
  openClawRepairClient.checkHealth = async () => ({ ok: true, transport: "local", qaStatus: "PASS" });
  openClawRepairClient.runRepairInference = async () => ({
    ok: true,
    provider: "openclaw_local_cli",
    model: "test",
    patchProposal: {
      status: "PATCH_PROPOSED",
      reason: "controlled fault injection",
      changes: [{
        file: "main.py",
        operation: "replace_range",
        oldText: "        formula.move_to(title.get_center())",
        newText: "        formula.next_to(title, DOWN)",
        category: "LAYOUT_ERROR",
      }],
    },
  });
  globalThis.fetch = async () => new Response(JSON.stringify({ error: "bridge unavailable" }), { status: 503 });

  const report = await new RepairOrchestrator().executeRepairLoop({
    sceneName: "RepairSmokeTest",
    projectManifest: {
      projectId: "controlled-fault",
      projectName: "Controlled Fault",
      entryFile: "main.py",
      sceneName: "RepairSmokeTest",
      files: [{ path: "main.py", content: source }],
    },
    initialIssues: [{
      category: "LAYOUT_ERROR",
      severity: "HIGH",
      description: "controlled overlap",
      repairClass: "SAFE_AUTO_REPAIR",
    }],
    bridgeUrl: "http://127.0.0.1:9999",
    mathContext: { formulas: ["x^2-5x+6=0"] },
  });

  assert.notEqual(report.finalStatus, "PASS");
  assert.equal(report.qaSummary.rerenderQa, "FAIL");
  assert.equal(report.totalAttempts, 3);
  assert.equal(report.currentFiles["main.py"], source.replace("formula.move_to(title.get_center())", "formula.next_to(title, DOWN)"));
  console.log("CONTROLLED_FAULT_INITIAL_RENDER_FAIL: PASS");
  console.log("CONTROLLED_FAULT_REPAIR_FAILS_CLOSED: PASS");
} finally {
  globalThis.fetch = originalFetch;
  openClawRepairClient.checkHealth = originalHealth;
  openClawRepairClient.runRepairInference = originalInference;
}
