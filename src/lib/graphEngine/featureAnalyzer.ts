/**
 * Mathematical Feature Analyzer
 * Computes exact algebraic roots, vertex, intercepts, extrema, inflection points, and asymptotes.
 */

import { Asymptote, GraphDomain, GraphFeatures, GraphType, KeyPoint } from "../../types/graphSchema.js";
import { FunctionClassifier } from "./classifier.js";
import { MathEvaluator } from "./evaluator.js";

export class FeatureAnalyzer {
  public static analyze(
    expr: string,
    graphType: GraphType,
    domain: GraphDomain,
    evaluator: MathEvaluator
  ): GraphFeatures {
    const features: GraphFeatures = {
      xIntercepts: [],
      yIntercept: null,
      vertex: null,
      criticalPoints: [],
      turningPoints: [],
      inflectionPoints: [],
      verticalAsymptotes: [],
      horizontalAsymptotes: [],
      obliqueAsymptotes: [],
      holes: [],
      discontinuities: [],
      openingDirection: "none",
      symmetryAxis: null,
    };

    // 1. Compute Y-Intercept (if x = 0 is in domain)
    const yAtZero = evaluator.evaluateSafe(0);
    if (yAtZero !== null && !isNaN(yAtZero) && isFinite(yAtZero)) {
      const roundedY = Math.round(yAtZero * 10000) / 10000;
      features.yIntercept = {
        id: "y_intercept",
        type: "y_intercept",
        x: 0,
        y: roundedY,
        label: `(0; ${roundedY})`,
        latex: `(0; ${roundedY})`,
        color: "#3b82f6", // Blue
        description: "Giao điểm với trục tung Oy",
      };
    }

    // 2. Specific Analysis by Function Type
    switch (graphType) {
      case "quadratic": {
        const { a, b, c } = FunctionClassifier.extractQuadraticParams(expr);
        if (a !== 0) {
          features.openingDirection = a > 0 ? "up" : "down";

          // Vertex: x_v = -b / (2a), y_v = f(x_v)
          const xv = -b / (2 * a);
          const yv = a * xv * xv + b * xv + c;
          const rxv = Math.round(xv * 10000) / 10000;
          const ryv = Math.round(yv * 10000) / 10000;

          features.vertex = {
            id: "vertex",
            type: "vertex",
            x: rxv,
            y: ryv,
            label: `Đỉnh I(${rxv}; ${ryv})`,
            latex: `I(${rxv}; ${ryv})`,
            color: "#a855f7", // Purple
            description: a > 0 ? "Điểm cực tiểu (Đỉnh parabol quay lên)" : "Điểm cực đại (Đỉnh parabol quay xuống)",
          };

          // Symmetry Axis
          features.symmetryAxis = {
            x: rxv,
            latex: `x = ${rxv}`,
          };

          // Discriminant Delta = b^2 - 4ac
          const delta = b * b - 4 * a * c;
          if (delta > 0) {
            const x1 = (-b - Math.sqrt(delta)) / (2 * a);
            const x2 = (-b + Math.sqrt(delta)) / (2 * a);
            const sortedRoots = [x1, x2].sort((p, q) => p - q);

            features.xIntercepts = sortedRoots.map((root, idx) => {
              const r = Math.round(root * 10000) / 10000;
              return {
                id: `root_${idx + 1}`,
                type: "root",
                x: r,
                y: 0,
                label: `(${r}; 0)`,
                latex: `x_{${idx + 1}} = ${r}`,
                color: "#10b981", // Emerald
                description: `Giao điểm với trục hoành (Nghiệm phương trình)`,
              };
            });
          } else if (Math.abs(delta) < 1e-10) {
            const r = Math.round(xv * 10000) / 10000;
            features.xIntercepts = [
              {
                id: "root_double",
                type: "root",
                x: r,
                y: 0,
                label: `Nghiệm kép (${r}; 0)`,
                latex: `x_0 = ${r}`,
                color: "#10b981",
                description: "Nghiệm kép (Parabol tiếp xúc Ox)",
              },
            ];
          }
        }
        break;
      }

      case "linear": {
        const { a, b } = FunctionClassifier.extractLinearParams(expr);
        if (a !== 0) {
          const root = -b / a;
          const r = Math.round(root * 10000) / 10000;
          features.xIntercepts.push({
            id: "root_linear",
            type: "root",
            x: r,
            y: 0,
            label: `(${r}; 0)`,
            latex: `(${r}; 0)`,
            color: "#10b981",
            description: "Giao điểm với trục hoành Ox",
          });
        }
        break;
      }

      case "cubic": {
        const { a, b, c, d } = FunctionClassifier.extractCubicParams(expr);
        if (a !== 0) {
          // Inflection point: x_I = -b / (3a)
          const xI = -b / (3 * a);
          const yI = evaluator.evaluateSafe(xI) ?? 0;
          const rxI = Math.round(xI * 10000) / 10000;
          const ryI = Math.round(yI * 10000) / 10000;

          features.inflectionPoints.push({
            id: "inflection",
            type: "inflection",
            x: rxI,
            y: ryI,
            label: `Điểm uốn U(${rxI}; ${ryI})`,
            latex: `U(${rxI}; ${ryI})`,
            color: "#ec4899", // Pink
            description: "Tâm đối xứng / Điểm uốn của đồ thị bậc ba",
          });

          // Critical points: f'(x) = 3ax^2 + 2bx + c = 0
          const A_p = 3 * a;
          const B_p = 2 * b;
          const C_p = c;
          const delta_p = B_p * B_p - 4 * A_p * C_p;

          if (delta_p > 0) {
            const ct1 = (-B_p - Math.sqrt(delta_p)) / (2 * A_p);
            const ct2 = (-B_p + Math.sqrt(delta_p)) / (2 * A_p);
            const sortedCt = [ct1, ct2].sort((p, q) => p - q);

            sortedCt.forEach((cx, idx) => {
              const cy = evaluator.evaluateSafe(cx) ?? 0;
              const rcx = Math.round(cx * 10000) / 10000;
              const rcy = Math.round(cy * 10000) / 10000;
              const isMax = (idx === 0 && a > 0) || (idx === 1 && a < 0);

              features.turningPoints.push({
                id: `turning_${idx + 1}`,
                type: isMax ? "local_max" : "local_min",
                x: rcx,
                y: rcy,
                label: `${isMax ? "Cực đại" : "Cực tiểu"} (${rcx}; ${rcy})`,
                latex: `(${rcx}; ${rcy})`,
                color: isMax ? "#f59e0b" : "#8b5cf6",
                description: isMax ? "Điểm cực đại địa phương" : "Điểm cực tiểu địa phương",
              });
            });
          }

          // Find real roots numerically around key points
          const roots = FeatureAnalyzer.findRootsNumerically(evaluator, -10, 10);
          features.xIntercepts = roots.map((root, idx) => ({
            id: `root_${idx + 1}`,
            type: "root",
            x: root,
            y: 0,
            label: `(${root}; 0)`,
            latex: `x_{${idx + 1}} = ${root}`,
            color: "#10b981",
            description: "Giao điểm với trục hoành",
          }));
        }
        break;
      }

      case "rational": {
        // e.g. (x+1)/(x-2)
        const clean = expr.replace(/\s+/g, "");
        const parts = clean.split("/");
        if (parts.length === 2) {
          const num = parts[0].replace(/^\(+|\)+$/g, "");
          const den = parts[1].replace(/^\(+|\)+$/g, "");

          const numParams = FunctionClassifier.extractLinearParams(num);
          const denParams = FunctionClassifier.extractLinearParams(den);

          // Vertical Asymptote: den = 0 -> x = -d/c
          if (denParams.a !== 0) {
            const vPos = -denParams.b / denParams.a;
            const rvPos = Math.round(vPos * 10000) / 10000;
            features.verticalAsymptotes.push({
              type: "vertical",
              position: rvPos,
              equation: `x = ${rvPos}`,
              latex: `x = ${rvPos}`,
            });
            features.discontinuities.push(rvPos);
          }

          // Horizontal Asymptote: numParams.a / denParams.a
          if (denParams.a !== 0 && numParams.a !== 0) {
            const hPos = numParams.a / denParams.a;
            const rhPos = Math.round(hPos * 10000) / 10000;
            features.horizontalAsymptotes.push({
              type: "horizontal",
              position: rhPos,
              equation: `y = ${rhPos}`,
              latex: `y = ${rhPos}`,
            });
          }

          // X-intercept: num = 0 -> x = -b/a
          if (numParams.a !== 0) {
            const root = -numParams.b / numParams.a;
            const r = Math.round(root * 10000) / 10000;
            features.xIntercepts.push({
              id: "root_rational",
              type: "root",
              x: r,
              y: 0,
              label: `(${r}; 0)`,
              latex: `(${r}; 0)`,
              color: "#10b981",
              description: "Giao điểm với trục hoành Ox",
            });
          }
        }
        break;
      }

      case "radical": {
        // e.g. sqrt(x+2)
        const clean = expr.replace(/\s+/g, "");
        const sqrtMatch = clean.match(/sqrt\(([a-z0-9\+\-\*\^]+)\)/i);
        if (sqrtMatch) {
          const linParams = FunctionClassifier.extractLinearParams(sqrtMatch[1]);
          if (linParams.a !== 0) {
            const startX = -linParams.b / linParams.a;
            const startY = evaluator.evaluateSafe(startX) ?? 0;
            const rx = Math.round(startX * 10000) / 10000;
            const ry = Math.round(startY * 10000) / 10000;

            features.criticalPoints.push({
              id: "start_point",
              type: "start_point",
              x: rx,
              y: ry,
              label: `Điểm gốc (${rx}; ${ry})`,
              latex: `(${rx}; ${ry})`,
              color: "#06b6d4", // Cyan
              description: "Điểm biên xác định của hàm căn thức",
            });
          }
        }
        break;
      }

      case "logarithmic": {
        // e.g. ln(x-1)
        const clean = expr.replace(/\s+/g, "");
        const logMatch = clean.match(/(?:ln|log)\(([a-z0-9\+\-\*\^]+)\)/i);
        if (logMatch) {
          const linParams = FunctionClassifier.extractLinearParams(logMatch[1]);
          if (linParams.a !== 0) {
            // Vertical Asymptote: inner = 0 -> x = -b/a
            const vPos = -linParams.b / linParams.a;
            const rvPos = Math.round(vPos * 10000) / 10000;
            features.verticalAsymptotes.push({
              type: "vertical",
              position: rvPos,
              equation: `x = ${rvPos}`,
              latex: `x = ${rvPos}`,
            });

            // X-intercept: inner = 1 -> ax + b = 1 -> x = (1 - b) / a
            const root = (1 - linParams.b) / linParams.a;
            const r = Math.round(root * 10000) / 10000;
            features.xIntercepts.push({
              id: "root_log",
              type: "root",
              x: r,
              y: 0,
              label: `(${r}; 0)`,
              latex: `(${r}; 0)`,
              color: "#10b981",
              description: "Giao điểm với trục hoành Ox",
            });
          }
        }
        break;
      }

      case "absolute_value": {
        // e.g. |x-1| or abs(x-1)
        const clean = expr.replace(/\s+/g, "");
        const absMatch = clean.match(/abs\(([a-z0-9\+\-\*\^]+)\)/i);
        if (absMatch) {
          const linParams = FunctionClassifier.extractLinearParams(absMatch[1]);
          if (linParams.a !== 0) {
            const vx = -linParams.b / linParams.a;
            const vy = evaluator.evaluateSafe(vx) ?? 0;
            const rvx = Math.round(vx * 10000) / 10000;
            const rvy = Math.round(vy * 10000) / 10000;

            features.vertex = {
              id: "vertex_abs",
              type: "vertex",
              x: rvx,
              y: rvy,
              label: `Điểm gãy V(${rvx}; ${rvy})`,
              latex: `V(${rvx}; ${rvy})`,
              color: "#a855f7",
              description: "Điểm gãy góc (Đỉnh của hàm giá trị tuyệt đối)",
            };
          }
        }
        break;
      }

      default: {
        // Numerical root finder for other functions
        const roots = FeatureAnalyzer.findRootsNumerically(evaluator, -8, 8);
        features.xIntercepts = roots.map((root, idx) => ({
          id: `root_num_${idx + 1}`,
          type: "root",
          x: root,
          y: 0,
          label: `(${root}; 0)`,
          latex: `(${root}; 0)`,
          color: "#10b981",
          description: "Giao điểm với trục hoành",
        }));
        break;
      }
    }

    return features;
  }

  /**
   * Safe numerical bisection root search
   */
  private static findRootsNumerically(evaluator: MathEvaluator, min: number, max: number): number[] {
    const roots: number[] = [];
    const step = 0.2;
    let prevX = min;
    let prevY = evaluator.evaluateSafe(prevX);

    for (let x = min + step; x <= max; x += step) {
      const currY = evaluator.evaluateSafe(x);
      if (prevY !== null && currY !== null && isFinite(prevY) && isFinite(currY)) {
        if (prevY * currY <= 0) {
          // Bisection within [prevX, x]
          let a = prevX;
          let b = x;
          for (let iter = 0; iter < 24; iter++) {
            const mid = (a + b) / 2;
            const midY = evaluator.evaluateSafe(mid);
            if (midY === null || Math.abs(midY) < 1e-6) {
              a = mid;
              break;
            }
            const aY = evaluator.evaluateSafe(a);
            if (aY !== null && aY * midY <= 0) {
              b = mid;
            } else {
              a = mid;
            }
          }
          const rootVal = Math.round(a * 1000) / 1000;
          if (!roots.some((r) => Math.abs(r - rootVal) < 0.05)) {
            roots.push(rootVal);
          }
        }
      }
      prevX = x;
      prevY = currY;
    }

    return roots;
  }
}
