import {
  DEFAULT_MST_MATH_NOTATION_PROFILE,
  prepareMstMathNotation,
} from "../modules/math-notation/authority.js";

/**
 * Vietnamese mathematical pronunciation normalization.
 * Registered notation is resolved from the shared MST-MATH notation authority.
 * Contextual expression patterns remain here because pronunciation is not reducible
 * to glyph replacement alone (fractions, roots, powers, coordinates, etc.).
 */

const CONTEXTUAL_PRONUNCIATION_DICT: Array<[RegExp, string]> = [
  // 3D & 2D Coordinate axes
  [/\bOxyz\b/g, "Ô x y zét"],
  [/\bOxy\b/g, "Ô x y"],
  [/\bOx\b/g, "Ô x"],
  [/\bOy\b/g, "Ô y"],
  [/\bOz\b/g, "Ô zét"],
  [/\b(trục|hệ trục)\s+Ox\b/gi, "$1 Ô x"],
  [/\b(trục|hệ trục)\s+Oy\b/gi, "$1 Ô y"],
  [/\b(trục|hệ trục)\s+Oz\b/gi, "$1 Ô zét"],

  // Greek letters not yet in the V1 notation registry
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

  // Powers & exponents
  [/([a-zA-Z0-9_\(\)]+)\^2\b/g, "$1 bình phương"],
  [/([a-zA-Z0-9_\(\)]+)\^3\b/g, "$1 mũ ba"],
  [/([a-zA-Z0-9_\(\)]+)\^4\b/g, "$1 mũ bốn"],
  [/([a-zA-Z0-9_\(\)]+)\^n\b/g, "$1 mũ n"],
  [/([a-zA-Z0-9_\(\)]+)\^([0-9]+)\b/g, "$1 mũ $2"],
  [/\\cdot|\*/g, " nhân "],

  // Trigonometry. These are contextual vocabulary, not notation-registry semantics.
  [/\bsin\b/g, "sin "],
  [/\bcos\b/g, "cốt "],
  [/\btan\b/g, "tang "],
  [/\bcot\b/g, "cô tang "],

  // Common high-school coordinate terms
  [/\bx_([0-9]+)\b/g, "x $1"],
  [/\by_([0-9]+)\b/g, "y $1"],
  [/\bz_([0-9]+)\b/g, "zét $1"],
  [/\bA\(([^)]+)\)/g, "điểm A có tọa độ $1"],
  [/\bB\(([^)]+)\)/g, "điểm B có tọa độ $1"],
  [/\bC\(([^)]+)\)/g, "điểm C có tọa độ $1"],
  [/\bM\(([^)]+)\)/g, "điểm M có tọa độ $1"],

  // Plain operators still require expression-aware parsing in a future successor.
  [/=/g, " bằng "],
  [/\+/g, " cộng "],
  [/-/g, " trừ "],
  [/>/g, " lớn hơn "],
  [/</g, " nhỏ hơn "],
];

function authoritySpoken(token: string, profileId: string): string {
  const prepared = prepareMstMathNotation(token, { profileId, output: "TTS" });
  if (prepared.status === "FAIL" || prepared.semanticTokens.length !== 1) {
    const detail = prepared.issues.map((issue) => `${issue.code}: ${issue.message}`).join("; ");
    throw new Error(`MATH_NOTATION_NARRATION_MISMATCH: cannot resolve ${token}. ${detail}`);
  }
  return prepared.semanticTokens[0].spokenVi;
}

function applyStructuredMathPronunciation(value: string, profileId: string): string {
  const vector = authoritySpoken("\\vec", profileId);
  const directed = authoritySpoken("\\overrightarrow", profileId);
  const squareRoot = authoritySpoken("\\sqrt", profileId);

  return value
    // More specific indexed root must run before square-root form.
    .replace(/\\sqrt\[([0-9]+)\]\{([^{}]+)\}/g, "căn bậc $1 của $2")
    .replace(/\\sqrt\{([^{}]+)\}/g, `${squareRoot} của $1`)
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "$1 trên $2")
    .replace(/\\overrightarrow\{([^{}]+)\}/g, `${directed} $1`)
    .replace(/\\vec\{([^{}]+)\}/g, `${vector} $1`);
}

function applyAuthorityPronunciation(value: string, profileId: string): string {
  const prepared = prepareMstMathNotation(value, { profileId, output: "TTS" });
  if (prepared.status === "FAIL") {
    const detail = prepared.issues.map((issue) => `${issue.code}: ${issue.message}`).join("; ");
    throw new Error(`MATH_NOTATION_NARRATION_MISMATCH: ${detail}`);
  }

  let result = value;
  // Replace from right to left so source offsets remain stable.
  for (const token of [...prepared.semanticTokens].sort((a, b) => b.start - a.start)) {
    result = `${result.slice(0, token.start)} ${token.spokenVi} ${result.slice(token.end)}`;
  }
  return result;
}

export interface TtsMathOptions {
  notationProfileId?: string;
}

/**
 * Transforms display text / LaTeX into Vietnamese narration text.
 * The default profile is explicit at the MST-MATH application boundary; the
 * lower-level registry itself still fails closed for unscoped profile-dependent notation.
 */
export function toTtsText(displayText: string, options: TtsMathOptions = {}): string {
  if (!displayText || displayText.trim() === "") return "";

  const profileId = options.notationProfileId ?? DEFAULT_MST_MATH_NOTATION_PROFILE;
  let result = displayText
    .replace(/\$\$([^\$]+)\$\$/g, "$1")
    .replace(/\$([^\$]+)\$/g, "$1");

  result = applyStructuredMathPronunciation(result, profileId);
  result = applyAuthorityPronunciation(result, profileId);

  for (const [pattern, replacement] of CONTEXTUAL_PRONUNCIATION_DICT) {
    result = result.replace(pattern, replacement);
  }

  return result
    .replace(/[{}]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s*;\s*/g, "; ")
    .replace(/\s*:\s*/g, ": ")
    .replace(/\s*\.\s*/g, ". ")
    .trim();
}
