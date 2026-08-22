import React, { useState, useEffect } from "react";
import {
  Server,
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Lock,
  Terminal,
  Shield,
  FileCode,
  Video,
  Download,
  Search,
  Sparkles,
  Layers,
  ZoomIn,
  X,
  Check,
  AlertCircle,
  HelpCircle,
  Wrench,
  RotateCcw,
  GitCommit,
  FileText,
} from "lucide-react";
import {
  LocalBridgeHealth,
  LocalCapabilities,
  SmokeTestReport,
  SMOKE_TEST_SCENE_CODE,
  JobVisualFrameQAReport,
  FrameQAResult,
  FrameQAIssue,
  RepairSessionReport,
  RepairAttempt,
  REPAIR_SMOKE_TEST_SCENE_CODE,
  REPAIR_SMOKE_TEST_MANIFEST,
} from "../types/localRender.js";
import { localBridgeClient } from "../services/localBridgeClient.js";
import { LOCAL_BRIDGE_ERRORS } from "../config/localBridgeConfig.js";

export const LocalRenderEngineCard: React.FC = () => {
  // 1. Bridge URL (Default: http://127.0.0.1:8765)
  const [bridgeUrl, setBridgeUrl] = useState<string>(localBridgeClient.getBridgeUrl());

  // 2. Local Bridge Token (sessionStorage, password input, show/hide, never logged)
  const [token, setToken] = useState<string>(localBridgeClient.getSessionToken() || "");
  const [showToken, setShowToken] = useState<boolean>(false);
  const [tokenSaved, setTokenSaved] = useState<boolean>(false);

  // 3. Engine Health & Capabilities
  const [health, setHealth] = useState<LocalBridgeHealth>({
    status: "DISCONNECTED",
    message: "Chưa kiểm tra Local Engine",
    capabilities: {
      python: { installed: false },
      manim: { installed: false },
      ffmpeg: { installed: false },
      openclaw: { available: false },
    },
  });
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [authError, setAuthError] = useState<boolean>(false);

  // 4. Smoke Test State (Step 6C)
  const [isSmokeTesting, setIsSmokeTesting] = useState<boolean>(false);
  const [smokeReport, setSmokeReport] = useState<SmokeTestReport | null>(null);
  const [showSceneCode, setShowSceneCode] = useState<boolean>(false);

  // 5. Visual Frame QA State (Step 6D)
  const [isFrameQAing, setIsFrameQAing] = useState<boolean>(false);
  const [frameQAReport, setFrameQAReport] = useState<JobVisualFrameQAReport | null>(null);
  const [frameQAError, setFrameQAError] = useState<string | null>(null);
  const [selectedFrameModal, setSelectedFrameModal] = useState<FrameQAResult | null>(null);

  // 6. OpenClaw Safe Auto-Repair State (Step 6E)
  const [isRepairing, setIsRepairing] = useState<boolean>(false);
  const [repairReport, setRepairReport] = useState<RepairSessionReport | null>(null);
  const [repairError, setRepairError] = useState<string | null>(null);
  const [showSmokeRepairCode, setShowSmokeRepairCode] = useState<boolean>(false);
  const [humanReviewModalIssue, setHumanReviewModalIssue] = useState<FrameQAIssue | null>(null);
  const [openClawStatus, setOpenClawStatus] = useState<"ACTIVE" | "UNAVAILABLE">("UNAVAILABLE");

  // Run initial health check on mount
  useEffect(() => {
    handleCheckHealth();
  }, []);

  // Update token in client & sessionStorage whenever changed
  const handleTokenChange = (val: string) => {
    setToken(val);
    setAuthError(false);
    localBridgeClient.setSessionToken(val.trim() || null, "session");
    setTokenSaved(true);
    setTimeout(() => setTokenSaved(false), 2000);
  };

  const handleUrlChange = (val: string) => {
    setBridgeUrl(val);
    localBridgeClient.setBridgeUrl(val);
  };

  // CHECK LOCAL ENGINE:
  // 1. Calls GET http://127.0.0.1:8765/health (Public, no token)
  // 2. If token is present, verifies GET /api/capabilities with Bearer token
  const handleCheckHealth = async () => {
    setIsChecking(true);
    setAuthError(false);
    try {
      // 1. GET /health
      const res = await localBridgeClient.checkHealth();
      setHealth(res);

      // 2. If token entered and health is ready/connected, check GET /api/capabilities
      if (res.status === "READY" && token.trim()) {
        const authCheck = await localBridgeClient.checkCapabilitiesAuth();
        if (!authCheck.authenticated && authCheck.status === 401) {
          setAuthError(true);
        }
      }
    } catch (err: any) {
      setHealth({
        status: "DISCONNECTED",
        message: err.message || "Local Bridge không phản hồi",
      });
    } finally {
      setIsChecking(false);
    }
  };

  // RUN BRIDGE SMOKE TEST (Only enabled when Bridge=READY, Python=PASS, Manim=PASS, FFmpeg=PASS)
  const handleRunSmokeTest = async () => {
    setIsSmokeTesting(true);
    setAuthError(false);
    setFrameQAReport(null);
    setFrameQAError(null);
    try {
      const report = await localBridgeClient.runSmokeTest();
      setSmokeReport(report);
      if (report.diagnostics?.httpStatus === 401) {
        setAuthError(true);
      }
    } catch (err: any) {
      console.error("Smoke test unexpected error:", err);
    } finally {
      setIsSmokeTesting(false);
    }
  };

  // RUN VISUAL FRAME QA (Step 6D)
  const handleRunFrameQA = async () => {
    const activeJobId = smokeReport?.jobId || "BridgeSmokeTest_Job";
    setIsFrameQAing(true);
    setFrameQAError(null);

    try {
      const report = await localBridgeClient.runVisualFrameQA(activeJobId, {
        problemIR: {
          originalText: "Giải phương trình bậc hai: x^2 - 5x + 6 = 0",
          domain: "Algebra",
        },
        solution: {
          pedagogicalSteps: [
            { mathExpression: "x^2 - 5x + 6 = 0" },
            { mathExpression: "(x-2)(x-3) = 0" },
            { mathExpression: "x = 2 \\quad \\text{hoặc} \\quad x = 3" },
          ],
          finalAnswer: "x = 2, x = 3",
        },
        visualSpec: {
          type: "algebraic_steps",
        },
      });

      setFrameQAReport(report);
    } catch (err: any) {
      setFrameQAError(err.message || "Lỗi thực thi Visual Frame QA Engine.");
    } finally {
      setIsFrameQAing(false);
    }
  };

  // RUN OPENCLAW SAFE AUTO-REPAIR LOOP (Step 6E)
  const handleRunAutoRepair = async () => {
    if (!frameQAReport) return;
    setIsRepairing(true);
    setRepairError(null);

    try {
      const activeJobId = smokeReport?.jobId || "RepairJob";
      const report = await localBridgeClient.runAutoRepair({
        sceneName: "BridgeSmokeTest",
        projectManifest: {
          projectId: "bridge-smoke-test",
          entryFile: "main.py",
          sceneName: "BridgeSmokeTest",
          quality: "preview",
          action: "render",
          files: [
            {
              path: "main.py",
              encoding: "utf8",
              content: SMOKE_TEST_SCENE_CODE,
            },
          ],
        },
        initialFrameReport: frameQAReport,
        mathContext: {
          problemText: "Giải phương trình bậc hai: x^2 - 5x + 6 = 0",
          formulas: ["x^2-5x+6=0", "x=2", "x=3"],
        },
      });

      setRepairReport(report);
    } catch (err: any) {
      setRepairError(err.message || "Lỗi thực thi Auto-Repair Loop.");
    } finally {
      setIsRepairing(false);
    }
  };

  // RUN REPAIR SMOKE TEST (Dedicated DEV test for Step 6E)
  const handleRunRepairSmokeTest = async () => {
    setIsRepairing(true);
    setRepairError(null);
    setRepairReport(null);

    try {
      const report = await localBridgeClient.runRepairSmokeTest();
      setRepairReport(report);
    } catch (err: any) {
      setRepairError(err.message || "Lỗi thực thi Repair Smoke Test.");
    } finally {
      setIsRepairing(false);
    }
  };

  const isBridgeReady = health.status === "READY";
  const isBrowserBlocked = health.status === "BROWSER_BLOCKED" || !!health.isBrowserBlocked;
  const isBridgeNotFound = health.status === "DISCONNECTED" && !isBrowserBlocked;

  const isPythonPass = !!health.capabilities?.python?.installed;
  const isManimPass = !!health.capabilities?.manim?.installed;
  const isFfmpegPass = !!health.capabilities?.ffmpeg?.installed;
  const isOpenClawReady = !!health.capabilities?.openclaw?.available;

  // Condition 5: Nút chỉ enabled nếu Bridge = READY, Python = PASS, Manim = PASS, FFmpeg = PASS
  const isSmokeTestEnabled = isBridgeReady && isPythonPass && isManimPass && isFfmpegPass && !isSmokeTesting;

  // Frame QA button enabled if we have a job from smoke test or local bridge is ready
  const isFrameQAEnabled = !!smokeReport?.jobId && smokeReport.jobStatus === "COMPLETED" && !isFrameQAing;

  // Rule 10: Final Status Gate Calculation
  const hasSmokeCompleted = smokeReport?.jobStatus === "COMPLETED";
  const hasFrameQA = !!frameQAReport;
  let finalStatusDisplay = "NOT_STARTED";
  let finalStatusBadgeClass = "bg-slate-100 text-slate-600 border-slate-300";

  if (hasSmokeCompleted && !hasFrameQA) {
    // Crucial requirement: Runtime PASS but Frame QA NOT TESTED cannot be RENDER_READY
    finalStatusDisplay = "RUNTIME_PASS_FRAME_NOT_TESTED";
    finalStatusBadgeClass = "bg-amber-50 text-amber-800 border-amber-300";
  } else if (hasFrameQA) {
    if (frameQAReport.overallStatus === "PASS") {
      finalStatusDisplay = "RENDER_READY (PASS)";
      finalStatusBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-300";
    } else if (frameQAReport.overallStatus === "NEED_SOURCE_VERIFICATION") {
      finalStatusDisplay = "NEED_SOURCE_VERIFICATION";
      finalStatusBadgeClass = "bg-blue-50 text-blue-700 border-blue-300";
    } else {
      finalStatusDisplay = "QA_FAILED";
      finalStatusBadgeClass = "bg-rose-50 text-rose-700 border-rose-300";
    }
  }

  // Step 6E: Repair classification evaluation
  const allFrameIssues: FrameQAIssue[] = frameQAReport
    ? [
        ...(frameQAReport.frames?.start?.issues || []),
        ...(frameQAReport.frames?.key?.issues || []),
        ...(frameQAReport.frames?.end?.issues || []),
      ]
    : [];

  const hasSafeIssues = allFrameIssues.some((i) => i.repairClass === "SAFE_AUTO_REPAIR");
  const hasReviewOnly =
    allFrameIssues.length > 0 && allFrameIssues.every((i) => i.repairClass === "REVIEW_REQUIRED");

  const isAutoRepairEnabled =
    (frameQAReport?.overallStatus === "FAIL" || allFrameIssues.length > 0) &&
    hasSafeIssues &&
    !isRepairing;

  return (
    <div id="local-render-engine-card" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                LOCAL RENDER ENGINE
              </h3>
              <span
                id="bridge-status-badge"
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  isBridgeReady
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : isBrowserBlocked
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-slate-100 text-slate-600 border-slate-300"
                }`}
              >
                {isBrowserBlocked ? "BROWSER BLOCKED" : health.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cầu nối cục bộ an toàn tới Python, Manim CE &amp; FFmpeg trên máy (Local Bridge).
            </p>
          </div>
        </div>

        {/* Action Buttons: [Check Local Engine] & [Run Bridge Smoke Test] */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="check-local-engine-button"
            onClick={handleCheckHealth}
            disabled={isChecking}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin text-blue-600" : ""}`} />
            <span>{isChecking ? "Đang kiểm tra..." : "Check Local Engine"}</span>
          </button>

          <button
            id="run-bridge-smoke-test-button"
            onClick={handleRunSmokeTest}
            disabled={!isSmokeTestEnabled}
            title={
              !isSmokeTestEnabled
                ? "Yêu cầu: Bridge = READY, Python = PASS, Manim = PASS, FFmpeg = PASS"
                : "Chạy kịch bản render thật BridgeSmokeTest qua Local Bridge"
            }
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition ${
              isSmokeTestEnabled
                ? "bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isSmokeTesting ? "animate-pulse" : ""}`} />
            <span>{isSmokeTesting ? "Đang chạy Smoke Test..." : "Run Bridge Smoke Test"}</span>
          </button>
        </div>
      </div>

      {/* Inputs: 1. Bridge URL & 2. Local Bridge Token */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. Bridge URL */}
        <div>
          <label className="text-[11px] font-bold text-slate-700 block mb-1">
            Bridge URL (Mặc định: <span className="font-mono text-blue-600">http://127.0.0.1:8765</span>)
          </label>
          <div className="relative">
            <input
              id="local-bridge-url-input"
              type="text"
              value={bridgeUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="http://127.0.0.1:8765"
              className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 2. Local Bridge Token */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold text-slate-700 block">
              Local Bridge Token
            </label>
            <span className="text-[10px] text-slate-400 font-mono">
              {tokenSaved ? "✓ Đã lưu sessionStorage" : "sessionStorage • Không gửi Gemini"}
            </span>
          </div>
          <div className="relative">
            <input
              id="local-bridge-token-input"
              type={showToken ? "text" : "password"}
              value={token}
              onChange={(e) => handleTokenChange(e.target.value)}
              placeholder="Nhập Local Bridge Token..."
              className="w-full text-xs font-mono px-3 py-2 pr-9 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
            <button
              id="toggle-token-visibility-button"
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              title={showToken ? "Hide token" : "Show token"}
            >
              {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 9. Token Invalid Notice */}
      {authError && (
        <div id="local-bridge-token-invalid-banner" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start space-x-2.5">
          <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">LOCAL BRIDGE TOKEN INVALID</strong>
            <p className="text-rose-800 mt-0.5 text-[11px] leading-relaxed">
              Mã token không hợp lệ hoặc đã hết hạn (HTTP 401). Vui lòng kiểm tra lại token được cấp bởi Local Bridge daemon.
            </p>
          </div>
        </div>
      )}

      {/* 10. Bridge Not Found Notice */}
      {isBridgeNotFound && !authError && (
        <div id="local-bridge-not-found-banner" className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs flex items-start space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-slate-900">LOCAL BRIDGE NOT FOUND</strong>
            <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
              Không tìm thấy Local Render Bridge đang chạy tại <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-900">{bridgeUrl}</code>. Vui lòng khởi chạy tiến trình bridge trên máy tính.
            </p>
          </div>
        </div>
      )}

      {/* 11. Browser Blocked Notice */}
      {isBrowserBlocked && (
        <div id="local-bridge-browser-blocked-banner" className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2">
          <div className="flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold font-mono">LOCAL_BRIDGE_BROWSER_BLOCKED</strong>
              <p className="text-amber-900 mt-0.5 text-[11px] leading-relaxed">
                Trình duyệt đã chặn yêu cầu tới localhost (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono">{bridgeUrl}</code>) do chính sách Private Network Access (PNA) / Mixed Content.
              </p>
            </div>
          </div>
          <div className="pl-6 text-[11px] text-amber-800 bg-amber-100/70 p-2.5 rounded-lg border border-amber-200 font-mono">
            💡 Trên Chrome / Edge: Mở cờ <span className="font-bold">chrome://flags/#block-insecure-private-network-requests</span> và chọn <strong>Disabled</strong>, hoặc mở app qua môi trường HTTP local.
          </div>
        </div>
      )}

      {/* 4. Capabilities Display: Bridge, Python, Manim, FFmpeg, OpenClaw */}
      <div className="space-y-2 pt-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
          <span>Engine Capabilities</span>
          <span className="text-[10px] text-slate-500 font-mono">
            Endpoint: GET /health
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {/* Bridge */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">Bridge</span>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isBridgeReady
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {isBridgeReady ? "READY" : health.status}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono truncate">
              {health.bridgeVersion || (isBridgeReady ? "v1.0.0" : "Offline")}
            </div>
          </div>

          {/* Python */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">Python</span>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isPythonPass
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {isPythonPass ? "PASS" : "FAIL"}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono truncate">
              {health.capabilities?.python?.version || "Chưa phát hiện"}
            </div>
          </div>

          {/* Manim */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">Manim</span>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isManimPass
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {isManimPass ? "PASS" : "FAIL"}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono truncate">
              {health.capabilities?.manim?.version || "Chưa phát hiện"}
            </div>
          </div>

          {/* FFmpeg */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">FFmpeg</span>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isFfmpegPass
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {isFfmpegPass ? "PASS" : "FAIL"}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono truncate">
              {health.capabilities?.ffmpeg?.version || "Chưa phát hiện"}
            </div>
          </div>

          {/* OpenClaw */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">OpenClaw</span>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isOpenClawReady
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {isOpenClawReady ? "READY" : "OPTIONAL"}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono truncate">
              {health.capabilities?.openclaw?.version || "Qua Local Bridge"}
            </div>
          </div>
        </div>
      </div>

      {/* 9 & 10. SMOKE TEST RESULTS DISPLAY */}
      {smokeReport && (
        <div id="smoke-test-results-panel" className="pt-3 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
              <Terminal className="w-3.5 h-3.5 text-purple-600" />
              <span>Kết quả Live Smoke Test (Scene: BridgeSmokeTest)</span>
            </span>
            <button
              onClick={() => setShowSceneCode(!showSceneCode)}
              className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <FileCode className="w-3 h-3" />
              {showSceneCode ? "Ẩn mã Scene" : "Xem mã BridgeSmokeTest"}
            </button>
          </div>

          {/* Scene Code Drawer */}
          {showSceneCode && (
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-[11px] leading-relaxed shadow-inner">
              <pre>{SMOKE_TEST_SCENE_CODE}</pre>
            </div>
          )}

          {/* Metrics Matrix: JOB_ID, JOB_STATUS, EXIT_CODE, MANIM_RUNTIME_QA, FRAME_QA, FINAL_STATUS */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
            {/* JOB_ID */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 font-mono uppercase">JOB_ID</div>
              <div className="text-xs font-mono font-bold text-slate-900 truncate">
                {smokeReport.jobId || "NONE"}
              </div>
            </div>

            {/* JOB_STATUS */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 font-mono uppercase">JOB_STATUS</div>
              <div className="text-xs font-mono font-bold text-slate-900">
                {smokeReport.jobStatus}
              </div>
            </div>

            {/* EXIT_CODE */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 font-mono uppercase">EXIT_CODE</div>
              <div className="text-xs font-mono font-bold text-slate-900">
                {smokeReport.exitCode !== undefined ? smokeReport.exitCode : "NONE"}
              </div>
            </div>

            {/* MANIM_RUNTIME_QA */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 font-mono uppercase">MANIM_RUNTIME_QA</div>
              <div className="text-xs font-mono font-bold">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] ${
                    smokeReport.manimRuntimeQa === "PASS"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {smokeReport.manimRuntimeQa}
                </span>
              </div>
            </div>

            {/* FRAME_QA Status */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 font-mono uppercase">FRAME_QA</div>
              <div className="text-xs font-mono font-bold">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] ${
                    frameQAReport
                      ? frameQAReport.overallStatus === "PASS"
                        ? "bg-emerald-100 text-emerald-800"
                        : frameQAReport.overallStatus === "NEED_SOURCE_VERIFICATION"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-rose-100 text-rose-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {frameQAReport ? frameQAReport.overallStatus : "NOT TESTED"}
                </span>
              </div>
            </div>

            {/* Final Render Status Gate */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 font-mono uppercase">FINAL_GATE</div>
              <div className="text-xs font-mono font-bold truncate">
                <span className={`px-1.5 py-0.5 rounded text-[9px] ${finalStatusBadgeClass}`}>
                  {finalStatusDisplay}
                </span>
              </div>
            </div>
          </div>

          {/* Artifacts List */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Danh sách Artifacts ({smokeReport.artifacts.length})
            </div>
            {smokeReport.artifacts.length === 0 ? (
              <div className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded-lg border border-slate-200">
                Chưa có artifact nào từ Bridge.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {smokeReport.artifacts.map((art) => (
                  <div
                    key={art.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      {art.type === "preview_video" ? (
                        <Video className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      ) : art.type === "render_log" ? (
                        <FileCode className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                      <span className="font-bold text-slate-900 truncate">{art.name}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 uppercase">
                      {art.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 6D: VISUAL FRAME QA SECTION */}
      <div id="visual-frame-qa-section" className="pt-4 border-t border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  VISUAL FRAME QA ENGINE (Step 6D)
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  Gemini Vision Multimodal
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kiểm định thị giác thực tế trên các khung hình <code className="font-mono text-slate-700">START.png</code>, <code className="font-mono text-slate-700">KEY.png</code>, <code className="font-mono text-slate-700">END.png</code>.
              </p>
            </div>
          </div>

          <button
            id="run-visual-frame-qa-button"
            onClick={handleRunFrameQA}
            disabled={!isFrameQAEnabled || isFrameQAing}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition ${
              isFrameQAEnabled && !isFrameQAing
                ? "bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed"
            }`}
            title={
              !hasSmokeCompleted
                ? "Cần hoàn thành Smoke Test (hoặc render preview) trước khi chạy Frame QA"
                : "Phân tích 3 khung hình START, KEY, END bằng Gemini Multimodal Vision"
            }
          >
            <Sparkles className={`w-3.5 h-3.5 ${isFrameQAing ? "animate-spin" : ""}`} />
            <span>{isFrameQAing ? "Đang kiểm định khung hình..." : "[ Run Visual Frame QA ]"}</span>
          </button>
        </div>

        {frameQAError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{frameQAError}</span>
            </div>
            <button onClick={() => setFrameQAError(null)} className="text-rose-600 hover:text-rose-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Frame QA Detailed Report */}
        {frameQAReport && (
          <div id="frame-qa-report-panel" className="space-y-4 bg-white border border-purple-200 rounded-xl p-4 shadow-xs">
            {/* Top Indicator Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Báo cáo Kiểm định Thị giác Khung hình
                  </span>
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
                      frameQAReport.overallStatus === "PASS"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : frameQAReport.overallStatus === "NEED_SOURCE_VERIFICATION"
                        ? "bg-blue-50 text-blue-700 border-blue-300"
                        : "bg-rose-50 text-rose-700 border-rose-300"
                    }`}
                  >
                    FRAME QA: {frameQAReport.overallStatus}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tổng lỗi phát hiện: <strong>{frameQAReport.summary.totalIssues}</strong> (Critical: {frameQAReport.summary.criticalCount}, High: {frameQAReport.summary.highCount}, Medium: {frameQAReport.summary.mediumCount}, Low: {frameQAReport.summary.lowCount})
                </p>
              </div>

              <div className="text-right text-xs">
                <span className="text-slate-500 text-[11px]">Trạng thái Render Gate: </span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${finalStatusBadgeClass}`}>
                  {frameQAReport.finalStatus}
                </span>
              </div>
            </div>

            {/* Frame Cards: START.png, KEY.png, END.png */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(["start", "key", "end"] as const).map((key) => {
                const frame = frameQAReport.frames[key];
                const frameName = key.toUpperCase() + ".png";
                return (
                  <div
                    key={key}
                    className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-purple-600" />
                        {frameName}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                          frame.status === "PASS"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : frame.status === "NEED_SOURCE_VERIFICATION"
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : "bg-rose-100 text-rose-800 border-rose-300"
                        }`}
                      >
                        {frame.status}
                      </span>
                    </div>

                    {/* Frame thumbnail placeholder or image */}
                    <div
                      onClick={() => setSelectedFrameModal(frame)}
                      className="aspect-video bg-slate-900 rounded border border-slate-300 flex items-center justify-center cursor-pointer relative group overflow-hidden"
                    >
                      {frame.base64Image ? (
                        <img
                          src={`data:image/png;base64,${frame.base64Image}`}
                          alt={frameName}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-slate-400 text-xs font-mono flex flex-col items-center gap-1">
                          <Layers className="w-5 h-5 text-slate-500" />
                          <span>{frameName}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-medium gap-1">
                        <ZoomIn className="w-4 h-4" /> Xem chi tiết
                      </div>
                    </div>

                    {/* Checks Checklist */}
                    <div className="text-[11px] space-y-1 bg-white p-2 rounded border border-slate-200 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">LaTeX Readable:</span>
                        <span className={frame.checks?.formulaReadable ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                          {frame.checks?.formulaReadable ? "YES" : "NO"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Text Overlap:</span>
                        <span className={!frame.checks?.textOverlap ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                          {frame.checks?.textOverlap ? "DETECTED" : "NONE"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Safe Margin:</span>
                        <span className={!frame.checks?.safeMarginViolated ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                          {frame.checks?.safeMarginViolated ? "VIOLATED" : "OK"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Math Accurate:</span>
                        <span className={frame.checks?.mathAccurate ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                          {frame.checks?.mathAccurate ? "ACCURATE" : "MISMATCH"}
                        </span>
                      </div>
                    </div>

                    {/* Notes */}
                    <p className="text-[11px] text-slate-600 italic line-clamp-2">
                      {frame.notes || "Khung hình đạt tiêu chuẩn hình ảnh."}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* QA Breakdown Matrix */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Bảng Kiểm Tra Tiêu Chuẩn Thị Giác &amp; Toán Học (Zero Inference):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Math Invariant:</span>
                  <span className="font-mono font-bold text-emerald-700">{frameQAReport.qaMetrics.mathFrameQa}</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Geometry Check:</span>
                  <span className="font-mono font-bold text-slate-700">{frameQAReport.qaMetrics.geometryFrameQa}</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Graph Invariant:</span>
                  <span className="font-mono font-bold text-slate-700">{frameQAReport.qaMetrics.graphFrameQa}</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Camera Framing:</span>
                  <span className="font-mono font-bold text-emerald-700">{frameQAReport.qaMetrics.cameraFrameQa}</span>
                </div>
              </div>
            </div>

            {/* Issues List with Repair Classification */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Danh sách vấn đề &amp; Phân loại sửa đổi ({frameQAReport.summary.totalIssues}):
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Quy tắc: SAFE_AUTO_REPAIR chỉ cho layout/spacing; REVIEW_REQUIRED cho toán/hình học
                </span>
              </div>

              {frameQAReport.summary.totalIssues === 0 ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Không phát hiện lỗi thị giác hay sai lệch toán học nào trên các khung hình render.</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {[
                    ...frameQAReport.frames.start.issues.map((i) => ({ ...i, frame: "START.png" })),
                    ...frameQAReport.frames.key.issues.map((i) => ({ ...i, frame: "KEY.png" })),
                    ...frameQAReport.frames.end.issues.map((i) => ({ ...i, frame: "END.png" })),
                  ].map((issue, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-start justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-700">{issue.frame}</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-purple-700 font-semibold">{issue.category}</span>
                          <span className="text-slate-300">•</span>
                          <span
                            className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              issue.severity === "CRITICAL" || issue.severity === "HIGH"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-slate-800">{issue.description}</p>
                      </div>

                      <div className="shrink-0">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                            issue.repairClass === "SAFE_AUTO_REPAIR"
                              ? "bg-cyan-50 text-cyan-800 border-cyan-300"
                              : "bg-amber-50 text-amber-800 border-amber-300"
                          }`}
                        >
                          {issue.repairClass}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* STEP 6E: OPENCLAW SAFE AUTO-REPAIR LOOP SECTION */}
      <div id="openclaw-auto-repair-section" className="pt-4 border-t border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  OPENCLAW SAFE AUTO-REPAIR LOOP (Step 6E)
                </h4>
                <span
                  id="auto-repair-status-badge"
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                    repairReport
                      ? repairReport.finalStatus === "PASS"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : repairReport.finalStatus === "REVIEW_REQUIRED"
                        ? "bg-blue-50 text-blue-700 border-blue-300"
                        : "bg-rose-50 text-rose-700 border-rose-300"
                      : isRepairing
                      ? "bg-amber-50 text-amber-700 border-amber-300"
                      : "bg-indigo-50 text-indigo-700 border-indigo-200"
                  }`}
                >
                  {isRepairing ? "RUNNING (MAX 3 ATTEMPTS)" : repairReport ? repairReport.finalStatus : "READY"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Vòng lặp tự động sửa lỗi thị giác an toàn: OpenClaw Patch $\rightarrow$ Safety Validator $\rightarrow$ Apply $\rightarrow$ Local Bridge Rerender $\rightarrow$ Frame QA.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Auto Repair Safe Issues Button */}
            <button
              id="run-auto-repair-button"
              onClick={handleRunAutoRepair}
              disabled={!isAutoRepairEnabled || isRepairing}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition ${
                isAutoRepairEnabled && !isRepairing
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                  : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed"
              }`}
              title={
                !hasSafeIssues
                  ? "Chỉ kích hoạt khi có lỗi SAFE_AUTO_REPAIR từ Visual Frame QA"
                  : "Khởi chạy vòng lặp OpenClaw Auto-Repair an toàn"
              }
            >
              <Wrench className={`w-3.5 h-3.5 ${isRepairing ? "animate-spin" : ""}`} />
              <span>{isRepairing ? "Đang sửa tự động..." : "[ Auto Repair Safe Issues ]"}</span>
            </button>

            {/* Run Repair Smoke Test Button */}
            <button
              id="run-repair-smoke-test-button"
              onClick={handleRunRepairSmokeTest}
              disabled={isRepairing}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs transition cursor-pointer"
              title="Chạy kịch bản test Dev chuyên dụng RepairSmokeTest (cố ý tạo layout error và kiểm tra auto repair)"
            >
              <Play className="w-3.5 h-3.5 text-indigo-600" />
              <span>Repair Smoke Test</span>
            </button>
          </div>
        </div>

        {/* Human Review Required Notice (Rule 4 & 15) */}
        {hasReviewOnly && (
          <div id="human-review-required-banner" className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2">
            <div className="flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-900 font-mono">HUMAN REVIEW REQUIRED</strong>
                <p className="text-amber-800 mt-0.5 text-[11px] leading-relaxed">
                  Phát hiện lỗi liên quan đến toán học, hình học hoặc đồ thị (MATH_ERROR, GEOMETRY_ERROR, GRAPH_ERROR). Theo quy chuẩn an toàn số học, hệ thống <strong>tuyệt đối không tự động sửa</strong> để tránh biến dạng chân lý bài toán.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-6 pt-1">
              <button
                onClick={() => setHumanReviewModalIssue(allFrameIssues[0] || null)}
                className="px-2.5 py-1 rounded bg-amber-200/80 hover:bg-amber-300 text-amber-900 text-[11px] font-semibold transition cursor-pointer"
              >
                [ View Issue ]
              </button>
              <button
                onClick={() => setShowSmokeRepairCode(!showSmokeRepairCode)}
                className="px-2.5 py-1 rounded bg-amber-200/80 hover:bg-amber-300 text-amber-900 text-[11px] font-semibold transition cursor-pointer"
              >
                [ View Source ]
              </button>
            </div>
          </div>
        )}

        {repairError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{repairError}</span>
            </div>
            <button onClick={() => setRepairError(null)} className="text-rose-600 hover:text-rose-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Repair Session Detailed Report */}
        {repairReport && (
          <div id="repair-session-report-panel" className="space-y-4 bg-white border border-indigo-200 rounded-xl p-4 shadow-xs">
            {/* Top Indicator Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Báo cáo Auto-Repair Loop (Scene: {repairReport.sceneName})
                  </span>
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
                      repairReport.finalStatus === "PASS"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : repairReport.finalStatus === "REVIEW_REQUIRED"
                        ? "bg-blue-50 text-blue-700 border-blue-300"
                        : "bg-rose-50 text-rose-700 border-rose-300"
                    }`}
                  >
                    STATUS: {repairReport.finalStatus}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Số lần thử nghiệm (Attempts): <strong>{repairReport.totalAttempts} / 3</strong> • Khởi tạo: {new Date(repairReport.timestamp).toLocaleTimeString()}
                </p>
              </div>

              <div className="text-right text-xs">
                <span className="text-slate-500 text-[11px]">Protected Math Invariant: </span>
                <span className="font-mono font-bold px-2 py-0.5 rounded text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-300">
                  {repairReport.qaSummary.protectedDataMutationQa === "PASS" ? "LOCKED & VERIFIED" : "MUTATION VIOLATION"}
                </span>
              </div>
            </div>

            {/* QA Checklist Matrix */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Ma trận Kiểm định An toàn &amp; Bảo vệ Toán học (13 Chỉ số):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 font-sans">Repair Backend:</span>
                  <span className="font-bold text-indigo-700">LOCAL_CLI</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 font-sans">Local Infer QA:</span>
                  <span className="font-bold text-emerald-700">{repairReport.qaSummary.openClawLocalInferenceQa}</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 font-sans">Gateway Infer:</span>
                  <span className="font-bold text-slate-500">{repairReport.qaSummary.openClawGatewayInferenceQa}</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 font-sans">Safe Gate QA:</span>
                  <span className="font-bold text-emerald-700">{repairReport.qaSummary.safeRepairGateQa}</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 font-sans">Review Gate:</span>
                  <span className="font-bold text-slate-700">{repairReport.qaSummary.reviewRequiredGateQa}</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 font-sans">Patch Safety QA:</span>
                  <span className="font-bold text-emerald-700">{repairReport.qaSummary.patchSafetyQa}</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 font-sans">Path Security QA:</span>
                  <span className="font-bold text-emerald-700">{repairReport.qaSummary.patchPathSecurityQa}</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 font-sans">Code Security QA:</span>
                  <span className="font-bold text-emerald-700">{repairReport.qaSummary.patchCodeSecurityQa}</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 font-sans">Backup/Rollback:</span>
                  <span className="font-bold text-emerald-700">{repairReport.qaSummary.backupRollbackQa}</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 font-sans">Rerender QA:</span>
                  <span className="font-bold text-emerald-700">{repairReport.qaSummary.rerenderQa}</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 font-sans">Post Frame QA:</span>
                  <span className="font-bold text-emerald-700">{repairReport.qaSummary.postRepairFrameQa}</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 font-sans">Geometry Lock:</span>
                  <span className="font-bold text-emerald-700">{repairReport.qaSummary.geometryLockQa}</span>
                </div>
              </div>
            </div>

            {/* Attempts Timeline */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Lịch sử Các Lần Sửa (Attempts Timeline):
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Giới hạn tối đa: 3 lần thử
                </span>
              </div>

              <div className="space-y-2.5">
                {repairReport.attempts.map((att) => (
                  <div
                    key={att.attempt}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                          Attempt {att.attempt}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          Job: <code className="font-mono text-slate-800">{att.renderJobId || "N/A"}</code>
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                            att.validationStatus === "PASS"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-rose-100 text-rose-800 border-rose-200"
                          }`}
                        >
                          VALIDATION: {att.validationStatus}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                            att.frameQaStatus === "PASS"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-amber-100 text-amber-800 border-amber-200"
                          }`}
                        >
                          FRAME QA: {att.frameQaStatus || "PENDING"}
                        </span>
                      </div>
                    </div>

                    {/* Proposed Changes Diff */}
                    <div className="space-y-1 bg-white p-2 rounded border border-slate-200">
                      <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <GitCommit className="w-3 h-3 text-indigo-600" />
                        <span>Các thay đổi được đề xuất ({att.proposedChanges.length}):</span>
                      </div>

                      {att.proposedChanges.map((change, cIdx) => (
                        <div key={cIdx} className="font-mono text-[11px] space-y-0.5 bg-slate-900 text-slate-100 p-2 rounded">
                          <div className="text-slate-400 text-[10px]"># File: {change.file} ({change.category})</div>
                          <div className="text-rose-400">- {change.oldText}</div>
                          <div className="text-emerald-400">+ {change.newText}</div>
                        </div>
                      ))}
                    </div>

                    {att.validationErrors && att.validationErrors.length > 0 && (
                      <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                        <strong>Lỗi kiểm định:</strong> {att.validationErrors.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Human Review Modal */}
      {humanReviewModalIssue && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Chi tiết Lỗi Cần Con Người Duyệt (Human Review Required)
                </h3>
              </div>
              <button
                onClick={() => setHumanReviewModalIssue(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-950">
                <div className="font-mono font-bold mb-1">
                  Loại lỗi: {humanReviewModalIssue.category} • Mức độ: {humanReviewModalIssue.severity}
                </div>
                <p className="text-[11px]">{humanReviewModalIssue.description}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1 font-mono text-[11px]">
                <div className="font-bold text-slate-700 font-sans">Quy tắc an toàn bảo vệ:</div>
                <p className="text-slate-600 font-sans">
                  Hệ thống AI không được tự động chỉnh sửa các công thức toán học, hệ số, nghiệm số, tọa độ hình học hoặc thông số đồ thị. Vui lòng chỉnh sửa trực tiếp trong mã nguồn bài toán nếu cần thiết.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setHumanReviewModalIssue(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Frame Preview Modal */}
      {selectedFrameModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Chi tiết Khung hình: {selectedFrameModal.frameName}.png
                </h3>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                    selectedFrameModal.status === "PASS"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "bg-rose-50 text-rose-700 border-rose-300"
                  }`}
                >
                  {selectedFrameModal.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedFrameModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
                {selectedFrameModal.base64Image ? (
                  <img
                    src={`data:image/png;base64,${selectedFrameModal.base64Image}`}
                    alt={selectedFrameModal.frameName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-slate-500 font-mono text-xs">Không có dữ liệu ảnh</div>
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 uppercase text-[11px] mb-1">Ghi chú Kiểm định:</h4>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                    {selectedFrameModal.notes}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 uppercase text-[11px] mb-1">
                    Vấn đề ghi nhận ({selectedFrameModal.issues.length}):
                  </h4>
                  {selectedFrameModal.issues.length === 0 ? (
                    <p className="text-emerald-700 italic">Khung hình đạt chuẩn không có lỗi.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {selectedFrameModal.issues.map((iss, i) => (
                        <div key={i} className="p-2 rounded bg-slate-50 border border-slate-200">
                          <div className="flex items-center justify-between font-mono text-[10px] mb-0.5">
                            <span className="font-bold text-purple-700">{iss.category}</span>
                            <span className="font-bold text-rose-700">{iss.severity}</span>
                          </div>
                          <p className="text-slate-800 text-[11px]">{iss.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
