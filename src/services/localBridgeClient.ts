/**
 * Local Render Bridge Client for MATH AI VIDEO STUDIO (Step 6B)
 * 
 * Communicates safely with the local bridge service at http://127.0.0.1:8765.
 * Strictly adheres to security boundaries:
 *  - Never connects directly to OpenClaw Gateway port 18789.
 *  - Enforces project manifest path validation (no "../", absolute paths, UNC, drive letters).
 *  - Token is stored in sessionStorage by default; never logged, never sent to Gemini/LLM.
 *  - Distinguishes between browser PNA/CORS blocks (LOCAL_BRIDGE_BROWSER_BLOCKED) and offline status.
 *  - Honors Manim Runtime QA vs Frame QA boundary (Frame QA is NOT TESTED automatically).
 */

import {
  DEFAULT_LOCAL_BRIDGE_URL,
  LOCAL_BRIDGE_CONFIG,
  LOCAL_BRIDGE_ERRORS,
} from "../config/localBridgeConfig.js";
import {
  LocalBridgeHealth,
  LocalCapabilities,
  RenderJobRequest,
  RenderJobResponse,
  RenderArtifact,
  validateProjectManifest,
  ManimRuntimeQAStatus,
  FrameQAStatus,
  FinalRenderStatus,
  SMOKE_TEST_MANIFEST,
  SMOKE_TEST_SCENE_CODE,
  SmokeTestReport,
  SmokeTestQAIndicators,
  SmokeTestStage,
  SmokeTestDiagnostics,
  JobVisualFrameQAReport,
  RepairSessionReport,
  REPAIR_SMOKE_TEST_MANIFEST,
  FrameQAIssue,
} from "../types/localRender.js";

export type StoragePreference = "session" | "local";

export class LocalBridgeClient {
  private bridgeUrl: string;
  private sessionToken: string | null = null;
  private storagePreference: StoragePreference = "session";

  constructor(customUrl?: string) {
    this.bridgeUrl = customUrl || DEFAULT_LOCAL_BRIDGE_URL;

    // Load stored token & custom URL if in browser environment
    if (typeof window !== "undefined") {
      try {
        // 1. Load Storage Preference (defaults to session)
        const storedPref = (window.localStorage?.getItem(LOCAL_BRIDGE_CONFIG.storageKeyStorageType) ||
          window.sessionStorage?.getItem(LOCAL_BRIDGE_CONFIG.storageKeyStorageType)) as StoragePreference | null;
        if (storedPref === "local" || storedPref === "session") {
          this.storagePreference = storedPref;
        }

        // 2. Load Bridge URL (sessionStorage prioritized, then localStorage)
        const storedUrl =
          window.sessionStorage?.getItem(LOCAL_BRIDGE_CONFIG.storageKeyUrl) ||
          window.localStorage?.getItem(LOCAL_BRIDGE_CONFIG.storageKeyUrl);
        if (storedUrl) this.bridgeUrl = storedUrl;

        // 3. Load Token (sessionStorage prioritized; never logged)
        const sessionStoredToken = window.sessionStorage?.getItem(LOCAL_BRIDGE_CONFIG.storageKeyToken);
        const localStoredToken = window.localStorage?.getItem(LOCAL_BRIDGE_CONFIG.storageKeyToken);
        if (sessionStoredToken) {
          this.sessionToken = sessionStoredToken;
        } else if (localStoredToken) {
          this.sessionToken = localStoredToken;
        }
      } catch {
        // Storage access restricted in some sandboxed iframes
      }
    }
  }

  public getBridgeUrl(): string {
    return this.bridgeUrl;
  }

  public setBridgeUrl(url: string): void {
    this.bridgeUrl = url.trim() || DEFAULT_LOCAL_BRIDGE_URL;
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage?.setItem(LOCAL_BRIDGE_CONFIG.storageKeyUrl, this.bridgeUrl);
        if (this.storagePreference === "local") {
          window.localStorage?.setItem(LOCAL_BRIDGE_CONFIG.storageKeyUrl, this.bridgeUrl);
        }
      } catch {
        // Storage access restricted
      }
    }
  }

  public getStoragePreference(): StoragePreference {
    return this.storagePreference;
  }

  public setStoragePreference(pref: StoragePreference): void {
    this.storagePreference = pref;
    if (typeof window !== "undefined") {
      try {
        window.localStorage?.setItem(LOCAL_BRIDGE_CONFIG.storageKeyStorageType, pref);
        window.sessionStorage?.setItem(LOCAL_BRIDGE_CONFIG.storageKeyStorageType, pref);
      } catch {
        // Storage access restricted
      }
    }
  }

  public getSessionToken(): string | null {
    return this.sessionToken;
  }

  /**
   * Store token locally. Never logs or transmits to Gemini.
   */
  public setSessionToken(token: string | null, storageType: StoragePreference = this.storagePreference): void {
    this.sessionToken = token ? token.trim() : null;
    this.storagePreference = storageType;

    if (typeof window !== "undefined") {
      try {
        if (this.sessionToken) {
          if (storageType === "session") {
            window.sessionStorage?.setItem(LOCAL_BRIDGE_CONFIG.storageKeyToken, this.sessionToken);
            window.localStorage?.removeItem(LOCAL_BRIDGE_CONFIG.storageKeyToken);
          } else {
            window.localStorage?.setItem(LOCAL_BRIDGE_CONFIG.storageKeyToken, this.sessionToken);
            window.sessionStorage?.removeItem(LOCAL_BRIDGE_CONFIG.storageKeyToken);
          }
        } else {
          window.sessionStorage?.removeItem(LOCAL_BRIDGE_CONFIG.storageKeyToken);
          window.localStorage?.removeItem(LOCAL_BRIDGE_CONFIG.storageKeyToken);
        }
      } catch {
        // Storage access restricted
      }
    }
  }

  /**
   * Public headers for /health (NO token sent)
   */
  public getPublicHeaders(): Record<string, string> {
    return {
      "Accept": "application/json",
    };
  }

  /**
   * Protected API headers for /api/* (Includes Authorization Bearer if token present)
   */
  public getApiHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
    if (this.sessionToken) {
      headers["Authorization"] = `Bearer ${this.sessionToken}`;
    }
    return headers;
  }

  /**
   * Check health of local render bridge: GET /health (NO token required)
   * Accurately detects Private Network Access / CORS blocking.
   */
  public async checkHealth(): Promise<LocalBridgeHealth> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LOCAL_BRIDGE_CONFIG.healthCheckTimeoutMs);

    try {
      const response = await fetch(`${this.bridgeUrl}/health`, {
        method: "GET",
        headers: this.getPublicHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        return {
          status: "ERROR",
          message: `Local bridge trả về mã HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        status: data.status || "READY",
        bridgeVersion: data.bridgeVersion,
        capabilities: data.capabilities,
        message: data.message || "Local Bridge online",
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      clearTimeout(timer);

      // Distinguish Private Network Access / CORS block from true offline timeout
      const isHttps = typeof window !== "undefined" && window.location?.protocol === "https:";
      const isTypeError = err instanceof TypeError || err?.name === "TypeError";
      const isAbort = err?.name === "AbortError";

      // If on HTTPS or TypeError fetch failed, check if PNA or CORS blocked loopback
      if (isHttps && isTypeError) {
        return {
          status: "BROWSER_BLOCKED",
          isBrowserBlocked: true,
          message: LOCAL_BRIDGE_ERRORS.BROWSER_BLOCKED,
          capabilities: {
            python: { installed: false },
            manim: { installed: false },
            ffmpeg: { installed: false },
            openclaw: { available: false },
          },
        };
      }

      return {
        status: "DISCONNECTED",
        message: isAbort
          ? "Local bridge connection timed out (3s)"
          : "Local bridge unreachable (127.0.0.1:8765)",
        capabilities: {
          python: { installed: false },
          manim: { installed: false },
          ffmpeg: { installed: false },
          openclaw: { available: false },
        },
      };
    }
  }

  /**
   * Get capabilities of local environment
   */
  public async getCapabilities(): Promise<LocalCapabilities | null> {
    const health = await this.checkHealth();
    return health.capabilities || null;
  }

  /**
   * Create a new render job (POST /api/jobs)
   * Enforces project manifest security validation & Authorization header.
   */
  public async createRenderJob(request: RenderJobRequest): Promise<RenderJobResponse> {
    // 1. Client-side security verification
    const manifest = request.manifest || {
      projectId: request.projectId,
      projectName: request.projectName || "Math Animation",
      entryFile: request.entryFile || "main.py",
      sceneName: request.sceneName || request.scene || "MathLessonScene",
      quality: request.quality || "preview",
      files: request.files || [],
    };

    const validation = validateProjectManifest(manifest);
    if (!validation.valid) {
      throw new Error(`Manifest security validation failed:\n${validation.errors.join("\n")}`);
    }

    // 2. Format request payload matching Step 6B requirement
    const payload = {
      projectId: manifest.projectId,
      projectName: manifest.projectName,
      entryFile: manifest.entryFile,
      sceneName: manifest.sceneName || request.sceneName || request.scene || "MathLessonScene",
      quality: request.quality || manifest.quality || "preview",
      action: request.action || "render",
      files: manifest.files,
      manifest: manifest,
    };

    // 3. Transmit to Local Bridge
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LOCAL_BRIDGE_CONFIG.requestTimeoutMs);

    try {
      const response = await fetch(`${this.bridgeUrl}/api/jobs`, {
        method: "POST",
        headers: this.getApiHeaders(),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (response.status === 401) {
        throw new Error(LOCAL_BRIDGE_ERRORS.TOKEN_REQUIRED_OR_INVALID);
      }

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errBody.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as RenderJobResponse;
      return this.normalizeJobResponse(data);
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === "AbortError") {
        throw new Error("Job dispatch timed out while contacting Local Bridge.");
      }
      throw err;
    }
  }

  /**
   * Fetch current job status and progress (GET /api/jobs/:jobId)
   */
  public async getRenderJob(jobId: string): Promise<RenderJobResponse> {
    if (!jobId) throw new Error("jobId is required");

    const response = await fetch(`${this.bridgeUrl}/api/jobs/${encodeURIComponent(jobId)}`, {
      method: "GET",
      headers: this.getApiHeaders(),
    });

    if (response.status === 401) {
      throw new Error(LOCAL_BRIDGE_ERRORS.TOKEN_REQUIRED_OR_INVALID);
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errBody.error || `Failed to fetch job ${jobId}`);
    }

    const data = await response.json();
    return this.normalizeJobResponse(data);
  }

  /**
   * Cancel an ongoing render job (POST /api/jobs/:jobId/cancel)
   */
  public async cancelRenderJob(jobId: string): Promise<{ success: boolean; message?: string }> {
    if (!jobId) throw new Error("jobId is required");

    const response = await fetch(`${this.bridgeUrl}/api/jobs/${encodeURIComponent(jobId)}/cancel`, {
      method: "POST",
      headers: this.getApiHeaders(),
    });

    if (response.status === 401) {
      throw new Error(LOCAL_BRIDGE_ERRORS.TOKEN_REQUIRED_OR_INVALID);
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errBody.error || `Failed to cancel job ${jobId}`);
    }

    return await response.json();
  }

  /**
   * Fetch real execution logs (GET /api/jobs/:jobId/logs)
   */
  public async getRenderLogs(jobId: string): Promise<string[]> {
    if (!jobId) return [];

    try {
      const response = await fetch(`${this.bridgeUrl}/api/jobs/${encodeURIComponent(jobId)}/logs`, {
        method: "GET",
        headers: this.getApiHeaders(),
      });

      if (response.status === 401) {
        throw new Error(LOCAL_BRIDGE_ERRORS.TOKEN_REQUIRED_OR_INVALID);
      }

      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data.logs) ? data.logs : [];
    } catch (err: any) {
      if (err.message === LOCAL_BRIDGE_ERRORS.TOKEN_REQUIRED_OR_INVALID) {
        throw err;
      }
      return [];
    }
  }

  /**
   * Fetch list of rendered artifacts: video, START.png, KEY.png, END.png, render.log
   * (GET /api/jobs/:jobId/artifacts)
   */
  public async getRenderArtifacts(jobId: string): Promise<RenderArtifact[]> {
    if (!jobId) return [];

    try {
      const response = await fetch(`${this.bridgeUrl}/api/jobs/${encodeURIComponent(jobId)}/artifacts`, {
        method: "GET",
        headers: this.getApiHeaders(),
      });

      if (response.status === 401) {
        throw new Error(LOCAL_BRIDGE_ERRORS.TOKEN_REQUIRED_OR_INVALID);
      }

      if (!response.ok) return [];
      const data = await response.json();
      const rawArtifacts = Array.isArray(data.artifacts) ? data.artifacts : [];
      return this.normalizeArtifacts(rawArtifacts);
    } catch (err: any) {
      if (err.message === LOCAL_BRIDGE_ERRORS.TOKEN_REQUIRED_OR_INVALID) {
        throw err;
      }
      return [];
    }
  }

  /**
   * Ensure Manim Runtime QA and Frame QA separation:
   * Exit Code 0 -> MANIM_RUNTIME_QA = PASS
   * FRAME_QA is strictly NOT TESTED (never set automatically to PASS)
   * FINAL STATUS = RUNTIME_NOT_TESTED
   */
  private normalizeJobResponse(job: any): RenderJobResponse {
    const isSuccess = job.status === "COMPLETED" || job.exitCode === 0;
    const isFailed = job.status === "FAILED" || (job.exitCode !== null && job.exitCode !== undefined && job.exitCode !== 0);

    const manimRuntimeQa: ManimRuntimeQAStatus = isSuccess ? "PASS" : isFailed ? "FAIL" : "PENDING";
    // Strictly preserve: FRAME QA is NOT TESTED automatically
    const frameQa: FrameQAStatus = "NOT_TESTED";
    const finalStatus: FinalRenderStatus = isSuccess ? "RUNTIME_NOT_TESTED" : isFailed ? "FAILED" : "PENDING";

    return {
      ...job,
      manimRuntimeQa,
      frameQa,
      finalStatus,
      isTechnicalSuccess: isSuccess,
      frameQAPassed: false, // Explicitly false / not auto passed
    };
  }

  /**
   * Public QA evaluator for job results
   */
  public evaluateFinalQA(job: any): RenderJobResponse {
    return this.normalizeJobResponse(job);
  }

  /**
   * Normalizes artifact list and identifies video, START.png, KEY.png, END.png, render.log
   */
  private normalizeArtifacts(artifacts: any[]): RenderArtifact[] {
    return artifacts.map((art) => {
      const name = art.name || "";
      const lower = name.toLowerCase();

      let type = art.type;
      if (lower.endsWith(".mp4") || lower.includes("video")) {
        type = "preview_video";
      } else if (lower.endsWith(".log") || lower.includes("render.log") || lower.includes("output.log")) {
        type = "render_log";
      } else if (lower.includes("start") || lower === "start.png") {
        type = "start_frame";
      } else if (lower.includes("key") || lower === "key.png") {
        type = "key_frame";
      } else if (lower.includes("end.png") || lower.startsWith("end") || lower.includes("_end") || lower === "end.png") {
        type = "end_frame";
      }

      return {
        id: art.id || `art_${Math.random().toString(36).substring(2, 9)}`,
        type: type || "render_log",
        name: art.name || "Artifact",
        pathOrUrl: art.pathOrUrl || art.url || "",
        scene: art.scene,
        sizeBytes: art.sizeBytes,
        createdAt: art.createdAt || new Date().toISOString(),
      };
    });
  }
  /**
   * Test authenticated capabilities endpoint: GET /api/capabilities (Requires Authorization: Bearer)
   * If 401 returns { authenticated: false, status: 401, error: LOCAL_BRIDGE_ERRORS.TOKEN_REQUIRED_OR_INVALID }
   */
  public async checkCapabilitiesAuth(): Promise<{
    authenticated: boolean;
    status: number;
    capabilities?: LocalCapabilities;
    error?: string;
  }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LOCAL_BRIDGE_CONFIG.healthCheckTimeoutMs || 3000);

    try {
      const response = await fetch(`${this.bridgeUrl}/api/capabilities`, {
        method: "GET",
        headers: this.getApiHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (response.status === 401) {
        return {
          authenticated: false,
          status: 401,
          error: LOCAL_BRIDGE_ERRORS.TOKEN_REQUIRED_OR_INVALID,
        };
      }

      if (!response.ok) {
        return {
          authenticated: false,
          status: response.status,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        authenticated: true,
        status: response.status,
        capabilities: data.capabilities || data,
      };
    } catch (err: any) {
      clearTimeout(timer);
      const isHttps = typeof window !== "undefined" && window.location?.protocol === "https:";
      const isTypeError = err instanceof TypeError || err?.name === "TypeError";
      if (isHttps && isTypeError) {
        return {
          authenticated: false,
          status: 0,
          error: LOCAL_BRIDGE_ERRORS.BROWSER_BLOCKED,
        };
      }
      return {
        authenticated: false,
        status: 0,
        error: err.message || "Local Bridge unreachable",
      };
    }
  }

  /**
   * STEP 6C: LIVE END-TO-END RENDER SMOKE TEST RUNNER
   * Real infrastructure smoke test against Local Render Bridge at http://127.0.0.1:8765
   */
  public async runSmokeTest(
    onProgress?: (report: SmokeTestReport) => void
  ): Promise<SmokeTestReport> {
    const startTime = Date.now();
    const report: SmokeTestReport = {
      bridgeUrl: this.bridgeUrl,
      bridgeStatus: "CONNECTING",
      capabilities: {
        python: { installed: false },
        manim: { installed: false },
        ffmpeg: { installed: false },
        openclaw: { available: false },
      },
      currentStage: "HEALTH_CHECK",
      qa: {
        localHealthQa: "PENDING",
        browserLocalBridgeQa: "PENDING",
        localAuthQa: "PENDING",
        projectManifestQa: "PENDING",
        projectTransferQa: "PENDING",
        jobCreateQa: "PENDING",
        jobPollQa: "PENDING",
        manimRuntimeQa: "PENDING",
        videoArtifactQa: "PENDING",
        logArtifactQa: "PENDING",
        startFrameQa: "PENDING",
        keyFrameQa: "PENDING",
        endFrameQa: "PENDING",
        artifactFetchQa: "PENDING",
        frameQa: "NOT_TESTED",
        smokeTestStatus: "RUNNING",
      },
      artifacts: [],
      logs: [],
      startedAt: new Date().toISOString(),
      elapsedSeconds: 0,
    };

    const updateReport = () => {
      report.elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      if (onProgress) onProgress({ ...report });
    };

    // =========================================================================
    // 1. HEALTH CHECK: GET /health (NO token required)
    // =========================================================================
    report.currentStage = "HEALTH_CHECK";
    updateReport();

    const health = await this.checkHealth();
    report.bridgeStatus = health.status;
    if (health.capabilities) {
      report.capabilities = health.capabilities;
    }

    if (health.status === "BROWSER_BLOCKED" || health.isBrowserBlocked) {
      report.qa.browserLocalBridgeQa = "FAIL";
      report.qa.localHealthQa = "FAIL";
      report.qa.smokeTestStatus = "FAIL";
      report.currentStage = "FAILED";
      report.diagnostics = {
        failureStage: "HEALTH_CHECK (BROWSER_LOCAL_BRIDGE_QA)",
        errorMessage: LOCAL_BRIDGE_ERRORS.BROWSER_BLOCKED,
      };
      updateReport();
      return report;
    }

    report.qa.browserLocalBridgeQa = "PASS";

    const pythonOk = health.capabilities?.python?.installed === true;
    const manimOk = health.capabilities?.manim?.installed === true;
    const ffmpegOk = health.capabilities?.ffmpeg?.installed === true;

    if (health.status !== "READY" && health.status !== "BUSY") {
      report.qa.localHealthQa = "FAIL";
      report.qa.smokeTestStatus = "FAIL";
      report.currentStage = "FAILED";
      report.diagnostics = {
        failureStage: "HEALTH_CHECK (LOCAL_HEALTH_QA)",
        errorMessage: health.message || "Local Bridge unreachable or not responding",
      };
      updateReport();
      return report;
    }

    if (!pythonOk || !manimOk || !ffmpegOk) {
      report.qa.localHealthQa = "FAIL";
      report.qa.smokeTestStatus = "FAIL";
      report.currentStage = "FAILED";
      report.diagnostics = {
        failureStage: "HEALTH_CHECK (CAPABILITIES_GATE)",
        errorMessage: `Missing required local engines: Python (${pythonOk ? "OK" : "MISSING"}), Manim (${manimOk ? "OK" : "MISSING"}), FFmpeg (${ffmpegOk ? "OK" : "MISSING"})`,
      };
      updateReport();
      return report;
    }

    report.qa.localHealthQa = "PASS";
    updateReport();

    // =========================================================================
    // 2. AUTHENTICATION: GET /api/capabilities (WITH Authorization: Bearer <token>)
    // =========================================================================
    report.currentStage = "AUTH_CHECK";
    updateReport();

    const authCheck = await this.checkCapabilitiesAuth();
    if (authCheck.status === 401 || !authCheck.authenticated) {
      report.qa.localAuthQa = "FAIL";
      report.qa.smokeTestStatus = "FAIL";
      report.currentStage = "FAILED";
      report.diagnostics = {
        failureStage: "AUTHENTICATION (LOCAL_AUTH_QA)",
        httpStatus: authCheck.status,
        errorMessage: authCheck.error || LOCAL_BRIDGE_ERRORS.TOKEN_REQUIRED_OR_INVALID,
      };
      updateReport();
      return report;
    }

    report.qa.localAuthQa = "PASS";
    updateReport();

    // =========================================================================
    // 3. PROJECT MANIFEST VALIDATION (Zero-traversal, exact smoke test manifest)
    // =========================================================================
    report.currentStage = "MANIFEST_VALIDATION";
    updateReport();

    const manifestValidation = validateProjectManifest(SMOKE_TEST_MANIFEST);
    if (!manifestValidation.valid) {
      report.qa.projectManifestQa = "FAIL";
      report.qa.smokeTestStatus = "FAIL";
      report.currentStage = "FAILED";
      report.diagnostics = {
        failureStage: "PROJECT_MANIFEST_VALIDATION",
        errorMessage: `Manifest validation errors: ${manifestValidation.errors.join(", ")}`,
      };
      updateReport();
      return report;
    }

    report.qa.projectManifestQa = "PASS";
    updateReport();

    // =========================================================================
    // 4. JOB CREATION: POST /api/jobs
    // =========================================================================
    report.currentStage = "JOB_CREATION";
    updateReport();

    let jobCreateRes: RenderJobResponse;
    try {
      jobCreateRes = await this.createRenderJob({
        projectId: SMOKE_TEST_MANIFEST.projectId,
        projectName: SMOKE_TEST_MANIFEST.projectName,
        entryFile: SMOKE_TEST_MANIFEST.entryFile,
        sceneName: SMOKE_TEST_MANIFEST.sceneName,
        quality: "preview",
        action: "render",
        files: SMOKE_TEST_MANIFEST.files,
        manifest: SMOKE_TEST_MANIFEST,
      });

      if (!jobCreateRes || !jobCreateRes.jobId) {
        throw new Error("Local Bridge response did not return a valid jobId");
      }

      report.jobId = jobCreateRes.jobId;
      report.jobStatus = jobCreateRes.status;
      report.qa.projectTransferQa = "PASS";
      report.qa.jobCreateQa = "PASS";
      updateReport();
    } catch (err: any) {
      report.qa.projectTransferQa = "FAIL";
      report.qa.jobCreateQa = "FAIL";
      report.qa.smokeTestStatus = "FAIL";
      report.currentStage = "FAILED";
      report.diagnostics = {
        failureStage: "JOB_CREATION (JOB_CREATE_QA)",
        errorMessage: err.message || "Failed to create render job on Local Bridge",
      };
      updateReport();
      return report;
    }

    // =========================================================================
    // 5. JOB POLLING: GET /api/jobs/:jobId (1s interval, 180s timeout)
    // =========================================================================
    report.currentStage = "JOB_POLLING";
    updateReport();

    const jobId = report.jobId;
    const maxPollAttempts = 180;
    let attempts = 0;
    let latestJob: RenderJobResponse = jobCreateRes;
    let pollSucceeded = false;

    while (attempts < maxPollAttempts) {
      attempts++;
      await new Promise((r) => setTimeout(r, 1000));

      try {
        const [jobStatus, logs] = await Promise.all([
          this.getRenderJob(jobId),
          this.getRenderLogs(jobId),
        ]);

        latestJob = jobStatus;
        report.jobStatus = jobStatus.status;
        report.exitCode = jobStatus.exitCode;
        if (logs && logs.length > 0) report.logs = logs;

        updateReport();

        if (
          jobStatus.status === "COMPLETED" ||
          jobStatus.status === "FAILED" ||
          jobStatus.status === "CANCELLED"
        ) {
          pollSucceeded = true;
          break;
        }
      } catch (err: any) {
        report.qa.jobPollQa = "FAIL";
        report.qa.smokeTestStatus = "FAIL";
        report.currentStage = "FAILED";
        report.diagnostics = {
          failureStage: "JOB_POLLING (JOB_POLL_QA)",
          jobId,
          errorMessage: err.message || "Polling connection broken",
          recentLogs: report.logs.slice(-30),
        };
        updateReport();
        return report;
      }
    }

    if (!pollSucceeded) {
      report.qa.jobPollQa = "FAIL";
      report.qa.smokeTestStatus = "FAIL";
      report.currentStage = "FAILED";
      report.diagnostics = {
        failureStage: "JOB_POLLING (TIMEOUT)",
        jobId,
        errorMessage: `Render job did not reach terminal state within 180s timeout`,
        recentLogs: report.logs.slice(-30),
      };
      updateReport();
      return report;
    }

    report.qa.jobPollQa = "PASS";
    updateReport();

    // =========================================================================
    // 6. RUNTIME GATE: exitCode === 0 & status === "COMPLETED"
    // =========================================================================
    report.currentStage = "RUNTIME_GATE";
    updateReport();

    const exitCodeIsZero = latestJob.exitCode === 0;
    const isCompleted = latestJob.status === "COMPLETED";

    if (!exitCodeIsZero || !isCompleted) {
      report.qa.manimRuntimeQa = "FAIL";
      report.qa.smokeTestStatus = "FAIL";
      report.currentStage = "FAILED";
      report.diagnostics = {
        failureStage: "RUNTIME_GATE (MANIM_RUNTIME_QA)",
        jobId,
        exitCode: latestJob.exitCode,
        errorMessage: latestJob.error || `Manim execution failed with exit code ${latestJob.exitCode}`,
        recentLogs: report.logs.slice(-30),
      };
      updateReport();
      return report;
    }

    report.qa.manimRuntimeQa = "PASS";
    updateReport();

    // =========================================================================
    // 7. FETCH ARTIFACTS: GET /api/jobs/:jobId/artifacts
    // =========================================================================
    report.currentStage = "ARTIFACT_FETCH";
    updateReport();

    try {
      const arts = await this.getRenderArtifacts(jobId);
      report.artifacts = arts;

      const hasVideo = arts.some(
        (a) => a.type === "preview_video" || a.type === "final_video" || a.name.toLowerCase().endsWith(".mp4")
      );
      const hasLog = arts.some(
        (a) => a.type === "render_log" || a.name.toLowerCase().endsWith(".log")
      );
      const hasStart = arts.some(
        (a) => a.type === "start_frame" || a.name.toUpperCase().includes("START")
      );
      const hasKey = arts.some(
        (a) => a.type === "key_frame" || a.name.toUpperCase().includes("KEY")
      );
      const hasEnd = arts.some(
        (a) => a.type === "end_frame" || a.name.toUpperCase().includes("END")
      );

      report.qa.videoArtifactQa = hasVideo ? "PASS" : "FAIL";
      report.qa.logArtifactQa = hasLog ? "PASS" : "FAIL";
      report.qa.startFrameQa = hasStart ? "PASS" : "FAIL";
      report.qa.keyFrameQa = hasKey ? "PASS" : "FAIL";
      report.qa.endFrameQa = hasEnd ? "PASS" : "FAIL";

      const allArtifactsPass = hasVideo && hasLog && hasStart && hasKey && hasEnd;
      report.qa.artifactFetchQa = allArtifactsPass ? "PASS" : "FAIL";

      if (!allArtifactsPass) {
        report.qa.smokeTestStatus = "FAIL";
        report.currentStage = "FAILED";
        report.diagnostics = {
          failureStage: "ARTIFACT_FETCH",
          jobId,
          errorMessage: `Missing artifacts: Video (${hasVideo ? "OK" : "MISSING"}), Log (${hasLog ? "OK" : "MISSING"}), START (${hasStart ? "OK" : "MISSING"}), KEY (${hasKey ? "OK" : "MISSING"}), END (${hasEnd ? "OK" : "MISSING"})`,
          recentLogs: report.logs.slice(-30),
        };
        updateReport();
        return report;
      }
    } catch (err: any) {
      report.qa.artifactFetchQa = "FAIL";
      report.qa.smokeTestStatus = "FAIL";
      report.currentStage = "FAILED";
      report.diagnostics = {
        failureStage: "ARTIFACT_FETCH",
        jobId,
        errorMessage: err.message || "Failed to fetch job artifacts from Local Bridge",
        recentLogs: report.logs.slice(-30),
      };
      updateReport();
      return report;
    }

    // =========================================================================
    // 8. FRAME QA GATE: Strictly NOT TESTED in Step 6C
    // =========================================================================
    report.qa.frameQa = "NOT_TESTED";

    // =========================================================================
    // 9. FINAL SMOKE TEST STATUS: PASS (Infrastructure validated)
    // =========================================================================
    report.qa.smokeTestStatus = "PASS";
    report.currentStage = "COMPLETED";
    report.completedAt = new Date().toISOString();
    updateReport();

    return report;
  }

  /**
   * STEP 6D: VISUAL FRAME QA RUNNER
   * Calls the Math AI Video Studio backend Visual Frame QA Engine
   * Passes job information, and local bridge token for server-side direct download.
   */
  public async runVisualFrameQA(
    jobId: string,
    context?: {
      problemIR?: any;
      solution?: any;
      visualSpec?: any;
      videoSpec?: any;
      rawFrames?: {
        start?: { base64: string; mimeType?: string };
        key?: { base64: string; mimeType?: string };
        end?: { base64: string; mimeType?: string };
      };
    }
  ): Promise<JobVisualFrameQAReport> {
    if (!jobId && !context?.rawFrames) {
      throw new Error("Missing jobId or rawFrames for Visual Frame QA");
    }

    const payload = {
      jobId,
      bridgeUrl: this.bridgeUrl,
      localBridgeToken: this.sessionToken,
      problemIR: context?.problemIR,
      solution: context?.solution,
      visualSpec: context?.visualSpec,
      videoSpec: context?.videoSpec,
      rawFrames: context?.rawFrames,
    };

    const response = await fetch("/api/video/frame-qa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${response.status}: Failed to run Visual Frame QA`);
    }

    const data = await response.json();
    return data.report;
  }

  /**
   * STEP 6E: Check OpenClaw Connection Status via Server Endpoint
   */
  public async checkOpenClawStatus(): Promise<{ status: "ACTIVE" | "UNAVAILABLE"; version?: string; error?: string }> {
    try {
      const res = await fetch("/api/openclaw/status", { method: "GET" });
      if (!res.ok) {
        return { status: "UNAVAILABLE", error: `HTTP ${res.status}` };
      }
      const data = await res.json();
      return data.status || { status: "UNAVAILABLE" };
    } catch (err: any) {
      return { status: "UNAVAILABLE", error: err.message };
    }
  }

  /**
   * STEP 6E: OPENCLAW SAFE AUTO-REPAIR LOOP
   * Triggers the server-side repair loop (up to 3 attempts, with sandbox validation and snapshot rollback)
   */
  public async runAutoRepair(params: {
    sceneName: string;
    projectManifest: any;
    initialFrameReport?: JobVisualFrameQAReport;
    initialIssues?: FrameQAIssue[];
    mathContext?: {
      problemText?: string;
      formulas?: string[];
      geometryFacts?: string[];
      graphSpec?: any;
    };
  }): Promise<RepairSessionReport> {
    const payload = {
      sceneName: params.sceneName,
      projectManifest: params.projectManifest,
      initialFrameReport: params.initialFrameReport,
      initialIssues: params.initialIssues,
      bridgeUrl: this.bridgeUrl,
      localBridgeToken: this.sessionToken,
      mathContext: params.mathContext,
    };

    const response = await fetch("/api/video/auto-repair", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${response.status}: Auto-repair execution failed`);
    }

    const data = await response.json();
    return data.report;
  }

  /**
   * STEP 6E: Run Repair Smoke Test
   * Runs the dedicated DEV test scene RepairSmokeTest through the full safe auto-repair cycle
   */
  public async runRepairSmokeTest(): Promise<RepairSessionReport> {
    const response = await fetch("/api/video/repair-smoke-test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bridgeUrl: this.bridgeUrl,
        localBridgeToken: this.sessionToken,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${response.status}: Repair Smoke Test failed`);
    }

    const data = await response.json();
    return data.report;
  }
}

// Export singleton instance
export const localBridgeClient = new LocalBridgeClient();

