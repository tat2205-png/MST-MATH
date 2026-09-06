import { validateMathIR } from "../math-ir/validation.js";
import type { MathDocument, MathScene } from "../math-ir/types.js";
import { MOTION_PRIMITIVES, SEMANTIC_VIDEO_SCHEMA_VERSION } from "./types.js";
import type {
  MotionInstruction,
  RenderManifest,
  SemanticVideoIssue,
  SemanticVideoValidationResult,
  TimelineCue,
} from "./types.js";

const fail = (issues: SemanticVideoIssue[]): SemanticVideoValidationResult => ({ status: "FAIL", issues });
const pass = (): SemanticVideoValidationResult => ({ status: "PASS", issues: [] });

function add(issues: SemanticVideoIssue[], code: string, message: string, path?: string): void {
  issues.push({ code, message, path });
}

function uniqueIds(
  issues: SemanticVideoIssue[],
  values: Array<{ id: string }>,
  code: string,
  path: string,
): void {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    if (!value.id || !value.id.trim()) add(issues, "EMPTY_ID", "ID must be non-empty.", `${path}[${index}].id`);
    else if (seen.has(value.id)) add(issues, code, `Duplicate ID: ${value.id}`, `${path}[${index}].id`);
    seen.add(value.id);
  });
}

function sceneEntityIds(scene: MathScene): Set<string> {
  return new Set(scene.entities.map((entity) => entity.id));
}

function sceneExpressionIds(scene: MathScene, document: MathDocument): Set<string> {
  return new Set([
    ...document.expressions.map((expression) => expression.id),
    ...(scene.expressions ?? []).map((expression) => expression.id),
  ]);
}

function validateInstruction(
  instruction: MotionInstruction,
  scene: MathScene,
  document: MathDocument,
  issues: SemanticVideoIssue[],
  path: string,
): void {
  if (!MOTION_PRIMITIVES.includes(instruction.primitive)) {
    add(issues, "UNKNOWN_MOTION_PRIMITIVE", `Unknown motion primitive: ${String(instruction.primitive)}`, `${path}.primitive`);
  }
  if (instruction.sourceSceneId !== scene.id) {
    add(issues, "SCENE_MISMATCH", `Instruction ${instruction.id} does not belong to scene ${scene.id}.`, `${path}.sourceSceneId`);
  }
  if (!instruction.semanticPurpose?.trim()) {
    add(issues, "MISSING_SEMANTIC_PURPOSE", `Instruction ${instruction.id} requires semanticPurpose.`, `${path}.semanticPurpose`);
  }
  if (instruction.durationHintSeconds !== undefined && (!Number.isFinite(instruction.durationHintSeconds) || instruction.durationHintSeconds < 0)) {
    add(issues, "INVALID_DURATION_HINT", `Instruction ${instruction.id} has invalid durationHintSeconds.`, `${path}.durationHintSeconds`);
  }

  const entityIds = sceneEntityIds(scene);
  for (const entityId of instruction.targetEntityIds ?? []) {
    if (!entityIds.has(entityId)) add(issues, "INVALID_ENTITY_REFERENCE", `Unknown entity ${entityId} in scene ${scene.id}.`, `${path}.targetEntityIds`);
  }

  const expressionIds = sceneExpressionIds(scene, document);
  for (const expressionId of instruction.targetExpressionIds ?? []) {
    if (!expressionIds.has(expressionId)) add(issues, "INVALID_EXPRESSION_REFERENCE", `Unknown expression ${expressionId}.`, `${path}.targetExpressionIds`);
  }
  if (instruction.fromExpressionId && !expressionIds.has(instruction.fromExpressionId)) {
    add(issues, "INVALID_EXPRESSION_REFERENCE", `Unknown source expression ${instruction.fromExpressionId}.`, `${path}.fromExpressionId`);
  }
  if (instruction.toExpressionId && !expressionIds.has(instruction.toExpressionId)) {
    add(issues, "INVALID_EXPRESSION_REFERENCE", `Unknown target expression ${instruction.toExpressionId}.`, `${path}.toExpressionId`);
  }

  if (instruction.primitive === "TRANSFORM_MATH") {
    if (!instruction.fromExpressionId || !instruction.toExpressionId) {
      add(issues, "TRANSFORM_MATH_REQUIRES_EXPRESSIONS", "TRANSFORM_MATH requires fromExpressionId and toExpressionId.", path);
    }
  }
  if (instruction.primitive === "CONSTRUCT" && !(instruction.targetEntityIds?.length)) {
    add(issues, "CONSTRUCT_REQUIRES_TARGET", "CONSTRUCT requires at least one targetEntityId.", path);
  }
  if (instruction.primitive === "MOVE_POINT") {
    const targets = instruction.targetEntityIds ?? [];
    if (targets.length !== 1) add(issues, "MOVE_POINT_REQUIRES_ONE_TARGET", "MOVE_POINT requires exactly one targetEntityId.", path);
    const target = scene.entities.find((entity) => entity.id === targets[0]);
    if (target && target.type !== "point") add(issues, "MOVE_POINT_TARGET_NOT_POINT", `MOVE_POINT target ${target.id} is ${target.type}, not point.`, path);
  }
  if (instruction.primitive === "SHOW_RELATION") {
    if (!instruction.relationId) add(issues, "SHOW_RELATION_REQUIRES_RELATION", "SHOW_RELATION requires relationId.", path);
    else if (!(scene.relations ?? []).some((relation) => relation.id === instruction.relationId)) {
      add(issues, "INVALID_RELATION_REFERENCE", `Unknown relation ${instruction.relationId} in scene ${scene.id}.`, `${path}.relationId`);
    }
  }
}

function validateTimelineCue(cue: TimelineCue, issues: SemanticVideoIssue[], path: string): void {
  if (!Number.isFinite(cue.startSeconds) || cue.startSeconds < 0) add(issues, "INVALID_TIMELINE_START", `Cue ${cue.id} has invalid startSeconds.`, `${path}.startSeconds`);
  if (!Number.isFinite(cue.durationSeconds) || cue.durationSeconds <= 0) add(issues, "INVALID_TIMELINE_DURATION", `Cue ${cue.id} must have positive durationSeconds.`, `${path}.durationSeconds`);
  if (cue.pauseAfterSeconds !== undefined && (!Number.isFinite(cue.pauseAfterSeconds) || cue.pauseAfterSeconds < 0)) {
    add(issues, "INVALID_PAUSE_DURATION", `Cue ${cue.id} has invalid pauseAfterSeconds.`, `${path}.pauseAfterSeconds`);
  }
  if (!(cue.motionInstructionIds?.length) && !cue.narrationCueId) {
    add(issues, "EMPTY_TIMELINE_CUE", `Cue ${cue.id} schedules neither motion nor narration.`, path);
  }
}

export function validateSemanticVideoManifest(document: MathDocument, manifest: RenderManifest): SemanticVideoValidationResult {
  const issues: SemanticVideoIssue[] = [];
  const mathValidation = validateMathIR(document);
  if (mathValidation.status !== "PASS") {
    add(issues, "MATH_IR_INVALID", `Source Math IR failed validation with ${mathValidation.issues.length} issue(s).`, "document");
  }

  if (manifest.schemaVersion !== SEMANTIC_VIDEO_SCHEMA_VERSION) add(issues, "SCHEMA_VERSION_MISMATCH", "RenderManifest schema version mismatch.", "schemaVersion");
  if (manifest.motion.schemaVersion !== SEMANTIC_VIDEO_SCHEMA_VERSION) add(issues, "SCHEMA_VERSION_MISMATCH", "MotionIR schema version mismatch.", "motion.schemaVersion");
  if (manifest.timeline.schemaVersion !== SEMANTIC_VIDEO_SCHEMA_VERSION) add(issues, "SCHEMA_VERSION_MISMATCH", "TimelineIR schema version mismatch.", "timeline.schemaVersion");
  if (manifest.mathDocumentId !== document.id || manifest.motion.mathDocumentId !== document.id) {
    add(issues, "MATH_DOCUMENT_ID_MISMATCH", "Manifest/MotionIR must reference the exact source MathDocument ID.", "mathDocumentId");
  }

  if (!Number.isInteger(manifest.outputProfile.width) || manifest.outputProfile.width <= 0 || !Number.isInteger(manifest.outputProfile.height) || manifest.outputProfile.height <= 0) {
    add(issues, "INVALID_OUTPUT_DIMENSIONS", "Output dimensions must be positive integers.", "outputProfile");
  }
  if (!Number.isFinite(manifest.outputProfile.fps) || manifest.outputProfile.fps <= 0) add(issues, "INVALID_OUTPUT_FPS", "Output fps must be positive.", "outputProfile.fps");
  if (manifest.timeline.fps !== manifest.outputProfile.fps) add(issues, "FPS_MISMATCH", "Timeline fps must match output profile fps.", "timeline.fps");
  const ratio = manifest.outputProfile.width / manifest.outputProfile.height;
  const expectedRatio = manifest.outputProfile.aspectRatio === "16:9" ? 16 / 9 : 9 / 16;
  if (Math.abs(ratio - expectedRatio) > 0.001) add(issues, "ASPECT_RATIO_MISMATCH", "Output dimensions do not match declared aspect ratio.", "outputProfile.aspectRatio");

  const scenePlans = manifest.motion.scenes;
  uniqueIds(issues, scenePlans, "DUPLICATE_SCENE_PLAN_ID", "motion.scenes");
  const documentScenes = new Map(document.scenes.map((scene) => [scene.id, scene]));
  const instructionToScenePlan = new Map<string, string>();
  const instructions: MotionInstruction[] = [];

  scenePlans.forEach((plan, planIndex) => {
    const scene = documentScenes.get(plan.sourceSceneId);
    if (!scene) {
      add(issues, "INVALID_SCENE_REFERENCE", `Unknown source scene ${plan.sourceSceneId}.`, `motion.scenes[${planIndex}].sourceSceneId`);
      return;
    }
    if (!plan.learningGoal?.trim()) add(issues, "MISSING_LEARNING_GOAL", `Scene plan ${plan.id} requires learningGoal.`, `motion.scenes[${planIndex}].learningGoal`);
    plan.instructions.forEach((instruction, instructionIndex) => {
      instructions.push(instruction);
      if (instructionToScenePlan.has(instruction.id)) {
        add(issues, "DUPLICATE_MOTION_ID", `Duplicate motion instruction ID: ${instruction.id}`, `motion.scenes[${planIndex}].instructions[${instructionIndex}].id`);
      }
      instructionToScenePlan.set(instruction.id, plan.id);
      validateInstruction(instruction, scene, document, issues, `motion.scenes[${planIndex}].instructions[${instructionIndex}]`);
    });
  });

  uniqueIds(issues, manifest.narration.cues, "DUPLICATE_NARRATION_CUE_ID", "narration.cues");
  const narrationIds = new Set(manifest.narration.cues.map((cue) => cue.id));
  manifest.narration.cues.forEach((cue, index) => {
    if (!cue.text?.trim()) add(issues, "EMPTY_NARRATION", `Narration cue ${cue.id} must have text.`, `narration.cues[${index}].text`);
    if (cue.durationHintSeconds !== undefined && (!Number.isFinite(cue.durationHintSeconds) || cue.durationHintSeconds < 0)) {
      add(issues, "INVALID_NARRATION_DURATION_HINT", `Narration cue ${cue.id} has invalid durationHintSeconds.`, `narration.cues[${index}].durationHintSeconds`);
    }
  });

  uniqueIds(issues, manifest.timeline.cues, "DUPLICATE_TIMELINE_CUE_ID", "timeline.cues");
  const scenePlanIds = new Set(scenePlans.map((plan) => plan.id));
  const scheduledMotion = new Map<string, number>();
  const scheduledNarration = new Map<string, number>();
  const orderedCues = [...manifest.timeline.cues].sort((a, b) => a.startSeconds - b.startSeconds || a.id.localeCompare(b.id));

  manifest.timeline.cues.forEach((cue, cueIndex) => {
    validateTimelineCue(cue, issues, `timeline.cues[${cueIndex}]`);
    if (!scenePlanIds.has(cue.scenePlanId)) add(issues, "INVALID_SCENE_PLAN_REFERENCE", `Unknown scenePlanId ${cue.scenePlanId}.`, `timeline.cues[${cueIndex}].scenePlanId`);
    for (const motionId of cue.motionInstructionIds ?? []) {
      const owningPlan = instructionToScenePlan.get(motionId);
      if (!owningPlan) add(issues, "INVALID_MOTION_REFERENCE", `Unknown motion instruction ${motionId}.`, `timeline.cues[${cueIndex}].motionInstructionIds`);
      else if (owningPlan !== cue.scenePlanId) add(issues, "MOTION_SCENE_PLAN_MISMATCH", `Motion ${motionId} belongs to ${owningPlan}, not ${cue.scenePlanId}.`, `timeline.cues[${cueIndex}]`);
      scheduledMotion.set(motionId, (scheduledMotion.get(motionId) ?? 0) + 1);
    }
    if (cue.narrationCueId) {
      if (!narrationIds.has(cue.narrationCueId)) add(issues, "INVALID_NARRATION_REFERENCE", `Unknown narration cue ${cue.narrationCueId}.`, `timeline.cues[${cueIndex}].narrationCueId`);
      scheduledNarration.set(cue.narrationCueId, (scheduledNarration.get(cue.narrationCueId) ?? 0) + 1);
    }
  });

  for (let index = 1; index < orderedCues.length; index += 1) {
    const previous = orderedCues[index - 1];
    const current = orderedCues[index];
    const previousEnd = previous.startSeconds + previous.durationSeconds + (previous.pauseAfterSeconds ?? 0);
    if (current.startSeconds < previousEnd && !previous.allowOverlap && !current.allowOverlap) {
      add(issues, "UNDECLARED_TIMELINE_OVERLAP", `Timeline cues ${previous.id} and ${current.id} overlap without allowOverlap.`, "timeline.cues");
    }
  }

  for (const instruction of instructions) {
    const count = scheduledMotion.get(instruction.id) ?? 0;
    if (count === 0) add(issues, "UNSCHEDULED_MOTION", `Motion instruction ${instruction.id} is never scheduled.`, "timeline.cues");
    if (count > 1) add(issues, "MOTION_SCHEDULED_MULTIPLE_TIMES", `Motion instruction ${instruction.id} is scheduled ${count} times.`, "timeline.cues");
  }
  for (const narration of manifest.narration.cues) {
    const count = scheduledNarration.get(narration.id) ?? 0;
    if (count === 0) add(issues, "UNSCHEDULED_NARRATION", `Narration cue ${narration.id} is never scheduled.`, "timeline.cues");
    if (count > 1) add(issues, "NARRATION_SCHEDULED_MULTIPLE_TIMES", `Narration cue ${narration.id} is scheduled ${count} times.`, "timeline.cues");
  }

  const engines = new Set(["pdflatex", "xelatex", "lualatex"]);
  if (!engines.has(manifest.latex.engine)) add(issues, "UNSUPPORTED_LATEX_ENGINE", `Unsupported LaTeX engine ${String(manifest.latex.engine)}.`, "latex.engine");
  if (!manifest.latex.templateId?.trim()) add(issues, "MISSING_LATEX_TEMPLATE", "LaTeX templateId is required.", "latex.templateId");

  return issues.length ? fail(issues) : pass();
}
