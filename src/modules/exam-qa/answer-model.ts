export type SingleChoiceMarkerAnswer = { kind: "SINGLE_CHOICE"; key: string };
export type TrueFalseMarkerAnswer = { kind: "TRUE_FALSE"; values: boolean[] };
export type ShortAnswerMarkerAnswer = { kind: "SHORT_ANSWER"; canonical: string; numericValue: number };
export type MarkerAnswer = SingleChoiceMarkerAnswer | TrueFalseMarkerAnswer | ShortAnswerMarkerAnswer;
export type MarkerCompatibility = { status: "SUPPORTED" | "UNSUPPORTED" | "INVALID" | "NOT_TESTED"; reason?: string };

export type MarkerNormalizationResult =
  | { ok: true; answer: MarkerAnswer }
  | { ok: false; reason: string };

function canonicalizeDecimal(value: string): string | undefined {
  const trimmed = value.trim();
  if (!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(trimmed)) return undefined;
  const normalized = trimmed.replace(",", ".");
  const numericValue = Number(normalized);
  if (!Number.isFinite(numericValue)) return undefined;
  const sign = numericValue < 0 ? "-" : "";
  const unsigned = normalized.replace(/^[+-]/, "");
  const [integerPart, fractionPart = ""] = unsigned.split(".");
  const integer = (integerPart || "0").replace(/^0+(?=\d)/, "");
  const fraction = fractionPart.replace(/0+$/, "");
  return `${sign}${integer}${fraction ? `.${fraction}` : ""}`;
}

export function normalizeShortAnswer(value: unknown): MarkerNormalizationResult {
  if (typeof value !== "string" && typeof value !== "number") return { ok: false, reason: "Short answer must be a finite decimal number or numeric string." };
  if (typeof value === "number" && !Number.isFinite(value)) return { ok: false, reason: "Short answer must be finite." };
  const canonical = canonicalizeDecimal(String(value));
  if (canonical === undefined) return { ok: false, reason: "Short answer is not an unambiguous decimal value." };
  return { ok: true, answer: { kind: "SHORT_ANSWER", canonical, numericValue: Number(canonical) } };
}

export function formatVietnameseDecimal(answer: ShortAnswerMarkerAnswer | string): string {
  const canonical = typeof answer === "string" ? canonicalizeDecimal(answer) : answer.canonical;
  if (canonical === undefined) throw new Error("Cannot format an invalid canonical decimal answer.");
  return canonical.replace(".", ",");
}

export function normalizeMarkerAnswer(type: "SINGLE_CHOICE", value: unknown): MarkerNormalizationResult;
export function normalizeMarkerAnswer(type: "TRUE_FALSE", value: unknown): MarkerNormalizationResult;
export function normalizeMarkerAnswer(type: "SHORT_ANSWER", value: unknown): MarkerNormalizationResult;
export function normalizeMarkerAnswer(type: "SINGLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER", value: unknown): MarkerNormalizationResult;
export function normalizeMarkerAnswer(type: string, value: unknown): MarkerNormalizationResult {
  if (type === "SINGLE_CHOICE") {
    if (typeof value !== "string" || !value.trim()) return { ok: false, reason: "Single-choice answer must be one non-empty option key." };
    return { ok: true, answer: { kind: "SINGLE_CHOICE", key: value.trim() } };
  }
  if (type === "TRUE_FALSE") {
    if (!Array.isArray(value) || !value.every((item) => typeof item === "boolean")) return { ok: false, reason: "True/false answer must be a boolean array." };
    return { ok: true, answer: { kind: "TRUE_FALSE", values: [...value] } };
  }
  if (type === "SHORT_ANSWER") return normalizeShortAnswer(value);
  return { ok: false, reason: `Question type ${type} is not marker-compatible.` };
}
