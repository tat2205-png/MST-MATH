/**
 * STEP 7 — NARRATION / TTS / AUDIO SYNC TYPES & SCHEMAS
 * Edge TTS (vi-VN-NamMinhNeural), Cue-based timeline, FFprobe duration scan,
 * and Manim animation/camera synchronization models.
 */

export type NarrationCueStatus =
  | "DRAFT"
  | "AUDIO_PENDING"
  | "AUDIO_READY"
  | "SYNCED"
  | "FAILED";

export interface VisualAction {
  targetId: string;
  action: "appear" | "write" | "transform" | "highlight" | "fade" | "indicate";
  offsetSeconds: number; // relative to cue start
  durationSeconds?: number;
  params?: Record<string, any>;
}

export interface CameraAction {
  type: "move" | "zoom" | "settle" | "reset";
  targetRegion?: string;
  point?: [number, number, number];
  zoomLevel?: number;
  offsetSeconds: number;
  durationSeconds?: number;
}

export interface NarrationCue {
  id: string; // Deterministic: s01_01, s01_02, s02_01...
  sceneId: string;
  text: string; // Original display text
  ttsText: string; // Normalized TTS spoken pronunciation text
  voice?: string; // Default: vi-VN-NamMinhNeural
  rate?: string; // Default: -5%
  volume?: string; // Default: +0%
  pitch?: string; // Default: +0Hz
  audioPath?: string; // Path: audio/s01_01.mp3
  audioBase64?: string; // Base64 for web playback in UI
  audioUrl?: string; // URL for web playback
  fileSizeBytes?: number;
  startTime?: number; // In seconds
  endTime?: number;
  duration?: number; // Exact duration in seconds measured via FFprobe
  holdDuration?: number; // Minimum hold after narration (0.15 - 0.50s)
  visualTargets?: string[];
  visualActions?: VisualAction[];
  cameraTarget?: string;
  cameraActions?: CameraAction[];
  status: NarrationCueStatus;
  error?: string;
  fingerprint?: string; // SHA-256 for caching
}

export interface NarrationTimeline {
  totalDuration: number;
  cues: NarrationCue[];
  gapSeconds: number; // DEFAULT_CUE_GAP = 0.15s
  createdAt: string;
  updatedAt: string;
}

export interface NarrationQASummary {
  ttsBackend: "Microsoft Edge TTS";
  ttsVoice: "vi-VN-NamMinhNeural" | string;
  ttsRate: string;
  edgeTtsQa: "PASS" | "FAIL";
  ttsGenerationQa: "PASS" | "FAIL";
  audioFileQa: "PASS" | "FAIL";
  audioDurationQa: "PASS" | "FAIL";
  pronunciationQa: "PASS" | "FAIL";
  cueOrderQa: "PASS" | "FAIL";
  timelineQa: "PASS" | "FAIL";
  animationSyncQa: "PASS" | "FAIL";
  cameraSyncQa: "PASS" | "FAIL";
  audioVideoSyncQa: "PASS" | "FAIL";
  mathRegressionQa: "PASS" | "FAIL";
  graphRegressionQa: "PASS" | "FAIL";
  geometryLockQa: "PASS" | "FAIL";
  skillRegressionQa: "PASS" | "FAIL";
  localBridgeRegressionQa: "PASS" | "FAIL";
  openclawRepairRegressionQa: "PASS" | "FAIL";
  buildQa: "PASS" | "FAIL";
  finalStatus: "PASS" | "FAIL" | "NOT_TESTED";
}

export interface NarrationProjectState {
  lessonId: string;
  title: string;
  cues: NarrationCue[];
  timeline?: NarrationTimeline;
  qaSummary: NarrationQASummary;
  lastUpdated: string;
}

export const DEFAULT_TTS_VOICE = "vi-VN-NamMinhNeural";
export const DEFAULT_TTS_RATE = "-5%";
export const DEFAULT_TTS_VOLUME = "+0%";
export const DEFAULT_TTS_PITCH = "+0Hz";
export const DEFAULT_CUE_GAP = 0.15; // 0.15s gap between cues
