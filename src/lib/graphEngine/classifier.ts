/**
 * Function Classifier & Canonical Form Analyzer
 * Identifies function families and extracts exact symbolic parameters where applicable.
 */

import { GraphType } from "../../types/graphSchema.js";

export interface ClassifiedFunction {
  type: GraphType;
  confidence: number;
  parameters?: Record<string, number>;
  description: string;
}

export class FunctionClassifier {
  /**
   * Classifies an expression string.
   */
  public static classify(expr: string): ClassifiedFunction {
    const clean = expr.replace(/\s+/g, "").toLowerCase();

    // 1. Absolute value: contains abs(...) or |...|
    if (clean.includes("abs(") || /\|[^|]+\|/.test(clean)) {
      // Check if it's a simple linear absolute value |ax + b| + c
      const absMatch = clean.match(/abs\(([a-z0-9\+\-\*\^]+)\)/i);
      return {
        type: "absolute_value",
        confidence: 1.0,
        description: "Hàm số chứa dấu giá trị tuyệt đối",
      };
    }

    // 2. Radical (Square root / nth root)
    if (clean.includes("sqrt(") || clean.includes("^(1/2)") || clean.includes("^(0.5)")) {
      return {
        type: "radical",
        confidence: 1.0,
        description: "Hàm số chứa căn thức",
      };
    }

    // 3. Logarithmic
    if (clean.includes("ln(") || clean.includes("log(") || clean.includes("log10(") || clean.includes("log2(")) {
      return {
        type: "logarithmic",
        confidence: 1.0,
        description: "Hàm số logarit",
      };
    }

    // 4. Trigonometric
    if (clean.includes("sin(") || clean.includes("cos(") || clean.includes("tan(")) {
      return {
        type: "trigonometric",
        confidence: 1.0,
        description: "Hàm số lượng giác",
      };
    }

    // 5. Exponential (e.g. 2^x, e^x, 3^(x+1))
    if (/(?:[0-9]+|e)\^\(?x/i.test(clean) || clean.includes("exp(")) {
      return {
        type: "exponential",
        confidence: 1.0,
        description: "Hàm số mũ",
      };
    }

    // 6. Rational (e.g. (x+1)/(x-2) or contains '/')
    if (clean.includes("/")) {
      return {
        type: "rational",
        confidence: 1.0,
        description: "Hàm số phân thức hữu tỉ",
      };
    }

    // 7. Polynomials: Cubic, Quadratic, Linear, or General Polynomial
    if (clean.includes("x^3") || clean.includes("x*x*x")) {
      const quadParams = this.extractCubicParams(clean);
      return {
        type: "cubic",
        confidence: 1.0,
        parameters: quadParams,
        description: "Hàm số bậc ba y = ax³ + bx² + cx + d",
      };
    }

    if (clean.includes("x^2") || clean.includes("x*x")) {
      const quadParams = this.extractQuadraticParams(clean);
      return {
        type: "quadratic",
        confidence: 1.0,
        parameters: quadParams,
        description: "Hàm số bậc hai (Parabol) y = ax² + bx + c",
      };
    }

    if (clean.includes("x^4")) {
      return {
        type: "polynomial",
        confidence: 1.0,
        description: "Hàm số đa thức bậc bốn",
      };
    }

    if (clean.includes("x")) {
      const linParams = this.extractLinearParams(clean);
      return {
        type: "linear",
        confidence: 1.0,
        parameters: linParams,
        description: "Hàm số bậc nhất (Đường thẳng) y = ax + b",
      };
    }

    return {
      type: "unsupported",
      confidence: 0.2,
      description: "Hàm số chưa được phân loại hoặc không hỗ trợ",
    };
  }

  /**
   * Extracts a, b, c for quadratic y = ax^2 + bx + c
   */
  public static extractQuadraticParams(expr: string): { a: number; b: number; c: number } {
    let a = 0;
    let b = 0;
    let c = 0;

    // Normalize: e.g. 2*x^2 - 5*x + 2 or 2x^2 - 5x + 2
    let s = expr.replace(/\s+/g, "").replace(/\*/g, "");

    // Regex for ax^2
    const aMatch = s.match(/([+-]?[0-9]*\.?[0-9]*)x\^2/);
    if (aMatch) {
      const coeff = aMatch[1];
      if (coeff === "" || coeff === "+") a = 1;
      else if (coeff === "-") a = -1;
      else a = parseFloat(coeff);

      // Remove ax^2 part
      s = s.replace(aMatch[0], "");
    }

    // Regex for bx
    const bMatch = s.match(/([+-]?[0-9]*\.?[0-9]*)x(?!\^)/);
    if (bMatch) {
      const coeff = bMatch[1];
      if (coeff === "" || coeff === "+") b = 1;
      else if (coeff === "-") b = -1;
      else b = parseFloat(coeff);

      s = s.replace(bMatch[0], "");
    }

    // Remaining constant c
    const cMatch = s.match(/^[+-]?[0-9]+\.?[0-9]*/);
    if (cMatch) {
      c = parseFloat(cMatch[0]);
    }

    return { a, b, c };
  }

  /**
   * Extracts a, b for linear y = ax + b
   */
  public static extractLinearParams(expr: string): { a: number; b: number } {
    let a = 0;
    let b = 0;

    let s = expr.replace(/\s+/g, "").replace(/\*/g, "");
    const aMatch = s.match(/([+-]?[0-9]*\.?[0-9]*)x(?!\^)/);
    if (aMatch) {
      const coeff = aMatch[1];
      if (coeff === "" || coeff === "+") a = 1;
      else if (coeff === "-") a = -1;
      else a = parseFloat(coeff);

      s = s.replace(aMatch[0], "");
    }

    const bMatch = s.match(/^[+-]?[0-9]+\.?[0-9]*/);
    if (bMatch) {
      b = parseFloat(bMatch[0]);
    }

    return { a, b };
  }

  /**
   * Extracts a, b, c, d for cubic y = ax^3 + bx^2 + cx + d
   */
  public static extractCubicParams(expr: string): { a: number; b: number; c: number; d: number } {
    let a = 0, b = 0, c = 0, d = 0;
    let s = expr.replace(/\s+/g, "").replace(/\*/g, "");

    const aMatch = s.match(/([+-]?[0-9]*\.?[0-9]*)x\^3/);
    if (aMatch) {
      const coeff = aMatch[1];
      a = coeff === "" || coeff === "+" ? 1 : coeff === "-" ? -1 : parseFloat(coeff);
      s = s.replace(aMatch[0], "");
    }

    const bMatch = s.match(/([+-]?[0-9]*\.?[0-9]*)x\^2/);
    if (bMatch) {
      const coeff = bMatch[1];
      b = coeff === "" || coeff === "+" ? 1 : coeff === "-" ? -1 : parseFloat(coeff);
      s = s.replace(bMatch[0], "");
    }

    const cMatch = s.match(/([+-]?[0-9]*\.?[0-9]*)x(?!\^)/);
    if (cMatch) {
      const coeff = cMatch[1];
      c = coeff === "" || coeff === "+" ? 1 : coeff === "-" ? -1 : parseFloat(coeff);
      s = s.replace(cMatch[0], "");
    }

    const dMatch = s.match(/^[+-]?[0-9]+\.?[0-9]*/);
    if (dMatch) {
      d = parseFloat(dMatch[0]);
    }

    return { a, b, c, d };
  }
}
