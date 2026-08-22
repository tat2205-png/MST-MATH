import React, { useState, useRef } from "react";
import {
  Upload,
  Camera,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Zap,
  CheckCircle2,
  Trash2,
  BookOpen,
} from "lucide-react";
import { HIGH_SCHOOL_MATH_SAMPLES, MathSample } from "../../lib/mathSamples.js";
import { MathView } from "../MathView.js";

interface InputTabProps {
  onStartPipeline: (payload: {
    text?: string;
    imageBase64?: string;
    mimeType?: string;
    sourceType: "text" | "image" | "pdf" | "docx";
  }) => void;
  isProcessing: boolean;
}

export const InputTab: React.FC<InputTabProps> = ({ onStartPipeline, isProcessing }) => {
  const [inputText, setInputText] = useState("");
  const [activeInputType, setActiveInputType] = useState<"text" | "image" | "pdf" | "docx">("text");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("image/jpeg");
  const [fileName, setFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Quick Math Symbol Shortcuts for fast typing
  const mathSymbols = [
    { label: "∫", latex: "\\int_{a}^{b} f(x)dx " },
    { label: "lim", latex: "\\lim_{x \\to x_0} " },
    { label: "√x", latex: "\\sqrt{x} " },
    { label: "xⁿ", latex: "x^{n} " },
    { label: "a/b", latex: "\\frac{a}{b} " },
    { label: "véc-tơ", latex: "\\vec{u} " },
    { label: "⊥", latex: "\\perp " },
    { label: "∥", latex: "\\parallel " },
    { label: "∈", latex: "\\in " },
    { label: "⇔", latex: "\\Leftrightarrow " },
    { label: "⇒", latex: "\\Rightarrow " },
    { label: "α", latex: "\\alpha " },
    { label: "β", latex: "\\beta " },
    { label: "Δ", latex: "\\Delta " },
    { label: "π", latex: "\\pi " },
  ];

  const handleInsertSymbol = (latex: string) => {
    setInputText((prev) => prev + latex);
  };

  const handleSelectSample = (sample: MathSample) => {
    setInputText(sample.rawText);
    setActiveInputType("text");
    setImagePreview(null);
    setImageBase64(null);
    setFileName(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "pdf" | "docx") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setActiveInputType(type);

    if (type === "image") {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImagePreview(result);
        const base64Data = result.split(",")[1];
        setImageBase64(base64Data);
        setImageMimeType(file.type || "image/jpeg");
      };
      reader.readAsDataURL(file);
    } else {
      // PDF or DOCX file handling
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        // Set preview indicator
        setImagePreview(null);
        setImageBase64(result.split(",")[1] || "");
        setImageMimeType(file.type || "application/octet-stream");
        if (!inputText) {
          setInputText(`[Tài liệu đính kèm: ${file.name}] Đang trích xuất văn bản toán học từ file...`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!inputText.trim() && !imageBase64) return;

    onStartPipeline({
      text: inputText.trim() || undefined,
      imageBase64: imageBase64 || undefined,
      mimeType: imageMimeType,
      sourceType: activeInputType,
    });
  };

  const handleClear = () => {
    setInputText("");
    setImagePreview(null);
    setImageBase64(null);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Welcome Banner */}
      <div className="mb-8 rounded-xl bg-white border border-slate-200 p-6 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-2">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>Quy trình 6 bước chuẩn hóa sư phạm THPT</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Nhập đề bài Toán học
            </h1>
            <p className="text-slate-600 text-sm mt-1 max-w-2xl leading-relaxed">
              Hỗ trợ văn bản thuần, công thức LaTeX, ảnh chụp đề thi (OCR), file PDF và tài liệu DOCX. AI sẽ tự động phân tích 3 phần sư phạm, kiểm định toán học 6 chiều, vẽ hình minh họa và sinh mã video Manim.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded border border-slate-200 font-medium">
              Định dạng: <strong className="text-slate-800 font-mono">Text / Image / PDF / DOCX</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form & Uploads (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Input Method Switcher */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <button
                  id="input-mode-text"
                  onClick={() => setActiveInputType("text")}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${
                    activeInputType === "text"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Văn bản &amp; LaTeX</span>
                </button>
                <button
                  id="input-mode-image"
                  onClick={() => {
                    setActiveInputType("image");
                    fileInputRef.current?.click();
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${
                    activeInputType === "image"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Ảnh chụp đề thi</span>
                </button>
                <button
                  id="input-mode-pdf"
                  onClick={() => {
                    setActiveInputType("pdf");
                    fileInputRef.current?.click();
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${
                    activeInputType === "pdf"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>PDF / DOCX</span>
                </button>
              </div>

              {/* Clear button */}
              {(inputText || imagePreview || fileName) && (
                <button
                  id="clear-input-btn"
                  onClick={handleClear}
                  className="flex items-center space-x-1 text-xs text-rose-600 hover:text-rose-700 transition font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa làm lại</span>
                </button>
              )}
            </div>

            {/* Hidden native file inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp,application/pdf,.docx"
              className="hidden"
              onChange={(e) => {
                const ext = e.target.files?.[0]?.name.split(".").pop()?.toLowerCase();
                if (ext === "pdf") handleFileUpload(e, "pdf");
                else if (ext === "docx") handleFileUpload(e, "docx");
                else handleFileUpload(e, "image");
              }}
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileUpload(e, "image")}
            />

            {/* Image Preview Banner (if uploaded) */}
            {imagePreview && (
              <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200 relative group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={imagePreview}
                      alt="Uploaded Problem"
                      className="w-24 h-24 object-cover rounded border border-slate-200 shadow-xs"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-slate-900">
                          {fileName || "Ảnh đề bài đã tải lên"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        AI OCR sẽ nhận diện công thức và hình học tự động mà không bịa dữ kiện.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setImageBase64(null);
                      setFileName(null);
                    }}
                    className="text-xs text-slate-400 hover:text-rose-600 p-1.5"
                  >
                    Xóa ảnh
                  </button>
                </div>
              </div>
            )}

            {/* File attachment banner (PDF/DOCX) */}
            {fileName && !imagePreview && (
              <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                  <div>
                    <span className="text-sm font-medium text-blue-900">{fileName}</span>
                    <p className="text-xs text-blue-700">Đã sẵn sàng để trích xuất đề bài</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFileName(null);
                    setImageBase64(null);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                >
                  Gỡ file
                </button>
              </div>
            )}

            {/* Math Symbol Quick Helper Toolbar */}
            <div className="mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Chèn nhanh ký hiệu Toán học:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {mathSymbols.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInsertSymbol(s.latex)}
                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-mono border border-slate-200 transition active:scale-95"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea Input */}
            <div className="relative">
              <textarea
                id="problem-input-textarea"
                rows={6}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhập hoặc dán nội dung đề bài Toán THPT tại đây...&#10;Ví dụ: Cho hình chóp S.ABCD có đáy ABCD là hình vuông cạnh a, SA vuông góc (ABCD) và SA = a√3. Tính thể tích khối chóp S.ABCD..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-slate-900 placeholder-slate-400 text-sm font-sans focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 leading-relaxed font-normal resize-y min-h-[160px]"
              />
            </div>

            {/* Live KaTeX Preview of Input (if contains formulas) */}
            {inputText && (inputText.includes("$") || inputText.includes("\\")) && (
              <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                  Xem trước công thức (KaTeX Live):
                </span>
                <div className="text-sm text-slate-800 leading-relaxed overflow-x-auto">
                  <MathView>{inputText}</MathView>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Không tự ý bịa dữ kiện đối với hình vẽ hình học.</span>
              </div>

              <button
                id="start-pipeline-btn"
                onClick={handleSubmit}
                disabled={isProcessing || (!inputText.trim() && !imageBase64)}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center space-x-2 transition shadow-xs ${
                  isProcessing || (!inputText.trim() && !imageBase64)
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    : "bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98]"
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý toàn diện...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Khởi chạy AI Pipeline (6 Bước)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: High School Math Sample Library (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Đề mẫu THPT tiêu biểu</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">Bấm để nạp</span>
            </div>

            <div className="space-y-3">
              {HIGH_SCHOOL_MATH_SAMPLES.map((sample) => (
                <div
                  key={sample.id}
                  id={`sample-card-${sample.id}`}
                  onClick={() => handleSelectSample(sample)}
                  className="p-3 rounded-lg bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 cursor-pointer transition group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 transition">
                      {sample.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-mono">
                      {sample.grade}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {sample.rawText.replace(/\$/g, "")}
                  </p>
                  <div className="mt-2 text-[10px] text-blue-600 font-mono font-medium truncate">
                    {sample.topic}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
