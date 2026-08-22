import { MathProblemIR } from "../../src/types/mathSchema.js";
import crypto from "crypto";
import { getProvider } from "../providers/index.js";
import { buildSystemSkillInstruction } from "./skillContextBuilder.js";
import { resolveVideoTaskMode } from "./videoTaskResolver.js";
import { assertRuntimeValid, validateProblemIR } from "./mathRuntimeSchema.js";

export class ProblemParserService {
  async parseProblem(input: {
    text?: string;
    imageBase64?: string;
    mimeType?: string;
    sourceType?: "text" | "image" | "pdf" | "docx";
    providerId?: string;
  }): Promise<MathProblemIR> {
    const rawText = input.text || "";
    if (!rawText && !input.imageBase64) {
      throw new Error("EMPTY_INPUT: Vui lòng nhập nội dung đề bài hoặc tải ảnh/tài liệu.");
    }

    const provider = getProvider(input.providerId);

    const systemPrompt = `You are a strict, world-class high-school mathematics professor and LaTeX normalizer for the Vietnamese High School Curriculum (THPT Quốc Gia) and international mathematics.
Your mission is STEP 1: PROBLEM PARSER & LATEX NORMALIZER.

CRITICAL ZERO-INFERENCE RULES:
1. Extract the mathematical problem EXACTLY as stated without hallucinating or inventing any missing data.
2. For geometry problems: NEVER invent coordinates, unstated points, unstated angles, dimensions, or unstated geometric relationships (like assuming perpendicularity unless given).
3. If critical hypotheses, dimensions, or questions are missing or undecidable, set "status": "NEED_MORE_INFORMATION", list them in "ambiguities", and provide a clear "missing_information_prompt" in Vietnamese.
4. Convert all mathematical equations and formulas to standard, clean LaTeX (e.g. \\frac{a}{b}, 2x^2 - 5x + 2 = 0, \\sqrt{x}, \\perp, \\int, \\Delta).
5. Categorize domain, curriculum topic, and grade level accurately.
6. Return pure JSON conforming strictly to the requested schema.`;

    const schemaDescription = `{
  "problem": "full problem statement in Vietnamese with inline LaTeX formulas e.g. Cho phương trình $2x^2 - 5x + 2 = 0$.",
  "normalizedText": "Clean standard Vietnamese problem statement with inline LaTeX",
  "latex": "Primary standardized LaTeX formula or problem equation e.g. 2x^2 - 5x + 2 = 0",
  "given": ["list of explicit given conditions in LaTeX"],
  "find": ["list of explicit requirements or targets in LaTeX"],
  "domain": "Đại số & Giải tích | Hình học không gian | Hình học phẳng | Hình học tọa độ (Oxy/Oxyz) | Lượng giác | Tổ hợp - Xác suất | Thống kê | Bài toán tối ưu & Ứng dụng thực tế",
  "topic": "Curriculum topic e.g. Phương trình bậc hai, Khảo sát hàm số, Thể tích khối đa diện",
  "grade": "Lớp 10 | Lớp 11 | Lớp 12 | Ôn thi ĐGNL / THPT Quốc Gia",
  "entities": [
    {
      "id": "e1",
      "name": "x",
      "type": "variable | function | point | line | plane | polyhedron | set",
      "description": "Ẩn số thực cần tìm",
      "latex": "x"
    }
  ],
  "constraints": ["Điều kiện xác định e.g. x \\in \\mathbb{R}"],
  "ambiguities": ["List any ambiguities or missing assumptions, or empty array if clear"],
  "confidence": 0.98,
  "status": "PASS | NEED_MORE_INFORMATION | AMBIGUOUS | INCONSISTENT",
  "missing_information_prompt": "Thông báo chi tiết nếu thiếu dữ kiện, hoặc chuỗi rỗng"
}`;

    const promptText = rawText
      ? `Parse, normalize LaTeX, and extract MathProblemIR for this math problem:\n\n${rawText}`
      : `Parse and extract MathProblemIR from the provided image/document. Adhere strictly to the zero-inference rule for diagrams.`;

    let effectiveSystemPrompt = systemPrompt;
    const taskMode = resolveVideoTaskMode({ pipelineStage: "PARSE", domain: rawText }) || "MATH_SOLVE";
    try {
      const skillCtx = await buildSystemSkillInstruction({
        mode: taskMode,
        coreAppInstruction: systemPrompt,
      });
      effectiveSystemPrompt = skillCtx.systemInstruction;
    } catch (err: any) {
      console.warn(`[ProblemParserService] SkillContext fallback: ${err.message}`);
    }

    const options: any = {
      systemPrompt: effectiveSystemPrompt,
      temperature: 0.1,
    };

    if (input.imageBase64 && input.mimeType) {
      options.imagePart = {
        mimeType: input.mimeType,
        data: input.imageBase64,
      };
    }

    const parsed = await provider.generateStructuredJSON<MathProblemIR>(promptText, schemaDescription, options);
    assertRuntimeValid(validateProblemIR(parsed), "ProblemIR");
    
    // Ensure all required canonical fields exist
    parsed.problem_id = `prob_${Date.now()}`;
    parsed.originalText = rawText || undefined;
    parsed.normalizedText = parsed.normalizedText || parsed.problem;
    parsed.latex = parsed.latex || rawText;
    parsed.given = Array.isArray(parsed.given) ? parsed.given : [];
    parsed.find = Array.isArray(parsed.find) ? parsed.find : [];
    parsed.entities = Array.isArray(parsed.entities) ? parsed.entities : [];
    parsed.constraints = Array.isArray(parsed.constraints) ? parsed.constraints : [];
    parsed.ambiguities = Array.isArray(parsed.ambiguities) ? parsed.ambiguities : [];
    parsed.confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.95;
    parsed.status = parsed.status || (parsed.ambiguities.length > 0 ? "NEED_MORE_INFORMATION" : "PASS");
    parsed.input_source = input.sourceType || (input.imageBase64 ? "image" : "text");
    parsed.raw_input = rawText || undefined;
    parsed.sourceOriginal = rawText || undefined;
    parsed.sourceNormalized = parsed.normalizedText;
    parsed.providerExtraction = parsed.problem;
    const hash = (value: string) => crypto.createHash("sha256").update(value).digest("hex");
    parsed.sourceHash = rawText ? hash(rawText) : undefined;
    parsed.normalizedSourceHash = parsed.sourceNormalized ? hash(parsed.sourceNormalized) : undefined;
    const providerKind = rawText ? "SOURCE_LITERAL" : "SOURCE_EXTRACTED_UNVERIFIED";
    parsed.provenance = [{
      id: "source_problem",
      kind: providerKind,
      value: parsed.latex,
      sourceField: rawText ? "text" : "image/document",
      trustedForAutomation: Boolean(rawText),
    }];
    if (rawText) {
      const compactSource = rawText.toLowerCase().replace(/\s+/g, "");
      const compactLatex = parsed.latex.toLowerCase().replace(/\s+/g, "");
      if (!compactSource.includes(compactLatex)) {
        parsed.status = "AMBIGUOUS";
        parsed.ambiguities.push("SOURCE_MISMATCH: provider equation was not found in literal input.");
      }
    }

    return parsed;
  }
}

