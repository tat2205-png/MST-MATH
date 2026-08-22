import { MathProblemIR, MathSolution } from "../../src/types/mathSchema.js";
import { getProvider } from "../providers/index.js";
import { buildSystemSkillInstruction } from "./skillContextBuilder.js";
import { assertRuntimeValid, validateSolution } from "./mathRuntimeSchema.js";

export class SolutionGeneratorService {
  async generateSolution(problemIR: MathProblemIR, providerId?: string): Promise<MathSolution> {
    const provider = getProvider(providerId);

    const systemPrompt = `You are a master High-School Mathematics Teacher (Giáo viên dạy giỏi môn Toán THPT Việt Nam).
You solve the given mathematical problem with impeccable pedagogical rigor, clarity, and precision.

CRITICAL PEDAGOGICAL MANDATE:
Every solution MUST contain EXACTLY these 3 pedagogical sections:
1. PHÂN TÍCH ĐỀ (Bản chất bài toán, nhận diện dạng toán, các bẫy/sai lầm học sinh hay mắc phải, định lý/kiến thức trọng tâm).
2. HƯỚNG GIẢI (Sơ đồ chiến lược tư duy, lộ trình giải từng bước, các công thức then chốt cần áp dụng).
3. LỜI GIẢI CHI TIẾT (Trình bày chuẩn mực bài thi tự luận, từng bước biến đổi toán học đầy đủ tường minh kèm giải thích, tuyệt đối không nhảy cóc).

Plus:
- KẾT LUẬN & final_answer: exact final simplified roots/values, clean LaTeX, and summary conclusion.
- teacher_tips: practical advice for students to avoid mistakes.`;

    const schemaDescription = `{
  "section_1_analysis": {
    "problem_essence": "Bản chất bài toán và dạng toán trọng tâm...",
    "identified_pattern": "Dạng toán đặc trưng và dấu hiệu nhận biết...",
    "pitfalls_and_traps": ["Bẫy điều kiện xác định", "Bẫy nghiệm ngoại lai", "Bẫy biến đổi sai dấu"],
    "core_theorems": ["Công thức nghiệm phương trình bậc hai / Biệt thức Delta", "Định lý Vi-et"]
  },
  "section_2_approach": {
    "strategy_overview": "Tổng quan phương pháp tiếp cận tối ưu nhất...",
    "roadmap_steps": [
      "Bước 1: Xác định hệ số a, b, c và tính biệt thức Delta...",
      "Bước 2: Tìm các nghiệm của phương trình theo công thức...",
      "Bước 3: Đối chiếu điều kiện và kết luận tập nghiệm."
    ],
    "formulas_needed": ["\\Delta = b^2 - 4ac", "x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}"]
  },
  "section_3_detailed_steps": [
    {
      "step_number": 1,
      "title": "Xác định hệ số và tính biệt thức Delta",
      "explanation": "Phương trình $2x^2 - 5x + 2 = 0$ có các hệ số $a = 2, b = -5, c = 2$. Biệt thức $\\Delta = (-5)^2 - 4(2)(2) = 25 - 16 = 9 > 0$.",
      "math_latex": "\\Delta = b^2 - 4ac = (-5)^2 - 4 \\cdot 2 \\cdot 2 = 25 - 16 = 9",
      "pedagogical_notes": "Vì $\\Delta > 0$ nên phương trình có hai nghiệm phân biệt.",
      "key_theorems_used": ["Công thức tính biệt thức Delta"]
    },
    {
      "step_number": 2,
      "title": "Tính nghiệm của phương trình",
      "explanation": "Áp dụng công thức nghiệm, ta tìm được hai nghiệm phân biệt $x_1$ và $x_2$.",
      "math_latex": "x_1 = \\frac{5 + \\sqrt{9}}{4} = 2, \\quad x_2 = \\frac{5 - \\sqrt{9}}{4} = \\frac{1}{2}",
      "pedagogical_notes": "Cần rút gọn phân số tối giản.",
      "key_theorems_used": ["Công thức nghiệm phương trình bậc hai"]
    }
  ],
  "final_answer": {
    "value": "x = 2 hoặc x = \\frac{1}{2}",
    "latex": "x \\in \\left\\{ \\frac{1}{2}; 2 \\right\\}",
    "summary_text": "Vậy tập nghiệm của phương trình là S = {1/2; 2}."
  },
  "verification_data": {
    "roots": ["2", "1/2"],
    "domain": "\\mathbb{R}",
    "solutionSet": {
      "intervals": [
        { "left": "-INF", "right": "2", "leftClosed": false, "rightClosed": true }
      ]
    }
  },
  "teacher_tips": [
    "Có thể nhẩm nghiệm hoặc tách hạng tử: 2x^2 - 4x - x + 2 = 2x(x - 2) - (x - 2) = (2x - 1)(x - 2) = 0.",
    "Kiểm tra lại bằng máy tính cầm tay hoặc định lý Vi-et: x1 + x2 = 5/2, x1*x2 = 1."
  ]
}`;

    const constraintsStr = Array.isArray(problemIR.constraints)
      ? problemIR.constraints.map((c) => (typeof c === "string" ? c : c.expression)).join(", ")
      : "";

    const prompt = `Solve this high-school math problem following the 3 pedagogical sections strictly:
PROBLEM:
${problemIR.problem}

GIVEN:
${problemIR.given?.join("\n") || "Không có giả thiết phụ"}

FIND:
${problemIR.find?.join("\n") || "Giải bài toán"}

DOMAIN: ${problemIR.domain || "Đại số & Giải tích"}
TOPIC: ${problemIR.topic || "Toán THPT"}
GRADE: ${problemIR.grade || "Lớp 12"}
CONSTRAINTS: ${constraintsStr || "None"}`;

    let effectiveSystemPrompt = systemPrompt;
    try {
      const skillCtx = await buildSystemSkillInstruction({
        mode: "MATH_SOLVE",
        coreAppInstruction: systemPrompt,
      });
      effectiveSystemPrompt = skillCtx.systemInstruction;
    } catch (err: any) {
      console.warn(`[SolutionGeneratorService] SkillContext fallback: ${err.message}`);
    }

    const solution = await provider.generateStructuredJSON<MathSolution>(prompt, schemaDescription, {
      systemPrompt: effectiveSystemPrompt,
      temperature: 0.1,
    });
    assertRuntimeValid(validateSolution(solution), "Solution");
    return solution;
  }
}

