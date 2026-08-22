import React, { useState } from "react";
import {
  FileCode2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Layers,
  Copy,
  Check,
  Code2,
  Target,
  Bookmark,
} from "lucide-react";
import { MathProblemIR } from "../../types/mathSchema.js";
import { MathView } from "../MathView.js";

interface ParsedProblemTabProps {
  problemIR: MathProblemIR | null;
  onProceedToSolution: () => void;
  onBackToInput: () => void;
  isProcessing: boolean;
}

export const ParsedProblemTab: React.FC<ParsedProblemTabProps> = ({
  problemIR,
  onProceedToSolution,
  onBackToInput,
  isProcessing,
}) => {
  const [copiedLatex, setCopiedLatex] = useState(false);
  const [showJsonInspector, setShowJsonInspector] = useState(false);

  if (!problemIR) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
          <FileCode2 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-300">Chưa có đề bài được chuẩn hóa</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Vui lòng nhập đề bài ở Tab 1 hoặc chọn một đề mẫu để bắt đầu quá trình trích xuất MathProblemIR.
        </p>
        <button
          onClick={onBackToInput}
          className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition"
        >
          Quay lại Nhập đề
        </button>
      </div>
    );
  }

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(problemIR.latex || problemIR.problem);
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2000);
  };

  const isNeedMoreInfo = problemIR.status === "NEED_MORE_INFORMATION";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner: Status & Confidence */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isNeedMoreInfo ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
          }`}>
            {isNeedMoreInfo ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">
                {isNeedMoreInfo ? "Cần bổ sung thêm thông tin đề bài" : "Đề bài đã được chuẩn hóa (MathProblemIR)"}
              </h2>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                isNeedMoreInfo ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
              }`}>
                {problemIR.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Độ tin cậy trích xuất: <strong className="text-slate-800">{(problemIR.confidence * 100).toFixed(0)}%</strong> • Nguồn: <span className="uppercase text-blue-600 font-medium">{problemIR.input_source || 'text'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyLatex}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition border border-slate-200"
          >
            {copiedLatex ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLatex ? "Đã chép" : "Sao chép LaTeX"}</span>
          </button>
          <button
            onClick={() => setShowJsonInspector(!showJsonInspector)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition border border-slate-200"
          >
            <Code2 className="w-3.5 h-3.5 text-blue-600" />
            <span>JSON IR</span>
          </button>
        </div>
      </div>

      {/* Need More Information Alert */}
      {isNeedMoreInfo && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm space-y-2 shadow-xs">
          <div className="flex items-center space-x-2 font-bold text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>THIẾU DỮ KIỆN QUAN TRỌNG:</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            {problemIR.missing_information_prompt || "Đề bài hiện tại chưa cung cấp đủ giả thiết để có nghiệm xác định duy nhất. Vui lòng quay lại kiểm tra lại đề bài hoặc hình vẽ."}
          </p>
          <button
            onClick={onBackToInput}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold"
          >
            Chỉnh sửa đề bài
          </button>
        </div>
      )}

      {/* JSON Schema Inspector Toggle */}
      {showJsonInspector && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto max-h-80 shadow-md">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 text-slate-400">
            <span>Canonical MathProblemIR Schema Output</span>
            <button onClick={() => setShowJsonInspector(false)} className="hover:text-white">✕</button>
          </div>
          <pre>{JSON.stringify(problemIR, null, 2)}</pre>
        </div>
      )}

      {/* Main Standardized Content Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Problem LaTeX Statement, Given, Find */}
        <div className="lg:col-span-8 space-y-6">
          {/* Formatted Problem Statement */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center space-x-1.5">
                <Bookmark className="w-3.5 h-3.5 text-blue-600" />
                <span>Nội dung đề bài chuẩn hóa (LaTeX Typeset)</span>
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {problemIR.grade}
              </span>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-base leading-relaxed overflow-x-auto">
              <MathView>{problemIR.problem}</MathView>
            </div>

            {/* LaTeX Raw Display */}
            <div className="text-xs font-mono text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 overflow-x-auto">
              <span className="text-slate-500 select-none block text-[10px] uppercase font-bold mb-1">Mã nguồn LaTeX:</span>
              <code className="text-slate-800">{problemIR.latex}</code>
            </div>
          </div>

          {/* Given (GT) & Find (KL) Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Given */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Giả thiết đã cho (GT)</span>
              </h3>
              <ul className="space-y-2">
                {problemIR.given.map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-800 p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="overflow-x-auto">
                      <MathView>{item}</MathView>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Find */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                <Target className="w-4 h-4 text-blue-600" />
                <span>Yêu cầu cần tìm (KL)</span>
              </h3>
              <ul className="space-y-2">
                {problemIR.find.map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-800 p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="overflow-x-auto">
                      <MathView>{item}</MathView>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Domain, Topic, Entities, Constraints */}
        <div className="lg:col-span-4 space-y-4">
          {/* Classification */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Phân loại Toán học THPT</span>
            </h3>

            <div>
              <span className="text-[11px] text-slate-500 block">Phân môn (Domain):</span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 inline-block mt-0.5">
                {problemIR.domain}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block">Chủ đề (Topic):</span>
              <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200 inline-block mt-0.5">
                {problemIR.topic}
              </span>
            </div>
          </div>

          {/* Mathematical Entities */}
          {problemIR.entities && problemIR.entities.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                <span>Thực thể Toán học (Entities)</span>
              </h3>
              <div className="space-y-2">
                {problemIR.entities.map((ent, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-blue-700 font-mono">{ent.name}</strong>
                      <span className="text-[10px] text-slate-600 px-1.5 py-0.5 rounded bg-white border border-slate-200">
                        {ent.type}
                      </span>
                    </div>
                    {ent.description && <p className="text-[11px] text-slate-600 mt-1">{ent.description}</p>}
                    {ent.relations && ent.relations.length > 0 && (
                      <div className="mt-1 text-[11px] text-blue-600 font-mono">
                        {ent.relations.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Constraints & Ambiguities */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Điều kiện ràng buộc (Constraints)
            </h3>
            {problemIR.constraints && problemIR.constraints.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {problemIR.constraints.map((c, idx) => (
                  <span key={idx} className="text-xs font-mono px-2 py-1 bg-slate-50 text-slate-800 rounded border border-slate-200">
                    <MathView>{c}</MathView>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Không có điều kiện biên bổ sung.</p>
            )}

            {problemIR.ambiguities && problemIR.ambiguities.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
                  Điểm cần lưu ý:
                </span>
                <ul className="text-xs text-amber-800 space-y-1 list-disc pl-4">
                  {problemIR.ambiguities.map((a, idx) => (
                    <li key={idx}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* CTA: Proceed to 3-step Solution */}
          <button
            id="proceed-solution-btn"
            onClick={onProceedToSolution}
            disabled={isProcessing}
            className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center space-x-2 shadow-xs transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Chuyển sang Bước 2: Lời giải</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
