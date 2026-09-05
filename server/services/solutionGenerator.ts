import { MathProblemIR, MathSolution } from "../../src/types/mathSchema.js";
import { getProvider } from "../providers/index.js";
import { buildSystemSkillInstruction } from "./skillContextBuilder.js";
import { assertRuntimeValid, validateSolution } from "./mathRuntimeSchema.js";

export const UNKNOWN_CURRICULUM_CONTEXT = "UNKNOWN — cần xác minh, không được tự suy diễn";

export const GENERIC_SOLUTION_SCHEMA_DESCRIPTION = `{
  "section_1_analysis": {
    "problem_essence": "Nêu bản chất toán học dựa trực tiếp trên dữ kiện nguồn...",
    "identified_pattern": "Chỉ nhận diện dạng toán khi có đủ bằng chứng từ đề bài...",
    "pitfalls_and_traps": ["Các điều kiện hoặc sai lầm thực sự liên quan tới bài toán đang xét"],
    "core_theorems": ["Chỉ liệt kê định lý/công thức phù hợp trực tiếp với bài toán và chương trình đã xác minh"]
  },
  "section_2_approach": {
    "strategy_overview": "Mô tả chiến lược giải phù hợp với dữ kiện hiện tại...",
    "roadmap_steps": [
      "Bước 1: Xử lý dữ kiện hoặc điều kiện đầu tiên cần thiết...",
      "Bước 2: Thực hiện suy luận/toán học tiếp theo có căn cứ...",
      "Bước 3: Kiểm tra điều kiện và kết luận."
    ],
    "formulas_needed": ["Chỉ đưa công thức thực sự dùng trong lời giải"]
  },
  "section_3_detailed_steps": [
    {
      "step_number": 1,
      "title": "Tên bước phù hợp với bài toán",
      "explanation": "Giải thích tường minh dựa trên dữ kiện nguồn và kết quả đã suy ra.",
      "math_latex": "Biểu thức LaTeX tương ứng với chính bước này",
      "pedagogical_notes": "Ghi chú sư phạm nếu cần",
      "key_theorems_used": ["Định lý/công thức thực sự được sử dụng"]
    }
  ],
  "final_answer": {
    "value": "Kết quả cuối cùng đúng với bài toán",
    "latex": "Biểu thức LaTeX của kết quả",
    "summary_text": "Kết luận ngắn gọn"
  },
  "verification_data": {},
  "teacher_tips": ["Lời khuyên gắn trực tiếp với bài toán hiện tại"]
}`;

export function curriculumContext(problemIR: MathProblemIR) {
  return {
    domain: problemIR.domain || UNKNOWN_CURRICULUM_CONTEXT,
    topic: problemIR.topic || UNKNOWN_CURRICULUM_CONTEXT,
    grade: problemIR.grade || UNKNOWN_CURRICULUM_CONTEXT,
  };
}

export function buildSolutionPrompt(problemIR: MathProblemIR): string {
  const constraintsStr = Array.isArray(problemIR.constraints)
    ? problemIR.constraints.map((constraint) => (typeof constraint === "string" ? constraint : constraint.expression)).join(", ")
    : "";
  const context = curriculumContext(problemIR);

  return `Solve this high-school math problem following the 3 pedagogical sections strictly:
PROBLEM:
${problemIR.problem}

GIVEN:
${problemIR.given?.join("\n") || "Không có giả thiết phụ"}

FIND:
${problemIR.find?.join("\n") || "Giải bài toán"}

DOMAIN: ${context.domain}
TOPIC: ${context.topic}
GRADE: ${context.grade}
CONSTRAINTS: ${constraintsStr || "None"}

FAIL-CLOSED CURRICULUM RULE:
If DOMAIN, TOPIC, or GRADE is UNKNOWN, do not invent or default a curriculum classification. Solve only from the mathematical source and mark curriculum-dependent pedagogical claims as requiring review.`;
}

export class SolutionGeneratorService {
  async generateSolution(problemIR: MathProblemIR, providerId?: string): Promise<MathSolution> {
    const provider = getProvider(providerId);

    const systemPrompt = `You are a master High-School Mathematics Teacher (Giáo viên dạy giỏi môn Toán THPT Việt Nam).
You solve the given mathematical problem with impeccable pedagogical rigor, clarity, and precision.

CRITICAL PEDAGOGICAL MANDATE:
Every solution MUST contain EXACTLY these 3 pedagogical sections:
1. PHÂN TÍCH ĐỀ (Bản chất bài toán, nhận diện dạng toán khi đủ bằng chứng, các bẫy/sai lầm học sinh hay mắc phải, định lý/kiến thức trọng tâm).
2. HƯỚNG GIẢI (Sơ đồ chiến lược tư duy, lộ trình giải từng bước, các công thức then chốt thực sự cần áp dụng).
3. LỜI GIẢI CHI TIẾT (Trình bày chuẩn mực bài thi tự luận, từng bước biến đổi toán học đầy đủ tường minh kèm giải thích, tuyệt đối không nhảy cóc).

Plus:
- KẾT LUẬN & final_answer: exact final result, clean LaTeX, and summary conclusion.
- teacher_tips: practical advice for students to avoid mistakes.

AUTHORITY RULES:
- Do not infer grade, curriculum domain, topic, geometry, or real-world facts that are not supported by the source.
- UNKNOWN curriculum metadata stays UNKNOWN and must not be silently replaced by Grade 12 or a default algebra domain.
- Do not import a method, formula family, or worked example from an unrelated problem merely because it appears in a schema example.`;

    const prompt = buildSolutionPrompt(problemIR);

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

    const solution = await provider.generateStructuredJSON<MathSolution>(prompt, GENERIC_SOLUTION_SCHEMA_DESCRIPTION, {
      systemPrompt: effectiveSystemPrompt,
      temperature: 0.1,
    });
    assertRuntimeValid(validateSolution(solution), "Solution");
    return solution;
  }
}
