import React, { useState } from "react";
import {
  X,
  Layers,
  Sparkles,
  Headphones,
  BookOpen,
  Cpu,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { MathProblemIR, MathSolution } from "../types/mathSchema.js";
import { NotebookLMStudyGuide, OpenClawAgentTask } from "../../server/adapters/integrationAdapters.js";

interface IntegrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  problemIR: MathProblemIR | null;
  solution: MathSolution | null;
}

export const IntegrationDrawer: React.FC<IntegrationDrawerProps> = ({
  isOpen,
  onClose,
  problemIR,
  solution,
}) => {
  const [activeTab, setActiveTab] = useState<"notebooklm" | "openclaw" | "codex">("notebooklm");
  const [studyGuide, setStudyGuide] = useState<NotebookLMStudyGuide | null>(null);
  const [openClawTask, setOpenClawTask] = useState<OpenClawAgentTask | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleFetchNotebookLM = async () => {
    if (!problemIR || !solution) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/integrations/notebooklm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemIR, solution }),
      });
      if (res.ok) {
        const data = await res.json();
        setStudyGuide(data.studyGuide);
      }
    } catch (err) {
      console.error("NotebookLM error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchOpenClaw = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/integrations/openclaw");
      if (res.ok) {
        const data = await res.json();
        setOpenClawTask(data.task);
      }
    } catch (err) {
      console.error("OpenClaw error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border-l border-slate-200 w-full max-w-xl h-full flex flex-col shadow-xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Hệ sinh thái Toán học Tích hợp
              </h2>
              <p className="text-xs text-slate-500">
                NotebookLM • OpenClaw • Codex Worker
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

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 px-6 pt-4 border-b border-slate-200 pb-2">
          <button
            onClick={() => {
              setActiveTab("notebooklm");
              if (!studyGuide) handleFetchNotebookLM();
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "notebooklm"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>NotebookLM (Audio Podcast)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("openclaw");
              if (!openClawTask) handleFetchOpenClaw();
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "openclaw"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>OpenClaw Worker</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-slate-500 space-x-2">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-xs">Đang đồng bộ hệ sinh thái...</span>
            </div>
          )}

          {!isLoading && activeTab === "notebooklm" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">
                  NotebookLM Math Audio &amp; Study Guide
                </span>
                <p className="text-xs text-slate-700">
                  Tự động chuyển đổi lời giải thành kịch bản thảo luận audio 2 người (Thầy giáo &amp; Học sinh) và thẻ ghi nhớ flashcards.
                </p>
              </div>

              {studyGuide ? (
                <div className="space-y-4">
                  {/* Key takeaways */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      Tóm tắt kiến thức trọng tâm (Key Takeaways):
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {studyGuide.key_takeaways.map((k, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{k}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Audio Podcast Dialogue */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center space-x-1.5">
                      <Headphones className="w-4 h-4" />
                      <span>Kịch bản Thảo luận Audio Podcast (2 Hosts):</span>
                    </span>
                    <div className="space-y-2.5">
                      {studyGuide.audio_podcast_script.map((line, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg text-xs leading-relaxed ${
                            line.speaker === "Teacher"
                              ? "bg-blue-50 border border-blue-200 text-blue-900"
                              : "bg-white border border-slate-200 text-slate-800 shadow-2xs"
                          }`}
                        >
                          <strong className="block text-[11px] uppercase tracking-wider text-slate-500 mb-0.5">
                            {line.speaker === "Teacher" ? "🎙️ Thầy giáo (Host A)" : "🧑‍🎓 Học sinh (Host B)"}:
                          </strong>
                          <span>{line.dialogue}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Flashcards */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      Thẻ ghi nhớ Flashcards:
                    </span>
                    {studyGuide.suggested_flashcards.map((fc, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs space-y-1">
                        <span className="text-slate-600 block font-semibold">❓ {fc.front}</span>
                        <span className="text-emerald-700 font-mono block">💡 {fc.back}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleFetchNotebookLM}
                  disabled={!solution}
                  className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
                >
                  Tạo Study Guide &amp; Audio Podcast
                </button>
              )}
            </div>
          )}

          {!isLoading && activeTab === "openclaw" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">
                  OpenClaw Math Worker Task DAG
                </span>
                <p className="text-xs text-slate-700">
                  Worker tự hành điều phối kiểm tra AST LaTeX và bất biến đại số.
                </p>
              </div>

              {openClawTask && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700 font-bold">{openClawTask.agentName}</span>
                    <span className="text-emerald-700 px-2 py-0.5 rounded bg-emerald-100 border border-emerald-200 font-sans font-semibold">
                      {openClawTask.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-700 font-sans">
                    {openClawTask.actions.map((act, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
