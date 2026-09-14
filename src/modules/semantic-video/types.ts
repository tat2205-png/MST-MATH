import type { EntityId, ExpressionId, MathDocument } from "../math-ir/types.js";

export const SEMANTIC_VIDEO_SCHEMA_VERSION = "semantic-video/v1" as const;
export type SemanticVideoSchemaVersion = typeof SEMANTIC_VIDEO_SCHEMA_VERSION;

export const MOTION_PRIMITIVES = [
  "REVEAL",
  "HIDE",
  "HIGHLIGHT",
  "TRANSFORM_MATH",
  "CONSTRUCT",
  "MOVE_POINT",
  "TRACE",
  "COMPARE",
  "FOCUS_CAMERA",
  "SHOW_RELATION",
  "SHOW_STEP",
  "PAUSE_FOR_THINK",
  "REVEAL_ANSWER",
] as const;

export type MotionPrimitive = (typeof MOTION_PRIMITIVES)[number];

export type PedagogicalIntent =
  | "ORIENT"
  | "ANALYZE"
  | "STRATEGY"
  | "DERIVE"
  | "VERIFY"
  | "CONCLUDE"
  | "THINK";

/**
 * Renderer-neutral semantic motion instruction.
 *
 * This contract deliberately describes mathematical/pedagogical intent rather
 * than Manim animation names. Renderer adapters decide whether REVEAL becomes
 * Write/Create/FadeIn, for example.
 */
export interface MotionInstruction {
  id: string;
  primitive: MotionPrimitive;
  sourceSceneId: string;
  semanticPurpose: string;
  pedagogicalIntent: PedagogicalIntent;
  targetEntityIds?: EntityId[];
  targetExpressionIds?: ExpressionId[];
  fromExpressionId?: ExpressionId;
  toExpressionId?: ExpressionId;
  relationId?: string;
  constraintId?: string;
  durationHintSeconds?: number;
  parameters?: Record<string, unknown>;
}

export interface MotionScenePlan {
  id: string;
  sourceSceneId: string;
  learningGoal: string;
  instructions: MotionInstruction[];
}

export interface MotionIR {
  schemaVersion: SemanticVideoSchemaVersion;
  id: string;
  mathDocumentId: string;
  scenes: MotionScenePlan[];
  metadata?: Record<string, unknown>;
}

export type NarrationVoiceTone = "formal_teacher" | "enthusiastic" | "step_by_step";

export interface NarrationCue {
  id: string;
  text: string;
  language?: string;
  voiceTone: NarrationVoiceTone;
  durationHintSeconds?: number;
  audioAssetId?: string;
  metadata?: Record<string, unknown>;
}

export interface NarrationPlan {
  id: string;
  cues: NarrationCue[];
  metadata?: Record<string, unknown>;
}

/**
 * TimelineIR is the synchronization authority between semantic motion and
 * narration. It never stores renderer-specific animation objects.
 */
export interface TimelineCue {
  id: string;
  scenePlanId: string;
  startSeconds: number;
  durationSeconds: number;
  motionInstructionIds: string[];
  narrationCueId?: string;
  pauseAfterSeconds?: number;
  allowOverlap?: boolean;
  metadata?: Record<string, unknown>;
}

export interface TimelineIR {
  schemaVersion: SemanticVideoSchemaVersion;
  id: string;
  fps: number;
  cues: TimelineCue[];
  metadata?: Record<string, unknown>;
}

export type OutputProfileId =
  | "V01_TEACHER_CLEAN_16_9"
  | "V02_SOCIAL_MATH_9_16"
  | "V03_TEACHER_OVERLAY";

export type OutputProfileStage = "P0_DEMO" | "P1_PILOT";

export interface OutputSafeArea {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface OutputProfile {
  id: OutputProfileId;
  name: string;
  width: number;
  height: number;
  fps: number;
  aspectRatio: "16:9" | "9:16";
  stage: OutputProfileStage;
  safeArea: OutputSafeArea;
  teacherOverlay: boolean;
  captions: "optional" | "recommended";
  metadata?: Record<string, unknown>;
}

export type LatexEngine = "pdflatex" | "xelatex" | "lualatex";

export interface LatexBackendConfig {
  engine: LatexEngine;
  templateId: string;
  unicodeText: boolean;
  failOnLatexError: boolean;
  metadata?: Record<string, unknown>;
}

export type RendererTarget = "manim" | "html" | "slides";

export interface RenderManifest {
  schemaVersion: SemanticVideoSchemaVersion;
  id: string;
  mathDocumentId: string;
  motion: MotionIR;
  narration: NarrationPlan;
  timeline: TimelineIR;
  outputProfile: OutputProfile;
  renderer: RendererTarget;
  latex: LatexBackendConfig;
  metadata?: Record<string, unknown>;
}

export interface RenderArtifact {
  manifestId: string;
  renderer: RendererTarget;
  format: "mp4" | "html" | "pptx";
  uri: string;
  fingerprint?: string;
  metadata?: Record<string, unknown>;
}

/** Renderer boundary. Manim is one adapter, never the source of truth. */
export interface SemanticVideoRenderer {
  readonly target: RendererTarget;
  render(manifest: RenderManifest, outputDirectory: string): Promise<RenderArtifact>;
}

export interface SemanticVideoIssue {
  code: string;
  message: string;
  path?: string;
}

export interface SemanticVideoValidationResult {
  status: "PASS" | "FAIL";
  issues: SemanticVideoIssue[];
}

export interface SemanticVideoCompileInput {
  id: string;
  document: MathDocument;
  motion: MotionIR;
  narration: NarrationPlan;
  timeline: TimelineIR;
  outputProfileId: OutputProfileId;
  renderer?: RendererTarget;
  latex?: Partial<LatexBackendConfig>;
  metadata?: Record<string, unknown>;
}

export type SemanticVideoCompileResult =
  | {
      status: "PASS";
      manifest: RenderManifest;
      canonicalJson: string;
      fingerprint: string;
      issues: [];
    }
  | {
      status: "FAIL";
      issues: SemanticVideoIssue[];
    };
