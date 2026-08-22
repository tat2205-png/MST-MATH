import {
  MathProblemIR,
  MathSolution,
  MathVerification,
  VideoSpecification,
  VisualSpecification,
} from "../../src/types/mathSchema.js";

export class ExportService {
  generateStandaloneTeX(
    problemIR: MathProblemIR,
    solution: MathSolution,
    visualSpec?: VisualSpecification | null,
    verification?: MathVerification | null
  ): string {
    const dateStr = new Date().toLocaleDateString("vi-VN");
    
    return `% ====================================================================
% MATH AI VIDEO STUDIO - High-School Mathematics Document
% Generated on: ${dateStr}
% Domain: ${problemIR.domain} | Topic: ${problemIR.topic} | Grade: ${problemIR.grade}
% ====================================================================
\\documentclass[12pt,a4paper]{article}

% --- Essential Packages ---
\\usepackage[utf8]{inputenc}
\\usepackage[vietnamese]{babel}
\\usepackage[T5]{fontenc}
\\usepackage{amsmath,amssymb,amsfonts,amsthm}
\\usepackage{geometry}
\\geometry{a4paper, total={170mm,257mm}, left=20mm, top=20mm, right=20mm, bottom=20mm}
\\usepackage{tikz}
\\usepackage{tkz-euclide}
\\usepackage{tcolorbox}
\\tcbuselibrary{skins,breakable}
\\usepackage{enumitem}
\\usepackage{hyperref}

% --- Custom Colors and Box Styles ---
\\definecolor{mathprimary}{RGB}{30, 58, 138}
\\definecolor{mathaccent}{RGB}{13, 148, 136}
\\definecolor{mathbg}{RGB}{248, 250, 252}

\\newtcolorbox{pedabox}[2][]{
  colback=mathbg,
  colframe=mathprimary,
  fonttitle=\\bfseries,
  title=#2,
  arc=3mm,
  breakable,
  #1
}

\\newtcolorbox{answerbox}{
  colback=yellow!10!white,
  colframe=orange!80!black,
  fonttitle=\\bfseries,
  title=KẾT LUẬN VÀ ĐÁP SỐ,
  arc=2mm
}

\\begin{document}

\\begin{center}
  {\\Large\\bfseries BÀI TOÁN VÀ LỜI GIẢI SƯ PHẠM CHUẨN MỰC}\\\\[4pt]
  {\\normalsize\\color{mathprimary} Chủ đề: ${problemIR.topic} (${problemIR.domain} - ${problemIR.grade})}\\\\[2pt]
  {\\footnotesize\\color{gray} Được biên soạn tự động bởi MATH AI VIDEO STUDIO}
\\end{center}

\\vspace{0.5cm}

% --- ĐỀ BÀI ---
\\begin{tcolorbox}[colback=blue!5!white, colframe=blue!75!black, title=\\textbf{ĐỀ BÀI CHUẨN HÓA}]
${problemIR.problem}

\\vspace{0.2cm}
\\textbf{Giả thiết ($GT$):}
\\begin{itemize}[noitemsep]
${problemIR.given.map((g) => `  \\item ${g}`).join("\n")}
\\end{itemize}

\\textbf{Yêu cầu ($KL$):}
\\begin{itemize}[noitemsep]
${problemIR.find.map((f) => `  \\item ${f}`).join("\n")}
\\end{itemize}
\\end{tcolorbox}

\\vspace{0.5cm}

% --- PHẦN 1: PHÂN TÍCH ĐỀ ---
\\begin{pedabox}{PHẦN 1: PHÂN TÍCH ĐỀ VÀ NHẬN DẠNG}
\\textbf{1. Bản chất bài toán:} ${solution.section_1_analysis.problem_essence}

\\vspace{0.2cm}
\\textbf{2. Dạng toán và phương pháp:} ${solution.section_1_analysis.identified_pattern}

\\vspace{0.2cm}
\\textbf{3. Các lỗi sai và cạm bẫy thường gặp:}
\\begin{itemize}[noitemsep]
${solution.section_1_analysis.pitfalls_and_traps.map((p) => `  \\item ${p}`).join("\n")}
\\end{itemize}

\\vspace{0.2cm}
\\textbf{4. Định lý trọng tâm:}
\\begin{itemize}[noitemsep]
${solution.section_1_analysis.core_theorems.map((t) => `  \\item ${t}`).join("\n")}
\\end{itemize}
\\end{pedabox}

\\vspace{0.4cm}

% --- PHẦN 2: HƯỚNG GIẢI ---
\\begin{pedabox}{PHẦN 2: HƯỚNG GIẢI VÀ CHIẾN LƯỢC}
\\textbf{Chiến lược tiếp cận:} ${solution.section_2_approach.strategy_overview}

\\vspace{0.2cm}
\\textbf{Lộ trình các bước giải quyết:}
\\begin{enumerate}[noitemsep]
${solution.section_2_approach.roadmap_steps.map((s) => `  \\item ${s}`).join("\n")}
\\end{enumerate}

\\vspace{0.2cm}
\\textbf{Công thức áp dụng:}
\\[
${solution.section_2_approach.formulas_needed.join(" \\qquad ")}
\\]
\\end{pedabox}

\\vspace{0.4cm}

% --- PHẦN 3: LỜI GIẢI CHI TIẾT ---
\\begin{pedabox}{PHẦN 3: LỜI GIẢI CHI TIẾT TỪNG BƯỚC}
${solution.section_3_detailed_steps
  .map(
    (step) => `\\textbf{Bước ${step.step_number}: ${step.title}}\\\\
${step.explanation}
\\[
${step.math_latex}
\\]
${step.pedagogical_notes ? `{\\small\\textit{Ghi chú sư phạm: ${step.pedagogical_notes}}}\\\\` : ""}`
  )
  .join("\n\\vspace{0.3cm}\n")}
\\end{pedabox}

\\vspace{0.4cm}

% --- ĐÁP SỐ CUỐI CÙNG ---
\\begin{answerbox}
\\textbf{Đáp số:} \\[ ${solution.final_answer.latex || solution.final_answer.value} \\]
${solution.final_answer.summary_text}
\\end{answerbox}

${
  visualSpec?.tikz_code
    ? `
\\vspace{0.5cm}
\\begin{center}
\\textbf{Hình vẽ minh họa (TikZ):}\\\\[4pt]
${visualSpec.tikz_code}
\\end{center}
`
    : ""
}

\\end{document}
`;
  }
}
