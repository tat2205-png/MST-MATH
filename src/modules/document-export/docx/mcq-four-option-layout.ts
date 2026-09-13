export type FourOptionLayout = "FOUR_INLINE" | "TWO_BY_TWO" | "STACKED";

export interface FourOptionMeasure {
  label: string;
  plainText: string;
  hasBlockObject?: boolean;
}

export interface FourOptionLayoutPlan {
  layout: FourOptionLayout;
  estimatedUnits: [number, number, number, number];
  reason: string;
}

const EXPECTED_LABELS = ["A", "B", "C", "D"] as const;

function normalizeLabel(value: string): string {
  return value.trim().replace(/[.\):：]+$/g, "").toUpperCase();
}

export function estimateOptionUnits(value: string): number {
  const normalized = value
    .replace(/\\(?:frac|sqrt|left|right|mathrm|mathbf|mathbb|mathcal|operatorname)\b/g, "MMMM")
    .replace(/\\[A-Za-z]+/g, "MM")
    .replace(/[{}_^]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  let units = 0;
  for (const character of normalized) {
    if (/\s/.test(character)) units += 0.35;
    else if (/[ilI1.,;:'`|]/.test(character)) units += 0.45;
    else if (/[MWQGĐƠƯ@%]/.test(character)) units += 1.25;
    else units += 1;
  }
  return Math.max(1, Math.ceil(units));
}

export function planFourOptionLayout(options: FourOptionMeasure[]): FourOptionLayoutPlan {
  if (options.length !== 4 || options.some((option, index) => normalizeLabel(option.label) !== EXPECTED_LABELS[index])) {
    return {
      layout: "STACKED",
      estimatedUnits: [0, 0, 0, 0],
      reason: "NON_CANONICAL_FOUR_OPTION_SET",
    };
  }

  if (options.some((option) => option.hasBlockObject)) {
    return {
      layout: "STACKED",
      estimatedUnits: options.map((option) => estimateOptionUnits(option.plainText)) as [number, number, number, number],
      reason: "BLOCK_OBJECT_REQUIRES_STACKED_LAYOUT",
    };
  }

  const estimatedUnits = options.map((option) => estimateOptionUnits(option.plainText)) as [number, number, number, number];
  const max = Math.max(...estimatedUnits);
  const total = estimatedUnits.reduce((sum, current) => sum + current, 0);

  if (max <= 20 && total <= 64) {
    return { layout: "FOUR_INLINE", estimatedUnits, reason: "SHORT_OPTIONS_FIT_FOUR_COLUMNS" };
  }

  const firstRow = estimatedUnits[0] + estimatedUnits[1];
  const secondRow = estimatedUnits[2] + estimatedUnits[3];
  if (max <= 42 && Math.max(firstRow, secondRow) <= 72) {
    return { layout: "TWO_BY_TWO", estimatedUnits, reason: "MEDIUM_OPTIONS_FIT_TWO_COLUMNS" };
  }

  return { layout: "STACKED", estimatedUnits, reason: "LONG_OPTIONS_REQUIRE_ONE_PER_LINE" };
}

export const MCQ_FOUR_INLINE_TAB_TWIPS = [2340, 4680, 7020] as const;
export const MCQ_TWO_BY_TWO_TAB_TWIPS = [4680] as const;
