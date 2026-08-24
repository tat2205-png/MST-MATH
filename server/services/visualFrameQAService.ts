import { geminiProvider } from "../providers/index.js";
import {
  FrameQAResult,
  FrameQAIssue,
  JobVisualFrameQAReport,
  FrameQAStatus,
  FinalRenderStatus,
} from "../../src/types/localRender.js";

interface FrameImageSource {
  frameName: "START" | "KEY" | "END";
  name: string;
  url?: string;
  base64?: string;
  mimeType?: string;
}

export type FrameInputStatus = "PASS" | "MISSING" | "MALFORMED";

export class VisualFrameQAService {
  /**
   * Main orchestrator for Visual Frame QA (Step 6D)
   * Fetches real frames from Local Bridge and sends them to Gemini Multimodal for inspection.
   */
  async runJobFrameQA(params: {
    jobId: string;
    bridgeUrl?: string;
    localBridgeToken?: string;
    problemIR?: any;
    solution?: any;
    visualSpec?: any;
    videoSpec?: any;
    rawFrames?: {
      start?: { base64: string; mimeType?: string };
      key?: { base64: string; mimeType?: string };
      end?: { base64: string; mimeType?: string };
    };
  }): Promise<JobVisualFrameQAReport> {
    const {
      jobId,
      bridgeUrl = "http://127.0.0.1:8765",
      localBridgeToken,
      problemIR,
      solution,
      visualSpec,
      videoSpec,
      rawFrames,
    } = params;

    const timestamp = new Date().toISOString();

    // Track artifact fetch status
    let startFetchOk = false;
    let keyFetchOk = false;
    let endFetchOk = false;

    const frameSources: FrameImageSource[] = [];

    // 1. If rawFrames are directly provided (e.g. from local file stream or direct test upload)
    if (rawFrames) {
      if (rawFrames.start?.base64) {
        frameSources.push({
          frameName: "START",
          name: "START.png",
          base64: rawFrames.start.base64,
          mimeType: rawFrames.start.mimeType || "image/png",
        });
        startFetchOk = true;
      }
      if (rawFrames.key?.base64) {
        frameSources.push({
          frameName: "KEY",
          name: "KEY.png",
          base64: rawFrames.key.base64,
          mimeType: rawFrames.key.mimeType || "image/png",
        });
        keyFetchOk = true;
      }
      if (rawFrames.end?.base64) {
        frameSources.push({
          frameName: "END",
          name: "END.png",
          base64: rawFrames.end.base64,
          mimeType: rawFrames.end.mimeType || "image/png",
        });
        endFetchOk = true;
      }
    }

    // 2. Otherwise fetch artifacts list from Local Bridge
    if (frameSources.length < 3 && jobId) {
      try {
        const headers: Record<string, string> = { Accept: "application/json" };
        if (localBridgeToken) {
          headers["Authorization"] = `Bearer ${localBridgeToken}`;
        }

        const artifactsRes = await fetch(
          `${bridgeUrl}/api/jobs/${encodeURIComponent(jobId)}/artifacts`,
          { method: "GET", headers }
        );

        if (artifactsRes.ok) {
          const artifactsData = await artifactsRes.json();
          const artifacts: any[] = Array.isArray(artifactsData.artifacts)
            ? artifactsData.artifacts
            : [];

          for (const art of artifacts) {
            const name = (art.name || "").toUpperCase();
            const artRef = art.pathOrUrl || art.url || `${bridgeUrl}/api/jobs/${encodeURIComponent(jobId)}/artifacts/${art.id || art.name}`;
            const artUrl = this.resolveArtifactUrl(artRef, bridgeUrl);

            if ((name.includes("START") || art.type === "start_frame") && !startFetchOk) {
              const image = await this.downloadImage(artUrl, headers);
              if (image) {
                frameSources.push({ frameName: "START", name: art.name || "START.png", ...image, url: artUrl });
                startFetchOk = true;
              }
            } else if ((name.includes("KEY") || art.type === "key_frame") && !keyFetchOk) {
              const image = await this.downloadImage(artUrl, headers);
              if (image) {
                frameSources.push({ frameName: "KEY", name: art.name || "KEY.png", ...image, url: artUrl });
                keyFetchOk = true;
              }
            } else if ((name.includes("END") || art.type === "end_frame") && !endFetchOk) {
              const image = await this.downloadImage(artUrl, headers);
              if (image) {
                frameSources.push({ frameName: "END", name: art.name || "END.png", ...image, url: artUrl });
                endFetchOk = true;
              }
            }
          }
        }
      } catch (err: any) {
        console.warn(`[VisualFrameQAService] Error fetching artifacts from bridge:`, err.message);
      }
    }

    // 3. Input gate: never invoke Gemini with missing or empty frame content.
    const startSource = frameSources.find((f) => f.frameName === "START");
    const keySource = frameSources.find((f) => f.frameName === "KEY");
    const endSource = frameSources.find((f) => f.frameName === "END");
    const sources = [startSource, keySource, endSource];
    const frameInputQa: FrameInputStatus = !startFetchOk || !keyFetchOk || !endFetchOk
      ? "MISSING"
      : sources.every((source) => this.isValidImageSource(source)) ? "PASS" : "MALFORMED";

    if (frameInputQa !== "PASS") {
      const startResult = this.createInputFailureResult("START", startSource, frameInputQa);
      const keyResult = this.createInputFailureResult("KEY", keySource, frameInputQa);
      const endResult = this.createInputFailureResult("END", endSource, frameInputQa);
      return this.buildInputFailureReport(jobId, startResult, keyResult, endResult, timestamp);
    }

    // 4. Multimodal Analysis for each frame
    let geminiVisionOk = true;
    const context = {
      problemIR,
      solution,
      visualSpec,
      videoSpec,
    };
    const startResult = await this.safeEvaluateSingleFrame("START", startSource, context);
    const keyResult = await this.safeEvaluateSingleFrame("KEY", keySource, context);
    const endResult = await this.safeEvaluateSingleFrame("END", endSource, context);

    if (
      !startResult.analysisCompleted || !keyResult.analysisCompleted || !endResult.analysisCompleted
    ) {
      geminiVisionOk = false;
    }

    // 4. Summarize and classify all issues
    const allIssues = [
      ...startResult.issues,
      ...keyResult.issues,
      ...endResult.issues,
    ];

    const lowCount = allIssues.filter((i) => i.severity === "LOW").length;
    const mediumCount = allIssues.filter((i) => i.severity === "MEDIUM").length;
    const highCount = allIssues.filter((i) => i.severity === "HIGH").length;
    const criticalCount = allIssues.filter((i) => i.severity === "CRITICAL").length;

    const mathErrors = allIssues.filter((i) => i.category === "MATH_ERROR").length;
    const geometryErrors = allIssues.filter((i) => i.category === "GEOMETRY_ERROR").length;
    const graphErrors = allIssues.filter((i) => i.category === "GRAPH_ERROR").length;
    const layoutErrors = allIssues.filter((i) => i.category === "LAYOUT_ERROR").length;
    const cameraErrors = allIssues.filter((i) => i.category === "CAMERA_ERROR").length;
    const textErrors = allIssues.filter((i) => i.category === "TEXT_ERROR").length;
    const assetErrors = allIssues.filter((i) => i.category === "ASSET_ERROR").length;

    // 5. Aggregate Frame QA Status (Rule 10):
    // FRAME_QA = PASS only when START=PASS, KEY=PASS, END=PASS and NO HIGH / CRITICAL issues
    const analysisCompleted = startResult.analysisCompleted && keyResult.analysisCompleted && endResult.analysisCompleted;
    let overallStatus: FrameQAStatus = analysisCompleted ? "PASS" : "FAIL";

    if (
      startResult.status === "NEED_SOURCE_VERIFICATION" ||
      keyResult.status === "NEED_SOURCE_VERIFICATION" ||
      endResult.status === "NEED_SOURCE_VERIFICATION"
    ) {
      overallStatus = "NEED_SOURCE_VERIFICATION";
    }

    if (
      startResult.status === "FAIL" ||
      keyResult.status === "FAIL" ||
      endResult.status === "FAIL" ||
      highCount > 0 ||
      criticalCount > 0 ||
      !analysisCompleted ||
      !startFetchOk ||
      !keyFetchOk ||
      !endFetchOk
    ) {
      overallStatus = "FAIL";
    }

    // Final status gate
    let finalStatus: FinalRenderStatus = "QA_FAILED";
    if (overallStatus === "PASS") {
      finalStatus = "RENDER_READY";
    } else if (overallStatus === "NEED_SOURCE_VERIFICATION") {
      finalStatus = "NEED_SOURCE_VERIFICATION";
    } else {
      finalStatus = "QA_FAILED";
    }

    // QA Metrics breakdown
    const report: JobVisualFrameQAReport = {
      jobId,
      overallStatus,
      frames: {
        start: startResult,
        key: keyResult,
        end: endResult,
      },
      summary: {
        totalIssues: allIssues.length,
        lowCount,
        mediumCount,
        highCount,
        criticalCount,
        mathErrors,
        geometryErrors,
        graphErrors,
        layoutErrors,
        cameraErrors,
        textErrors,
        assetErrors,
      },
      qaMetrics: {
        frameInputQa,
        startFrameFetchQa: startFetchOk ? "PASS" : "FAIL",
        keyFrameFetchQa: keyFetchOk ? "PASS" : "FAIL",
        endFrameFetchQa: endFetchOk ? "PASS" : "FAIL",
        geminiVisionQa: geminiVisionOk ? "PASS" : "FAIL",
        startVisualQa: startResult.status === "PASS" ? "PASS" : "FAIL",
        keyVisualQa: keyResult.status === "PASS" ? "PASS" : "FAIL",
        endVisualQa: endResult.status === "PASS" ? "PASS" : "FAIL",
        mathFrameQa: mathErrors > 0 || !analysisCompleted ? "FAIL" : overallStatus === "NEED_SOURCE_VERIFICATION" ? "NEED_SOURCE_VERIFICATION" : "PASS",
        geometryFrameQa: visualSpec?.type === "geometry_3d" || visualSpec?.type === "geometry_2d" ? (geometryErrors > 0 ? "FAIL" : "PASS") : "NOT_APPLICABLE",
        graphFrameQa: visualSpec?.type === "function_graph" ? (graphErrors > 0 ? "FAIL" : "PASS") : "NOT_APPLICABLE",
        layoutFrameQa: layoutErrors > 0 ? "FAIL" : "PASS",
        cameraFrameQa: cameraErrors > 0 ? "FAIL" : "PASS",
        frameQa: overallStatus,
      },
      finalStatus,
      timestamp,
    };

    return report;
  }

  /**
   * Evaluates a single frame using Gemini Multimodal Vision and strict zero-inference rules.
   */
  private async evaluateSingleFrame(
    frameName: "START" | "KEY" | "END",
    frameSource?: FrameImageSource,
    context?: {
      problemIR?: any;
      solution?: any;
      visualSpec?: any;
      videoSpec?: any;
    }
  ): Promise<FrameQAResult> {
    if (!frameSource || !frameSource.base64) {
      return {
        frameName,
        status: "FAIL",
        analysisCompleted: false,
        analysisStage: "INPUT",
        issues: [
          {
            category: "FRAME_INPUT_ERROR",
            severity: "CRITICAL",
            description: `Khung hình ${frameName}.png không tìm thấy hoặc không thể tải từ Local Bridge.`,
            repairClass: "INFRASTRUCTURE_ERROR",
          },
        ],
        inputStatus: "MISSING",
        notes: `FRAME_MISSING: ${frameName}.png was not provided or unreachable from Local Bridge.`,
      };
    }

    const { problemIR, solution, visualSpec } = context || {};

    // Build context summary for mathematical verification without leaking secrets
    const mathGroundTruth = {
      problemText: problemIR?.originalText || "MATH AI VIDEO STUDIO Smoke Test",
      domain: problemIR?.domain || "Algebra",
      formulas: solution?.pedagogicalSteps?.map((s: any) => s.mathExpression) || [
        "x^2 - 5x + 6 = 0",
        "(x-2)(x-3) = 0",
        "x = 2, x = 3",
      ],
      solutionRoots: solution?.finalAnswer || "x = 2, x = 3",
      visualType: visualSpec?.type || "algebraic_steps",
      geometrySpec: visualSpec?.elements?.filter((e: any) => e.type === "geometry_point" || e.type === "geometry_line"),
      graphSpec: visualSpec?.elements?.filter((e: any) => e.type === "function_plot"),
    };

    const prompt = `Bạn là Chuyên gia Kiểm định Thị giác Khung hình Video Toán học (VISUAL FRAME QA ENGINE) cho hệ thống MATH AI VIDEO STUDIO.
Hãy thực hiện kiểm tra chi tiết khung hình ${frameName}.png được đính kèm.

QUY TẮC NGUYÊN TẮC:
1. KHÔNG suy diễn chủ quan (ZERO INFERENCE).
2. Đối chiếu trực tiếp hình ảnh với Source of Truth toán học đã xác minh sau:
- Văn bản bài toán: ${JSON.stringify(mathGroundTruth.problemText)}
- Các công thức toán học chuẩn: ${JSON.stringify(mathGroundTruth.formulas)}
- Kết luận/nghiệm: ${JSON.stringify(mathGroundTruth.solutionRoots)}
- Loại hình ảnh: ${JSON.stringify(mathGroundTruth.visualType)}

HÃY KIỂM ĐỊNH CÁC TIÊU CHÍ SAU:
1. VISUAL QA:
- Chữ hoặc tiêu đề có bị cắt xén (clipped) không?
- Công thức toán LaTeX có bị cắt hoặc không đọc được không?
- Văn bản/chữ có bị chồng đè lên nhau (overlapping) không?
- Các đối tượng đồ họa có bị đè lên nhau bất hợp lý không?
- Khoảng cách lề an toàn (safe margin) có bị vi phạm không?
- Camera có cắt cụt nội dung quan trọng không?
- Ký hiệu toán/font chữ có bị lỗi render (ví dụ ký tự lạ, ô vuông, mất nét) không?
- Asset/hình ảnh có bị méo mó hoặc mất nét không?

2. MATH QA:
- Kiểm tra từng công thức, dấu phép tính (+, -, =), biến số, hệ số, nghiệm, tọa độ.
- Nếu công thức trên hình sai lệch so với Source of Truth: ghi lỗi MATH_ERROR.
- Nếu không đủ dữ liệu để khẳng định: đánh dấu NEED_SOURCE_VERIFICATION.

3. GEOMETRY QA (Nếu có hình học):
- Điểm, nhãn điểm, cạnh, đường nét đứt (đường khuất), song song, vuông góc, góc chiếu.

4. GRAPH QA (Nếu có đồ thị):
- Trục tọa độ, giao điểm, cực trị, tiệm cận, dáng điệu đường cong.

5. PHÂN LOẠI REPAIR CLASS:
- SAFE_AUTO_REPAIR: CHỈ cho vị trí, spacing, font size, camera center, camera width, timing, z-index, safe margin.
- REVIEW_REQUIRED: Cho dữ kiện toán, tọa độ, hình học, giá trị đồ thị, logic công thức, thêm/bớt điểm.

Hãy trả về JSON theo schema:
{
  "status": "PASS" | "FAIL" | "NEED_SOURCE_VERIFICATION",
  "issues": [
    {
      "category": "MATH_ERROR" | "GEOMETRY_ERROR" | "GRAPH_ERROR" | "LAYOUT_ERROR" | "CAMERA_ERROR" | "TEXT_ERROR" | "ASSET_ERROR",
      "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "description": "Mô tả cụ thể lỗi quan sát thấy trên frame",
      "affectedObject": "Tên đối tượng hoặc công thức bị ảnh hưởng",
      "evidence": "Vị trí hoặc bằng chứng trực quan",
      "repairClass": "SAFE_AUTO_REPAIR" | "REVIEW_REQUIRED"
    }
  ],
  "checks": {
    "textClipped": boolean,
    "formulaClipped": boolean,
    "formulaReadable": boolean,
    "textOverlap": boolean,
    "objectOverlap": boolean,
    "spacingSufficient": boolean,
    "safeMarginViolated": boolean,
    "cameraCropping": boolean,
    "fontRenderError": boolean,
    "assetDistorted": boolean,
    "mathAccurate": boolean,
    "geometryInvariantPreserved": boolean,
    "graphInvariantPreserved": boolean
  },
  "notes": "Nhận xét tổng quan về khung hình"
}`;

    const schemaDescription = `{
  "status": "PASS" | "FAIL" | "NEED_SOURCE_VERIFICATION",
  "issues": Array<{
    "category": "MATH_ERROR" | "GEOMETRY_ERROR" | "GRAPH_ERROR" | "LAYOUT_ERROR" | "CAMERA_ERROR" | "TEXT_ERROR" | "ASSET_ERROR",
    "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    "description": string,
    "affectedObject"?: string,
    "evidence"?: string,
    "repairClass": "SAFE_AUTO_REPAIR" | "REVIEW_REQUIRED"
  }>,
  "checks": {
    "textClipped": boolean,
    "formulaClipped": boolean,
    "formulaReadable": boolean,
    "textOverlap": boolean,
    "objectOverlap": boolean,
    "spacingSufficient": boolean,
    "safeMarginViolated": boolean,
    "cameraCropping": boolean,
    "fontRenderError": boolean,
    "assetDistorted": boolean,
    "mathAccurate": boolean,
    "geometryInvariantPreserved": boolean,
    "graphInvariantPreserved": boolean
  },
  "notes": string
}`;

    try {
      const parsed = await geminiProvider.generateStructuredJSON<any>(
        prompt,
        schemaDescription,
        {
          imagePart: {
            mimeType: frameSource.mimeType || "image/png",
            data: frameSource.base64,
          },
          temperature: 0.1,
        }
      );

      if (!parsed || !["PASS", "FAIL", "NEED_SOURCE_VERIFICATION"].includes(parsed.status) || !Array.isArray(parsed.issues) || !parsed.checks || typeof parsed.checks !== "object") {
        throw new TypeError("MALFORMED_ANALYZER_RESULT");
      }

      const normalizedIssues: FrameQAIssue[] = parsed.issues.map((iss: any) => this.normalizeIssue(iss));
      normalizedIssues.push(...this.issuesFromChecks(parsed.checks));

      let status: "PASS" | "FAIL" | "NEED_SOURCE_VERIFICATION" =
        parsed?.status === "FAIL" || normalizedIssues.some((i) => i.severity === "HIGH" || i.severity === "CRITICAL")
          ? "FAIL"
          : parsed.status === "NEED_SOURCE_VERIFICATION"
          ? "NEED_SOURCE_VERIFICATION"
          : "PASS";

      return {
        frameName,
        status,
        analysisCompleted: true,
        analysisStage: normalizedIssues.length > 0 ? "BOUNDS" : "COMPLETE",
        issues: normalizedIssues,
        base64Image: frameSource.base64,
        inputStatus: "PASS",
        inputMimeType: frameSource.mimeType,
        imageUrl: frameSource.url,
        checks: parsed.checks,
        notes: parsed?.notes || `Visual QA completed for ${frameName}.png`,
      };
    } catch (err: any) {
      console.error(`[VisualFrameQAService] Frame analysis failed for ${frameName}.`);
      return {
        frameName,
        status: "FAIL",
        analysisCompleted: false,
        analysisStage: "ANALYZER",
        issues: [{ category: "FRAME_INPUT_ERROR", severity: "CRITICAL", description: `Frame analysis failed for ${frameName}.`, affectedObject: frameName, evidence: "analyzer stage", repairClass: "INFRASTRUCTURE_ERROR" }],
        base64Image: frameSource.base64,
        inputStatus: "PASS",
        inputMimeType: frameSource.mimeType,
        imageUrl: frameSource.url,
        notes: "FRAME_ANALYSIS_ERROR",
      };
    }
  }

  private async safeEvaluateSingleFrame(frameName: "START" | "KEY" | "END", frameSource: FrameImageSource | undefined, context: any): Promise<FrameQAResult> {
    try {
      return await this.evaluateSingleFrame(frameName, frameSource, context);
    } catch {
      return { frameName, status: "FAIL", analysisCompleted: false, analysisStage: "ANALYZER", inputStatus: "PASS", issues: [{ category: "FRAME_INPUT_ERROR", severity: "CRITICAL", description: `Frame analyzer runtime failed for ${frameName}.`, affectedObject: frameName, evidence: "analyzer runtime stage", repairClass: "INFRASTRUCTURE_ERROR" }], notes: "FRAME_ANALYZER_RUNTIME_ERROR" };
    }
  }

  private issuesFromChecks(checks: Record<string, unknown>): FrameQAIssue[] {
    const issue = (category: FrameQAIssue["category"], description: string, affectedObject: string): FrameQAIssue => ({ category, severity: "HIGH", description, affectedObject, evidence: "deterministic analyzer bounds/check result", repairClass: category === "GEOMETRY_ERROR" ? "REVIEW_REQUIRED" : "SAFE_AUTO_REPAIR" });
    const issues: FrameQAIssue[] = [];
    if (checks.textClipped === true) issues.push(issue("TEXT_ERROR", "Text extends outside the visible frame bounds.", "Text"));
    if (checks.formulaClipped === true || checks.formulaReadable === false) issues.push(issue("TEXT_ERROR", "LaTeX extends outside the visible frame bounds or is unreadable.", "LaTeX"));
    if (checks.cameraCropping === true || checks.safeMarginViolated === true) issues.push(issue("CAMERA_ERROR", "Content exceeds the configured frame or safe margin.", "Frame bounds"));
    if (checks.geometryInvariantPreserved === false) issues.push(issue("GEOMETRY_ERROR", "Geometry is outside the inspected frame or violates its invariant.", "Geometry"));
    if (checks.textOverlap === true || checks.objectOverlap === true || checks.spacingSufficient === false) issues.push(issue("LAYOUT_ERROR", "Unrelated visual regions overlap or have insufficient spacing.", "Layout regions"));
    return issues;
  }

  private isValidImageSource(source?: FrameImageSource): boolean {
    if (!source?.base64 || !source.mimeType?.startsWith("image/")) return false;
    try {
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(source.base64) || source.base64.length % 4 !== 0) return false;
      const bytes = Buffer.from(source.base64, "base64");
      const png = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      return (source.mimeType === "image/png" && png) || ((source.mimeType === "image/jpeg" || source.mimeType === "image/jpg") && jpeg);
    } catch { return false; }
  }

  /**
   * Normalizes and guards issue classification rules (Rule 9)
   */
  private normalizeIssue(raw: any): FrameQAIssue {
    const validCategories = [
      "FRAME_INPUT_ERROR",
      "MATH_ERROR",
      "GEOMETRY_ERROR",
      "GRAPH_ERROR",
      "LAYOUT_ERROR",
      "CAMERA_ERROR",
      "TEXT_ERROR",
      "ASSET_ERROR",
    ];
    const category = validCategories.includes(raw.category) ? raw.category : "LAYOUT_ERROR";

    const validSeverities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const severity = validSeverities.includes(raw.severity) ? raw.severity : "MEDIUM";

    // Enforce Rule 9 classification boundaries strictly
    let repairClass: "SAFE_AUTO_REPAIR" | "REVIEW_REQUIRED" | "INFRASTRUCTURE_ERROR" = "REVIEW_REQUIRED";
    if (category === "FRAME_INPUT_ERROR") {
      repairClass = "INFRASTRUCTURE_ERROR";
    } else if (
      category === "MATH_ERROR" ||
      category === "GEOMETRY_ERROR" ||
      category === "GRAPH_ERROR"
    ) {
      repairClass = "REVIEW_REQUIRED";
    } else if (
      raw.repairClass === "SAFE_AUTO_REPAIR" ||
      category === "LAYOUT_ERROR" ||
      category === "CAMERA_ERROR"
    ) {
      repairClass = "SAFE_AUTO_REPAIR";
    }

    return {
      category,
      severity,
      description: raw.description || "Phát hiện vấn đề thị giác trên frame",
      affectedObject: raw.affectedObject,
      evidence: raw.evidence,
      repairClass,
    };
  }

  /**
   * Helper to download raw image bytes and return base64 string
   */
  private async downloadImage(
    url: string,
    headers: Record<string, string>
  ): Promise<{ base64: string; mimeType: string } | null> {
    try {
      const res = await fetch(url, { method: "GET", headers });
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.length === 0) return null;
      const mimeType = res.headers.get("content-type")?.split(";")[0] || "image/png";
      if (!mimeType.startsWith("image/")) return null;
      return { base64: buffer.toString("base64"), mimeType };
    } catch {
      return null;
    }
  }

  private resolveArtifactUrl(ref: string, bridgeUrl: string): string {
    const base = new URL(bridgeUrl);
    const resolved = new URL(ref, base);
    if (!['http:', 'https:'].includes(resolved.protocol) || resolved.origin !== base.origin || resolved.pathname.includes("..")) {
      throw new Error("Unsafe Local Bridge artifact reference");
    }
    return resolved.toString();
  }

  private createInputFailureResult(frameName: "START" | "KEY" | "END", source: FrameImageSource | undefined, inputStatus: Exclude<FrameInputStatus, "PASS">): FrameQAResult {
    return source?.base64 && inputStatus === "MISSING"
      ? { frameName, status: "FAIL", analysisCompleted: false, analysisStage: "INPUT", inputStatus: "PASS", inputMimeType: source.mimeType, base64Image: source.base64, imageUrl: source.url, issues: [], notes: "Visual Analysis = NOT_RUN" }
      : {
          frameName,
          status: "FAIL",
          analysisCompleted: false,
          analysisStage: "INPUT",
          inputStatus: "MISSING",
          issues: [{ category: "FRAME_INPUT_ERROR", severity: "CRITICAL", description: `${frameName}.png input is ${inputStatus.toLowerCase()}.`, affectedObject: frameName, evidence: "frame input validation", repairClass: "INFRASTRUCTURE_ERROR" }],
          notes: `Frame Input = ${inputStatus}; Visual Analysis = NOT_RUN`,
        };
  }

  private buildInputFailureReport(jobId: string, start: FrameQAResult, key: FrameQAResult, end: FrameQAResult, timestamp: string): JobVisualFrameQAReport {
    const issues = [...start.issues, ...key.issues, ...end.issues];
    return {
      jobId,
      overallStatus: "FAIL",
      frames: { start, key, end },
      summary: { totalIssues: issues.length, lowCount: 0, mediumCount: 0, highCount: 0, criticalCount: issues.length, mathErrors: 0, geometryErrors: 0, graphErrors: 0, layoutErrors: 0, cameraErrors: 0, textErrors: 0, assetErrors: 0 },
      qaMetrics: { frameInputQa: "FAIL", startFrameFetchQa: start.inputStatus === "PASS" ? "PASS" : "FAIL", keyFrameFetchQa: key.inputStatus === "PASS" ? "PASS" : "FAIL", endFrameFetchQa: end.inputStatus === "PASS" ? "PASS" : "FAIL", geminiVisionQa: "NOT_RUN", startVisualQa: "FAIL", keyVisualQa: "FAIL", endVisualQa: "FAIL", mathFrameQa: "PASS", geometryFrameQa: "NOT_APPLICABLE", graphFrameQa: "NOT_APPLICABLE", layoutFrameQa: "PASS", cameraFrameQa: "PASS", frameQa: "FAIL" },
      finalStatus: "QA_FAILED",
      timestamp,
    };
  }
}
