/**
 * STEP 7 — VIETNAMESE MATHEMATICAL PRONUNCIATION NORMALIZATION ENGINE
 * Converts display LaTeX / symbols into natural spoken Vietnamese for Edge TTS (vi-VN-NamMinhNeural).
 * Preserves visual formula notation while ensuring accurate phonetic reading.
 */

// Dictionary mapping mathematical terms and symbols to spoken Vietnamese
const MATH_PRONUNCIATION_DICT: Array<[RegExp, string]> = [
  // 3D & 2D Coordinate axes
  [/\bOxyz\b/g, "Ô x y zét"],
  [/\bOxy\b/g, "Ô x y"],
  [/\bOx\b/g, "Ô x"],
  [/\bOy\b/g, "Ô y"],
  [/\bOz\b/g, "Ô zét"],
  [/\b(trục|hệ trục)\s+Ox\b/gi, "$1 Ô x"],
  [/\b(trục|hệ trục)\s+Oy\b/gi, "$1 Ô y"],
  [/\b(trục|hệ trục)\s+Oz\b/gi, "$1 Ô zét"],

  // Greek Letters
  [/\\Delta|\bΔ\b/g, "đen ta"],
  [/\\pi|\bπ\b/g, "pi"],
  [/\\alpha|\bα\b/g, "an pha"],
  [/\\beta|\bβ\b/g, "bê ta"],
  [/\\gamma|\bγ\b/g, "gam ma"],
  [/\\theta|\bθ\b/g, "thê ta"],
  [/\\lambda|\bλ\b/g, "lam đa"],
  [/\\sigma|\bσ\b/g, "xích ma"],
  [/\\omega|\bω\b/g, "ô mê ga"],
  [/\\phi|\bφ\b/g, "phi"],

  // Powers & Exponents
  [/([a-zA-Z0-9_\(\)]+)\^2\b/g, "$1 bình phương"],
  [/([a-zA-Z0-9_\(\)]+)\^3\b/g, "$1 mũ ba"],
  [/([a-zA-Z0-9_\(\)]+)\^4\b/g, "$1 mũ bốn"],
  [/([a-zA-Z0-9_\(\)]+)\^n\b/g, "$1 mũ n"],
  [/([a-zA-Z0-9_\(\)]+)\^([0-9]+)\b/g, "$1 mũ $2"],
  [/\\cdot|\*/g, " nhân "],

  // Roots & Radicals
  [/\\sqrt\{([^{}]+)\}/g, "căn bậc hai của $1"],
  [/\\sqrt\[([0-9]+)\]\{([^{}]+)\}/g, "căn bậc $1 của $2"],
  [/\bcăn\s+([a-zA-Z0-9]+)/gi, "căn $1"],

  // Fractions
  [/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "$1 trên $2"],

  // Calculus & Trigonometry
  [/\\int\b/g, "tích phân "],
  [/\\lim\b/g, "giới hạn "],
  [/\bsin\b/g, "sin "],
  [/\bcos\b/g, "cốt "],
  [/\btan\b/g, "tang "],
  [/\bcot\b/g, "cô tang "],

  // Vectors & Geometry
  [/\\vec\{([^{}]+)\}/g, "véc tơ $1"],
  [/\\overrightarrow\{([^{}]+)\}/g, "véc tơ $1"],
  [/\\perp|\b⊥\b/g, " vuông góc với "],
  [/\\parallel|\b\/\/\b/g, " song song với "],
  [/\\in\b|\b∈\b/g, " thuộc "],
  [/\\notin\b|\b∉\b/g, " không thuộc "],
  [/\\subset\b|\b⊂\b/g, " là tập con của "],

  // Relations & Inequalities
  [/\\leq|<=|\b≤\b/g, " nhỏ hơn hoặc bằng "],
  [/\\geq|>=|\b≥\b/g, " lớn hơn hoặc bằng "],
  [/\\neq|!=|\b≠\b/g, " khác "],
  [/\\approx|\b≈\b/g, " xấp xỉ bằng "],
  [/\\equiv|\b≡\b/g, " đồng nhất với "],
  [/\\pm|\b±\b/g, " cộng trừ "],
  [/=/g, " bằng "],
  [/\+/g, " cộng "],
  [/-/g, " trừ "],
  [/>/g, " lớn hơn "],
  [/</g, " nhỏ hơn "],

  // Common high school math terms
  [/\bx_([0-9]+)\b/g, "x $1"],
  [/\by_([0-9]+)\b/g, "y $1"],
  [/\bz_([0-9]+)\b/g, "zét $1"],
  [/\bA\(([^)]+)\)/g, "điểm A có tọa độ $1"],
  [/\bB\(([^)]+)\)/g, "điểm B có tọa độ $1"],
  [/\bC\(([^)]+)\)/g, "điểm C có tọa độ $1"],
  [/\bM\(([^)]+)\)/g, "điểm M có tọa độ $1"],
];

/**
 * Transforms standard mathematical display text / LaTeX into natural spoken Vietnamese for TTS.
 * @param displayText The raw display string or equation
 * @returns Pronunciation-optimized string suitable for Edge TTS vi-VN voice
 */
export function toTtsText(displayText: string): string {
  if (!displayText || displayText.trim() === "") {
    return "";
  }

  let result = displayText;

  // Clean raw LaTeX dollar signs
  result = result.replace(/\$\$([^\$]+)\$\$/g, "$1");
  result = result.replace(/\$([^\$]+)\$/g, "$1");

  // Apply math pronunciation dictionary transformations
  for (const [pattern, replacement] of MATH_PRONUNCIATION_DICT) {
    result = result.replace(pattern, replacement);
  }

  // Normalize spacing and commas for smooth speech pauses
  result = result
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s*;\s*/g, "; ")
    .replace(/\s*:\s*/g, ": ")
    .replace(/\s*\.\s*/g, ". ")
    .trim();

  return result;
}
