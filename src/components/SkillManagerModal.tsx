import React from "react";
import {
  Sparkles,
  ShieldCheck,
  Camera,
  Layers,
  Mic,
  Workflow,
  Lock,
  CheckCircle2,
  Sliders,
  X,
  Info,
  ShieldAlert,
} from "lucide-react";
import {
  SkillModeType,
  SkillModuleId,
  SafetyLocks,
  SkillMetadataSafe,
} from "../types/mathSchema.js";

interface SkillManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  skillMode: SkillModeType;
  onChangeSkillMode: (mode: SkillModeType) => void;
  manualModules: Record<SkillModuleId, boolean>;
  onToggleModule: (modId: SkillModuleId) => void;
  safetyLocks: SafetyLocks;
  onToggleSafetyLock: (lockKey: keyof SafetyLocks) => void;
  activeModulesList: SkillModuleId[];
}

export const SkillManagerModal: React.FC<SkillManagerModalProps> = ({
  isOpen,
  onClose,
  skillMode,
  onChangeSkillMode,
  manualModules,
  onToggleModule,
  safetyLocks,
  onToggleSafetyLock,
  activeModulesList,
}) => {
  if (!isOpen) return null;

  const moduleDefinitions: {
    id: SkillModuleId;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    coreRequired?: boolean;
  }[] = [
    {
      id: "STYLE_REFERENCE_FACEBOOK_V1",
      label: "Cinematic Style",
      description: "Bảng màu điện ảnh tương phản cao, phong cách 3Blue1Brown & Facebook V1.",
      icon: Sparkles,
    },
    {
      id: "CAMERA_DIRECTOR",
      label: "Camera Director",
      description: "Chuyển động camera điện ảnh: Overview -> Travel -> Focus -> Settle -> Read -> Pull out.",
      icon: Camera,
    },
    {
      id: "VISUAL_SYSTEM",
      label: "Visual System",
      description: "Hệ thống bố cục master canvas, phân vùng đồ thị, hình học và công thức toán.",
      icon: Layers,
    },
    {
      id: "MATH_GEOMETRY_QA",
      label: "Math / Geometry QA",
      description: "Bảo đảm bất biến hình học, kiểm định không suy diễn và tính đúng đắn toán học.",
      icon: ShieldCheck,
      coreRequired: true,
    },
    {
      id: "NARRATION_SYNC",
      label: "Narration Sync",
      description: "Khớp nhịp giọng đọc giáo viên với chuyển động hình ảnh và công thức.",
      icon: Mic,
    },
    {
      id: "WORKFLOW",
      label: "Workflow",
      description: "Quy trình phân đoạn scene, nhịp diễn hoạt và cấu trúc sư phạm bài giảng.",
      icon: Workflow,
    },
  ];

  const isMathQaForced = safetyLocks.mathLock || safetyLocks.geometryLock;

  return (
    <div
      id="skill-manager-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold tracking-tight text-white">SKILL MANAGER</h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  STATUS: ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">MANIM CINEMATIC VIDEO (v1.0.0)</p>
            </div>
          </div>
          <button
            id="close-skill-modal-btn"
            onClick={onClose}
            aria-label="Đóng cửa sổ quản lý skill"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Skill Mode Segmented Control */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  Skill Mode
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  {skillMode === "AUTO"
                    ? "AUTO: Skill Router tự động kích hoạt module tối ưu theo loại tác vụ toán học."
                    : "MANUAL: Bạn có toàn quyền tùy chỉnh bật/tắt từng module độc lập."}
                </p>
              </div>

              {/* Segmented Selector */}
              <div className="flex items-center p-1 bg-slate-200/80 rounded-lg shrink-0">
                <button
                  id="skill-mode-auto-btn"
                  onClick={() => onChangeSkillMode("AUTO")}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                    skillMode === "AUTO"
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  ● AUTO
                </button>
                <button
                  id="skill-mode-manual-btn"
                  onClick={() => onChangeSkillMode("MANUAL")}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                    skillMode === "MANUAL"
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  ○ MANUAL
                </button>
              </div>
            </div>
          </div>

          {/* Safety Locks Section */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-600" />
                Safety Locks (Ưu tiên tuyệt đối)
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Active Locks
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {/* Math Lock */}
              <button
                id="toggle-math-lock-btn"
                type="button"
                onClick={() => onToggleSafetyLock("mathLock")}
                className={`p-3 rounded-lg border text-left transition flex items-start justify-between gap-2 ${
                  safetyLocks.mathLock
                    ? "bg-blue-50/80 border-blue-200 text-blue-900"
                    : "bg-white border-slate-200 text-slate-500"
                }`}
              >
                <div>
                  <div className="text-xs font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Math Lock
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Khóa bất biến công thức & số liệu.
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                    safetyLocks.mathLock
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {safetyLocks.mathLock ? "ON" : "OFF"}
                </span>
              </button>

              {/* Geometry Lock */}
              <button
                id="toggle-geometry-lock-btn"
                type="button"
                onClick={() => onToggleSafetyLock("geometryLock")}
                className={`p-3 rounded-lg border text-left transition flex items-start justify-between gap-2 ${
                  safetyLocks.geometryLock
                    ? "bg-blue-50/80 border-blue-200 text-blue-900"
                    : "bg-white border-slate-200 text-slate-500"
                }`}
              >
                <div>
                  <div className="text-xs font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Geometry Lock
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Khóa tọa độ, đỉnh, cạnh & góc.
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                    safetyLocks.geometryLock
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {safetyLocks.geometryLock ? "ON" : "OFF"}
                </span>
              </button>

              {/* Zero Inference */}
              <button
                id="toggle-zero-inference-btn"
                type="button"
                onClick={() => onToggleSafetyLock("zeroInference")}
                className={`p-3 rounded-lg border text-left transition flex items-start justify-between gap-2 ${
                  safetyLocks.zeroInference
                    ? "bg-blue-50/80 border-blue-200 text-blue-900"
                    : "bg-white border-slate-200 text-slate-500"
                }`}
              >
                <div>
                  <div className="text-xs font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Zero Inference
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Không tự suy diễn nếu thiếu dữ kiện.
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                    safetyLocks.zeroInference
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {safetyLocks.zeroInference ? "ON" : "OFF"}
                </span>
              </button>
            </div>
          </div>

          {/* Module List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Active Modules ({activeModulesList.length} / 6)
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {skillMode === "AUTO" ? "Tự động quản lý theo Task" : "Chế độ thủ công"}
              </span>
            </div>

            <div className="space-y-2">
              {moduleDefinitions.map((mod) => {
                const Icon = mod.icon;
                const isActive =
                  skillMode === "AUTO"
                    ? activeModulesList.includes(mod.id)
                    : manualModules[mod.id] || (mod.id === "MATH_GEOMETRY_QA" && isMathQaForced);

                const isLocked =
                  skillMode === "MANUAL" && mod.id === "MATH_GEOMETRY_QA" && isMathQaForced;

                return (
                  <div
                    key={mod.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition ${
                      isActive
                        ? "bg-white border-blue-200 shadow-xs"
                        : "bg-slate-50 border-slate-200/80 opacity-70"
                    }`}
                  >
                    <div className="flex items-start space-x-3 pr-4">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isActive
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900">{mod.label}</span>
                          {isLocked && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> Khóa bởi Safety Lock
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-slate-400">
                            ({mod.id})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{mod.description}</p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {skillMode === "MANUAL" ? (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isActive}
                            disabled={isLocked}
                            onChange={() => onToggleModule(mod.id)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      ) : (
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-400"
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Chỉ sử dụng metadata an toàn, không gửi raw system instruction.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
