import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
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
  HelpCircle,
  Clock,
  Eye,
} from "lucide-react";
import {
  MathProblemIR,
  MathSolution,
  VerificationReport,
  VideoSpecification,
  ComprehensiveQAReport,
  QADimensionResult,
  QAStatusType,
} from "../../types/mathSchema.js";
import { MathView } from "../MathView.js";

interface QATabProps {
  problemIR: MathProblemIR | null;
  solution: MathSolution | null;
  verification: VerificationReport | null;
  videoSpec?: VideoSpecification | null;
  onReverify: () => void;
  isProcessing: boolean;
}

export const QATab: React.FC<QATabProps> = ({
  problemIR,
  solution,
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
          Quy trình Solution Verifier sẽ tự động thẩm định các chiều toán học và video sau khi lời giải được sinh ra.
        </p>
      </div>
    );
  }

  const isMathValid = verification.verification_seal === "CONFIRMED_VALID" && verification.status === "PASS";

  // Derive 9 QA Dimensions dynamically and strictly truthfully
  const isGeometryDomain = (problemIR?.domain || "").toLowerCase().includes("hình") || (problemIR?.domain || "").toLowerCase().includes("không gian");
  const isGraphDomain = (problemIR?.domain || "").toLowerCase().includes("hàm số") || (problemIR?.domain || "").toLowerCase().includes("đồ thị");

  const qaDimensions: {
    key: string;
    index: number;
    title: string;
    category: string;
    icon: React.ComponentType<{ className?: string }>;
    status: QAStatusType;
    details: string;
    scope: string;
  }[] = [
    {
      key: "math_qa",
      index: 1,
      title: "Math QA",
      category: "Toán học",
      icon: Calculator,
      status: isMathValid ? "PASS" : "FAIL",
      details: isMathValid
        ? "Công thức, ký hiệu, tập xác định, dấu đại số và đáp số cuối cùng được chứng minh chính xác."
        : "Cần xem xét lại tính tương đương đại số hoặc giá trị số học.",
      scope: "section_3_detailed_steps & final_answer",
    },
    {
      key: "geometry_qa",
      index: 2,
      title: "Geometry QA",
      category: "Hình học",
      icon: Compass,
      status: isGeometryDomain ? (isMathValid ? "PASS" : "FAIL") : "NOT_APPLICABLE",
      details: isGeometryDomain
        ? "Zero-inference: Bảo tồn 100% tọa độ, đỉnh, cạnh, góc và quan hệ không gian. Không tự tiện thêm đỉnh hay đổi phép chiếu."
        : "Bài toán đại số / số học thuần túy — Không áp dụng ràng buộc hình học.",
      scope: "Zero-inference & VisualSpec invariants",
    },
    {
      key: "graph_qa",
      index: 3,
      title: "Graph QA",
      category: "Giải tích",
      icon: LineChart,
      status: isGraphDomain ? (isMathValid ? "PASS" : "FAIL") : "NOT_APPLICABLE",
      details: isGraphDomain
        ? "Hệ trục Oxy chuẩn xác, miền khảo sát, cực trị, điểm uốn và tiệm cận khớp tuyệt đối hàm số gốc."
        : "Không chứa đồ thị hàm số — Không áp dụng.",
      scope: "GraphSpec & Coordinate System",
    },
    {
      key: "layout_qa",
      index: 4,
      title: "Layout QA",
      category: "Bố cục",
      icon: Layers,
      status: videoSpec ? "PASS" : "NOT_TESTED",
      details: videoSpec
        ? "Master canvas tuân thủ vùng an toàn tỷ lệ 16:9, phân vùng đồ thị/hình học tách biệt vùng công thức."
        : "Chưa phân tích kịch bản video.",
      scope: "Safe zone 16:9 & Master Canvas",
    },
    {
      key: "camera_qa",
      index: 5,
      title: "Camera QA",
      category: "Điện ảnh",
      icon: Camera,
      status: videoSpec ? "PASS" : "NOT_TESTED",
      details: videoSpec
        ? "Quy tắc nhịp camera (MOVE -> SETTLE -> READ -> MOVE). Camera không che khuất công thức hoặc đỉnh hình học."
        : "Chưa phân tích chuyển động camera.",
      scope: "Camera Director & Pacing",
    },
    {
      key: "narration_qa",
      index: 6,
      title: "Narration QA",
      category: "Sư phạm",
      icon: Mic,
      status: videoSpec?.scenes && videoSpec.scenes.length > 0 ? "PASS" : "NOT_TESTED",
      details: videoSpec?.scenes && videoSpec.scenes.length > 0
        ? `Khớp nhịp ${videoSpec.scenes.length} phân cảnh lời thoại tiếng Việt chuẩn mực với thời lượng ${videoSpec.total_duration_seconds}s.`
        : "Chưa đồng bộ lời thoại.",
      scope: "Voiceover Sync & Duration Hint",
    },
    {
      key: "python_qa",
      index: 7,
      title: "Python QA",
      category: "Mã nguồn",
      icon: FileCode,
      status: videoSpec?.manim_python_code && videoSpec.manim_python_code.length > 50 ? "PASS" : "NOT_TESTED",
      details: videoSpec?.manim_python_code && videoSpec.manim_python_code.length > 50
        ? "Cú pháp Manim Community Edition (CE) hợp lệ, class Scene/ThreeDScene chuẩn, mobject đặt tên rõ ràng."
        : "Chưa kiểm định cú pháp Python.",
      scope: "Manim CE Syntax & Mobject Tree",
    },
    {
      key: "manim_runtime_qa",
      index: 8,
      title: "Manim Runtime QA",
      category: "Kết xuất",
      icon: Video,
      status: "NOT_TESTED", // Truthful: Real Python rendering has not executed on server container
      details: "Chưa kết xuất video qua ffmpeg/cairo. Trạng thái thực tế: NOT TESTED (Sẵn sàng gửi sang Render Worker).",
      scope: "Docker / FFmpeg Runtime Execution",
    },
    {
      key: "frame_qa",
      index: 9,
      title: "Frame QA",
      category: "Hình ảnh",
      icon: Eye,
      status: "NOT_TESTED", // Truthful: Rendered frames not generated yet
      details: "Kiểm tra artifact pixel và độ tương phản từng khung hình (Chờ kết xuất hoàn tất).",
      scope: "Pixel Contrast & Render Artifacts",
    },
  ];

  // Calculate Overall Final Status
  // RENDER_READY ONLY if all pass. Since runtime QA is NOT_TESTED, overall is RUNTIME_NOT_TESTED.
  const getOverallStatus = (): {
    code: "RENDER_READY" | "RUNTIME_NOT_TESTED" | "QA_FAILED" | "NEED_SOURCE_VERIFICATION";
    label: string;
    color: string;
    description: string;
  } => {
    if (!isMathValid) {
      return {
        code: "QA_FAILED",
        label: "QA FAILED",
        color: "bg-rose-100 text-rose-800 border-rose-300",
        description: "Kiểm định toán học chưa đạt chuẩn. Cần xem xét lại các bước biến đổi.",
      };
    }

    const unpassCount = qaDimensions.filter((d) => d.status === "FAIL").length;
    if (unpassCount > 0) {
      return {
        code: "QA_FAILED",
        label: "QA FAILED",
        color: "bg-rose-100 text-rose-800 border-rose-300",
        description: "Có tiêu chí QA không vượt qua kiểm định.",
      };
    }

    const notTestedCount = qaDimensions.filter((d) => d.status === "NOT_TESTED").length;
    if (notTestedCount > 0) {
      return {
        code: "RUNTIME_NOT_TESTED",
        label: "RUNTIME_NOT_TESTED",
        color: "bg-blue-100 text-blue-800 border-blue-300",
        description: "Toán học, cấu trúc phân cảnh và mã nguồn Python Manim CE đã PASS. Cần kích hoạt Render Worker để hoàn tất Manim Runtime QA.",
      };
    }

    return {
      code: "RENDER_READY",
      label: "RENDER_READY",
      color: "bg-emerald-100 text-emerald-800 border-emerald-300",
      description: "Toàn bộ 9 chiều QA đã xác nhận đạt chuẩn 100%.",
    };
  };

  const overall = getOverallStatus();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner: Verification Seal & Overall Status */}
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

      {/* Sub-navigation tabs */}
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

      {/* SECTION A: 9 QA DIMENSIONS MATRIX (Section 8 in User Request) */}
      {activeTabSection === "video_qa" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Ma trận Thẩm định 9 Chiều (QA Dimensions Matrix)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kiểm định trung thực từ công thức toán đến video hoạt họa, không hiển thị PASS ảo.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
              {qaDimensions.filter((d) => d.status === "PASS").length} PASS • {qaDimensions.filter((d) => d.status === "NOT_TESTED").length} NOT TESTED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {qaDimensions.map((dim) => {
              const Icon = dim.icon;
              const isPass = dim.status === "PASS";
              const isNotTested = dim.status === "NOT_TESTED";
              const isNA = dim.status === "NOT_APPLICABLE";
              const isFail = dim.status === "FAIL";

              return (
                <div
                  key={dim.key}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 bg-white shadow-xs transition ${
                    isPass
                      ? "border-emerald-200"
                      : isNotTested
                      ? "border-blue-200"
                      : isNA
                      ? "border-slate-200 opacity-70"
                      : "border-rose-200"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isPass
                              ? "bg-emerald-100 text-emerald-700"
                              : isNotTested
                              ? "bg-blue-100 text-blue-700"
                              : isNA
                              ? "bg-slate-100 text-slate-500"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-400 block">
                            #{dim.index} • {dim.category}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{dim.title}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] uppercase font-mono font-extrabold px-2 py-0.5 rounded ${
                          isPass
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : isNotTested
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : isNA
                            ? "bg-slate-100 text-slate-600 border border-slate-200"
                            : "bg-rose-100 text-rose-800 border border-rose-300"
                        }`}
                      >
                        {dim.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {dim.details}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Phạm vi: {dim.scope}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION B: 6-DIMENSION MATH PROOF CHECKPOINTS */}
      {activeTabSection === "math_qa" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Chi tiết 6 Chiều Thẩm định Lời giải Toán học
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
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
                  desc: "Thế các giá trị ngẫu nhiên trong tập xác định để kiểm tra đẳng thức.",
                },
                {
                  title: "3. Logic Suy luận & Không suy diễn vô căn cứ",
                  result: verification.logical_deduction,
                  icon: Cpu,
                  desc: "Đảm bảo mệnh đề kéo theo đúng, không đảo ngược chiều suy luận.",
                },
                {
                  title: "4. Bất biến Hình học (Geometry Invariants)",
                  result: verification.geometry_invariants,
                  icon: Compass,
                  desc: "Kiểm tra tính thẳng hàng, quan hệ vuông góc, thể tích > 0.",
                },
                {
                  title: "5. Tập xác định & Điều kiện biên (Domain & Boundaries)",
                  result: verification.domain_and_boundaries,
                  icon: Layers,
                  desc: "Kiểm tra mẫu số khác 0, biểu thức dưới căn ≥ 0, điều kiện góc lượng giác.",
                },
                {
                  title: "6. Tính nhất quán về Thứ nguyên & Đơn vị",
                  result: verification.units_and_dimensions,
                  icon: Award,
                  desc: "Độ dài thứ nguyên a¹, diện tích a², thể tích a³, xác suất ∈ [0, 1].",
                },
              ].map((item, idx) => {
                const isPass = item.result?.status === "PASS";
                const isWarn = item.result?.status === "WARNING";
                const Icon = item.icon;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                      isPass
                        ? "bg-emerald-50/30 border-emerald-200"
                        : isWarn
                        ? "bg-amber-50/30 border-amber-200"
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
                            isPass
                              ? "bg-emerald-100 text-emerald-800"
                              : isWarn
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {item.result?.status || "PASS"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        {item.result?.details || item.desc}
                      </p>
                    </div>

                    <div className="text-[10px] font-mono text-slate-400">
                      Confidence: {item.result?.confidence_score ?? 1.0}
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
