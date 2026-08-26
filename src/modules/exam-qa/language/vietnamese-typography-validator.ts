import { EXAM_QA_ISSUE_CODES, type ExamQAIssueCode } from "../issue-codes.js";
import type { QAIssue } from "../types.js";
import { VI_UNIT_PATTERN, type SafeSuggestionDetails } from "./language-rules.js";
import { getProseSpans, hasBalancedDelimiters, replaceAt } from "./text-normalization.js";

export interface VietnameseTextContext { questionId?: string; field: string; sectionId?: string; sourcePage?: number; sourceIndex?: number }

const makeIssue = (context: VietnameseTextContext, code: ExamQAIssueCode, severity: QAIssue["severity"], message: string, source: string, suggested?: string, start?: number, end?: number, confidence: SafeSuggestionDetails["confidence"] = "HIGH"): QAIssue => ({
  code, category: "LANGUAGE", severity, message, questionId: context.questionId,
  location: { field: context.field, sectionId: context.sectionId, sourcePage: context.sourcePage, sourceIndex: context.sourceIndex },
  details: { original: source, suggested, ruleId: code, confidence, ...(start === undefined ? {} : { start, end }) }, suggestion: suggested,
});

function firstProseMatch(source: string, pattern: RegExp): { match: RegExpMatchArray; start: number; end: number } | undefined {
  for (const span of getProseSpans(source)) {
    const match = span.text.match(pattern);
    if (match?.index !== undefined) return { match, start: span.start + match.index, end: span.start + match.index + match[0].length };
  }
  return undefined;
}

export function validateVietnameseTypography(source: string, context: VietnameseTextContext): QAIssue[] {
  const issues: QAIssue[] = [];
  const nfc = source.normalize("NFC");
  if (source !== nfc) issues.push(makeIssue(context, EXAM_QA_ISSUE_CODES.VI_UNICODE_NORMALIZATION_WARNING, "INFO", "Text is not Unicode NFC-normalized.", source, nfc, undefined, undefined, "HIGH"));

  const doubleSpace = firstProseMatch(source, /[ \t]{2,}/);
  if (doubleSpace) issues.push(makeIssue(context, EXAM_QA_ISSUE_CODES.VI_DOUBLE_SPACE, "WARNING", "Multiple adjacent spaces were found.", source, source.replace(/[ \t]{2,}/g, " "), doubleSpace.start, doubleSpace.end));

  const beforePunctuation = firstProseMatch(source, / +[,.;:!?]/);
  if (beforePunctuation) issues.push(makeIssue(context, EXAM_QA_ISSUE_CODES.VI_SPACE_BEFORE_PUNCTUATION, "WARNING", "Whitespace before punctuation is suspicious.", source, source.replace(/ +([,.;:!?])/g, "$1"), beforePunctuation.start, beforePunctuation.end));

  const missingAfter = firstProseMatch(source, /(?:[,;:!?](?=\p{L})|\.(?=\p{Lu}\p{Ll}))/u);
  if (missingAfter) issues.push(makeIssue(context, EXAM_QA_ISSUE_CODES.VI_MISSING_SPACE_AFTER_PUNCTUATION, "WARNING", "Punctuation should normally be followed by a space.", source, replaceAt(source, missingAfter.end, missingAfter.end, " "), missingAfter.start, missingAfter.end));

  const suspiciousComma = firstProseMatch(source, /,\s+\p{Lu}\p{Ll}{2,}/u);
  if (suspiciousComma) {
    const comma = source.indexOf(",", suspiciousComma.start);
    issues.push(makeIssue(context, EXAM_QA_ISSUE_CODES.VI_SUSPICIOUS_COMMA_CAPITALIZATION, "WARNING", "A comma followed by a capitalized sentence boundary is suspicious.", source, replaceAt(source, comma, comma + 1, "."), comma, comma + 1, "MEDIUM"));
  }

  const lowercaseStart = firstProseMatch(source, /(?:^|[.!?]\s+)\p{Ll}/u);
  if (lowercaseStart && lowercaseStart.start === 0) issues.push(makeIssue(context, EXAM_QA_ISSUE_CODES.VI_SENTENCE_START_LOWERCASE, "WARNING", "Sentence starts with a lowercase letter.", source, undefined, lowercaseStart.start, lowercaseStart.end, "MEDIUM"));

  const repeated = firstProseMatch(source, /([!?;,])\1+|\.{2,}/);
  if (repeated) issues.push(makeIssue(context, repeated.match[0].startsWith(".") ? EXAM_QA_ISSUE_CODES.VI_ELLIPSIS_OR_FRAGMENT_WARNING : EXAM_QA_ISSUE_CODES.VI_REPEATED_PUNCTUATION, "WARNING", "Repeated punctuation or an ellipsis requires review.", source, undefined, repeated.start, repeated.end, "MEDIUM"));

  const prose = getProseSpans(source).map((span) => span.text).join("");
  if (!hasBalancedDelimiters(prose, "(", ")")) issues.push(makeIssue(context, EXAM_QA_ISSUE_CODES.VI_UNBALANCED_PARENTHESES, "ERROR", "Parentheses are unbalanced.", source));
  if (!hasBalancedDelimiters(prose, "[", "]")) issues.push(makeIssue(context, EXAM_QA_ISSUE_CODES.VI_UNBALANCED_BRACKETS, "ERROR", "Brackets are unbalanced.", source));

  const connector = firstProseMatch(source, /trung điểm (?!của )(?:(cạnh)\s+)?([A-ZĐ]{2,})/u);
  if (connector) {
    const replacement = connector.match[1] ? `trung điểm của cạnh ${connector.match[2]}` : `trung điểm của ${connector.match[2]}`;
    issues.push(makeIssue(context, EXAM_QA_ISSUE_CODES.VI_MATH_CONNECTOR_MISSING, "WARNING", "The common construction “trung điểm của …” appears to be missing “của”.", source, replaceAt(source, connector.start, connector.end, replacement), connector.start, connector.end));
  }

  const parenthesizedUnit = firstProseMatch(source, new RegExp(String.raw`(?:([A-Za-z]{1,4})\s*)?=\s*([+-]?\d+(?:[.,]\d+)?)\s*\((${VI_UNIT_PATTERN})\)|([+-]?\d+(?:[.,]\d+)?)\s*\((${VI_UNIT_PATTERN})\)`, "u"));
  if (parenthesizedUnit) {
    const fixed = parenthesizedUnit.match[0].replace(/\s*=\s*/, " = ").replace(/\(([a-z]+(?:²|³|\^[23])?)\)/u, " $1").replace(/^(\d)/, "$1");
    issues.push(makeIssue(context, EXAM_QA_ISSUE_CODES.VI_MATH_UNIT_FORMAT_WARNING, "WARNING", "Parenthesized or tightly formatted measurement unit is nonstandard.", source, replaceAt(source, parenthesizedUnit.start, parenthesizedUnit.end, fixed), parenthesizedUnit.start, parenthesizedUnit.end));
  } else {
    const tightUnit = firstProseMatch(source, new RegExp(String.raw`\b([+-]?\d+(?:[.,]\d+)?)(${VI_UNIT_PATTERN})\b`, "u"));
    if (tightUnit) issues.push(makeIssue(context, EXAM_QA_ISSUE_CODES.VI_NUMBER_UNIT_SPACING, "WARNING", "A space is expected between a number and its unit.", source, replaceAt(source, tightUnit.start, tightUnit.end, `${tightUnit.match[1]} ${tightUnit.match[2]}`), tightUnit.start, tightUnit.end));
  }

  const commaDecimals = source.match(/\d+,\d+/g) ?? [];
  const dotDecimals = source.match(/\d+\.\d+/g) ?? [];
  if (commaDecimals.length && dotDecimals.length) issues.push(makeIssue(context, EXAM_QA_ISSUE_CODES.VI_DECIMAL_SEPARATOR_INCONSISTENT, "WARNING", "Comma and dot decimal conventions are mixed in the same text field.", source, undefined, undefined, undefined, "MEDIUM"));
  return issues;
}
