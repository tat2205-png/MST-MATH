import { strFromU8, unzipSync } from "fflate";

export const PIMATH_LEGACY_EXAM_ADAPTER_VERSION = "PIMATH_LEGACY_EXAM_ADAPTER_V1" as const;

export type LegacyExamSeverity = "INFO" | "WARNING" | "ERROR";

export interface LegacyExamIssue {
  code: string;
  severity: LegacyExamSeverity;
  message: string;
  count?: number;
  questionIndex?: number;
}

export interface LegacyExamMetrics {
  questionBlocks: number;
  smartTestHashMarkers: number;
  explicitQuestionNumbers: number;
  mcqOptionLabels: number;
  trueFalseOptionLabels: number;
  solutionMarkers: number;
  shortAnswerMarkers: number;
  groupStarts: number;
  groupEnds: number;
  legacyIdMarkers: number;
  answerStyleHints: number;
  redAnswerHints: number;
  highlightAnswerHints: number;
  underlineAnswerHints: number;
}

export interface LegacyAnswerStyleHint {
  paragraphIndex: number;
  optionLabel?: string;
  sources: Array<"RED" | "HIGHLIGHT" | "UNDERLINE">;
}

export interface LegacyQuestionSummary {
  index: number;
  section: string;
  explicitNumber?: number;
  marker: "SMARTTEST_HASH" | "CAU";
  optionLabels: string[];
  trueFalseLabels: string[];
  answerHintCount: number;
}

export interface LegacyExamAnalysis {
  version: typeof PIMATH_LEGACY_EXAM_ADAPTER_VERSION;
  detected: boolean;
  profileHints: string[];
  metrics: LegacyExamMetrics;
  issues: LegacyExamIssue[];
  answerStyleHints: LegacyAnswerStyleHint[];
  questions: LegacyQuestionSummary[];
}

type PackageParts = Record<string, Uint8Array>;

type ParagraphRecord = {
  index: number;
  xml: string;
  text: string;
};

type QuestionWorking = LegacyQuestionSummary & {
  optionOccurrences: string[];
  answerHintParagraphs: Set<number>;
};

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_match, decimal: string) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function documentXmlFromPackage(bytes: Uint8Array): string {
  let parts: PackageParts;
  try {
    parts = unzipSync(bytes) as PackageParts;
  } catch (error) {
    throw new Error(`INVALID_DOCUMENT: Legacy exam adapter could not open Word OOXML: ${error instanceof Error ? error.message : String(error)}`);
  }
  const document = parts["word/document.xml"];
  if (!document) throw new Error("INVALID_DOCUMENT: word/document.xml is missing.");
  return strFromU8(document);
}

function paragraphText(xml: string): string {
  const pieces: string[] = [];
  const tokenExpression = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>|<w:tab\b[^>]*\/>|<w:br\b[^>]*\/>/gi;
  for (const match of xml.matchAll(tokenExpression)) {
    if (match[1] !== undefined) pieces.push(decodeXmlEntities(match[1]));
    else pieces.push(" ");
  }
  return pieces.join("").replace(/\u00a0/g, " ").replace(/[\t\r\n]+/g, " ").trim();
}

function extractParagraphs(documentXml: string): ParagraphRecord[] {
  return (documentXml.match(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/gi) ?? []).map((xml, index) => ({
    index,
    xml,
    text: paragraphText(xml),
  }));
}

function optionLabels(text: string): string[] {
  const labels: string[] = [];
  const expression = /(?:^|[\s;|])([A-E])\.\s*/g;
  for (const match of text.matchAll(expression)) labels.push(match[1]);
  return labels;
}

function trueFalseLabels(text: string): string[] {
  const labels: string[] = [];
  const expression = /(?:^|\s)([a-d])\)\s*/g;
  for (const match of text.matchAll(expression)) labels.push(match[1]);
  return labels;
}

function styleHintSources(paragraphXml: string): Array<"RED" | "HIGHLIGHT" | "UNDERLINE"> {
  const sources: Array<"RED" | "HIGHLIGHT" | "UNDERLINE"> = [];
  if (/<w:color\b[^>]*w:val=["'](?:FF0000|F00|RED)["']/i.test(paragraphXml)) sources.push("RED");
  if (/<w:highlight\b[^>]*w:val=["'](?!none)[^"']+["']/i.test(paragraphXml)) sources.push("HIGHLIGHT");
  if (/<w:u\b(?=[^>]*w:val=["'](?!none)[^"']+["'])[^>]*\/>/i.test(paragraphXml)) sources.push("UNDERLINE");
  return sources;
}

function optionLabelAtParagraphStart(text: string): string | undefined {
  return text.match(/^\s*([A-E])\.\s*/)?.[1];
}

function countExpression(paragraphs: ParagraphRecord[], expression: RegExp): number {
  let count = 0;
  for (const paragraph of paragraphs) {
    expression.lastIndex = 0;
    count += [...paragraph.text.matchAll(expression)].length;
  }
  return count;
}

function sectionName(text: string): string | undefined {
  const match = text.match(/^\s*PHẦN\s+([IVXLC]+|\d+)\b/i);
  return match ? `PHAN_${match[1].toUpperCase()}` : undefined;
}

function questionStart(text: string): { marker: "SMARTTEST_HASH" | "CAU"; explicitNumber?: number } | undefined {
  if (/^\s*#(?:\s|$)/.test(text)) return { marker: "SMARTTEST_HASH" };
  const explicit = text.match(/^\s*Câu\s*(\d+)\s*[:.)-]?/i);
  return explicit ? { marker: "CAU", explicitNumber: Number(explicit[1]) } : undefined;
}

function buildIssues(questions: QuestionWorking[], paragraphs: ParagraphRecord[], metrics: LegacyExamMetrics): LegacyExamIssue[] {
  const issues: LegacyExamIssue[] = [];
  const add = (code: string, severity: LegacyExamSeverity, message: string, details: Partial<LegacyExamIssue> = {}) => {
    issues.push({ code, severity, message, ...details });
  };

  if (metrics.groupStarts !== metrics.groupEnds) {
    add("WORD_LEGACY_GROUP_UNBALANCED", "WARNING", "Legacy <nhom> markers are not balanced; preserve source and review group boundaries.", { count: Math.abs(metrics.groupStarts - metrics.groupEnds) });
  }

  for (const question of questions) {
    const upper = question.optionOccurrences.filter((label) => /^[A-E]$/.test(label));
    const unique = [...new Set(upper)];
    if (upper.length >= 2 && unique.some((label) => label === "A" || label === "B" || label === "C" || label === "D")) {
      const expected = ["A", "B", "C", "D"];
      const missing = expected.filter((label) => !unique.includes(label));
      if (missing.length > 0) {
        add("WORD_QUESTION_OPTION_GAP", "WARNING", `Question block ${question.index} is missing option label(s): ${missing.join(", ")}.`, { questionIndex: question.index, count: missing.length });
      }
      if (unique.includes("E")) {
        add("WORD_UNEXPECTED_OPTION_E", "WARNING", `Question block ${question.index} contains option E; review the intended question type before normalization.`, { questionIndex: question.index });
      }
      const duplicateCount = upper.length - new Set(upper).size;
      if (duplicateCount > 0) {
        add("WORD_DUPLICATE_OPTION_LABEL", "WARNING", `Question block ${question.index} contains repeated option labels.`, { questionIndex: question.index, count: duplicateCount });
      }
    }
    if (question.answerHintParagraphs.size > 1) {
      add("WORD_MULTIPLE_ANSWER_STYLE_HINTS", "WARNING", `Question block ${question.index} has more than one legacy answer-style hint; do not infer a canonical answer automatically.`, { questionIndex: question.index, count: question.answerHintParagraphs.size });
    }
  }

  const bySection = new Map<string, number[]>();
  for (const question of questions) {
    if (question.explicitNumber === undefined) continue;
    const list = bySection.get(question.section) ?? [];
    list.push(question.explicitNumber);
    bySection.set(question.section, list);
  }
  for (const [section, numbers] of bySection) {
    const counts = new Map<number, number>();
    numbers.forEach((number) => counts.set(number, (counts.get(number) ?? 0) + 1));
    const duplicates = [...counts.entries()].filter(([, count]) => count > 1);
    if (duplicates.length > 0) {
      add("WORD_QUESTION_NUMBER_DUPLICATE_REVIEW", "INFO", `${section} contains repeated explicit question numbers; numbering may intentionally reset inside a legacy source, so teacher review is required.`, { count: duplicates.length });
    }
    const unique = [...new Set(numbers)].sort((a, b) => a - b);
    let gaps = 0;
    for (let index = 1; index < unique.length; index += 1) if (unique[index] - unique[index - 1] > 1) gaps += 1;
    if (gaps > 0) add("WORD_QUESTION_NUMBER_GAP_REVIEW", "INFO", `${section} contains gaps in explicit question numbering; PiMath will not renumber source content automatically.`, { count: gaps });
  }

  if (metrics.answerStyleHints > 0) {
    add("WORD_LEGACY_ANSWER_STYLE_HINTS", "INFO", "Legacy red/highlight/underline answer hints were detected. They are import hints only and are never treated as PiMath canonical answer data without downstream validation.", { count: metrics.answerStyleHints });
  }
  if (metrics.smartTestHashMarkers > 0) {
    add("WORD_SMARTTEST_MARKERS_DETECTED", "INFO", "SmartTest-style # question markers were detected and mapped as legacy semantic hints without changing source text.", { count: metrics.smartTestHashMarkers });
  }
  if (metrics.groupStarts + metrics.groupEnds > 0) {
    add("WORD_SMARTTEST_GROUP_MARKERS_DETECTED", "INFO", "Legacy <nhom> group markers were detected and preserved as question-group hints.", { count: metrics.groupStarts + metrics.groupEnds });
  }

  void paragraphs;
  return issues;
}

export function analyzeLegacyExamDocument(bytes: Uint8Array): LegacyExamAnalysis {
  const documentXml = documentXmlFromPackage(bytes);
  const paragraphs = extractParagraphs(documentXml);
  const answerStyleHints: LegacyAnswerStyleHint[] = [];
  const questions: QuestionWorking[] = [];
  let currentQuestion: QuestionWorking | undefined;
  let currentSection = "ROOT";

  let smartTestHashMarkers = 0;
  let explicitQuestionNumbers = 0;
  let mcqOptionLabels = 0;
  let trueFalseOptionLabels = 0;
  let solutionMarkers = 0;
  let shortAnswerMarkers = 0;
  let groupStarts = 0;
  let groupEnds = 0;
  let legacyIdMarkers = 0;
  let redAnswerHints = 0;
  let highlightAnswerHints = 0;
  let underlineAnswerHints = 0;

  for (const paragraph of paragraphs) {
    const section = sectionName(paragraph.text);
    if (section) currentSection = section;

    groupStarts += [...paragraph.text.matchAll(/<nhom>/gi)].length;
    groupEnds += [...paragraph.text.matchAll(/<\/nhom>/gi)].length;
    legacyIdMarkers += [...paragraph.text.matchAll(/\bID[456]\b/gi)].length;
    solutionMarkers += [...paragraph.text.matchAll(/^\s*(?:Lời giải|Hướng dẫn giải|Giải)\s*[:.]?/gi)].length;
    shortAnswerMarkers += [...paragraph.text.matchAll(/^\s*(?:Trả lời|Đáp án)\s*[:.]?/gi)].length;

    const start = questionStart(paragraph.text);
    if (start) {
      if (start.marker === "SMARTTEST_HASH") smartTestHashMarkers += 1;
      if (start.explicitNumber !== undefined) explicitQuestionNumbers += 1;
      currentQuestion = {
        index: questions.length + 1,
        section: currentSection,
        marker: start.marker,
        ...(start.explicitNumber === undefined ? {} : { explicitNumber: start.explicitNumber }),
        optionLabels: [],
        trueFalseLabels: [],
        answerHintCount: 0,
        optionOccurrences: [],
        answerHintParagraphs: new Set<number>(),
      };
      questions.push(currentQuestion);
    }

    const options = optionLabels(paragraph.text);
    const tf = trueFalseLabels(paragraph.text);
    mcqOptionLabels += options.length;
    trueFalseOptionLabels += tf.length;
    if (currentQuestion) {
      currentQuestion.optionOccurrences.push(...options);
      currentQuestion.optionLabels = [...new Set(currentQuestion.optionOccurrences)];
      currentQuestion.trueFalseLabels = [...new Set([...currentQuestion.trueFalseLabels, ...tf])];
    }

    const startLabel = optionLabelAtParagraphStart(paragraph.text);
    if (startLabel) {
      const sources = styleHintSources(paragraph.xml);
      if (sources.length > 0) {
        const hint: LegacyAnswerStyleHint = { paragraphIndex: paragraph.index, optionLabel: startLabel, sources };
        answerStyleHints.push(hint);
        if (sources.includes("RED")) redAnswerHints += 1;
        if (sources.includes("HIGHLIGHT")) highlightAnswerHints += 1;
        if (sources.includes("UNDERLINE")) underlineAnswerHints += 1;
        if (currentQuestion) {
          currentQuestion.answerHintCount += 1;
          currentQuestion.answerHintParagraphs.add(paragraph.index);
        }
      }
    }
  }

  const metrics: LegacyExamMetrics = {
    questionBlocks: questions.length,
    smartTestHashMarkers,
    explicitQuestionNumbers,
    mcqOptionLabels,
    trueFalseOptionLabels,
    solutionMarkers,
    shortAnswerMarkers,
    groupStarts,
    groupEnds,
    legacyIdMarkers,
    answerStyleHints: answerStyleHints.length,
    redAnswerHints,
    highlightAnswerHints,
    underlineAnswerHints,
  };

  const profileHints: string[] = [];
  if (smartTestHashMarkers > 0) profileHints.push("SMARTTEST_LEGACY");
  if (groupStarts + groupEnds > 0) profileHints.push("SMARTTEST_GROUPED_LEGACY");
  if (legacyIdMarkers > 0) profileHints.push("LEGACY_ID_MARKERS");
  if (answerStyleHints.length > 0) profileHints.push("LEGACY_ANSWER_PRESENTATION_HINTS");

  return {
    version: PIMATH_LEGACY_EXAM_ADAPTER_VERSION,
    detected: profileHints.length > 0 || questions.length > 0,
    profileHints,
    metrics,
    issues: buildIssues(questions, paragraphs, metrics),
    answerStyleHints,
    questions: questions.map(({ optionOccurrences: _occurrences, answerHintParagraphs: _paragraphs, ...question }) => question),
  };
}
