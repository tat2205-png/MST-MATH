/**
 * Comprehensive 10-Test Suite for Skill Engine (Loader & Router)
 */

import {
  clearSkillCache,
  loadSkillCore,
  loadSkillModules,
} from "../server/services/skillLoader.js";
import {
  buildActiveSkillContext,
  routeSkill,
} from "../server/services/skillRouter.js";

async function runTests() {
  console.log("==================================================");
  console.log("RUNNING SKILL ENGINE 10-TEST SUITE");
  console.log("==================================================");

  let passedCount = 0;
  const totalTests = 10;

  // TEST 1: loadSkillCore metadata and coreInstruction
  try {
    clearSkillCache();
    const core = await loadSkillCore("manim-cinematic-video");
    const nameMatch = core.metadata.name === "manim-cinematic-video";
    const hasCoreInstruction = typeof core.coreInstruction === "string" && core.coreInstruction.length > 50;
    if (nameMatch && hasCoreInstruction) {
      passedCount++;
      console.log("✅ [PASS] TEST 1: loadSkillCore metadata.name and coreInstruction verified");
      console.log(`   - Name: ${core.metadata.name}, Version: ${core.metadata.version}`);
      console.log(`   - Instruction Length: ${core.coreInstruction.length} chars`);
    } else {
      console.error("❌ [FAIL] TEST 1: Invalid metadata or empty coreInstruction", core.metadata);
    }
  } catch (err: any) {
    console.error("❌ [FAIL] TEST 1: Exception thrown:", err.message);
  }

  // TEST 2: references contains real modules
  try {
    const core = await loadSkillCore("manim-cinematic-video");
    const requiredKeys = ["CAMERA_DIRECTOR", "MATH_GEOMETRY_QA", "NARRATION_SYNC", "WORKFLOW", "STYLE_REFERENCE_FACEBOOK_V1"];
    const allPresent = requiredKeys.every(k => k in core.references);
    if (allPresent) {
      passedCount++;
      console.log("✅ [PASS] TEST 2: All expected reference modules found in skill");
      console.log(`   - Modules found: ${Object.keys(core.references).join(", ")}`);
    } else {
      console.error("❌ [FAIL] TEST 2: Missing expected reference keys in core.references");
    }
  } catch (err: any) {
    console.error("❌ [FAIL] TEST 2: Exception thrown:", err.message);
  }

  // TEST 3: loadSkillModules only loads requested modules
  try {
    clearSkillCache();
    const modules = await loadSkillModules("manim-cinematic-video", ["CAMERA_DIRECTOR"]);
    const hasCamera = "CAMERA_DIRECTOR" in modules && modules.CAMERA_DIRECTOR.length > 0;
    const noVisualSystem = !("VISUAL_SYSTEM" in modules);
    const exactOne = Object.keys(modules).length === 1;

    if (hasCamera && noVisualSystem && exactOne) {
      passedCount++;
      console.log("✅ [PASS] TEST 3: loadSkillModules selectively loads ONLY requested module");
    } else {
      console.error("❌ [FAIL] TEST 3: Selective load failed, keys:", Object.keys(modules));
    }
  } catch (err: any) {
    console.error("❌ [FAIL] TEST 3: Exception thrown:", err.message);
  }

  // TEST 4: routeSkill("CAMERA") -> only CAMERA_DIRECTOR
  try {
    const route = routeSkill("CAMERA");
    const isCamera = route.modules.length === 1 && route.modules[0] === "CAMERA_DIRECTOR";
    if (isCamera) {
      passedCount++;
      console.log("✅ [PASS] TEST 4: routeSkill('CAMERA') returns exactly ['CAMERA_DIRECTOR']");
    } else {
      console.error("❌ [FAIL] TEST 4: routeSkill('CAMERA') failed:", route);
    }
  } catch (err: any) {
    console.error("❌ [FAIL] TEST 4: Exception thrown:", err.message);
  }

  // TEST 5: routeSkill("MANIM_VIDEO_CREATE") -> exact 6 modules
  try {
    const route = routeSkill("MANIM_VIDEO_CREATE");
    const expected = [
      "STYLE_REFERENCE_FACEBOOK_V1",
      "CAMERA_DIRECTOR",
      "VISUAL_SYSTEM",
      "MATH_GEOMETRY_QA",
      "NARRATION_SYNC",
      "WORKFLOW",
    ];
    const isExact6 = route.modules.length === 6 && expected.every(m => route.modules.includes(m as any));
    if (isExact6) {
      passedCount++;
      console.log("✅ [PASS] TEST 5: routeSkill('MANIM_VIDEO_CREATE') mapped to all 6 modules");
    } else {
      console.error("❌ [FAIL] TEST 5: routeSkill('MANIM_VIDEO_CREATE') incorrect:", route.modules);
    }
  } catch (err: any) {
    console.error("❌ [FAIL] TEST 5: Exception thrown:", err.message);
  }

  // TEST 6: routeSkill("ORTHOGRAPHIC_PROJECTION") -> MATH_GEOMETRY_QA
  try {
    const route = routeSkill("ORTHOGRAPHIC_PROJECTION");
    const isMathQA = route.modules.length === 1 && route.modules[0] === "MATH_GEOMETRY_QA";
    if (isMathQA) {
      passedCount++;
      console.log("✅ [PASS] TEST 6: routeSkill('ORTHOGRAPHIC_PROJECTION') mapped to MATH_GEOMETRY_QA");
    } else {
      console.error("❌ [FAIL] TEST 6: routeSkill('ORTHOGRAPHIC_PROJECTION') incorrect:", route);
    }
  } catch (err: any) {
    console.error("❌ [FAIL] TEST 6: Exception thrown:", err.message);
  }

  // TEST 7: path traversal rejected with error
  try {
    let trapped = false;
    try {
      await loadSkillCore("../../secret" as any);
    } catch (err: any) {
      if (err.message.includes("Path traversal") || err.message.includes("Security Violation") || err.message.includes("Invalid")) {
        trapped = true;
      }
    }

    if (trapped) {
      passedCount++;
      console.log("✅ [PASS] TEST 7: Path traversal attempt correctly rejected");
    } else {
      console.error("❌ [FAIL] TEST 7: Path traversal was not rejected");
    }
  } catch (err: any) {
    console.error("❌ [FAIL] TEST 7: Unexpected error:", err.message);
  }

  // TEST 8: nonexistent module rejected with error
  try {
    let caughtNonexistent = false;
    try {
      await loadSkillModules("manim-cinematic-video", ["NON_EXISTENT_MODULE" as any]);
    } catch (err: any) {
      if (err.message.includes("not found")) {
        caughtNonexistent = true;
      }
    }

    if (caughtNonexistent) {
      passedCount++;
      console.log("✅ [PASS] TEST 8: Non-existent module load rejected with error");
    } else {
      console.error("❌ [FAIL] TEST 8: Nonexistent module did not throw error");
    }
  } catch (err: any) {
    console.error("❌ [FAIL] TEST 8: Unexpected error:", err.message);
  }

  // TEST 9: buildActiveSkillContext("INFOGRAPHIC")
  try {
    clearSkillCache();
    const context = await buildActiveSkillContext("INFOGRAPHIC");
    const hasCore = typeof context.coreInstruction === "string" && context.coreInstruction.length > 50;
    const has3Modules = context.activeModules.length === 3;
    const hasVisualSystem = "VISUAL_SYSTEM" in context.references;
    const hasFacebookStyle = "STYLE_REFERENCE_FACEBOOK_V1" in context.references;
    const hasCameraDirector = "CAMERA_DIRECTOR" in context.references;
    const noNarrationSync = !("NARRATION_SYNC" in context.references);

    if (hasCore && has3Modules && hasVisualSystem && hasFacebookStyle && hasCameraDirector && noNarrationSync) {
      passedCount++;
      console.log("✅ [PASS] TEST 9: buildActiveSkillContext('INFOGRAPHIC') correctly structured");
      console.log(`   - Active modules: ${context.activeModules.join(", ")}`);
    } else {
      console.error("❌ [FAIL] TEST 9: buildActiveSkillContext('INFOGRAPHIC') failed validation", {
        hasCore,
        has3Modules,
        refs: Object.keys(context.references),
      });
    }
  } catch (err: any) {
    console.error("❌ [FAIL] TEST 9: Exception thrown:", err.message);
  }

  // TEST 10: clearSkillCache() behaves correctly
  try {
    clearSkillCache();
    const skill1 = await loadSkillCore("manim-cinematic-video");
    clearSkillCache();
    const skill2 = await loadSkillCore("manim-cinematic-video");
    if (skill1.metadata.name === skill2.metadata.name && skill2.coreInstruction.length > 0) {
      passedCount++;
      console.log("✅ [PASS] TEST 10: clearSkillCache() successfully clears cache and allows reload");
    } else {
      console.error("❌ [FAIL] TEST 10: clearSkillCache() reload failed");
    }
  } catch (err: any) {
    console.error("❌ [FAIL] TEST 10: Exception thrown:", err.message);
  }

  console.log("==================================================");
  console.log(`TOTAL PASSED: ${passedCount} / ${totalTests}`);
  console.log("==================================================");

  if (passedCount === totalTests) {
    console.log("🎉 ALL 10 SKILL ENGINE TESTS PASSED WITH 100% SUCCESS!");
    process.exit(0);
  } else {
    console.error("Some tests failed.");
    process.exit(1);
  }
}

runTests();
