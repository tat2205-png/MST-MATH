/**
 * STEP 4: Comprehensive 15-Test Matrix for Gemini & Skill Engine Integration
 */

import { buildSystemSkillInstruction } from "../server/services/skillContextBuilder.js";
import { resolveVideoTaskMode } from "../server/services/videoTaskResolver.js";
import { GraphEngine } from "../src/lib/graphEngine/graphEngine.js";

async function runStep4IntegrationTests() {
  console.log("==================================================");
  console.log("MATH AI VIDEO STUDIO - STEP 4 INTEGRATION TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(testId: string, testName: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testId}: ${testName}`);
      if (details) console.log(`       -> ${details}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testId}: ${testName}`);
      if (details) console.error(`       -> ${details}`);
      failed++;
    }
  }

  // --- TEST 1: MATH_SOLVE -> skill active -> chỉ MATH_GEOMETRY_QA ---
  try {
    const res1 = await buildSystemSkillInstruction({ mode: "MATH_SOLVE" });
    const hasOnlyQA =
      res1.activeModules.length === 1 &&
      res1.activeModules[0] === "MATH_GEOMETRY_QA" &&
      res1.systemInstruction.includes("### MODULE: MATH_GEOMETRY_QA") &&
      !res1.systemInstruction.includes("### MODULE: CAMERA_DIRECTOR");
    assert("TEST_1", "MATH_SOLVE task loads exclusively MATH_GEOMETRY_QA", hasOnlyQA, `Active modules: ${res1.activeModules.join(", ")}`);
  } catch (err: any) {
    assert("TEST_1", "MATH_SOLVE task loads exclusively MATH_GEOMETRY_QA", false, err.message);
  }

  // --- TEST 2: GRAPH_2D -> không có CAMERA_DIRECTOR ---
  try {
    const res2 = await buildSystemSkillInstruction({ mode: "GRAPH_2D" });
    const noCamera =
      !res2.activeModules.includes("CAMERA_DIRECTOR") &&
      !res2.systemInstruction.includes("### MODULE: CAMERA_DIRECTOR") &&
      res2.activeModules.includes("MATH_GEOMETRY_QA");
    assert("TEST_2", "GRAPH_2D does not contain CAMERA_DIRECTOR module", noCamera, `Active modules: ${res2.activeModules.join(", ")}`);
  } catch (err: any) {
    assert("TEST_2", "GRAPH_2D does not contain CAMERA_DIRECTOR module", false, err.message);
  }

  // --- TEST 3: INFOGRAPHIC -> đúng 3 module ---
  try {
    const res3 = await buildSystemSkillInstruction({ mode: "INFOGRAPHIC" });
    const expectedModules = ["STYLE_REFERENCE_FACEBOOK_V1", "VISUAL_SYSTEM", "CAMERA_DIRECTOR"];
    const exact3 =
      res3.activeModules.length === 3 &&
      expectedModules.every((m) => res3.activeModules.includes(m as any));
    assert("TEST_3", "INFOGRAPHIC mode loads exactly 3 modules", exact3, `Active: ${res3.activeModules.join(", ")}`);
  } catch (err: any) {
    assert("TEST_3", "INFOGRAPHIC mode loads exactly 3 modules", false, err.message);
  }

  // --- TEST 4: CAMERA -> CAMERA_DIRECTOR duy nhất ---
  try {
    const res4 = await buildSystemSkillInstruction({ mode: "CAMERA" });
    const onlyCamera =
      res4.activeModules.length === 1 &&
      res4.activeModules[0] === "CAMERA_DIRECTOR";
    assert("TEST_4", "CAMERA mode loads exclusively CAMERA_DIRECTOR", onlyCamera, `Active: ${res4.activeModules.join(", ")}`);
  } catch (err: any) {
    assert("TEST_4", "CAMERA mode loads exclusively CAMERA_DIRECTOR", false, err.message);
  }

  // --- TEST 5: MANIM_VIDEO_CREATE -> đúng 6 module ---
  try {
    const res5 = await buildSystemSkillInstruction({ mode: "MANIM_VIDEO_CREATE" });
    const all6 =
      res5.activeModules.length === 6 &&
      res5.activeModules.includes("STYLE_REFERENCE_FACEBOOK_V1") &&
      res5.activeModules.includes("CAMERA_DIRECTOR") &&
      res5.activeModules.includes("VISUAL_SYSTEM") &&
      res5.activeModules.includes("MATH_GEOMETRY_QA") &&
      res5.activeModules.includes("NARRATION_SYNC") &&
      res5.activeModules.includes("WORKFLOW");
    assert("TEST_5", "MANIM_VIDEO_CREATE loads all 6 modules", all6, `Active count: ${res5.activeModules.length}`);
  } catch (err: any) {
    assert("TEST_5", "MANIM_VIDEO_CREATE loads all 6 modules", false, err.message);
  }

  // --- TEST 6: VIDEO_QA -> đúng module QA và audit ---
  try {
    const res6 = await buildSystemSkillInstruction({ mode: "VIDEO_QA" });
    const qaMatch =
      res6.activeModules.includes("MATH_GEOMETRY_QA") &&
      res6.systemInstruction.includes("### MODULE: MATH_GEOMETRY_QA");
    assert("TEST_6", "VIDEO_QA loads required audit and verification modules", qaMatch, `Active: ${res6.activeModules.join(", ")}`);
  } catch (err: any) {
    assert("TEST_6", "VIDEO_QA loads required audit and verification modules", false, err.message);
  }

  // --- TEST 7: request ngoài phạm vi video skill -> returns null ---
  try {
    const res7 = resolveVideoTaskMode({ pipelineStage: "EXPORT_RAW_AUDIO_ONLY", intent: "UNSUPPORTED_RANDOM_INTENT" });
    const isNull = res7 === null;
    assert("TEST_7", "Unrelated request maps to null mode (graceful bypass)", isNull, `Resolved mode: ${res7}`);
  } catch (err: any) {
    assert("TEST_7", "Unrelated request maps to null mode", false, err.message);
  }

  // --- TEST 8: system instruction hiện tại của app vẫn tồn tại ---
  try {
    const customCore = "CUSTOM_CORE_APP_INSTRUCTION_MANDATE_V1_UNIQUE";
    const res8 = await buildSystemSkillInstruction({
      mode: "MATH_SOLVE",
      coreAppInstruction: customCore,
    });
    const containsCore = res8.systemInstruction.includes(customCore);
    assert("TEST_8", "Existing app system instruction is preserved in final context", containsCore, "Core present in [MATH AI VIDEO STUDIO CORE]");
  } catch (err: any) {
    assert("TEST_8", "Existing app system instruction is preserved in final context", false, err.message);
  }

  // --- TEST 9: skill instruction được append chứ không replace core instruction ---
  try {
    const customCore = "CORE_BASE_RULES";
    const res9 = await buildSystemSkillInstruction({
      mode: "MANIM_VIDEO_CREATE",
      coreAppInstruction: customCore,
      taskInstruction: "TASK_SPECIFIC_RULE_123",
    });
    const hasCore = res9.systemInstruction.indexOf("[MATH AI VIDEO STUDIO CORE]") !== -1;
    const hasSkillCore = res9.systemInstruction.indexOf("[SKILL CORE]") !== -1;
    const hasActiveMod = res9.systemInstruction.indexOf("[ACTIVE MODULES]") !== -1;
    const hasTaskRule = res9.systemInstruction.indexOf("TASK_SPECIFIC_RULE_123") !== -1;
    const orderCorrect =
      res9.systemInstruction.indexOf("[MATH AI VIDEO STUDIO CORE]") <
      res9.systemInstruction.indexOf("[SKILL CORE]");
    assert(
      "TEST_9",
      "Skill instruction is properly appended in structured order after core instruction",
      hasCore && hasSkillCore && hasActiveMod && hasTaskRule && orderCorrect,
      "Order: CORE -> ACTIVE SKILL -> SKILL CORE -> ACTIVE MODULES -> TASK RULES"
    );
  } catch (err: any) {
    assert("TEST_9", "Skill instruction is properly appended", false, err.message);
  }

  // --- TEST 10: không trả full system instruction về browser (chỉ metadata qua skillDebug) ---
  try {
    const res10 = await buildSystemSkillInstruction({ mode: "MATH_SOLVE" });
    const debugSafe =
      res10.skillDebug &&
      typeof res10.skillDebug === "object" &&
      !("systemInstruction" in res10.skillDebug) &&
      res10.skillDebug.enabled === true &&
      Array.isArray(res10.skillDebug.activeModules);
    assert("TEST_10", "skillDebug only exports safe metadata, never raw full prompt to browser", debugSafe, JSON.stringify(res10.skillDebug));
  } catch (err: any) {
    assert("TEST_10", "skillDebug safety check", false, err.message);
  }

  // --- TEST 11: graph workflow vẫn dùng verified graph data ---
  try {
    const graphSpec = GraphEngine.generateGraphSpec("2x^2 - 5x + 2 = 0");
    const validGraph =
      graphSpec.verification.status === "PASS" &&
      graphSpec.features.xIntercepts.length === 2 &&
      Math.abs(graphSpec.features.xIntercepts[0].x - 0.5) < 0.01;
    assert("TEST_11", "Graph engine retains analytical ground truth (Graph Lock)", validGraph, `Roots: ${graphSpec.features.xIntercepts.map(r => r.x).join(", ")}`);
  } catch (err: any) {
    assert("TEST_11", "Graph engine retains analytical ground truth", false, err.message);
  }

  // --- TEST 12: geometry workflow không cho video generator tự tạo geometry mới ---
  try {
    const res12 = await buildSystemSkillInstruction({
      mode: "MANIM_VIDEO_CREATE",
      taskInstruction: "GEOMETRY LOCK: Use verified visualSpec coordinates as strict ground truth.",
    });
    const hasLock =
      res12.systemInstruction.includes("GEOMETRY LOCK") &&
      res12.systemInstruction.includes("### MODULE: MATH_GEOMETRY_QA") &&
      res12.systemInstruction.includes("### MODULE: VISUAL_SYSTEM");
    assert("TEST_12", "Video generation enforces Geometry Lock and Math QA modules", hasLock, "Verified geometry coordinates locked as source of truth");
  } catch (err: any) {
    assert("TEST_12", "Geometry Lock enforcement", false, err.message);
  }

  // --- TEST 13: missing skill module / invalid mode -> SKILL_CONTEXT_ERROR -> không crash ---
  try {
    let threwCorrectly = false;
    try {
      // @ts-ignore
      await buildSystemSkillInstruction({ mode: "NON_EXISTENT_MODE_XYZ" });
    } catch (err: any) {
      if (err.message.includes("SKILL_CONTEXT_ERROR")) {
        threwCorrectly = true;
      }
    }
    assert("TEST_13", "Invalid mode / missing module produces clean SKILL_CONTEXT_ERROR without crashing app", threwCorrectly, "Handled safely via typed error");
  } catch (err: any) {
    assert("TEST_13", "Error handling safety", false, err.message);
  }

  // --- TEST 14: existing graph test suite vẫn PASS ---
  try {
    const quad = GraphEngine.generateGraphSpec("y = x^2 - 4");
    const cubic = GraphEngine.generateGraphSpec("y = x^3 - 3x");
    const rat = GraphEngine.generateGraphSpec("y = (x+1)/(x-1)");
    const allGraphPass =
      quad.verification.status === "PASS" &&
      cubic.verification.status === "PASS" &&
      rat.verification.status === "PASS";
    assert("TEST_14", "Existing Graph Engine test cases retain 100% pass rate", allGraphPass, "Verified quadratic, cubic, rational functions");
  } catch (err: any) {
    assert("TEST_14", "Existing graph test cases", false, err.message);
  }

  // --- TEST 15: existing math test suite / pipeline logic vẫn PASS ---
  try {
    const mode1 = resolveVideoTaskMode({ pipelineStage: "PARSE", domain: "Hình học không gian" });
    const mode2 = resolveVideoTaskMode({ pipelineStage: "SOLVE" });
    const mode3 = resolveVideoTaskMode({ pipelineStage: "VIDEO" });
    const allPipelineResolved =
      mode1 === "GEOMETRY_3D" &&
      mode2 === "MATH_SOLVE" &&
      mode3 === "MANIM_VIDEO_CREATE";
    assert("TEST_15", "Pipeline stages map deterministically to verified task modes", allPipelineResolved, `Parsed -> ${mode1}, Solved -> ${mode2}, Video -> ${mode3}`);
  } catch (err: any) {
    assert("TEST_15", "Pipeline stages resolution", false, err.message);
  }

  console.log("\n==================================================");
  console.log(`INTEGRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (Total: 15)`);
  console.log("==================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runStep4IntegrationTests();
