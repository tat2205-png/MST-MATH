import React, { useState } from "react";
import { Header } from "./components/Header.js";
import { InputTab } from "./components/tabs/InputTab.js";
import { ParsedProblemTab } from "./components/tabs/ParsedProblemTab.js";
import { SolutionTab } from "./components/tabs/SolutionTab.js";
import { VisualTab } from "./components/tabs/VisualTab.js";
import { VideoTab } from "./components/tabs/VideoTab.js";
import { QATab } from "./components/tabs/QATab.js";
import { ExportModal } from "./components/ExportModal.js";
import { IntegrationDrawer } from "./components/IntegrationDrawer.js";
import { SkillManagerModal } from "./components/SkillManagerModal.js";
import {
  MathProblemIR,
  MathSolution,
  VisualSpecification,
  VerificationReport,
  VideoSpecification,
  ProviderType,
  VideoStyleType,
  SkillModeType,
  SkillModuleId,
  SafetyLocks,
} from "./types/mathSchema.js";
import { AlertCircle, CheckCircle2, Sparkles, X } from "lucide-react";
import { TeacherWorkspace } from "./components/teacher/TeacherWorkspace.js";

function StudioApp({ onOpenTeacher }: { onOpenTeacher: () => void }) {
  const [currentTab, setCurrentTab] = useState<"input" | "parsed" | "solution" | "visual" | "video" | "qa">("input");
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>("gemini");
  
  // Pipeline State
  const [problemIR, setProblemIR] = useState<MathProblemIR | null>(null);
  const [solution, setSolution] = useState<MathSolution | null>(null);
  const [verification, setVerification] = useState<VerificationReport | null>(null);
  const [visualSpec, setVisualSpec] = useState<VisualSpecification | null>(null);
  const [videoSpec, setVideoSpec] = useState<VideoSpecification | null>(null);

  // Video & Skill State (Step 5)
  const [videoStyle, setVideoStyle] = useState<VideoStyleType>("cinematic_infographic");
  const [skillMode, setSkillMode] = useState<SkillModeType>("AUTO");
  const [manualModules, setManualModules] = useState<Record<SkillModuleId, boolean>>({
    STYLE_REFERENCE_FACEBOOK_V1: true,
    CAMERA_DIRECTOR: true,
    VISUAL_SYSTEM: true,
    MATH_GEOMETRY_QA: true,
    NARRATION_SYNC: true,
    WORKFLOW: true,
  });
  const [safetyLocks, setSafetyLocks] = useState<SafetyLocks>({
    mathLock: true,
    geometryLock: true,
    zeroInference: true,
  });

  // UI Status State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pipelineProgressText, setPipelineProgressText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modals
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState<boolean>(false);
  const [isSkillManagerOpen, setIsSkillManagerOpen] = useState<boolean>(false);

  // Calculate Active Modules based on AUTO / MANUAL
  const getActiveModulesList = (): SkillModuleId[] => {
    if (skillMode === "MANUAL") {
      const active = (Object.keys(manualModules) as SkillModuleId[]).filter((k) => manualModules[k]);
      if ((safetyLocks.mathLock || safetyLocks.geometryLock) && !active.includes("MATH_GEOMETRY_QA")) {
        active.push("MATH_GEOMETRY_QA");
      }
      return active;
    }
    // AUTO selection based on video style
    if (videoStyle === "cinematic_infographic") {
      return [
        "STYLE_REFERENCE_FACEBOOK_V1",
        "CAMERA_DIRECTOR",
        "VISUAL_SYSTEM",
        "MATH_GEOMETRY_QA",
        "NARRATION_SYNC",
        "WORKFLOW",
      ];
    }
    if (videoStyle === "standard_manim") {
      return ["CAMERA_DIRECTOR", "VISUAL_SYSTEM", "MATH_GEOMETRY_QA", "NARRATION_SYNC", "WORKFLOW"];
    }
    if (videoStyle === "geometry_focus") {
      return ["MATH_GEOMETRY_QA", "CAMERA_DIRECTOR", "VISUAL_SYSTEM"];
    }
    if (videoStyle === "graph_animation") {
      return ["MATH_GEOMETRY_QA", "CAMERA_DIRECTOR", "VISUAL_SYSTEM"];
    }
    if (videoStyle === "whiteboard") {
      return ["MATH_GEOMETRY_QA", "NARRATION_SYNC", "WORKFLOW", "VISUAL_SYSTEM"];
    }
    return [
      "STYLE_REFERENCE_FACEBOOK_V1",
      "CAMERA_DIRECTOR",
      "VISUAL_SYSTEM",
      "MATH_GEOMETRY_QA",
      "NARRATION_SYNC",
      "WORKFLOW",
    ];
  };

  const handleToggleModule = (modId: SkillModuleId) => {
    // If Math/Geometry Lock is ON, forbid turning off MATH_GEOMETRY_QA
    if (modId === "MATH_GEOMETRY_QA" && (safetyLocks.mathLock || safetyLocks.geometryLock)) {
      return;
    }
    setManualModules((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  const handleToggleSafetyLock = (lockKey: keyof SafetyLocks) => {
    setSafetyLocks((prev) => {
      const updated = { ...prev, [lockKey]: !prev[lockKey] };
      // If either mathLock or geometryLock becomes true, ensure MATH_GEOMETRY_QA is active
      if ((updated.mathLock || updated.geometryLock) && !manualModules.MATH_GEOMETRY_QA) {
        setManualModules((m) => ({ ...m, MATH_GEOMETRY_QA: true }));
      }
      return updated;
    });
  };

  // Run End-to-End Pipeline
  const handleStartPipeline = async (payload: {
    text?: string;
    imageBase64?: string;
    mimeType?: string;
    sourceType: "text" | "image" | "pdf" | "docx";
  }) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setPipelineProgressText("Bước 1/5: Đang phân tích và chuẩn hóa đề bài (ProblemParser)...");

    try {
      // 1. Problem Parser
      const parseRes = await fetch("/api/pipeline/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          providerId: selectedProvider,
        }),
      });

      const parseData = await parseRes.json();
      if (!parseData.success || !parseData.problemIR) {
        throw new Error(parseData.error || "Không thể trích xuất đề bài.");
      }

      const currentIR = parseData.problemIR as MathProblemIR;
      setProblemIR(currentIR);

      // If missing critical information, switch to parsed tab to show warning and stop
      if (currentIR.status === "NEED_MORE_INFORMATION") {
        setCurrentTab("parsed");
        setIsProcessing(false);
        return;
      }

      // 2. Solution Generator
      setPipelineProgressText("Bước 2/5: Đang sinh lời giải 3 phần chuẩn mực sư phạm (SolutionGenerator)...");
      const solveRes = await fetch("/api/pipeline/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemIR: currentIR,
          providerId: selectedProvider,
        }),
      });

      const solveData = await solveRes.json();
      if (!solveData.success || !solveData.solution) {
        throw new Error(solveData.error || "Không thể sinh lời giải.");
      }
      const currentSol = solveData.solution as MathSolution;
      setSolution(currentSol);

      // 3. Deterministic Math Verification Gate must complete before visual planning.
      setPipelineProgressText("Bước 3/5: Đang kiểm định 6 chiều toán học...");
      const verifyRes = await fetch("/api/pipeline/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemIR: currentIR,
          solution: currentSol,
          providerId: selectedProvider,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success || !verifyData.verification) {
        throw new Error(verifyData.error || "Không thể kiểm định lời giải toán học.");
      }
      const currentVerification = verifyData.verification as VerificationReport;
      setVerification(currentVerification);

      // 4. Visual planning may only consume the verified artifact.
      setPipelineProgressText("Bước 4/5: Đang lên bản vẽ minh họa (VisualPlanner)...");
      const visualRes = await fetch("/api/pipeline/visuals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemIR: currentIR,
          solution: currentSol,
          verification: currentVerification,
          providerId: selectedProvider,
        }),
      });
      const visualData = await visualRes.json();
      if (!visualRes.ok || !visualData.success || !visualData.visualSpec) {
        const reason = visualData.mathGate?.reasons?.join(" ");
        throw new Error(reason || visualData.error || "Math verification failure: cần kiểm tra thủ công trước khi tạo hình.");
      }
      setVisualSpec(visualData.visualSpec);

      // 5. Video Planning with Skill & Style Integration
      setPipelineProgressText("Bước 5/5: Đang thiết kế phân cảnh Manim & kịch bản giọng đọc (VideoPlanner)...");
      const videoRes = await fetch("/api/pipeline/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemIR: currentIR,
          solution: currentSol,
          verification: currentVerification,
          visualSpec: visualData.visualSpec || null,
          providerId: selectedProvider,
          videoStyle,
          skillMode,
          manualModules,
          safetyLocks,
        }),
      });

      const videoData = await videoRes.json();
      if (!videoRes.ok || !videoData.success || !videoData.videoSpec) {
        const reason = videoData.mathGate?.reasons?.join(" ");
        throw new Error(reason || videoData.error || "Không thể tạo kế hoạch video từ lời giải đã kiểm định.");
      }
      setVideoSpec(videoData.videoSpec);

      // Switch to solution tab automatically
      setCurrentTab("solution");
      setSuccessToast("Đã hoàn tất quy trình 6 bước chuẩn hóa toán học & sản xuất bài giảng!");
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      console.error("Pipeline execution error:", err);
      setErrorMessage(err.message || "Đã xảy ra lỗi trong quá trình thực hiện pipeline.");
    } finally {
      setIsProcessing(false);
      setPipelineProgressText("");
    }
  };

  // Re-generate video plan on demand (when user switches Video Style)
  const handleRegenerateVideo = async () => {
    if (!problemIR || !solution || !verification || !visualSpec) {
      setErrorMessage("Không thể tái tạo video khi chưa có lời giải, kiểm định toán học và hình minh họa hợp lệ.");
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);
    setPipelineProgressText(`Đang cập nhật kịch bản Manim theo phong cách ${videoStyle}...`);
    try {
      const res = await fetch("/api/pipeline/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemIR,
          solution,
          verification,
          visualSpec,
          providerId: selectedProvider,
          videoStyle,
          skillMode,
          manualModules,
          safetyLocks,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.videoSpec) {
        const reason = data.mathGate?.reasons?.join(" ");
        throw new Error(reason || data.error || "Không thể tái tạo video từ artifact đã được kiểm định.");
      }
      setVideoSpec(data.videoSpec);
      setSuccessToast(`Đã áp dụng phong cách ${videoStyle} cho kịch bản Video!`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Không thể tái tạo video.");
    } finally {
      setIsProcessing(false);
      setPipelineProgressText("");
    }
  };

  // Re-verify solution
  const handleReverify = async () => {
    if (!problemIR || !solution) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/pipeline/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemIR,
          solution,
          providerId: selectedProvider,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVerification(data.verification);
        setSuccessToast("Đã cập nhật kết quả kiểm định QA độc lập!");
        setTimeout(() => setSuccessToast(null), 3000);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <button
        onClick={onOpenTeacher}
        className="fixed bottom-4 right-4 z-50 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        Quy trình giáo viên
      </button>
      {/* App Header & Navigation */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        hasProblemIR={!!problemIR}
        hasSolution={!!solution}
        hasVisualSpec={!!visualSpec}
        hasVideoSpec={!!videoSpec}
        hasVerification={!!verification}
        selectedProvider={selectedProvider}
        onChangeProvider={setSelectedProvider}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenIntegrations={() => setIsIntegrationsOpen(true)}
        onOpenSkills={() => setIsSkillManagerOpen(true)}
        isProcessing={isProcessing}
      />

      {/* Global Pipeline Progress Bar */}
      {isProcessing && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center justify-between text-xs text-blue-900 shadow-sm">
          <div className="flex items-center space-x-2 max-w-7xl mx-auto w-full">
            <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="font-semibold">{pipelineProgressText}</span>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between shadow-sm">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Lỗi quy trình:</strong> {errorMessage}
              </div>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Success Toast Notification */}
      {successToast && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
            <button onClick={() => setSuccessToast(null)} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      <main className="flex-1 pb-12">
        {currentTab === "input" && (
          <InputTab onStartPipeline={handleStartPipeline} isProcessing={isProcessing} />
        )}

        {currentTab === "parsed" && (
          <ParsedProblemTab
            problemIR={problemIR}
            onProceedToSolution={() => setCurrentTab("solution")}
            onBackToInput={() => setCurrentTab("input")}
            isProcessing={isProcessing}
          />
        )}

        {currentTab === "solution" && (
          <SolutionTab
            problemIR={problemIR}
            solution={solution}
            onProceedToVisuals={() => setCurrentTab("visual")}
            onProceedToQA={() => setCurrentTab("qa")}
            isProcessing={isProcessing}
          />
        )}

        {currentTab === "visual" && (
          <VisualTab
            visualSpec={visualSpec}
            onProceedToVideo={() => setCurrentTab("video")}
            isProcessing={isProcessing}
          />
        )}

        {currentTab === "video" && (
          <VideoTab
            videoSpec={videoSpec}
            problemIR={problemIR}
            solution={solution}
            visualSpec={visualSpec}
            onProceedToQA={() => setCurrentTab("qa")}
            isProcessing={isProcessing}
            videoStyle={videoStyle}
            onChangeVideoStyle={(st) => {
              setVideoStyle(st);
            }}
            skillMode={skillMode}
            onChangeSkillMode={setSkillMode}
            manualModules={manualModules}
            onToggleModule={handleToggleModule}
            safetyLocks={safetyLocks}
            onToggleSafetyLock={handleToggleSafetyLock}
            onOpenSkillManager={() => setIsSkillManagerOpen(true)}
            onRegenerateVideo={handleRegenerateVideo}
          />
        )}

        {currentTab === "qa" && (
          <QATab
            problemIR={problemIR}
            solution={solution}
            verification={verification}
            videoSpec={videoSpec}
            onReverify={handleReverify}
            isProcessing={isProcessing}
          />
        )}
      </main>

      {/* Footer only exposes truthful build context; runtime metrics must come from the server. */}
      <footer className="bg-slate-100 border-t border-slate-200 px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <div className="flex items-center space-x-2">
          <span>Build mode:</span>
          <span className="font-mono font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
            {import.meta.env.MODE.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Runtime metrics are displayed only when reported by the server.</span>
          <span>© 2026 Math AI Video Studio</span>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        problemIR={problemIR}
        solution={solution}
        visualSpec={visualSpec}
        verification={verification}
        videoSpec={videoSpec}
      />

      <IntegrationDrawer
        isOpen={isIntegrationsOpen}
        onClose={() => setIsIntegrationsOpen(false)}
        problemIR={problemIR}
        solution={solution}
      />

      <SkillManagerModal
        isOpen={isSkillManagerOpen}
        onClose={() => setIsSkillManagerOpen(false)}
        skillMode={skillMode}
        onChangeSkillMode={setSkillMode}
        manualModules={manualModules}
        onToggleModule={handleToggleModule}
        safetyLocks={safetyLocks}
        onToggleSafetyLock={handleToggleSafetyLock}
        activeModulesList={getActiveModulesList()}
      />
    </div>
  );
}

export function App() {
  const [productSurface, setProductSurface] = useState<"teacher" | "studio">("teacher");
  return productSurface === "teacher"
    ? <TeacherWorkspace onOpenStudio={() => setProductSurface("studio")} />
    : <StudioApp onOpenTeacher={() => setProductSurface("teacher")} />;
}
export default App;