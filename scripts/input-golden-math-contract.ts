export type ExpectedMath = "NONE" | "PRESENT";

export type MathExpectation = {
  page_number: number;
  expected_math: ExpectedMath | "UNKNOWN";
  expected_min_math_regions: number;
};

export type MathObservation = {
  page_number: number;
  detected_math_regions: number;
};

export function evaluatePageCoverage(expectations: MathExpectation[], totalPages: number, observedPages: number[], finalRun: boolean) {
  const expected = Array.from({ length: totalPages }, (_, index) => index + 1);
  const seen = new Set<number>();
  for (const page of observedPages) {
    if (!Number.isInteger(page) || page < 1 || page > totalPages) return { status: "FAIL", code: "PAGE_OUT_OF_RANGE" } as const;
    if (seen.has(page)) return { status: "FAIL", code: "DUPLICATE_OUTPUT_PAGE" } as const;
    seen.add(page);
  }
  if (observedPages.some((page, index) => page !== observedPages[index - 1] + 1 && index > 0)) return { status: "FAIL", code: "OUTPUT_PAGE_REORDERED" } as const;
  if (finalRun && (observedPages.length !== totalPages || observedPages.some((page, index) => page !== expected[index]))) return { status: "FAIL", code: "INCOMPLETE_PAGE_COVERAGE" } as const;
  if (expectations.length !== totalPages || expectations.some((expectation, index) => expectation.page_number !== expected[index])) return { status: "BLOCKED", code: "EXPECTATION_COVERAGE_INCOMPLETE" } as const;
  return finalRun ? ({ status: "PASS", code: "FULL_PAGE_COVERAGE" } as const) : ({ status: "BLOCKED", code: "DIAGNOSTIC_RANGE_NOT_FINAL" } as const);
}

export function evaluateMathExpectation(expectation: MathExpectation | undefined, observation: MathObservation) {
  if (!expectation || expectation.expected_math === "UNKNOWN") {
    return { status: "BLOCKED", code: "MISSING_MATH_EXPECTATION" } as const;
  }
  if (expectation.page_number !== observation.page_number) {
    return { status: "FAIL", code: "PAGE_EXPECTATION_MISMATCH" } as const;
  }
  if (expectation.expected_math === "NONE") {
    return observation.detected_math_regions === 0
      ? ({ status: "PASS", code: "VALID_NO_MATH_PAGE" } as const)
      : ({ status: "FAIL", code: "UNEXPECTED_MATH_REGIONS" } as const);
  }
  return observation.detected_math_regions >= expectation.expected_min_math_regions
    ? ({ status: "PASS", code: "EXPECTED_MATH_PRESENT" } as const)
    : ({ status: "FAIL", code: "EXPECTED_MATH_MISSING" } as const);
}

export function assertCompleteMathExpectations(expectations: MathExpectation[], totalPages: number) {
  const byPage = new Map(expectations.map((expectation) => [expectation.page_number, expectation]));
  const missingPages = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((page) => !byPage.has(page) || byPage.get(page)!.expected_math === "UNKNOWN");
  if (missingPages.length) throw new Error(`MATH_EXPECTATION_INCOMPLETE:${missingPages.join(",")}`);
  return byPage;
}
