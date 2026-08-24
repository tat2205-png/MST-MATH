import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { listProvidersStatus, geminiProvider } from "./server/providers/index.js";
import { ProblemParserService } from "./server/services/problemParser.js";
import { SolutionGeneratorService } from "./server/services/solutionGenerator.js";
import { SolutionVerifierService } from "./server/services/solutionVerifier.js";
import { VisualPlannerService } from "./server/services/visualPlanner.js";
import { VideoPlannerService } from "./server/services/videoPlanner.js";
import { ExportService } from "./server/services/exportService.js";
import { PythonManimRendererAdapter } from "./server/adapters/rendererAdapter.js";
import { IntegrationAdaptersService } from "./server/adapters/integrationAdapters.js";
import { VisualFrameQAService } from "./server/services/visualFrameQAService.js";
import { repairOrchestrator } from "./server/services/repairOrchestrator.js";
import { openClawRepairClient } from "./server/services/openclawRepairClient.js";
import { buildMasterCanvas } from "./server/services/masterCanvasPlanner.js";
import { evaluateMathGate } from "./server/services/mathVerificationGate.js";
import { REPAIR_SMOKE_TEST_MANIFEST, REPAIR_SMOKE_TEST_SCENE_CODE } from "./src/types/localRender.js";
import { registerStudioRoutes } from "./server/studio/api.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support JSON and large base64 image/document uploads (up to 50MB)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  const parserService = new ProblemParserService();
  const solutionService = new SolutionGeneratorService();
  const verifierService = new SolutionVerifierService();
  const visualService = new VisualPlannerService();
  const videoService = new VideoPlannerService();
  const exportService = new ExportService();
  const rendererAdapter = new PythonManimRendererAdapter();
  const integrationService = new IntegrationAdaptersService();
  const visualFrameQAService = new VisualFrameQAService();

  // --- API Routes ---

  registerStudioRoutes(app);

  // Health check
  app.get("/api/health", async (req, res) => {
    const geminiStatus = geminiProvider.getConnectionStatus();
    res.json({
      status: "ok",
      v1_math_core: true,
      active_provider: "gemini",
      provider_configured: geminiProvider.isConfigured(),
      provider_status: geminiStatus.status,
      current_model: geminiStatus.model,
      timestamp: new Date().toISOString(),
      service: "MATH AI STUDIO V1 Backend",
    });
  });

  // Available AI Model Providers
  app.get("/api/providers", (req, res) => {
    try {
      const providers = listProvidersStatus();
      res.json({ providers });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Real ping/test endpoint for Gemini
  app.post("/api/providers/test", async (req, res) => {
    try {
      const testResult = await geminiProvider.testConnection();
      res.json({ success: testResult.connected, ...testResult });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        connected: false,
        error: err.message || "GEMINI_CONNECTION_ERROR",
      });
    }
  });

  // Step 1: Problem Parser
  app.post("/api/pipeline/parse", async (req, res) => {
    try {
      const { text, imageBase64, mimeType, sourceType, providerId } = req.body;
      const problemIR = await parserService.parseProblem({
        text,
        imageBase64,
        mimeType,
        sourceType,
        providerId,
      });
      res.json({ success: true, problemIR });
    } catch (err: any) {
      console.error("API /api/pipeline/parse error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Step 2: Solution Generator
  app.post("/api/pipeline/solve", async (req, res) => {
    try {
      const { problemIR, providerId } = req.body;
      if (!problemIR) {
        return res.status(400).json({ error: "Missing problemIR parameter" });
      }
      const solution = await solutionService.generateSolution(problemIR, providerId);
      res.json({ success: true, solution });
    } catch (err: any) {
      console.error("API /api/pipeline/solve error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Step 3: Math Verification
  app.post("/api/pipeline/verify", async (req, res) => {
    try {
      const { problemIR, solution, providerId } = req.body;
      if (!problemIR || !solution) {
        return res.status(400).json({ error: "Missing problemIR or solution" });
      }
      const verification = await verifierService.verifySolution(problemIR, solution, providerId);
      res.json({ success: true, verification });
    } catch (err: any) {
      console.error("API /api/pipeline/verify error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Step 4: Visual Planner
  app.post("/api/pipeline/visuals", async (req, res) => {
    try {
      const { problemIR, solution, verification, providerId } = req.body;
      if (!problemIR || !solution) {
        return res.status(400).json({ error: "Missing problemIR or solution" });
      }
      const mathGate = evaluateMathGate(problemIR, solution, verification);
      if (!mathGate.allowed) {
        return res.status(409).json({ success: false, pipelineStatus: "MATH_REVIEW_REQUIRED", mathGate, visualSpec: null });
      }
      const visualSpec = await visualService.planVisuals(problemIR, solution, providerId);
      res.json({ success: true, visualSpec });
    } catch (err: any) {
      console.error("API /api/pipeline/visuals error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Step 5: Video Planner
  app.post("/api/pipeline/video", async (req, res) => {
    try {
      const { problemIR, solution, verification, visualSpec, providerId, videoStyle, skillMode, manualModules, safetyLocks } = req.body;
      if (!problemIR || !solution || !visualSpec) {
        return res.status(400).json({ error: "Missing required pipeline outputs" });
      }
      const mathGate = evaluateMathGate(problemIR, solution, verification);
      if (!mathGate.allowed) {
        return res.status(409).json({ success: false, pipelineStatus: "MATH_REVIEW_REQUIRED", mathGate, videoSpec: null });
      }
      const videoSpec = await videoService.planVideo(problemIR, solution, visualSpec, {
        providerId,
        videoStyle,
        skillMode,
        manualModules,
        safetyLocks,
      });
      res.json({ success: true, videoSpec });
    } catch (err: any) {
      console.error("API /api/pipeline/video error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Step 8A: deterministic Cinematic Master Canvas scaffold (no render)
  app.post("/api/cinematic/master-canvas", (req, res) => {
    try {
      const result = buildMasterCanvas(req.body || {});
      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error("API /api/cinematic/master-canvas error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Skills Safe Metadata API
  app.get("/api/skills/metadata", async (req, res) => {
    try {
      const safeMetadata = {
        name: "manim-cinematic-video",
        title: "MANIM CINEMATIC VIDEO",
        version: "1.0.0",
        status: "ACTIVE",
        description: "Skill chuyên sâu sản xuất video hoạt họa toán học chuẩn mực sư phạm & phong cách Cinematic Facebook.",
        availableModules: [
          {
            id: "STYLE_REFERENCE_FACEBOOK_V1",
            label: "Cinematic Style",
            description: "Chuẩn thẩm mỹ video 3Blue1Brown/Cinematic: bảng màu, độ tương phản và layout phân cấp.",
            isCoreRequired: false,
          },
          {
            id: "CAMERA_DIRECTOR",
            label: "Camera Director",
            description: "Ngôn ngữ camera điện ảnh: Overview -> Travel -> Focus -> Settle -> Read -> Pull out.",
            isCoreRequired: false,
          },
          {
            id: "VISUAL_SYSTEM",
            label: "Visual System",
            description: "Hệ thống bố cục master canvas, phân vùng đồ thị, hình học và công thức toán.",
            isCoreRequired: false,
          },
          {
            id: "MATH_GEOMETRY_QA",
            label: "Math / Geometry QA",
            description: "Bảo đảm bất biến hình học, kiểm định không suy diễn và tính đúng đắn toán học.",
            isCoreRequired: true,
          },
          {
            id: "NARRATION_SYNC",
            label: "Narration Sync",
            description: "Khớp nhịp giọng đọc giáo viên với chuyển động hình ảnh và công thức.",
            isCoreRequired: false,
          },
          {
            id: "WORKFLOW",
            label: "Workflow",
            description: "Quy trình phân đoạn scene, nhịp diễn hoạt và cấu trúc bài giảng.",
            isCoreRequired: false,
          },
        ],
      };
      res.json({ success: true, metadata: safeMetadata });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Full End-to-End Orchestrated Pipeline
  app.post("/api/pipeline/full", async (req, res) => {
    try {
      const { text, imageBase64, mimeType, sourceType, providerId, videoStyle, skillMode, manualModules, safetyLocks } = req.body;

      // 1. Parse
      const problemIR = await parserService.parseProblem({
        text,
        imageBase64,
        mimeType,
        sourceType,
        providerId,
      });

      // Block unresolved source state before generating a solution.
      if (["NEED_MORE_INFORMATION", "AMBIGUOUS", "INCONSISTENT"].includes(problemIR.status)) {
        return res.json({
          success: true,
          pipelineStatus: "MATH_REVIEW_REQUIRED",
          problemIR,
          solution: null,
          verification: null,
          mathGate: evaluateMathGate(problemIR, null, null),
          visualSpec: null,
          videoSpec: null,
        });
      }

      // 2. Solve (3-step pedagogical solution)
      const solution = await solutionService.generateSolution(problemIR, providerId);

      // 3. Verify before any visual or video planning.
      const verification = await verifierService.verifySolution(problemIR, solution, providerId);
      const mathGate = evaluateMathGate(problemIR, solution, verification);
      if (!mathGate.allowed) {
        return res.json({
          success: true,
          pipelineStatus: "MATH_REVIEW_REQUIRED",
          problemIR,
          solution,
          verification,
          mathGate,
          visualSpec: null,
          videoSpec: null,
        });
      }

      const visualSpec = await visualService.planVisuals(problemIR, solution, providerId);

      // 5. Video Plan
      const videoSpec = await videoService.planVideo(problemIR, solution, visualSpec, {
        providerId,
        videoStyle,
        skillMode,
        manualModules,
        safetyLocks,
      });

      res.json({
        success: true,
        problemIR,
        solution,
        verification,
        mathGate,
        visualSpec,
        videoSpec,
      });
    } catch (err: any) {
      console.error("API /api/pipeline/full error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Export TeX
  app.post("/api/export/latex", (req, res) => {
    try {
      const { problemIR, solution, visualSpec, verification } = req.body;
      const texCode = exportService.generateStandaloneTeX(problemIR, solution, visualSpec, verification);
      res.json({ success: true, texCode });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Video Render Worker Dispatch
  app.post("/api/video/render", async (req, res) => {
    try {
      const { videoSpec, resolution, fps } = req.body;
      const jobId = `render_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const jobStatus = await rendererAdapter.submitRenderJob({
        jobId,
        videoSpec,
        outputFormat: "mp4",
        resolution: resolution || "1080p",
        fps: fps || 30,
      });
      res.json({ success: true, jobStatus });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/video/status/:jobId", async (req, res) => {
    try {
      const status = await rendererAdapter.getJobStatus(req.params.jobId);
      res.json({ success: true, status });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Step 6D: Visual Frame QA Engine
  app.post("/api/video/frame-qa", async (req, res) => {
    try {
      const { jobId, bridgeUrl, localBridgeToken, problemIR, solution, visualSpec, videoSpec, rawFrames } = req.body;
      if (!jobId && !rawFrames) {
        return res.status(400).json({ success: false, error: "Missing jobId or rawFrames parameter" });
      }

      const report = await visualFrameQAService.runJobFrameQA({
        jobId: jobId || `qa_${Date.now()}`,
        bridgeUrl,
        localBridgeToken,
        problemIR,
        solution,
        visualSpec,
        videoSpec,
        rawFrames,
      });

      res.json({ success: true, report });
    } catch (err: any) {
      console.error("API /api/video/frame-qa error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Step 6E: OpenClaw Local Inference Status Check
  app.get("/api/openclaw/status", async (req, res) => {
    try {
      const health = await openClawRepairClient.checkHealth();
      res.json({
        success: true,
        backend: "LOCAL_CLI_INFERENCE",
        status: health.ok ? "ACTIVE" : "UNAVAILABLE", // Local inference enabled
        health,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Step 6E: OpenClaw Safe Auto-Repair Loop
  app.post("/api/video/auto-repair", async (req, res) => {
    try {
      const {
        sceneName,
        projectManifest,
        initialFrameReport,
        initialIssues,
        bridgeUrl,
        localBridgeToken,
        mathContext,
      } = req.body;

      if (!sceneName || !projectManifest) {
        return res.status(400).json({
          success: false,
          error: "Missing required parameters: sceneName and projectManifest",
        });
      }

      const report = await repairOrchestrator.executeRepairLoop({
        sceneName,
        projectManifest,
        initialFrameReport,
        initialIssues,
        bridgeUrl,
        localBridgeToken,
        mathContext,
      });

      res.json({ success: true, report });
    } catch (err: any) {
      console.error("API /api/video/auto-repair error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Step 6E: Repair Smoke Test Run
  app.post("/api/video/repair-smoke-test", async (req, res) => {
    try {
      const { bridgeUrl, localBridgeToken } = req.body;

      const report = await repairOrchestrator.executeRepairLoop({
        sceneName: "RepairSmokeTest",
        projectManifest: REPAIR_SMOKE_TEST_MANIFEST,
        initialIssues: [
          {
            category: "LAYOUT_ERROR",
            severity: "HIGH",
            description: "Formula and title overlap on center coordinates: formula.move_to(title.get_center())",
            affectedObject: "formula",
            evidence: "formula.move_to(title.get_center())",
            repairClass: "SAFE_AUTO_REPAIR",
          },
        ],
        bridgeUrl,
        localBridgeToken,
        mathContext: {
          problemText: "Giải phương trình bậc hai: x^2 - 5x + 6 = 0",
          formulas: ["x^2-5x+6=0", "x=2", "x=3"],
        },
      });

      res.json({ success: true, report });
    } catch (err: any) {
      console.error("API /api/video/repair-smoke-test error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Integrations: NotebookLM
  app.post("/api/integrations/notebooklm", async (req, res) => {
    try {
      const { problemIR, solution } = req.body;
      const studyGuide = await integrationService.generateNotebookLMGuide(problemIR, solution);
      res.json({ success: true, studyGuide });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Integrations: OpenClaw status
  app.get("/api/integrations/openclaw", (req, res) => {
    res.json({ success: true, task: integrationService.getOpenClawStatus() });
  });

  // --- Vite / Static Handling ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MATH AI VIDEO STUDIO Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
