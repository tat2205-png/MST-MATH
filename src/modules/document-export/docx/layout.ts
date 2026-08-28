import { NA_MATH_STANDARD_V2_6 } from "../../../config/naMathStandardV26.js";

const mmToTwips = (mm: number) => Math.round(mm * 56.6929133858);
const mmToEmu = (mm: number) => Math.round(mm * 36_000);

export function createWordLayoutMap() {
  const marginMm = NA_MATH_STANDARD_V2_6.layout.tokens.a4_margin_mm;
  return Object.freeze({
    provenance: "NA_MATH_STANDARD_V2_6.layout.tokens.a4_margin_mm",
    page: Object.freeze({ widthTwips: 11_906, heightTwips: 16_838, marginTwips: mmToTwips(marginMm) }),
    availableTextWidthEmu: mmToEmu(210 - marginMm * 2),
    compatibility: Object.freeze({ headerFooterDistanceTwips: 708, paragraphAfterTwips: 120 }),
  });
}
