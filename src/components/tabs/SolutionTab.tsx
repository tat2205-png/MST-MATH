import React, { useState } from "react";
import {
  BookOpen,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Target,
  ArrowRight,
  Copy,
  Check,
  Award,
  ListOrdered,
  Layers,
  Sparkles,
} from "lucide-react";
import { MathProblemIR, MathSolution } from "../../types/mathSchema.js";
import { MathView } from "../MathView.js";

interface SolutionTabProps {
  problemIR: MathProblemIR | null;
  solution: MathSolution | null;
  onProceedToVisuals: () => void;
  onProceedToQA: () => void;
  isProcessing: boolean;
}

export const SolutionTab: React.FC<SolutionTabProps> = ({
  problemIR,
  solution,
  onProceedToVisuals,
  onProceedToQA,
  isProcessing,
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!solution) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-300">Chưa có lời giải sư phạm</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Hệ thống đang chờ xử lý đề bài. Vui lòng bắt đầu tại Tab 1 hoặc chạy AI Pipeline.
        </p>
      </div>
    );
  }

  const handleCopyText = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Quy chuẩn 3 Phần Sư phạm
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {problemIR?.grade} • {problemIR?.topic}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Lời giải Toán học Chuẩn mực Sư phạm
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onProceedToVisuals}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
          >
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span>Xem Hình vẽ</span>
          </button>
          <button
            onClick={onProceedToQA}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kiểm định Toán học</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: PHÂN TÍCH ĐỀ */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5 relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-200">
              1
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-wide uppercase">
                PHÂN TÍCH ĐỀ
              </h2>
              <p className="text-xs text-slate-500">
                Bản chất bài toán, nhận diện dạng toán &amp; phòng tránh cạm bẫy
              </p>
            </div>
          </div>

          <button
            onClick={() => handleCopyText(JSON.stringify(solution.section_1_analysis, null, 2), "s1")}
            className="text-xs text-slate-600 hover:text-slate-900 flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 border border-slate-200"
          >
            {copiedSection === "s1" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === "s1" ? "Đã chép" : "Chép phần 1"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Problem Essence & Pattern */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-blue-600" />
                <span>Bản chất bài toán:</span>
              </span>
              <p className="text-xs text-slate-800 leading-relaxed font-normal">
                {solution.section_1_analysis.problem_essence}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Dạng toán &amp; Phương pháp nhận dạng:</span>
              </span>
              <p className="text-xs text-slate-800 leading-relaxed font-normal">
                {solution.section_1_analysis.identified_pattern}
              </p>
            </div>
          </div>

          {/* Pitfalls & Core Theorems */}
          <div className="space-y-4">
            {/* Pitfalls */}
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Cạm bẫy &amp; Sai lầm học sinh hay mắc phải:</span>
              </span>
              <ul className="space-y-1.5">
                {solution.section_1_analysis.pitfalls_and_traps.map((pitfall, idx) => (
                  <li key={idx} className="text-xs text-rose-900 flex items-start space-x-2">
                    <span className="text-rose-600 font-bold shrink-0 mt-0.5">•</span>
                    <span>{pitfall}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Core Theorems */}
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kiến thức &amp; Định lý trọng tâm:</span>
              </span>
              <ul className="space-y-1.5">
                {solution.section_1_analysis.core_theorems.map((thm, idx) => (
                  <li key={idx} className="text-xs text-emerald-900 flex items-start space-x-2">
                    <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                    <span>{thm}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: HƯỚNG GIẢI */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5 relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm border border-teal-200">
              2
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-wide uppercase">
                HƯỚNG GIẢI
              </h2>
              <p className="text-xs text-slate-500">
                Chiến lược tư duy, lộ trình giải từng bước &amp; công thức then chốt
              </p>
            </div>
          </div>

          <button
            onClick={() => handleCopyText(JSON.stringify(solution.section_2_approach, null, 2), "s2")}
            className="text-xs text-slate-600 hover:text-slate-900 flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 border border-slate-200"
          >
            {copiedSection === "s2" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === "s2" ? "Đã chép" : "Chép phần 2"}</span>
          </button>
        </div>

        {/* Strategy Overview */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 block mb-1">
            Tổng quan chiến lược:
          </span>
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
            {solution.section_2_approach.strategy_overview}
          </p>
        </div>

        {/* Roadmap Steps */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Lộ trình giải từng bước (Roadmap):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {solution.section_2_approach.roadmap_steps.map((step, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-xs text-slate-800 leading-relaxed font-medium">
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Formulas */}
        {solution.section_2_approach.formulas_needed.length > 0 && (
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Công thức then chốt:
            </span>
            <div className="flex flex-wrap gap-3">
              {solution.section_2_approach.formulas_needed.map((f, idx) => (
                <div key={idx} className="px-3 py-1.5 rounded bg-white border border-slate-200 text-xs font-mono text-blue-700 shadow-xs">
                  <MathView>{f}</MathView>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 3: LỜI GIẢI CHI TIẾT */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6 relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-200">
              3
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-wide uppercase">
                LỜI GIẢI CHI TIẾT
              </h2>
              <p className="text-xs text-slate-500">
                Trình bày chuẩn mực, các bước biến đổi toán học đầy đủ và chặt chẽ
              </p>
            </div>
          </div>

          <button
            onClick={() => handleCopyText(solution.section_3_detailed_steps.map((s) => `Bước ${s.step_number}: ${s.title}\n${s.explanation}\n${s.math_latex}`).join("\n\n"), "s3")}
            className="text-xs text-slate-600 hover:text-slate-900 flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 border border-slate-200"
          >
            {copiedSection === "s3" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === "s3" ? "Đã chép" : "Chép phần 3"}</span>
          </button>
        </div>

        {/* Detailed Pedagogical Steps */}
        <div className="space-y-5">
          {solution.section_3_detailed_steps.map((step) => (
            <div
              key={step.step_number}
              className="p-5 rounded-lg bg-slate-50 border border-slate-200 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-xs">
                    Bước {step.step_number}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    {step.title}
                  </h3>
                </div>
                {step.key_theorems_used && step.key_theorems_used.length > 0 && (
                  <span className="text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {step.key_theorems_used[0]}
                  </span>
                )}
              </div>

              {/* Explanation text */}
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {step.explanation}
              </p>

              {/* Math LaTeX display */}
              {step.math_latex && (
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 overflow-x-auto shadow-xs">
                  <MathView block>{step.math_latex}</MathView>
                </div>
              )}

              {/* Pedagogical Teacher Notes */}
              {step.pedagogical_notes && (
                <div className="flex items-start space-x-2 pt-2 text-xs text-amber-800 italic">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{step.pedagogical_notes}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* FINAL ANSWER BANNER */}
        <div className="p-5 rounded-xl bg-amber-50 border border-amber-300 shadow-xs space-y-2">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-700" />
            <span className="text-xs uppercase font-extrabold tracking-widest text-amber-900">
              KẾT LUẬN &amp; ĐÁP SỐ CHÍNH THỨC
            </span>
          </div>

          <div className="text-lg sm:text-xl font-bold text-slate-900 py-1">
            <MathView block>{solution.final_answer.latex || solution.final_answer.value}</MathView>
          </div>

          <p className="text-xs sm:text-sm text-amber-900 font-medium pt-2 border-t border-amber-200">
            {solution.final_answer.summary_text}
          </p>
        </div>

        {/* Teacher Tips for Students */}
        {solution.teacher_tips && solution.teacher_tips.length > 0 && (
          <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 flex items-center space-x-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-blue-600" />
              <span>Lời khuyên của Giáo viên (Bí quyết giải nhanh &amp; mẹo Casio):</span>
            </span>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {solution.teacher_tips.map((tip, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <span className="text-xs text-slate-500">
          Bước tiếp theo: Tạo hình vẽ minh họa toán học hoặc kịch bản video Manim.
        </span>

        <div className="flex items-center space-x-3">
          <button
            id="to-visuals-btn"
            onClick={onProceedToVisuals}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-xs transition"
          >
            <Compass className="w-4 h-4" />
            <span>Chuyển sang Bước 4: Hình minh họa</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
