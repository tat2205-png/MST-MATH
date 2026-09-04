import assert from "node:assert/strict";
import {
  MST_MATH_GAME_VISUAL_SYSTEM,
  MST_MATH_OUTPUT_CONTENT_PRESENTATION_POLICY,
  MST_MATH_OUTPUT_VISUAL_PROFILE_REGISTRY,
  MST_MATH_VIDEO_TYPE_SCALE,
  resolveGameVisualSystem,
  resolveOutputContentPresentationPolicy,
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

const outputPolicy = resolveOutputContentPresentationPolicy();
assert.equal(MST_MATH_OUTPUT_CONTENT_PRESENTATION_POLICY.id, "MST_MATH_OUTPUT_CONTENT_PRESENTATION_POLICY_V1.1");
assert.equal(outputPolicy.status, "LOCKED_CANONICAL_APPROVED");
assert.equal(outputPolicy.humanApproved, true);
assert.equal(outputPolicy.inherits, "MST_MATH_OUTPUT_CONTENT_PRESENTATION_POLICY_V1.0");
assert.equal(outputPolicy.supersedes, "MST_MATH_OUTPUT_CONTENT_PRESENTATION_POLICY_V1.0");
assert.equal(outputPolicy.document.page.size, "A4");
assert.equal(outputPolicy.document.branding.showMstMathBrand, false);
assert.equal(outputPolicy.video.branding.showMstMathBrand, false);
assert.equal(outputPolicy.document.pageNumber.required, true);
assert.equal(outputPolicy.document.pageNumber.position, "BOTTOM_CENTER");
assert.equal(outputPolicy.document.pageNumber.appliesToEveryA4Page, true);
assert.equal(outputPolicy.document.answerSection.required, true);
assert.equal(outputPolicy.document.answerSection.placement, "END_OF_DOCUMENT");
assert.equal(outputPolicy.pedagogicalReflow.enabled, true);
assert.equal(outputPolicy.pedagogicalReflow.allowed.reorderQuestionsWithinSamePedagogicalCluster, true);
assert.equal(outputPolicy.pedagogicalReflow.traceability.requireDependencyCheckBeforeReorder, true);
assert.equal(outputPolicy.pedagogicalReflow.whitespaceSemantics.studentWorkspaceIsMeaningfulWhitespace, true);
assert.equal(outputPolicy.studentWorkspace.requiredProfiles.includes("P01_LEARNING_MATERIAL"), true);
assert.equal(outputPolicy.studentWorkspace.requiredProfiles.includes("P03_WORKSHEET"), true);
assert.equal(outputPolicy.studentWorkspace.requiredForEveryQuestion, true);
assert.equal(outputPolicy.studentWorkspace.includesMultipleChoice, true);
assert.equal(outputPolicy.studentWorkspace.ruledLineStyle.linePitchMm, 7);
assert.equal(outputPolicy.studentWorkspace.adaptiveCapacity.minimumRuledRows.MULTIPLE_CHOICE, 2);
assert.equal(outputPolicy.studentWorkspace.adaptiveCapacity.mayNotReduceBelowMinimumToFillPage, true);
assert.equal(outputPolicy.figure.questionContainment.required, true);
assert.equal(outputPolicy.figure.questionContainment.splitAcrossPages, false);
assert.equal(outputPolicy.figure.clarity.vectorPreferred, true);
assert.equal(outputPolicy.figure.clarity.rasterMinimumEffectiveDpiForPrint, 300);
assert.equal(outputPolicy.figure.pageBalance.preserveAspectRatio, true);
assert.equal(outputPolicy.figure.pageBalance.noOverlapStudentWorkspace, true);
assert.equal(outputPolicy.answerQa.requiredBeforeExport, true);
assert.equal(outputPolicy.answerQa.mcq.verifyAnswerKeyMatchesComputedOrProvenResult, true);
assert.equal(outputPolicy.answerQa.mcq.verifyDistractorsDoNotCreateMultipleCorrectAnswers, true);
assert.equal(outputPolicy.answerQa.failurePolicy.onFail, "BLOCK_EXPORT");
assert.equal(outputPolicy.governance.rendererMayExportUnverifiedAnswer, false);
assert.equal(outputPolicy.governance.rendererMayDeleteStudentWorkspaceToImproveDensity, false);
assert.equal(outputPolicy.governance.rendererMayReorderWithoutDependencyCheck, false);
assert.equal(outputPolicy.governance.rendererMayOmitPageNumber, false);

const p01 = resolveOutputVisualProfile("P01_LEARNING_MATERIAL").profile as any;
assert.equal(p01.colorContract, "learning_material");
assert.equal(p01.primaryAccent, "#0C2D57");
assert.equal(p01.specific.workspacePolicy, "ALWAYS_PRESENT_ADAPTIVE_RULED_NOTES_FOR_EVERY_QUESTION");
assert.equal(p01.specific.studentNotebookLinePitchMm, 7);
assert.equal(p01.specific.workspaceIncludesMultipleChoice, true);
assert.equal(p01.specific.pedagogicallySafeQuestionReorder, true);
assert.equal(p01.specific.pageNumber, "BOTTOM_CENTER_EVERY_PAGE");

const p03 = resolveOutputVisualProfile("P03_WORKSHEET").profile as any;
assert.equal(p03.colorContract, "worksheet");
assert.equal(p03.primaryAccent, "#2F8F68");
assert.equal(p03.specific.workspacePolicy, "ALWAYS_PRESENT_ADAPTIVE_RULED_NOTES_FOR_EVERY_QUESTION");
assert.equal(p03.specific.studentNotebookLinePitchMm, 7);
assert.equal(p03.specific.workspaceIncludesMultipleChoice, true);
assert.equal(p03.specific.pedagogicallySafeQuestionReorder, true);
assert.equal(p03.specific.pageNumber, "BOTTOM_CENTER_EVERY_PAGE");

const p04 = resolveOutputVisualProfile("P04_EXERCISE_SHEET").profile as Record<string, unknown>;
assert.equal(p04.colorContract, "exercise_sheet");
assert.equal(p04.primaryAccent, "#6B4FA3");

const p07 = resolveOutputVisualProfile("P07_VIDEO").profile as any;
assert.equal(p07.colorContract, "video");
assert.equal(p07.primaryAccent, "#D9911B");
assert.equal(p07.specific.pedagogicallySafeQuestionOrExampleReorder, true);
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

console.log("MST-MATH OUTPUT VISUAL IDENTITY + CONTENT PRESENTATION POLICY V1.1 QA PASS");
