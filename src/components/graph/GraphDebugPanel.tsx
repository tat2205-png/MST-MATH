/**
 * Graph Debug Panel (Collapsible)
 * Displays internal mathematical pipeline data, AST information, and verification checks.
 */

import React, { useState } from "react";
import { GraphSpec } from "../../types/graphSchema.js";
import { ChevronDown, ChevronUp, Bug, Check, AlertTriangle, XCircle } from "lucide-react";

interface GraphDebugPanelProps {
  graphSpec: GraphSpec | null;
}

export const GraphDebugPanel: React.FC<GraphDebugPanelProps> = ({ graphSpec }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!graphSpec) return null;

  return (
    <div id="graph-debug-panel" className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Accordion Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-slate-950/60 hover:bg-slate-800/60 text-slate-300 transition text-xs font-mono font-semibold"
      >
        <div className="flex items-center space-x-2">
          <Bug className="w-4 h-4 text-amber-400" />
          <span>GRAPH ENGINE DEBUG PANEL</span>
          <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {graphSpec.status}
          </span>
        </div>
        <div className="flex items-center space-x-1 text-slate-400">
          <span>{isOpen ? "Thu gọn" : "Xem chi tiết kỹ thuật"}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="p-4 space-y-4 text-xs font-mono border-t border-slate-800 text-slate-300">
          {/* Grid Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">ORIGINAL INPUT</span>
              <span className="text-white font-bold">{graphSpec.inputExpression}</span>
            </div>

            <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">NORMALIZED EXPR</span>
              <span className="text-cyan-400 font-bold">{graphSpec.normalizedExpression || "N/A"}</span>
            </div>

            <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">GRAPH TYPE</span>
              <span className="text-amber-400 font-bold uppercase">{graphSpec.graphType}</span>
            </div>

            <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">DOMAIN</span>
              <span className="text-emerald-400 font-bold">{graphSpec.domain.rawText}</span>
            </div>
          </div>

          {/* Viewport & Sampling Stats */}
          <div className="p-3 rounded bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Auto-Selected Viewport:</span>
              <span className="text-slate-200">
                x: [{graphSpec.sampling.window.xMin}, {graphSpec.sampling.window.xMax}], y: [{graphSpec.sampling.window.yMin}, {graphSpec.sampling.window.yMax}]
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Sampling Branches:</span>
              <span className="text-slate-200">{graphSpec.sampling.branches.length} branches</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Total Discrete Sample Points:</span>
              <span className="text-slate-200">{graphSpec.sampling.totalPoints} points</span>
            </div>
          </div>

          {/* Verification Checks Matrix */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Verification Checks Matrix</span>
            <div className="space-y-1">
              {graphSpec.verification.checks.map((chk, i) => (
                <div
                  key={chk.id || i}
                  className="flex items-start justify-between p-2 rounded bg-slate-950/40 border border-slate-800/80"
                >
                  <div className="flex items-start space-x-2">
                    {chk.status === "PASS" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5" />
                    ) : chk.status === "WARNING" ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400 mt-0.5" />
                    )}
                    <div>
                      <span className="text-slate-200 font-bold">{chk.name}</span>
                      <p className="text-[11px] text-slate-400 font-sans">{chk.details}</p>
                      {chk.evidence && (
                        <span className="text-[10px] text-cyan-400/80 block mt-0.5">
                          Evidence: {chk.evidence}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      chk.status === "PASS"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        : chk.status === "WARNING"
                        ? "bg-amber-950 text-amber-300 border border-amber-800"
                        : "bg-rose-950 text-rose-300 border border-rose-800"
                    }`}
                  >
                    {chk.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Raw GraphSpec JSON */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Raw GraphSpec JSON Output</span>
            <pre className="p-3 bg-black/70 rounded border border-slate-800 text-[11px] text-slate-300 overflow-x-auto max-h-56 leading-relaxed">
              {JSON.stringify(graphSpec, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
