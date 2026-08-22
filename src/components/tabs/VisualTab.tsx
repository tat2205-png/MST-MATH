import React, { useState, useMemo, useEffect } from "react";
import {
  Compass,
  Code2,
  Copy,
  Check,
  RotateCw,
  Eye,
  Sliders,
  ArrowRight,
  ShieldCheck,
  Layers,
  Sparkles,
  AlertTriangle,
  FileCode,
  FunctionSquare,
  CheckCircle2,
  Info,
} from "lucide-react";
import { VisualSpecification, MathProblemIR, MathSolution } from "../../types/mathSchema.js";
import { GraphSpec } from "../../types/graphSchema.js";
import { GraphEngine } from "../../lib/graphEngine/graphEngine.js";
import { GraphRenderer } from "../graph/GraphRenderer.js";
import { GraphDebugPanel } from "../graph/GraphDebugPanel.js";
import { MathView } from "../MathView.js";

interface VisualTabProps {
  visualSpec: VisualSpecification | null;
  problemIR?: MathProblemIR | null;
  solution?: MathSolution | null;
  onProceedToVideo: () => void;
  isProcessing: boolean;
}

export const VisualTab: React.FC<VisualTabProps> = ({
  visualSpec,
  problemIR,
  solution,
  onProceedToVideo,
  isProcessing,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<"tikz" | "asymptote" | "geogebra" | "json">("tikz");

  // Custom equation input for testing different function graphs interactively
  const [customInput, setCustomInput] = useState<string>("");

  // Determine input function source:
  // Priority: Custom input > visualSpec curve equation > problemIR problem text > default test
  const initialFunctionString = useMemo(() => {
    if (problemIR?.latex && (problemIR.latex.includes("x^2") || problemIR.latex.includes("x^3") || problemIR.latex.includes("x"))) {
      return problemIR.latex;
    }
    if (problemIR?.problem) {
      return problemIR.problem;
    }
    const curveElem = visualSpec?.elements?.find((e) => e.type === "curve");
    if (curveElem?.equation) return curveElem.equation;
    return "2x^2 - 5x + 2 = 0";
  }, [problemIR, visualSpec]);

  const activeInput = customInput.trim() || initialFunctionString;

  // Generate real, verified GraphSpec programmatically via GraphEngine
  const graphSpec: GraphSpec = useMemo(() => {
    return GraphEngine.generateGraphSpec(activeInput);
  }, [activeInput]);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const is3DGeometry = visualSpec?.visual_type === "GEOMETRY_3D" && !problemIR?.problem.includes("x^2") && !problemIR?.problem.includes("hàm số");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
              PROGRAMMATIC GRAPH ENGINE
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Zero-Inference Mathematical Plotter
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Đồ thị & Hình học Minh họa Chuẩn xác
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mọi đường cong được dựng từ biểu thức giải tích và kiểm định tự động theo định lý toán học.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onProceedToVideo}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <span>Kịch bản Video (Manim)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Test Bar for the 8 Standard Test Suite Cases */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
            <FunctionSquare className="w-4 h-4 text-blue-600" />
            <span>Bộ kiểm thử nhanh 8 dạng hàm (Test Suite):</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "1. Bậc nhất", expr: "y = 2x - 3" },
              { label: "2. Bậc hai", expr: "2x^2 - 5x + 2 = 0" },
              { label: "3. Bậc ba", expr: "y = x^3 - 3x + 1" },
              { label: "4. Phân thức", expr: "y = (x + 1)/(x - 2)" },
              { label: "5. Căn thức", expr: "y = sqrt(x + 2)" },
              { label: "6. Logarit", expr: "y = ln(x - 1)" },
              { label: "7. Lượng giác", expr: "y = sin(x)" },
              { label: "8. Trị tuyệt đối", expr: "y = |x - 1|" },
            ].map((t) => (
              <button
                key={t.label}
                onClick={() => setCustomInput(t.expr)}
                className={`text-[11px] px-2.5 py-1 rounded-md border font-mono transition ${
                  activeInput === t.expr
                    ? "bg-blue-600 border-blue-600 text-white font-bold shadow-xs"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Graph Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Programmatic SVG Graph & Rendering */}
        <div className="lg:col-span-7 space-y-4">
          {/* 1. Biểu thức dùng để vẽ & Associated Equation Notice */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Biểu thức dùng để vẽ
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Hàm số: {graphSpec.graphType}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="space-y-0.5">
                <span className="text-xs text-slate-500 block">Công thức hàm giải tích:</span>
                <div className="text-lg font-bold text-slate-900">
                  <MathView latex={graphSpec.normalizedExpression ? `y = ${graphSpec.normalizedExpression}` : "y = f(x)"} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono text-slate-400">Biến số: {graphSpec.variable}</span>
              </div>
            </div>

            {/* Problem-to-Graph Associated Equation Notice */}
            {graphSpec.associatedProblemNotice && (
              <div className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-200 flex items-start space-x-2 text-xs text-blue-900">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="leading-relaxed font-medium">
                  {graphSpec.associatedProblemNotice}
                </p>
              </div>
            )}
          </div>

          {/* 4. Hình minh họa (Interactive Programmatic SVG Canvas) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                4. Hình minh họa (Programmatic Vector Canvas)
              </span>
            </div>
            <GraphRenderer graphSpec={graphSpec} />
          </div>

          {/* 6. Debug Details Panel (Collapsible) */}
          <GraphDebugPanel graphSpec={graphSpec} />
        </div>

        {/* Right 5 Columns: Domain, Features, Verification QA */}
        <div className="lg:col-span-5 space-y-4">
          {/* 2. Miền xác định (Domain) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Miền xác định
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                {graphSpec.domain.type.toUpperCase()}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-sm font-bold text-slate-900">
                <MathView latex={graphSpec.domain.latex || "D = \\mathbb{R}"} />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {graphSpec.domain.rawText}
              </p>
            </div>
          </div>

          {/* 3. Đặc trưng đồ thị (Computed Features) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                3. Đặc trưng toán học của đồ thị
              </span>
              <span className="text-[10px] font-mono text-slate-400">Zero-Inference Computed</span>
            </div>

            <div className="space-y-2.5">
              {/* Vertex / Parabola Peak */}
              {graphSpec.features.vertex && (
                <div className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-200 flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-purple-900 block">
                      Đỉnh Parabol (Vertex)
                    </span>
                    <span className="text-xs text-purple-700">
                      Tọa độ: <strong className="font-mono">{graphSpec.features.vertex.label}</strong>
                    </span>
                    <p className="text-[11px] text-purple-600">{graphSpec.features.vertex.description}</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-200 text-purple-900">
                    I({graphSpec.features.vertex.x}; {graphSpec.features.vertex.y})
                  </span>
                </div>
              )}

              {/* Axis of Symmetry */}
              {graphSpec.features.symmetryAxis && (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Trục đối xứng:</span>
                  <strong className="font-mono text-slate-800">
                    <MathView latex={graphSpec.features.symmetryAxis.latex} />
                  </strong>
                </div>
              )}

              {/* X-Intercepts / Roots */}
              <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">
                    Giao điểm với trục hoành Ox (Nghiệm):
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900">
                    {graphSpec.features.xIntercepts.length} điểm
                  </span>
                </div>
                {graphSpec.features.xIntercepts.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {graphSpec.features.xIntercepts.map((pt) => (
                      <span
                        key={pt.id}
                        className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white text-emerald-800 border border-emerald-300 shadow-2xs"
                      >
                        {pt.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-emerald-700 italic">Không có giao điểm thực với Ox</span>
                )}
              </div>

              {/* Y-Intercept */}
              {graphSpec.features.yIntercept && (
                <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200 flex items-center justify-between text-xs">
                  <span className="text-blue-900 font-medium">Giao điểm trục tung Oy:</span>
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-white text-blue-800 border border-blue-300 shadow-2xs">
                    {graphSpec.features.yIntercept.label}
                  </span>
                </div>
              )}

              {/* Asymptotes */}
              {(graphSpec.features.verticalAsymptotes.length > 0 ||
                graphSpec.features.horizontalAsymptotes.length > 0) && (
                <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 space-y-1 text-xs">
                  <span className="font-bold text-amber-900 block">Đường tiệm cận (Asymptotes):</span>
                  {graphSpec.features.verticalAsymptotes.map((a, i) => (
                    <div key={i} className="flex justify-between text-amber-800">
                      <span>Tiệm cận đứng (TCĐ):</span>
                      <strong className="font-mono">{a.equation}</strong>
                    </div>
                  ))}
                  {graphSpec.features.horizontalAsymptotes.map((a, i) => (
                    <div key={i} className="flex justify-between text-amber-800">
                      <span>Tiệm cận ngang (TCN):</span>
                      <strong className="font-mono">{a.equation}</strong>
                    </div>
                  ))}
                </div>
              )}

              {/* Turning / Extrema / Inflection Points for Cubic */}
              {graphSpec.features.turningPoints.length > 0 && (
                <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-200 space-y-1 text-xs">
                  <span className="font-bold text-indigo-900 block">Điểm cực trị (Extrema):</span>
                  {graphSpec.features.turningPoints.map((pt) => (
                    <div key={pt.id} className="flex justify-between text-indigo-800">
                      <span>{pt.type === "local_max" ? "Cực đại:" : "Cực tiểu:"}</span>
                      <strong className="font-mono">{pt.label}</strong>
                    </div>
                  ))}
                </div>
              )}

              {graphSpec.features.inflectionPoints.length > 0 && (
                <div className="p-2.5 rounded-lg bg-pink-50/60 border border-pink-200 flex justify-between text-xs text-pink-900">
                  <span>Điểm uốn (Inflection Point):</span>
                  <strong className="font-mono">{graphSpec.features.inflectionPoints[0].label}</strong>
                </div>
              )}
            </div>
          </div>

          {/* 5. Kiểm định đồ thị (Graph QA Verification Matrix) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  5. Kiểm định đồ thị (Graph QA)
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  graphSpec.verification.status === "PASS"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : graphSpec.verification.status === "WARNING"
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : "bg-rose-100 text-rose-800 border border-rose-300"
                }`}
              >
                {graphSpec.verification.status}
              </span>
            </div>

            <div className="space-y-2">
              {graphSpec.verification.checks.map((chk, idx) => (
                <div
                  key={chk.id || idx}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{chk.name}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        chk.status === "PASS"
                          ? "bg-emerald-100 text-emerald-700"
                          : chk.status === "WARNING"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {chk.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{chk.details}</p>
                  {chk.evidence && (
                    <span className="text-[10px] font-mono text-slate-500 bg-white p-1 rounded border border-slate-200 block truncate">
                      {chk.evidence}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Export TikZ / GeoGebra Commands */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Xuất mã nguồn TikZ / Asymptote
              </span>
              <div className="flex items-center space-x-1">
                {(["tikz", "asymptote", "geogebra"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveCodeTab(tab)}
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded transition ${
                      activeCodeTab === tab
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <pre className="p-3 bg-slate-900 text-slate-200 text-[11px] font-mono rounded-lg overflow-x-auto max-h-36">
                {activeCodeTab === "tikz"
                  ? `\\begin{tikzpicture}[scale=0.8]
  \\draw[->] (${graphSpec.sampling.window.xMin},0) -- (${graphSpec.sampling.window.xMax},0) node[right] {$x$};
  \\draw[->] (0,${graphSpec.sampling.window.yMin}) -- (0,${graphSpec.sampling.window.yMax}) node[above] {$y$};
  \\draw[domain=${graphSpec.sampling.window.xMin}:${graphSpec.sampling.window.xMax},smooth,variable=\\x,blue,thick] plot ({\\x},{${graphSpec.normalizedExpression}});
\\end{tikzpicture}`
                  : activeCodeTab === "asymptote"
                  ? `import graph;
size(200, 150, IgnoreAspect);
real f(real x) { return ${graphSpec.normalizedExpression}; }
draw(graph(f, ${graphSpec.sampling.window.xMin}, ${graphSpec.sampling.window.xMax}), blue);
xaxis("$x$", Arrow);
yaxis("$y$", Arrow);`
                  : `f(x) = ${graphSpec.normalizedExpression}`}
              </pre>
              <button
                onClick={() =>
                  handleCopy(
                    activeCodeTab === "tikz"
                      ? `\\draw plot (${graphSpec.normalizedExpression});`
                      : `f(x) = ${graphSpec.normalizedExpression}`,
                    activeCodeTab
                  )
                }
                className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700"
                title="Sao chép mã"
              >
                {copiedCode === activeCodeTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
