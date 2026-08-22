/**
 * Domain Analyzer
 * Determines exact mathematical domain intervals, singularities, and domain exclusions.
 */

import { GraphDomain, GraphDomainInterval, GraphType } from "../../types/graphSchema.js";
import { MathEvaluator } from "./evaluator.js";

export class DomainAnalyzer {
  public static analyze(expr: string, graphType: GraphType, evaluator: MathEvaluator): GraphDomain {
    const clean = expr.replace(/\s+/g, "");

    // 1. Polynomials, Linear, Quadratic, Cubic: Domain is all real numbers R
    if (["linear", "quadratic", "cubic", "polynomial", "absolute_value"].includes(graphType) && !clean.includes("/") && !clean.includes("sqrt") && !clean.includes("ln")) {
      return {
        type: "all_reals",
        intervals: [
          {
            min: "-inf",
            max: "inf",
            minInclusive: false,
            maxInclusive: false,
          },
        ],
        rawText: "D = R = (-inf, +inf)",
        latex: "D = \\mathbb{R} = (-\\infty; +\\infty)",
      };
    }

    // 2. Square root: e.g. sqrt(x+2) -> x >= -2
    if (graphType === "radical" || clean.includes("sqrt(")) {
      const sqrtMatch = clean.match(/sqrt\(([a-z0-9\+\-\*\^]+)\)/i);
      if (sqrtMatch) {
        const inner = sqrtMatch[1];
        // For linear inner ax + b >= 0
        const linMatch = inner.match(/^([+-]?[0-9]*\.?[0-9]*)x([+-][0-9]+\.?[0-9]*)?$/);
        if (linMatch) {
          const aStr = linMatch[1];
          const bStr = linMatch[2] || "0";
          const a = aStr === "" || aStr === "+" ? 1 : aStr === "-" ? -1 : parseFloat(aStr);
          const b = parseFloat(bStr);

          if (a > 0) {
            const root = -b / a;
            return {
              type: "intervals",
              intervals: [
                {
                  min: root,
                  max: "inf",
                  minInclusive: true,
                  maxInclusive: false,
                },
              ],
              rawText: `D = [${root}, +inf)`,
              latex: `D = [${root}; +\\infty)`,
            };
          } else if (a < 0) {
            const root = -b / a;
            return {
              type: "intervals",
              intervals: [
                {
                  min: "-inf",
                  max: root,
                  minInclusive: false,
                  maxInclusive: true,
                },
              ],
              rawText: `D = (-inf, ${root}]`,
              latex: `D = (-\\infty; ${root}]`,
            };
          }
        }
      }
    }

    // 3. Logarithm: e.g. ln(x-1) -> x > 1
    if (graphType === "logarithmic" || clean.includes("ln(") || clean.includes("log(")) {
      const logMatch = clean.match(/(?:ln|log)\(([a-z0-9\+\-\*\^]+)\)/i);
      if (logMatch) {
        const inner = logMatch[1];
        const linMatch = inner.match(/^([+-]?[0-9]*\.?[0-9]*)x([+-][0-9]+\.?[0-9]*)?$/);
        if (linMatch) {
          const aStr = linMatch[1];
          const bStr = linMatch[2] || "0";
          const a = aStr === "" || aStr === "+" ? 1 : aStr === "-" ? -1 : parseFloat(aStr);
          const b = parseFloat(bStr);

          if (a > 0) {
            const root = -b / a;
            return {
              type: "intervals",
              intervals: [
                {
                  min: root,
                  max: "inf",
                  minInclusive: false,
                  maxInclusive: false,
                },
              ],
              rawText: `D = (${root}, +inf)`,
              latex: `D = (${root}; +\\infty)`,
            };
          } else if (a < 0) {
            const root = -b / a;
            return {
              type: "intervals",
              intervals: [
                {
                  min: "-inf",
                  max: root,
                  minInclusive: false,
                  maxInclusive: false,
                },
              ],
              rawText: `D = (-inf, ${root})`,
              latex: `D = (-\\infty; ${root})`,
            };
          }
        }
      }
    }

    // 4. Rational: e.g. (x+1)/(x-2) -> x != 2
    if (graphType === "rational" || clean.includes("/")) {
      const parts = clean.split("/");
      if (parts.length === 2) {
        let denom = parts[1].replace(/^\(+|\)+$/g, "");
        const linMatch = denom.match(/^([+-]?[0-9]*\.?[0-9]*)x([+-][0-9]+\.?[0-9]*)?$/);
        if (linMatch) {
          const aStr = linMatch[1];
          const bStr = linMatch[2] || "0";
          const a = aStr === "" || aStr === "+" ? 1 : aStr === "-" ? -1 : parseFloat(aStr);
          const b = parseFloat(bStr);

          if (a !== 0) {
            const root = -b / a;
            return {
              type: "intervals",
              intervals: [
                {
                  min: "-inf",
                  max: root,
                  minInclusive: false,
                  maxInclusive: false,
                },
                {
                  min: root,
                  max: "inf",
                  minInclusive: false,
                  maxInclusive: false,
                },
              ],
              rawText: `D = R \\ {${root}} = (-inf, ${root}) U (${root}, +inf)`,
              latex: `D = \\mathbb{R} \\setminus \\{${root}\\} = (-\\infty; ${root}) \\cup (${root}; +\\infty)`,
            };
          }
        }
      }
    }

    // Fallback: Check if f(x) is broadly continuous
    return {
      type: "all_reals",
      intervals: [
        {
          min: "-inf",
          max: "inf",
          minInclusive: false,
          maxInclusive: false,
        },
      ],
      rawText: "D = R",
      latex: "D = \\mathbb{R}",
    };
  }
}
