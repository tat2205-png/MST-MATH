import React, { useEffect, useState } from "react";
import {
  Sparkles,
  Download,
  BookOpen,
  FileCode2,
  Layers,
  Video,
  PenTool,
  ShieldCheck,
  Compass,
} from "lucide-react";
import { ProviderType } from "../types/mathSchema.js";

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: any) => void;
  hasProblemIR: boolean;
  hasSolution: boolean;
  hasVisualSpec: boolean;
  hasVideoSpec: boolean;
  hasVerification: boolean;
  selectedProvider: ProviderType;
  onChangeProvider: (p: ProviderType) => void;
  onOpenExport: () => void;
  onOpenIntegrations: () => void;
  onOpenSkills?: () => void;
  isProcessing: boolean;
}

type ProviderUiStatus = "CONNECTED" | "CHECKING" | "NOT_CONFIGURED" | "NOT_CHECKED" | "ERROR";

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  hasProblemIR,
  hasSolution,
  hasVisualSpec,
  hasVideoSpec,
  hasVerification,
  selectedProvider,
  onChangeProvider,
  onOpenExport,
  onOpenIntegrations,
  onOpenSkills,
  isProcessing,
}) => {
  const [providerStatus, setProviderStatus] = useState<ProviderUiStatus>("CHECKING");
  const [activeModel, setActiveModel] = useState<string>("Gemini Flash");

  const checkProviderHealth = async () => {
    setProviderStatus("CHECKING");
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      if (data.status !== "ok") {
        setProviderStatus("ERROR");
        return;
      }

      if (!data.provider_configured || data.provider_status === "NOT_CONFIGURED") {
        setProviderStatus("NOT_CONFIGURED");
        return;
      }

      if (data.current_model) setActiveModel(data.current_model);
      if (data.provider_status === "CONNECTED") {
        setProviderStatus("CONNECTED");
      } else if (data.provider_status === "NOT_CHECKED") {
        setProviderStatus("NOT_CHECKED");
      } else {
        setProviderStatus("ERROR");
      }
    } catch {
      setProviderStatus("ERROR");
    }
  };

  useEffect(() => {
    checkProviderHealth();
  }, []);

  const tabs = [
    { id: "input", label: "1. Nhập đề", icon: PenTool, ready: true },
    { id: "parsed", label: "2. Đề chuẩn hóa", icon: FileCode2, ready: hasProblemIR },
    { id: "solution", label: "3. Lời giải", icon: BookOpen, ready: hasSolution },
    { id: "visual", label: "4. Hình minh họa", icon: Compass, ready: hasVisualSpec },
    { id: "video", label: "5. Video", icon: Video, ready: hasVideoSpec },
    { id: "qa", label: "6. QA Kiểm định", icon: ShieldCheck, ready: hasVerification },
  ];

  const providerTitle =
    providerStatus === "CONNECTED"
      ? `Gemini Connected (${activeModel})`
      : providerStatus === "CHECKING"
        ? "Checking provider state..."
        : providerStatus === "NOT_CONFIGURED"
          ? "Gemini is not configured"
          : providerStatus === "NOT_CHECKED"
            ? "Gemini is configured but connectivity has not been checked"
            : "Gemini connection error";

  const providerDot =
    providerStatus === "CONNECTED"
      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
      : providerStatus === "CHECKING"
        ? "bg-amber-400 animate-pulse"
        : providerStatus === "NOT_CHECKED"
          ? "bg-amber-400"
          : providerStatus === "NOT_CONFIGURED"
            ? "bg-slate-500"
            : "bg-rose-500";

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold text-xl text-white shadow-sm">
                Σ
              </div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-semibold tracking-tight text-white">
                  MATH AI STUDIO
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/40">
                  V1 CORE
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded border border-slate-700 text-xs">
                <span className="text-slate-400 font-mono">PROVIDER:</span>
                <select
                  id="provider-select"
                  aria-label="Chọn AI Provider"
                  value={selectedProvider}
                  onChange={(e) => onChangeProvider(e.target.value as ProviderType)}
                  className="bg-transparent text-blue-400 font-mono font-bold focus:outline-none cursor-pointer pr-1"
                >
                  <option value="gemini" className="bg-slate-900 text-slate-200 font-sans">
                    Gemini
                  </option>
                  <option value="openai" disabled className="bg-slate-900 text-slate-500 font-sans">
                    OpenAI (Not Configured)
                  </option>
                  <option value="deepseek" disabled className="bg-slate-900 text-slate-500 font-sans">
                    DeepSeek (Not Configured)
                  </option>
                </select>
                <div title={providerTitle} className={`w-2 h-2 rounded-full ${providerDot}`} />
              </div>

              <div className="hidden sm:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded border border-slate-700/60 text-xs">
                <span className="text-slate-400 font-mono">RENDERER:</span>
                <span className="text-slate-400 font-mono">Python/Manim</span>
                <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  V1 Placeholder
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500" title="Disabled in V1"></div>
              </div>

              <button
                id="skills-header-btn"
                onClick={onOpenSkills}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Skills</span>
              </button>

              <button
                id="integrations-btn"
                onClick={onOpenIntegrations}
                className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition"
              >
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Ecosystem</span>
              </button>

              <button
                id="export-modal-btn"
                onClick={onOpenExport}
                disabled={!hasSolution}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${
                  hasSolution
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất dữ liệu</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex bg-white border-b border-slate-200 px-4 sm:px-8 overflow-x-auto shadow-xs">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex space-x-1 sm:space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-btn-${tab.id}`}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition ${
                    isActive
                      ? "border-blue-600 text-blue-600 bg-blue-50/70 font-semibold"
                      : tab.ready
                        ? "border-transparent text-slate-600 hover:text-blue-600 hover:bg-slate-50"
                        : "border-transparent text-slate-400 hover:text-slate-500"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : tab.ready ? "text-slate-500" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                  {tab.ready && tab.id !== "input" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  )}
                </button>
              );
            })}
          </div>

          {isProcessing && (
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded text-blue-700 text-xs animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span>AI Pipeline đang xử lý...</span>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};
