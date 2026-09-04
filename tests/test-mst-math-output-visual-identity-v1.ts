import assert from "node:assert/strict";
import {
  MST_MATH_GAME_VISUAL_SYSTEM,
  MST_MATH_OUTPUT_VISUAL_PROFILE_REGISTRY,
  MST_MATH_VIDEO_TYPE_SCALE,
  resolveGameVisualSystem,
  resolveOutputVisualProfile,
  resolveVideoTypeScale,
  validateOutputVisualProfileCoverage,
} from "../src/config/mstMathOutputVisualProfiles.js";

assert.equal(MST_MATH_OUTPUT_VISUAL_PROFILE_REGISTRY.id, "MST_MATH_OUTPUT_VISUAL_PROFILE_REGISTRY_V1.0");
assert.equal(MST_MATH_OUTPUT_VISUAL_PROFILE_REGISTRY.root, "MST-MATH-DNA-V1.0");
assert.equal(MST_MATH_OUTPUT_VISUAL_PROFILE_REGISTRY.status, "DRAFT_FOR_HUMAN_APPROVAL");
assert.equal(MST_MATH_OUTPUT_VISUAL_PROFILE_REGISTRY.canonical, false);
assert.equal(MST_MATH_OUTPUT_VISUAL_PROFILE_REGISTRY.canonicalCandidate, true);
assert.equal(MST_MATH_OUTPUT_VISUAL_PROFILE_REGISTRY.governance.noParallelDesignSystem, true);
assert.equal(MST_MATH_OUTPUT_VISUAL_PROFILE_REGISTRY.governance.noLocalCanonicalFont, true);
assert.equal(MST_MATH_OUTPUT_VISUAL_PROFILE_REGISTRY.governance.noLocalCanonicalColor, true);
assert.equal(MST_MATH_OUTPUT_VISUAL_PROFILE_REGISTRY.governance.noLocalCanonicalIconSystem, true);

const coverage = validateOutputVisualProfileCoverage();
assert.equal(coverage.ok, true);
assert.equal(coverage.covered.length, 16);

const p01 = resolveOutputVisualProfile("P01_LEARNING_MATERIAL").profile as Record<string, unknown>;
assert.equal(p01.colorContract, "learning_material");
assert.equal(p01.primaryAccent, "#0C2D57");

const p03 = resolveOutputVisualProfile("P03_WORKSHEET").profile as Record<string, unknown>;
assert.equal(p03.colorContract, "worksheet");
assert.equal(p03.primaryAccent, "#2F8F68");

const p04 = resolveOutputVisualProfile("P04_EXERCISE_SHEET").profile as Record<string, unknown>;
assert.equal(p04.colorContract, "exercise_sheet");
assert.equal(p04.primaryAccent, "#6B4FA3");

const p07 = resolveOutputVisualProfile("P07_VIDEO").profile as Record<string, unknown>;
assert.equal(p07.colorContract, "video");
assert.equal(p07.primaryAccent, "#D9911B");
assert.equal(resolveOutputVisualProfile("MST_MATH_VIDEO_VISUAL_CANONICAL_V2.0").profile.profileId, "P07_VIDEO");
assert.equal(resolveOutputVisualProfile("PIMATH_VIDEO_VISUAL_CANONICAL_V2.0").profile.profileId, "P07_VIDEO");

assert.equal(MST_MATH_VIDEO_TYPE_SCALE.id, "MST_MATH_VIDEO_TYPE_SCALE_V1.0");
const videoScale = resolveVideoTypeScale();
assert.equal(videoScale.canonical1080p.rolesPx.question.size, 36);
assert.equal(videoScale.canonical1080p.rolesPx.solutionBody.size, 32);
assert.equal(videoScale.canonical1080p.rolesPx.displayMath.size, 38);
assert.equal(videoScale.readabilityRules.fontShrinkToHideOverflow, false);

assert.equal(MST_MATH_GAME_VISUAL_SYSTEM.id, "MST_MATH_GAME_VISUAL_SYSTEM_V1.0");
const game = resolveGameVisualSystem();
assert.equal(game.colorBindings.noOwnPalette, true);
assert.equal(game.colorBindings.brandPrimary, "#0C2D57");
assert.equal(game.colorBindings.eventEmphasis, "#D9911B");
assert.equal(game.colorBindings.confirmedSuccess, "#2F8F68");
assert.equal(game.iconPolicy.authority, "MST-MATH-DNA-SEMANTIC-ICONS-V1.1");
assert.equal(game.semanticFeedback.wrong.newRedTokenForbidden, true);
assert.equal(game.typeScale1080pPx.question.size, 38);
assert.equal(game.typeScale1080pPx.timer.size, 58);
assert.equal(game.readability.fontShrinkToHideOverflow, false);

assert.throws(() => resolveOutputVisualProfile("UNKNOWN_PROFILE"), /MST_MATH_OUTPUT_VISUAL_PROFILE_UNRESOLVED/);

console.log("MST-MATH OUTPUT VISUAL IDENTITY V1.0 QA PASS");
