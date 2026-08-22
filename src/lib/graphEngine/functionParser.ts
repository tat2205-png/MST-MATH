/**
 * Function Parser & Syntax Normalizer
 * Extracts mathematical function expressions from user problems, equations, or LaTeX.
 */

export interface ParsedFunctionResult {
  success: boolean;
  rawInput: string;
  expression: string; // Clean normalized string for evaluator e.g. "2*x^2 - 5*x + 2"
  displayLatex: string; // Clean LaTeX string e.g. "y = 2x^2 - 5x + 2"
  variable: string;
  isEquationAssociated: boolean;
  associatedProblemNotice?: string;
  error?: string;
}

export class FunctionParser {
  /**
   * Main entry point to parse a problem text, equation, or explicit function.
   */
  public static parse(input: string): ParsedFunctionResult {
    if (!input || !input.trim()) {
      return {
        success: false,
        rawInput: input || "",
        expression: "",
        displayLatex: "",
        variable: "x",
        isEquationAssociated: false,
        error: "Chuỗi đầu vào rỗng (FUNCTION_NOT_FOUND)",
      };
    }

    const trimmed = input.trim();

    // 1. Check if input is an equation or problem text containing an equation
    let extractedExpr = trimmed;
    let isEquation = false;
    let associatedNotice: string | undefined = undefined;

    // Pattern for equations: LHS = RHS or LHS = 0
    // Look for "$...$" or "\\[...\\]" or raw math
    const latexMatch = trimmed.match(/\$([^$]+)\$/) || trimmed.match(/\\\[([\s\S]+?)\\\]/);
    if (latexMatch) {
      extractedExpr = latexMatch[1].trim();
    }

    // Remove leading problem prompt words (e.g. "Giải phương trình:", "Cho hàm số:", "Vẽ đồ thị:")
    extractedExpr = extractedExpr
      .replace(/^(Giải phương trình|Cho hàm số|Khảo sát hàm số|Tìm tập xác định|Vẽ đồ thị|Tính giá trị)\s*:\s*/i, "")
      .trim();

    // Check if there is an '=' sign
    if (extractedExpr.includes("=")) {
      const parts = extractedExpr.split("=");
      const lhs = parts[0].trim();
      const rhs = parts.slice(1).join("=").trim();

      // Case 1: y = f(x) or f(x) = ...
      if (/^(y|f\(x\)|g\(x\)|h\(x\)|y\(x\))$/i.test(lhs)) {
        extractedExpr = rhs;
      } else if (/^(y|f\(x\)|g\(x\)|h\(x\))$/i.test(rhs)) {
        extractedExpr = lhs;
      } else if (rhs === "0" || rhs === "0.0") {
        // Case 2: Equation f(x) = 0
        extractedExpr = lhs;
        isEquation = true;
      } else {
        // Case 3: f(x) = g(x) -> f(x) - (g(x)) = 0
        extractedExpr = `(${lhs}) - (${rhs})`;
        isEquation = true;
      }
    }

    // 2. Normalize LaTeX commands to standard ASCII math notation
    const normalized = FunctionParser.normalizeLatexToAscii(extractedExpr);

    if (!normalized || normalized.length === 0) {
      return {
        success: false,
        rawInput: input,
        expression: "",
        displayLatex: "",
        variable: "x",
        isEquationAssociated: false,
        error: "Không thể nhận diện biểu thức toán học (FUNCTION_PARSE_ERROR)",
      };
    }

    // 3. Build display LaTeX
    const displayLatex = FunctionParser.buildDisplayLatex(normalized);

    if (isEquation) {
      associatedNotice = `Đồ thị minh họa của hàm số liên quan: y = ${displayLatex.replace(/^y\s*=\s*/, "")} (tìm giao điểm với trục hoành y = 0)`;
    }

    return {
      success: true,
      rawInput: input,
      expression: normalized,
      displayLatex: `y = ${displayLatex.replace(/^y\s*=\s*/, "")}`,
      variable: "x",
      isEquationAssociated: isEquation,
      associatedProblemNotice: associatedNotice,
    };
  }

  /**
   * Convert LaTeX strings into evaluator-compatible expression
   */
  public static normalizeLatexToAscii(latex: string): string {
    let s = latex.trim();

    // Strip outer math delimiters
    s = s.replace(/^\$+|\$+$/g, "").trim();

    // Replace LaTeX fractions \frac{num}{den} or \dfrac{num}{den} recursively
    while (/\\(?:d)?frac\{([^{}]+)\}\{([^{}]+)\}/.test(s)) {
      s = s.replace(/\\(?:d)?frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)");
    }

    // Replace square roots \sqrt{arg} and nth roots \sqrt[n]{arg}
    s = s.replace(/\\sqrt\[([0-9]+)\]\{([^{}]+)\}/g, "($2)^(1/$1)");
    s = s.replace(/\\sqrt\{([^{}]+)\}/g, "sqrt($1)");
    s = s.replace(/\\sqrt\s*([a-zA-Z0-9]+)/g, "sqrt($1)");

    // Replace absolute value \left| ... \right| or | ... |
    s = s.replace(/\\left\|\s*([^\\]+?)\s*\\right\|/g, "abs($1)");
    s = s.replace(/\|([^|]+)\|/g, "abs($1)");

    // Replace LaTeX functions
    s = s.replace(/\\ln/g, "ln");
    s = s.replace(/\\log_([0-9]+)\{([^{}]+)\}/g, "log($2)/log($1)");
    s = s.replace(/\\log/g, "log");
    s = s.replace(/\\sin/g, "sin");
    s = s.replace(/\\cos/g, "cos");
    s = s.replace(/\\tan/g, "tan");
    s = s.replace(/\\exp/g, "exp");

    // Remove LaTeX sizing/styling markers
    s = s.replace(/\\left\(/g, "(");
    s = s.replace(/\\right\)/g, ")");
    s = s.replace(/\\left\[/g, "(");
    s = s.replace(/\\right\]/g, ")");
    s = s.replace(/\\left\{/g, "(");
    s = s.replace(/\\right\}/g, ")");
    s = s.replace(/\\cdot/g, "*");
    s = s.replace(/\\times/g, "*");
    s = s.replace(/\\,/g, "");
    s = s.replace(/\\;/g, "");
    s = s.replace(/\\!/g, "");
    s = s.replace(/\\text\{[^{}]*\}/g, "");
    s = s.replace(/\\mathrm\{([^{}]*)\}/g, "$1");

    // Replace power braces: x^{2} -> x^2, e^{2x} -> e^(2x)
    s = s.replace(/\^{([^{}]+)\}/g, "^($1)");

    // Normalize spacing and insert standard multiplication where needed
    s = s.replace(/\s+/g, "");

    // e^x handling
    s = s.replace(/\be\^/g, "e^");

    return s;
  }

  /**
   * Format normalized expression back to clean pedagogical LaTeX
   */
  public static buildDisplayLatex(expr: string): string {
    let l = expr;

    // Convert (A)/(B) to \frac{A}{B}
    l = l.replace(/\(([^()]+)\)\/\(([^()]+)\)/g, "\\frac{$1}{$2}");
    l = l.replace(/([a-zA-Z0-9^]+)\/\(([^()]+)\)/g, "\\frac{$1}{$2}");
    l = l.replace(/\(([^()]+)\)\/([a-zA-Z0-9^]+)/g, "\\frac{$1}{$2}");

    // Convert sqrt
    l = l.replace(/sqrt\(([^()]+)\)/g, "\\sqrt{$1}");
    l = l.replace(/abs\(([^()]+)\)/g, "\\left| $1 \\right|");

    // Convert * to implicit or cdot
    l = l.replace(/\*/g, "");

    // Convert powers
    l = l.replace(/\^([0-9a-zA-Z]+)/g, "^{$1}");

    return l;
  }
}
