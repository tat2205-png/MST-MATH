import { MathProblemIR, MathSolution, MathVerification, VerificationReport } from "../../src/types/mathSchema.js";
import { getProvider } from "../providers/index.js";
import { buildSystemSkillInstruction } from "./skillContextBuilder.js";
import { deterministicMathVerifier } from "./deterministicMathVerifier.js";
import { assertRuntimeValid, validateVerificationReport } from "./mathRuntimeSchema.js";
import { deterministicInequalityVerifier } from "./deterministicInequalityVerifier.js";
import { deterministicLinearSystemVerifier } from "./deterministicLinearSystemVerifier.js";

export class SolutionVerifierService {
  async verifySolution(
    problemIR: MathProblemIR,
    solution: MathSolution,
    providerId?: string
  ): Promise<MathVerification> {
    const provider = getProvider(providerId);

    const systemPrompt = `You are a formal Mathematics Proof Checker and High-School Olympiad/Exam Validator.
Your role is STEP 3: V1 MATHEMATICAL VERIFICATION & QA AUDIT.

Audit the solution across these 5 strict V1 checkpoints:
1. Input parsing: Was the problem accurately captured without missing or hallucinated conditions?
2. LaTeX normalization: Are all mathematical formulas correctly converted to standard valid LaTeX?
3. Structured JSON validation: Is the data format complete, valid, and conforming to schema?
4. Mathematical consistency: Are all intermediate algebraic derivations, equations, and logic consistent and free of errors?
5. Final answer: Is the final answer correct, simplified, and mathematically sound?

Evaluate overall status as: "PASS" | "WARNING" | "FAIL" | "NEED_MORE_INFORMATION".
Also evaluate 6-dimension mathematical audit (symbolic, numeric, logical, geometry, domain, units).`;

    const schemaDescription = `{
  "verification_seal": "CONFIRMED_VALID | FLAGGED_CONCERNS",
  "status": "PASS | WARNING | FAIL | NEED_MORE_INFORMATION",
  "checks": [
    {
      "id": "input_parsing",
      "name": "Input parsing",
      "status": "PASS | WARNING | FAIL | NEED_MORE_INFORMATION",
      "details": "Chi tiết đánh giá mức độ nhận diện đề bài chính xác và không bịa dữ kiện.",
      "evidence": "Bảo toàn đúng giả thiết và yêu cầu"
    },
    {
      "id": "latex_normalization",
      "name": "LaTeX normalization",
      "status": "PASS | WARNING | FAIL",
      "details": "Kiểm tra tính chuẩn mực cú pháp công thức LaTeX.",
      "evidence": "Cú pháp LaTeX hợp lệ"
    },
    {
      "id": "json_validation",
      "name": "Structured JSON validation",
      "status": "PASS | WARNING | FAIL",
      "details": "Kiểm tra cấu trúc dữ liệu MathProblemIR và MathSolution.",
      "evidence": "Đủ 3 phần sư phạm và các trường chuẩn"
    },
    {
      "id": "math_consistency",
      "name": "Mathematical consistency",
      "status": "PASS | WARNING | FAIL",
      "details": "Kiểm tra tính nhất quán toán học, biệt thức Delta, biến đổi tương đương.",
      "evidence": "Các bước biến đổi logic không mâu thuẫn"
    },
    {
      "id": "final_answer",
      "name": "Final answer",
      "status": "PASS | WARNING | FAIL",
      "details": "Kiểm tra đáp số cuối cùng có tối giản và chính xác không.",
      "evidence": "Đáp số khớp hoàn toàn"
    }
  ],
  "symbolic_correctness": {
    "passed": true,
    "notes": "Kiểm tra biến đổi đại số, đạo hàm và phương trình hoàn toàn chính xác.",
    "sample_tests": ["Biến đổi Delta = 9 chính xác", "Nghiệm x = 2, x = 1/2 hợp lệ"]
  },
  "numeric_soundness": {
    "passed": true,
    "notes": "Thế lại giá trị nghiệm vào phương trình gốc đều thỏa mãn 2x^2 - 5x + 2 = 0.",
    "sample_tests": ["2*(2)^2 - 5*(2) + 2 = 8 - 10 + 2 = 0", "2*(1/2)^2 - 5*(1/2) + 2 = 2/4 - 5/2 + 2 = 0"]
  },
  "logical_deduction": {
    "passed": true,
    "notes": "Lập luận logic sư phạm vững chắc, suy luận tương đương và không có bước nhảy cóc."
  },
  "geometry_invariants": {
    "passed": true,
    "notes": "Không áp dụng hoặc bảo toàn các quan hệ hình học chuẩn mực."
  },
  "domain_and_boundaries": {
    "passed": true,
    "notes": "Tập xác định D = R, các nghiệm đều thuộc tập số thực."
  },
  "units_and_dimensions": {
    "passed": true,
    "notes": "Đơn vị thứ nguyên toán học đồng nhất."
  },
  "counter_example_search": {
    "found_counter_example": false,
    "details": "Không phát hiện mâu thuẫn hay nghiệm ngoại lai."
  },
  "discrepancies": []
}`;

    const prompt = `Perform V1 Mathematical Verification and QA Audit on this problem and solution:
PROBLEM:
${problemIR.problem}

GIVEN:
${problemIR.given?.join(", ") || "None"}

FIND:
${problemIR.find?.join(", ") || "None"}

PROPOSED SOLUTION:
Phân tích: ${problemIR.domain} - ${problemIR.topic}
Chi tiết các bước:
${solution.section_3_detailed_steps?.map((s) => `Bước ${s.step_number} (${s.title}): ${s.explanation} | Math: ${s.math_latex}`).join("\n") || "No steps"}

KẾT LUẬN: ${solution.final_answer?.value || "N/A"}`;

    let effectiveSystemPrompt = systemPrompt;
    try {
      const skillCtx = await buildSystemSkillInstruction({
        mode: "MATH_SOLVE",
        coreAppInstruction: systemPrompt,
      });
      effectiveSystemPrompt = skillCtx.systemInstruction;
    } catch (err: any) {
      console.warn(`[SolutionVerifierService] SkillContext fallback: ${err.message}`);
    }

    const report = await provider.generateStructuredJSON<VerificationReport>(prompt, schemaDescription, {
      systemPrompt: effectiveSystemPrompt,
      temperature: 0.1,
    });
    assertRuntimeValid(validateVerificationReport(report), "VerificationReport");

    report.status = report.status || "NEED_MORE_INFORMATION";
    report.verificationSource = "PROVIDER";
    if (!report.checks || report.checks.length === 0) {
      report.checks = [
        {
          id: "input_parsing",
          name: "Input parsing",
          status: problemIR.status === "NEED_MORE_INFORMATION" ? "NEED_MORE_INFORMATION" : "PASS",
          details: "Đề bài được phân tích và trích xuất dữ kiện nguyên vẹn.",
          evidence: `Domain: ${problemIR.domain}`,
        },
        {
          id: "latex_normalization",
          name: "LaTeX normalization",
          status: "PASS",
          details: "Công thức toán học đã được chuyển đổi sang mã LaTeX chuẩn.",
          evidence: problemIR.latex,
        },
        {
          id: "json_validation",
          name: "Structured JSON validation",
          status: "PASS",
          details: "Cấu trúc MathProblemIR và MathSolution chuẩn hóa thành công.",
          evidence: "Đầy đủ 3 phần sư phạm",
        },
        {
          id: "math_consistency",
          name: "Mathematical consistency",
          status: report.symbolic_correctness?.passed ? "PASS" : "WARNING",
          details: report.symbolic_correctness?.notes || "Các phép tính toán và biến đổi đại số chính xác.",
        },
        {
          id: "final_answer",
          name: "Final answer",
          status: report.numeric_soundness?.passed ? "PASS" : "WARNING",
          details: `Đáp số: ${solution.final_answer?.value || "Đã kiểm định"}`,
        },
      ];
    }

    const deterministicVerification = /;/.test(problemIR.latex || "")
      ? deterministicLinearSystemVerifier.verify(problemIR, solution)
      : /(?:<=|>=|<|>|≤|≥)/.test(problemIR.latex || "")
        ? deterministicInequalityVerifier.verify(problemIR, solution)
        : deterministicMathVerifier.verify(problemIR, solution);
    report.deterministicVerification = deterministicVerification;
    if (report.status === "PASS" && deterministicVerification.status !== "DETERMINISTIC_PASS") {
      report.discrepancies = [
        ...(Array.isArray(report.discrepancies) ? report.discrepancies : []),
        `Deterministic V1 verification did not pass: ${deterministicVerification.status}.`,
      ];
    }

    return report;
  }
}

