import React, { useState } from "react";
import {
  Download,
  Copy,
  Check,
  X,
  FileCode,
  FileText,
  Video,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  MathProblemIR,
  MathSolution,
  VisualSpecification,
  VerificationReport,
  VideoSpecification,
} from "../types/mathSchema.js";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  problemIR: MathProblemIR | null;
  solution: MathSolution | null;
  visualSpec: VisualSpecification | null;
  verification: VerificationReport | null;
  videoSpec: VideoSpecification | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  problemIR,
  solution,
  visualSpec,
  verification,
  videoSpec,
}) => {
  const [activeFormat, setActiveFormat] = useState<"latex" | "json" | "manim" | "tikz">("latex");
  const [copied, setCopied] = useState(false);
  const [isExportingTex, setIsExportingTex] = useState(false);
  const [texContent, setTexContent] = useState<string>("");

  if (!isOpen) return null;

  const handleFetchTex = async () => {
    if (texContent) return;
    setIsExportingTex(true);
    try {
      const res = await fetch("/api/export/latex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemIR, solution, visualSpec, verification }),
      });
      if (res.ok) {
        const data = await res.json();
        setTexContent(data.texCode);
      }
    } catch (err) {
      console.error("Export TeX error:", err);
    } finally {
      setIsExportingTex(false);
    }
  };

  const getExportData = (): { content: string; filename: string; mimeType: string } => {
    switch (activeFormat) {
      case "latex":
        return {
          content: texContent || "% Đang tạo tài liệu LaTeX...",
          filename: `bai_toan_su_pham_${Date.now()}.tex`,
          mimeType: "text/x-tex",
        };
      case "json":
        return {
          content: JSON.stringify(
            { problemIR, solution, verification, visualSpec, videoSpec },
            null,
            2
          ),
          filename: `math_ai_studio_export_${Date.now()}.json`,
          mimeType: "application/json",
        };
      case "manim":
        return {
          content: videoSpec?.manim_python_code || "# Chưa có mã Manim",
          filename: `manim_math_scene_${Date.now()}.py`,
          mimeType: "text/x-python",
        };
      case "tikz":
        return {
          content: visualSpec?.tikz_code || "% Chưa có mã TikZ",
          filename: `tikz_figure_${Date.now()}.tex`,
          mimeType: "text/x-tex",
        };
    }
  };

  const { content, filename, mimeType } = getExportData();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Xuất dữ liệu Bài giảng Toán học
              </h2>
              <p className="text-xs text-slate-500">
                Tương thích LaTeX Overleaf, Manim Community, TikZ và JSON
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex items-center space-x-2 px-6 pt-4 border-b border-slate-200 pb-2">
          <button
            onClick={() => {
              setActiveFormat("latex");
              handleFetchTex();
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeFormat === "latex"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>LaTeX (.tex)</span>
          </button>

          <button
            onClick={() => setActiveFormat("manim")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeFormat === "manim"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Python Manim (.py)</span>
          </button>

          <button
            onClick={() => setActiveFormat("tikz")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeFormat === "tikz"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>TikZ Hình học</span>
          </button>

          <button
            onClick={() => setActiveFormat("json")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeFormat === "json"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Full JSON Bundle</span>
          </button>
        </div>

        {/* Code Content Preview */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto h-[320px] leading-relaxed shadow-inner">
            <pre>{content}</pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 px-6 border-t border-slate-200 bg-slate-50">
          <span className="text-xs text-slate-500 font-mono">
            {filename}
          </span>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Đã sao chép" : "Sao chép"}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải về máy</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
