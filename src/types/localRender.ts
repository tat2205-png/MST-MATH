/**
 * Types & Interfaces for MATH AI VIDEO STUDIO Local Render Bridge (Step 6B)
 * Architecture: AI Studio / Browser -> Local Bridge (http://127.0.0.1:8765) -> Python / Manim / OpenClaw Gateway (127.0.0.1:18789)
 */

export type LocalRenderStatus =
  | "DISCONNECTED"
  | "CONNECTING"
  | "READY"
  | "BUSY"
  | "ERROR"
  | "BROWSER_BLOCKED"
  | "AUTH_ERROR";

export type RenderJobStatus =
  | "QUEUED"
  | "VALIDATING"
  | "RENDERING"
  | "FRAME_QA"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface LocalCapabilities {
  python: {
    installed: boolean;
    version?: string;
  };
  manim: {
    installed: boolean;
    version?: string;
  };
  ffmpeg: {
    installed: boolean;
    version?: string;
  };
  openclaw: {
    available: boolean;
    version?: string;
  };
  gpu?: {
    available: boolean;
    name?: string;
  };
}

export interface LocalBridgeHealth {
  status: LocalRenderStatus;
  bridgeVersion?: string;
  capabilities?: LocalCapabilities;
  message?: string;
  timestamp?: string;
  isBrowserBlocked?: boolean;
  isAuthError?: boolean;
}

export interface ProjectFile {
  path: string;
  content: string;
}

export interface ProjectManifest {
  projectId: string;
  projectName: string;
  entryFile: string;
  sceneName?: string;
  quality?: "preview" | "low" | "medium" | "high" | "4k";
  action?: "render" | "validate" | "extract_frames";
  files: ProjectFile[];
  videoStyle?: string;
  metadata?: Record<string, any>;
}

export interface RenderJobRequest {
  projectId: string;
  projectName?: string;
  entryFile?: string;
  sceneName?: string;
  scene?: string;
  quality?: "preview" | "low" | "medium" | "high" | "4k";
  action: "render" | "validate" | "extract_frames";
  files?: ProjectFile[];
  manifest?: ProjectManifest;
}

export type ArtifactType =
  | "preview_video"
  | "final_video"
  | "start_frame"
  | "key_frame"
  | "end_frame"
  | "render_log"
  | "qa_report";

export interface RenderArtifact {
  id?: string;
  type: ArtifactType;
  name: string;
  pathOrUrl: string;
  scene?: string;
  sizeBytes?: number;
  mimeType?: string;
  previewDataUrl?: string;
  createdAt: string;
}

export type ManimRuntimeQAStatus = "PASS" | "FAIL" | "PENDING";
export type FrameQAStatus = "PASS" | "FAIL" | "NOT_TESTED" | "NEED_SOURCE_VERIFICATION";
export type FinalRenderStatus = "RUNTIME_NOT_TESTED" | "RENDER_READY" | "QA_FAILED" | "FAILED" | "PENDING" | "NEED_SOURCE_VERIFICATION";

export type FrameQAIssueCategory =
  | "FRAME_INPUT_ERROR"
  | "MATH_ERROR"
  | "GEOMETRY_ERROR"
  | "GRAPH_ERROR"
  | "LAYOUT_ERROR"
  | "CAMERA_ERROR"
  | "TEXT_ERROR"
  | "ASSET_ERROR";

export type FrameQAIssueSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type FrameQARepairClass = "SAFE_AUTO_REPAIR" | "REVIEW_REQUIRED" | "INFRASTRUCTURE_ERROR";

export interface FrameQAIssue {
  category: FrameQAIssueCategory;
  severity: FrameQAIssueSeverity;
  description: string;
  affectedObject?: string;
  evidence?: string;
  repairClass: FrameQARepairClass;
}

export interface FrameQACheckList {
  textClipped?: boolean;
  formulaClipped?: boolean;
  formulaReadable?: boolean;
  textOverlap?: boolean;
  objectOverlap?: boolean;
  spacingSufficient?: boolean;
  safeMarginViolated?: boolean;
  cameraCropping?: boolean;
  fontRenderError?: boolean;
  assetDistorted?: boolean;
  mathAccurate?: boolean;
  geometryInvariantPreserved?: boolean;
  graphInvariantPreserved?: boolean;
}

export interface FrameQAResult {
  frameName: "START" | "KEY" | "END";
  status: "PASS" | "FAIL" | "NEED_SOURCE_VERIFICATION";
  analysisCompleted: boolean;
  analysisStage: "INPUT" | "ANALYZER" | "BOUNDS" | "COMPLETE";
  issues: FrameQAIssue[];
  imageUrl?: string;
  base64Image?: string;
  inputStatus?: "PASS" | "MISSING";
  inputMimeType?: string;
  checks?: FrameQACheckList;
  notes?: string;
}

export interface JobVisualFrameQAReport {
  jobId: string;
  overallStatus: FrameQAStatus;
  frames: {
    start: FrameQAResult;
    key: FrameQAResult;
    end: FrameQAResult;
  };
  summary: {
    totalIssues: number;
    lowCount: number;
    mediumCount: number;
    highCount: number;
    criticalCount: number;
    mathErrors: number;
    geometryErrors: number;
    graphErrors: number;
    layoutErrors: number;
    cameraErrors: number;
    textErrors: number;
    assetErrors: number;
  };
  qaMetrics: {
    frameInputQa?: "PASS" | "FAIL";
    startFrameFetchQa: "PASS" | "FAIL";
    keyFrameFetchQa: "PASS" | "FAIL";
    endFrameFetchQa: "PASS" | "FAIL";
    geminiVisionQa: "PASS" | "FAIL" | "NOT_RUN" | "SKIPPED";
    optionalAiVisualQa: "PASS" | "FAIL" | "SKIPPED";
    startVisualQa: "PASS" | "FAIL" | "SKIPPED";
    keyVisualQa: "PASS" | "FAIL" | "SKIPPED";
    endVisualQa: "PASS" | "FAIL" | "SKIPPED";
    mathFrameQa: "PASS" | "FAIL" | "NEED_SOURCE_VERIFICATION";
    geometryFrameQa: "PASS" | "FAIL" | "NOT_APPLICABLE";
    graphFrameQa: "PASS" | "FAIL" | "NOT_APPLICABLE";
    layoutFrameQa: "PASS" | "FAIL";
    cameraFrameQa: "PASS" | "FAIL";
    frameStructuralQa: "PASS" | "FAIL";
    mathProvenanceQa: "PASS" | "FAIL";
    frameQa: "PASS" | "FAIL" | "NEED_SOURCE_VERIFICATION";
  };
  finalStatus: FinalRenderStatus;
  timestamp: string;
}

export interface RenderJobResponse {
  jobId: string;
  status: RenderJobStatus;
  projectId?: string;
  projectName?: string;
  sceneName?: string;
  progress?: number;
  currentStage?: string;
  currentAnimation?: number;
  totalAnimations?: number;
  elapsedTimeSeconds?: number;
  logs?: string[];
  error?: string;
  artifacts?: RenderArtifact[];
  exitCode?: number | null;
  isTechnicalSuccess?: boolean;
  manimRuntimeQa?: ManimRuntimeQAStatus;
  frameQa?: FrameQAStatus;
  finalStatus?: FinalRenderStatus;
  frameQAPassed?: boolean;
}

/**
 * Path Security Validator
 * Strictly rejects any traversal attempts, absolute Windows/POSIX paths, UNC paths, and drive injection.
 */
export function validateManifestPath(filePath: string): { valid: boolean; error?: string } {
  if (!filePath || typeof filePath !== "string") {
    return { valid: false, error: "File path must be a non-empty string" };
  }

  const trimmed = filePath.trim();

  // 1. Reject traversal
  if (trimmed.includes("..") || trimmed.includes("../") || trimmed.includes("..\\")) {
    return { valid: false, error: `Path traversal not allowed: "${filePath}"` };
  }

  // 2. Reject absolute POSIX paths
  if (trimmed.startsWith("/") || trimmed.startsWith("\\")) {
    return { valid: false, error: `Absolute root paths not allowed: "${filePath}"` };
  }

  // 3. Reject Windows drive paths (e.g. C:, D:)
  if (/^[a-zA-Z]:/.test(trimmed)) {
    return { valid: false, error: `Windows drive letter paths not allowed: "${filePath}"` };
  }

  // 4. Reject UNC network paths (e.g. \\server\share)
  if (trimmed.startsWith("\\\\") || trimmed.startsWith("//")) {
    return { valid: false, error: `UNC network paths not allowed: "${filePath}"` };
  }

  // 5. Reject illegal characters for Windows/POSIX filenames
  if (/[<>:"|?*]/.test(trimmed.replace(/\//g, "").replace(/\\/g, ""))) {
    return { valid: false, error: `Illegal filename characters in path: "${filePath}"` };
  }

  return { valid: true };
}

/**
 * Validate an entire project manifest for security
 */
export function validateProjectManifest(manifest: ProjectManifest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!manifest.projectId || manifest.projectId.trim() === "") {
    errors.push("Missing projectId in project manifest");
  }

  const entryCheck = validateManifestPath(manifest.entryFile || "");
  if (!entryCheck.valid) {
    errors.push(`Invalid entryFile: ${entryCheck.error}`);
  }

  if (!manifest.files || !Array.isArray(manifest.files) || manifest.files.length === 0) {
    errors.push("Project manifest must contain at least one file in files array");
  } else {
    for (const file of manifest.files) {
      const check = validateManifestPath(file.path);
      if (!check.valid) {
        errors.push(`File "${file.path}": ${check.error}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * STEP 6C: Live End-to-End Render Smoke Test Scene Source Code
 * Exact code per prompt specification.
 */
export const SMOKE_TEST_SCENE_CODE = `from manim import *

class BridgeSmokeTest(Scene):
    def construct(self):
        title = Text("MATH AI VIDEO STUDIO")
        formula = MathTex(r"x^2-5x+6=0")

        formula.next_to(title, DOWN)

        self.play(Write(title))
        self.play(Write(formula))
        self.wait(1)
`;

export const SMOKE_TEST_MANIFEST: ProjectManifest = {
  projectId: "bridge-smoke-test",
  projectName: "Bridge Smoke Test",
  entryFile: "main.py",
  sceneName: "BridgeSmokeTest",
  quality: "preview",
  action: "render",
  files: [
    {
      path: "main.py",
      encoding: "utf8",
      content: SMOKE_TEST_SCENE_CODE,
    } as any,
  ],
};

export type SmokeTestQAStatus = "PASS" | "FAIL" | "PENDING" | "RUNNING";

export interface SmokeTestQAIndicators {
  localHealthQa: SmokeTestQAStatus;
  browserLocalBridgeQa: SmokeTestQAStatus;
  localAuthQa: SmokeTestQAStatus;
  projectManifestQa: SmokeTestQAStatus;
  projectTransferQa: SmokeTestQAStatus;
  jobCreateQa: SmokeTestQAStatus;
  jobPollQa: SmokeTestQAStatus;
  manimRuntimeQa: SmokeTestQAStatus;
  videoArtifactQa: SmokeTestQAStatus;
  logArtifactQa: SmokeTestQAStatus;
  startFrameQa: SmokeTestQAStatus;
  keyFrameQa: SmokeTestQAStatus;
  endFrameQa: SmokeTestQAStatus;
  artifactFetchQa: SmokeTestQAStatus;
  frameQa: "NOT_TESTED";
  smokeTestStatus: "PASS" | "FAIL" | "RUNNING" | "IDLE";
}

export type SmokeTestStage =
  | "IDLE"
  | "HEALTH_CHECK"
  | "AUTH_CHECK"
  | "MANIFEST_VALIDATION"
  | "JOB_CREATION"
  | "JOB_POLLING"
  | "RUNTIME_GATE"
  | "ARTIFACT_FETCH"
  | "COMPLETED"
  | "FAILED";

export interface SmokeTestDiagnostics {
  failureStage?: string;
  jobId?: string;
  httpStatus?: number;
  exitCode?: number | null;
  errorMessage?: string;
  recentLogs?: string[];
}

export interface SmokeTestReport {
  bridgeUrl: string;
  bridgeStatus: LocalRenderStatus;
  capabilities: LocalCapabilities;
  jobId?: string;
  jobStatus?: RenderJobStatus;
  exitCode?: number | null;
  currentStage: SmokeTestStage;
  qa: SmokeTestQAIndicators;
  artifacts: RenderArtifact[];
  logs: string[];
  diagnostics?: SmokeTestDiagnostics;
  startedAt?: string;
  completedAt?: string;
  elapsedSeconds?: number;
}

// ======================================================================
// STEP 6E: OPENCLAW SAFE AUTO-REPAIR LOOP TYPES
// ======================================================================

export type RepairClass = "SAFE_AUTO_REPAIR" | "REVIEW_REQUIRED";

export type RepairStatus =
  | "WAITING"
  | "ANALYZING"
  | "PATCH_PROPOSED"
  | "PATCH_REJECTED"
  | "PATCH_APPLIED"
  | "RERENDERING"
  | "QA_RUNNING"
  | "PASS"
  | "FAILED"
  | "REVIEW_REQUIRED"
  | "AUTO_REPAIR_EXHAUSTED";

export interface RepairChange {
  file: string;
  operation: "replace_range" | "replace_all" | "insert_after" | "insert_before";
  oldText: string;
  newText: string;
  category: FrameQAIssueCategory;
}

export interface RepairPatchProposal {
  status: "PATCH_PROPOSED" | "PATCH_REJECTED" | "NO_PATCH" | "REVIEW_REQUIRED";
  reason: string;
  changes: RepairChange[];
  rejectedReasons?: string[];
}

export interface RepairAttempt {
  attempt: number;
  issueIds: string[];
  filesRead: string[];
  proposedChanges: RepairChange[];
  validationStatus: "PASS" | "PATCH_REJECTED";
  validationErrors?: string[];
  renderJobId?: string;
  frameQaStatus?: string;
  runtimeStatus?: string;
  snapshotId?: string;
  timestamp: string;
}

export interface ProtectedFingerprints {
  mathHash: string;
  geometryHash?: string;
  graphHash?: string;
  problemTextHash: string;
  formulaFingerprints: string[];
}

export interface RepairSessionReport {
  sessionId: string;
  sceneName: string;
  repairBackend: "LOCAL_CLI_INFERENCE";
  initialStatus: FrameQAStatus;
  finalStatus: RepairStatus;
  totalAttempts: number;
  attempts: RepairAttempt[];
  protectedFingerprints: ProtectedFingerprints;
  qaSummary: {
    openClawRepairBackend: "LOCAL_CLI_INFERENCE";
    openClawLocalInferenceQa: "PASS" | "FAIL";
    openClawGatewayInferenceQa: "OPTIONAL_FAIL" | "NOT_REQUIRED" | "PASS";
    openClawRepairEngine: "ACTIVE" | "UNAVAILABLE";
    repairIssueClassifierQa: "PASS" | "FAIL";
    safeRepairGateQa: "PASS" | "FAIL";
    reviewRequiredGateQa: "PASS" | "FAIL";
    patchSchemaQa: "PASS" | "FAIL";
    patchPathSecurityQa: "PASS" | "FAIL";
    patchCodeSecurityQa: "PASS" | "FAIL";
    patchSafetyQa: "PASS" | "FAIL";
    backupRollbackQa: "PASS" | "FAIL";
    protectedDataMutationQa: "PASS" | "FAIL";
    maxAttemptGateQa: "PASS" | "FAIL";
    realOpenclawPatchQa: "PASS" | "FAIL";
    rerenderQa: "PASS" | "FAIL";
    postRepairFrameQa: "PASS" | "FAIL";
    mathRegressionQa: "PASS" | "FAIL";
    graphRegressionQa: "PASS" | "FAIL";
    geometryLockQa: "PASS" | "FAIL";
    localBridgeRegressionQa: "PASS" | "FAIL";
    buildQa: "PASS" | "FAIL";
  };
  currentFiles: Record<string, string>;
  error?: string;
  timestamp: string;
}

/**
 * STEP 6E: Repair Smoke Test Scene Source Code
 * Intentionally contains a SAFE layout error (title & formula overlap)
 * without altering mathematics or formula truth.
 */
export const REPAIR_SMOKE_TEST_SCENE_CODE = `from manim import *

class RepairSmokeTest(Scene):
    def construct(self):
        title = Text("MATH AI VIDEO STUDIO")
        formula = MathTex(r"x^2-5x+6=0")

        formula.move_to(title.get_center())

        self.play(Write(title))
        self.play(Write(formula))
        self.wait(1)
`;

export const REPAIR_SMOKE_TEST_MANIFEST: ProjectManifest = {
  projectId: "repair-smoke-test",
  projectName: "Repair Smoke Test",
  entryFile: "main.py",
  sceneName: "RepairSmokeTest",
  quality: "preview",
  action: "render",
  files: [
    {
      path: "main.py",
      encoding: "utf8",
      content: REPAIR_SMOKE_TEST_SCENE_CODE,
    } as any,
  ],
};

