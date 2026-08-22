import React, { useState, useEffect } from "react";
import {
  Video,
  Play,
  Pause,
  Download,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Clock,
  Mic,
  Code2,
  Layers,
  Film,
  AlertCircle,
  FileCode,
  ShieldCheck,
  Camera,
  Sliders,
  Lock,
  Compass,
  LineChart,
  Edit3,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import {
  VideoSpecification,
  ManimScene,
  VideoStyleType,
  SkillModeType,
  SkillModuleId,
  SafetyLocks,
  VideoPipelineStageItem,
} from "../../types/mathSchema.js";
import { MathView } from "../MathView.js";
import { LocalRenderPanel } from "../LocalRenderPanel.js";
import { LocalRenderEngineCard } from "../LocalRenderEngineCard.js";

interface VideoTabProps {
  videoSpec: VideoSpecification | null;
  onProceedToQA: () => void;
  isProcessing: boolean;
  videoStyle: VideoStyleType;
  onChangeVideoStyle: (style: VideoStyleType) => void;
  skillMode: SkillModeType;
  onChangeSkillMode: (mode: SkillModeType) => void;
  manualModules: Record<SkillModuleId, boolean>;
  onToggleModule: (modId: SkillModuleId) => void;
  safetyLocks: SafetyLocks;
  onToggleSafetyLock: (lockKey: keyof SafetyLocks) => void;
  onOpenSkillManager: () => void;
  onRegenerateVideo?: () => void;
}

export const VideoTab: React.FC<VideoTabProps> = ({
  videoSpec,
  onProceedToQA,
  isProcessing,
  videoStyle,
  onChangeVideoStyle,
  skillMode,
  onChangeSkillMode,
  manualModules,
  onToggleModule,
  safetyLocks,
  onToggleSafetyLock,
  onOpenSkillManager,
  onRegenerateVideo,
}) => {
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeView, setActiveView] = useState<"storyboard" | "python" | "render">("storyboard");

  // Render job state
  const [renderJobId, setRenderJobId] = useState<string | null>(null);
  const [renderStatus, setRenderStatus] = useState<"IDLE" | "QUEUED" | "RENDERING" | "COMPLETED" | "FAILED">("IDLE");
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderLogs, setRenderLogs] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  // Poll render job status
  useEffect(() => {
    if (!renderJobId || renderStatus === "COMPLETED" || renderStatus === "FAILED") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/video/status/${renderJobId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status) {
            setRenderStatus(data.status.status);
            setRenderProgress(data.status.progress || 0);
            setRenderLogs(data.status.logs || []);
            if (data.status.videoUrl) {
              setVideoUrl(data.status.videoUrl);
            }
          }
        }
      } catch (err) {
        console.error("Polling video status error:", err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [renderJobId, renderStatus]);

  // Video Styles definitions
  const videoStyleOptions: {
    id: VideoStyleType;
    label: string;
    description: string;
    badge: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: "cinematic_infographic",
      label: "Cinematic Infographic",
      description: "Đầy đủ 6 module: Camera Director, Visual System, Facebook V1 style & narration sync.",
      badge: "Mặc định (Khuyên dùng)",
      icon: Sparkles,
    },
    {
      id: "standard_manim",
      label: "Standard Manim",
      description: "Hoạt họa vector chuẩn 3Blue1Brown, không áp dụng Facebook style nặng.",
      badge: "Cổ điển",
      icon: Film,
    },
    {
      id: "geometry_focus",
      label: "Geometry Focus",
      description: "Tối ưu hóa hình học 2D/3D, Geometry Lock bảo đảm bất biến tọa độ.",
      badge: "Hình học",
      icon: Compass,
    },
    {
      id: "graph_animation",
      label: "Graph Animation",
      description: "Đồ thị giải tích chính xác, khóa GraphSpec và tiếp tuyến/tiệm cận.",
      badge: "Đồ thị",
      icon: LineChart,
    },
    {
      id: "whiteboard",
      label: "Whiteboard",
      description: "Phong cách bảng viết phấn/bút dạ, nhấn mạnh từng nét giải toán.",
      badge: "Bảng sư phạm",
      icon: Edit3,
    },
    {
      id: "custom_reference",
      label: "Custom Reference",
      description: "Khung cấu hình chuẩn bị cho reference video phong cách riêng.",
      badge: "Tùy biến",
      icon: Sliders,
    },
  ];

  // Calculate active modules count
  const getActiveModulesCount = (): number => {
    if (skillMode === "MANUAL") {
      const keys = Object.keys(manualModules) as SkillModuleId[];
      let count = keys.filter((k) => manualModules[k]).length;
      // Math/Geometry QA is forced if locks are ON
      if ((safetyLocks.mathLock || safetyLocks.geometryLock) && !manualModules.MATH_GEOMETRY_QA) {
        count += 1;
      }
      return count;
    }
    // AUTO mode based on videoStyle
    if (videoStyle === "cinematic_infographic") return 6;
    if (videoStyle === "standard_manim") return 5;
    if (videoStyle === "geometry_focus") return 3;
    if (videoStyle === "graph_animation") return 3;
    if (videoStyle === "whiteboard") return 4;
    return 6;
  };

  const getResolvedModeName = (): string => {
    if (videoStyle === "geometry_focus") return "GEOMETRY_3D / GEOMETRY_2D";
    if (videoStyle === "graph_animation") return "GRAPH_2D";
    return "MANIM_VIDEO_CREATE";
  };

  // Pipeline stages status (10 Steps Pipeline)
  const pipelineStages: VideoPipelineStageItem[] = [
    { id: "storyboard", name: "Storyboard", status: videoSpec ? "PASS" : "WAITING" },
    { id: "visual_plan", name: "Visual Plan", status: videoSpec ? "PASS" : "WAITING" },
    { id: "skill_routing", name: "Skill Routing", status: videoSpec ? "PASS" : "WAITING" },
    { id: "manim_code", name: "Manim Code", status: videoSpec ? "PASS" : "WAITING" },
    { id: "narration_sync", name: "Narration Sync", status: videoSpec ? "PASS" : "WAITING" },
    { id: "camera_plan", name: "Camera Plan", status: videoStyle === "cinematic_infographic" && videoSpec ? "PASS" : videoSpec ? "PASS" : "WAITING" },
    { id: "local_validation", name: "Local Validation", status: "WAITING" },
    {
      id: "preview_render",
      name: "Preview Render",
      status: renderStatus === "COMPLETED" ? "PASS" : renderStatus === "RENDERING" ? "RUNNING" : "WAITING",
    },
    { id: "frame_extraction", name: "Frame Extraction", status: "WAITING" },
    { id: "qa", name: "QA", status: "WAITING" },
  ];

  if (!videoSpec) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
          <Video className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Chưa có kịch bản Video Manim</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Quy trình Video Planner sẽ tự động chuyển đổi lời giải đã kiểm định thành phân cảnh Manim.
          </p>
        </div>

        {/* Video Style Selector Pre-configuration */}
        <div className="max-w-xl mx-auto text-left bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Chọn Video Style cho bài giảng:
            </span>
            <button
              onClick={onOpenSkillManager}
              className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              <Sliders className="w-3.5 h-3.5" /> Quản lý Skill &amp; Locks
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {videoStyleOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onChangeVideoStyle(opt.id)}
                className={`p-3 rounded-lg border text-left transition flex items-start space-x-2.5 ${
                  videoStyle === opt.id
                    ? "bg-blue-50 border-blue-400 shadow-xs"
                    : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                    videoStyle === opt.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <opt.icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{opt.label}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">{opt.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Local Render Engine Card in pre-configuration state */}
        <div className="max-w-xl mx-auto text-left">
          <LocalRenderEngineCard />
        </div>
      </div>
    );
  }

  const scenes = videoSpec.scenes || [];
  const activeScene: ManimScene | undefined = scenes[selectedSceneIndex] || scenes[0];

  const handleCopyPython = () => {
    navigator.clipboard.writeText(videoSpec.manim_python_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadPython = () => {
    const blob = new Blob([videoSpec.manim_python_code], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `manim_math_scene_${Date.now()}.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRequestRender = async () => {
    setIsDispatching(true);
    try {
      const res = await fetch("/api/video/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoSpec,
          resolution: "1080p",
          fps: 30,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.jobStatus) {
          setRenderJobId(data.jobStatus.jobId);
          setRenderStatus(data.jobStatus.status);
          setRenderProgress(data.jobStatus.progress);
          setRenderLogs(data.jobStatus.logs || []);
          setActiveView("render");
        }
      }
    } catch (err: any) {
      alert("Lỗi gửi yêu cầu render: " + err.message);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* SECTION 1: TOP BANNER & SKILL STATUS BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                BƯỚC 5 — VIDEO
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {scenes.length} Phân cảnh • {videoSpec.total_duration_seconds}s • {videoSpec.resolution}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {videoSpec.video_title || "Kịch bản Video Hoạt họa Manim"}
            </h1>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              id="open-skill-manager-btn"
              onClick={onOpenSkillManager}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 shadow-xs transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Skills ({getActiveModulesCount()} Modules)</span>
            </button>

            <button
              onClick={handleRequestRender}
              disabled={isDispatching || renderStatus === "RENDERING"}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              {renderStatus === "RENDERING" ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang render ({renderProgress}%)</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Yêu cầu Render Video</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ACTIVE SKILL & SAFETY LOCKS MINI-BAR (Section 5 & Section 4) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-slate-100">
          {/* Active Skill Indicator */}
          <div className="md:col-span-6 flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>ACTIVE SKILL:</span>
              <span className="text-blue-700 font-semibold">Manim Cinematic Video</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="text-slate-600 font-mono text-[11px]">
              MODE: <span className="font-bold text-slate-800">{getResolvedModeName()}</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="text-slate-600 font-mono text-[11px]">
              MODULES: <span className="font-bold text-emerald-700">{getActiveModulesCount()} active</span>
            </div>
          </div>

          {/* Quick Safety Locks Indicators (Section 4) */}
          <div className="md:col-span-6 flex items-center justify-end gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mr-1 flex items-center gap-1">
              <Lock className="w-3 h-3 text-blue-600" /> Locks:
            </span>

            <button
              onClick={() => onToggleSafetyLock("mathLock")}
              className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                safetyLocks.mathLock
                  ? "bg-blue-100/80 text-blue-800 border-blue-300"
                  : "bg-white text-slate-400 border-slate-200"
              }`}
            >
              Math Lock {safetyLocks.mathLock ? "ON" : "OFF"}
            </button>

            <button
              onClick={() => onToggleSafetyLock("geometryLock")}
              className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                safetyLocks.geometryLock
                  ? "bg-blue-100/80 text-blue-800 border-blue-300"
                  : "bg-white text-slate-400 border-slate-200"
              }`}
            >
              Geometry Lock {safetyLocks.geometryLock ? "ON" : "OFF"}
            </button>

            <button
              onClick={() => onToggleSafetyLock("zeroInference")}
              className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                safetyLocks.zeroInference
                  ? "bg-blue-100/80 text-blue-800 border-blue-300"
                  : "bg-white text-slate-400 border-slate-200"
              }`}
            >
              Zero Inference {safetyLocks.zeroInference ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: VIDEO STYLE SELECTOR (Section 1 in User Request) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Film className="w-4 h-4 text-blue-600" />
              Video Style
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chọn định dạng thẩm mỹ và ngôn ngữ chuyển động cho bài giảng Manim.
            </p>
          </div>

          <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
            {videoStyleOptions.find((o) => o.id === videoStyle)?.label}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          {videoStyleOptions.map((opt) => {
            const isSelected = videoStyle === opt.id;
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => onChangeVideoStyle(opt.id)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? "bg-blue-50/90 border-blue-500 shadow-xs ring-1 ring-blue-500/20"
                    : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[13px] text-slate-500 font-bold">
                    {isSelected ? "●" : "○"}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 leading-snug">{opt.label}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">
                    {opt.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* LOCAL RENDER ENGINE CARD (Step 6C) */}
      <LocalRenderEngineCard />

      {/* SECTION 3: CAMERA DIRECTOR PANEL (Section 6 in User Request) */}
      {videoStyle === "cinematic_infographic" && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-sm space-y-3 border border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block">
                  Camera Director: ON
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  Ngôn ngữ quay phim sư phạm &amp; Quy tắc chuyển động camera
                </span>
              </div>
            </div>

            <div className="px-2.5 py-1 rounded bg-slate-800 border border-slate-600 text-[11px] font-mono text-emerald-400">
              Rule: MOVE → SETTLE → READ → MOVE
            </div>
          </div>

          {/* Camera Language Progression Sequence */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
              Camera Language Flow:
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <span className="px-2.5 py-1 rounded bg-slate-800/90 text-blue-300 border border-slate-700">
                OVERVIEW
              </span>
              <span className="text-slate-500">→</span>
              <span className="px-2.5 py-1 rounded bg-slate-800/90 text-blue-300 border border-slate-700">
                TRAVEL
              </span>
              <span className="text-slate-500">→</span>
              <span className="px-2.5 py-1 rounded bg-slate-800/90 text-blue-300 border border-slate-700">
                FOCUS
              </span>
              <span className="text-slate-500">→</span>
              <span className="px-2.5 py-1 rounded bg-slate-800/90 text-blue-300 border border-slate-700">
                PUSH IN
              </span>
              <span className="text-slate-500">→</span>
              <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                SETTLE
              </span>
              <span className="text-slate-500">→</span>
              <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                READ
              </span>
              <span className="text-slate-500">→</span>
              <span className="px-2.5 py-1 rounded bg-slate-800/90 text-blue-300 border border-slate-700">
                PULL OUT
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/60 leading-relaxed">
            <span className="font-bold text-amber-300">Bảo đảm bất biến thị giác:</span> Camera animation không bao giờ che khuất công thức, điểm hình học, nhãn đỉnh, đường phụ hoặc đồ thị trọng yếu trong khoảnh khắc học sinh tiếp thu kiến thức.
          </div>
        </div>
      )}

      {/* SECTION 4: VIDEO PIPELINE STATUS TRACKER (Section 7 in User Request) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Video Pipeline Execution Tracker (10 Bước)
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {pipelineStages.filter((s) => s.status === "PASS").length} / 10 Completed
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {pipelineStages.map((stage, idx) => {
            const isPass = stage.status === "PASS";
            const isRunning = stage.status === "RUNNING";
            return (
              <div
                key={stage.id}
                className={`p-2 rounded-lg border flex flex-col justify-between space-y-1 transition ${
                  isPass
                    ? "bg-emerald-50/60 border-emerald-200"
                    : isRunning
                    ? "bg-blue-50/70 border-blue-300"
                    : "bg-slate-50 border-slate-200 opacity-70"
                }`}
              >
                <div className="text-[9px] text-slate-500 font-mono">{idx + 1}. Stage</div>
                <div className="text-[11px] font-bold text-slate-900 leading-tight truncate">{stage.name}</div>
                <div>
                  <span
                    className={`text-[8px] uppercase font-extrabold px-1.5 py-0.5 rounded ${
                      isPass
                        ? "bg-emerald-100 text-emerald-800"
                        : isRunning
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {stage.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 5: SUB-NAVIGATION TABS */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveView("storyboard")}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeView === "storyboard"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Phân cảnh (Storyboard &amp; Lời thoại)</span>
        </button>

        <button
          onClick={() => setActiveView("python")}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeView === "python"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Mã nguồn Python (Manim CE)</span>
        </button>

        <button
          onClick={() => setActiveView("render")}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeView === "render"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Local Render Engine &amp; Logs</span>
        </button>
      </div>

      {/* VIEW 1: STORYBOARD TIMELINE */}
      {activeView === "storyboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 4 Cols: Scene List Timeline */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 px-1">
              Danh sách Phân cảnh ({scenes.length})
            </h3>

            <div className="space-y-2">
              {scenes.map((scene, idx) => (
                <div
                  key={scene.scene_id}
                  onClick={() => setSelectedSceneIndex(idx)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    selectedSceneIndex === idx
                      ? "bg-blue-50 border-blue-300 shadow-xs ring-1 ring-blue-400/30"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">
                      Cảnh {idx + 1}: {scene.title}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-blue-600" />
                      <span>{scene.narration.duration_hint_seconds}s</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {scene.learning_goal}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right 8 Cols: Active Scene Detail Inspector */}
          <div className="lg:col-span-8 space-y-4">
            {activeScene && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                      Phân cảnh {selectedSceneIndex + 1} / {scenes.length}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-0.5">
                      {activeScene.title}
                    </h2>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Thời lượng gợi ý: {activeScene.narration.duration_hint_seconds}s</span>
                  </div>
                </div>

                {/* Educational Learning Goal */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700 block">
                    Mục tiêu sư phạm (Learning Goal):
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {activeScene.learning_goal}
                  </p>
                </div>

                {/* Mathematical Content in Scene */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-700 block">
                    Nội dung Toán học trên màn hình (Math Content):
                  </span>
                  <div className="p-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 overflow-x-auto">
                    <MathView block>{activeScene.math_content.latex}</MathView>
                  </div>
                  <p className="text-xs text-slate-600 italic">
                    {activeScene.math_content.explanation}
                  </p>
                </div>

                {/* Teacher Narration Voiceover Script */}
                <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-800 flex items-center space-x-1.5">
                      <Mic className="w-3.5 h-3.5 text-blue-600" />
                      <span>Lời thoại Giáo viên (Voiceover Script):</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono border border-blue-200">
                      Tone: {activeScene.narration.voice_tone}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans font-normal">
                    "{activeScene.narration.text_vi}"
                  </p>
                </div>

                {/* Manim Animations in Scene */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 block">
                    Hiệu ứng hoạt họa Manim (Animations):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeScene.animations.map((anim, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <span className="font-mono text-blue-700 font-semibold">
                          {anim.type}({anim.target})
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {anim.duration}s
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: PYTHON MANIM SCRIPT */}
      {activeView === "python" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-blue-600" />
                <span>Mã nguồn Python Manim Community Edition (CE)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chạy trực tiếp bằng lệnh: <code className="text-blue-700 font-mono bg-slate-100 px-1 py-0.5 rounded">manim -pql scene.py MathLessonScene</code>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyPython}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? "Đã sao chép" : "Sao chép mã Python"}</span>
              </button>

              <button
                onClick={handleDownloadPython}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải file .py</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto h-[400px] leading-relaxed shadow-inner">
            <pre>{videoSpec.manim_python_code}</pre>
          </div>
        </div>
      )}

      {/* VIEW 3: LOCAL RENDER ENGINE & JOB MONITOR */}
      {activeView === "render" && (
        <LocalRenderPanel
          videoSpec={videoSpec}
          activeScene={activeScene}
          selectedSceneIndex={selectedSceneIndex}
        />
      )}
    </div>
  );
};
