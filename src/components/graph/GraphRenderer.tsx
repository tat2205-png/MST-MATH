/**
 * Programmatic Mathematical Graph Renderer (SVG Canvas)
 * Strictly renders real mathematical functions from GraphSpec with zero visual improvisation.
 */

import React, { useState, useMemo } from "react";
import {
  GraphSpec,
  KeyPoint,
} from "../../types/graphSchema.js";
import {
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
  Grid,
  Info,
} from "lucide-react";

interface GraphRendererProps {
  graphSpec: GraphSpec | null;
  className?: string;
}

export const GraphRenderer: React.FC<GraphRendererProps> = ({
  graphSpec,
  className = "",
}) => {
  const [zoomFactor, setZoomFactor] = useState<number>(1.0);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showKeyPoints, setShowKeyPoints] = useState<boolean>(true);
  const [showAsymptotes, setShowAsymptotes] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<KeyPoint | null>(null);

  // SVG Canvas internal dimensions
  const svgWidth = 600;
  const svgHeight = 440;
  const padding = 35;

  // Viewport calculation with zoom factor
  const viewport = useMemo(() => {
    if (!graphSpec || !graphSpec.sampling?.window) {
      return { xMin: -5, xMax: 5, yMin: -5, yMax: 5, xStep: 1, yStep: 1 };
    }
    const win = graphSpec.sampling.window;
    const xMid = (win.xMin + win.xMax) / 2;
    const yMid = (win.yMin + win.yMax) / 2;
    const xHalfSpan = ((win.xMax - win.xMin) / 2) / zoomFactor;
    const yHalfSpan = ((win.yMax - win.yMin) / 2) / zoomFactor;

    return {
      xMin: xMid - xHalfSpan,
      xMax: xMid + xHalfSpan,
      yMin: yMid - yHalfSpan,
      yMax: yMid + yHalfSpan,
      xStep: win.xStep,
      yStep: win.yStep,
    };
  }, [graphSpec, zoomFactor]);

  // Coordinate Conversion: (x, y) in math units -> (px, py) in SVG pixels
  const mathToSvg = (x: number, y: number): [number, number] => {
    const plotWidth = svgWidth - 2 * padding;
    const plotHeight = svgHeight - 2 * padding;

    const px = padding + ((x - viewport.xMin) / (viewport.xMax - viewport.xMin)) * plotWidth;
    const py = svgHeight - padding - ((y - viewport.yMin) / (viewport.yMax - viewport.yMin)) * plotHeight;
    return [px, py];
  };

  // Fail-Closed Fallback View
  if (!graphSpec || graphSpec.status === "UNAVAILABLE" || graphSpec.status === "FAIL") {
    return (
      <div
        id="graph-unavailable-banner"
        className={`w-full p-8 rounded-xl border border-amber-300 bg-amber-50/70 flex flex-col items-center justify-center text-center space-y-3 ${className}`}
      >
        <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-amber-900">
            Hình minh họa đang tạm tắt để đảm bảo độ chính xác toán học.
          </h3>
          <p className="text-xs text-amber-700 max-w-lg">
            {graphSpec?.error?.message ||
              "Không thể tạo đồ thị tự động với độ tin cậy tuyệt đối cho dạng bài này theo chính sách Zero-Inference."}
          </p>
          {graphSpec?.error?.details && (
            <p className="text-[11px] font-mono text-amber-800/80 bg-amber-100/60 p-2 rounded max-w-md mx-auto">
              Chi tiết: {graphSpec.error.details}
            </p>
          )}
        </div>
        <div className="text-[11px] font-mono uppercase px-2.5 py-1 rounded bg-amber-200/80 text-amber-900 font-semibold">
          STATUS: {graphSpec?.status || "UNAVAILABLE"}
        </div>
      </div>
    );
  }

  // Ticks generation
  const xTicks: number[] = [];
  const startX = Math.ceil(viewport.xMin / viewport.xStep) * viewport.xStep;
  for (let x = startX; x <= viewport.xMax; x += viewport.xStep) {
    if (Math.abs(x) < 1e-6) continue; // Origin handled separately
    xTicks.push(Math.round(x * 100) / 100);
  }

  const yTicks: number[] = [];
  const startY = Math.ceil(viewport.yMin / viewport.yStep) * viewport.yStep;
  for (let y = startY; y <= viewport.yMax; y += viewport.yStep) {
    if (Math.abs(y) < 1e-6) continue;
    yTicks.push(Math.round(y * 100) / 100);
  }

  const [originPx, originPy] = mathToSvg(0, 0);

  // Collect all key points to render
  const keyPointsToRender: KeyPoint[] = [];
  if (graphSpec.features.yIntercept) keyPointsToRender.push(graphSpec.features.yIntercept);
  if (graphSpec.features.vertex) keyPointsToRender.push(graphSpec.features.vertex);
  graphSpec.features.xIntercepts.forEach((pt) => keyPointsToRender.push(pt));
  graphSpec.features.turningPoints.forEach((pt) => keyPointsToRender.push(pt));
  graphSpec.features.inflectionPoints.forEach((pt) => keyPointsToRender.push(pt));
  graphSpec.features.criticalPoints.forEach((pt) => keyPointsToRender.push(pt));

  return (
    <div className={`relative bg-white border border-slate-200 rounded-xl p-4 shadow-sm select-none ${className}`}>
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Đồ thị {graphSpec.graphType}
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            {graphSpec.verification.status}
          </span>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            {graphSpec.sampling.totalPoints} điểm mẫu
          </span>
        </div>

        {/* Viewport & Layers Toolbar */}
        <div className="flex items-center space-x-1.5 text-xs">
          <button
            id="toggle-grid-btn"
            onClick={() => setShowGrid(!showGrid)}
            title="Bật/Tắt lưới tọa độ"
            className={`px-2 py-1 rounded border flex items-center space-x-1 transition ${
              showGrid ? "bg-slate-100 border-slate-300 text-slate-800" : "bg-white border-slate-200 text-slate-400"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium hidden sm:inline">Lưới</span>
          </button>

          <button
            id="toggle-points-btn"
            onClick={() => setShowKeyPoints(!showKeyPoints)}
            title="Bật/Tắt điểm đặc trưng"
            className={`px-2 py-1 rounded border flex items-center space-x-1 transition ${
              showKeyPoints ? "bg-slate-100 border-slate-300 text-slate-800" : "bg-white border-slate-200 text-slate-400"
            }`}
          >
            {showKeyPoints ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="text-[11px] font-medium hidden sm:inline">Điểm đặc trưng</span>
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          <button
            id="zoom-in-btn"
            onClick={() => setZoomFactor((z) => Math.min(3.0, z * 1.25))}
            title="Phóng to"
            className="p-1.5 rounded hover:bg-slate-100 border border-slate-200 text-slate-600"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            id="zoom-out-btn"
            onClick={() => setZoomFactor((z) => Math.max(0.4, z / 1.25))}
            title="Thu nhỏ"
            className="p-1.5 rounded hover:bg-slate-100 border border-slate-200 text-slate-600"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            id="reset-view-btn"
            onClick={() => setZoomFactor(1.0)}
            title="Đặt lại khung nhìn"
            className="p-1.5 rounded hover:bg-slate-100 border border-slate-200 text-slate-600"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full relative overflow-hidden bg-slate-900 rounded-lg border border-slate-800 shadow-inner flex items-center justify-center">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto max-h-[500px]"
          style={{ shapeRendering: "geometricPrecision" }}
        >
          <defs>
            {/* Arrowhead marker for X and Y axes */}
            <marker
              id="axis-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94a3b8" />
            </marker>
          </defs>

          {/* 1. Grid lines */}
          {showGrid && (
            <g className="opacity-30">
              {xTicks.map((x) => {
                const [px] = mathToSvg(x, 0);
                return (
                  <line
                    key={`grid-x-${x}`}
                    x1={px}
                    y1={padding}
                    x2={px}
                    y2={svgHeight - padding}
                    stroke="#475569"
                    strokeWidth="1"
                    strokeDasharray="2,3"
                  />
                );
              })}
              {yTicks.map((y) => {
                const [, py] = mathToSvg(0, y);
                return (
                  <line
                    key={`grid-y-${y}`}
                    x1={padding}
                    y1={py}
                    x2={svgWidth - padding}
                    y2={py}
                    stroke="#475569"
                    strokeWidth="1"
                    strokeDasharray="2,3"
                  />
                );
              })}
            </g>
          )}

          {/* 2. Axis Symmetry Line (if quadratic) */}
          {graphSpec.features.symmetryAxis && (
            <g>
              {(() => {
                const [sx] = mathToSvg(graphSpec.features.symmetryAxis.x, 0);
                return (
                  <line
                    x1={sx}
                    y1={padding}
                    x2={sx}
                    y2={svgHeight - padding}
                    stroke="#c084fc"
                    strokeWidth="1.2"
                    strokeDasharray="4,4"
                  />
                );
              })()}
            </g>
          )}

          {/* 3. Coordinate Axes Ox & Oy */}
          <g stroke="#94a3b8" strokeWidth="1.5">
            {/* X-axis */}
            <line
              x1={padding - 10}
              y1={originPy}
              x2={svgWidth - padding + 15}
              y2={originPy}
              markerEnd="url(#axis-arrow)"
            />
            {/* Y-axis */}
            <line
              x1={originPx}
              y1={svgHeight - padding + 10}
              x2={originPx}
              y2={padding - 15}
              markerEnd="url(#axis-arrow)"
            />
          </g>

          {/* Axis Labels & Origin */}
          <text
            x={svgWidth - padding + 10}
            y={originPy - 8}
            fill="#e2e8f0"
            fontSize="13"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            x
          </text>
          <text
            x={originPx + 10}
            y={padding - 10}
            fill="#e2e8f0"
            fontSize="13"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            y
          </text>
          <text
            x={originPx - 14}
            y={originPy + 16}
            fill="#94a3b8"
            fontSize="11"
            fontFamily="sans-serif"
          >
            O
          </text>

          {/* 4. Axis Ticks & Numbers */}
          <g fontSize="10" fill="#94a3b8" textAnchor="middle" fontFamily="monospace">
            {xTicks.map((x) => {
              const [px] = mathToSvg(x, 0);
              return (
                <g key={`tick-x-${x}`}>
                  <line x1={px} y1={originPy - 3} x2={px} y2={originPy + 3} stroke="#64748b" strokeWidth="1" />
                  <text x={px} y={originPy + 14}>
                    {x}
                  </text>
                </g>
              );
            })}
            {yTicks.map((y) => {
              const [, py] = mathToSvg(0, y);
              return (
                <g key={`tick-y-${y}`}>
                  <line x1={originPx - 3} y1={py} x2={originPx + 3} stroke="#64748b" strokeWidth="1" />
                  <text x={originPx - 10} y={py + 3} textAnchor="end">
                    {y}
                  </text>
                </g>
              );
            })}
          </g>

          {/* 5. Asymptotes (Dashed lines) */}
          {showAsymptotes && (
            <g>
              {/* Vertical Asymptotes */}
              {graphSpec.features.verticalAsymptotes.map((asymp, i) => {
                const [ax] = mathToSvg(asymp.position, 0);
                return (
                  <g key={`vert-asymp-${i}`}>
                    <line
                      x1={ax}
                      y1={padding - 10}
                      x2={ax}
                      y2={svgHeight - padding + 10}
                      stroke="#fb7185"
                      strokeWidth="1.5"
                      strokeDasharray="5,5"
                    />
                    <rect
                      x={ax + 4}
                      y={padding + 10}
                      width="52"
                      height="18"
                      rx="3"
                      fill="#881337"
                      fillOpacity="0.8"
                    />
                    <text
                      x={ax + 30}
                      y={padding + 23}
                      fill="#fecdd3"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {asymp.equation}
                    </text>
                  </g>
                );
              })}

              {/* Horizontal Asymptotes */}
              {graphSpec.features.horizontalAsymptotes.map((asymp, i) => {
                const [, ay] = mathToSvg(0, asymp.position);
                return (
                  <g key={`horiz-asymp-${i}`}>
                    <line
                      x1={padding - 10}
                      y1={ay}
                      x2={svgWidth - padding + 10}
                      y2={ay}
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      strokeDasharray="5,5"
                    />
                    <rect
                      x={svgWidth - padding - 65}
                      y={ay - 22}
                      width="52"
                      height="18"
                      rx="3"
                      fill="#78350f"
                      fillOpacity="0.8"
                    />
                    <text
                      x={svgWidth - padding - 39}
                      y={ay - 9}
                      fill="#fef3c7"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {asymp.equation}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* 6. Function Branches (Real Programmatic Curve) */}
          {graphSpec.sampling.branches.map((branch) => {
            if (branch.points.length < 2) return null;

            const pathD = branch.points
              .map((pt, idx) => {
                const [px, py] = mathToSvg(pt.x, pt.y);
                return `${idx === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`;
              })
              .join(" ");

            return (
              <path
                key={`branch-${branch.branchId}`}
                d={pathD}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-200"
              />
            );
          })}

          {/* 7. Highlighted Key Points */}
          {showKeyPoints &&
            keyPointsToRender.map((pt) => {
              const [px, py] = mathToSvg(pt.x, pt.y);
              // Check if point is inside viewport
              if (
                pt.x < viewport.xMin ||
                pt.x > viewport.xMax ||
                pt.y < viewport.yMin ||
                pt.y > viewport.yMax
              ) {
                return null;
              }

              const isHovered = hoveredPoint?.id === pt.id;

              return (
                <g
                  key={pt.id}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Pulse halo on hover */}
                  {isHovered && (
                    <circle
                      cx={px}
                      cy={py}
                      r="10"
                      fill={pt.color || "#38bdf8"}
                      fillOpacity="0.3"
                      className="animate-ping"
                    />
                  )}

                  {/* Outer circle */}
                  <circle
                    cx={px}
                    cy={py}
                    r={isHovered ? "6" : "4.5"}
                    fill="#0f172a"
                    stroke={pt.color || "#38bdf8"}
                    strokeWidth="2"
                    className="transition-all"
                  />

                  {/* Inner dot */}
                  <circle cx={px} cy={py} r="2" fill={pt.color || "#38bdf8"} />

                  {/* Point Label */}
                  <text
                    x={px + 7}
                    y={py - 7}
                    fill="#f8fafc"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                    className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] pointer-events-none"
                  >
                    {pt.label}
                  </text>
                </g>
              );
            })}
        </svg>

        {/* Floating Tooltip for Key Point */}
        {hoveredPoint && (
          <div className="absolute bottom-3 left-3 bg-slate-800/95 backdrop-blur-xs border border-slate-700 text-slate-100 p-2.5 rounded-lg shadow-xl text-xs space-y-0.5 pointer-events-none z-20">
            <div className="flex items-center space-x-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: hoveredPoint.color || "#38bdf8" }}
              />
              <strong className="font-mono text-white">{hoveredPoint.label}</strong>
            </div>
            {hoveredPoint.description && (
              <p className="text-[11px] text-slate-300">{hoveredPoint.description}</p>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center space-x-1.5">
          <Info className="w-3.5 h-3.5 text-blue-500" />
          <span>
            Khung tọa độ tự động: [x: {viewport.xMin.toFixed(1)} đến {viewport.xMax.toFixed(1)}, y: {viewport.yMin.toFixed(1)} đến {viewport.yMax.toFixed(1)}]
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {graphSpec.features.vertex && (
            <span className="text-purple-600 font-medium">
              Đỉnh I({graphSpec.features.vertex.x}; {graphSpec.features.vertex.y})
            </span>
          )}
          {graphSpec.features.xIntercepts.length > 0 && (
            <span className="text-emerald-600 font-medium">
              Nghiệm ({graphSpec.features.xIntercepts.map((r) => r.x).join(", ")})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
