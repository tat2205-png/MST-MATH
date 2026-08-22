import React, { useState, useEffect, useRef } from "react";
import {
  Cpu,
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCode,
  Video,
  Layers,
  Clock,
  Terminal,
  Settings,
  Shield,
  Download,
  Eye,
  EyeOff,
  StopCircle,
  Sparkles,
  Check,
  AlertCircle,
  Server,
  Film,
  Lock,
  ExternalLink,
  Image as ImageIcon,
  KeyRound,
  FileText,
} from "lucide-react";
import {
  LocalBridgeHealth,
  LocalCapabilities,
  LocalRenderStatus,
  RenderJobResponse,
  RenderArtifact,
  ProjectManifest,
  validateProjectManifest,
  ManimRuntimeQAStatus,
  FrameQAStatus,
  FinalRenderStatus,
  SmokeTestReport,
  SMOKE_TEST_SCENE_CODE,
} from "../types/localRender.js";
import { localBridgeClient, StoragePreference } from "../services/localBridgeClient.js";
import { LOCAL_BRIDGE_ERRORS } from "../config/localBridgeConfig.js";
import { VideoSpecification, ManimScene } from "../types/mathSchema.js";

interface LocalRenderPanelProps {
  videoSpec: VideoSpecification | null;
  activeScene?: ManimScene | null;
  selectedSceneIndex?: number;
  onSelectScene?: (index: number) => void;
}

export const LocalRenderPanel: React.FC<LocalRenderPanelProps> = ({
  videoSpec,
  activeScene,
  selectedSceneIndex = 0,
}) => {
  // Local Bridge Status & Capabilities State
  const [health, setHealth] = useState<LocalBridgeHealth>({
    status: "DISCONNECTED",
    message: "Chưa kết nối Local Render Bridge",
    capabilities: {
      python: { installed: false },
      manim: { installed: false },
      ffmpeg: { installed: false },
      openclaw: { available: false },
    },
  });
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [customUrl, setCustomUrl] = useState<string>(localBridgeClient.getBridgeUrl());
  const [tokenInput, setTokenInput] = useState<string>(localBridgeClient.getSessionToken() || "");
  const [showTokenPassword, setShowTokenPassword] = useState<boolean>(false);
  const [storagePref, setStoragePref] = useState<StoragePreference>(localBridgeClient.getStoragePreference());
  const [configSaved, setConfigSaved] = useState<boolean>(false);

  // Active Job State
  const [currentJob, setCurrentJob] = useState<RenderJobResponse | null>(null);
  const [jobLogs, setJobLogs] = useState<string[]>([]);
  const [artifacts, setArtifacts] = useState<RenderArtifact[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [jobError, setJobError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<boolean>(false);
  const [elapsedTimer, setElapsedTimer] = useState<number>(0);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);

  // STEP 6C: Live Smoke Test State
  const [smokeReport, setSmokeReport] = useState<SmokeTestReport | null>(null);
  const [isSmokeTesting, setIsSmokeTesting] = useState<boolean>(false);
  const [showSmokeSceneCode, setShowSmokeSceneCode] = useState<boolean>(false);

  const pollIntervalRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  // Initial Health Check on Mount
  useEffect(() => {
    checkEngineHealth();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const checkEngineHealth = async () => {
    setIsChecking(true);
    setAuthError(false);
    try {
      const res = await localBridgeClient.checkHealth();
      setHealth(res);
    } catch (err: any) {
      setHealth({
        status: "DISCONNECTED",
        message: err.message || "Local Bridge không phản hồi",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleSaveConfig = () => {
    localBridgeClient.setBridgeUrl(customUrl);
    localBridgeClient.setSessionToken(tokenInput.trim() || null, storagePref);
    setConfigSaved(true);
    setAuthError(false);
    setTimeout(() => setConfigSaved(false), 2500);
    checkEngineHealth();
  };

  // Start Job Render
  const handleStartRender = async (mode: "preview" | "current_scene" | "final") => {
    if (!videoSpec) return;
    if (health.status !== "READY") return;

    setIsSubmitting(true);
    setJobError(null);
    setAuthError(false);
    setJobLogs([]);
    setArtifacts([]);
    setElapsedTimer(0);

    const sceneName = mode === "current_scene" && activeScene
      ? activeScene.scene_id
      : "MathLessonScene";

    const quality = mode === "final" ? "high" : "preview";

    const manifest: ProjectManifest = {
      projectId: `math_proj_${Date.now()}`,
      projectName: videoSpec.video_title || "Math Lesson Animation",
      entryFile: "main.py",
      sceneName,
      quality,
      files: [
        {
          path: "main.py",
          content: videoSpec.manim_python_code,
        },
      ],
      videoStyle: videoSpec.scenes?.[0]?.style || "cinematic",
    };

    // Client-side security verification
    const validation = validateProjectManifest(manifest);
    if (!validation.valid) {
      setJobError(`Manifest bảo mật không hợp lệ: ${validation.errors.join(", ")}`);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await localBridgeClient.createRenderJob({
        projectId: manifest.projectId,
        projectName: manifest.projectName,
        entryFile: manifest.entryFile,
        sceneName: manifest.sceneName,
        quality,
        action: "render",
        files: manifest.files,
        manifest,
      });

      setCurrentJob(response);

      // Start elapsed timer
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        setElapsedTimer(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      // Start Polling Job
      startPolling(response.jobId);
    } catch (err: any) {
      if (err.message === LOCAL_BRIDGE_ERRORS.TOKEN_REQUIRED_OR_INVALID || err.message?.includes("401")) {
        setAuthError(true);
        setJobError(LOCAL_BRIDGE_ERRORS.TOKEN_REQUIRED_OR_INVALID);
        setShowConfig(true);
      } else {
        setJobError(err.message || "Không thể khởi chạy Render Job trên Local Bridge.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const startPolling = (jobId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const [jobStatus, logs, arts] = await Promise.all([
          localBridgeClient.getRenderJob(jobId),
          localBridgeClient.getRenderLogs(jobId),
          localBridgeClient.getRenderArtifacts(jobId),
        ]);

        setCurrentJob(jobStatus);
        if (logs && logs.length > 0) setJobLogs(logs);
        if (arts && arts.length > 0) setArtifacts(arts);

        if (jobStatus.status === "COMPLETED" || jobStatus.status === "FAILED" || jobStatus.status === "CANCELLED") {
          clearInterval(pollIntervalRef.current);
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
      } catch (err: any) {
        if (err.message === LOCAL_BRIDGE_ERRORS.TOKEN_REQUIRED_OR_INVALID || err.message?.includes("401")) {
          setAuthError(true);
          setJobError(LOCAL_BRIDGE_ERRORS.TOKEN_REQUIRED_OR_INVALID);
          clearInterval(pollIntervalRef.current);
        } else {
          console.error("Polling local job error:", err);
        }
      }
    }, 1500);
  };

  const handleCancelJob = async () => {
    if (!currentJob) return;
    try {
      await localBridgeClient.cancelRenderJob(currentJob.jobId);
      setCurrentJob((prev) => prev ? { ...prev, status: "CANCELLED" } : null);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    } catch (err: any) {
      alert("Lỗi huỷ job: " + err.message);
    }
  };

  const handleRunSmokeTest = async () => {
    setIsSmokeTesting(true);
    setJobError(null);
    try {
      const res = await localBridgeClient.runSmokeTest((progress) => {
        setSmokeReport({ ...progress });
      });
      setSmokeReport(res);
    } catch (err: any) {
      console.error("Smoke test error:", err);
    } finally {
      setIsSmokeTesting(false);
      checkEngineHealth();
    }
  };

  const isBridgeReady = health.status === "READY";
  const isBrowserBlocked = health.status === "BROWSER_BLOCKED" || health.isBrowserBlocked;
  const isJobRunning = currentJob && (currentJob.status === "QUEUED" || currentJob.status === "VALIDATING" || currentJob.status === "RENDERING" || currentJob.status === "FRAME_QA");

  // Find video artifact
  const videoArtifact = artifacts.find(
    (a) => a.type === "preview_video" || a.type === "final_video" || a.name.toLowerCase().endsWith(".mp4")
  );

  return (
    <div className="space-y-6">
      {/* SECTION 1: LOCAL RENDER ENGINE STATUS CARD */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-xs ${
              isBridgeReady
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : isBrowserBlocked
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : health.status === "CONNECTING"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}>
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Local Render Engine
                </h3>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                  isBridgeReady
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : isBrowserBlocked
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : health.status === "BUSY"
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : health.status === "CONNECTING"
                    ? "bg-blue-100 text-blue-800 border-blue-300"
                    : "bg-slate-100 text-slate-700 border-slate-300"
                }`}>
                  {isBrowserBlocked ? "BROWSER BLOCKED" : health.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cầu nối an toàn tới Python, Manim CE &amp; FFmpeg trên máy Windows (Local Bridge).
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="check-local-engine-btn"
              onClick={checkEngineHealth}
              disabled={isChecking}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin text-blue-600" : ""}`} />
              <span>{isChecking ? "Đang kiểm tra..." : "Kiểm tra Local Engine"}</span>
            </button>

            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 transition cursor-pointer"
              title="Cấu hình Local Bridge &amp; Token"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 401 AUTH ERROR BANNER */}
        {authError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
            <div className="flex items-start space-x-2.5">
              <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">LOCAL BRIDGE TOKEN REQUIRED / INVALID</strong>
                <p className="text-rose-800 mt-0.5 text-[11px] leading-relaxed">
                  Local Bridge yêu cầu mã Token xác thực hợp lệ cho các endpoint <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-rose-900">/api/*</code>. Vui lòng nhập token trong mục cấu hình bên dưới.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowConfig(true)}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold shrink-0 cursor-pointer"
            >
              Nhập Token
            </button>
          </div>
        )}

        {/* Browser Blocked Warning (PNA / CORS) */}
        {isBrowserBlocked && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2 shadow-xs">
            <div className="flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold font-mono">LOCAL_BRIDGE_BROWSER_BLOCKED</strong>
                <p className="text-amber-900 mt-0.5 text-[11px] leading-relaxed">
                  Trình duyệt chặn kết nối từ HTTPS tới địa chỉ cục bộ <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-900">127.0.0.1:8765</code> theo chính sách Private Network Access (PNA) / Mixed Content.
                </p>
              </div>
            </div>
            <div className="pl-6 text-[11px] text-amber-800 bg-amber-100/70 p-2.5 rounded-lg border border-amber-200 font-mono">
              💡 Cách khắc phục trên Chrome / Edge: Mở cờ <span className="font-bold">chrome://flags/#block-insecure-private-network-requests</span> và chọn <strong>Disabled</strong>, hoặc mở app qua môi trường HTTP local.
            </div>
          </div>
        )}

        {/* Local Bridge Offline Notice if DISCONNECTED (Non-blocking: Other steps work normally) */}
        {!isBridgeReady && !isBrowserBlocked && !authError && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-slate-900">LOCAL BRIDGE NOT CONNECTED</strong>
                <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                  Khởi chạy MATH AI Local Render Bridge trên máy tính tại <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-900">{localBridgeClient.getBridgeUrl()}</code> để render video thật. Các bước khác (Nhập đề, Chuẩn hóa, Lời giải, Minh họa, Sinh code) vẫn hoạt động độc lập bình thường.
                </p>
              </div>
            </div>
            <div className="text-[11px] font-mono text-slate-500 sm:text-right shrink-0">
              Target: 127.0.0.1:8765
            </div>
          </div>
        )}

        {/* Bridge Config Drawer */}
        {showConfig && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Cấu hình Local Bridge &amp; Token (Step 6B)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Bảo mật: Loopback only</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Local Bridge Endpoint (Mặc định: http://127.0.0.1:8765)
                </label>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="http://127.0.0.1:8765"
                  className="w-full text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700 block">
                    Local Bridge Token (Không gửi lên Gemini / Không log)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">input: password</span>
                </div>
                <div className="relative">
                  <input
                    type={showTokenPassword ? "text" : "password"}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Nhập Local Bridge Session Token..."
                    className="w-full text-xs font-mono px-3 py-1.5 pr-8 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTokenPassword(!showTokenPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showTokenPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Storage Preference selector */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 text-[11px]">Cơ chế lưu trữ Token trên trình duyệt:</span>
                <div className="flex items-center space-x-2 text-xs">
                  <label className="inline-flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="storagePref"
                      value="session"
                      checked={storagePref === "session"}
                      onChange={() => setStoragePref("session")}
                      className="text-blue-600"
                    />
                    <span className="text-[11px] font-medium text-slate-700">sessionStorage (Khuyến nghị - An toàn)</span>
                  </label>
                  <label className="inline-flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="storagePref"
                      value="local"
                      checked={storagePref === "local"}
                      onChange={() => setStoragePref("local")}
                      className="text-blue-600"
                    />
                    <span className="text-[11px] font-medium text-slate-700">localStorage (Lưu vĩnh viễn)</span>
                  </label>
                </div>
              </div>
              {storagePref === "local" && (
                <p className="text-[10px] text-amber-700 font-mono bg-amber-50 p-1.5 rounded border border-amber-200">
                  ⚠️ Cảnh báo: localStorage sẽ lưu token vĩnh viễn trên trình duyệt này cho đến khi xóa dữ liệu web.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-slate-500">
                GET /health không yêu cầu token; các API /api/* tự động đính kèm Authorization: Bearer.
              </p>
              <button
                onClick={handleSaveConfig}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer"
              >
                {configSaved ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : null}
                <span>{configSaved ? "Đã lưu cấu hình" : "Lưu & Kết nối"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Capabilities 4-Grid (Python, Manim, FFmpeg, OpenClaw) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Python */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">Python 3</span>
              {health.capabilities?.python?.installed ? (
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                  READY
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded">
                  NOT INSTALLED
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-mono truncate">
              {health.capabilities?.python?.version || "Chưa phát hiện"}
            </div>
          </div>

          {/* Manim CE */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">Manim CE</span>
              {health.capabilities?.manim?.installed ? (
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                  READY
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded">
                  NOT INSTALLED
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-mono truncate">
              {health.capabilities?.manim?.version || "Chưa phát hiện"}
            </div>
          </div>

          {/* FFmpeg */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">FFmpeg</span>
              {health.capabilities?.ffmpeg?.installed ? (
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                  READY
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded">
                  NOT INSTALLED
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-mono truncate">
              {health.capabilities?.ffmpeg?.version || "Chưa phát hiện"}
            </div>
          </div>

          {/* OpenClaw Gateway */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">OpenClaw Gateway</span>
              {health.capabilities?.openclaw?.available ? (
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                  READY
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded">
                  PRIVATE (18789)
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-mono truncate">
              {health.capabilities?.openclaw?.version || "Qua Local Bridge"}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: RENDER BUTTONS & ACTION CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
              <Film className="w-4 h-4 text-blue-600" />
              <span>Kích hoạt Local Render (Step 6B)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chỉ được kích hoạt khi Local Bridge ở trạng thái READY.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Render Preview */}
            <div className="relative group">
              <button
                id="render-preview-btn"
                onClick={() => handleStartRender("preview")}
                disabled={!isBridgeReady || isSubmitting || isJobRunning}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition shadow-xs ${
                  isBridgeReady && !isJobRunning
                    ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Render Preview (480p/Fast)</span>
              </button>
              {!isBridgeReady && (
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 w-60 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-lg">
                  Cần kết nối Local Bridge (http://127.0.0.1:8765) để render.
                </div>
              )}
            </div>

            {/* 2. Render Current Scene */}
            <div className="relative group">
              <button
                id="render-scene-btn"
                onClick={() => handleStartRender("current_scene")}
                disabled={!isBridgeReady || isSubmitting || isJobRunning}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition border ${
                  isBridgeReady && !isJobRunning
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 cursor-pointer"
                    : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Render Cảnh {selectedSceneIndex + 1}</span>
              </button>
              {!isBridgeReady && (
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 w-60 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-lg">
                  Cần kết nối Local Bridge (http://127.0.0.1:8765) để render.
                </div>
              )}
            </div>

            {/* 3. Render Final */}
            <div className="relative group">
              <button
                id="render-final-btn"
                onClick={() => handleStartRender("final")}
                disabled={!isBridgeReady || isSubmitting || isJobRunning}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition border ${
                  isBridgeReady && !isJobRunning
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 cursor-pointer"
                    : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Render Final (1080p/HQ)</span>
              </button>
              {!isBridgeReady && (
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 w-60 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-lg">
                  Cần kết nối Local Bridge (http://127.0.0.1:8765) để render.
                </div>
              )}
            </div>

            {/* 4. Live End-to-End Render Smoke Test (Step 6C) */}
            <div className="relative group">
              <button
                id="run-smoke-test-btn"
                onClick={handleRunSmokeTest}
                disabled={isSmokeTesting}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition border ${
                  !isSmokeTesting
                    ? "bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-300 cursor-pointer shadow-xs"
                    : "bg-purple-100 text-purple-400 border-purple-200 cursor-not-allowed"
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSmokeTesting ? "animate-spin text-purple-600" : "text-purple-600"}`} />
                <span>{isSmokeTesting ? "Đang chạy Smoke Test..." : "Chạy Smoke Test (6C)"}</span>
              </button>
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 w-64 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-lg">
                Kiểm tra thật toàn bộ đường truyền: Studio → Bridge → Python → Manim → FFmpeg → MP4 → Frames → Artifacts.
              </div>
            </div>
          </div>
        </div>

        {jobError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{jobError}</span>
            </div>
            <button onClick={() => setJobError(null)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
              <XCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* SECTION: SMOKE TEST RESULT PANEL (STEP 6C REQUIREMENT #11) */}
      {(smokeReport || isSmokeTesting) && (
        <div id="smoke-test-result-panel" className="bg-white border border-purple-200 rounded-xl p-5 shadow-sm space-y-4 ring-1 ring-purple-400/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200 shrink-0">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                    Smoke Test Result Panel (Step 6C)
                  </h3>
                  {smokeReport && (
                    <span
                      id="smoke-test-overall-badge"
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded border font-mono ${
                        smokeReport.qa.smokeTestStatus === "PASS"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : smokeReport.qa.smokeTestStatus === "FAIL"
                          ? "bg-rose-100 text-rose-800 border-rose-300"
                          : "bg-purple-100 text-purple-800 border-purple-300 animate-pulse"
                      }`}
                    >
                      {smokeReport.qa.smokeTestStatus}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Scene: <span className="font-mono font-semibold text-slate-700">BridgeSmokeTest</span> • Giai đoạn: <span className="font-mono font-semibold text-purple-700">{smokeReport?.currentStage || "RUNNING"}</span> {smokeReport?.jobId ? `• Job: ${smokeReport.jobId}` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSmokeSceneCode(!showSmokeSceneCode)}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-purple-600" />
                <span>{showSmokeSceneCode ? "Ẩn mã Smoke Test" : "Xem mã BridgeSmokeTest"}</span>
              </button>

              <button
                onClick={handleRunSmokeTest}
                disabled={isSmokeTesting}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSmokeTesting ? "animate-spin" : ""}`} />
                <span>Chạy lại</span>
              </button>
            </div>
          </div>

          {/* Test Scene Code Viewer Toggle */}
          {showSmokeSceneCode && (
            <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1 mb-2">
                <span>Test Scene: BridgeSmokeTest (main.py)</span>
                <span>Manim Community Edition</span>
              </div>
              <pre className="overflow-x-auto leading-relaxed">{SMOKE_TEST_SCENE_CODE}</pre>
            </div>
          )}

          {/* 13-POINT SMOKE TEST INDICATOR MATRIX */}
          {smokeReport && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Bảng Chỉ số Kiểm tra Hạ tầng 13 Điểm (Step 6C Matrix):
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Thời gian: {smokeReport.elapsedSeconds}s
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                {/* 1. Bridge Health */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">1. Bridge Health (GET /health)</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                    smokeReport.qa.localHealthQa === "PASS"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : smokeReport.qa.localHealthQa === "FAIL"
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : "bg-slate-200 text-slate-700"
                  }`}>
                    {smokeReport.qa.localHealthQa}
                  </span>
                </div>

                {/* 2. Local Authentication */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">2. Local Authentication</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                    smokeReport.qa.localAuthQa === "PASS"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : smokeReport.qa.localAuthQa === "FAIL"
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : "bg-slate-200 text-slate-700"
                  }`}>
                    {smokeReport.qa.localAuthQa}
                  </span>
                </div>

                {/* 3. Project Transfer */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">3. Project Transfer</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                    smokeReport.qa.projectTransferQa === "PASS"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : smokeReport.qa.projectTransferQa === "FAIL"
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : "bg-slate-200 text-slate-700"
                  }`}>
                    {smokeReport.qa.projectTransferQa}
                  </span>
                </div>

                {/* 4. Job Creation */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">4. Job Creation (POST /api/jobs)</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                    smokeReport.qa.jobCreateQa === "PASS"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : smokeReport.qa.jobCreateQa === "FAIL"
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : "bg-slate-200 text-slate-700"
                  }`}>
                    {smokeReport.qa.jobCreateQa}
                  </span>
                </div>

                {/* 5. Job Polling */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">5. Job Polling (1s interval)</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                    smokeReport.qa.jobPollQa === "PASS"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : smokeReport.qa.jobPollQa === "FAIL"
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : "bg-slate-200 text-slate-700"
                  }`}>
                    {smokeReport.qa.jobPollQa}
                  </span>
                </div>

                {/* 6. Manim Runtime */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">
                    6. Manim Runtime {smokeReport.exitCode !== undefined && smokeReport.exitCode !== null ? `(exit ${smokeReport.exitCode})` : ""}
                  </span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                    smokeReport.qa.manimRuntimeQa === "PASS"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : smokeReport.qa.manimRuntimeQa === "FAIL"
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : "bg-slate-200 text-slate-700"
                  }`}>
                    {smokeReport.qa.manimRuntimeQa}
                  </span>
                </div>

                {/* 7. MP4 Artifact */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">7. MP4 Video Artifact</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                    smokeReport.qa.videoArtifactQa === "PASS"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : smokeReport.qa.videoArtifactQa === "FAIL"
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : "bg-slate-200 text-slate-700"
                  }`}>
                    {smokeReport.qa.videoArtifactQa}
                  </span>
                </div>

                {/* 8. Render Log */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">8. Render Log Artifact</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                    smokeReport.qa.logArtifactQa === "PASS"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : smokeReport.qa.logArtifactQa === "FAIL"
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : "bg-slate-200 text-slate-700"
                  }`}>
                    {smokeReport.qa.logArtifactQa}
                  </span>
                </div>

                {/* 9. START Frame */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">9. START.png Frame</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                    smokeReport.qa.startFrameQa === "PASS"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : smokeReport.qa.startFrameQa === "FAIL"
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : "bg-slate-200 text-slate-700"
                  }`}>
                    {smokeReport.qa.startFrameQa}
                  </span>
                </div>

                {/* 10. KEY Frame */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">10. KEY.png Frame</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                    smokeReport.qa.keyFrameQa === "PASS"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : smokeReport.qa.keyFrameQa === "FAIL"
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : "bg-slate-200 text-slate-700"
                  }`}>
                    {smokeReport.qa.keyFrameQa}
                  </span>
                </div>

                {/* 11. END Frame */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">11. END.png Frame</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                    smokeReport.qa.endFrameQa === "PASS"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : smokeReport.qa.endFrameQa === "FAIL"
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : "bg-slate-200 text-slate-700"
                  }`}>
                    {smokeReport.qa.endFrameQa}
                  </span>
                </div>

                {/* 12. Frame QA */}
                <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">12. Frame QA (Visual Gate)</span>
                  <span className="font-mono font-bold px-2 py-0.5 rounded text-[11px] bg-slate-200 text-slate-700 border border-slate-300">
                    NOT TESTED
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Diagnostics Box if failed */}
          {smokeReport?.diagnostics && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1.5">
              <div className="flex items-center space-x-2 font-bold text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Chẩn đoán Lỗi Smoke Test ({smokeReport.diagnostics.failureStage || "UNKNOWN"})</span>
              </div>
              <div className="space-y-0.5 font-mono text-[11px] text-rose-800">
                {smokeReport.diagnostics.httpStatus && <div>HTTP Status: {smokeReport.diagnostics.httpStatus}</div>}
                {smokeReport.diagnostics.exitCode !== null && smokeReport.diagnostics.exitCode !== undefined && <div>Exit Code: {smokeReport.diagnostics.exitCode}</div>}
                {smokeReport.diagnostics.errorMessage && <div>Lỗi: {smokeReport.diagnostics.errorMessage}</div>}
              </div>
            </div>
          )}

          {/* Smoke Test Artifacts & Player */}
          {smokeReport && smokeReport.artifacts.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-purple-100">
              {/* Video Player */}
              {smokeReport.artifacts.find((a) => a.type === "preview_video" || a.name.toLowerCase().endsWith(".mp4")) && (
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-white text-xs">
                    <span className="font-bold flex items-center space-x-1.5">
                      <Video className="w-4 h-4 text-purple-400" />
                      <span>Smoke Test Video Preview</span>
                    </span>
                    <a
                      href={smokeReport.artifacts.find((a) => a.type === "preview_video" || a.name.toLowerCase().endsWith(".mp4"))?.pathOrUrl}
                      download="BridgeSmokeTest.mp4"
                      className="text-purple-400 hover:text-purple-300 font-mono text-xs flex items-center space-x-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Tải video</span>
                    </a>
                  </div>
                  <div className="w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                    <video
                      src={smokeReport.artifacts.find((a) => a.type === "preview_video" || a.name.toLowerCase().endsWith(".mp4"))?.pathOrUrl}
                      controls
                      autoPlay
                      loop
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Frames START, KEY, END */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {smokeReport.artifacts
                  .filter((a) => a.type === "start_frame" || a.type === "key_frame" || a.type === "end_frame" || a.name.toLowerCase().endsWith(".png"))
                  .map((frame, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-white border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                        <span>{frame.name}</span>
                        <span className="text-[10px] text-purple-700 uppercase font-mono">{frame.type}</span>
                      </div>
                      <div
                        onClick={() => setSelectedPreviewImage(frame.previewDataUrl || frame.pathOrUrl)}
                        className="w-full h-24 bg-slate-100 rounded overflow-hidden cursor-pointer flex items-center justify-center border border-slate-200"
                      >
                        <img src={frame.previewDataUrl || frame.pathOrUrl} alt={frame.name} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Smoke Test Logs */}
          {smokeReport && smokeReport.logs.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                <Terminal className="w-3 h-3 text-slate-500" />
                <span>Nhật ký Smoke Test Manim ({smokeReport.logs.length} dòng)</span>
              </span>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300 h-36 overflow-y-auto space-y-0.5 shadow-inner">
                {smokeReport.logs.map((line, idx) => (
                  <div key={idx} className="leading-tight">
                    <span className="text-slate-600 select-none mr-2">&gt;</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: JOB MONITOR & CONSOLE LOGS */}
      {currentJob && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Job Monitor
                </span>
                <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
                  {currentJob.jobId}
                </span>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                  currentJob.status === "COMPLETED"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : currentJob.status === "RENDERING"
                    ? "bg-blue-100 text-blue-800 border-blue-300"
                    : currentJob.status === "FAILED"
                    ? "bg-rose-100 text-rose-800 border-rose-300"
                    : "bg-slate-100 text-slate-700 border-slate-300"
                }`}>
                  {currentJob.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Scene: <span className="font-mono font-semibold text-slate-700">{currentJob.sceneName || "MathLessonScene"}</span> • Thời gian: <span className="font-mono font-semibold text-slate-700">{elapsedTimer}s</span>
              </p>
            </div>

            {isJobRunning && (
              <button
                onClick={handleCancelJob}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition cursor-pointer"
              >
                <StopCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Huỷ Job</span>
              </button>
            )}
          </div>

          {/* Stage & Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">
                Giai đoạn: <strong className="text-slate-900">{currentJob.currentStage || "Đang xử lý..."}</strong>
              </span>
              <span className="text-slate-500 font-mono">
                {currentJob.currentAnimation ? `Animation ${currentJob.currentAnimation} / ${currentJob.totalAnimations || "?"}` : `${currentJob.progress || 0}%`}
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  currentJob.status === "FAILED"
                    ? "bg-rose-500"
                    : currentJob.status === "COMPLETED"
                    ? "bg-emerald-500"
                    : "bg-blue-600"
                }`}
                style={{ width: `${currentJob.progress || 5}%` }}
              />
            </div>
          </div>

          {/* STEP 6B 3-WAY QA STATUS MATRIX */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            {/* 1. MANIM RUNTIME QA */}
            <div className="flex flex-col space-y-1">
              <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                1. MANIM RUNTIME QA
              </span>
              <div className="flex items-center space-x-2">
                <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                  currentJob.manimRuntimeQa === "PASS" || currentJob.exitCode === 0
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : currentJob.status === "FAILED" || (currentJob.exitCode !== null && currentJob.exitCode !== undefined && currentJob.exitCode !== 0)
                    ? "bg-rose-100 text-rose-800 border border-rose-300"
                    : "bg-slate-200 text-slate-700"
                }`}>
                  {currentJob.manimRuntimeQa === "PASS" || currentJob.exitCode === 0 ? "PASS" : currentJob.status === "FAILED" ? "FAIL" : "PENDING"}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  (Exit Code: {currentJob.exitCode !== null && currentJob.exitCode !== undefined ? currentJob.exitCode : "-"})
                </span>
              </div>
            </div>

            {/* 2. FRAME QA */}
            <div className="flex flex-col space-y-1">
              <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                2. FRAME QA
              </span>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold px-2 py-0.5 rounded text-xs bg-slate-200 text-slate-700 border border-slate-300">
                  {currentJob.frameQa || "NOT TESTED"}
                </span>
                <span className="text-[11px] text-slate-500">
                  (Visual Inspection)
                </span>
              </div>
            </div>

            {/* 3. FINAL STATUS */}
            <div className="flex flex-col space-y-1">
              <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                3. FINAL STATUS
              </span>
              <div className="flex items-center space-x-2">
                <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                  currentJob.status === "COMPLETED"
                    ? "bg-blue-100 text-blue-800 border border-blue-300"
                    : currentJob.status === "FAILED"
                    ? "bg-rose-100 text-rose-800 border border-rose-300"
                    : "bg-slate-200 text-slate-700"
                }`}>
                  {currentJob.finalStatus || (currentJob.status === "COMPLETED" ? "RUNTIME_NOT_TESTED" : "PENDING")}
                </span>
              </div>
            </div>
          </div>

          {/* Rendered Video Player if available */}
          {videoArtifact && (
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-slate-200 text-xs">
                <span className="font-bold flex items-center space-x-1.5">
                  <Video className="w-4 h-4 text-blue-400" />
                  <span>Video Preview: {videoArtifact.name}</span>
                </span>
                <a
                  href={videoArtifact.pathOrUrl}
                  download={videoArtifact.name}
                  className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 font-mono"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải video</span>
                </a>
              </div>
              <div className="w-full aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center">
                <video
                  src={videoArtifact.pathOrUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Artifacts Grid: Video, START.png, KEY.png, END.png, render.log */}
          {artifacts.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Artifacts Kết Xuất ({artifacts.length})</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">
                  video, START.png, KEY.png, END.png, render.log
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {artifacts.map((art, idx) => {
                  const isImage = art.type === "start_frame" || art.type === "key_frame" || art.type === "end_frame" || art.name.toLowerCase().endsWith(".png");
                  const isLog = art.type === "render_log" || art.name.toLowerCase().endsWith(".log");
                  const isVideo = art.type === "preview_video" || art.type === "final_video" || art.name.toLowerCase().endsWith(".mp4");
                  const artifactUrl = art.previewDataUrl || art.pathOrUrl;

                  return (
                    <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-white flex flex-col justify-between space-y-2 text-xs hover:border-slate-300 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2 truncate mr-2">
                          <div className="p-1.5 rounded bg-slate-100 text-slate-700 shrink-0">
                            {isImage ? <ImageIcon className="w-4 h-4 text-emerald-600" /> : isLog ? <FileText className="w-4 h-4 text-amber-600" /> : <Video className="w-4 h-4 text-blue-600" />}
                          </div>
                          <div className="truncate">
                            <span className="font-semibold text-slate-800 block truncate">{art.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono uppercase">{art.type}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          {isImage && artifactUrl && (
                            <button
                              onClick={() => setSelectedPreviewImage(artifactUrl)}
                              className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                              title="Xem ảnh"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {art.pathOrUrl && (
                            <a
                              href={art.pathOrUrl}
                              download={art.name}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-blue-600 cursor-pointer"
                              title="Tải về"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Image Thumbnail */}
                      {isImage && artifactUrl && (
                        <div
                          onClick={() => setSelectedPreviewImage(artifactUrl)}
                          className="w-full h-24 bg-slate-100 rounded border border-slate-200 overflow-hidden cursor-pointer flex items-center justify-center hover:opacity-90 transition"
                        >
                          <img
                            src={artifactUrl}
                            alt={art.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Real Terminal Log Output */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                <span>Nhật ký Kết xuất (stdout / stderr / Python traceback)</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">{jobLogs.length} lines</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300 h-48 overflow-y-auto space-y-1 shadow-inner">
              {jobLogs.length > 0 ? (
                jobLogs.map((log, idx) => (
                  <div key={idx} className="leading-tight">
                    <span className="text-slate-600 select-none mr-2">&gt;</span>
                    <span>{log}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 italic">
                  Chờ dữ liệu log từ Local Bridge...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Lightbox Modal */}
      {selectedPreviewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full p-4 space-y-3">
            <div className="flex items-center justify-between text-white">
              <span className="text-xs font-bold uppercase tracking-wider">Xem Artifact Khung hình</span>
              <button
                onClick={() => setSelectedPreviewImage(null)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={selectedPreviewImage}
                alt="Frame preview"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
