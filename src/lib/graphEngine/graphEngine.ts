/**
 * Graph Engine Orchestrator
 * High-precision mathematical graph compiler, sampler, and verifier.
 */

import { GraphSpec } from "../../types/graphSchema.js";
import { FunctionClassifier } from "./classifier.js";
import { DomainAnalyzer } from "./domainAnalyzer.js";
import { MathEvaluator } from "./evaluator.js";
import { FeatureAnalyzer } from "./featureAnalyzer.js";
import { FunctionParser } from "./functionParser.js";
import { GraphVerifier } from "./graphVerifier.js";
import { SamplingEngine } from "./samplingEngine.js";
import { ViewportEngine } from "./viewportEngine.js";

export class GraphEngine {
  public static generateGraphSpec(input: string): GraphSpec {
    // 1. Function Parser
    const parseResult = FunctionParser.parse(input);
    if (!parseResult.success) {
      return {
        status: "UNAVAILABLE",
        graphType: "unsupported",
        inputExpression: input,
        normalizedExpression: "",
        variable: "x",
        domain: {
          type: "unsupported",
          intervals: [],
          rawText: "N/A",
          latex: "N/A",
        },
        features: {
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
        },
        sampling: {
          window: { xMin: -5, xMax: 5, yMin: -5, yMax: 5, xStep: 1, yStep: 1 },
          branches: [],
          totalPoints: 0,
        },
        rendering: {
          showAxes: true,
          showGrid: true,
          showLabels: true,
          showKeyPoints: true,
          showAsymptotes: true,
          lineColor: "#38bdf8",
          lineWidth: 2.5,
        },
        verification: {
          status: "UNAVAILABLE",
          checks: [
            {
              id: "parse_error",
              name: "Nhận diện biểu thức",
              status: "FAIL",
              details: parseResult.error || "Không thể trích xuất biểu thức hàm số.",
            },
          ],
          verifiedAt: new Date().toISOString(),
        },
        error: {
          code: "FUNCTION_PARSE_ERROR",
          message: parseResult.error || "Không thể nhận diện hàm số từ đề bài.",
        },
      };
    }

    // 2. Evaluator Compilation
    const evaluator = new MathEvaluator();
    try {
      evaluator.compile(parseResult.expression);
    } catch (err: any) {
      return {
        status: "UNAVAILABLE",
        graphType: "unsupported",
        inputExpression: input,
        normalizedExpression: parseResult.expression,
        variable: "x",
        associatedProblemNotice: parseResult.associatedProblemNotice,
        domain: { type: "unsupported", intervals: [], rawText: "N/A", latex: "N/A" },
        features: {
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
        },
        sampling: {
          window: { xMin: -5, xMax: 5, yMin: -5, yMax: 5, xStep: 1, yStep: 1 },
          branches: [],
          totalPoints: 0,
        },
        rendering: {
          showAxes: true,
          showGrid: true,
          showLabels: true,
          showKeyPoints: true,
          showAsymptotes: true,
          lineColor: "#38bdf8",
          lineWidth: 2.5,
        },
        verification: {
          status: "UNAVAILABLE",
          checks: [
            {
              id: "eval_compilation",
              name: "Biên dịch cú pháp toán",
              status: "FAIL",
              details: `Lỗi phân tích cú pháp biểu thức: ${err.message}`,
            },
          ],
          verifiedAt: new Date().toISOString(),
        },
        error: {
          code: "FUNCTION_PARSE_ERROR",
          message: "Lỗi cú pháp biểu thức toán học.",
          details: err.message,
        },
      };
    }

    // 3. Classification
    const classified = FunctionClassifier.classify(parseResult.expression);

    // 4. Domain Analysis
    const domain = DomainAnalyzer.analyze(parseResult.expression, classified.type, evaluator);

    // 5. Feature Analysis
    const features = FeatureAnalyzer.analyze(parseResult.expression, classified.type, domain, evaluator);

    // 6. Viewport Calculation
    const viewport = ViewportEngine.calculateViewport(features);

    // 7. Sampling Engine
    const samplingResult = SamplingEngine.sampleFunction(evaluator, domain, features, viewport);

    // 8. Verification
    const verification = GraphVerifier.verify(
      parseResult.expression,
      classified.type,
      domain,
      features,
      evaluator,
      samplingResult.totalPoints
    );

    const graphStatus = verification.status === "FAIL" ? "FAIL" : verification.status;

    return {
      status: graphStatus,
      graphType: classified.type,
      inputExpression: input,
      normalizedExpression: parseResult.expression,
      variable: parseResult.variable,
      associatedProblemNotice: parseResult.associatedProblemNotice,
      domain,
      features,
      sampling: {
        window: viewport,
        branches: samplingResult.branches,
        totalPoints: samplingResult.totalPoints,
      },
      rendering: {
        showAxes: true,
        showGrid: true,
        showLabels: true,
        showKeyPoints: true,
        showAsymptotes: true,
        lineColor: "#0284c7",
        lineWidth: 2.5,
      },
      verification,
      error: graphStatus === "FAIL" ? {
        code: "GRAPH_VERIFICATION_FAIL",
        message: "Kiểm định đồ thị không thỏa mãn các điều kiện bất biến toán học.",
      } : null,
    };
  }
}
