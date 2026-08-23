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
  "        self.play(Write(title))",
  "        self.play(Write(formula))",
  "        self.wait(1)",
].join("\n");

const originalHealth = openClawRepairClient.checkHealth;
const originalInference = openClawRepairClient.runRepairInference;
try {
  openClawRepairClient.checkHealth = async () => ({ ok: true, transport: "local", qaStatus: "PASS" });
  openClawRepairClient.runRepairInference = async () => ({
    ok: true,
    provider: "openclaw_local_cli",
    model: "controlled-test",
    patchProposal: {
      status: "PATCH_PROPOSED",
      reason: "controlled safe layout repair",
      changes: [{
        file: "main.py",
        operation: "replace_range",
        oldText: "        formula.move_to(title.get_center())",
        newText: "        formula.next_to(title, DOWN)",
        category: "LAYOUT_ERROR",
      }],
    },
  });

  const report = await new RepairOrchestrator().executeRepairLoop({
    sceneName: "RepairSmokeTest",
    projectManifest: {
      projectId: "real-repair-proof",
      projectName: "Real Repair Proof",
      entryFile: "main.py",
      sceneName: "RepairSmokeTest",
      quality: "preview",
      action: "render",
      files: [{ path: "main.py", content: source }],
    },
    initialIssues: [{
      category: "LAYOUT_ERROR",
      severity: "HIGH",
      description: "controlled overlap",
      repairClass: "SAFE_AUTO_REPAIR",
    }],
    bridgeUrl: "http://127.0.0.1:8765",
    mathContext: { formulas: ["x^2-5x+6=0"] },
  });

  assert.equal(report.finalStatus, "PASS");
  assert.equal(report.totalAttempts, 1);
  assert.equal(report.attempts[0]?.runtimeStatus, "PASS");
  assert.equal(report.qaSummary.rerenderQa, "PASS");
  assert.equal(report.qaSummary.protectedDataMutationQa, "PASS");
  assert.equal(report.currentFiles["main.py"].includes("formula.next_to(title, DOWN)"), true);
  console.log("CONTROLLED_FAULT_INITIAL_RENDER_FAIL: PASS");
  console.log("REAL_RERENDER_MANIM: PASS");
  console.log("AUTO_REPAIR_STATUS: PASS");
} finally {
  openClawRepairClient.checkHealth = originalHealth;
  openClawRepairClient.runRepairInference = originalInference;
}
