import React, { useState } from "react";
import {
  ShieldCheck,
  RefreshCw,
  Scale,
  Sparkles,
  Calculator,
  Compass,
  Cpu,
  Layers,
  Award,
  Video,
  FileCode,
  Mic,
  Camera,
  LineChart,
  Eye,
} from "lucide-react";
import type {
  MathProblemIR,
  MathSolution,
  QAStatusType,
  VerificationReport,
  VideoSpecification,
} from "../../types/mathSchema.js";
import { deriveQaEvidence } from "../../lib/qaEvidence.js";

interface QATabProps {
  problemIR: MathProblemIR | null;
  solution: MathSolution | null;
  verification: VerificationReport | null;
  videoSpec?: VideoSpecification | null;
  onReverify: () => void;
  isProcessing: boolean;
}

type QaDimension = {
  key: string;
  index: number;
  title: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  status: QAStatusType;
  details: string;
  scope: string;
};

const statusClasses = (status: QAStatusType) => {
  if (status === "PASS") return {
    border: "border-emerald-200",
    icon: "bg-emerald-100 text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800 border border-emerald-300",
  };
  if (status === "FAIL") return {
    border: "border-rose-200",
    icon: "bg-rose-100 text-rose-700",
    badge: "bg-rose-100 text-rose-800 border border-rose-300",
  };
  if (status === "NEED_SOURCE_VERIFICATION") return {
    border: "border-amber-200",
    icon: "bg-amber-100 text-amber-700",
    badge: "bg-amber-100 text-amber-800 border border-amber-300",
  };
  if (status === "NOT_APPLICABLE") return {
    border: "border-slate-200 opacity-70",
    icon: "bg-slate-100 text-slate-500",
    badge: "bg-slate-100 text-slate-600 border border-slate-200",
  };
  return {
    border: "border-blue-200",
    icon: "bg-blue-100 text-blue-700",
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
  };
};

export const QATab: React.FC<QATabProps> = ({
  problemIR,
  solution: _solution,
  verification,
  videoSpec,
  onReverify,
  isProcessing,
}) => {
  const [activeTabSection, setActiveTabSection] = useState<"video_qa" | "math_qa">("video_qa");

  if (!verification) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Chưa có báo cáo Kiểm định QA</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Chỉ hiển thị PASS khi có bằng chứng đúng với từng chiều QA.
        </p>
      </div>
    );
  }

  const isMathValid = verification.verification_seal === "CONFIRMED_VALID" && verification.status === "PASS";
  const evidence = deriveQaEvidence(problemIR, verification, videoSpec);

  const qaDimensions: QaDimension[] = [
    {
      key: "math_qa",
      index: 1,
      title: "Math QA",
      category: "Toán học",
      icon: Calculator,
      status: isMathValid ? "PASS" : "FAIL",
      details: isMathValid
        ? "Báo cáo kiểm định toán học đã xác nhận lời giải đạt gate hiện hành."
        : "Kiểm định toán học chưa đạt; không được phép suy ra PASS cho các chiều QA khác.",
      scope: "section_3_detailed_steps & final_answer",
    },
    {
      key: "geometry_qa",
      index: 2,
      title: "Geometry QA",
      category: "Hình học",
      icon: Compass,
      status: evidence.geometry,
      details:
        evidence.geometry === "PASS"
          ? `Geometry invariant evidence: ${verification.geometry_invariants.notes}`
          : evidence.geometry === "FAIL"
            ? `Geometry invariant check failed: ${verification.geometry_invariants.notes}`
            : evidence.geometry === "NOT_APPLICABLE"
              ? "Bài toán hiện tại không được phân loại là bài hình học."
              : "Chưa có bằng chứng chuyên biệt đủ để xác nhận Geometry QA.",
      scope: "Geometry invariant evidence / zero-inference",
    },
    {
      key: "graph_qa",
      index: 3,
      title: "Graph QA",
      category: "Giải tích",
      icon: LineChart,
      status: evidence.graph,
      details:
        evidence.graph === "PASS"
          ? "Có check chuyên biệt về đồ thị/hàm số trong báo cáo verification."
          : evidence.graph === "FAIL"
            ? "Check chuyên biệt về đồ thị/hàm số không đạt."
            : evidence.graph === "NOT_APPLICABLE"
              ? "Không phát hiện yêu cầu đồ thị/hàm số ở ngữ cảnh hiện tại."
              : evidence.graph === "NEED_SOURCE_VERIFICATION"
                ? "Evidence đồ thị yêu cầu xác minh nguồn trước khi PASS."
                : "Chưa có Graph QA evidence chuyên biệt; không dùng Math QA làm proxy.",
      scope: "Graph-specific verification checks",
    },
    {
      key: "layout_qa",
      index: 4,
      title: "Layout QA",
      category: "Bố cục",
      icon: Layers,
      status: evidence.layout,
      details:
        evidence.layout === "PASS"
          ? "MasterCanvas QA và KnowledgeRegion QA đều có evidence PASS."
          : evidence.layout === "FAIL"
            ? "MasterCanvas/KnowledgeRegion QA có evidence FAIL."
            : evidence.layout === "NEED_SOURCE_VERIFICATION"
              ? "Layout evidence cần xác minh nguồn."
              : "Có video spec không đồng nghĩa Layout QA đã chạy.",
      scope: "MasterCanvas QA & KnowledgeRegion QA",
    },
    {
      key: "camera_qa",
      index: 5,
      title: "Camera QA",
      category: "Điện ảnh",
      icon: Camera,
      status: evidence.camera,
      details:
        evidence.camera === "PASS"
          ? "CameraTarget QA và CameraPlan QA đều có evidence PASS."
          : evidence.camera === "FAIL"
            ? "Camera target/plan QA có evidence FAIL."
            : evidence.camera === "NEED_SOURCE_VERIFICATION"
              ? "Camera evidence cần xác minh nguồn."
              : "Có video spec không đồng nghĩa Camera QA đã chạy.",
      scope: "CameraTarget QA & CameraPlan QA",
    },
    {
      key: "narration_qa",
      index: 6,
      title: "Narration QA",
      category: "Sư phạm",
      icon: Mic,
      status: evidence.narration,
      details: "Scene hoặc narration tồn tại chỉ là content presence; chưa phải bằng chứng đồng bộ narration.",
      scope: "Narration sync evidence",
    },
    {
      key: "python_qa",
      index: 7,
      title: "Python QA",
      category: "Mã nguồn",
      icon: FileCode,
      status: evidence.python,
      details:
        evidence.python === "PASS"
          ? "Render job đã COMPLETED; runtime execution cung cấp evidence cho Python/Manim code."
          : evidence.python === "FAIL"
            ? "Render job FAILED; Python/Manim QA không đạt."
            : "Độ dài hoặc sự tồn tại của code không phải bằng chứng syntax/runtime PASS.",
      scope: "Executed Manim/Python runtime evidence",
    },
    {
      key: "manim_runtime_qa",
      index: 8,
      title: "Manim Runtime QA",
      category: "Kết xuất",
      icon: Video,
      status: evidence.manimRuntime,
      details:
        evidence.manimRuntime === "PASS"
          ? "Render job đã hoàn tất thành công."
          : evidence.manimRuntime === "FAIL"
            ? "Render job thất bại."
            : "Chưa có render-job evidence hoàn tất.",
      scope: "Render job execution",
    },
    {
      key: "frame_qa",
      index: 9,
      title: "Frame QA",
      category: "Hình ảnh",
      icon: Eye,
      status: evidence.frame,
      details: "VideoSpecification chưa mang evidence pixel/frame; Frame QA giữ NOT_TESTED cho tới khi có artifact chuyên biệt.",
      scope: "Rendered-frame evidence",
    },
  ];

  const getOverallStatus = (): {
    code: "RENDER_READY" | "RUNTIME_NOT_TESTED" | "QA_FAILED" | "NEED_SOURCE_VERIFICATION";
    label: string;
    color: string;
    description: string;
  } => {
    if (!isMathValid || qaDimensions.some((dimension) => dimension.status === "FAIL")) {
      return {
        code: "QA_FAILED",
        label: "QA FAILED",
        color: "bg-rose-100 text-rose-800 border-rose-300",
        description: "Có gate QA không đạt. Không được phát hành artifact như đã kiểm định.",
      };
    }

    if (qaDimensions.some((dimension) => dimension.status === "NEED_SOURCE_VERIFICATION")) {
      return {
        code: "NEED_SOURCE_VERIFICATION",
        label: "NEED_SOURCE_VERIFICATION",
        color: "bg-amber-100 text-amber-800 border-amber-300",
        description: "Có chiều QA cần xác minh evidence/source trước khi được phép PASS.",
      };
    }

    if (qaDimensions.some((dimension) => dimension.status === "NOT_TESTED")) {
      return {
        code: "RUNTIME_NOT_TESTED",
        label: "RUNTIME_NOT_TESTED",
        color: "bg-blue-100 text-blue-800 border-blue-300",
        description: "Một hoặc nhiều chiều QA chưa chạy bằng evidence chuyên biệt; hệ thống giữ trạng thái fail-closed.",
      };
    }

    return {
      code: "RENDER_READY",
      label: "RENDER_READY",
      color: "bg-emerald-100 text-emerald-800 border-emerald-300",
      description: "Mọi chiều áp dụng đều có evidence PASS.",
    };
  };

  const overall = getOverallStatus();

  const mathChecks = [
    {
      title: "1. Tính đúng Đại số & Ký hiệu (Symbolic Correctness)",
      result: verification.symbolic_correctness,
      icon: Calculator,
      desc: "Kiểm tra sự tương đương đại số giữa các bước biến đổi liên tiếp.",
    },
    {
      title: "2. Thử nghiệm Số học (Numeric Soundness)",
      result: verification.numeric_soundness,
      icon: Scale,
      desc: "Kiểm tra giá trị số học và các phép thế phù hợp.",
    },
    {
      title: "3. Logic Suy luận & Không suy diễn vô căn cứ",
      result: verification.logical_deduction,
      icon: Cpu,
      desc: "Kiểm tra tính hợp lệ của chuỗi suy luận.",
    },
    {
      title: "4. Bất biến Hình học (Geometry Invariants)",
      result: verification.geometry_invariants,
      icon: Compass,
      desc: "Kiểm tra các bất biến hình học theo evidence hiện có.",
    },
    {
      title: "5. Tập xác định & Điều kiện biên (Domain & Boundaries)",
      result: verification.domain_and_boundaries,
      icon: Layers,
      desc: "Kiểm tra điều kiện xác định và các biên toán học.",
    },
    {
      title: "6. Tính nhất quán về Thứ nguyên & Đơn vị",
      result: verification.units_and_dimensions,
      icon: Award,
      desc: "Kiểm tra đơn vị và thứ nguyên của đại lượng.",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${overall.color}`}>
                FINAL GATE: {overall.label}
              </span>
              <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                MATH SEAL: {verification.verification_seal}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Báo cáo Thẩm định QA Toàn diện (9 Chiều)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">{overall.description}</p>
          </div>
        </div>

        <button
          onClick={onReverify}
          disabled={isProcessing}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />
          <span>Kiểm định lại bài giải</span>
        </button>
      </div>

      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTabSection("video_qa")}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            activeTabSection === "video_qa"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>9 Chiều QA Hệ thống Video &amp; Toán học</span>
        </button>

        <button
          onClick={() => setActiveTabSection("math_qa")}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            activeTabSection === "math_qa"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Chi tiết 6 Chiều Kiểm định Lời giải Toán</span>
        </button>
      </div>

      {activeTabSection === "video_qa" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Ma trận Thẩm định 9 Chiều (QA Dimensions Matrix)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                PASS chỉ xuất hiện khi có evidence đúng với chiều QA tương ứng.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
              {qaDimensions.filter((dimension) => dimension.status === "PASS").length} PASS • {qaDimensions.filter((dimension) => dimension.status === "NOT_TESTED").length} NOT TESTED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {qaDimensions.map((dimension) => {
              const Icon = dimension.icon;
              const classes = statusClasses(dimension.status);
              return (
                <div
                  key={dimension.key}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 bg-white shadow-xs transition ${classes.border}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${classes.icon}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-400 block">
                            #{dimension.index} • {dimension.category}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{dimension.title}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] uppercase font-mono font-extrabold px-2 py-0.5 rounded ${classes.badge}`}>
                        {dimension.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">{dimension.details}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                    Phạm vi: {dimension.scope}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTabSection === "math_qa" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Chi tiết 6 Chiều Thẩm định Lời giải Toán học
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mathChecks.map((item, index) => {
                const Icon = item.icon;
                const isPass = item.result?.passed === true;
                const hasEvidence = Boolean(item.result);
                const label = !hasEvidence ? "NOT_TESTED" : isPass ? "PASS" : "FAIL";
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                      !hasEvidence
                        ? "bg-blue-50/30 border-blue-200"
                        : isPass
                          ? "bg-emerald-50/30 border-emerald-200"
                          : "bg-rose-50/30 border-rose-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60">
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-bold text-slate-800">{item.title}</span>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                            !hasEvidence
                              ? "bg-blue-100 text-blue-800"
                              : isPass
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        {item.result?.notes || item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
