var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// desktop/main/main.ts
var import_electron2 = require("electron");
var import_node_path5 = __toESM(require("node:path"), 1);

// desktop/workspace/storage.ts
var import_node_crypto = require("node:crypto");
var import_node_fs = require("node:fs");
var import_node_path = __toESM(require("node:path"), 1);
var import_node_os = __toESM(require("node:os"), 1);
var SUPPORTED_INPUTS = [".docx", ".doc", ".pdf", ".png", ".jpg", ".jpeg"];
function detectInputType(filePath) {
  const ext = import_node_path.default.extname(filePath).toLowerCase().slice(1);
  return SUPPORTED_INPUTS.includes(`.${ext}`) ? ext : null;
}
function appDataRoot(platform = process.platform, env = process.env) {
  if (platform === "win32") return import_node_path.default.join(env.LOCALAPPDATA || import_node_path.default.join(import_node_os.default.homedir(), "AppData", "Local"), "PiMath");
  if (platform === "darwin") return import_node_path.default.join(import_node_os.default.homedir(), "Library", "Application Support", "PiMath");
  return import_node_path.default.join(env.XDG_DATA_HOME || import_node_path.default.join(import_node_os.default.homedir(), ".local", "share"), "PiMath");
}
function workspacePaths(root = appDataRoot()) {
  return { root, jobs: import_node_path.default.join(root, "JOBS"), temp: import_node_path.default.join(root, "TEMP"), cache: import_node_path.default.join(root, "CACHE"), logs: import_node_path.default.join(root, "LOGS"), config: import_node_path.default.join(root, "config.json") };
}
async function ensureWorkspace(root = appDataRoot()) {
  const p = workspacePaths(root);
  await Promise.all([p.jobs, p.temp, p.cache, p.logs].map((dir) => import_node_fs.promises.mkdir(dir, { recursive: true })));
  return p;
}
async function hashSource(sourcePath) {
  const hash2 = (0, import_node_crypto.createHash)("sha256");
  hash2.update(await import_node_fs.promises.readFile(sourcePath));
  return hash2.digest("hex");
}
async function readConfiguration(root = appDataRoot()) {
  const p = await ensureWorkspace(root);
  try {
    return JSON.parse(await import_node_fs.promises.readFile(p.config, "utf8"));
  } catch {
    return { schemaVersion: 1, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  }
}
async function writeConfiguration(config, root = appDataRoot()) {
  const p = await ensureWorkspace(root);
  await import_node_fs.promises.writeFile(p.config, JSON.stringify(config, null, 2), "utf8");
  return config;
}

// desktop/jobs/jobManager.ts
var import_node_fs4 = require("node:fs");
var import_node_path4 = __toESM(require("node:path"), 1);

// desktop/workspace/publication.ts
var import_node_fs2 = require("node:fs");
var import_node_path2 = __toESM(require("node:path"), 1);
async function versionedPath(root, fileName) {
  const ext = import_node_path2.default.extname(fileName);
  const stem = import_node_path2.default.basename(fileName, ext);
  for (let n = 1; ; n++) {
    const candidate = import_node_path2.default.join(root, `${stem}_v${String(n).padStart(3, "0")}${ext}`);
    try {
      await import_node_fs2.promises.access(candidate);
    } catch {
      return candidate;
    }
  }
}
async function publishAtomically(stagedPath, outputRoot, fileName = import_node_path2.default.basename(stagedPath)) {
  await import_node_fs2.promises.mkdir(outputRoot, { recursive: true });
  const target = await versionedPath(outputRoot, fileName);
  const temp = `${target}.part-${process.pid}-${Date.now()}`;
  await import_node_fs2.promises.copyFile(stagedPath, temp);
  await import_node_fs2.promises.rename(temp, target);
  return target;
}

// src/modules/question-bank/repository.ts
var empty = () => ({ schemaVersion: 1, questions: [], orphanFigures: [] });
var encoded = (bytes) => ({ $type: "Uint8Array", base64: Buffer.from(bytes).toString("base64") });
var isNodeBufferJson = (value) => {
  if (typeof value !== "object" || value === null) return false;
  const record = value;
  return Object.keys(record).length === 2 && record.type === "Buffer" && Array.isArray(record.data) && record.data.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255);
};
var replacer = (_key, value) => {
  if (value instanceof Uint8Array) return encoded(value);
  if (value instanceof ArrayBuffer) return encoded(new Uint8Array(value));
  if (isNodeBufferJson(value)) return encoded(Uint8Array.from(value.data));
  return value;
};
var reviver = (_key, value) => {
  if (typeof value === "object" && value !== null && value.$type === "Uint8Array") {
    const base64 = value.base64;
    if (typeof base64 !== "string") throw new Error("QUESTION_BANK_BINARY_ENCODING_INVALID");
    return new Uint8Array(Buffer.from(base64, "base64"));
  }
  if (isNodeBufferJson(value)) return Uint8Array.from(value.data);
  return value;
};
var validateFigureBytes = (snapshot) => {
  const figures = [...snapshot.questions.flatMap((question2) => question2.figures), ...snapshot.orphanFigures];
  if (figures.some((figure) => figure.bytes !== void 0 && !(figure.bytes instanceof Uint8Array))) throw new Error("QUESTION_BANK_BINARY_ENCODING_INVALID");
};
function serializeSnapshot(snapshot) {
  return JSON.stringify(snapshot, replacer, 2);
}
function deserializeSnapshot(value) {
  const parsed = JSON.parse(value, reviver);
  if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.questions) || !Array.isArray(parsed.orphanFigures)) throw new Error("QUESTION_BANK_SCHEMA_UNSUPPORTED");
  validateFigureBytes(parsed);
  return parsed;
}
var MemoryQuestionBankRepository = class {
  constructor() {
    this.snapshot = empty();
  }
  load() {
    return structuredClone(this.snapshot);
  }
  replace(snapshot) {
    this.snapshot = deserializeSnapshot(serializeSnapshot(snapshot));
  }
};

// src/modules/exam-qa/issue-codes.ts
var EXAM_QA_ISSUE_CODES = {
  EXAM_STRUCTURE_SECTION_COUNT_MISMATCH: "EXAM_STRUCTURE_SECTION_COUNT_MISMATCH",
  EXAM_STRUCTURE_QUESTION_TYPE_INVALID: "EXAM_STRUCTURE_QUESTION_TYPE_INVALID",
  QUESTION_ID_MISSING: "QUESTION_ID_MISSING",
  QUESTION_TYPE_UNKNOWN: "QUESTION_TYPE_UNKNOWN",
  QUESTION_NUMBER_DUPLICATE: "QUESTION_NUMBER_DUPLICATE",
  QUESTION_NUMBER_INVALID: "QUESTION_NUMBER_INVALID",
  QUESTION_MISSING_STEM: "QUESTION_MISSING_STEM",
  MCQ_OPTION_COUNT_INVALID: "MCQ_OPTION_COUNT_INVALID",
  MCQ_OPTION_KEY_DUPLICATE: "MCQ_OPTION_KEY_DUPLICATE",
  MCQ_NO_EXPECTED_ANSWER: "MCQ_NO_EXPECTED_ANSWER",
  MCQ_MULTIPLE_EXPECTED_ANSWERS: "MCQ_MULTIPLE_EXPECTED_ANSWERS",
  MCQ_EXPECTED_ANSWER_NOT_FOUND: "MCQ_EXPECTED_ANSWER_NOT_FOUND",
  TRUE_FALSE_STATEMENT_COUNT_INVALID: "TRUE_FALSE_STATEMENT_COUNT_INVALID",
  TRUE_FALSE_STATEMENT_INVALID: "TRUE_FALSE_STATEMENT_INVALID",
  SHORT_ANSWER_FORMAT_INVALID: "SHORT_ANSWER_FORMAT_INVALID",
  UNDEFINED_SYMBOL_REFERENCE: "UNDEFINED_SYMBOL_REFERENCE",
  LOGIC_DECLARATION_DEPENDENCY_UNRESOLVED: "LOGIC_DECLARATION_DEPENDENCY_UNRESOLVED",
  LOGIC_SYMBOL_REDEFINED: "LOGIC_SYMBOL_REDEFINED",
  LOGIC_CONFLICTING_DEFINITION: "LOGIC_CONFLICTING_DEFINITION",
  LOGIC_SELF_REFERENTIAL_DEFINITION: "LOGIC_SELF_REFERENTIAL_DEFINITION",
  LOGIC_TARGET_REFERENCE_UNRESOLVED: "LOGIC_TARGET_REFERENCE_UNRESOLVED",
  LOGIC_EXPLICIT_CONTRADICTION: "LOGIC_EXPLICIT_CONTRADICTION",
  LOGIC_INSUFFICIENT_DECLARED_CONTEXT: "LOGIC_INSUFFICIENT_DECLARED_CONTEXT",
  LOGIC_FIGURE_REFERENCE_NOT_VERIFIABLE: "LOGIC_FIGURE_REFERENCE_NOT_VERIFIABLE",
  MATH_PARSE_WARNING: "MATH_PARSE_WARNING",
  LANGUAGE_REVIEW_REQUIRED: "LANGUAGE_REVIEW_REQUIRED",
  VI_DOUBLE_SPACE: "VI_DOUBLE_SPACE",
  VI_SPACE_BEFORE_PUNCTUATION: "VI_SPACE_BEFORE_PUNCTUATION",
  VI_MISSING_SPACE_AFTER_PUNCTUATION: "VI_MISSING_SPACE_AFTER_PUNCTUATION",
  VI_SUSPICIOUS_COMMA_CAPITALIZATION: "VI_SUSPICIOUS_COMMA_CAPITALIZATION",
  VI_SENTENCE_START_LOWERCASE: "VI_SENTENCE_START_LOWERCASE",
  VI_REPEATED_PUNCTUATION: "VI_REPEATED_PUNCTUATION",
  VI_UNBALANCED_PARENTHESES: "VI_UNBALANCED_PARENTHESES",
  VI_UNBALANCED_BRACKETS: "VI_UNBALANCED_BRACKETS",
  VI_UNICODE_NORMALIZATION_WARNING: "VI_UNICODE_NORMALIZATION_WARNING",
  VI_MATH_UNIT_FORMAT_WARNING: "VI_MATH_UNIT_FORMAT_WARNING",
  VI_MATH_CONNECTOR_MISSING: "VI_MATH_CONNECTOR_MISSING",
  VI_MATH_PHRASE_SUSPICIOUS: "VI_MATH_PHRASE_SUSPICIOUS",
  VI_NUMBER_UNIT_SPACING: "VI_NUMBER_UNIT_SPACING",
  VI_DECIMAL_SEPARATOR_INCONSISTENT: "VI_DECIMAL_SEPARATOR_INCONSISTENT",
  VI_ELLIPSIS_OR_FRAGMENT_WARNING: "VI_ELLIPSIS_OR_FRAGMENT_WARNING",
  VI_LANGUAGE_REVIEW_REQUIRED: "VI_LANGUAGE_REVIEW_REQUIRED",
  MARKER_UNSUPPORTED_TYPE: "MARKER_UNSUPPORTED_TYPE",
  REQUIRED_VALIDATOR_NOT_TESTED: "REQUIRED_VALIDATOR_NOT_TESTED"
};

// src/modules/exam-qa/answer-model.ts
function canonicalizeDecimal(value) {
  const trimmed = value.trim();
  if (!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(trimmed)) return void 0;
  const normalized = trimmed.replace(",", ".");
  const numericValue = Number(normalized);
  if (!Number.isFinite(numericValue)) return void 0;
  const sign = numericValue < 0 ? "-" : "";
  const unsigned = normalized.replace(/^[+-]/, "");
  const [integerPart, fractionPart = ""] = unsigned.split(".");
  const integer = (integerPart || "0").replace(/^0+(?=\d)/, "");
  const fraction = fractionPart.replace(/0+$/, "");
  return `${sign}${integer}${fraction ? `.${fraction}` : ""}`;
}
function normalizeShortAnswer(value) {
  if (typeof value !== "string" && typeof value !== "number") return { ok: false, reason: "Short answer must be a finite decimal number or numeric string." };
  if (typeof value === "number" && !Number.isFinite(value)) return { ok: false, reason: "Short answer must be finite." };
  const canonical2 = canonicalizeDecimal(String(value));
  if (canonical2 === void 0) return { ok: false, reason: "Short answer is not an unambiguous decimal value." };
  return { ok: true, answer: { kind: "SHORT_ANSWER", canonical: canonical2, numericValue: Number(canonical2) } };
}
function normalizeMarkerAnswer(type, value) {
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

// src/modules/exam-qa/language/language-rules.ts
var VI_LANGUAGE_VALIDATOR_ID = "VIETNAMESE_LANGUAGE";
var VI_UNIT_PATTERN = String.raw`(?:mm|cm|dm|km|m)(?:²|³|\^[23])?`;

// src/modules/exam-qa/language/text-normalization.ts
function getProseSpans(source) {
  const mathPattern = /\$\$[\s\S]*?\$\$|\$[^$]*\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/g;
  const spans = [];
  let cursor = 0;
  for (const match of source.matchAll(mathPattern)) {
    const start = match.index ?? 0;
    if (start > cursor) spans.push({ text: source.slice(cursor, start), start: cursor, end: start });
    cursor = start + match[0].length;
  }
  if (cursor < source.length) spans.push({ text: source.slice(cursor), start: cursor, end: source.length });
  return spans;
}
function replaceAt(source, start, end, replacement) {
  return source.slice(0, start) + replacement + source.slice(end);
}
function hasBalancedDelimiters(source, open, close) {
  let depth = 0;
  for (let index = 0; index < source.length; index += 1) {
    if (source[index - 1] === "\\") continue;
    if (source[index] === open) depth += 1;
    if (source[index] === close && --depth < 0) return false;
  }
  return depth === 0;
}

// src/modules/exam-qa/language/vietnamese-typography-validator.ts
var makeIssue = (context, code, severity, message, source, suggested, start, end, confidence = "HIGH") => ({
  code,
  category: "LANGUAGE",
  severity,
  message,
  questionId: context.questionId,
  location: { field: context.field, sectionId: context.sectionId, sourcePage: context.sourcePage, sourceIndex: context.sourceIndex },
  details: { original: source, suggested, ruleId: code, confidence, ...start === void 0 ? {} : { start, end } },
  suggestion: suggested
});
function firstProseMatch(source, pattern) {
  for (const span of getProseSpans(source)) {
    const match = span.text.match(pattern);
    if (match?.index !== void 0) return { match, start: span.start + match.index, end: span.start + match.index + match[0].length };
  }
  return void 0;
}
function validateVietnameseTypography(source, context) {
  const issues = [];
  const nfc = source.normalize("NFC");
  if (source !== nfc) issues.push(makeIssue(context, EXAM_QA_ISSUE_CODES.VI_UNICODE_NORMALIZATION_WARNING, "INFO", "Text is not Unicode NFC-normalized.", source, nfc, void 0, void 0, "HIGH"));
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
  if (lowercaseStart && lowercaseStart.start === 0) issues.push(makeIssue(context, EXAM_QA_ISSUE_CODES.VI_SENTENCE_START_LOWERCASE, "WARNING", "Sentence starts with a lowercase letter.", source, void 0, lowercaseStart.start, lowercaseStart.end, "MEDIUM"));
  const repeated = firstProseMatch(source, /([!?;,])\1+|\.{2,}/);
  if (repeated) issues.push(makeIssue(context, repeated.match[0].startsWith(".") ? EXAM_QA_ISSUE_CODES.VI_ELLIPSIS_OR_FRAGMENT_WARNING : EXAM_QA_ISSUE_CODES.VI_REPEATED_PUNCTUATION, "WARNING", "Repeated punctuation or an ellipsis requires review.", source, void 0, repeated.start, repeated.end, "MEDIUM"));
  const prose = getProseSpans(source).map((span) => span.text).join("");
  if (!hasBalancedDelimiters(prose, "(", ")")) issues.push(makeIssue(context, EXAM_QA_ISSUE_CODES.VI_UNBALANCED_PARENTHESES, "ERROR", "Parentheses are unbalanced.", source));
  if (!hasBalancedDelimiters(prose, "[", "]")) issues.push(makeIssue(context, EXAM_QA_ISSUE_CODES.VI_UNBALANCED_BRACKETS, "ERROR", "Brackets are unbalanced.", source));
  const connector = firstProseMatch(source, /trung điểm (?!của )(?:(cạnh)\s+)?([A-ZĐ]{2,})/u);
  if (connector) {
    const replacement = connector.match[1] ? `trung \u0111i\u1EC3m c\u1EE7a c\u1EA1nh ${connector.match[2]}` : `trung \u0111i\u1EC3m c\u1EE7a ${connector.match[2]}`;
    issues.push(makeIssue(context, EXAM_QA_ISSUE_CODES.VI_MATH_CONNECTOR_MISSING, "WARNING", "The common construction \u201Ctrung \u0111i\u1EC3m c\u1EE7a \u2026\u201D appears to be missing \u201Cc\u1EE7a\u201D.", source, replaceAt(source, connector.start, connector.end, replacement), connector.start, connector.end));
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
  if (commaDecimals.length && dotDecimals.length) issues.push(makeIssue(context, EXAM_QA_ISSUE_CODES.VI_DECIMAL_SEPARATOR_INCONSISTENT, "WARNING", "Comma and dot decimal conventions are mixed in the same text field.", source, void 0, void 0, void 0, "MEDIUM"));
  return issues;
}

// src/modules/exam-qa/language/vietnamese-language-validator.ts
function questionTextFields(question2) {
  const fields = [];
  if (typeof question2.stem === "string") fields.push({ field: "stem", text: question2.stem });
  for (const option of question2.options ?? []) fields.push({ field: `option:${option.key}`, text: option.text });
  (question2.trueFalseStatements ?? []).forEach((statement, index) => fields.push({ field: `statement:${statement.key ?? index + 1}`, text: statement.text }));
  for (const [key, field] of [["expectedAnswerDisplay", "expectedAnswer"], ["sectionLabel", "sectionLabel"], ["displayText", "metadata.displayText"]]) {
    const value = question2.metadata?.[key];
    if (typeof value === "string") fields.push({ field, text: value });
  }
  return fields;
}
function validateVietnameseQuestionLanguage(question2) {
  return questionTextFields(question2).flatMap(({ field, text }) => validateVietnameseTypography(text, { questionId: question2.id, field, sectionId: question2.section, sourcePage: question2.sourcePage, sourceIndex: question2.sourceIndex }));
}

// src/modules/exam-qa/logic/symbol-extractor.ts
var LABEL_PATTERN = /[A-ZĐ](?:['’′]|[₀-₉]+|_\d+|\d+)?/g;
function extractPointLabels(token) {
  return token.match(LABEL_PATTERN) ?? [];
}
function extractGeometryReferences(text) {
  const references = /* @__PURE__ */ new Set();
  const compoundPattern = /[A-ZĐ](?:['’′]|[₀-₉]+|_\d+|\d+)?(?:[A-ZĐ](?:['’′]|[₀-₉]+|_\d+|\d+)?)+/g;
  for (const token of text.match(compoundPattern) ?? []) extractPointLabels(token).forEach((label) => references.add(label));
  for (const plane of text.matchAll(/\(([A-ZĐ][A-ZĐ0-9_₀-₉'’′]{1,})\)/g)) extractPointLabels(plane[1]).forEach((label) => references.add(label));
  return [...references];
}
function extractTargetReferences(text) {
  const references = /* @__PURE__ */ new Set();
  for (const target of text.matchAll(/(?:tính|tìm|xác định)\s+([^.!?]+)/giu)) extractGeometryReferences(target[1]).forEach((label) => references.add(label));
  for (const ratio of text.matchAll(/([A-ZĐ][A-ZĐ0-9_₀-₉'’′]+)\s*\/\s*([A-ZĐ][A-ZĐ0-9_₀-₉'’′]+)/g)) [ratio[1], ratio[2]].flatMap(extractPointLabels).forEach((label) => references.add(label));
  return [...references];
}

// src/modules/exam-qa/logic/declaration-extractor.ts
function extractImpliedGeometrySymbols(text) {
  const symbols = [];
  const pattern = /(?:hình chóp|lăng trụ|tam giác|tứ giác|tứ diện|hình bình hành|đoạn thẳng|đáy)\s+([A-ZĐ][A-ZĐ0-9_₀-₉'’′.]*)/giu;
  for (const match of text.matchAll(pattern)) {
    const token = match[1].replace(/[.]$/, "");
    extractPointLabels(token).forEach((name) => symbols.push({ name, kind: "POINT", start: match.index ?? 0 }));
  }
  return symbols;
}
function extractDeclarations(text) {
  const declarations = [];
  const pattern = /gọi\s+(\(([A-ZĐ])\)|([A-ZĐ](?:['’′]|[₀-₉]+|_\d+|\d+)?))\s+là\s+([^.!?]+)/giu;
  for (const match of text.matchAll(pattern)) {
    const name = match[2] || match[3];
    const definition = match[4].trim();
    let kind = match[2] || /mặt phẳng/iu.test(definition) ? "PLANE" : "POINT";
    if (/đường thẳng/iu.test(definition)) kind = "LINE";
    const dependsOn = extractGeometryReferences(definition).filter((symbol) => symbol !== name || /trung điểm|giao điểm/iu.test(definition));
    declarations.push({ name, kind, dependsOn, definition, start: match.index ?? 0, end: (match.index ?? 0) + match[0].length });
  }
  return declarations;
}

// src/modules/exam-qa/logic/logic-rules.ts
var MATHEMATICAL_LOGIC_VALIDATOR_ID = "MATHEMATICAL_QUESTION_LOGIC";

// src/modules/exam-qa/logic/symbol-table.ts
var QuestionSymbolTable = class _QuestionSymbolTable {
  constructor(seed = []) {
    this.records = /* @__PURE__ */ new Map();
    seed.forEach((record) => this.add(record));
  }
  add(record) {
    this.records.set(record.name, [...this.records.get(record.name) ?? [], record]);
  }
  has(name) {
    return (this.records.get(name) ?? []).some((record) => record.state === "DECLARED" || record.state === "DERIVED_OR_IMPLIED");
  }
  get(name) {
    return [...this.records.get(name) ?? []];
  }
  all() {
    return [...this.records.values()].flat();
  }
  clone() {
    return new _QuestionSymbolTable(this.all().map((record) => ({ ...record, dependsOn: [...record.dependsOn], metadata: record.metadata ? { ...record.metadata } : void 0 })));
  }
};

// src/modules/exam-qa/logic/mathematical-logic-validator.ts
var issue = (question2, field, code, severity, message, details) => ({ code, category: "MATH", severity, message, questionId: question2.id, location: { field, sectionId: question2.section, sourcePage: question2.sourcePage, sourceIndex: question2.sourceIndex }, details });
function seedQuestionSymbols(question2, table) {
  const text = question2.stem ?? "";
  for (const symbol of extractImpliedGeometrySymbols(text)) if (!table.has(symbol.name)) table.add({ name: symbol.name, kind: symbol.kind, state: "DERIVED_OR_IMPLIED", declaredAt: symbol.start, sourceLocation: { field: "stem", start: symbol.start }, dependsOn: [], confidence: "HIGH", metadata: { rule: "NAMED_GEOMETRY_OBJECT" } });
  const structured = question2.metadata?.logicSymbols;
  if (Array.isArray(structured)) {
    for (const value of structured) if (typeof value === "string" && !table.has(value)) table.add({ name: value, kind: "UNKNOWN", state: "DECLARED", sourceLocation: { field: "metadata.logicSymbols" }, dependsOn: [], confidence: "HIGH", metadata: { structuredSource: true } });
  }
}
function processDeclarations(question2, text, field, table) {
  const issues = [];
  for (const declaration of extractDeclarations(text)) {
    if (declaration.dependsOn.includes(declaration.name)) issues.push(issue(question2, field, EXAM_QA_ISSUE_CODES.LOGIC_SELF_REFERENTIAL_DEFINITION, "ERROR", `Definition of ${declaration.name} depends on itself.`, { symbol: declaration.name, definition: declaration.definition }));
    const unresolved = declaration.dependsOn.filter((name) => name !== declaration.name && !table.has(name));
    if (unresolved.length) issues.push(issue(question2, field, EXAM_QA_ISSUE_CODES.LOGIC_DECLARATION_DEPENDENCY_UNRESOLVED, "ERROR", `Definition of ${declaration.name} depends on unavailable symbols: ${unresolved.join(", ")}.`, { symbol: declaration.name, unresolvedSymbols: unresolved, definition: declaration.definition }));
    const prior = table.get(declaration.name).filter((record2) => record2.state === "DECLARED");
    if (prior.length) {
      const same = prior.some((record2) => record2.metadata?.definition === declaration.definition);
      issues.push(issue(question2, field, same ? EXAM_QA_ISSUE_CODES.LOGIC_SYMBOL_REDEFINED : EXAM_QA_ISSUE_CODES.LOGIC_CONFLICTING_DEFINITION, "ERROR", `${declaration.name} is declared more than once${same ? "." : " with conflicting definitions."}`, { symbol: declaration.name, previousDefinitions: prior.map((record2) => record2.metadata?.definition), definition: declaration.definition }));
    }
    const record = { name: declaration.name, kind: declaration.kind, state: "DECLARED", declaredAt: declaration.start, sourceLocation: { field, start: declaration.start, end: declaration.end }, dependsOn: declaration.dependsOn, confidence: "HIGH", metadata: { definition: declaration.definition } };
    table.add(record);
  }
  return issues;
}
function validateReferences(question2, text, field, table, scope, targetOnly) {
  const references = targetOnly ? extractTargetReferences(text) : [.../* @__PURE__ */ new Set([...extractTargetReferences(text), ...extractGeometryReferences(text)])];
  const unresolved = references.filter((name) => !table.has(name));
  if (!unresolved.length) return [];
  const code = targetOnly ? EXAM_QA_ISSUE_CODES.LOGIC_TARGET_REFERENCE_UNRESOLVED : EXAM_QA_ISSUE_CODES.UNDEFINED_SYMBOL_REFERENCE;
  return unresolved.map((symbol) => issue(question2, field, code, "ERROR", `Mathematical symbol ${symbol} is not declared in the ${scope.toLowerCase()} scope.`, { symbol, scope }));
}
function explicitContradictions(question2, text, field) {
  const issues = [];
  for (const unequal of text.matchAll(/([A-ZĐ][A-ZĐ0-9_₀-₉'’′]*)\s*≠\s*([A-ZĐ][A-ZĐ0-9_₀-₉'’′]*)/g)) {
    const reverse = new RegExp(`(?:${unequal[1]}\\s*=\\s*${unequal[2]}|${unequal[2]}\\s*=\\s*${unequal[1]})`);
    if (reverse.test(text)) issues.push(issue(question2, field, EXAM_QA_ISSUE_CODES.LOGIC_EXPLICIT_CONTRADICTION, "ERROR", "The text explicitly states both equality and inequality for the same symbols.", { left: unequal[1], right: unequal[2] }));
  }
  for (const midpoint of text.matchAll(/gọi\s+([A-ZĐ])\s+là\s+trung điểm (?:của )?([A-ZĐ]{2})/giu)) if (new RegExp(`${midpoint[1]}\\s+kh\xF4ng thu\u1ED9c\\s+${midpoint[2]}`, "iu").test(text)) issues.push(issue(question2, field, EXAM_QA_ISSUE_CODES.LOGIC_EXPLICIT_CONTRADICTION, "ERROR", "A declared midpoint is explicitly stated not to lie on its defining segment.", { symbol: midpoint[1], segment: midpoint[2] }));
  return issues;
}
function validateMathematicalQuestionLogic(question2) {
  const table = new QuestionSymbolTable();
  seedQuestionSymbols(question2, table);
  const issues = [];
  const stem = question2.stem ?? "";
  issues.push(...processDeclarations(question2, stem, "stem", table), ...validateReferences(question2, stem, "stem", table, "QUESTION", true), ...explicitContradictions(question2, stem, "stem"));
  for (const option of question2.options ?? []) {
    const local = table.clone();
    const field = `option:${option.key}`;
    issues.push(...processDeclarations(question2, option.text, field, local), ...validateReferences(question2, option.text, field, local, "OPTION", false), ...explicitContradictions(question2, option.text, field));
  }
  for (let index = 0; index < (question2.trueFalseStatements ?? []).length; index += 1) {
    const statement = question2.trueFalseStatements[index];
    const local = table.clone();
    const field = `statement:${statement.key ?? index + 1}`;
    issues.push(...processDeclarations(question2, statement.text, field, local), ...validateReferences(question2, statement.text, field, local, "TRUE_FALSE_STATEMENT", false), ...explicitContradictions(question2, statement.text, field));
  }
  const unresolvedTarget = issues.some((item) => item.code === EXAM_QA_ISSUE_CODES.LOGIC_TARGET_REFERENCE_UNRESOLVED);
  if (unresolvedTarget && (question2.assets?.length ?? 0) > 0) issues.push(issue(question2, "assets", EXAM_QA_ISSUE_CODES.LOGIC_FIGURE_REFERENCE_NOT_VERIFIABLE, "WARNING", "Unresolved target symbols may appear only in an unverified figure; EXAM-QA-2 does not inspect raster assets.", { assetCount: question2.assets.length }));
  return issues;
}

// src/modules/exam-qa/question-validator.ts
var QUESTION_VALIDATORS = { ID_NUMBER: "QUESTION_ID_NUMBER", STEM: "QUESTION_STEM", TYPE_STRUCTURE: "QUESTION_TYPE_STRUCTURE", MARKER: "MARKER_COMPATIBILITY", LANGUAGE: VI_LANGUAGE_VALIDATOR_ID, LOGIC: MATHEMATICAL_LOGIC_VALIDATOR_ID };
var requiredByDefault = Object.values(QUESTION_VALIDATORS);
var issue2 = (question2, code, severity, message, field, details) => ({
  code,
  category: code.startsWith("MARKER") || code.startsWith("SHORT_ANSWER") ? "MARKER" : "QUESTION",
  severity,
  message,
  questionId: question2.id,
  location: { field, sectionId: question2.section, sourcePage: question2.sourcePage, sourceIndex: question2.sourceIndex },
  details
});
function runQuestionValidators(question2, config = {}) {
  const issues = [];
  const executions = [];
  const required = new Set(config.requiredValidators ?? requiredByDefault);
  const skipped = new Set(config.unexecutedValidators ?? []);
  let markerCompatibility = { status: "NOT_TESTED" };
  let markerAnswer;
  const run2 = (validatorId, validate) => {
    if (skipped.has(validatorId)) {
      executions.push({ validatorId, status: "NOT_TESTED", required: required.has(validatorId), issues: [] });
      return;
    }
    const found = validate();
    issues.push(...found);
    executions.push({ validatorId, status: found.some((item) => item.severity === "ERROR" || item.severity === "BLOCKER") ? "FAILED" : "PASSED", required: required.has(validatorId), issues: found.map((item) => item.code) });
  };
  run2(QUESTION_VALIDATORS.ID_NUMBER, () => {
    const found = [];
    if (!question2.id?.trim()) found.push(issue2(question2, EXAM_QA_ISSUE_CODES.QUESTION_ID_MISSING, "BLOCKER", "Question id is required.", "id"));
    if (!Number.isInteger(question2.questionNumber) || Number(question2.questionNumber) <= 0) found.push(issue2(question2, EXAM_QA_ISSUE_CODES.QUESTION_NUMBER_INVALID, "BLOCKER", "Question number must be a positive integer.", "questionNumber"));
    return found;
  });
  run2(QUESTION_VALIDATORS.STEM, () => question2.stem?.trim() ? [] : [issue2(question2, EXAM_QA_ISSUE_CODES.QUESTION_MISSING_STEM, "BLOCKER", "A scorable question must have a non-empty stem.", "stem")]);
  run2(QUESTION_VALIDATORS.TYPE_STRUCTURE, () => {
    if (question2.type === "UNKNOWN") return [issue2(question2, EXAM_QA_ISSUE_CODES.QUESTION_TYPE_UNKNOWN, "ERROR", "Question type is unknown.", "type")];
    if (question2.type === "SINGLE_CHOICE") {
      const found = [];
      const options = question2.options ?? [];
      const expectedCount = config.expectedOptionCount ?? 4;
      if (options.length !== expectedCount) found.push(issue2(question2, EXAM_QA_ISSUE_CODES.MCQ_OPTION_COUNT_INVALID, "ERROR", `Expected ${expectedCount} options but found ${options.length}.`, "options", { expectedCount, actualCount: options.length }));
      const keys = options.map((option) => option.key.trim());
      if (new Set(keys).size !== keys.length) found.push(issue2(question2, EXAM_QA_ISSUE_CODES.MCQ_OPTION_KEY_DUPLICATE, "BLOCKER", "Option keys must be unique.", "options"));
      if (Array.isArray(question2.expectedAnswer)) found.push(issue2(question2, EXAM_QA_ISSUE_CODES.MCQ_MULTIPLE_EXPECTED_ANSWERS, "BLOCKER", "Single-choice questions require exactly one expected answer key.", "expectedAnswer"));
      else if (typeof question2.expectedAnswer !== "string" || !question2.expectedAnswer.trim()) found.push(issue2(question2, EXAM_QA_ISSUE_CODES.MCQ_NO_EXPECTED_ANSWER, "ERROR", "Single-choice expected answer is missing.", "expectedAnswer"));
      else if (!keys.includes(question2.expectedAnswer.trim())) found.push(issue2(question2, EXAM_QA_ISSUE_CODES.MCQ_EXPECTED_ANSWER_NOT_FOUND, "BLOCKER", "Expected answer key does not exist in the available options.", "expectedAnswer"));
      return found;
    }
    if (question2.type === "TRUE_FALSE") {
      const statements = question2.trueFalseStatements ?? [];
      const expectedCount = config.expectedStatementCount;
      const found = [];
      if (expectedCount !== void 0 && statements.length !== expectedCount) found.push(issue2(question2, EXAM_QA_ISSUE_CODES.TRUE_FALSE_STATEMENT_COUNT_INVALID, "ERROR", `Expected ${expectedCount} statements but found ${statements.length}.`, "trueFalseStatements", { expectedCount, actualCount: statements.length }));
      if (!statements.length || statements.some((statement) => !statement.text?.trim() || typeof statement.expected !== "boolean")) found.push(issue2(question2, EXAM_QA_ISSUE_CODES.TRUE_FALSE_STATEMENT_INVALID, "BLOCKER", "Each true/false statement needs text and a boolean expected value.", "trueFalseStatements"));
      return found;
    }
    return [];
  });
  run2(QUESTION_VALIDATORS.MARKER, () => {
    if (question2.type === "ESSAY" || question2.type === "UNKNOWN") {
      markerCompatibility = { status: "UNSUPPORTED", reason: `${question2.type} is not supported by the marker foundation.` };
      return [issue2(question2, EXAM_QA_ISSUE_CODES.MARKER_UNSUPPORTED_TYPE, "WARNING", markerCompatibility.reason, "type")];
    }
    const raw = question2.type === "TRUE_FALSE" ? question2.trueFalseStatements?.map((item) => item.expected) : question2.expectedAnswer;
    const normalized = normalizeMarkerAnswer(question2.type, raw);
    if ("reason" in normalized) {
      markerCompatibility = { status: "INVALID", reason: normalized.reason };
      return [issue2(question2, question2.type === "SHORT_ANSWER" ? EXAM_QA_ISSUE_CODES.SHORT_ANSWER_FORMAT_INVALID : EXAM_QA_ISSUE_CODES.MARKER_UNSUPPORTED_TYPE, "ERROR", normalized.reason, "expectedAnswer")];
    }
    markerCompatibility = { status: "SUPPORTED" };
    markerAnswer = normalized.answer;
    return [];
  });
  run2(QUESTION_VALIDATORS.LANGUAGE, () => config.languageValidation === false ? [] : validateVietnameseQuestionLanguage(question2));
  run2(QUESTION_VALIDATORS.LOGIC, () => config.logicValidation === false ? [] : validateMathematicalQuestionLogic(question2));
  return { issues, validators: executions, markerCompatibility, markerAnswer };
}

// src/modules/exam-qa/engine.ts
function evaluateQuestionQAStatus(issues, validators, policy = {}) {
  if (validators.some((validator) => validator.required && validator.status === "NOT_TESTED")) return "NOT_TESTED";
  if (issues.some((item) => item.severity === "BLOCKER")) return "BLOCKED";
  if (issues.some((item) => item.severity === "ERROR")) return policy.errorsBlock ? "BLOCKED" : "REVIEW_REQUIRED";
  if (issues.some((item) => item.severity === "WARNING") && policy.warningsRequireReview !== false) return "REVIEW_REQUIRED";
  return "READY";
}
function validateQuestion(question2, config = {}) {
  const output = runQuestionValidators(question2, config);
  const missing = output.validators.filter((item) => item.required && item.status === "NOT_TESTED");
  const issues = [...output.issues, ...missing.map((validator) => ({ code: EXAM_QA_ISSUE_CODES.REQUIRED_VALIDATOR_NOT_TESTED, category: "VALIDATION", severity: "BLOCKER", message: `Required validator ${validator.validatorId} was not executed.`, questionId: question2.id, details: { validatorId: validator.validatorId } }))];
  return { questionId: question2.id, status: evaluateQuestionQAStatus(issues, output.validators, { warningsRequireReview: config.warningsRequireReview }), issues, answerVerification: { status: "NOT_TESTED", details: { scope: "Deferred to EXAM-QA-3" } }, markerCompatibility: output.markerCompatibility, markerAnswer: output.markerAnswer, validators: output.validators };
}

// src/modules/question-bank/assets.ts
var import_node_crypto2 = require("node:crypto");
var AssetRegistry = class {
  constructor() {
    this.records = /* @__PURE__ */ new Map();
    this.hashes = /* @__PURE__ */ new Map();
  }
  register(asset) {
    if (!asset.id || !asset.relationshipId || !asset.sourceLocation) throw new Error("INVALID_FIGURE_RECORD");
    const hash2 = asset.bytes ? (0, import_node_crypto2.createHash)("sha256").update(asset.bytes).digest("hex") : `${asset.mediaPath}:${asset.relationshipId}`;
    const existing = this.hashes.get(hash2);
    if (existing) return existing;
    this.records.set(asset.id, structuredClone(asset));
    this.hashes.set(hash2, asset.id);
    return asset.id;
  }
  get(id) {
    const value = this.records.get(id);
    return value && structuredClone(value);
  }
  all() {
    return [...this.records.values()].map((value) => structuredClone(value));
  }
};

// src/modules/question-bank/duplicate.ts
var import_node_crypto3 = require("node:crypto");
var canonical = (blocks) => JSON.stringify(blocks, (key, value) => key === "sourceLocation" || key === "bytes" ? void 0 : value);
function questionFingerprint(question2) {
  return (0, import_node_crypto3.createHash)("sha256").update(JSON.stringify({ type: question2.type, stem: canonical(question2.stem), options: question2.options.map((x) => [x.label, canonical(x.content)]), statements: question2.trueFalseItems.map((x) => [x.label, canonical(x.content)]), subquestions: question2.subquestions.map((x) => [x.label, canonical(x.content)]) })).digest("hex");
}
function detectDuplicate(question2, existing) {
  const exact = existing.find((item) => item.id === question2.id || item.source.sourceHash === question2.source.sourceHash && item.index === question2.index);
  if (exact) return { status: "DUPLICATE", matchedId: exact.id, evidence: ["STABLE_SOURCE_IDENTITY"] };
  const fingerprint = questionFingerprint(question2);
  const possible = existing.find((item) => questionFingerprint(item) === fingerprint);
  return possible ? { status: "POSSIBLE_DUPLICATE", matchedId: possible.id, evidence: ["CANONICAL_CONTENT_MATCH_DIFFERENT_SOURCE"] } : { status: "UNIQUE", evidence: [] };
}

// src/modules/question-bank/examAdapter.ts
var render = (blocks) => blocks.map((block) => block.type === "text" ? block.value : block.type === "math" ? block.math.latex ?? `[${block.math.parseStatus}]` : block.type === "figure" ? `[FIGURE:${block.figureId}]` : block.cells.flat().map((cell) => render([cell])).join(" ")).join("");
function toExamQuestion(question2) {
  const type = question2.type === "MULTIPLE_CHOICE" ? "SINGLE_CHOICE" : question2.type;
  const expectedAnswer = question2.type === "MULTIPLE_CHOICE" && question2.answer?.length === 1 && question2.answer[0]?.type === "text" ? question2.answer[0].value.trim() : void 0;
  return { id: question2.id, sourceId: question2.source.sourceHash, sourceIndex: question2.index, section: question2.section, questionNumber: question2.index, type, stem: render(question2.stem), options: question2.options.map((option) => ({ key: option.label, text: render(option.content) })), trueFalseStatements: question2.trueFalseItems.map((item) => ({ key: item.label, text: render(item.content) })), expectedAnswer, mathExpressions: question2.stem.filter((block) => block.type === "math").map((block) => ({ source: block.math.sourceRaw, format: "OMML", metadata: { latex: block.math.latex, parseStatus: block.math.parseStatus, sourceLocation: block.math.sourceLocation } })), assets: question2.figures.map((figure) => ({ id: figure.id, type: "SOURCE_FIGURE", uri: figure.mediaPath, metadata: { relationshipId: figure.relationshipId, sourceLocation: figure.sourceLocation } })), metadata: { documentSource: question2.source, validationStatus: question2.validationStatus, warnings: question2.warnings } };
}

// src/modules/question-bank/document.ts
var import_node_crypto4 = require("node:crypto");

// node_modules/fflate/esm/index.mjs
var import_module = require("module");
var require2 = (0, import_module.createRequire)("/");
var _a;
var Worker;
var isMarkedAsUntransferable;
try {
  _a = require2("worker_threads"), Worker = _a.Worker, isMarkedAsUntransferable = _a.isMarkedAsUntransferable;
} catch (e) {
}
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b = new u16(31);
  for (var i = 0; i < 31; ++i) {
    b[i] = start += 1 << eb[i - 1];
  }
  var r = new i32(b[30]);
  for (var i = 1; i < 30; ++i) {
    for (var j = b[i]; j < b[i + 1]; ++j) {
      r[j] = j - b[i] << 5 | i;
    }
  }
  return { b, r };
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = (function(cd, mb, r) {
  var s = cd.length;
  var i = 0;
  var l = new u16(mb);
  for (; i < s; ++i) {
    if (cd[i])
      ++l[cd[i] - 1];
  }
  var le = new u16(mb);
  for (i = 1; i < mb; ++i) {
    le[i] = le[i - 1] + l[i - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        var sv = i << 4 | cd[i];
        var r_1 = mb - cd[i];
        var v = le[cd[i] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
      }
    }
  }
  return co;
});
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flm = /* @__PURE__ */ hMap(flt, 9, 0);
var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
var fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
var max = function(a) {
  var m = a[0];
  for (var i = 1; i < a.length; ++i) {
    if (a[i] > m)
      m = a[i];
  }
  return m;
};
var bits = function(d, p, m) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
};
var bits16 = function(d, p) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
};
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new u8(v.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  // determined by compression function
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var inflt = function(dat, st, buf, dict) {
  var sl = dat.length, dl = dict ? dict.length : 0;
  if (!sl || st.f && !st.l)
    return buf || new u8(0);
  var noBuf = !buf;
  var resize = noBuf || st.i != 2;
  var noSt = st.i;
  if (noBuf)
    buf = new u8(sl * 3);
  var cbuf = function(l2) {
    var bl = buf.length;
    if (l2 > bl) {
      var nbuf = new u8(Math.max(bl * 2, l2));
      nbuf.set(buf);
      buf = nbuf;
    }
  };
  var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
  var tbts = sl * 8;
  do {
    if (!lm) {
      final = bits(dat, pos, 1);
      var type = bits(dat, pos + 1, 3);
      pos += 3;
      if (!type) {
        var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
        if (t > sl) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + l);
        buf.set(dat.subarray(s, t), bt);
        st.b = bt += l, st.p = pos = t * 8, st.f = final;
        continue;
      } else if (type == 1)
        lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
      else if (type == 2) {
        var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
        var tl = hLit + bits(dat, pos + 5, 31) + 1;
        pos += 14;
        var ldt = new u8(tl);
        var clt = new u8(19);
        for (var i = 0; i < hcLen; ++i) {
          clt[clim[i]] = bits(dat, pos + i * 3, 7);
        }
        pos += hcLen * 3;
        var clb = max(clt), clbmsk = (1 << clb) - 1;
        var clm = hMap(clt, clb, 1);
        for (var i = 0; i < tl; ) {
          var r = clm[bits(dat, pos, clbmsk)];
          pos += r & 15;
          var s = r >> 4;
          if (s < 16) {
            ldt[i++] = s;
          } else {
            var c = 0, n = 0;
            if (s == 16)
              n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
            else if (s == 17)
              n = 3 + bits(dat, pos, 7), pos += 3;
            else if (s == 18)
              n = 11 + bits(dat, pos, 127), pos += 7;
            while (n--)
              ldt[i++] = c;
          }
        }
        var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
        lbt = max(lt);
        dbt = max(dt);
        lm = hMap(lt, lbt, 1);
        dm = hMap(dt, dbt, 1);
      } else
        err(1);
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
    }
    if (resize)
      cbuf(bt + 131072);
    var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
    var lpos = pos;
    for (; ; lpos = pos) {
      var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
      pos += c & 15;
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
      if (!c)
        err(2);
      if (sym < 256)
        buf[bt++] = sym;
      else if (sym == 256) {
        lpos = pos, lm = null;
        break;
      } else {
        var add = sym - 254;
        if (sym > 264) {
          var i = sym - 257, b = fleb[i];
          add = bits(dat, pos, (1 << b) - 1) + fl[i];
          pos += b;
        }
        var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
        if (!d)
          err(3);
        pos += d & 15;
        var dt = fd[dsym];
        if (dsym > 3) {
          var b = fdeb[dsym];
          dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
        }
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + 131072);
        var end = bt + add;
        if (bt < dt) {
          var shift = dl - dt, dend = Math.min(dt, end);
          if (shift + bt < 0)
            err(3);
          for (; bt < dend; ++bt)
            buf[bt] = dict[shift + bt];
        }
        for (; bt < end; ++bt)
          buf[bt] = buf[bt - dt];
      }
    }
    st.l = lm, st.p = lpos, st.b = bt, st.f = final;
    if (lm)
      final = 1, st.m = lbt, st.d = dm, st.n = dbt;
  } while (!final);
  return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
var wbits = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
};
var wbits16 = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
  d[o + 2] |= v >> 16;
};
var hTree = function(d, mb) {
  var t = [];
  for (var i = 0; i < d.length; ++i) {
    if (d[i])
      t.push({ s: i, f: d[i] });
  }
  var s = t.length;
  var t2 = t.slice();
  if (!s)
    return { t: et, l: 0 };
  if (s == 1) {
    var v = new u8(t[0].s + 1);
    v[t[0].s] = 1;
    return { t: v, l: 1 };
  }
  t.sort(function(a, b) {
    return a.f - b.f;
  });
  t.push({ s: -1, f: 25001 });
  var l = t[0], r = t[1], i0 = 0, i1 = 1, i2 = 2;
  t[0] = { s: -1, f: l.f + r.f, l, r };
  while (i1 != s - 1) {
    l = t[t[i0].f < t[i2].f ? i0++ : i2++];
    r = t[i0 != i1 && t[i0].f < t[i2].f ? i0++ : i2++];
    t[i1++] = { s: -1, f: l.f + r.f, l, r };
  }
  var maxSym = t2[0].s;
  for (var i = 1; i < s; ++i) {
    if (t2[i].s > maxSym)
      maxSym = t2[i].s;
  }
  var tr = new u16(maxSym + 1);
  var mbt = ln(t[i1 - 1], tr, 0);
  if (mbt > mb) {
    var i = 0, dt = 0;
    var lft = mbt - mb, cst = 1 << lft;
    t2.sort(function(a, b) {
      return tr[b.s] - tr[a.s] || a.f - b.f;
    });
    for (; i < s; ++i) {
      var i2_1 = t2[i].s;
      if (tr[i2_1] > mb) {
        dt += cst - (1 << mbt - tr[i2_1]);
        tr[i2_1] = mb;
      } else
        break;
    }
    dt >>= lft;
    while (dt > 0) {
      var i2_2 = t2[i].s;
      if (tr[i2_2] < mb)
        dt -= 1 << mb - tr[i2_2]++ - 1;
      else
        ++i;
    }
    for (; i >= 0 && dt; --i) {
      var i2_3 = t2[i].s;
      if (tr[i2_3] == mb) {
        --tr[i2_3];
        ++dt;
      }
    }
    mbt = mb;
  }
  return { t: new u8(tr), l: mbt };
};
var ln = function(n, l, d) {
  return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
};
var lc = function(c) {
  var s = c.length;
  while (s && !c[--s])
    ;
  var cl = new u16(++s);
  var cli = 0, cln = c[0], cls = 1;
  var w = function(v) {
    cl[cli++] = v;
  };
  for (var i = 1; i <= s; ++i) {
    if (c[i] == cln && i != s)
      ++cls;
    else {
      if (!cln && cls > 2) {
        for (; cls > 138; cls -= 138)
          w(32754);
        if (cls > 2) {
          w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
          cls = 0;
        }
      } else if (cls > 3) {
        w(cln), --cls;
        for (; cls > 6; cls -= 6)
          w(8304);
        if (cls > 2)
          w(cls - 3 << 5 | 8208), cls = 0;
      }
      while (cls--)
        w(cln);
      cls = 1;
      cln = c[i];
    }
  }
  return { c: cl.subarray(0, cli), n: s };
};
var clen = function(cf, cl) {
  var l = 0;
  for (var i = 0; i < cl.length; ++i)
    l += cf[i] * cl[i];
  return l;
};
var wfblk = function(out, pos, dat) {
  var s = dat.length;
  var o = shft(pos + 2);
  out[o] = s & 255;
  out[o + 1] = s >> 8;
  out[o + 2] = out[o] ^ 255;
  out[o + 3] = out[o + 1] ^ 255;
  for (var i = 0; i < s; ++i)
    out[o + i + 4] = dat[i];
  return (o + 4 + s) * 8;
};
var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
  wbits(out, p++, final);
  ++lf[256];
  var _a2 = hTree(lf, 15), dlt = _a2.t, mlb = _a2.l;
  var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
  var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
  var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
  var lcfreq = new u16(19);
  for (var i = 0; i < lclt.length; ++i)
    ++lcfreq[lclt[i] & 31];
  for (var i = 0; i < lcdt.length; ++i)
    ++lcfreq[lcdt[i] & 31];
  var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
  var nlcc = 19;
  for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
    ;
  var flen = bl + 5 << 3;
  var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
  var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
  if (bs >= 0 && flen <= ftlen && flen <= dtlen)
    return wfblk(out, p, dat.subarray(bs, bs + bl));
  var lm, ll, dm, dl;
  wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
  if (dtlen < ftlen) {
    lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
    var llm = hMap(lct, mlcb, 0);
    wbits(out, p, nlc - 257);
    wbits(out, p + 5, ndc - 1);
    wbits(out, p + 10, nlcc - 4);
    p += 14;
    for (var i = 0; i < nlcc; ++i)
      wbits(out, p + 3 * i, lct[clim[i]]);
    p += 3 * nlcc;
    var lcts = [lclt, lcdt];
    for (var it = 0; it < 2; ++it) {
      var clct = lcts[it];
      for (var i = 0; i < clct.length; ++i) {
        var len = clct[i] & 31;
        wbits(out, p, llm[len]), p += lct[len];
        if (len > 15)
          wbits(out, p, clct[i] >> 5 & 127), p += clct[i] >> 12;
      }
    }
  } else {
    lm = flm, ll = flt, dm = fdm, dl = fdt;
  }
  for (var i = 0; i < li; ++i) {
    var sym = syms[i];
    if (sym > 255) {
      var len = sym >> 18 & 31;
      wbits16(out, p, lm[len + 257]), p += ll[len + 257];
      if (len > 7)
        wbits(out, p, sym >> 23 & 31), p += fleb[len];
      var dst = sym & 31;
      wbits16(out, p, dm[dst]), p += dl[dst];
      if (dst > 3)
        wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
    } else {
      wbits16(out, p, lm[sym]), p += ll[sym];
    }
  }
  wbits16(out, p, lm[256]);
  return p + ll[256];
};
var deo = /* @__PURE__ */ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
var et = /* @__PURE__ */ new u8(0);
var dflt = function(dat, lvl, plvl, pre, post, st) {
  var s = st.z || dat.length;
  var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
  var w = o.subarray(pre, o.length - post);
  var lst = st.l;
  var pos = (st.r || 0) & 7;
  if (lvl) {
    if (pos)
      w[0] = st.r >> 3;
    var opt = deo[lvl - 1];
    var n = opt >> 13, c = opt & 8191;
    var msk_1 = (1 << plvl) - 1;
    var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
    var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
    var hsh = function(i2) {
      return (dat[i2] ^ dat[i2 + 1] << bs1_1 ^ dat[i2 + 2] << bs2_1) & msk_1;
    };
    var syms = new i32(25e3);
    var lf = new u16(288), df = new u16(32);
    var lc_1 = 0, eb = 0, i = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
    for (; i + 2 < s; ++i) {
      var hv = hsh(i);
      var imod = i & 32767, pimod = head[hv];
      prev[imod] = pimod;
      head[hv] = imod;
      if (wi <= i) {
        var rem = s - i;
        if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
          pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i - bs, pos);
          li = lc_1 = eb = 0, bs = i;
          for (var j = 0; j < 286; ++j)
            lf[j] = 0;
          for (var j = 0; j < 30; ++j)
            df[j] = 0;
        }
        var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
        if (rem > 2 && hv == hsh(i - dif)) {
          var maxn = Math.min(n, rem) - 1;
          var maxd = Math.min(32767, i);
          var ml = Math.min(258, rem);
          while (dif <= maxd && --ch_1 && imod != pimod) {
            if (dat[i + l] == dat[i + l - dif]) {
              var nl = 0;
              for (; nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl)
                ;
              if (nl > l) {
                l = nl, d = dif;
                if (nl > maxn)
                  break;
                var mmd = Math.min(dif, nl - 2);
                var md = 0;
                for (var j = 0; j < mmd; ++j) {
                  var ti = i - dif + j & 32767;
                  var pti = prev[ti];
                  var cd = ti - pti & 32767;
                  if (cd > md)
                    md = cd, pimod = ti;
                }
              }
            }
            imod = pimod, pimod = prev[imod];
            dif += imod - pimod & 32767;
          }
        }
        if (d) {
          syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
          var lin = revfl[l] & 31, din = revfd[d] & 31;
          eb += fleb[lin] + fdeb[din];
          ++lf[257 + lin];
          ++df[din];
          wi = i + l;
          ++lc_1;
        } else {
          syms[li++] = dat[i];
          ++lf[dat[i]];
        }
      }
    }
    for (i = Math.max(i, wi); i < s; ++i) {
      syms[li++] = dat[i];
      ++lf[dat[i]];
    }
    pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i - bs, pos);
    if (!lst) {
      st.r = pos & 7 | w[pos / 8 | 0] << 3;
      pos -= 7;
      st.h = head, st.p = prev, st.i = i, st.w = wi;
    }
  } else {
    for (var i = st.w || 0; i < s + lst; i += 65535) {
      var e = i + 65535;
      if (e >= s) {
        w[pos / 8 | 0] = lst;
        e = s;
      }
      pos = wfblk(w, pos + 1, dat.subarray(i, e));
    }
    st.i = s;
  }
  return slc(o, 0, pre + shft(pos) + post);
};
var crct = /* @__PURE__ */ (function() {
  var t = new Int32Array(256);
  for (var i = 0; i < 256; ++i) {
    var c = i, k = 9;
    while (--k)
      c = (c & 1 && -306674912) ^ c >>> 1;
    t[i] = c;
  }
  return t;
})();
var crc = function() {
  var c = -1;
  return {
    p: function(d) {
      var cr = c;
      for (var i = 0; i < d.length; ++i)
        cr = crct[cr & 255 ^ d[i]] ^ cr >>> 8;
      c = cr;
    },
    d: function() {
      return ~c;
    }
  };
};
var dopt = function(dat, opt, pre, post, st) {
  if (!st) {
    st = { l: 1 };
    if (opt.dictionary) {
      var dict = opt.dictionary.subarray(-32768);
      var newDat = new u8(dict.length + dat.length);
      newDat.set(dict);
      newDat.set(dat, dict.length);
      dat = newDat;
      st.w = dict.length;
    }
  }
  return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
};
var mrg = function(a, b) {
  var o = {};
  for (var k in a)
    o[k] = a[k];
  for (var k in b)
    o[k] = b[k];
  return o;
};
var b2 = function(d, b) {
  return d[b] | d[b + 1] << 8;
};
var b4 = function(d, b) {
  return (d[b] | d[b + 1] << 8 | d[b + 2] << 16 | d[b + 3] << 24) >>> 0;
};
var b8 = function(d, b) {
  return b4(d, b) + b4(d, b + 4) * 4294967296;
};
var wbytes = function(d, b, v) {
  for (; v; ++b)
    d[b] = v, v >>>= 8;
};
function deflateSync(data, opts) {
  return dopt(data, opts || {}, 0, 0);
}
function inflateSync(data, opts) {
  return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
var fltn = function(d, p, t, o) {
  for (var k in d) {
    var val = d[k], n = p + k, op = o;
    if (Array.isArray(val))
      op = mrg(o, val[1]), val = val[0];
    if (ArrayBuffer.isView(val))
      t[n] = [val, op];
    else {
      t[n += "/"] = [new u8(0), op];
      fltn(val, n, t, o);
    }
  }
};
var te = typeof TextEncoder != "undefined" && /* @__PURE__ */ new TextEncoder();
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}
var dutf8 = function(d) {
  for (var r = "", i = 0; ; ) {
    var c = d[i++];
    var eb = (c > 127) + (c > 223) + (c > 239);
    if (i + eb > d.length)
      return { s: r, r: slc(d, i - 1) };
    if (!eb)
      r += String.fromCharCode(c);
    else if (eb == 3) {
      c = ((c & 15) << 18 | (d[i++] & 63) << 12 | (d[i++] & 63) << 6 | d[i++] & 63) - 65536, r += String.fromCharCode(55296 | c >> 10, 56320 | c & 1023);
    } else if (eb & 1)
      r += String.fromCharCode((c & 31) << 6 | d[i++] & 63);
    else
      r += String.fromCharCode((c & 15) << 12 | (d[i++] & 63) << 6 | d[i++] & 63);
  }
};
function strToU8(str, latin1) {
  if (latin1) {
    var ar_1 = new u8(str.length);
    for (var i = 0; i < str.length; ++i)
      ar_1[i] = str.charCodeAt(i);
    return ar_1;
  }
  if (te)
    return te.encode(str);
  var l = str.length;
  var ar = new u8(str.length + (str.length >> 1));
  var ai = 0;
  var w = function(v) {
    ar[ai++] = v;
  };
  for (var i = 0; i < l; ++i) {
    if (ai + 5 > ar.length) {
      var n = new u8(ai + 8 + (l - i << 1));
      n.set(ar);
      ar = n;
    }
    var c = str.charCodeAt(i);
    if (c < 128 || latin1)
      w(c);
    else if (c < 2048)
      w(192 | c >> 6), w(128 | c & 63);
    else if (c > 55295 && c < 57344)
      c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i) & 1023, w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63);
    else
      w(224 | c >> 12), w(128 | c >> 6 & 63), w(128 | c & 63);
  }
  return slc(ar, 0, ai);
}
function strFromU8(dat, latin1) {
  if (latin1) {
    var r = "";
    for (var i = 0; i < dat.length; i += 16384)
      r += String.fromCharCode.apply(null, dat.subarray(i, i + 16384));
    return r;
  } else if (td) {
    return td.decode(dat);
  } else {
    var _a2 = dutf8(dat), s = _a2.s, r = _a2.r;
    if (r.length)
      err(8);
    return s;
  }
}
var slzh = function(d, b) {
  return b + 30 + b2(d, b + 26) + b2(d, b + 28);
};
var zh = function(d, b, z) {
  var fnl = b2(d, b + 28), efl = b2(d, b + 30), fn = strFromU8(d.subarray(b + 46, b + 46 + fnl), !(b2(d, b + 8) & 2048)), es = b + 46 + fnl;
  var _a2 = z64hs(d, es, efl, z, b4(d, b + 20), b4(d, b + 24), b4(d, b + 42)), sc = _a2[0], su = _a2[1], off = _a2[2];
  return [b2(d, b + 10), sc, su, fn, es + efl + b2(d, b + 32), off];
};
var z64hs = function(d, b, l, z, sc, su, off) {
  var nsc = sc == 4294967295, nsu = su == 4294967295, noff = off == 4294967295, e = b + l;
  var nf = nsc + nsu + noff;
  if (z && nf) {
    for (; b + 4 < e; b += 4 + b2(d, b + 2)) {
      if (b2(d, b) == 1) {
        return [
          nsc ? b8(d, b + 4 + 8 * nsu) : sc,
          nsu ? b8(d, b + 4) : su,
          noff ? b8(d, b + 4 + 8 * (nsu + nsc)) : off,
          1
        ];
      }
    }
    if (z < 2)
      err(13);
  }
  return [sc, su, off, 0];
};
var exfl = function(ex) {
  var le = 0;
  if (ex) {
    for (var k in ex) {
      var l = ex[k].length;
      if (l > 65535)
        err(9);
      le += l + 4;
    }
  }
  return le;
};
var wzh = function(d, b, f, fn, u, c, ce, co) {
  var fl2 = fn.length, ex = f.extra, col = co && co.length;
  var exl = exfl(ex);
  wbytes(d, b, ce != null ? 33639248 : 67324752), b += 4;
  if (ce != null)
    d[b++] = 20, d[b++] = f.os;
  d[b] = 20, b += 2;
  d[b++] = f.flag << 1 | (c < 0 && 8), d[b++] = u && 8;
  d[b++] = f.compression & 255, d[b++] = f.compression >> 8;
  var dt = new Date(f.mtime == null ? Date.now() : f.mtime), y = dt.getFullYear() - 1980;
  if (y < 0 || y > 119)
    err(10);
  wbytes(d, b, y << 25 | dt.getMonth() + 1 << 21 | dt.getDate() << 16 | dt.getHours() << 11 | dt.getMinutes() << 5 | dt.getSeconds() >> 1), b += 4;
  if (c != -1) {
    wbytes(d, b, f.crc);
    wbytes(d, b + 4, c < 0 ? -c - 2 : c);
    wbytes(d, b + 8, f.size);
  }
  wbytes(d, b + 12, fl2);
  wbytes(d, b + 14, exl), b += 16;
  if (ce != null) {
    wbytes(d, b, col);
    wbytes(d, b + 6, f.attrs);
    wbytes(d, b + 10, ce), b += 14;
  }
  d.set(fn, b);
  b += fl2;
  if (exl) {
    for (var k in ex) {
      var exf = ex[k], l = exf.length;
      wbytes(d, b, +k);
      wbytes(d, b + 2, l);
      d.set(exf, b + 4), b += 4 + l;
    }
  }
  if (col)
    d.set(co, b), b += col;
  return b;
};
var wzf = function(o, b, c, d, e) {
  wbytes(o, b, 101010256);
  wbytes(o, b + 8, c);
  wbytes(o, b + 10, c);
  wbytes(o, b + 12, d);
  wbytes(o, b + 16, e);
};
function zipSync(data, opts) {
  if (!opts)
    opts = {};
  var r = {};
  var files = [];
  fltn(data, "", r, opts);
  var o = 0;
  var tot = 0;
  for (var fn in r) {
    var _a2 = r[fn], file = _a2[0], p = _a2[1];
    var compression = p.level == 0 ? 0 : 8;
    var f = strToU8(fn), s = f.length;
    var com = p.comment, m = com && strToU8(com), ms = m && m.length;
    var exl = exfl(p.extra);
    if (s > 65535)
      err(11);
    var d = compression ? deflateSync(file, p) : file, l = d.length;
    var c = crc();
    c.p(file);
    files.push(mrg(p, {
      size: file.length,
      crc: c.d(),
      c: d,
      f,
      m,
      u: s != fn.length || m && com.length != ms,
      o,
      compression
    }));
    o += 30 + s + exl + l;
    tot += 76 + 2 * (s + exl) + (ms || 0) + l;
  }
  var out = new u8(tot + 22), oe = o, cdl = tot - o;
  for (var i = 0; i < files.length; ++i) {
    var f = files[i];
    wzh(out, f.o, f, f.f, f.u, f.c.length);
    var badd = 30 + f.f.length + exfl(f.extra);
    out.set(f.c, f.o + badd);
    wzh(out, o, f, f.f, f.u, f.c.length, f.o, f.m), o += 16 + badd + (f.m ? f.m.length : 0);
  }
  wzf(out, o, files.length, cdl, oe);
  return out;
}
function unzipSync(data, opts) {
  var files = {};
  var e = data.length - 22;
  for (; b4(data, e) != 101010256; --e) {
    if (!e || data.length - e > 65558)
      err(13);
  }
  ;
  var c = b2(data, e + 8);
  if (!c)
    return {};
  var o = b4(data, e + 16);
  var z = b4(data, e - 20) == 117853008;
  if (z) {
    var ze = b4(data, e - 12);
    z = b4(data, ze) == 101075792;
    if (z) {
      c = b4(data, ze + 32);
      o = b4(data, ze + 48);
    }
  }
  var fltr = opts && opts.filter;
  for (var i = 0; i < c; ++i) {
    var _a2 = zh(data, o, z), c_2 = _a2[0], sc = _a2[1], su = _a2[2], fn = _a2[3], no = _a2[4], off = _a2[5], b = slzh(data, off);
    o = no;
    if (!fltr || fltr({
      name: fn,
      size: sc,
      originalSize: su,
      compression: c_2
    })) {
      if (!c_2)
        files[fn] = slc(data, b, b + sc);
      else if (c_2 == 8)
        files[fn] = inflateSync(data.subarray(b, b + sc), { out: new u8(su) });
      else
        err(14, "unknown compression type " + c_2);
    }
  }
  return files;
}

// src/modules/document-engine/xml.ts
var XML_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
function decodeEntities(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_match, entity) => {
    if (entity[0] === "#") {
      const hex = entity[1]?.toLowerCase() === "x";
      const code = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(code) && code >= 0 && code <= 1114111 ? String.fromCodePoint(code) : "\uFFFD";
    }
    return XML_ENTITIES[entity.toLowerCase()] ?? _match;
  });
}
function localName(name) {
  const separator = name.indexOf(":");
  return separator === -1 ? name : name.slice(separator + 1);
}
function getAttribute(node, name) {
  if (!node) return void 0;
  return Object.entries(node.attributes).find(([key]) => key === name || localName(key) === name)?.[1];
}
function childElements(node, name) {
  return node.children.filter((child) => typeof child !== "string" && (name === void 0 || localName(child.name) === name));
}
function descendants(node, name) {
  const result = [];
  for (const child of childElements(node)) {
    if (name === void 0 || localName(child.name) === name) result.push(child);
    result.push(...descendants(child, name));
  }
  return result;
}
function textContent(node) {
  return node.children.map((child) => typeof child === "string" ? child : textContent(child)).join("");
}
function parseXml(xml2) {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml2)) throw new Error("XML_DTD_FORBIDDEN");
  const root = { name: "#document", attributes: {}, children: [] };
  const stack = [root];
  const tokenPattern = /<\?[^]*?\?>|<!--[\s\S]*?-->|<!\[CDATA\[([\s\S]*?)\]\]>|<([^>]+)>|([^<]+)/g;
  let match;
  while ((match = tokenPattern.exec(xml2)) !== null) {
    if (match[1] !== void 0) {
      stack.at(-1).children.push(match[1]);
      continue;
    }
    if (match[3] !== void 0) {
      stack.at(-1).children.push(decodeEntities(match[3]));
      continue;
    }
    if (match[2] === void 0) continue;
    const token = match[2].trim();
    if (!token || token.startsWith("!") || token.startsWith("?")) continue;
    if (token.startsWith("/")) {
      const closing = token.slice(1).trim();
      const current = stack.pop();
      if (!current || current === root || current.name !== closing) throw new Error(`XML_MISMATCHED_TAG:${closing}`);
      continue;
    }
    const selfClosing = token.endsWith("/");
    const body = selfClosing ? token.slice(0, -1).trim() : token;
    const nameMatch = /^([^\s/>]+)/.exec(body);
    if (!nameMatch) throw new Error("XML_INVALID_TAG");
    const node = { name: nameMatch[1], attributes: {}, children: [] };
    const attrText = body.slice(nameMatch[0].length);
    const attrPattern = /([^\s=]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let attr;
    while ((attr = attrPattern.exec(attrText)) !== null) node.attributes[attr[1]] = decodeEntities(attr[3] ?? attr[4] ?? "");
    const residue = attrText.replace(attrPattern, "").trim();
    if (residue) throw new Error(`XML_INVALID_ATTRIBUTE:${residue}`);
    stack.at(-1).children.push(node);
    if (!selfClosing) stack.push(node);
  }
  if (stack.length !== 1) throw new Error(`XML_UNCLOSED_TAG:${stack.at(-1).name}`);
  const documentElement = childElements(root)[0];
  if (!documentElement) throw new Error("XML_MISSING_ROOT");
  return documentElement;
}

// src/modules/document-engine/omml/omml.ts
var symbolMap = {
  "\u2264": "\\le",
  "\u2265": "\\ge",
  "\u2260": "\\ne",
  "\u2208": "\\in",
  "\u2282": "\\subset",
  "\u2225": "\\parallel",
  "\u22A5": "\\perp",
  "\xD7": "\\times",
  "\xF7": "\\div",
  "\xB1": "\\pm",
  "\u221E": "\\infty",
  "\u03C0": "\\pi",
  "\u03B1": "\\alpha",
  "\u03B2": "\\beta",
  "\u03B3": "\\gamma",
  "\u03B4": "\\delta",
  "\u0394": "\\Delta",
  "\u03B8": "\\theta",
  "\u03BB": "\\lambda",
  "\u03BC": "\\mu",
  "\u03C3": "\\sigma"
};
function escapeMathText(value) {
  return [...value].map((char) => symbolMap[char] ?? ({ "{": "\\{", "}": "\\}", "#": "\\#", "%": "\\%", "&": "\\&" }[char] ?? char)).join("");
}
function firstChild(node, name) {
  return childElements(node).find((child) => localName(child.name) === name);
}
function convertChildren(node, issues, path5) {
  return childElements(node).map((child, index) => convertNode(child, issues, `${path5}/${localName(child.name)}[${index}]`)).join("");
}
function wrappedArgument(node, issues, path5) {
  return node ? convertChildren(node, issues, path5) : "";
}
function convertNode(node, issues, path5) {
  const name = localName(node.name);
  switch (name) {
    case "oMath":
    case "oMathPara":
    case "e":
    case "num":
    case "den":
    case "sup":
    case "sub":
    case "deg":
    case "lim":
    case "fName":
    case "mr":
      return convertChildren(node, issues, path5);
    case "r":
      return descendants(node, "t").map(textContent).map(escapeMathText).join("");
    case "t":
      return escapeMathText(textContent(node));
    case "f":
      return `\\frac{${wrappedArgument(firstChild(node, "num"), issues, `${path5}/num`)}}{${wrappedArgument(firstChild(node, "den"), issues, `${path5}/den`)}}`;
    case "sSup":
      return `{${wrappedArgument(firstChild(node, "e"), issues, `${path5}/e`)}}^{${wrappedArgument(firstChild(node, "sup"), issues, `${path5}/sup`)}}`;
    case "sSub":
      return `{${wrappedArgument(firstChild(node, "e"), issues, `${path5}/e`)}}_{${wrappedArgument(firstChild(node, "sub"), issues, `${path5}/sub`)}}`;
    case "sSubSup":
      return `{${wrappedArgument(firstChild(node, "e"), issues, `${path5}/e`)}}_{${wrappedArgument(firstChild(node, "sub"), issues, `${path5}/sub`)}}^{${wrappedArgument(firstChild(node, "sup"), issues, `${path5}/sup`)}}`;
    case "limUpp":
      return `${wrappedArgument(firstChild(node, "e"), issues, `${path5}/e`)}^{${wrappedArgument(firstChild(node, "lim"), issues, `${path5}/lim`)}}`;
    case "acc": {
      const chr = getAttribute(firstChild(firstChild(node, "accPr") ?? node, "chr"), "val");
      const body = wrappedArgument(firstChild(node, "e"), issues, `${path5}/e`);
      return `${chr === "\u20D7" ? "\\vec" : "\\widehat"}{${body}}`;
    }
    case "bar":
      return `\\overline{${wrappedArgument(firstChild(node, "e"), issues, `${path5}/e`)}}`;
    case "box":
    case "groupChr":
      return wrappedArgument(firstChild(node, "e"), issues, `${path5}/e`);
    case "rad": {
      const degree = wrappedArgument(firstChild(node, "deg"), issues, `${path5}/deg`);
      const body = wrappedArgument(firstChild(node, "e"), issues, `${path5}/e`);
      return degree ? `\\sqrt[${degree}]{${body}}` : `\\sqrt{${body}}`;
    }
    case "d": {
      const properties = firstChild(node, "dPr");
      const begin = properties ? getAttribute(firstChild(properties, "begChr") ?? properties, "val") ?? "(" : "(";
      const end = properties ? getAttribute(firstChild(properties, "endChr") ?? properties, "val") ?? ")" : ")";
      const body = wrappedArgument(firstChild(node, "e"), issues, `${path5}/e`);
      if (begin === "|" && end === "|") return `\\left|${body}\\right|`;
      const delimiters = { "[": "[", "]": "]", "{": "\\{", "}": "\\}" };
      return `\\left${delimiters[begin] ?? begin}${body}\\right${delimiters[end] ?? end}`;
    }
    case "func":
      return `${wrappedArgument(firstChild(node, "fName"), issues, `${path5}/fName`)} ${wrappedArgument(firstChild(node, "e"), issues, `${path5}/e`)}`;
    case "nary": {
      const properties = firstChild(node, "naryPr");
      const character = properties ? getAttribute(firstChild(properties, "chr") ?? properties, "val") : void 0;
      const command = character === "\u222B" ? "\\int" : character === "\u220F" ? "\\prod" : "\\sum";
      const lower = wrappedArgument(firstChild(node, "sub"), issues, `${path5}/sub`);
      const upper = wrappedArgument(firstChild(node, "sup"), issues, `${path5}/sup`);
      return `${command}${lower ? `_{${lower}}` : ""}${upper ? `^{${upper}}` : ""} ${wrappedArgument(firstChild(node, "e"), issues, `${path5}/e`)}`;
    }
    case "limLow":
      return `\\lim_{${wrappedArgument(firstChild(node, "lim"), issues, `${path5}/lim`)}} ${wrappedArgument(firstChild(node, "e"), issues, `${path5}/e`)}`;
    case "m": {
      const rows = childElements(node, "mr").map((row) => childElements(row, "e").map((cell) => convertChildren(cell, issues, `${path5}/cell`)).join(" & "));
      return `\\begin{matrix}${rows.join(" \\\\ ")}\\end{matrix}`;
    }
    case "ctrlPr":
    case "rPr":
    case "fPr":
    case "radPr":
    case "sSupPr":
    case "sSubPr":
    case "sSubSupPr":
    case "dPr":
    case "naryPr":
    case "limLowPr":
    case "mPr":
      return "";
    default:
      issues.push({ code: "UNSUPPORTED_OMML_CONSTRUCT", severity: "warning", path: path5, message: `Unsupported OMML element: ${name}` });
      return `\\text{[unsupported OMML: ${name}]}`;
  }
}
function ommlToLatex(node, sourcePath = "OMML") {
  const issues = [];
  if (!["oMath", "oMathPara"].includes(localName(node.name))) return { status: "FAIL", rawText: textContent(node), issues: [{ code: "INVALID_OMML", severity: "error", path: sourcePath, message: "Expected an OMML math root." }] };
  const latex = convertNode(node, issues, sourcePath).trim();
  if (!latex) issues.push({ code: "INVALID_OMML", severity: "error", path: sourcePath, message: "OMML expression is empty." });
  return { status: issues.some((issue3) => issue3.severity === "error") ? "FAIL" : issues.length ? "PARTIAL" : "PASS", latex: latex || void 0, rawText: textContent(node), issues };
}

// src/modules/question-bank/omml.ts
function parseOmml(sourceRaw, sourceLocation) {
  try {
    const conversion = ommlToLatex(parseXml(sourceRaw), sourceLocation);
    const warnings = conversion.issues.map((issue3) => `${issue3.code}:${issue3.path ?? sourceLocation}`);
    const latex = conversion.latex?.trim();
    return { sourceType: "OMML", sourceRaw, latex: latex || void 0, normalized: latex || void 0, parseStatus: conversion.status === "PASS" ? "PARSED" : latex ? "UNSUPPORTED" : "UNRESOLVED", warnings: [...new Set(warnings)], sourceLocation };
  } catch (error) {
    return { sourceType: "OMML", sourceRaw, parseStatus: "UNRESOLVED", warnings: [`OMML_PARSE_FAILED:${error instanceof Error ? error.message : String(error)}`], sourceLocation };
  }
}

// src/modules/question-bank/document.ts
var decode = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
var mime = (path5) => path5?.endsWith(".png") ? "image/png" : path5?.match(/\.jpe?g$/i) ? "image/jpeg" : path5?.endsWith(".svg") ? "image/svg+xml" : path5?.endsWith(".wmf") ? "image/wmf" : path5?.endsWith(".emf") ? "image/emf" : "application/octet-stream";
var numberStyle = (style, name) => Number.parseFloat(new RegExp(`(?:^|;)${name}:([^;]+)`, "i").exec(style)?.[1] ?? "0");
var sourceFormat = (path5) => path5?.split(".").at(-1)?.toUpperCase() ?? "UNKNOWN";
function classifyAssetRole(markup, mediaPath, inVmlGroup = false) {
  if (/<w:object\b|<o:OLEObject\b/i.test(markup)) {
    const progId = /\bProgID="([^"]+)"/i.exec(markup)?.[1] ?? "";
    if (/mathtype|equation\.dsmt/i.test(progId)) return "MATHTYPE_PREVIEW";
    if (/^equation(?:\.|$)/i.test(progId)) return "EQUATION_PREVIEW";
    return "OLE_PREVIEW";
  }
  if (mediaPath?.match(/\.(?:wmf|emf)$/i)) return inVmlGroup ? "REAL_FIGURE" : "UNKNOWN";
  return "RASTER_FIGURE";
}
function relationships(xml2) {
  return new Map([...xml2.matchAll(/<Relationship\b[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"[^>]*\/?\s*>/gi)].map((m) => [m[1], m[2]]));
}
function paragraphContent(xml2, location, rels, files, figures, paragraphIndex, tableCell, canonicalVml = false) {
  const groups = [...xml2.matchAll(/<v:group\b([^>]*)>([\s\S]*?)<\/v:group>/gi)];
  const groupedIds = /* @__PURE__ */ new Set();
  for (const group of groups) {
    const groupId = /\bid="([^"]+)"/i.exec(group[1])?.[1] ?? `vml-group-${paragraphIndex}-${figures.length}`;
    let order = 0;
    const componentIds = [];
    for (const shape of group[2].matchAll(/<v:shape\b([^>]*)>[\s\S]*?<v:imagedata\b([^>]*)\/?>(?:[\s\S]*?<\/v:shape>)?/gi)) {
      const rid = /r:id="([^"]+)"/i.exec(shape[2])?.[1];
      if (!rid) continue;
      if (canonicalVml) groupedIds.add(rid);
      const target = rels.get(rid);
      const path5 = target ? `word/${target.replace(/^\.\.\//, "")}` : void 0;
      const bytes = path5 ? files[path5] : void 0;
      const id = `figure-${rid}`;
      const style = /\bstyle="([^"]*)"/i.exec(shape[1])?.[1] ?? "";
      const semanticRole = classifyAssetRole(shape[0], path5, true);
      const record = { id, relationshipId: rid, mediaPath: path5, mimeType: mime(path5), bytes, sourceLocation: location, paragraphIndex, tableCell, semanticRole, groupId, layout: { groupId, componentOrder: order++, x: numberStyle(style, "left"), y: numberStyle(style, "top"), width: numberStyle(style, "width"), height: numberStyle(style, "height"), rotation: numberStyle(style, "rotation") || void 0 }, derivation: { sourceAssetId: id, sourceMediaPath: path5, sourceFormat: sourceFormat(path5), sourceMime: mime(path5), sourceSha256: bytes ? (0, import_node_crypto4.createHash)("sha256").update(bytes).digest("hex") : void 0, semanticRole, status: "SOURCE" } };
      const existing = figures.find((x) => x.id === id);
      if (!existing) figures.push(record);
      componentIds.push(id);
    }
    if (canonicalVml && componentIds.length) {
      const compositeId = `figure-composite-${groupId}`;
      const groupStyle = /\bstyle="([^"]*)"/i.exec(group[1])?.[1] ?? "";
      const origin = (/\bcoordorigin="([^"]+)"/i.exec(group[1])?.[1] ?? "0,0").split(",").map(Number);
      const size = (/\bcoordsize="([^"]+)"/i.exec(group[1])?.[1] ?? "1,1").split(",").map(Number);
      if (!figures.some((x) => x.id === compositeId)) figures.push({ id: compositeId, relationshipId: "VML_GROUP", sourceLocation: location, paragraphIndex, tableCell, semanticRole: "REAL_FIGURE", groupId, componentIds, vmlGroupXml: group[2], layout: { groupId, componentOrder: 0, x: origin[0], y: origin[1], width: size[0], height: size[1] }, dimensions: { widthPx: Math.max(1, Math.round(numberStyle(groupStyle, "width") * 4 / 3)), heightPx: Math.max(1, Math.round(numberStyle(groupStyle, "height") * 4 / 3)) } });
    }
  }
  const content = [];
  const token = /<m:oMathPara\b[\s\S]*?<\/m:oMathPara>|<m:oMath\b[\s\S]*?<\/m:oMath>|<w:t\b[^>]*>[\s\S]*?<\/w:t>|<(?:a:blip|v:imagedata)\b[^>]*>/gi;
  let match;
  while (match = token.exec(xml2)) {
    const raw = match[0];
    if (/^<w:t/i.test(raw)) {
      const value = decode(raw.replace(/^<w:t\b[^>]*>|<\/w:t>$/gi, ""));
      if (value) content.push({ type: "text", value, sourceLocation: location });
    } else if (/^<m:oMath/i.test(raw)) content.push({ type: "math", math: parseOmml(raw, `${location}:math:${content.length}`), sourceLocation: location });
    else {
      const rid = /r:(?:embed|id)="([^"]+)"/i.exec(raw)?.[1];
      if (!rid || groupedIds.has(rid)) continue;
      const target = rels.get(rid);
      const path5 = target ? `word/${target.replace(/^\.\.\//, "")}` : void 0;
      const id = `figure-${rid}`;
      const extent = /<wp:extent\b[^>]*cx="(\d+)"[^>]*cy="(\d+)"/i.exec(xml2);
      const semanticRole = classifyAssetRole(xml2, path5);
      if (!figures.some((x) => x.id === id)) figures.push({ id, relationshipId: rid, mediaPath: path5, mimeType: mime(path5), bytes: path5 ? files[path5] : void 0, sourceLocation: location, paragraphIndex, tableCell, semanticRole, dimensions: extent ? { widthEmu: Number(extent[1]), heightEmu: Number(extent[2]) } : void 0, derivation: { sourceAssetId: id, sourceMediaPath: path5, sourceFormat: sourceFormat(path5), sourceMime: mime(path5), sourceSha256: path5 && files[path5] ? (0, import_node_crypto4.createHash)("sha256").update(files[path5]).digest("hex") : void 0, semanticRole, status: semanticRole === "UNKNOWN" ? "REVIEW_REQUIRED" : "SOURCE" } });
      content.push({ type: "figure", figureId: id, sourceLocation: location });
    }
  }
  if (canonicalVml) for (const group of groups) {
    const groupId = /\bid="([^"]+)"/i.exec(group[1])?.[1];
    if (groupId) content.push({ type: "figure", figureId: `figure-composite-${groupId}`, sourceLocation: location });
  }
  return content.reduce((result, block) => {
    const previous = result.at(-1);
    if (previous?.type === "text" && block.type === "text") {
      previous.value += block.value;
    } else {
      result.push(block);
    }
    return result;
  }, []);
}
function parseDocx(bytes, sourceDocument, options = {}) {
  const files = unzipSync(bytes);
  const raw = files["word/document.xml"];
  if (!raw) throw new Error("INVALID_DOCX_DOCUMENT_XML_MISSING");
  const xml2 = new TextDecoder().decode(raw);
  const relRaw = files["word/_rels/document.xml.rels"];
  const rels = relationships(relRaw ? new TextDecoder().decode(relRaw) : "");
  const figures = [], blocks = [], warnings = [];
  const body = /<w:body\b[^>]*>([\s\S]*?)<\/w:body>/i.exec(xml2)?.[1] ?? xml2;
  const top = /<w:(p|tbl)\b[\s\S]*?<\/w:\1>/gi;
  let match, paragraphIndex = 0, order = 0;
  while (match = top.exec(body)) {
    const location = `word/document.xml:${match[1]}:${order}`;
    if (match[1] === "p") {
      const style = /<w:pStyle\b[^>]*w:val="([^"]+)"/i.exec(match[0])?.[1];
      const numbering = /<w:numId\b[^>]*w:val="([^"]+)"/i.exec(match[0])?.[1];
      const content = paragraphContent(match[0], location, rels, files, figures, paragraphIndex, void 0, options.canonicalVml);
      if (content.length) blocks.push({ id: `block-${order}`, kind: /^heading/i.test(style ?? "") ? "SECTION" : "PARAGRAPH", order, paragraphIndex, style, numbering, boldLabel: /<w:b\b/i.test(match[0]), content, sourceLocation: location });
      paragraphIndex++;
    } else {
      const cells = [];
      let cell;
      const cellRe = /<w:tc\b[\s\S]*?<\/w:tc>/gi;
      let cellIndex = 0;
      while (cell = cellRe.exec(match[0])) cells.push(paragraphContent(cell[0], `${location}:cell:${cellIndex}`, rels, files, figures, paragraphIndex, `${order}:${cellIndex++}`, options.canonicalVml));
      blocks.push({ id: `block-${order}`, kind: "TABLE", order, paragraphIndex, content: [{ type: "table", cells, sourceLocation: location }], sourceLocation: location });
    }
    order++;
  }
  for (const [path5, data] of Object.entries(files).filter(([p]) => p.startsWith("word/media/"))) if (!figures.some((f) => f.mediaPath === path5)) {
    const id = `figure-orphan-${figures.length + 1}`;
    const semanticRole = path5.match(/\.(?:wmf|emf)$/i) ? "UNKNOWN" : "RASTER_FIGURE";
    figures.push({ id, relationshipId: "UNRESOLVED", mediaPath: path5, mimeType: mime(path5), bytes: data, sourceLocation: path5, semanticRole, derivation: { sourceAssetId: id, sourceMediaPath: path5, sourceFormat: sourceFormat(path5), sourceMime: mime(path5), sourceSha256: (0, import_node_crypto4.createHash)("sha256").update(data).digest("hex"), semanticRole, status: semanticRole === "UNKNOWN" ? "REVIEW_REQUIRED" : "SOURCE" } });
  }
  return { sourceDocument, sourceHash: (0, import_node_crypto4.createHash)("sha256").update(bytes).digest("hex"), blocks, figures, warnings };
}

// src/modules/question-bank/normalization.ts
function normalizeVietnameseText(value) {
  return value.normalize("NFC").replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim();
}
function normalizeBlocks(blocks) {
  return blocks.map((block) => block.type === "text" ? { ...block, value: normalizeVietnameseText(block.value) } : block);
}

// src/modules/question-bank/schema.ts
function validateQuestion2(question2) {
  const out = [];
  if (!question2.id || !question2.source.document || !question2.source.sourceHash || !question2.source.blockIds.length) out.push({ level: "FAIL", code: "INVALID_SOURCE_LOCATION", message: "Question source traceability is incomplete" });
  if (!question2.stem.length) out.push({ level: "FAIL", code: "MISSING_STEM", message: "Question stem is empty" });
  if (question2.type === "MULTIPLE_CHOICE") {
    const labels = question2.options.map((x) => x.label);
    if (labels.length < 2 || new Set(labels).size !== labels.length) out.push({ level: "FAIL", code: "INVALID_OPTIONS", message: "Options must be ordered and unique" });
  }
  if (question2.type === "TRUE_FALSE" && (!question2.trueFalseItems.length || question2.trueFalseItems.some((x) => !x.content.length))) out.push({ level: "FAIL", code: "EMPTY_TRUE_FALSE_STATEMENT", message: "True/false statements must be separate and non-empty" });
  const unresolved = [...question2.stem, ...question2.options.flatMap((x) => x.content), ...question2.trueFalseItems.flatMap((x) => x.content)].some((x) => x.type === "math" && x.math.parseStatus !== "PARSED");
  if (unresolved) out.push({ level: "WARNING", code: "UNRESOLVED_MATH", message: "Question contains unresolved source math" });
  return out.length ? out : [{ level: "PASS", code: "VALID", message: "Question is structurally valid" }];
}

// src/modules/question-bank/extraction.ts
var textOf = (block) => block.type === "text" ? block.value : "";
function extractExplicitSourceMcqAnswer(solutionText) {
  const marker = /(?:^\s*|[.!?;]\s*|\b(?:vậy|do\s+đó)\s+)(?:đáp\s+án(?:\s+đúng)?|chọn)\s*[:\-]?\s*([ABCD])(?=$|[\s.)!,;:])(?!\s*(?:thì|là)\b)/giu;
  const answers = [...solutionText.matchAll(marker)].map((match) => match[1].toUpperCase());
  if (!answers.length || new Set(answers).size > 1) return void 0;
  return answers[0];
}
var splitLabels = (blocks, pattern) => {
  const result = [];
  for (const block of blocks) {
    if (block.type !== "text") {
      if (result.length) result.at(-1).content.push(block);
      continue;
    }
    const matches = [...block.value.matchAll(pattern)];
    if (!matches.length) {
      if (result.length && block.value.trim()) result.at(-1).content.push(block);
      continue;
    }
    matches.forEach((match, i) => {
      const value = block.value.slice((match.index ?? 0) + match[0].length, matches[i + 1]?.index ?? block.value.length).trim();
      result.push({ label: match[1], content: value ? [{ ...block, value }] : [] });
    });
  }
  return result.filter((x) => x.content.length > 0);
};
function normalizeCandidate(candidate, document2) {
  const all = normalizeBlocks(candidate.textBlocks.flatMap((block) => block.type === "table" ? block.cells.flat() : [block]));
  const solutionIndex = all.findIndex((block) => block.type === "text" && /^(?:Lời\s*giải|Hướng\s*dẫn\s*giải)\s*:?(?:\s|$)/iu.test(block.value));
  const content = solutionIndex >= 0 ? all.slice(0, solutionIndex) : all;
  const solutionSource = solutionIndex >= 0 ? all.slice(solutionIndex) : [];
  const options = splitLabels(content, /([A-H])[.)](?:\s|$)/gu);
  const statements = candidate.questionTypeCandidate === "TRUE_FALSE" ? splitLabels(content, /(?:^|\s)([a-h])[.)]\s*/gu) : [];
  const firstOptionIndex = content.findIndex((block) => block.type === "text" && /[A-H][.)](?:\s|$)/u.test(block.value));
  const stem = content.slice(0, firstOptionIndex < 0 ? content.length : firstOptionIndex).filter((block) => block.type !== "figure").map((block) => block.type === "text" ? { ...block, value: block.value.replace(/^(?:(?:Câu|Bài)\s*)?\d+\s*[.:)]\s*/iu, "") } : block).filter((b) => b.type !== "text" || b.value.trim());
  const id = `${document2.sourceHash.slice(0, 12)}-q${candidate.questionIndex ?? candidate.id}`;
  const associations = candidate.figureAnchors.map((figureId) => ({ figureId, questionId: id, status: "CONFIRMED", confidence: 1, evidence: ["QUESTION_BLOCK_CONTAINMENT", document2.figures.find((f) => f.id === figureId)?.tableCell ? "SAME_TABLE_CELL" : "PARAGRAPH_ANCHOR_OWNERSHIP"] }));
  const solution = solutionSource.map((block) => block.type === "text" ? { ...block, value: block.value.replace(/^(?:Lời\s*giải|Hướng\s*dẫn\s*giải)\s*:?\s*/iu, "") } : block).filter((block) => block.type !== "text" || block.value.trim());
  const extractedAnswer = candidate.questionTypeCandidate === "MULTIPLE_CHOICE" ? extractExplicitSourceMcqAnswer(solution.map(textOf).join(" ")) : void 0;
  const result = { id, source: { document: document2.sourceDocument, sourceHash: document2.sourceHash, blockIds: candidate.rawBlocks.map((b) => b.id), sourceLocations: candidate.sourceLocations }, section: candidate.section, index: candidate.questionIndex, type: candidate.questionTypeCandidate, stem, options: candidate.questionTypeCandidate === "MULTIPLE_CHOICE" ? options : [], trueFalseItems: statements, ...extractedAnswer ? { answer: [{ type: "text", value: extractedAnswer }] } : {}, solution, subquestions: candidate.questionTypeCandidate === "ESSAY" ? splitLabels(content, /(?:^|\s)([a-h])[.)]\s*/gu) : [], figures: document2.figures.filter((f) => candidate.figureAnchors.includes(f.id)), figureAssociations: associations, metadata: { questionLabel: candidate.questionLabel ?? "UNRESOLVED" }, warnings: [...candidate.parseWarnings], validationStatus: "VALID" };
  const qa = validateQuestion2(result);
  result.warnings.push(...qa.filter((x) => x.level !== "PASS").map((x) => x.code));
  result.validationStatus = qa.some((x) => x.level === "FAIL") ? "INVALID" : qa.some((x) => x.level === "WARNING") ? "REVIEW_REQUIRED" : "VALID";
  return result;
}

// src/modules/question-bank/figures.ts
function associateFigures(document2, questions) {
  const assigned = new Map(questions.flatMap((q) => q.figureAssociations.map((a) => [a.figureId, a])));
  return document2.figures.map((figure) => assigned.get(figure.id) ?? { figureId: figure.id, status: "UNASSIGNED", confidence: 0, evidence: ["NO_STRUCTURAL_QUESTION_OWNERSHIP"] });
}

// src/modules/question-bank/segmentation.ts
var textOf2 = (blocks) => blocks.map((b) => b.type === "text" ? b.value : b.type === "table" ? b.cells.flat().map((x) => textOf2([x])).join(" ") : "").join("");
var question = /^(?:(Câu|Bài)\s*)?(\d+)\s*[.:)]\s*/iu;
var section = /^(PHẦN\s+(?:I|II|III|IV|V)|TRẮC NGHIỆM|ĐÚNG\s*\/\s*SAI|TRẢ LỜI NGẮN|TỰ LUẬN)/iu;
function typeFor(sectionName, content) {
  const value = `${sectionName ?? ""} ${textOf2(content)}`;
  if (/đúng\s*\/\s*sai/iu.test(value)) return "TRUE_FALSE";
  if (/trả lời ngắn/iu.test(value)) return "SHORT_ANSWER";
  if (/tự luận/iu.test(value)) return "ESSAY";
  const labels = [...value.matchAll(/([A-H])[.)](?:\s|$)/gu)].map((x) => x[1]);
  return new Set(labels).size >= 2 ? "MULTIPLE_CHOICE" : "UNKNOWN";
}
function segmentQuestions(document2) {
  const candidates = [];
  let current = [], currentSection, label, index;
  const flush = () => {
    if (!current.length) return;
    const flat = current.flatMap((b) => b.content);
    const math = flat.flatMap((b) => b.type === "math" ? [b.math] : b.type === "table" ? b.cells.flat().flatMap((c) => c.type === "math" ? [c.math] : []) : []);
    const figures = [...new Set(flat.flatMap((b) => b.type === "figure" ? [b.figureId] : b.type === "table" ? b.cells.flat().flatMap((c) => c.type === "figure" ? [c.figureId] : []) : []))];
    candidates.push({ id: `candidate-${candidates.length + 1}`, questionIndex: index, questionLabel: label, section: currentSection, rawBlocks: current, textBlocks: flat, mathBlocks: math, figureAnchors: figures, questionTypeCandidate: typeFor(currentSection, flat), sourceLocations: current.map((b) => b.sourceLocation), parseWarnings: math.flatMap((m) => m.warnings) });
    current = [];
  };
  for (const block of document2.blocks) {
    const value = textOf2(block.content).trim();
    const sectionMatch = section.exec(value);
    if (sectionMatch && (block.kind === "SECTION" || !question.test(value))) {
      flush();
      currentSection = value;
      continue;
    }
    const marker = question.exec(value);
    const structuralStart = Boolean(marker && (marker[1] || block.boldLabel || block.numbering || !current.length && Number(marker[2]) === 1));
    if (structuralStart) {
      flush();
      label = marker[0].trim();
      index = Number(marker[2]);
    }
    if (current.length || structuralStart) current.push(block);
  }
  flush();
  return candidates;
}

// src/modules/question-bank/wmf.ts
var import_node_crypto5 = require("node:crypto");
var import_canvas = require("canvas");

// node_modules/emf-converter/dist/index.mjs
function colorRefToHex(r, g, b) {
  const toHex = (v) => v.toString(16).padStart(2, "0");
  return `#${toHex(r & 255)}${toHex(g & 255)}${toHex(b & 255)}`;
}
function readColorRef(view, offset) {
  const r = view.getUint8(offset);
  const g = view.getUint8(offset + 1);
  const b = view.getUint8(offset + 2);
  return colorRefToHex(r, g, b);
}
function argbToRgba(argb) {
  const a = (argb >>> 24 & 255) / 255;
  const r = argb >>> 16 & 255;
  const g = argb >>> 8 & 255;
  const b = argb & 255;
  return `rgba(${r},${g},${b},${a.toFixed(3)})`;
}
function lerpArgbToRgba(argbA, argbB, t) {
  const tc = Math.min(1, Math.max(0, t));
  const mix = (a2, b22) => Math.round(a2 + (b22 - a2) * tc);
  const aA = argbA >>> 24 & 255;
  const aB = argbB >>> 24 & 255;
  const r = mix(argbA >>> 16 & 255, argbB >>> 16 & 255);
  const g = mix(argbA >>> 8 & 255, argbB >>> 8 & 255);
  const b = mix(argbA & 255, argbB & 255);
  const a = mix(aA, aB) / 255;
  return `rgba(${r},${g},${b},${a.toFixed(3)})`;
}
function invertCssColor(color) {
  const hex = /^#([0-9a-f]{6})$/i.exec(color);
  if (hex) {
    const v = parseInt(hex[1], 16);
    const inv = 16777215 ^ v;
    return `#${inv.toString(16).padStart(6, "0")}`;
  }
  const shortHex = /^#([0-9a-f]{3})$/i.exec(color);
  if (shortHex) {
    const [r, g, b] = shortHex[1].split("").map((c) => parseInt(c + c, 16));
    const toHex = (v) => (255 - v).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  const rgba = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(color);
  if (rgba) {
    const r = 255 - Math.min(255, parseInt(rgba[1], 10));
    const g = 255 - Math.min(255, parseInt(rgba[2], 10));
    const b = 255 - Math.min(255, parseInt(rgba[3], 10));
    return rgba[4] !== void 0 ? `rgba(${r},${g},${b},${rgba[4]})` : `rgb(${r},${g},${b})`;
  }
  return color;
}
var EMR_HEADER = 1;
var EMR_POLYBEZIER = 2;
var EMR_POLYGON = 3;
var EMR_POLYLINE = 4;
var EMR_POLYBEZIERTO = 5;
var EMR_POLYLINETO = 6;
var EMR_POLYPOLYLINE = 7;
var EMR_POLYPOLYGON = 8;
var EMR_SETWINDOWEXTEX = 9;
var EMR_SETWINDOWORGEX = 10;
var EMR_SETVIEWPORTEXTEX = 11;
var EMR_SETVIEWPORTORGEX = 12;
var EMR_SETBRUSHORGEX = 13;
var EMR_EOF = 14;
var EMR_SETPIXELV = 15;
var EMR_SETMAPMODE = 17;
var EMR_SETBKMODE = 18;
var EMR_SETPOLYFILLMODE = 19;
var EMR_SETROP2 = 20;
var EMR_SETSTRETCHBLTMODE = 21;
var R2_BLACK = 1;
var R2_NOTMERGEPEN = 2;
var R2_MASKNOTPEN = 3;
var R2_NOTCOPYPEN = 4;
var R2_MASKPENNOT = 5;
var R2_NOT = 6;
var R2_XORPEN = 7;
var R2_NOTMASKPEN = 8;
var R2_MASKPEN = 9;
var R2_NOTXORPEN = 10;
var R2_NOP = 11;
var R2_MERGENOTPEN = 12;
var R2_MERGEPENNOT = 14;
var R2_MERGEPEN = 15;
var R2_WHITE = 16;
var MAX_CANVAS_DIMENSION = 8192;
var MAX_RECORDS_DEFAULT = 2e5;
var MAX_RECORDS_EMFPLUS_DEFAULT = 5e5;
var EMR_SETTEXTALIGN = 22;
var EMR_SETTEXTCOLOR = 24;
var EMR_SETBKCOLOR = 25;
var EMR_OFFSETCLIPRGN = 26;
var EMR_MOVETOEX = 27;
var EMR_SETMETARGN = 28;
var EMR_EXCLUDECLIPRECT = 29;
var EMR_INTERSECTCLIPRECT = 30;
var EMR_SCALEVIEWPORTEXTEX = 31;
var EMR_SCALEWINDOWEXTEX = 32;
var EMR_SAVEDC = 33;
var EMR_RESTOREDC = 34;
var EMR_SETWORLDTRANSFORM = 35;
var EMR_MODIFYWORLDTRANSFORM = 36;
var EMR_SELECTOBJECT = 37;
var EMR_CREATEPEN = 38;
var EMR_CREATEBRUSHINDIRECT = 39;
var EMR_DELETEOBJECT = 40;
var EMR_ELLIPSE = 42;
var EMR_RECTANGLE = 43;
var EMR_ROUNDRECT = 44;
var EMR_ARC = 45;
var EMR_CHORD = 46;
var EMR_PIE = 47;
var EMR_LINETO = 54;
var EMR_ARCTO = 55;
var EMR_SETMITERLIMIT = 58;
var EMR_BEGINPATH = 59;
var EMR_ENDPATH = 60;
var EMR_CLOSEFIGURE = 61;
var EMR_FILLPATH = 62;
var EMR_STROKEANDFILLPATH = 63;
var EMR_STROKEPATH = 64;
var EMR_SELECTCLIPPATH = 67;
var EMR_COMMENT = 70;
var EMR_EXTSELECTCLIPRGN = 75;
var EMR_BITBLT = 76;
var EMR_STRETCHDIBITS = 81;
var EMR_EXTCREATEFONTINDIRECTW = 82;
var EMR_EXTTEXTOUTW = 84;
var EMR_POLYBEZIER16 = 85;
var EMR_POLYGON16 = 86;
var EMR_POLYLINE16 = 87;
var EMR_POLYBEZIERTO16 = 88;
var EMR_POLYLINETO16 = 89;
var EMR_POLYPOLYGON16 = 91;
var EMR_EXTCREATEPEN = 95;
var EMR_SETICMMODE = 98;
var EMR_SETLAYOUT = 115;
var STOCK_OBJECT_BASE = 2147483648;
var EMFPLUS_SIGNATURE = 726027589;
var EMR_COMMENT_PUBLIC_SIGNATURE = 1128875079;
var EMFPLUS_HEADER = 16385;
var EMFPLUS_ENDOFFILE = 16386;
var EMFPLUS_GETDC = 16388;
var EMFPLUS_OBJECT = 16392;
var EMFPLUS_FILLRECTS = 16394;
var EMFPLUS_DRAWRECTS = 16395;
var EMFPLUS_FILLPOLYGON = 16396;
var EMFPLUS_DRAWLINES = 16397;
var EMFPLUS_FILLELLIPSE = 16398;
var EMFPLUS_DRAWELLIPSE = 16399;
var EMFPLUS_FILLPIE = 16400;
var EMFPLUS_DRAWPIE = 16401;
var EMFPLUS_DRAWARC = 16402;
var EMFPLUS_FILLPATH = 16404;
var EMFPLUS_DRAWPATH = 16405;
var EMFPLUS_DRAWIMAGE = 16410;
var EMFPLUS_DRAWIMAGEPOINTS = 16411;
var EMFPLUS_DRAWSTRING = 16412;
var EMFPLUS_SETANTIALIASMODE = 16414;
var EMFPLUS_SETTEXTRENDERINGHINT = 16415;
var EMFPLUS_SETINTERPOLATIONMODE = 16417;
var EMFPLUS_SETPIXELOFFSETMODE = 16418;
var EMFPLUS_SETCOMPOSITINGQUALITY = 16420;
var EMFPLUS_SAVE = 16421;
var EMFPLUS_RESTORE = 16422;
var EMFPLUS_BEGINCONTAINERNOPARAMS = 16424;
var EMFPLUS_ENDCONTAINER = 16425;
var EMFPLUS_SETWORLDTRANSFORM = 16426;
var EMFPLUS_RESETWORLDTRANSFORM = 16427;
var EMFPLUS_MULTIPLYWORLDTRANSFORM = 16428;
var EMFPLUS_TRANSLATEWORLDTRANSFORM = 16429;
var EMFPLUS_SCALEWORLDTRANSFORM = 16430;
var EMFPLUS_ROTATEWORLDTRANSFORM = 16431;
var EMFPLUS_SETPAGETRANSFORM = 16432;
var EMFPLUS_RESETCLIP = 16433;
var EMFPLUS_SETCLIPRECT = 16434;
var EMFPLUS_SETCLIPPATH = 16435;
var EMFPLUS_SETCLIPREGION = 16436;
var EMFPLUS_DRAWDRIVERSTRING = 16438;
var EMFPLUS_OFFSETCLIP = 16437;
var EMFPLUS_OBJECTTYPE_BRUSH = 1;
var EMFPLUS_OBJECTTYPE_PEN = 2;
var EMFPLUS_OBJECTTYPE_PATH = 3;
var EMFPLUS_OBJECTTYPE_IMAGEATTRIBUTES = 4;
var EMFPLUS_OBJECTTYPE_IMAGE = 5;
var EMFPLUS_OBJECTTYPE_FONT = 6;
var EMFPLUS_OBJECTTYPE_STRINGFORMAT = 7;
var EMFPLUS_OBJECTTYPE_REGION = 8;
var EMFPLUS_BRUSHTYPE_SOLID = 0;
var EMFPLUS_BRUSHTYPE_HATCHFILL = 1;
var EMFPLUS_BRUSHTYPE_PATHGRADIENT = 3;
var EMFPLUS_BRUSHTYPE_LINEARGRADIENT = 4;
var META_EOF = 0;
var META_SETBKCOLOR = 513;
var META_SETBKMODE = 258;
var META_SETROP2 = 260;
var META_SETPOLYFILLMODE = 262;
var META_SETTEXTCOLOR = 521;
var META_SETTEXTALIGN = 302;
var META_SETWINDOWORG = 523;
var META_SETWINDOWEXT = 524;
var META_MOVETO = 532;
var META_LINETO = 531;
var META_RECTANGLE = 1051;
var META_ROUNDRECT = 1564;
var META_ELLIPSE = 1048;
var META_ARC = 2071;
var META_PIE = 2074;
var META_CHORD = 2096;
var META_POLYGON = 804;
var META_POLYLINE = 805;
var META_SELECTOBJECT = 301;
var META_DELETEOBJECT = 496;
var META_CREATEPENINDIRECT = 762;
var META_CREATEBRUSHINDIRECT = 764;
var META_CREATEFONTINDIRECT = 763;
var META_TEXTOUT = 1313;
var META_EXTTEXTOUT = 2610;
var META_SAVEDC = 30;
var META_RESTOREDC = 295;
var META_POLYPOLYGON = 1336;
var emfLog = (...args) => {
};
var emfWarn = (...args) => {
};
var DEFAULT_DPI_SCALE = 1;
function createCanvas(width, height, maxWidth, maxHeight, dpiScale = DEFAULT_DPI_SCALE, maxCanvasDimension = MAX_CANVAS_DIMENSION) {
  const effectiveScale = Math.max(1, Math.min(dpiScale, 4));
  let w = Math.round(width * effectiveScale);
  let h = Math.round(height * effectiveScale);
  let scaleX = effectiveScale;
  let scaleY = effectiveScale;
  if (maxWidth && w > maxWidth) {
    const factor = maxWidth / w;
    w = maxWidth;
    h = Math.round(h * factor);
    scaleX *= factor;
    scaleY *= factor;
  }
  if (maxHeight && h > maxHeight) {
    const factor = maxHeight / h;
    w = Math.round(w * factor);
    h = maxHeight;
    scaleX *= factor;
    scaleY *= factor;
  }
  const dimCap = Math.max(1, Math.floor(maxCanvasDimension));
  const clampedW = Math.max(1, Math.min(w, dimCap));
  const clampedH = Math.max(1, Math.min(h, dimCap));
  if (clampedW !== w || clampedH !== h) {
    console.warn(
      `[emf-converter] Canvas size clamped from ${w}\xD7${h} to ${clampedW}\xD7${clampedH}. Output may lose detail.`
    );
  }
  w = clampedW;
  h = clampedH;
  try {
    if (typeof OffscreenCanvas !== "undefined") {
      emfLog(
        `createCanvas: using OffscreenCanvas ${w}\xD7${h}, scale=(${scaleX.toFixed(3)},${scaleY.toFixed(3)})`
      );
      const canvas2 = new OffscreenCanvas(w, h);
      const ctx2 = canvas2.getContext("2d");
      if (!ctx2) {
        emfWarn('createCanvas: OffscreenCanvas.getContext("2d") returned null');
        return null;
      }
      return { canvas: canvas2, ctx: ctx2, scaleX, scaleY };
    }
    if (typeof document === "undefined") {
      emfWarn("createCanvas: no OffscreenCanvas and no document \u2014 cannot create canvas");
      return null;
    }
    emfLog(
      `createCanvas: using HTMLCanvasElement ${w}\xD7${h}, scale=(${scaleX.toFixed(3)},${scaleY.toFixed(3)})`
    );
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      emfWarn('createCanvas: HTMLCanvasElement.getContext("2d") returned null');
      return null;
    }
    return { canvas, ctx, scaleX, scaleY };
  } catch (err2) {
    return null;
  }
}
function createTempCanvas(width, height) {
  if (width <= 0 || height <= 0) {
    return null;
  }
  width = Math.max(1, Math.min(Math.floor(width), MAX_CANVAS_DIMENSION));
  height = Math.max(1, Math.min(Math.floor(height), MAX_CANVAS_DIMENSION));
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }
    return { canvas, ctx };
  }
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }
    return { canvas, ctx };
  }
  return null;
}
function rop2Paint(rop2) {
  switch (rop2) {
    case R2_BLACK:
      return { gco: "source-over", colorTransform: "black", exact: true };
    case R2_WHITE:
      return { gco: "source-over", colorTransform: "white", exact: true };
    case R2_NOP:
      return { gco: "source-over", colorTransform: "skip", exact: true };
    case R2_NOTCOPYPEN:
      return { gco: "source-over", colorTransform: "invert", exact: true };
    case R2_NOT:
      return { gco: "difference", colorTransform: "white", exact: true };
    case R2_XORPEN:
    case R2_MASKPENNOT:
      return { gco: "difference", colorTransform: "none", exact: false };
    case R2_NOTXORPEN:
      return { gco: "difference", colorTransform: "invert", exact: false };
    case R2_MASKPEN:
      return { gco: "darken", colorTransform: "none", exact: false };
    case R2_MASKNOTPEN:
    case R2_NOTMERGEPEN:
      return { gco: "darken", colorTransform: "invert", exact: false };
    case R2_MERGEPEN:
    case R2_MERGEPENNOT:
      return { gco: "lighten", colorTransform: "none", exact: false };
    case R2_MERGENOTPEN:
    case R2_NOTMASKPEN:
      return { gco: "lighten", colorTransform: "invert", exact: false };
    default:
      return { gco: "source-over", colorTransform: "none", exact: true };
  }
}
function rop2TransformColor(color, transform) {
  switch (transform) {
    case "invert":
      return invertCssColor(color);
    case "black":
      return "#000000";
    case "white":
      return "#ffffff";
    case "skip":
      return "rgba(0,0,0,0)";
    default:
      return color;
  }
}
function applyPen(ctx, state) {
  const paint = rop2Paint(state.rop2);
  ctx.globalCompositeOperation = paint.gco;
  if (state.penStyle === 5) {
    ctx.strokeStyle = "rgba(0,0,0,0)";
    ctx.lineWidth = 0;
    return;
  }
  ctx.strokeStyle = rop2TransformColor(state.penColor, paint.colorTransform);
  ctx.lineWidth = Math.max(state.penWidth, 1);
  switch (state.penStyle) {
    case 1:
      ctx.setLineDash([8, 4]);
      break;
    case 2:
      ctx.setLineDash([2, 2]);
      break;
    case 3:
      ctx.setLineDash([8, 4, 2, 4]);
      break;
    case 4:
      ctx.setLineDash([8, 4, 2, 4, 2, 4]);
      break;
    default:
      ctx.setLineDash([]);
      break;
  }
}
function applyBrush(ctx, state) {
  const paint = rop2Paint(state.rop2);
  ctx.globalCompositeOperation = paint.gco;
  if (state.brushStyle === 1) {
    ctx.fillStyle = "rgba(0,0,0,0)";
    return;
  }
  ctx.fillStyle = rop2TransformColor(state.brushColor, paint.colorTransform);
}
function cssFontWeight(weight) {
  if (!weight || weight === 400) {
    return "";
  }
  const rounded = Math.round(weight / 100) * 100;
  if (rounded === 700) {
    return "bold";
  }
  if (rounded >= 100 && rounded <= 900) {
    return String(rounded);
  }
  return weight >= 700 ? "bold" : "";
}
function mapFontFamily(face, map) {
  const resolved = map?.[face.toLowerCase().trim()] ?? face;
  if (/[\s,]/.test(resolved) && !/^["']/.test(resolved)) {
    return `"${resolved}"`;
  }
  return resolved;
}
function fontSizePx(state, scale = 1) {
  return Math.max(Math.abs(state.fontHeight) * Math.abs(scale || 1), 8);
}
function applyFont(ctx, state, scale = 1) {
  const italic = state.fontItalic ? "italic " : "";
  const weight = cssFontWeight(state.fontWeight);
  const weightPart = weight ? `${weight} ` : "";
  const size = fontSizePx(state, scale);
  const family = mapFontFamily(state.fontFamily, state.fontFamilyMap);
  ctx.font = `${italic}${weightPart}${size}px ${family}`;
}
function drawTextDecorations(ctx, state, x, y, width, scale = 1) {
  if (!state.fontUnderline && !state.fontStrikeOut) {
    return;
  }
  const size = fontSizePx(state, scale);
  const thickness = Math.max(1, Math.round(size / 14));
  const prevFill = ctx.fillStyle;
  ctx.fillStyle = state.textColor;
  if (state.fontUnderline) {
    ctx.fillRect(x, y + Math.round(size * 0.12), width, thickness);
  }
  if (state.fontStrikeOut) {
    ctx.fillRect(x, y - Math.round(size * 0.3), width, thickness);
  }
  ctx.fillStyle = prevFill;
}
function readUtf16LE(view, offset, charCount) {
  if (charCount <= 0) {
    return "";
  }
  const maxBytes = view.byteLength - offset;
  if (maxBytes <= 0) {
    return "";
  }
  const usableChars = Math.min(charCount, Math.floor(maxBytes / 2));
  if (usableChars <= 0) {
    return "";
  }
  let decoded;
  try {
    const bytes = new Uint8Array(view.buffer, view.byteOffset + offset, usableChars * 2);
    decoded = new TextDecoder("utf-16le").decode(bytes);
  } catch {
    const chars = [];
    for (let i = 0; i < usableChars; i++) {
      const code = view.getUint16(offset + i * 2, true);
      if (code === 0) {
        return chars.join("");
      }
      chars.push(String.fromCharCode(code));
    }
    return chars.join("");
  }
  const nul = decoded.indexOf(String.fromCharCode(0));
  return nul === -1 ? decoded : decoded.slice(0, nul);
}
function getStockObject(index) {
  switch (index) {
    case 0:
      return { kind: "brush", style: 0, color: "#ffffff" };
    case 1:
      return { kind: "brush", style: 0, color: "#c0c0c0" };
    case 2:
      return { kind: "brush", style: 0, color: "#808080" };
    case 3:
      return { kind: "brush", style: 0, color: "#404040" };
    case 4:
      return { kind: "brush", style: 0, color: "#000000" };
    case 5:
      return { kind: "brush", style: 1, color: "#000000" };
    case 6:
      return { kind: "pen", style: 0, widthX: 1, color: "#ffffff" };
    case 7:
      return { kind: "pen", style: 0, widthX: 1, color: "#000000" };
    case 8:
      return { kind: "pen", style: 5, widthX: 0, color: "#000000" };
    case 10:
    case 11:
      return {
        kind: "font",
        height: 12,
        weight: 400,
        italic: false,
        underline: false,
        strikeOut: false,
        family: "monospace"
      };
    case 12:
    case 13:
    case 14:
    case 17:
      return {
        kind: "font",
        height: 12,
        weight: 400,
        italic: false,
        underline: false,
        strikeOut: false,
        family: "sans-serif"
      };
    default:
      return null;
  }
}
async function blobToDataUrl(blob) {
  return new Promise((resolve2, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve2(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
async function exportCanvasToPngDataUrl(canvas) {
  if (typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas) {
    emfLog(
      `exportCanvasToPngDataUrl: using OffscreenCanvas.convertToBlob (${canvas.width}\xD7${canvas.height})`
    );
    const blob = await canvas.convertToBlob({ type: "image/png" });
    emfLog(`exportCanvasToPngDataUrl: blob size=${blob.size} bytes, type=${blob.type}`);
    return blobToDataUrl(blob);
  }
  if (typeof HTMLCanvasElement !== "undefined" && canvas instanceof HTMLCanvasElement) {
    emfLog(
      `exportCanvasToPngDataUrl: using HTMLCanvasElement.toDataURL (${canvas.width}\xD7${canvas.height})`
    );
    return canvas.toDataURL("image/png");
  }
  return null;
}
function parseEmfHeader(view) {
  emfLog("parseEmfHeader: byteLength =", view.byteLength);
  if (view.byteLength < 88) {
    return null;
  }
  const recordType = view.getUint32(0, true);
  if (recordType !== EMR_HEADER) {
    return null;
  }
  const boundsLeft = view.getInt32(8, true);
  const boundsTop = view.getInt32(12, true);
  const boundsRight = view.getInt32(16, true);
  const boundsBottom = view.getInt32(20, true);
  const frameLeft = view.getInt32(24, true);
  const frameTop = view.getInt32(28, true);
  const frameRight = view.getInt32(32, true);
  const frameBottom = view.getInt32(36, true);
  const frameW = frameRight - frameLeft;
  const frameH = frameBottom - frameTop;
  return {
    bounds: {
      left: boundsLeft,
      top: boundsTop,
      right: boundsRight,
      bottom: boundsBottom
    },
    frameW,
    frameH
  };
}
function getRenderableEmfBounds(header) {
  const boundsW = header.bounds.right - header.bounds.left;
  const boundsH = header.bounds.bottom - header.bounds.top;
  if (boundsW > 0 && boundsH > 0) {
    return header.bounds;
  }
  if (header.frameW > 0 && header.frameH > 0) {
    emfLog(
      `getRenderableEmfBounds: bounds invalid (${boundsW}\xD7${boundsH}), falling back to frame ${header.frameW}\xD7${header.frameH}`
    );
    return { left: 0, top: 0, right: header.frameW, bottom: header.frameH };
  }
  return null;
}
function parseWmfHeader(view) {
  if (view.byteLength < 22) {
    return null;
  }
  const magic = view.getUint32(0, true);
  let headerOffset = 0;
  let boundsLeft = 0;
  let boundsTop = 0;
  let boundsRight = 800;
  let boundsBottom = 600;
  let unitsPerInch = 96;
  if (magic === 2596720087) {
    boundsLeft = view.getInt16(6, true);
    boundsTop = view.getInt16(8, true);
    boundsRight = view.getInt16(10, true);
    boundsBottom = view.getInt16(12, true);
    unitsPerInch = view.getUint16(14, true) || 96;
    headerOffset = 22;
  }
  if (headerOffset + 18 > view.byteLength) {
    return null;
  }
  const fileType = view.getUint16(headerOffset, true);
  if (fileType !== 1 && fileType !== 2) {
    return null;
  }
  const headerSize = view.getUint16(headerOffset + 2, true) * 2;
  const maxRecordSize = view.getUint32(headerOffset + 8, true) * 2;
  return {
    headerSize: headerOffset + headerSize,
    maxRecordSize,
    boundsLeft,
    boundsTop,
    boundsRight,
    boundsBottom,
    unitsPerInch
  };
}
function gmx(r, x) {
  const wt = r.state.worldTransform;
  const px = wt[0] * x + wt[4];
  if (r.useMappingMode) {
    return (px - r.windowOrg.x) / (r.windowExt.cx || 1) * (r.viewportExt.cx || 1) + r.viewportOrg.x;
  }
  return (px - r.bounds.left) * r.sx;
}
function gmy(r, y) {
  const wt = r.state.worldTransform;
  const py = wt[3] * y + wt[5];
  if (r.useMappingMode) {
    return (py - r.windowOrg.y) / (r.windowExt.cy || 1) * (r.viewportExt.cy || 1) + r.viewportOrg.y;
  }
  return (py - r.bounds.top) * r.sy;
}
function gmw(r, w) {
  const pw = r.state.worldTransform[0] * w;
  if (r.useMappingMode) {
    return pw / (r.windowExt.cx || 1) * (r.viewportExt.cx || 1);
  }
  return pw * r.sx;
}
function gmh(r, h) {
  const ph = r.state.worldTransform[3] * h;
  if (r.useMappingMode) {
    return ph / (r.windowExt.cy || 1) * (r.viewportExt.cy || 1);
  }
  return ph * r.sy;
}
function activateGdiMappingMode(r) {
  r.useMappingMode = true;
}
function handleSetPixelV(rCtx, dataOff, recSize) {
  const { ctx, view } = rCtx;
  if (recSize >= 20) {
    const x = view.getInt32(dataOff, true);
    const y = view.getInt32(dataOff + 4, true);
    const color = readColorRef(view, dataOff + 8);
    ctx.fillStyle = color;
    ctx.fillRect(gmx(rCtx, x), gmy(rCtx, y), 1, 1);
  }
  return true;
}
function handleMoveToEx(rCtx, dataOff, recSize) {
  const { ctx, view, state, inPath } = rCtx;
  if (recSize >= 16) {
    state.curX = view.getInt32(dataOff, true);
    state.curY = view.getInt32(dataOff + 4, true);
    if (inPath) {
      ctx.moveTo(gmx(rCtx, state.curX), gmy(rCtx, state.curY));
    }
  }
  return true;
}
function handleLineTo(rCtx, dataOff, recSize) {
  const { ctx, view, state, inPath } = rCtx;
  if (recSize >= 16) {
    const lx = view.getInt32(dataOff, true);
    const ly = view.getInt32(dataOff + 4, true);
    if (inPath) {
      ctx.lineTo(gmx(rCtx, lx), gmy(rCtx, ly));
    } else {
      applyPen(ctx, state);
      ctx.beginPath();
      ctx.moveTo(gmx(rCtx, state.curX), gmy(rCtx, state.curY));
      ctx.lineTo(gmx(rCtx, lx), gmy(rCtx, ly));
      ctx.stroke();
    }
    state.curX = lx;
    state.curY = ly;
  }
  return true;
}
function handleRectangle(rCtx, dataOff, recSize) {
  const { ctx, view, state, inPath } = rCtx;
  if (recSize >= 24) {
    const l = view.getInt32(dataOff, true);
    const t = view.getInt32(dataOff + 4, true);
    const r = view.getInt32(dataOff + 8, true);
    const b = view.getInt32(dataOff + 12, true);
    if (inPath) {
      ctx.rect(gmx(rCtx, l), gmy(rCtx, t), gmw(rCtx, r - l), gmh(rCtx, b - t));
    } else {
      applyBrush(ctx, state);
      ctx.fillRect(gmx(rCtx, l), gmy(rCtx, t), gmw(rCtx, r - l), gmh(rCtx, b - t));
      applyPen(ctx, state);
      ctx.strokeRect(gmx(rCtx, l), gmy(rCtx, t), gmw(rCtx, r - l), gmh(rCtx, b - t));
    }
  }
  return true;
}
function handleRoundRect(rCtx, dataOff, recSize) {
  const { ctx, view, state, inPath } = rCtx;
  if (recSize >= 32) {
    const l = view.getInt32(dataOff, true);
    const t = view.getInt32(dataOff + 4, true);
    const r = view.getInt32(dataOff + 8, true);
    const b = view.getInt32(dataOff + 12, true);
    const rw = Math.abs(gmw(rCtx, view.getInt32(dataOff + 16, true))) / 2;
    const rh = Math.abs(gmh(rCtx, view.getInt32(dataOff + 20, true))) / 2;
    const x1 = gmx(rCtx, l);
    const y1 = gmy(rCtx, t);
    const w = gmw(rCtx, r - l);
    const h = gmh(rCtx, b - t);
    const drawRoundRect = () => {
      const radius = Math.min(rw, rh, w / 2, h / 2);
      ctx.moveTo(x1 + radius, y1);
      ctx.lineTo(x1 + w - radius, y1);
      ctx.arcTo(x1 + w, y1, x1 + w, y1 + radius, radius);
      ctx.lineTo(x1 + w, y1 + h - radius);
      ctx.arcTo(x1 + w, y1 + h, x1 + w - radius, y1 + h, radius);
      ctx.lineTo(x1 + radius, y1 + h);
      ctx.arcTo(x1, y1 + h, x1, y1 + h - radius, radius);
      ctx.lineTo(x1, y1 + radius);
      ctx.arcTo(x1, y1, x1 + radius, y1, radius);
      ctx.closePath();
    };
    if (inPath) {
      drawRoundRect();
    } else {
      ctx.beginPath();
      drawRoundRect();
      applyBrush(ctx, state);
      ctx.fill();
      applyPen(ctx, state);
      ctx.stroke();
    }
  }
  return true;
}
function handleEllipse(rCtx, dataOff, recSize) {
  const { ctx, view, state, inPath } = rCtx;
  if (recSize >= 24) {
    const l = view.getInt32(dataOff, true);
    const t = view.getInt32(dataOff + 4, true);
    const r = view.getInt32(dataOff + 8, true);
    const b = view.getInt32(dataOff + 12, true);
    const cx = gmx(rCtx, (l + r) / 2);
    const cy = gmy(rCtx, (t + b) / 2);
    const rx = Math.abs(gmw(rCtx, r - l)) / 2;
    const ry = Math.abs(gmh(rCtx, b - t)) / 2;
    if (inPath) {
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    } else {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      applyBrush(ctx, state);
      ctx.fill();
      applyPen(ctx, state);
      ctx.stroke();
    }
  }
  return true;
}
function handleArcFamily(rCtx, recType, dataOff, recSize) {
  const { ctx, view, state, inPath } = rCtx;
  if (recSize >= 40) {
    const l = view.getInt32(dataOff, true);
    const t = view.getInt32(dataOff + 4, true);
    const r = view.getInt32(dataOff + 8, true);
    const b = view.getInt32(dataOff + 12, true);
    const startX = view.getInt32(dataOff + 16, true);
    const startY = view.getInt32(dataOff + 20, true);
    const endX = view.getInt32(dataOff + 24, true);
    const endY = view.getInt32(dataOff + 28, true);
    const cxA = (l + r) / 2;
    const cyA = (t + b) / 2;
    const rx = Math.abs(r - l) / 2;
    const ry = Math.abs(b - t) / 2;
    const startAngle = Math.atan2((startY - cyA) / (ry || 1), (startX - cxA) / (rx || 1));
    const endAngle = Math.atan2((endY - cyA) / (ry || 1), (endX - cxA) / (rx || 1));
    const mcx = gmx(rCtx, cxA);
    const mcy = gmy(rCtx, cyA);
    const mrx = Math.abs(gmw(rCtx, rx));
    const mry = Math.abs(gmh(rCtx, ry));
    const isArcTo = recType === EMR_ARCTO;
    const needsFill = recType === EMR_PIE || recType === EMR_CHORD;
    if (!inPath) {
      ctx.beginPath();
    }
    if (recType === EMR_PIE) {
      ctx.moveTo(mcx, mcy);
    }
    if (isArcTo) {
      ctx.lineTo(mcx + mrx * Math.cos(startAngle), mcy + mry * Math.sin(startAngle));
    }
    ctx.ellipse(mcx, mcy, mrx, mry, 0, startAngle, endAngle, false);
    if (recType === EMR_PIE || recType === EMR_CHORD) {
      ctx.closePath();
    }
    if (!inPath) {
      if (needsFill) {
        applyBrush(ctx, state);
        ctx.fill();
      }
      applyPen(ctx, state);
      ctx.stroke();
    }
    if (isArcTo) {
      state.curX = endX;
      state.curY = endY;
    }
  }
  return true;
}
function handleEmfGdiShapeRecord(rCtx, recType, dataOff, recSize) {
  switch (recType) {
    case EMR_SETPIXELV:
      return handleSetPixelV(rCtx, dataOff, recSize);
    case EMR_MOVETOEX:
      return handleMoveToEx(rCtx, dataOff, recSize);
    case EMR_LINETO:
      return handleLineTo(rCtx, dataOff, recSize);
    case EMR_RECTANGLE:
      return handleRectangle(rCtx, dataOff, recSize);
    case EMR_ROUNDRECT:
      return handleRoundRect(rCtx, dataOff, recSize);
    case EMR_ELLIPSE:
      return handleEllipse(rCtx, dataOff, recSize);
    case EMR_ARC:
    case EMR_ARCTO:
    case EMR_CHORD:
    case EMR_PIE:
      return handleArcFamily(rCtx, recType, dataOff, recSize);
    default:
      return false;
  }
}
var CLIP_HUGE = 1 << 24;
function rectClipShape(x, y, w, h) {
  return { cmds: [{ op: "rect", x, y, w, h }], fillRule: "nonzero", simple: true };
}
function rectsClipShape(rects) {
  return {
    cmds: rects.map((r) => ({ op: "rect", x: r.x, y: r.y, w: r.w, h: r.h })),
    fillRule: "nonzero",
    simple: true
  };
}
function emptyClipShape() {
  return { cmds: [{ op: "rect", x: 0, y: 0, w: 0, h: 0 }], fillRule: "nonzero", simple: true };
}
function translateClipShape(shape, dx, dy) {
  return {
    ...shape,
    cmds: shape.cmds.map((c) => {
      switch (c.op) {
        case "rect":
          return { ...c, x: c.x + dx, y: c.y + dy };
        case "moveTo":
        case "lineTo":
          return { ...c, x: c.x + dx, y: c.y + dy };
        case "bezierCurveTo":
          return {
            ...c,
            cp1x: c.cp1x + dx,
            cp1y: c.cp1y + dy,
            cp2x: c.cp2x + dx,
            cp2y: c.cp2y + dy,
            x: c.x + dx,
            y: c.y + dy
          };
        case "closePath":
          return c;
      }
    })
  };
}
function translateClipRegion(region, dx, dy) {
  if (!region) {
    return null;
  }
  return region.map((s) => translateClipShape(s, dx, dy));
}
function isComposable(shape) {
  return shape.simple && shape.fillRule === "nonzero";
}
function invertClipShape(shape) {
  return {
    cmds: [
      { op: "rect", x: -CLIP_HUGE, y: -CLIP_HUGE, w: 2 * CLIP_HUGE, h: 2 * CLIP_HUGE },
      ...shape.cmds
    ],
    fillRule: "evenodd",
    simple: false
  };
}
function combineClip(current, shape, op) {
  switch (op) {
    case "replace":
      return { region: [shape], exact: true };
    case "intersect":
      return { region: current ? [...current, shape] : [shape], exact: true };
    case "exclude": {
      if (!isComposable(shape)) {
        return { region: current ? [...current, shape] : [shape], exact: false };
      }
      const inv = invertClipShape(shape);
      return { region: current ? [...current, inv] : [inv], exact: true };
    }
    case "union": {
      if (!current) {
        return { region: null, exact: true };
      }
      if (current.length === 1 && isComposable(current[0]) && isComposable(shape)) {
        return {
          region: [
            { cmds: [...current[0].cmds, ...shape.cmds], fillRule: "nonzero", simple: false }
          ],
          exact: false
        };
      }
      return { region: current, exact: false };
    }
    case "xor": {
      if (!current) {
        if (isComposable(shape)) {
          return { region: [invertClipShape(shape)], exact: true };
        }
        return { region: [shape], exact: false };
      }
      if (current.length === 1 && isComposable(current[0]) && isComposable(shape)) {
        return {
          region: [
            { cmds: [...current[0].cmds, ...shape.cmds], fillRule: "evenodd", simple: false }
          ],
          exact: true
        };
      }
      if (isComposable(shape)) {
        return { region: [...current, invertClipShape(shape)], exact: false };
      }
      return { region: [...current, shape], exact: false };
    }
    case "complement": {
      if (!current) {
        return { region: [emptyClipShape()], exact: true };
      }
      if (current.length === 1 && isComposable(current[0])) {
        return { region: [shape, invertClipShape(current[0])], exact: true };
      }
      return { region: [shape], exact: false };
    }
  }
}
function combineClipRegions(current, incoming, op) {
  if (op === "replace") {
    return { region: incoming, exact: true };
  }
  if (incoming && incoming.length === 1) {
    return combineClip(current, incoming[0], op);
  }
  if (!incoming) {
    switch (op) {
      case "intersect":
        return { region: current, exact: true };
      case "union":
        return { region: null, exact: true };
      case "exclude":
        return { region: [emptyClipShape()], exact: true };
      case "xor":
      case "complement": {
        if (!current) {
          return { region: [emptyClipShape()], exact: true };
        }
        if (current.length === 1) {
          return combineClip(null, current[0], "exclude");
        }
        return { region: current, exact: false };
      }
    }
  }
  switch (op) {
    case "intersect":
      return { region: current ? [...current, ...incoming] : incoming, exact: true };
    case "union":
      return { region: current, exact: false };
    case "xor":
      return { region: current ?? incoming, exact: false };
    case "exclude":
      return { region: current, exact: false };
    case "complement": {
      if (!current) {
        return { region: [emptyClipShape()], exact: true };
      }
      if (current.length === 1) {
        return combineClip(incoming, current[0], "exclude");
      }
      return { region: incoming, exact: false };
    }
  }
}
function replayClipCmds(ctx, cmds) {
  for (const c of cmds) {
    switch (c.op) {
      case "rect":
        ctx.rect(c.x, c.y, c.w, c.h);
        break;
      case "moveTo":
        ctx.moveTo(c.x, c.y);
        break;
      case "lineTo":
        ctx.lineTo(c.x, c.y);
        break;
      case "bezierCurveTo":
        ctx.bezierCurveTo(c.cp1x, c.cp1y, c.cp2x, c.cp2y, c.x, c.y);
        break;
      case "closePath":
        ctx.closePath();
        break;
    }
  }
}
function applyClipShapes(ctx, shapes) {
  for (const s of shapes) {
    ctx.beginPath();
    replayClipCmds(ctx, s.cmds);
    try {
      ctx.clip(s.fillRule);
    } catch {
    }
  }
}
function reapplyClipRegion(holder, region, identityTransform = false) {
  const { ctx } = holder;
  while (holder.clipSaveDepth > 0) {
    ctx.restore();
    holder.clipSaveDepth--;
  }
  if (region) {
    ctx.save();
    holder.clipSaveDepth = 1;
    if (identityTransform) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    applyClipShapes(ctx, region);
  }
}
function decodeRleBitmap(view, bitsOffset, bitsSize, width, height, _topDown, isRle4, colorTable, out, setPixel) {
  let x = 0;
  let y = height - 1;
  let off = bitsOffset;
  const endOff = bitsOffset + bitsSize;
  while (off + 1 < endOff && y >= 0) {
    const first = view.getUint8(off);
    const second = view.getUint8(off + 1);
    off += 2;
    if (first === 0) {
      if (second === 0) {
        x = 0;
        y--;
      } else if (second === 1) {
        break;
      } else if (second === 2) {
        if (off + 1 >= endOff) {
          break;
        }
        x += view.getUint8(off);
        y -= view.getUint8(off + 1);
        off += 2;
      } else {
        const count = second;
        if (!isRle4) {
          for (let i = 0; i < count && off < endOff && x < width; i++) {
            const idx = view.getUint8(off++);
            if (idx < colorTable.length) {
              setPixel(
                x,
                height - 1 - y,
                colorTable[idx][0],
                colorTable[idx][1],
                colorTable[idx][2],
                255
              );
            }
            x++;
          }
          if (count & 1) {
            off++;
          }
        } else {
          const bytes = Math.ceil(count / 2);
          let pi = 0;
          for (let i = 0; i < bytes && off < endOff; i++) {
            const byte = view.getUint8(off++);
            for (let nibble = 0; nibble < 2 && pi < count; nibble++) {
              const idx = nibble === 0 ? byte >> 4 & 15 : byte & 15;
              if (idx < colorTable.length && x < width) {
                setPixel(
                  x,
                  height - 1 - y,
                  colorTable[idx][0],
                  colorTable[idx][1],
                  colorTable[idx][2],
                  255
                );
              }
              x++;
              pi++;
            }
          }
          if (bytes & 1) {
            off++;
          }
        }
      }
    } else if (!isRle4) {
      const idx = second;
      const c = idx < colorTable.length ? colorTable[idx] : [0, 0, 0];
      for (let i = 0; i < first && x < width; i++) {
        setPixel(x, height - 1 - y, c[0], c[1], c[2], 255);
        x++;
      }
    } else {
      const hi = second >> 4 & 15;
      const lo = second & 15;
      for (let i = 0; i < first && x < width; i++) {
        const idx = (i & 1) === 0 ? hi : lo;
        if (idx < colorTable.length) {
          setPixel(
            x,
            height - 1 - y,
            colorTable[idx][0],
            colorTable[idx][1],
            colorTable[idx][2],
            255
          );
        }
        x++;
      }
    }
  }
  return new ImageData(
    new Uint8ClampedArray(out.buffer, out.byteOffset, out.byteLength),
    width,
    height
  );
}
function countTrailingZeros(v) {
  if (v === 0) {
    return 0;
  }
  let c = 0;
  let val = v;
  while ((val & 1) === 0) {
    val >>>= 1;
    c++;
  }
  return c;
}
var BI_BITFIELDS = 3;
function parseBitfieldMasks(view, bmiOffset, headerSize, compression, bitCount) {
  let rMask = 0, gMask = 0, bMask = 0;
  let rShift = 0, gShift = 0, bShift = 0;
  let rMax = 1, gMax = 1, bMax = 1;
  if (compression === BI_BITFIELDS) {
    const bfOff = bmiOffset + headerSize;
    if (bfOff + 12 > view.byteLength) {
      return null;
    }
    rMask = view.getUint32(bfOff, true);
    gMask = view.getUint32(bfOff + 4, true);
    bMask = view.getUint32(bfOff + 8, true);
    rShift = countTrailingZeros(rMask);
    gShift = countTrailingZeros(gMask);
    bShift = countTrailingZeros(bMask);
    rMax = rMask >>> rShift || 1;
    gMax = gMask >>> gShift || 1;
    bMax = bMask >>> bShift || 1;
  } else if (bitCount === 16) {
    rMask = 31744;
    gMask = 992;
    bMask = 31;
    rShift = 10;
    gShift = 5;
    bShift = 0;
    rMax = 31;
    gMax = 31;
    bMax = 31;
  }
  return { rMask, gMask, bMask, rShift, gShift, bShift, rMax, gMax, bMax };
}
function decodeUncompressedRows(view, bitsOffset, width, height, topDown, bitCount, colorTable, masks, out) {
  const rowStride = Math.floor((bitCount * width + 31) / 32) * 4;
  const { rMask, gMask, bMask, rShift, gShift, bShift, rMax, gMax, bMax } = masks;
  for (let y = 0; y < height; y++) {
    const srcY = topDown ? y : height - 1 - y;
    const rowStart = bitsOffset + srcY * rowStride;
    if (rowStart + rowStride > view.byteLength) {
      continue;
    }
    for (let x = 0; x < width; x++) {
      const dstPx = (y * width + x) * 4;
      if (bitCount === 1) {
        const byteIdx = rowStart + (x >> 3);
        const bit = view.getUint8(byteIdx) >> 7 - (x & 7) & 1;
        if (bit < colorTable.length) {
          out[dstPx] = colorTable[bit][0];
          out[dstPx + 1] = colorTable[bit][1];
          out[dstPx + 2] = colorTable[bit][2];
        }
        out[dstPx + 3] = 255;
      } else if (bitCount === 4) {
        const byteIdx = rowStart + (x >> 1);
        const nibble = (x & 1) === 0 ? view.getUint8(byteIdx) >> 4 & 15 : view.getUint8(byteIdx) & 15;
        if (nibble < colorTable.length) {
          out[dstPx] = colorTable[nibble][0];
          out[dstPx + 1] = colorTable[nibble][1];
          out[dstPx + 2] = colorTable[nibble][2];
        }
        out[dstPx + 3] = 255;
      } else if (bitCount === 8) {
        const idx = view.getUint8(rowStart + x);
        if (idx < colorTable.length) {
          out[dstPx] = colorTable[idx][0];
          out[dstPx + 1] = colorTable[idx][1];
          out[dstPx + 2] = colorTable[idx][2];
        }
        out[dstPx + 3] = 255;
      } else if (bitCount === 16) {
        const val = view.getUint16(rowStart + x * 2, true);
        out[dstPx] = Math.round(((val & rMask) >>> rShift) * 255 / rMax);
        out[dstPx + 1] = Math.round(((val & gMask) >>> gShift) * 255 / gMax);
        out[dstPx + 2] = Math.round(((val & bMask) >>> bShift) * 255 / bMax);
        out[dstPx + 3] = 255;
      } else if (bitCount === 24) {
        const srcPx = rowStart + x * 3;
        out[dstPx] = view.getUint8(srcPx + 2);
        out[dstPx + 1] = view.getUint8(srcPx + 1);
        out[dstPx + 2] = view.getUint8(srcPx);
        out[dstPx + 3] = 255;
      } else {
        const srcPx = rowStart + x * 4;
        const bb = view.getUint8(srcPx);
        const gg = view.getUint8(srcPx + 1);
        const rr = view.getUint8(srcPx + 2);
        const aa = view.getUint8(srcPx + 3);
        out[dstPx] = rr;
        out[dstPx + 1] = gg;
        out[dstPx + 2] = bb;
        out[dstPx + 3] = aa === 0 ? 255 : aa;
      }
    }
  }
}
function decodeDibToImageData(view, bmiOffset, bitsOffset, bitsSize) {
  if (bmiOffset < 0 || bitsOffset < 0 || bmiOffset + 40 > view.byteLength || bitsOffset + bitsSize > view.byteLength) {
    return null;
  }
  const headerSize = view.getUint32(bmiOffset, true);
  if (headerSize < 40 || bmiOffset + headerSize > view.byteLength) {
    return null;
  }
  const width = view.getInt32(bmiOffset + 4, true);
  const heightRaw = view.getInt32(bmiOffset + 8, true);
  const planes = view.getUint16(bmiOffset + 12, true);
  const bitCount = view.getUint16(bmiOffset + 14, true);
  const compression = view.getUint32(bmiOffset + 16, true);
  if (planes !== 1 || width <= 0 || heightRaw === 0) {
    return null;
  }
  if (width > 8192 || Math.abs(heightRaw) > 8192) {
    return null;
  }
  const BI_RGB = 0;
  const BI_RLE8 = 1;
  const BI_RLE4 = 2;
  const BI_BITFIELDS2 = 3;
  if (bitCount !== 1 && bitCount !== 4 && bitCount !== 8 && bitCount !== 16 && bitCount !== 24 && bitCount !== 32) {
    return null;
  }
  if (compression === BI_RLE8 && bitCount !== 8) {
    return null;
  }
  if (compression === BI_RLE4 && bitCount !== 4) {
    return null;
  }
  if (compression === BI_BITFIELDS2 && bitCount !== 16 && bitCount !== 32) {
    return null;
  }
  if (compression !== BI_RGB && compression !== BI_RLE8 && compression !== BI_RLE4 && compression !== BI_BITFIELDS2) {
    return null;
  }
  const height = Math.abs(heightRaw);
  const topDown = heightRaw < 0;
  const colorTable = [];
  if (bitCount <= 8) {
    const maxColors = 1 << bitCount;
    const colorsUsed = view.getUint32(bmiOffset + 32, true) || maxColors;
    const numColors = Math.min(colorsUsed, maxColors);
    const ctOffset = bmiOffset + headerSize;
    if (ctOffset + numColors * 4 > view.byteLength) {
      return null;
    }
    for (let i = 0; i < numColors; i++) {
      const b = view.getUint8(ctOffset + i * 4);
      const g = view.getUint8(ctOffset + i * 4 + 1);
      const r = view.getUint8(ctOffset + i * 4 + 2);
      colorTable.push([r, g, b]);
    }
  }
  const masks = parseBitfieldMasks(view, bmiOffset, headerSize, compression, bitCount);
  if (!masks) {
    return null;
  }
  const out = new Uint8ClampedArray(width * height * 4);
  if (compression === BI_RLE8 || compression === BI_RLE4) {
    const setPixel = (x, y, r, g, b, a) => {
      const dstPx = (y * width + x) * 4;
      out[dstPx] = r;
      out[dstPx + 1] = g;
      out[dstPx + 2] = b;
      out[dstPx + 3] = a;
    };
    return decodeRleBitmap(
      view,
      bitsOffset,
      bitsSize,
      width,
      height,
      topDown,
      compression === BI_RLE4,
      colorTable,
      out,
      setPixel
    );
  }
  decodeUncompressedRows(
    view,
    bitsOffset,
    width,
    height,
    topDown,
    bitCount,
    colorTable,
    masks,
    out
  );
  return new ImageData(out, width, height);
}
function handleExtTextOutW(rCtx, offset, dataOff, recSize) {
  const { ctx, view, state } = rCtx;
  if (recSize >= 76) {
    const refX = view.getInt32(dataOff + 28, true);
    const refY = view.getInt32(dataOff + 32, true);
    const nChars = view.getUint32(dataOff + 36, true);
    const offString = view.getUint32(dataOff + 40, true);
    const maxOffset = view.byteLength;
    if (nChars > 0 && offString > 0 && offset + offString + nChars * 2 <= maxOffset) {
      const text = readUtf16LE(view, offset + offString, nChars);
      if (text.length > 0) {
        const fontScale = Math.abs(gmh(rCtx, 1));
        applyFont(ctx, state, fontScale);
        ctx.fillStyle = state.textColor;
        const vAlign = state.textAlign & 24;
        const alignBaseline = vAlign === 24 ? "alphabetic" : vAlign === 8 ? "bottom" : "top";
        let alignHoriz = "left";
        if (state.textAlign & 6) {
          alignHoriz = "center";
        }
        if (state.textAlign & 2) {
          alignHoriz = "right";
        }
        ctx.textBaseline = alignBaseline;
        ctx.textAlign = alignHoriz;
        if (state.bkMode === 2) {
          const measured = ctx.measureText(text);
          const bgH = fontSizePx(state, fontScale);
          ctx.fillStyle = state.bkColor;
          ctx.fillRect(gmx(rCtx, refX), gmy(rCtx, refY) - bgH, measured.width, bgH);
          ctx.fillStyle = state.textColor;
        }
        ctx.fillText(text, gmx(rCtx, refX), gmy(rCtx, refY));
        if (state.fontUnderline || state.fontStrikeOut) {
          const w = ctx.measureText(text).width;
          const baseX = gmx(rCtx, refX);
          const startX = alignHoriz === "center" ? baseX - w / 2 : alignHoriz === "right" ? baseX - w : baseX;
          drawTextDecorations(ctx, state, startX, gmy(rCtx, refY), w, fontScale);
        }
      }
    }
  }
  return true;
}
var ROP_PATCOPY = 15728673;
var BS_NULL = 1;
function handleBitBlt(rCtx, offset, dataOff, recSize) {
  const { ctx, view, state } = rCtx;
  if (recSize >= 96) {
    const dstX = view.getInt32(dataOff + 16, true);
    const dstY = view.getInt32(dataOff + 20, true);
    const dstW = view.getInt32(dataOff + 24, true);
    const dstH = view.getInt32(dataOff + 28, true);
    const rop = view.getUint32(dataOff + 32, true);
    const offBmiSrc = view.getUint32(dataOff + 76, true);
    const cbBmiSrc = view.getUint32(dataOff + 80, true);
    const offBitsSrc = view.getUint32(dataOff + 84, true);
    const cbBitsSrc = view.getUint32(dataOff + 88, true);
    if (offBmiSrc === 0 && rop === ROP_PATCOPY) {
      const prevFill = ctx.fillStyle;
      if (state.brushStyle !== BS_NULL) {
        ctx.fillStyle = state.brushColor;
        ctx.fillRect(gmx(rCtx, dstX), gmy(rCtx, dstY), gmw(rCtx, dstW), gmh(rCtx, dstH));
      }
      ctx.fillStyle = prevFill;
      return true;
    }
    if (offBmiSrc > 0 && cbBmiSrc > 0 && offBitsSrc > 0 && cbBitsSrc > 0) {
      const imageData = decodeDibToImageData(
        view,
        offset + offBmiSrc,
        offset + offBitsSrc,
        cbBitsSrc
      );
      if (imageData) {
        const temp = createTempCanvas(imageData.width, imageData.height);
        if (temp) {
          temp.ctx.putImageData(imageData, 0, 0);
          ctx.drawImage(
            temp.canvas,
            gmx(rCtx, dstX),
            gmy(rCtx, dstY),
            gmw(rCtx, dstW),
            gmh(rCtx, dstH)
          );
        }
      }
    }
  }
  return true;
}
function handleStretchDibits(rCtx, offset, dataOff, recSize) {
  const { ctx, view } = rCtx;
  if (recSize >= 80) {
    const dstX = view.getInt32(dataOff + 16, true);
    const dstY = view.getInt32(dataOff + 20, true);
    const dstW = view.getInt32(dataOff + 64, true);
    const dstH = view.getInt32(dataOff + 68, true);
    const offBmiSrc = view.getUint32(dataOff + 40, true);
    const cbBmiSrc = view.getUint32(dataOff + 44, true);
    const offBitsSrc = view.getUint32(dataOff + 48, true);
    const cbBitsSrc = view.getUint32(dataOff + 52, true);
    if (offBmiSrc > 0 && cbBmiSrc > 0 && offBitsSrc > 0 && cbBitsSrc > 0) {
      const imageData = decodeDibToImageData(
        view,
        offset + offBmiSrc,
        offset + offBitsSrc,
        cbBitsSrc
      );
      if (imageData) {
        const temp = createTempCanvas(imageData.width, imageData.height);
        if (temp) {
          temp.ctx.putImageData(imageData, 0, 0);
          ctx.drawImage(
            temp.canvas,
            gmx(rCtx, dstX),
            gmy(rCtx, dstY),
            gmw(rCtx, dstW),
            gmh(rCtx, dstH)
          );
        }
      }
    }
  }
  return true;
}
function gdiCombineClip(rCtx, shape, op) {
  const { ctx } = rCtx;
  if (rCtx.clipUntracked && op !== "replace") {
    switch (op) {
      case "intersect":
      case "complement": {
        ctx.save();
        rCtx.clipSaveDepth++;
        applyClipShapes(ctx, [shape]);
        return;
      }
      case "exclude":
      case "xor": {
        const inv = combineClip(null, shape, "exclude");
        ctx.save();
        rCtx.clipSaveDepth++;
        applyClipShapes(ctx, inv.region ?? [shape]);
        return;
      }
      case "union":
        return;
    }
  }
  const res = combineClip(op === "replace" ? null : rCtx.clipRegion ?? null, shape, op);
  if (!res.exact) ;
  rCtx.clipRegion = res.region;
  rCtx.clipUntracked = false;
  reapplyClipRegion(rCtx, res.region);
}
function readClipRectShape(rCtx, dataOff) {
  const { view } = rCtx;
  const left = view.getInt32(dataOff, true);
  const top = view.getInt32(dataOff + 4, true);
  const right = view.getInt32(dataOff + 8, true);
  const bottom = view.getInt32(dataOff + 12, true);
  return rectClipShape(
    gmx(rCtx, left),
    gmy(rCtx, top),
    gmw(rCtx, right - left),
    gmh(rCtx, bottom - top)
  );
}
function handleIntersectClipRect(rCtx, dataOff, recSize) {
  if (recSize >= 24) {
    gdiCombineClip(rCtx, readClipRectShape(rCtx, dataOff), "intersect");
  }
  return true;
}
function handleExcludeClipRect(rCtx, dataOff, recSize) {
  if (recSize >= 24) {
    gdiCombineClip(rCtx, readClipRectShape(rCtx, dataOff), "exclude");
  }
  return true;
}
var RGN_MODE_OPS = {
  1: "intersect",
  // RGN_AND
  2: "union",
  // RGN_OR
  3: "xor",
  // RGN_XOR
  4: "exclude",
  // RGN_DIFF
  5: "replace"
  // RGN_COPY
};
function handleExtSelectClipRgn(rCtx, dataOff, recSize) {
  const { view } = rCtx;
  if (recSize < 16) {
    return true;
  }
  const cbRgnData = view.getUint32(dataOff, true);
  const iMode = view.getUint32(dataOff + 4, true);
  const op = RGN_MODE_OPS[iMode];
  if (!op) {
    return true;
  }
  if (cbRgnData === 0) {
    if (op === "replace") {
      rCtx.clipRegion = null;
      rCtx.clipUntracked = false;
      reapplyClipRegion(rCtx, null);
    }
    return true;
  }
  const rgnStart = dataOff + 8;
  if (cbRgnData < 32) {
    return true;
  }
  const nCount = view.getUint32(rgnStart + 8, true);
  if (nCount === 0) {
    return true;
  }
  const rects = [];
  const rectsStart = rgnStart + 32;
  for (let i = 0; i < nCount; i++) {
    const rOff = rectsStart + i * 16;
    if (rOff + 16 > dataOff + 8 + cbRgnData) {
      break;
    }
    const left = view.getInt32(rOff, true);
    const top = view.getInt32(rOff + 4, true);
    const right = view.getInt32(rOff + 8, true);
    const bottom = view.getInt32(rOff + 12, true);
    rects.push({
      x: gmx(rCtx, left),
      y: gmy(rCtx, top),
      w: gmw(rCtx, right - left),
      h: gmh(rCtx, bottom - top)
    });
  }
  if (rects.length === 0) {
    return true;
  }
  gdiCombineClip(rCtx, rectsClipShape(rects), op);
  return true;
}
function handleOffsetClipRgn(rCtx, dataOff, recSize) {
  if (recSize >= 16) {
    const dx = rCtx.view.getInt32(dataOff, true);
    const dy = rCtx.view.getInt32(dataOff + 4, true);
    if (rCtx.clipUntracked) {
      return true;
    }
    if (rCtx.clipRegion) {
      rCtx.clipRegion = translateClipRegion(rCtx.clipRegion, gmw(rCtx, dx), gmh(rCtx, dy));
      reapplyClipRegion(rCtx, rCtx.clipRegion);
    }
  }
  return true;
}
function handleEmfGdiTextBitmapRecord(rCtx, recType, offset, dataOff, recSize) {
  switch (recType) {
    case EMR_EXTTEXTOUTW:
      return handleExtTextOutW(rCtx, offset, dataOff, recSize);
    case EMR_BITBLT:
      return handleBitBlt(rCtx, offset, dataOff, recSize);
    case EMR_STRETCHDIBITS:
      return handleStretchDibits(rCtx, offset, dataOff, recSize);
    case EMR_INTERSECTCLIPRECT:
      return handleIntersectClipRect(rCtx, dataOff, recSize);
    case EMR_EXTSELECTCLIPRGN:
      return handleExtSelectClipRgn(rCtx, dataOff, recSize);
    case EMR_EXCLUDECLIPRECT:
      return handleExcludeClipRect(rCtx, dataOff, recSize);
    case EMR_OFFSETCLIPRGN:
      return handleOffsetClipRgn(rCtx, dataOff, recSize);
    default:
      return false;
  }
}
function handleEmfGdiDrawRecord(rCtx, recType, offset, dataOff, recSize) {
  return handleEmfGdiShapeRecord(rCtx, recType, dataOff, recSize) || handleEmfGdiTextBitmapRecord(rCtx, recType, offset, dataOff, recSize);
}
function handlePolyPolygon32(rCtx, offset, dataOff, recSize) {
  const { ctx, view, state, inPath } = rCtx;
  const numPolys = view.getUint32(dataOff + 16, true);
  const totalPoints = view.getUint32(dataOff + 20, true);
  if (numPolys === 0 || numPolys >= 1e4 || totalPoints >= 1e5) {
    return;
  }
  const countsOff = dataOff + 24;
  const ptOff = countsOff + numPolys * 4;
  if (ptOff + totalPoints * 8 > offset + recSize) {
    return;
  }
  if (!inPath) {
    ctx.beginPath();
  }
  let pIdx = 0;
  for (let p = 0; p < numPolys; p++) {
    const count = view.getUint32(countsOff + p * 4, true);
    for (let i = 0; i < count && pIdx < totalPoints; i++) {
      const px = view.getInt32(ptOff + pIdx * 8, true);
      const py = view.getInt32(ptOff + pIdx * 8 + 4, true);
      if (i === 0) {
        ctx.moveTo(gmx(rCtx, px), gmy(rCtx, py));
      } else {
        ctx.lineTo(gmx(rCtx, px), gmy(rCtx, py));
      }
      pIdx++;
    }
    ctx.closePath();
  }
  if (!inPath) {
    applyBrush(ctx, state);
    ctx.fill(state.polyFillMode === 2 ? "nonzero" : "evenodd");
    applyPen(ctx, state);
    ctx.stroke();
  }
}
function handlePolyPolyline32(rCtx, offset, dataOff, recSize) {
  const { ctx, view, state, inPath } = rCtx;
  const numPolys = view.getUint32(dataOff + 16, true);
  const totalPoints = view.getUint32(dataOff + 20, true);
  if (numPolys === 0 || numPolys >= 1e4 || totalPoints >= 1e5) {
    return;
  }
  const countsOff = dataOff + 24;
  const ptOff = countsOff + numPolys * 4;
  if (ptOff + totalPoints * 8 > offset + recSize) {
    return;
  }
  if (!inPath) {
    ctx.beginPath();
  }
  let pIdx = 0;
  for (let p = 0; p < numPolys; p++) {
    const count = view.getUint32(countsOff + p * 4, true);
    for (let i = 0; i < count && pIdx < totalPoints; i++) {
      const px = view.getInt32(ptOff + pIdx * 8, true);
      const py = view.getInt32(ptOff + pIdx * 8 + 4, true);
      if (i === 0) {
        ctx.moveTo(gmx(rCtx, px), gmy(rCtx, py));
      } else {
        ctx.lineTo(gmx(rCtx, px), gmy(rCtx, py));
      }
      pIdx++;
    }
  }
  if (!inPath) {
    applyPen(ctx, state);
    ctx.stroke();
  }
}
function handlePolyPolygon16(rCtx, offset, dataOff, recSize) {
  const { ctx, view, state, inPath } = rCtx;
  const numPolys = view.getUint32(dataOff + 16, true);
  const totalPoints = view.getUint32(dataOff + 20, true);
  if (numPolys === 0 || numPolys >= 1e4 || totalPoints >= 1e5) {
    return;
  }
  const countsOff = dataOff + 24;
  const ptOff = countsOff + numPolys * 4;
  if (ptOff + totalPoints * 4 > offset + recSize) {
    return;
  }
  if (!inPath) {
    ctx.beginPath();
  }
  let pIdx = 0;
  for (let p = 0; p < numPolys; p++) {
    const count = view.getUint32(countsOff + p * 4, true);
    for (let i = 0; i < count && pIdx < totalPoints; i++) {
      const px = view.getInt16(ptOff + pIdx * 4, true);
      const py = view.getInt16(ptOff + pIdx * 4 + 2, true);
      if (i === 0) {
        ctx.moveTo(gmx(rCtx, px), gmy(rCtx, py));
      } else {
        ctx.lineTo(gmx(rCtx, px), gmy(rCtx, py));
      }
      pIdx++;
    }
    ctx.closePath();
  }
  if (!inPath) {
    applyBrush(ctx, state);
    ctx.fill(state.polyFillMode === 2 ? "nonzero" : "evenodd");
    applyPen(ctx, state);
    ctx.stroke();
  }
}
function handlePoly32(rCtx, recType, offset, dataOff, recSize) {
  const { ctx, view, state, inPath } = rCtx;
  if (recSize < 28) {
    return true;
  }
  const count = view.getUint32(dataOff + 16, true);
  const ptOff = dataOff + 20;
  if (count === 0 || ptOff + count * 8 > offset + recSize) {
    return true;
  }
  const isPolygon = recType === EMR_POLYGON;
  const isBezier = recType === EMR_POLYBEZIER || recType === EMR_POLYBEZIERTO;
  const isTo = recType === EMR_POLYBEZIERTO || recType === EMR_POLYLINETO;
  if (!inPath) {
    ctx.beginPath();
  }
  if (!isTo) {
    ctx.moveTo(gmx(rCtx, view.getInt32(ptOff, true)), gmy(rCtx, view.getInt32(ptOff + 4, true)));
  }
  let i = isTo ? 0 : 1;
  if (isBezier) {
    while (i + 2 < count) {
      ctx.bezierCurveTo(
        gmx(rCtx, view.getInt32(ptOff + i * 8, true)),
        gmy(rCtx, view.getInt32(ptOff + i * 8 + 4, true)),
        gmx(rCtx, view.getInt32(ptOff + (i + 1) * 8, true)),
        gmy(rCtx, view.getInt32(ptOff + (i + 1) * 8 + 4, true)),
        gmx(rCtx, view.getInt32(ptOff + (i + 2) * 8, true)),
        gmy(rCtx, view.getInt32(ptOff + (i + 2) * 8 + 4, true))
      );
      i += 3;
    }
  } else {
    for (; i < count; i++) {
      ctx.lineTo(
        gmx(rCtx, view.getInt32(ptOff + i * 8, true)),
        gmy(rCtx, view.getInt32(ptOff + i * 8 + 4, true))
      );
    }
  }
  if (isPolygon) {
    ctx.closePath();
  }
  if (!inPath) {
    if (isPolygon) {
      applyBrush(ctx, state);
      ctx.fill(state.polyFillMode === 2 ? "nonzero" : "evenodd");
    }
    applyPen(ctx, state);
    ctx.stroke();
  }
  if (count > 0) {
    const last = count - 1;
    state.curX = view.getInt32(ptOff + last * 8, true);
    state.curY = view.getInt32(ptOff + last * 8 + 4, true);
  }
  return true;
}
function handlePoly16(rCtx, recType, offset, dataOff, recSize) {
  const { ctx, view, state, inPath } = rCtx;
  if (recSize < 28) {
    return true;
  }
  const count = view.getUint32(dataOff + 16, true);
  const ptOff = dataOff + 20;
  if (count === 0 || ptOff + count * 4 > offset + recSize) {
    return true;
  }
  const isPolygon = recType === EMR_POLYGON16;
  const isBezier = recType === EMR_POLYBEZIER16 || recType === EMR_POLYBEZIERTO16;
  const isTo = recType === EMR_POLYBEZIERTO16 || recType === EMR_POLYLINETO16;
  if (!inPath) {
    ctx.beginPath();
  }
  if (!isTo) {
    ctx.moveTo(gmx(rCtx, view.getInt16(ptOff, true)), gmy(rCtx, view.getInt16(ptOff + 2, true)));
  }
  let i = isTo ? 0 : 1;
  if (isBezier) {
    while (i + 2 < count) {
      ctx.bezierCurveTo(
        gmx(rCtx, view.getInt16(ptOff + i * 4, true)),
        gmy(rCtx, view.getInt16(ptOff + i * 4 + 2, true)),
        gmx(rCtx, view.getInt16(ptOff + (i + 1) * 4, true)),
        gmy(rCtx, view.getInt16(ptOff + (i + 1) * 4 + 2, true)),
        gmx(rCtx, view.getInt16(ptOff + (i + 2) * 4, true)),
        gmy(rCtx, view.getInt16(ptOff + (i + 2) * 4 + 2, true))
      );
      i += 3;
    }
  } else {
    for (; i < count; i++) {
      ctx.lineTo(
        gmx(rCtx, view.getInt16(ptOff + i * 4, true)),
        gmy(rCtx, view.getInt16(ptOff + i * 4 + 2, true))
      );
    }
  }
  if (isPolygon) {
    ctx.closePath();
  }
  if (!inPath) {
    if (isPolygon) {
      applyBrush(ctx, state);
      ctx.fill(state.polyFillMode === 2 ? "nonzero" : "evenodd");
    }
    applyPen(ctx, state);
    ctx.stroke();
  }
  if (count > 0) {
    const last = count - 1;
    state.curX = view.getInt16(ptOff + last * 4, true);
    state.curY = view.getInt16(ptOff + last * 4 + 2, true);
  }
  return true;
}
function handleEmfGdiPolyPathRecord(rCtx, recType, offset, dataOff, recSize) {
  const { ctx, state } = rCtx;
  switch (recType) {
    // ---- 32-bit polys ----
    case EMR_POLYLINE:
    case EMR_POLYGON:
    case EMR_POLYBEZIER:
    case EMR_POLYBEZIERTO:
    case EMR_POLYLINETO:
      return handlePoly32(rCtx, recType, offset, dataOff, recSize);
    // ---- 16-bit polys ----
    case EMR_POLYLINE16:
    case EMR_POLYGON16:
    case EMR_POLYBEZIER16:
    case EMR_POLYBEZIERTO16:
    case EMR_POLYLINETO16:
      return handlePoly16(rCtx, recType, offset, dataOff, recSize);
    // ---- polypolyline / polypolygon ----
    case EMR_POLYPOLYLINE:
      if (recSize >= 28) {
        handlePolyPolyline32(rCtx, offset, dataOff, recSize);
      }
      return true;
    case EMR_POLYPOLYGON:
      if (recSize >= 28) {
        handlePolyPolygon32(rCtx, offset, dataOff, recSize);
      }
      return true;
    case EMR_POLYPOLYGON16:
      if (recSize >= 28) {
        handlePolyPolygon16(rCtx, offset, dataOff, recSize);
      }
      return true;
    // ---- path operations ----
    case EMR_BEGINPATH:
      rCtx.inPath = true;
      ctx.beginPath();
      return true;
    case EMR_ENDPATH:
      rCtx.inPath = false;
      return true;
    case EMR_CLOSEFIGURE:
      ctx.closePath();
      return true;
    case EMR_FILLPATH:
      applyBrush(ctx, state);
      ctx.fill(state.polyFillMode === 2 ? "nonzero" : "evenodd");
      return true;
    case EMR_STROKEANDFILLPATH:
      applyBrush(ctx, state);
      ctx.fill(state.polyFillMode === 2 ? "nonzero" : "evenodd");
      applyPen(ctx, state);
      ctx.stroke();
      return true;
    case EMR_STROKEPATH:
      applyPen(ctx, state);
      ctx.stroke();
      return true;
    case EMR_SELECTCLIPPATH: {
      const clipMode = recSize >= 12 ? rCtx.view.getUint32(dataOff, true) : 5;
      try {
        if (clipMode === 5) {
          while (rCtx.clipSaveDepth > 0) {
            ctx.restore();
            rCtx.clipSaveDepth--;
          }
        }
        ctx.save();
        rCtx.clipSaveDepth++;
        ctx.clip(state.polyFillMode === 2 ? "nonzero" : "evenodd");
        rCtx.clipRegion = null;
        rCtx.clipUntracked = true;
      } catch {
      }
      return true;
    }
    default:
      return false;
  }
}
function handleEmfObjectRecord(rCtx, recType, dataOff, recSize) {
  const { view, state } = rCtx;
  switch (recType) {
    case EMR_CREATEPEN: {
      if (recSize >= 28) {
        const ihPen = view.getUint32(dataOff, true);
        const penStyle = view.getUint32(dataOff + 4, true);
        const widthX = view.getInt32(dataOff + 8, true);
        const color = readColorRef(view, dataOff + 16);
        rCtx.objectTable.set(ihPen, {
          kind: "pen",
          style: penStyle & 255,
          widthX,
          color
        });
      }
      return true;
    }
    case EMR_EXTCREATEPEN: {
      if (recSize >= 52) {
        const ihPen = view.getUint32(dataOff, true);
        const penStyle = view.getUint32(dataOff + 12, true);
        const widthX = view.getInt32(dataOff + 16, true);
        const color = readColorRef(view, dataOff + 24);
        rCtx.objectTable.set(ihPen, {
          kind: "pen",
          style: penStyle & 255,
          widthX,
          color
        });
      }
      return true;
    }
    case EMR_CREATEBRUSHINDIRECT: {
      if (recSize >= 24) {
        const ihBrush = view.getUint32(dataOff, true);
        const brushStyle = view.getUint32(dataOff + 4, true);
        const color = readColorRef(view, dataOff + 8);
        rCtx.objectTable.set(ihBrush, {
          kind: "brush",
          style: brushStyle,
          color
        });
      }
      return true;
    }
    case EMR_EXTCREATEFONTINDIRECTW: {
      if (recSize >= 332) {
        const ihFont = view.getUint32(dataOff, true);
        const height = view.getInt32(dataOff + 4, true);
        const weight = view.getInt32(dataOff + 20, true);
        const italic = view.getUint8(dataOff + 24);
        const underline = view.getUint8(dataOff + 25);
        const strikeOut = view.getUint8(dataOff + 26);
        const family = readUtf16LE(view, dataOff + 28, 32) || "sans-serif";
        rCtx.objectTable.set(ihFont, {
          kind: "font",
          height: Math.abs(height),
          weight,
          italic: italic !== 0,
          underline: underline !== 0,
          strikeOut: strikeOut !== 0,
          family
        });
      }
      return true;
    }
    case EMR_SELECTOBJECT: {
      if (recSize >= 12) {
        const ihObject = view.getUint32(dataOff, true);
        const obj = ihObject >= STOCK_OBJECT_BASE ? getStockObject(ihObject - STOCK_OBJECT_BASE) : rCtx.objectTable.get(ihObject) ?? null;
        if (obj) {
          switch (obj.kind) {
            case "pen":
              state.penStyle = obj.style;
              state.penWidth = obj.widthX;
              state.penColor = obj.color;
              break;
            case "brush":
              state.brushStyle = obj.style;
              state.brushColor = obj.color;
              break;
            case "font":
              state.fontHeight = obj.height;
              state.fontWeight = obj.weight;
              state.fontItalic = obj.italic;
              state.fontUnderline = obj.underline;
              state.fontStrikeOut = obj.strikeOut;
              state.fontFamily = obj.family;
              break;
          }
        }
      }
      return true;
    }
    case EMR_DELETEOBJECT: {
      if (recSize >= 12) {
        rCtx.objectTable.delete(view.getUint32(dataOff, true));
      }
      return true;
    }
    default:
      return false;
  }
}
function handleCoordinateRecord(rCtx, recType, dataOff, recSize) {
  const { view } = rCtx;
  switch (recType) {
    case EMR_SETWINDOWEXTEX: {
      if (recSize >= 16) {
        rCtx.windowExt.cx = view.getInt32(dataOff, true);
        rCtx.windowExt.cy = view.getInt32(dataOff + 4, true);
        activateGdiMappingMode(rCtx);
      }
      return true;
    }
    case EMR_SETWINDOWORGEX: {
      if (recSize >= 16) {
        rCtx.windowOrg.x = view.getInt32(dataOff, true);
        rCtx.windowOrg.y = view.getInt32(dataOff + 4, true);
        activateGdiMappingMode(rCtx);
      }
      return true;
    }
    case EMR_SETVIEWPORTEXTEX: {
      if (recSize >= 16) {
        rCtx.viewportExt.cx = view.getInt32(dataOff, true);
        rCtx.viewportExt.cy = view.getInt32(dataOff + 4, true);
        activateGdiMappingMode(rCtx);
      }
      return true;
    }
    case EMR_SETVIEWPORTORGEX: {
      if (recSize >= 16) {
        rCtx.viewportOrg.x = view.getInt32(dataOff, true);
        rCtx.viewportOrg.y = view.getInt32(dataOff + 4, true);
        activateGdiMappingMode(rCtx);
      }
      return true;
    }
    case EMR_SETMAPMODE: {
      if (recSize >= 12) {
        const mode = view.getUint32(dataOff, true);
        if (mode === 8 || mode === 7) {
          activateGdiMappingMode(rCtx);
        }
      }
      return true;
    }
    case EMR_SCALEVIEWPORTEXTEX: {
      if (recSize >= 24) {
        const xNum = view.getInt32(dataOff, true);
        const xDenom = view.getInt32(dataOff + 4, true);
        const yNum = view.getInt32(dataOff + 8, true);
        const yDenom = view.getInt32(dataOff + 12, true);
        if (xDenom !== 0) {
          rCtx.viewportExt.cx = Math.round(rCtx.viewportExt.cx * xNum / xDenom);
        }
        if (yDenom !== 0) {
          rCtx.viewportExt.cy = Math.round(rCtx.viewportExt.cy * yNum / yDenom);
        }
        activateGdiMappingMode(rCtx);
      }
      return true;
    }
    case EMR_SCALEWINDOWEXTEX: {
      if (recSize >= 24) {
        const xNum = view.getInt32(dataOff, true);
        const xDenom = view.getInt32(dataOff + 4, true);
        const yNum = view.getInt32(dataOff + 8, true);
        const yDenom = view.getInt32(dataOff + 12, true);
        if (xDenom !== 0) {
          rCtx.windowExt.cx = Math.round(rCtx.windowExt.cx * xNum / xDenom);
        }
        if (yDenom !== 0) {
          rCtx.windowExt.cy = Math.round(rCtx.windowExt.cy * yNum / yDenom);
        }
        activateGdiMappingMode(rCtx);
      }
      return true;
    }
    default:
      return false;
  }
}
function handleWorldTransformRecord(rCtx, recType, dataOff, recSize) {
  const { view, state } = rCtx;
  switch (recType) {
    case EMR_SETWORLDTRANSFORM: {
      if (recSize >= 32) {
        state.worldTransform = [
          view.getFloat32(dataOff, true),
          view.getFloat32(dataOff + 4, true),
          view.getFloat32(dataOff + 8, true),
          view.getFloat32(dataOff + 12, true),
          view.getFloat32(dataOff + 16, true),
          view.getFloat32(dataOff + 20, true)
        ];
      }
      return true;
    }
    case EMR_MODIFYWORLDTRANSFORM: {
      if (recSize >= 36) {
        const mode = view.getUint32(dataOff + 24, true);
        if (mode === 1) {
          state.worldTransform = [1, 0, 0, 1, 0, 0];
        } else if (mode === 2 || mode === 3) {
          const xf = [
            view.getFloat32(dataOff, true),
            view.getFloat32(dataOff + 4, true),
            view.getFloat32(dataOff + 8, true),
            view.getFloat32(dataOff + 12, true),
            view.getFloat32(dataOff + 16, true),
            view.getFloat32(dataOff + 20, true)
          ];
          const [a1, b1, c1, d1, e1, f1] = state.worldTransform;
          if (mode === 2) {
            state.worldTransform = [
              xf[0] * a1 + xf[1] * c1,
              xf[0] * b1 + xf[1] * d1,
              xf[2] * a1 + xf[3] * c1,
              xf[2] * b1 + xf[3] * d1,
              xf[4] * a1 + xf[5] * c1 + e1,
              xf[4] * b1 + xf[5] * d1 + f1
            ];
          } else {
            state.worldTransform = [
              a1 * xf[0] + b1 * xf[2],
              a1 * xf[1] + b1 * xf[3],
              c1 * xf[0] + d1 * xf[2],
              c1 * xf[1] + d1 * xf[3],
              e1 * xf[0] + f1 * xf[2] + xf[4],
              e1 * xf[1] + f1 * xf[3] + xf[5]
            ];
          }
        }
      }
      return true;
    }
    default:
      return false;
  }
}
function handleEmfTransformRecord(rCtx, recType, dataOff, recSize) {
  return handleCoordinateRecord(rCtx, recType, dataOff, recSize) || handleWorldTransformRecord(rCtx, recType, dataOff, recSize);
}
function defaultState() {
  return {
    penColor: "#000000",
    penWidth: 1,
    penStyle: 0,
    brushColor: "#ffffff",
    brushStyle: 0,
    textColor: "#000000",
    bkColor: "#ffffff",
    bkMode: 1,
    fontHeight: 12,
    fontWeight: 400,
    fontItalic: false,
    fontFamily: "sans-serif",
    fontUnderline: false,
    fontStrikeOut: false,
    rop2: 13,
    curX: 0,
    curY: 0,
    polyFillMode: 1,
    textAlign: 0,
    worldTransform: [1, 0, 0, 1, 0, 0]
  };
}
function cloneState(s) {
  return {
    ...s,
    worldTransform: [...s.worldTransform]
  };
}
function createEmfPlusState() {
  return {
    objectTable: /* @__PURE__ */ new Map(),
    worldTransform: [1, 0, 0, 1, 0, 0],
    saveStack: [],
    saveIdMap: /* @__PURE__ */ new Map(),
    clipRegion: null,
    clipSaveDepth: 0
  };
}
function handleEmfGdiStateRecord(rCtx, recType, _offset, dataOff, recSize) {
  if (handleEmfTransformRecord(rCtx, recType, dataOff, recSize)) {
    return true;
  }
  if (handleEmfObjectRecord(rCtx, recType, dataOff, recSize)) {
    return true;
  }
  const { ctx, view, state } = rCtx;
  switch (recType) {
    // ---- save / restore ----
    case EMR_SAVEDC: {
      while (rCtx.clipSaveDepth > 0) {
        ctx.restore();
        rCtx.clipSaveDepth--;
      }
      rCtx.clipStack ?? (rCtx.clipStack = []);
      rCtx.clipStack.push({
        region: rCtx.clipRegion ?? null,
        untracked: rCtx.clipUntracked ?? false
      });
      rCtx.stateStack.push(cloneState(state));
      ctx.save();
      if (rCtx.clipUntracked) {
        rCtx.clipUntracked = false;
        rCtx.clipRegion = null;
      } else if (rCtx.clipRegion) {
        reapplyClipRegion(rCtx, rCtx.clipRegion);
      }
      return true;
    }
    case EMR_RESTOREDC: {
      if (recSize >= 12) {
        while (rCtx.clipSaveDepth > 0) {
          ctx.restore();
          rCtx.clipSaveDepth--;
        }
        let rel = view.getInt32(dataOff, true);
        if (rel < 0) {
          rel = rCtx.stateStack.length + rel + 1;
        }
        while (rCtx.stateStack.length > rel && rCtx.stateStack.length > 0) {
          rCtx.stateStack.pop();
          rCtx.clipStack?.pop();
          ctx.restore();
        }
        const restored = rCtx.stateStack.pop();
        if (restored) {
          const clipSnapshot = rCtx.clipStack?.pop();
          Object.assign(state, restored);
          ctx.restore();
          rCtx.clipRegion = clipSnapshot?.region ?? null;
          rCtx.clipUntracked = false;
          if (rCtx.clipRegion) {
            reapplyClipRegion(rCtx, rCtx.clipRegion);
          }
        }
      }
      return true;
    }
    // ---- drawing mode / color settings ----
    case EMR_SETTEXTCOLOR: {
      if (recSize >= 12) {
        state.textColor = readColorRef(view, dataOff);
      }
      return true;
    }
    case EMR_SETBKCOLOR: {
      if (recSize >= 12) {
        state.bkColor = readColorRef(view, dataOff);
      }
      return true;
    }
    case EMR_SETBKMODE: {
      if (recSize >= 12) {
        state.bkMode = view.getUint32(dataOff, true);
      }
      return true;
    }
    case EMR_SETPOLYFILLMODE: {
      if (recSize >= 12) {
        state.polyFillMode = view.getUint32(dataOff, true);
      }
      return true;
    }
    case EMR_SETROP2: {
      if (recSize >= 12) {
        state.rop2 = view.getUint32(dataOff, true);
      }
      return true;
    }
    case EMR_SETSTRETCHBLTMODE:
    case EMR_SETMITERLIMIT:
    case EMR_SETTEXTALIGN: {
      if (recType === EMR_SETTEXTALIGN && recSize >= 12) {
        state.textAlign = view.getUint32(dataOff, true);
      }
      return true;
    }
    default:
      return false;
  }
}
function readRectFromView(view, offset, compressed) {
  if (compressed) {
    return {
      x: view.getInt16(offset, true),
      y: view.getInt16(offset + 2, true),
      w: view.getInt16(offset + 4, true),
      h: view.getInt16(offset + 6, true)
    };
  }
  return {
    x: view.getFloat32(offset, true),
    y: view.getFloat32(offset + 4, true),
    w: view.getFloat32(offset + 8, true),
    h: view.getFloat32(offset + 12, true)
  };
}
function readPointFromView(view, offset, compressed) {
  if (compressed) {
    return {
      x: view.getInt16(offset, true),
      y: view.getInt16(offset + 2, true)
    };
  }
  return {
    x: view.getFloat32(offset, true),
    y: view.getFloat32(offset + 4, true)
  };
}
function parseEmfPlusPath(data, off, maxLen) {
  if (maxLen < 12) {
    return null;
  }
  data.getUint32(off, true);
  const pointCount = data.getUint32(off + 4, true);
  const pathFlags = data.getUint32(off + 8, true);
  if (pointCount === 0 || pointCount > 1e5) {
    return null;
  }
  const compressed = (pathFlags & 16384) !== 0;
  const pointSize = compressed ? 4 : 8;
  const pointsBytes = pointCount * pointSize;
  const typesBytes = pointCount;
  const neededAfterHeader = pointsBytes + typesBytes;
  if (12 + neededAfterHeader > maxLen) {
    return null;
  }
  const points = [];
  let pOff = off + 12;
  for (let i = 0; i < pointCount; i++) {
    if (compressed) {
      points.push({
        x: data.getInt16(pOff, true),
        y: data.getInt16(pOff + 2, true)
      });
      pOff += 4;
    } else {
      points.push({
        x: data.getFloat32(pOff, true),
        y: data.getFloat32(pOff + 4, true)
      });
      pOff += 8;
    }
  }
  const alignedPOff = pOff + 3 & -4;
  const types2 = new Uint8Array(data.buffer, data.byteOffset + alignedPOff, pointCount);
  return { kind: "plus-path", points, types: new Uint8Array(types2) };
}
function emfPlusPathToClipCmds(path5, m) {
  const tx = (x, y) => m[0] * x + m[2] * y + m[4];
  const ty = (x, y) => m[1] * x + m[3] * y + m[5];
  const cmds = [];
  const pts = path5.points;
  const types2 = path5.types;
  let i = 0;
  while (i < pts.length) {
    const t = types2[i] & 15;
    const close = (types2[i] & 128) !== 0;
    if (t === 0) {
      cmds.push({ op: "moveTo", x: tx(pts[i].x, pts[i].y), y: ty(pts[i].x, pts[i].y) });
      i++;
    } else if (t === 3) {
      if (i + 2 < pts.length) {
        cmds.push({
          op: "bezierCurveTo",
          cp1x: tx(pts[i].x, pts[i].y),
          cp1y: ty(pts[i].x, pts[i].y),
          cp2x: tx(pts[i + 1].x, pts[i + 1].y),
          cp2y: ty(pts[i + 1].x, pts[i + 1].y),
          x: tx(pts[i + 2].x, pts[i + 2].y),
          y: ty(pts[i + 2].x, pts[i + 2].y)
        });
        if ((types2[i + 2] & 128) !== 0) {
          cmds.push({ op: "closePath" });
        }
        i += 3;
        continue;
      }
      break;
    } else {
      cmds.push({ op: "lineTo", x: tx(pts[i].x, pts[i].y), y: ty(pts[i].x, pts[i].y) });
      i++;
    }
    if (close) {
      cmds.push({ op: "closePath" });
    }
  }
  return cmds;
}
function replayEmfPlusPath(ctx, path5) {
  ctx.beginPath();
  const pts = path5.points;
  const types2 = path5.types;
  let i = 0;
  while (i < pts.length) {
    const t = types2[i] & 15;
    const close = (types2[i] & 128) !== 0;
    if (t === 0) {
      ctx.moveTo(pts[i].x, pts[i].y);
      i++;
    } else if (t === 1) {
      ctx.lineTo(pts[i].x, pts[i].y);
      i++;
    } else if (t === 3) {
      if (i + 2 < pts.length) {
        ctx.bezierCurveTo(
          pts[i].x,
          pts[i].y,
          pts[i + 1].x,
          pts[i + 1].y,
          pts[i + 2].x,
          pts[i + 2].y
        );
        if ((types2[i + 2] & 128) !== 0) {
          ctx.closePath();
        }
        i += 3;
        continue;
      } else {
        break;
      }
    } else {
      ctx.lineTo(pts[i].x, pts[i].y);
      i++;
    }
    if (close) {
      ctx.closePath();
    }
  }
}
function multiplyMatrix(m1, m2) {
  return [
    m1[0] * m2[0] + m1[1] * m2[2],
    m1[0] * m2[1] + m1[1] * m2[3],
    m1[2] * m2[0] + m1[3] * m2[2],
    m1[2] * m2[1] + m1[3] * m2[3],
    m1[4] * m2[0] + m1[5] * m2[2] + m2[4],
    m1[4] * m2[1] + m1[5] * m2[3] + m2[5]
  ];
}
function createBrushGradient(rCtx, grad) {
  const ctx = rCtx.ctx;
  try {
    let g = null;
    if (grad.type === "linear" && typeof ctx.createLinearGradient === "function") {
      if (grad.x1 === grad.x2 && grad.y1 === grad.y2) {
        return null;
      }
      g = ctx.createLinearGradient(grad.x1, grad.y1, grad.x2, grad.y2);
    } else if (grad.type === "radial" && typeof ctx.createRadialGradient === "function") {
      if (!(grad.r > 0)) {
        return null;
      }
      g = ctx.createRadialGradient(grad.cx, grad.cy, 0, grad.cx, grad.cy, grad.r);
    }
    if (!g) {
      return null;
    }
    for (const stop of grad.stops) {
      g.addColorStop(stop.offset, stop.color);
    }
    return g;
  } catch {
    return null;
  }
}
function resolveBrushPaint(rCtx, flags, brushIdOrColor) {
  if (flags & 32768) {
    return argbToRgba(brushIdOrColor);
  }
  const obj = rCtx.objectTable.get(brushIdOrColor & 255);
  if (obj && obj.kind === "plus-brush") {
    if (obj.gradient) {
      const g = createBrushGradient(rCtx, obj.gradient);
      if (g) {
        return g;
      }
    }
    return obj.color;
  }
  return "rgba(0,0,0,1)";
}
function getPageUnitMultiplier(pageUnit, pageScale) {
  const DPI = 96;
  let unitToPixel;
  switch (pageUnit) {
    case 3:
      unitToPixel = DPI / 72;
      break;
    // Point
    case 4:
      unitToPixel = DPI;
      break;
    // Inch
    case 5:
      unitToPixel = DPI / 300;
      break;
    // Document
    case 6:
      unitToPixel = DPI / 25.4;
      break;
    // Millimeter
    default:
      unitToPixel = 1;
      break;
  }
  return unitToPixel * pageScale;
}
function applyPlusWorldTransform(rCtx) {
  const wt = rCtx.worldTransform;
  const m = getPageUnitMultiplier(rCtx.pageUnit, rCtx.pageScale);
  const d = rCtx.dpiScale;
  rCtx.ctx.setTransform(
    wt[0] * m * d,
    wt[1] * m * d,
    wt[2] * m * d,
    wt[3] * m * d,
    wt[4] * m * d,
    wt[5] * m * d
  );
}
function pushState(rCtx, stackId) {
  rCtx.saveStack.push({
    transform: [...rCtx.worldTransform]
  });
  rCtx.saveIdMap.set(stackId, rCtx.saveStack.length - 1);
}
function popState(rCtx, stackId) {
  const idx = rCtx.saveIdMap.get(stackId);
  if (idx !== void 0 && idx < rCtx.saveStack.length) {
    rCtx.worldTransform = [...rCtx.saveStack[idx].transform];
    rCtx.saveStack.length = idx;
    const newMap = /* @__PURE__ */ new Map();
    for (const [k, v] of rCtx.saveIdMap) {
      if (v < idx) {
        newMap.set(k, v);
      }
    }
    rCtx.saveIdMap = newMap;
  }
}
function plusDeviceMatrix(rCtx) {
  const wt = rCtx.worldTransform;
  const s = getPageUnitMultiplier(rCtx.pageUnit, rCtx.pageScale) * rCtx.dpiScale;
  return [wt[0] * s, wt[1] * s, wt[2] * s, wt[3] * s, wt[4] * s, wt[5] * s];
}
function transformedRectShape(x, y, w, h, m) {
  const tx = (px, py) => m[0] * px + m[2] * py + m[4];
  const ty = (px, py) => m[1] * px + m[3] * py + m[5];
  const cmds = [
    { op: "moveTo", x: tx(x, y), y: ty(x, y) },
    { op: "lineTo", x: tx(x + w, y), y: ty(x + w, y) },
    { op: "lineTo", x: tx(x + w, y + h), y: ty(x + w, y + h) },
    { op: "lineTo", x: tx(x, y + h), y: ty(x, y + h) },
    { op: "closePath" }
  ];
  return { cmds, fillRule: "nonzero", simple: true };
}
function pathClipShape(path5, m) {
  return { cmds: emfPlusPathToClipCmds(path5.path, m), fillRule: "nonzero", simple: true };
}
var REGION_NODE_OPS = {
  0: "intersect",
  // legacy/lenient: treat 0 as And
  1: "intersect",
  // RegionNodeDataTypeAnd
  2: "union",
  // RegionNodeDataTypeOr
  3: "xor",
  // RegionNodeDataTypeXor
  4: "exclude",
  // RegionNodeDataTypeExclude
  5: "complement"
  // RegionNodeDataTypeComplement
};
var MAX_REGION_FLATTEN_DEPTH = 64;
function flattenRegionNode(node, m, depth = 0) {
  if (depth > MAX_REGION_FLATTEN_DEPTH) {
    return { region: [emptyClipShape()], exact: false };
  }
  switch (node.type) {
    case "rect":
      return { region: [transformedRectShape(node.x, node.y, node.width, node.height, m)], exact: true };
    case "path":
      return { region: [pathClipShape(node, m)], exact: true };
    case "infinite":
      return { region: null, exact: true };
    case "empty":
      return { region: [emptyClipShape()], exact: true };
    case "combine": {
      const left = flattenRegionNode(node.left, m, depth + 1);
      const right = flattenRegionNode(node.right, m, depth + 1);
      const op = REGION_NODE_OPS[node.combineMode] ?? "intersect";
      const combined = combineClipRegions(left.region, right.region, op);
      return { region: combined.region, exact: combined.exact && left.exact && right.exact };
    }
  }
}
var PLUS_COMBINE_OPS = {
  0: "replace",
  1: "intersect",
  2: "union",
  3: "xor",
  4: "exclude",
  5: "complement"
};
function reapplyPlusClip(rCtx) {
  reapplyClipRegion(rCtx, rCtx.clipRegion ?? null, true);
}
function applyPlusClipRegion(rCtx, incoming, combineMode, opName) {
  const op = PLUS_COMBINE_OPS[combineMode];
  const res = combineClipRegions(rCtx.clipRegion ?? null, incoming, op ?? "intersect");
  if (!res.exact) ;
  rCtx.clipRegion = res.region;
  reapplyPlusClip(rCtx);
}
function applyPlusClipShape(rCtx, shape, combineMode, opName) {
  applyPlusClipRegion(rCtx, [shape], combineMode);
}
function handleEmfPlusStateRecord(rCtx, recType, recFlags, dataOff, recDataSize) {
  const { view } = rCtx;
  switch (recType) {
    // ---- transforms ----
    case EMFPLUS_SETWORLDTRANSFORM: {
      if (recDataSize >= 24) {
        rCtx.worldTransform = [
          view.getFloat32(dataOff, true),
          view.getFloat32(dataOff + 4, true),
          view.getFloat32(dataOff + 8, true),
          view.getFloat32(dataOff + 12, true),
          view.getFloat32(dataOff + 16, true),
          view.getFloat32(dataOff + 20, true)
        ];
      }
      return true;
    }
    case EMFPLUS_RESETWORLDTRANSFORM: {
      rCtx.worldTransform = [1, 0, 0, 1, 0, 0];
      return true;
    }
    case EMFPLUS_MULTIPLYWORLDTRANSFORM: {
      if (recDataSize >= 24) {
        const xf = [
          view.getFloat32(dataOff, true),
          view.getFloat32(dataOff + 4, true),
          view.getFloat32(dataOff + 8, true),
          view.getFloat32(dataOff + 12, true),
          view.getFloat32(dataOff + 16, true),
          view.getFloat32(dataOff + 20, true)
        ];
        if (recFlags & 8192) {
          rCtx.worldTransform = multiplyMatrix(rCtx.worldTransform, xf);
        } else {
          rCtx.worldTransform = multiplyMatrix(xf, rCtx.worldTransform);
        }
      }
      return true;
    }
    case EMFPLUS_TRANSLATEWORLDTRANSFORM: {
      if (recDataSize >= 8) {
        const dx = view.getFloat32(dataOff, true);
        const dy = view.getFloat32(dataOff + 4, true);
        const xf = [1, 0, 0, 1, dx, dy];
        if (recFlags & 8192) {
          rCtx.worldTransform = multiplyMatrix(rCtx.worldTransform, xf);
        } else {
          rCtx.worldTransform = multiplyMatrix(xf, rCtx.worldTransform);
        }
      }
      return true;
    }
    case EMFPLUS_SCALEWORLDTRANSFORM: {
      if (recDataSize >= 8) {
        const sx = view.getFloat32(dataOff, true);
        const sy = view.getFloat32(dataOff + 4, true);
        const xf = [sx, 0, 0, sy, 0, 0];
        if (recFlags & 8192) {
          rCtx.worldTransform = multiplyMatrix(rCtx.worldTransform, xf);
        } else {
          rCtx.worldTransform = multiplyMatrix(xf, rCtx.worldTransform);
        }
      }
      return true;
    }
    case EMFPLUS_ROTATEWORLDTRANSFORM: {
      if (recDataSize >= 4) {
        const angle = view.getFloat32(dataOff, true) * Math.PI / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const xf = [cos, sin, -sin, cos, 0, 0];
        if (recFlags & 8192) {
          rCtx.worldTransform = multiplyMatrix(rCtx.worldTransform, xf);
        } else {
          rCtx.worldTransform = multiplyMatrix(xf, rCtx.worldTransform);
        }
      }
      return true;
    }
    // ---- save / restore ----
    case EMFPLUS_SAVE: {
      if (recDataSize >= 4) {
        pushState(rCtx, view.getUint32(dataOff, true));
      }
      return true;
    }
    case EMFPLUS_RESTORE: {
      if (recDataSize >= 4) {
        popState(rCtx, view.getUint32(dataOff, true));
      }
      return true;
    }
    // ---- clipping ----
    case EMFPLUS_SETCLIPRECT: {
      if (recDataSize >= 16) {
        const combineMode = recFlags >> 8 & 15;
        const cx = view.getFloat32(dataOff, true);
        const cy = view.getFloat32(dataOff + 4, true);
        const cw = view.getFloat32(dataOff + 8, true);
        const ch = view.getFloat32(dataOff + 12, true);
        const shape = transformedRectShape(cx, cy, cw, ch, plusDeviceMatrix(rCtx));
        applyPlusClipShape(rCtx, shape, combineMode);
      }
      return true;
    }
    case EMFPLUS_RESETCLIP: {
      rCtx.clipRegion = null;
      reapplyPlusClip(rCtx);
      return true;
    }
    case EMFPLUS_SETCLIPREGION: {
      const regionId = recFlags & 255;
      const combineMode = recFlags >> 8 & 15;
      const regionObj = rCtx.objectTable.get(regionId);
      if (regionObj && regionObj.kind === "plus-region" && regionObj.nodes.length > 0) {
        const flattened = flattenRegionNode(regionObj.nodes[0], plusDeviceMatrix(rCtx));
        if (!flattened.exact) ;
        applyPlusClipRegion(rCtx, flattened.region, combineMode);
      }
      return true;
    }
    case EMFPLUS_SETCLIPPATH: {
      const pathId = recFlags & 255;
      const combineMode = recFlags >> 8 & 15;
      const pathObj = rCtx.objectTable.get(pathId);
      if (pathObj && pathObj.kind === "plus-path") {
        const shape = {
          cmds: emfPlusPathToClipCmds(pathObj, plusDeviceMatrix(rCtx)),
          fillRule: "nonzero",
          simple: true
        };
        applyPlusClipShape(rCtx, shape, combineMode);
      }
      return true;
    }
    case EMFPLUS_OFFSETCLIP: {
      if (recDataSize >= 8) {
        const dx = view.getFloat32(dataOff, true);
        const dy = view.getFloat32(dataOff + 4, true);
        if (rCtx.clipRegion) {
          const m = plusDeviceMatrix(rCtx);
          const ddx = m[0] * dx + m[2] * dy;
          const ddy = m[1] * dx + m[3] * dy;
          rCtx.clipRegion = translateClipRegion(rCtx.clipRegion, ddx, ddy);
          reapplyPlusClip(rCtx);
        }
      }
      return true;
    }
    // ---- containers ----
    case EMFPLUS_BEGINCONTAINERNOPARAMS: {
      if (recDataSize >= 4) {
        pushState(rCtx, view.getUint32(dataOff, true));
      }
      return true;
    }
    case EMFPLUS_ENDCONTAINER: {
      if (recDataSize >= 4) {
        popState(rCtx, view.getUint32(dataOff, true));
      }
      return true;
    }
    // ---- page transform ----
    case EMFPLUS_SETPAGETRANSFORM: {
      const pageUnit = recFlags & 255;
      const pageScale = recDataSize >= 4 ? view.getFloat32(dataOff, true) : 1;
      rCtx.pageUnit = pageUnit;
      rCtx.pageScale = pageScale;
      return true;
    }
    // ---- rendering hints (accepted, ignored) ----
    case EMFPLUS_SETANTIALIASMODE:
    case EMFPLUS_SETTEXTRENDERINGHINT:
    case EMFPLUS_SETINTERPOLATIONMODE:
    case EMFPLUS_SETPIXELOFFSETMODE:
    case EMFPLUS_SETCOMPOSITINGQUALITY:
      return true;
    default:
      return false;
  }
}
function applyEmfPlusPen(ctx, pen) {
  ctx.strokeStyle = pen.color;
  ctx.lineWidth = pen.width;
  const w = pen.width || 1;
  switch (pen.dashStyle) {
    case 1:
      ctx.setLineDash([w * 3, Number(w)]);
      break;
    // Dash
    case 2:
      ctx.setLineDash([Number(w), Number(w)]);
      break;
    // Dot
    case 3:
      ctx.setLineDash([w * 3, Number(w), Number(w), Number(w)]);
      break;
    // DashDot
    case 4:
      ctx.setLineDash([w * 3, Number(w), Number(w), Number(w), Number(w), Number(w)]);
      break;
    // DashDotDot
    default:
      ctx.setLineDash([]);
      break;
  }
}
function handleEmfPlusDrawRecord(rCtx, recType, recFlags, dataOff, recDataSize) {
  const { ctx, view, objectTable } = rCtx;
  switch (recType) {
    case EMFPLUS_FILLRECTS: {
      if (recDataSize >= 8) {
        const brushVal = view.getUint32(dataOff, true);
        const count = view.getUint32(dataOff + 4, true);
        const compressed = (recFlags & 16384) !== 0;
        const rectSize = compressed ? 8 : 16;
        ctx.fillStyle = resolveBrushPaint(rCtx, recFlags, brushVal);
        applyPlusWorldTransform(rCtx);
        let rOff = dataOff + 8;
        for (let i = 0; i < count && rOff + rectSize <= dataOff + recDataSize; i++) {
          const { x, y, w, h } = readRectFromView(view, rOff, compressed);
          ctx.fillRect(x, y, w, h);
          rOff += rectSize;
        }
      }
      return true;
    }
    case EMFPLUS_DRAWRECTS: {
      if (recDataSize >= 4) {
        const penId = recFlags & 255;
        const pen = objectTable.get(penId);
        const count = view.getUint32(dataOff, true);
        const compressed = (recFlags & 16384) !== 0;
        const rectSize = compressed ? 8 : 16;
        if (pen && pen.kind === "plus-pen") {
          applyEmfPlusPen(ctx, pen);
        }
        applyPlusWorldTransform(rCtx);
        let rOff = dataOff + 4;
        for (let i = 0; i < count && rOff + rectSize <= dataOff + recDataSize; i++) {
          const { x, y, w, h } = readRectFromView(view, rOff, compressed);
          ctx.strokeRect(x, y, w, h);
          rOff += rectSize;
        }
      }
      return true;
    }
    case EMFPLUS_FILLELLIPSE: {
      if (recDataSize >= 12) {
        const brushVal = view.getUint32(dataOff, true);
        const compressed = (recFlags & 16384) !== 0;
        let x, y, w, h;
        if (compressed) {
          x = view.getInt16(dataOff + 4, true);
          y = view.getInt16(dataOff + 6, true);
          w = view.getInt16(dataOff + 8, true);
          h = view.getInt16(dataOff + 10, true);
        } else {
          if (recDataSize < 20) {
            return true;
          }
          x = view.getFloat32(dataOff + 4, true);
          y = view.getFloat32(dataOff + 8, true);
          w = view.getFloat32(dataOff + 12, true);
          h = view.getFloat32(dataOff + 16, true);
        }
        ctx.fillStyle = resolveBrushPaint(rCtx, recFlags, brushVal);
        applyPlusWorldTransform(rCtx);
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w) / 2, Math.abs(h) / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      return true;
    }
    case EMFPLUS_DRAWELLIPSE: {
      const penId = recFlags & 255;
      const pen = objectTable.get(penId);
      const compressed = (recFlags & 16384) !== 0;
      let x, y, w, h;
      if (compressed && recDataSize >= 8) {
        x = view.getInt16(dataOff, true);
        y = view.getInt16(dataOff + 2, true);
        w = view.getInt16(dataOff + 4, true);
        h = view.getInt16(dataOff + 6, true);
      } else if (!compressed && recDataSize >= 16) {
        x = view.getFloat32(dataOff, true);
        y = view.getFloat32(dataOff + 4, true);
        w = view.getFloat32(dataOff + 8, true);
        h = view.getFloat32(dataOff + 12, true);
      } else {
        return true;
      }
      if (pen && pen.kind === "plus-pen") {
        applyEmfPlusPen(ctx, pen);
      }
      applyPlusWorldTransform(rCtx);
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w) / 2, Math.abs(h) / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      return true;
    }
    case EMFPLUS_FILLPIE:
    case EMFPLUS_DRAWPIE:
    case EMFPLUS_DRAWARC: {
      const isFill = recType === EMFPLUS_FILLPIE;
      const minSize = isFill ? 12 : 8;
      if (recDataSize < minSize) {
        return true;
      }
      let aOff = dataOff;
      if (isFill) {
        const brushVal = view.getUint32(aOff, true);
        ctx.fillStyle = resolveBrushPaint(rCtx, recFlags, brushVal);
        aOff += 4;
      }
      const startAngle = view.getFloat32(aOff, true) * Math.PI / 180;
      const sweepAngle = view.getFloat32(aOff + 4, true) * Math.PI / 180;
      aOff += 8;
      const compressed = (recFlags & 16384) !== 0;
      let x, y, w, h;
      if (compressed && aOff + 8 <= dataOff + recDataSize) {
        x = view.getInt16(aOff, true);
        y = view.getInt16(aOff + 2, true);
        w = view.getInt16(aOff + 4, true);
        h = view.getInt16(aOff + 6, true);
      } else if (!compressed && aOff + 16 <= dataOff + recDataSize) {
        x = view.getFloat32(aOff, true);
        y = view.getFloat32(aOff + 4, true);
        w = view.getFloat32(aOff + 8, true);
        h = view.getFloat32(aOff + 12, true);
      } else {
        return true;
      }
      if (recType !== EMFPLUS_FILLPIE) {
        const penId = recFlags & 255;
        const pen = objectTable.get(penId);
        if (pen && pen.kind === "plus-pen") {
          applyEmfPlusPen(ctx, pen);
        }
      }
      applyPlusWorldTransform(rCtx);
      ctx.beginPath();
      const cx = x + w / 2;
      const cy = y + h / 2;
      const rx = Math.abs(w) / 2;
      const ry = Math.abs(h) / 2;
      if (isFill) {
        ctx.moveTo(cx, cy);
      }
      ctx.ellipse(cx, cy, rx, ry, 0, startAngle, startAngle + sweepAngle, sweepAngle < 0);
      if (isFill) {
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.stroke();
      }
      return true;
    }
    case EMFPLUS_DRAWLINES: {
      if (recDataSize >= 4) {
        const penId = recFlags & 255;
        const pen = objectTable.get(penId);
        const count = view.getUint32(dataOff, true);
        const compressed = (recFlags & 16384) !== 0;
        const ptSize = compressed ? 4 : 8;
        if (pen && pen.kind === "plus-pen") {
          applyEmfPlusPen(ctx, pen);
        }
        applyPlusWorldTransform(rCtx);
        ctx.beginPath();
        let pOff = dataOff + 4;
        for (let i = 0; i < count && pOff + ptSize <= dataOff + recDataSize; i++) {
          const pt = readPointFromView(view, pOff, compressed);
          if (i === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
          pOff += ptSize;
        }
        if (recFlags & 8192) {
          ctx.closePath();
        }
        ctx.stroke();
      }
      return true;
    }
    case EMFPLUS_FILLPOLYGON: {
      if (recDataSize >= 8) {
        const brushVal = view.getUint32(dataOff, true);
        const count = view.getUint32(dataOff + 4, true);
        const compressed = (recFlags & 16384) !== 0;
        const ptSize = compressed ? 4 : 8;
        ctx.fillStyle = resolveBrushPaint(rCtx, recFlags, brushVal);
        applyPlusWorldTransform(rCtx);
        ctx.beginPath();
        let pOff = dataOff + 8;
        for (let i = 0; i < count && pOff + ptSize <= dataOff + recDataSize; i++) {
          const pt = readPointFromView(view, pOff, compressed);
          if (i === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
          pOff += ptSize;
        }
        ctx.closePath();
        ctx.fill();
      }
      return true;
    }
    default:
      return false;
  }
}
var BRUSH_DATA_PATH = 1;
var BRUSH_DATA_TRANSFORM = 2;
var BRUSH_DATA_PRESET_COLORS = 4;
var BRUSH_DATA_BLEND_FACTORS_H = 8;
var MAX_GRADIENT_ELEMENTS = 4096;
function looksLikeGraphicsVersion(v) {
  return v >>> 12 === 900097;
}
function readTransform(view, off) {
  return [
    view.getFloat32(off, true),
    view.getFloat32(off + 4, true),
    view.getFloat32(off + 8, true),
    view.getFloat32(off + 12, true),
    view.getFloat32(off + 16, true),
    view.getFloat32(off + 20, true)
  ];
}
function applyMatrix(m, x, y) {
  return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] };
}
function clamp01(v) {
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
}
function normaliseStops(stops) {
  return stops.map((s) => ({ offset: clamp01(s.offset), color: s.color })).sort((a, b) => a.offset - b.offset);
}
function readPresetColors(view, off, end) {
  if (off + 4 > end) {
    return null;
  }
  const count = view.getUint32(off, true);
  if (count === 0 || count > MAX_GRADIENT_ELEMENTS) {
    return null;
  }
  const posOff = off + 4;
  const colOff = posOff + count * 4;
  const next = colOff + count * 4;
  if (next > end) {
    return null;
  }
  const stops = [];
  for (let i = 0; i < count; i++) {
    stops.push({
      offset: view.getFloat32(posOff + i * 4, true),
      color: argbToRgba(view.getUint32(colOff + i * 4, true))
    });
  }
  return { stops, next };
}
function readBlendFactors(view, off, end) {
  if (off + 4 > end) {
    return null;
  }
  const count = view.getUint32(off, true);
  if (count === 0 || count > MAX_GRADIENT_ELEMENTS) {
    return null;
  }
  const posOff = off + 4;
  const facOff = posOff + count * 4;
  const next = facOff + count * 4;
  if (next > end) {
    return null;
  }
  const entries = [];
  for (let i = 0; i < count; i++) {
    entries.push({
      pos: view.getFloat32(posOff + i * 4, true),
      factor: view.getFloat32(facOff + i * 4, true)
    });
  }
  return { entries, next };
}
function parseLinearGradient(view, b, end) {
  if (b + 40 > end) {
    return null;
  }
  const flags = view.getUint32(b, true);
  const rx = view.getFloat32(b + 8, true);
  const ry = view.getFloat32(b + 12, true);
  const rw = view.getFloat32(b + 16, true);
  const rh = view.getFloat32(b + 20, true);
  const startArgb = view.getUint32(b + 24, true);
  const endArgb = view.getUint32(b + 28, true);
  let o = b + 40;
  let transform = null;
  if (flags & BRUSH_DATA_TRANSFORM && o + 24 <= end) {
    transform = readTransform(view, o);
    o += 24;
  }
  let stops = [
    { offset: 0, color: argbToRgba(startArgb) },
    { offset: 1, color: argbToRgba(endArgb) }
  ];
  if (flags & BRUSH_DATA_PRESET_COLORS) {
    const preset = readPresetColors(view, o, end);
    if (preset) {
      stops = preset.stops;
    }
  } else if (flags & BRUSH_DATA_BLEND_FACTORS_H) {
    const blend = readBlendFactors(view, o, end);
    if (blend) {
      stops = blend.entries.map((e) => ({
        offset: e.pos,
        color: lerpArgbToRgba(startArgb, endArgb, e.factor)
      }));
    }
  }
  let p1 = { x: rx, y: ry + rh / 2 };
  let p2 = { x: rx + rw, y: ry + rh / 2 };
  if (transform) {
    p1 = applyMatrix(transform, p1.x, p1.y);
    p2 = applyMatrix(transform, p2.x, p2.y);
  }
  emfLog(
    `parseEmfPlusBrushObject: linear gradient (${p1.x.toFixed(1)},${p1.y.toFixed(1)})\u2192(${p2.x.toFixed(1)},${p2.y.toFixed(1)}), ${stops.length} stop(s)`
  );
  return {
    kind: "plus-brush",
    color: argbToRgba(startArgb),
    gradient: {
      type: "linear",
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      stops: normaliseStops(stops)
    }
  };
}
function parsePathGradient(view, b, end) {
  if (b + 24 > end) {
    return null;
  }
  const flags = view.getUint32(b, true);
  const centerArgb = view.getUint32(b + 8, true);
  let cx = view.getFloat32(b + 12, true);
  let cy = view.getFloat32(b + 16, true);
  const surroundCount = view.getUint32(b + 20, true);
  if (surroundCount > MAX_GRADIENT_ELEMENTS) {
    return { kind: "plus-brush", color: argbToRgba(centerArgb) };
  }
  const surround = [];
  let o = b + 24;
  for (let i = 0; i < surroundCount && o + 4 <= end; i++) {
    surround.push(view.getUint32(o, true));
    o += 4;
  }
  let boundaryPts = [];
  if (flags & BRUSH_DATA_PATH) {
    if (o + 4 <= end) {
      const pathSize = view.getInt32(o, true);
      o += 4;
      if (pathSize > 0 && o + pathSize <= end) {
        const path5 = parseEmfPlusPath(view, o, pathSize);
        if (path5) {
          boundaryPts = path5.points;
        }
        o += pathSize;
      }
    }
  } else if (o + 4 <= end) {
    const ptCount = view.getUint32(o, true);
    o += 4;
    if (ptCount > 0 && ptCount <= MAX_GRADIENT_ELEMENTS && o + ptCount * 8 <= end) {
      for (let i = 0; i < ptCount; i++) {
        boundaryPts.push({
          x: view.getFloat32(o + i * 8, true),
          y: view.getFloat32(o + i * 8 + 4, true)
        });
      }
      o += ptCount * 8;
    }
  }
  let transform = null;
  if (flags & BRUSH_DATA_TRANSFORM && o + 24 <= end) {
    transform = readTransform(view, o);
    o += 24;
  }
  if (transform) {
    ({ x: cx, y: cy } = applyMatrix(transform, cx, cy));
    boundaryPts = boundaryPts.map((p) => applyMatrix(transform, p.x, p.y));
  }
  const surroundArgb = surround.length > 0 ? surround[0] : centerArgb;
  let stops = [
    { offset: 0, color: argbToRgba(centerArgb) },
    { offset: 1, color: argbToRgba(surroundArgb) }
  ];
  if (flags & BRUSH_DATA_PRESET_COLORS) {
    const preset = readPresetColors(view, o, end);
    if (preset) {
      stops = preset.stops.map((s) => ({ offset: 1 - s.offset, color: s.color }));
    }
  } else if (flags & BRUSH_DATA_BLEND_FACTORS_H) {
    const blend = readBlendFactors(view, o, end);
    if (blend) {
      stops = blend.entries.map((e) => ({
        offset: 1 - e.pos,
        color: lerpArgbToRgba(surroundArgb, centerArgb, e.factor)
      }));
    }
  }
  let r = 0;
  for (const p of boundaryPts) {
    const d = Math.hypot(p.x - cx, p.y - cy);
    if (d > r) {
      r = d;
    }
  }
  if (!(r > 0)) {
    return { kind: "plus-brush", color: argbToRgba(centerArgb) };
  }
  emfLog(
    `parseEmfPlusBrushObject: path gradient centre=(${cx.toFixed(1)},${cy.toFixed(1)}), r=${r.toFixed(1)}, ${stops.length} stop(s)`
  );
  return {
    kind: "plus-brush",
    color: argbToRgba(centerArgb),
    gradient: { type: "radial", cx, cy, r, stops: normaliseStops(stops) }
  };
}
function parseEmfPlusBrushObject(view, dataOff, recDataSize) {
  if (recDataSize < 8) {
    return null;
  }
  const end = dataOff + recDataSize;
  const hasVersion = looksLikeGraphicsVersion(view.getUint32(dataOff, true));
  const typeOff = dataOff + (hasVersion ? 4 : 0);
  if (typeOff + 8 > end) {
    return null;
  }
  const brushType = view.getUint32(typeOff, true);
  const b = typeOff + 4;
  switch (brushType) {
    case EMFPLUS_BRUSHTYPE_SOLID:
      return { kind: "plus-brush", color: argbToRgba(view.getUint32(b, true)) };
    case EMFPLUS_BRUSHTYPE_HATCHFILL:
      if (b + 8 <= end) {
        return { kind: "plus-brush", color: argbToRgba(view.getUint32(b + 4, true)) };
      }
      return { kind: "plus-brush", color: "rgba(0,0,0,1)" };
    case EMFPLUS_BRUSHTYPE_LINEARGRADIENT: {
      const brush = parseLinearGradient(view, b, end);
      return brush ?? { kind: "plus-brush", color: "rgba(0,0,0,1)" };
    }
    case EMFPLUS_BRUSHTYPE_PATHGRADIENT: {
      const brush = parsePathGradient(view, b, end);
      return brush ?? { kind: "plus-brush", color: "rgba(0,0,0,1)" };
    }
    default:
      return { kind: "plus-brush", color: "rgba(0,0,0,1)" };
  }
}
var PIXELFORMAT_24BPP_RGB = 137224;
var PIXELFORMAT_32BPP_RGB = 139273;
var PIXELFORMAT_32BPP_ARGB = 2498570;
var PIXELFORMAT_32BPP_PARGB = 925707;
function decodeEmfPlusBitmapPixels(view, pixelStart, width, height, stride, pixelFormat) {
  const absStride = Math.abs(stride);
  const topDown = stride > 0;
  const rowBytes = width * 4;
  const bmpRowStride = rowBytes + 3 & -4;
  const pixelDataSize = bmpRowStride * height;
  const bmpData = new Uint8Array(pixelDataSize);
  for (let y = 0; y < height; y++) {
    const srcRow = topDown ? y : height - 1 - y;
    const rowOff = pixelStart + srcRow * absStride;
    const dstRow = (height - 1 - y) * bmpRowStride;
    switch (pixelFormat) {
      case PIXELFORMAT_32BPP_ARGB:
      case PIXELFORMAT_32BPP_PARGB: {
        for (let x = 0; x < width; x++) {
          const off = rowOff + x * 4;
          if (off + 3 >= view.byteLength) {
            break;
          }
          let b = view.getUint8(off);
          let g = view.getUint8(off + 1);
          let r = view.getUint8(off + 2);
          const a = view.getUint8(off + 3);
          if (pixelFormat === PIXELFORMAT_32BPP_PARGB && a > 0 && a < 255) {
            r = Math.min(255, Math.round(r * 255 / a));
            g = Math.min(255, Math.round(g * 255 / a));
            b = Math.min(255, Math.round(b * 255 / a));
          }
          const di = dstRow + x * 4;
          bmpData[di] = b;
          bmpData[di + 1] = g;
          bmpData[di + 2] = r;
          bmpData[di + 3] = a;
        }
        break;
      }
      case PIXELFORMAT_32BPP_RGB: {
        for (let x = 0; x < width; x++) {
          const off = rowOff + x * 4;
          if (off + 3 >= view.byteLength) {
            break;
          }
          const di = dstRow + x * 4;
          bmpData[di] = view.getUint8(off);
          bmpData[di + 1] = view.getUint8(off + 1);
          bmpData[di + 2] = view.getUint8(off + 2);
          bmpData[di + 3] = 255;
        }
        break;
      }
      case PIXELFORMAT_24BPP_RGB: {
        for (let x = 0; x < width; x++) {
          const off = rowOff + x * 3;
          if (off + 2 >= view.byteLength) {
            break;
          }
          const di = dstRow + x * 4;
          bmpData[di] = view.getUint8(off);
          bmpData[di + 1] = view.getUint8(off + 1);
          bmpData[di + 2] = view.getUint8(off + 2);
          bmpData[di + 3] = 255;
        }
        break;
      }
      default:
        return null;
    }
  }
  const fileHeaderSize = 14;
  const dibHeaderSize = 108;
  const fileSize = fileHeaderSize + dibHeaderSize + pixelDataSize;
  const bmpFile = new ArrayBuffer(fileSize);
  const bmpView = new DataView(bmpFile);
  const bmpBytes = new Uint8Array(bmpFile);
  bmpView.setUint8(0, 66);
  bmpView.setUint8(1, 77);
  bmpView.setUint32(2, fileSize, true);
  bmpView.setUint32(6, 0, true);
  bmpView.setUint32(10, fileHeaderSize + dibHeaderSize, true);
  bmpView.setUint32(14, dibHeaderSize, true);
  bmpView.setInt32(18, width, true);
  bmpView.setInt32(22, height, true);
  bmpView.setUint16(26, 1, true);
  bmpView.setUint16(28, 32, true);
  bmpView.setUint32(30, 3, true);
  bmpView.setUint32(34, pixelDataSize, true);
  bmpView.setInt32(38, 2835, true);
  bmpView.setInt32(42, 2835, true);
  bmpView.setUint32(46, 0, true);
  bmpView.setUint32(50, 0, true);
  bmpView.setUint32(54, 16711680, true);
  bmpView.setUint32(58, 65280, true);
  bmpView.setUint32(62, 255, true);
  bmpView.setUint32(66, 4278190080, true);
  bmpView.setUint32(70, 1934772034, true);
  bmpBytes.set(bmpData, fileHeaderSize + dibHeaderSize);
  return bmpFile;
}
function parseEmfPlusPenObject(view, dataOff, recDataSize) {
  if (recDataSize < 20) {
    return null;
  }
  const hasVersion = looksLikeGraphicsVersion(view.getUint32(dataOff, true));
  const penFlags = view.getUint32(dataOff + (hasVersion ? 8 : 4), true);
  const penWidth = view.getFloat32(dataOff + 16, true);
  let brushOff = dataOff + 20;
  const flagSizes = [
    [1, 4],
    // Transform (actually 24 bytes)
    [2, 4],
    // StartCap
    [4, 4],
    // EndCap
    [8, 4],
    // Join
    [16, 4],
    // MiterLimit
    [32, 4],
    // LineStyle (DashStyle)
    [64, 4],
    // DashCap
    [128, 4]
    // DashOffset
  ];
  let dashStyle = 0;
  for (const [flag, size] of flagSizes) {
    if (penFlags & flag) {
      if (flag === 1) {
        brushOff += 24;
      } else {
        if (flag === 32 && brushOff + 4 <= dataOff + recDataSize) {
          dashStyle = view.getUint32(brushOff, true);
        }
        brushOff += size;
      }
    }
  }
  if (penFlags & 256) {
    if (brushOff + 4 <= dataOff + recDataSize) {
      const dashCount = view.getUint32(brushOff, true);
      brushOff += 4 + dashCount * 4;
    }
  }
  if (penFlags & 512) {
    if (brushOff + 4 <= dataOff + recDataSize) {
      const compCount = view.getUint32(brushOff, true);
      brushOff += 4 + compCount * 4;
    }
  }
  if (penFlags & 1024) {
    if (brushOff + 4 <= dataOff + recDataSize) {
      const capSize = view.getUint32(brushOff, true);
      brushOff += 4 + capSize;
    }
  }
  if (penFlags & 2048) {
    if (brushOff + 4 <= dataOff + recDataSize) {
      const capSize = view.getUint32(brushOff, true);
      brushOff += 4 + capSize;
    }
  }
  let penColor = "rgba(0,0,0,1)";
  if (brushOff + 8 <= dataOff + recDataSize) {
    const brush = parseEmfPlusBrushObject(view, brushOff, dataOff + recDataSize - brushOff);
    if (brush) {
      penColor = brush.color;
    }
  }
  return { kind: "plus-pen", color: penColor, width: penWidth || 1, dashStyle };
}
function parseEmfPlusImageObject(view, dataOff, recDataSize, objectId) {
  let imgData = null;
  const imgType = view.getUint32(dataOff + 4, true);
  if (imgType === 1 && recDataSize >= 28) {
    const bmpType = view.getUint32(dataOff + 24, true);
    if (bmpType === 1) {
      const bmpW = view.getInt32(dataOff + 8, true);
      const bmpH = view.getInt32(dataOff + 12, true);
      const bmpStride = view.getInt32(dataOff + 16, true);
      const pixelFormat = view.getUint32(dataOff + 20, true);
      emfLog(
        `  Bitmap(Pixel): ${bmpW}\xD7${bmpH}, stride=${bmpStride}, pixelFormat=0x${pixelFormat.toString(16).padStart(8, "0")}`
      );
      const pixelStart = dataOff + 28;
      const absStride = Math.abs(bmpStride);
      if (bmpW > 0 && bmpH > 0 && bmpW <= 8192 && bmpH <= 8192 && pixelStart + absStride * bmpH <= view.byteLength) {
        const decoded = decodeEmfPlusBitmapPixels(
          view,
          pixelStart,
          bmpW,
          bmpH,
          bmpStride,
          pixelFormat
        );
        if (decoded) {
          emfLog(`  Bitmap(Pixel): decoded successfully, size=${decoded.byteLength} bytes`);
          imgData = decoded;
        }
      }
    } else if (bmpType === 2) {
      const imgStart = dataOff + 28;
      const imgLen = recDataSize - 28;
      emfLog(`  Bitmap(Compressed): imgLen=${imgLen}, imgStart=0x${imgStart.toString(16)}`);
      if (imgLen > 0 && imgStart + imgLen <= view.byteLength) {
        imgData = view.buffer.slice(
          view.byteOffset + imgStart,
          view.byteOffset + imgStart + imgLen
        );
        if (imgData.byteLength >= 4) {
          const hdr = new Uint8Array(imgData, 0, 4);
          emfLog(
            `  Bitmap(Compressed): first 4 bytes = [${Array.from(hdr).map((b) => b.toString(16).padStart(2, "0")).join(" ")}]`
          );
        }
      }
    }
  } else if (imgType === 2 && recDataSize >= 12) {
    view.getUint32(dataOff + 8, true);
    const mfDataSize = view.getUint32(dataOff + 12, true);
    const mfStart = dataOff + 16;
    if (mfDataSize > 0 && mfStart + mfDataSize <= view.byteLength) {
      imgData = view.buffer.slice(
        view.byteOffset + mfStart,
        view.byteOffset + mfStart + mfDataSize
      );
      if (imgData.byteLength >= 4) {
        const hdr = new DataView(imgData);
        hdr.getUint32(0, true);
      }
    } else {
      emfWarn(
        `  Metafile: out of bounds or empty (mfStart=0x${mfStart.toString(16)}, mfDataSize=${mfDataSize}, viewLen=${view.byteLength})`
      );
    }
  }
  return { data: imgData, type: imgType };
}
function parseEmfPlusFontObject(view, dataOff, recDataSize) {
  if (recDataSize < 28) {
    return null;
  }
  const emSize = view.getFloat32(dataOff + 4, true);
  const styleFlags = view.getInt32(dataOff + 12, true);
  const nameLen = view.getUint32(dataOff + 20, true);
  let family = "sans-serif";
  if (nameLen > 0 && dataOff + 24 + nameLen * 2 <= dataOff + recDataSize) {
    family = readUtf16LE(view, dataOff + 24, nameLen) || "sans-serif";
  }
  return { kind: "plus-font", emSize: emSize || 12, flags: styleFlags, family };
}
function handleEmfPlusObjectRecord(rCtx, recFlags, dataOff, recDataSize) {
  const { view, objectTable } = rCtx;
  const objectId = recFlags & 255;
  const objectType = recFlags >> 8 & 127;
  switch (objectType) {
    // ---------------------------------------------------------------
    // Brush
    // ---------------------------------------------------------------
    case EMFPLUS_OBJECTTYPE_BRUSH: {
      const brush = parseEmfPlusBrushObject(view, dataOff, recDataSize);
      if (brush) {
        objectTable.set(objectId, brush);
      }
      break;
    }
    // ---------------------------------------------------------------
    // Pen
    // ---------------------------------------------------------------
    case EMFPLUS_OBJECTTYPE_PEN: {
      const pen = parseEmfPlusPenObject(view, dataOff, recDataSize);
      if (pen) {
        objectTable.set(objectId, pen);
      }
      break;
    }
    // ---------------------------------------------------------------
    // Path
    // ---------------------------------------------------------------
    case EMFPLUS_OBJECTTYPE_PATH: {
      const path5 = parseEmfPlusPath(view, dataOff, recDataSize);
      if (path5) {
        objectTable.set(objectId, path5);
      }
      break;
    }
    // ---------------------------------------------------------------
    // Font
    // ---------------------------------------------------------------
    case EMFPLUS_OBJECTTYPE_FONT: {
      const font = parseEmfPlusFontObject(view, dataOff, recDataSize);
      if (font) {
        objectTable.set(objectId, font);
      }
      break;
    }
    // ---------------------------------------------------------------
    // StringFormat
    // ---------------------------------------------------------------
    case EMFPLUS_OBJECTTYPE_STRINGFORMAT: {
      if (recDataSize >= 16) {
        const sfFlags = view.getUint32(dataOff + 4, true);
        const alignment = view.getUint32(dataOff + 12, true);
        const lineAlignment = view.getUint32(dataOff + 16, true);
        objectTable.set(objectId, {
          kind: "plus-stringformat",
          flags: sfFlags,
          alignment: alignment ?? 0,
          lineAlignment: lineAlignment ?? 0
        });
      }
      break;
    }
    // ---------------------------------------------------------------
    // Image
    // ---------------------------------------------------------------
    case EMFPLUS_OBJECTTYPE_IMAGE: {
      if (recDataSize < 8) {
        break;
      }
      const parsed = parseEmfPlusImageObject(view, dataOff, recDataSize);
      objectTable.set(objectId, {
        kind: "plus-image",
        data: parsed.data,
        type: parsed.type
      });
      rCtx.totalImageObjects++;
      break;
    }
    // ---------------------------------------------------------------
    // ImageAttributes
    // ---------------------------------------------------------------
    case EMFPLUS_OBJECTTYPE_IMAGEATTRIBUTES: {
      objectTable.set(objectId, { kind: "plus-imageattributes" });
      break;
    }
    // ---------------------------------------------------------------
    // Region
    // ---------------------------------------------------------------
    case EMFPLUS_OBJECTTYPE_REGION: {
      const region = parseEmfPlusRegionObject(view, dataOff, recDataSize);
      if (region) {
        objectTable.set(objectId, region);
      }
      break;
    }
  }
}
var MAX_REGION_NODE_DEPTH = 64;
function parseRegionNode(view, off, endOff, depth = 0) {
  if (off + 4 > endOff) {
    return null;
  }
  if (depth > MAX_REGION_NODE_DEPTH) {
    return null;
  }
  const nodeType = view.getUint32(off, true);
  let cursor = off + 4;
  if (nodeType <= 5) {
    const leftResult = parseRegionNode(view, cursor, endOff, depth + 1);
    if (!leftResult) {
      return null;
    }
    cursor += leftResult.bytesRead;
    const rightResult = parseRegionNode(view, cursor, endOff, depth + 1);
    if (!rightResult) {
      return null;
    }
    cursor += rightResult.bytesRead;
    return {
      node: {
        type: "combine",
        combineMode: nodeType,
        left: leftResult.node,
        right: rightResult.node
      },
      bytesRead: cursor - off
    };
  }
  if (nodeType === 268435456) {
    if (cursor + 16 > endOff) {
      return null;
    }
    const x = view.getFloat32(cursor, true);
    const y = view.getFloat32(cursor + 4, true);
    const w = view.getFloat32(cursor + 8, true);
    const h = view.getFloat32(cursor + 12, true);
    return {
      node: { type: "rect", x, y, width: w, height: h },
      bytesRead: cursor + 16 - off
    };
  }
  if (nodeType === 268435457) {
    if (cursor + 4 > endOff) {
      return null;
    }
    const pathDataSize = view.getInt32(cursor, true);
    cursor += 4;
    if (pathDataSize <= 0 || cursor + pathDataSize > endOff) {
      return null;
    }
    const path5 = parseEmfPlusPath(view, cursor, pathDataSize);
    return {
      node: path5 ? { type: "path", path: path5 } : { type: "empty" },
      bytesRead: cursor + pathDataSize - off
    };
  }
  if (nodeType === 268435458) {
    return { node: { type: "empty" }, bytesRead: 4 };
  }
  if (nodeType === 268435459) {
    return { node: { type: "infinite" }, bytesRead: 4 };
  }
  emfWarn(`parseRegionNode: unknown node type 0x${nodeType.toString(16)}`);
  return { node: { type: "empty" }, bytesRead: 4 };
}
function parseEmfPlusRegionObject(view, off, maxLen) {
  if (maxLen < 8) {
    return null;
  }
  view.getUint32(off, true);
  const regionNodeCount = view.getUint32(off + 4, true);
  if (regionNodeCount === 0 || regionNodeCount > 1e5) {
    return null;
  }
  const endOff = off + maxLen;
  const result = parseRegionNode(view, off + 8, endOff);
  if (!result) {
    return null;
  }
  return {
    kind: "plus-region",
    nodes: [result.node]
  };
}
function handleEmfPlusTextImageRecord(rCtx, recType, recFlags, dataOff, recDataSize) {
  const { ctx, view, objectTable } = rCtx;
  switch (recType) {
    // ---- path-based drawing ----
    case EMFPLUS_FILLPATH: {
      if (recDataSize >= 4) {
        const brushVal = view.getUint32(dataOff, true);
        const pathId = recFlags & 255;
        const pathObj = objectTable.get(pathId);
        if (pathObj && pathObj.kind === "plus-path") {
          ctx.fillStyle = resolveBrushPaint(rCtx, recFlags, brushVal);
          applyPlusWorldTransform(rCtx);
          replayEmfPlusPath(ctx, pathObj);
          ctx.fill();
        }
      }
      return true;
    }
    case EMFPLUS_DRAWPATH: {
      if (recDataSize >= 4) {
        const penIndex = view.getUint32(dataOff, true);
        const pathId = recFlags & 255;
        const pathObj = objectTable.get(pathId);
        const pen = objectTable.get(penIndex & 255);
        if (pathObj && pathObj.kind === "plus-path") {
          if (pen && pen.kind === "plus-pen") {
            ctx.strokeStyle = pen.color;
            ctx.lineWidth = pen.width;
          }
          applyPlusWorldTransform(rCtx);
          replayEmfPlusPath(ctx, pathObj);
          ctx.stroke();
        }
      }
      return true;
    }
    // ---- text ----
    case EMFPLUS_DRAWSTRING: {
      if (recDataSize >= 28) {
        const brushVal = view.getUint32(dataOff, true);
        const formatId = view.getUint32(dataOff + 4, true);
        const strLen = view.getUint32(dataOff + 8, true);
        const layoutX = view.getFloat32(dataOff + 12, true);
        const layoutY = view.getFloat32(dataOff + 16, true);
        view.getFloat32(dataOff + 20, true);
        view.getFloat32(dataOff + 24, true);
        const fontId = recFlags & 255;
        const font = objectTable.get(fontId);
        if (strLen > 0 && dataOff + 28 + strLen * 2 <= dataOff + recDataSize) {
          const text = readUtf16LE(view, dataOff + 28, strLen);
          if (text.length > 0 && font && font.kind === "plus-font") {
            const bold = font.flags & 1 ? "bold " : "";
            const italic = font.flags & 2 ? "italic " : "";
            const family = mapFontFamily(font.family, rCtx.fontFamilyMap);
            ctx.font = `${italic}${bold}${font.emSize}px ${family}`;
            ctx.fillStyle = resolveBrushPaint(rCtx, recFlags, brushVal);
            ctx.textBaseline = "top";
            const sf = objectTable.get(formatId);
            if (sf && sf.kind === "plus-stringformat") {
              switch (sf.alignment) {
                case 1:
                  ctx.textAlign = "center";
                  break;
                case 2:
                  ctx.textAlign = "right";
                  break;
                default:
                  ctx.textAlign = "left";
              }
            } else {
              ctx.textAlign = "left";
            }
            applyPlusWorldTransform(rCtx);
            ctx.fillText(text, layoutX, layoutY);
          }
        }
      }
      return true;
    }
    case EMFPLUS_DRAWDRIVERSTRING: {
      if (recDataSize >= 16) {
        const brushVal = view.getUint32(dataOff, true);
        const glyphCount = view.getUint32(dataOff + 12, true);
        const fontId = recFlags & 255;
        const font = objectTable.get(fontId);
        const glyphsOff = dataOff + 16;
        const posOff = glyphsOff + glyphCount * 2;
        const alignedPosOff = posOff + 3 & -4;
        if (glyphCount > 0 && glyphCount < 1e5 && alignedPosOff + glyphCount * 8 <= dataOff + recDataSize && font && font.kind === "plus-font") {
          const text = readUtf16LE(view, glyphsOff, glyphCount);
          if (text.length > 0) {
            const bold = font.flags & 1 ? "bold " : "";
            const italic = font.flags & 2 ? "italic " : "";
            const family = mapFontFamily(font.family, rCtx.fontFamilyMap);
            ctx.font = `${italic}${bold}${font.emSize}px ${family}`;
            ctx.fillStyle = resolveBrushPaint(rCtx, recFlags, brushVal);
            ctx.textBaseline = "alphabetic";
            ctx.textAlign = "left";
            applyPlusWorldTransform(rCtx);
            const gx = view.getFloat32(alignedPosOff, true);
            const gy = view.getFloat32(alignedPosOff + 4, true);
            ctx.fillText(text, gx, gy);
          }
        }
      }
      return true;
    }
    // ---- images ----
    case EMFPLUS_DRAWIMAGE: {
      if (recDataSize >= 24) {
        const imgId = recFlags & 255;
        const imgObj = objectTable.get(imgId);
        const compressed = (recFlags & 16384) !== 0;
        const rectOff = dataOff + 24;
        let dx, dy, dw, dh;
        if (compressed && rectOff + 8 <= dataOff + recDataSize) {
          dx = view.getInt16(rectOff, true);
          dy = view.getInt16(rectOff + 2, true);
          dw = view.getInt16(rectOff + 4, true);
          dh = view.getInt16(rectOff + 6, true);
        } else if (!compressed && rectOff + 16 <= dataOff + recDataSize) {
          dx = view.getFloat32(rectOff, true);
          dy = view.getFloat32(rectOff + 4, true);
          dw = view.getFloat32(rectOff + 8, true);
          dh = view.getFloat32(rectOff + 12, true);
        } else {
          return true;
        }
        rCtx.totalDrawImageCalls++;
        const hasData = imgObj && imgObj.kind === "plus-image" && imgObj.data;
        emfLog(
          `DrawImage: imgId=${imgId}, dest=(${dx},${dy},${dw},${dh}), compressed=${compressed}, hasObj=${Boolean(imgObj)}, objKind=${imgObj?.kind}, hasData=${Boolean(hasData)}, dataLen=${hasData ? imgObj.data.byteLength : 0}, isMetafile=${imgObj?.kind === "plus-image" ? imgObj.type === 2 : "N/A"}`
        );
        emfLog(
          `DrawImage: worldTransform=[${rCtx.worldTransform.map((v) => v.toFixed(3)).join(", ")}]`
        );
        if (imgObj && imgObj.kind === "plus-image" && imgObj.data) {
          const wt = rCtx.worldTransform;
          const s = getPageUnitMultiplier(rCtx.pageUnit, rCtx.pageScale) * rCtx.dpiScale;
          rCtx.deferredImages.push({
            imageData: imgObj.data,
            dx,
            dy,
            dw,
            dh,
            transform: [
              wt[0] * s,
              wt[1] * s,
              wt[2] * s,
              wt[3] * s,
              wt[4] * s,
              wt[5] * s
            ],
            isMetafile: imgObj.type === 2
          });
          emfLog(`DrawImage: queued deferred image (total=${rCtx.deferredImages.length})`);
        }
      }
      return true;
    }
    case EMFPLUS_DRAWIMAGEPOINTS: {
      if (recDataSize >= 28) {
        const imgId = recFlags & 255;
        const imgObj = objectTable.get(imgId);
        const count = view.getUint32(dataOff + 24, true);
        const compressed = (recFlags & 16384) !== 0;
        const ptOff = dataOff + 28;
        if (count >= 3 && imgObj && imgObj.kind === "plus-image" && imgObj.data) {
          let p1x, p1y, p2x, p2y, p3x, p3y;
          if (compressed && ptOff + 12 <= dataOff + recDataSize) {
            p1x = view.getInt16(ptOff, true);
            p1y = view.getInt16(ptOff + 2, true);
            p2x = view.getInt16(ptOff + 4, true);
            p2y = view.getInt16(ptOff + 6, true);
            p3x = view.getInt16(ptOff + 8, true);
            p3y = view.getInt16(ptOff + 10, true);
          } else if (!compressed && ptOff + 24 <= dataOff + recDataSize) {
            p1x = view.getFloat32(ptOff, true);
            p1y = view.getFloat32(ptOff + 4, true);
            p2x = view.getFloat32(ptOff + 8, true);
            p2y = view.getFloat32(ptOff + 12, true);
            p3x = view.getFloat32(ptOff + 16, true);
            p3y = view.getFloat32(ptOff + 20, true);
          } else {
            return true;
          }
          const dx = p1x;
          const dy = p1y;
          const dw = Math.sqrt((p2x - p1x) ** 2 + (p2y - p1y) ** 2);
          const dh = Math.sqrt((p3x - p1x) ** 2 + (p3y - p1y) ** 2);
          rCtx.totalDrawImageCalls++;
          emfLog(
            `DrawImagePoints: imgId=${imgId}, points=[(${p1x},${p1y}),(${p2x},${p2y}),(${p3x},${p3y})], dest=(${dx.toFixed(1)},${dy.toFixed(1)},${dw.toFixed(1)},${dh.toFixed(1)})`
          );
          emfLog(
            `DrawImagePoints: worldTransform=[${rCtx.worldTransform.map((v) => v.toFixed(3)).join(", ")}]`
          );
          const wt2 = rCtx.worldTransform;
          const s2 = getPageUnitMultiplier(rCtx.pageUnit, rCtx.pageScale) * rCtx.dpiScale;
          rCtx.deferredImages.push({
            imageData: imgObj.data,
            dx,
            dy,
            dw,
            dh,
            transform: [
              wt2[0] * s2,
              wt2[1] * s2,
              wt2[2] * s2,
              wt2[3] * s2,
              wt2[4] * s2,
              wt2[5] * s2
            ],
            isMetafile: imgObj.type === 2
          });
          emfLog(`DrawImagePoints: queued deferred image (total=${rCtx.deferredImages.length})`);
        } else {
          imgObj && imgObj.kind === "plus-image" && imgObj.data;
        }
      }
      return true;
    }
    default:
      return false;
  }
}
var EMFPLUS_REC_NAMES = {
  16385: "Header",
  16386: "EndOfFile",
  16388: "GetDC",
  16392: "Object",
  16394: "FillRects",
  16395: "DrawRects",
  16396: "FillPolygon",
  16397: "DrawLines",
  16398: "FillEllipse",
  16399: "DrawEllipse",
  16404: "FillPath",
  16405: "DrawPath",
  16410: "DrawImage",
  16411: "DrawImagePoints",
  16412: "DrawString",
  16438: "DrawDriverString",
  16414: "SetAntiAliasMode",
  16426: "SetWorldTransform",
  16427: "ResetWorldTransform",
  16428: "MultiplyWorldTransform",
  16432: "SetPageTransform",
  16433: "ResetClip",
  16434: "SetClipRect",
  16435: "SetClipPath",
  16436: "SetClipRegion",
  16437: "OffsetClip",
  16421: "Save",
  16422: "Restore",
  16424: "BeginContainerNoParams",
  16425: "EndContainer"
};
function replayEmfPlusRecords(view, offset, length, ctx, _canvasW, _canvasH, state, dpiScale = 1, maxRecords = MAX_RECORDS_EMFPLUS_DEFAULT, fontFamilyMap) {
  const s = state ?? createEmfPlusState();
  const rCtx = {
    ctx,
    view,
    objectTable: s.objectTable,
    worldTransform: s.worldTransform,
    deferredImages: [],
    saveStack: s.saveStack,
    saveIdMap: s.saveIdMap,
    totalImageObjects: 0,
    totalDrawImageCalls: 0,
    clipSaveDepth: s.clipSaveDepth,
    clipRegion: s.clipRegion,
    pageUnit: 2,
    pageScale: 1,
    continuationBuffer: null,
    continuationObjectId: -1,
    continuationObjectType: 0,
    continuationTotalSize: 0,
    continuationOffset: 0,
    dpiScale,
    fontFamilyMap
  };
  const end = offset + length;
  let recordCount = 0;
  const emfPlusRecordTypes = /* @__PURE__ */ new Map();
  emfLog(`replayEmfPlusRecords: offset=0x${offset.toString(16)}, length=${length}`);
  while (offset + 12 <= end && recordCount < maxRecords) {
    const recType = view.getUint16(offset, true);
    const recFlags = view.getUint16(offset + 2, true);
    const recSize = view.getUint32(offset + 4, true);
    const recDataSize = view.getUint32(offset + 8, true);
    if (recSize < 12 || offset + recSize > end) {
      break;
    }
    recordCount++;
    emfPlusRecordTypes.set(recType, (emfPlusRecordTypes.get(recType) ?? 0) + 1);
    const dataOff = offset + 12;
    switch (recType) {
      case EMFPLUS_HEADER: {
        if (recDataSize >= 16) {
          view.getFloat32(dataOff + 8, true);
          view.getFloat32(dataOff + 12, true);
        }
        break;
      }
      case EMFPLUS_ENDOFFILE:
        offset = end;
        continue;
      case EMFPLUS_GETDC:
        break;
      case EMFPLUS_OBJECT: {
        const isContinuation = (recFlags & 32768) !== 0;
        const objectId = recFlags & 255;
        if (isContinuation) {
          if (rCtx.continuationBuffer === null) {
            if (recDataSize >= 4) {
              const totalSize = view.getUint32(dataOff, true);
              const objectType = recFlags >> 8 & 127;
              const MAX_CONTINUATION_BYTES = 64 * 1024 * 1024;
              const remainingEmfPlusBytes = view.byteLength - dataOff;
              if (!Number.isFinite(totalSize) || totalSize <= 0 || totalSize > MAX_CONTINUATION_BYTES || totalSize > remainingEmfPlusBytes || recDataSize - 4 < 0) ;
              else {
                rCtx.continuationTotalSize = totalSize;
                rCtx.continuationObjectId = objectId;
                rCtx.continuationObjectType = objectType;
                rCtx.continuationBuffer = new Uint8Array(totalSize);
                const chunkSize = recDataSize - 4;
                const chunk = new Uint8Array(
                  view.buffer,
                  view.byteOffset + dataOff + 4,
                  Math.min(chunkSize, totalSize)
                );
                rCtx.continuationBuffer.set(chunk, 0);
                rCtx.continuationOffset = chunk.length;
              }
            }
          } else {
            const remaining = rCtx.continuationTotalSize - rCtx.continuationOffset;
            const chunk = new Uint8Array(
              view.buffer,
              view.byteOffset + dataOff,
              Math.min(recDataSize, remaining)
            );
            rCtx.continuationBuffer.set(chunk, rCtx.continuationOffset);
            rCtx.continuationOffset += chunk.length;
          }
        } else if (rCtx.continuationBuffer !== null && objectId === rCtx.continuationObjectId) {
          const remaining = rCtx.continuationTotalSize - rCtx.continuationOffset;
          const chunk = new Uint8Array(
            view.buffer,
            view.byteOffset + dataOff,
            Math.min(recDataSize, remaining)
          );
          rCtx.continuationBuffer.set(chunk, rCtx.continuationOffset);
          const completeView = new DataView(
            rCtx.continuationBuffer.buffer,
            rCtx.continuationBuffer.byteOffset,
            rCtx.continuationBuffer.byteLength
          );
          const assembledFlags = rCtx.continuationObjectType << 8 | objectId;
          handleEmfPlusObjectRecord(
            { ...rCtx, view: completeView },
            assembledFlags,
            0,
            rCtx.continuationTotalSize
          );
          rCtx.continuationBuffer = null;
          rCtx.continuationObjectId = -1;
          rCtx.continuationObjectType = 0;
          rCtx.continuationTotalSize = 0;
          rCtx.continuationOffset = 0;
        } else {
          handleEmfPlusObjectRecord(rCtx, recFlags, dataOff, recDataSize);
        }
        break;
      }
      default: {
        const handled = handleEmfPlusDrawRecord(rCtx, recType, recFlags, dataOff, recDataSize) || handleEmfPlusTextImageRecord(rCtx, recType, recFlags, dataOff, recDataSize) || handleEmfPlusStateRecord(rCtx, recType, recFlags, dataOff, recDataSize);
        if (!handled) {
          console.warn(`[emf-converter] Unhandled EMF+ record type: 0x${recType.toString(16)}`);
        }
        break;
      }
    }
    offset += recSize;
  }
  if (recordCount >= maxRecords) {
    console.warn(
      `[emf-converter] EMF+ record limit reached (${maxRecords}). Output may be incomplete.`
    );
  }
  const summary = [];
  for (const [type, cnt] of emfPlusRecordTypes) {
    summary.push(`${EMFPLUS_REC_NAMES[type] ?? `0x${type.toString(16)}`}:${cnt}`);
  }
  emfLog(
    `replayEmfPlusRecords: totalImageObjects=${rCtx.totalImageObjects}, totalDrawImageCalls=${rCtx.totalDrawImageCalls}, deferredImages=${rCtx.deferredImages.length}`
  );
  emfLog(
    `replayEmfPlusRecords: object table has ${rCtx.objectTable.size} entries: [${Array.from(
      rCtx.objectTable.entries()
    ).map(([id, obj]) => `${id}:${obj.kind}`).join(", ")}]`
  );
  if (state) {
    state.worldTransform = rCtx.worldTransform;
    state.saveIdMap = rCtx.saveIdMap;
    state.clipRegion = rCtx.clipRegion ?? null;
    state.clipSaveDepth = rCtx.clipSaveDepth;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return rCtx.deferredImages;
}
var GDI_NAMES = {
  1: "EMR_HEADER",
  2: "EMR_POLYBEZIER",
  3: "EMR_POLYGON",
  4: "EMR_POLYLINE",
  5: "EMR_POLYBEZIERTO",
  6: "EMR_POLYLINETO",
  14: "EMR_EOF",
  27: "EMR_MOVETOEX",
  37: "EMR_SELECTOBJECT",
  38: "EMR_CREATEPEN",
  39: "EMR_CREATEBRUSHINDIRECT",
  40: "EMR_DELETEOBJECT",
  42: "EMR_ELLIPSE",
  43: "EMR_RECTANGLE",
  54: "EMR_LINETO",
  59: "EMR_BEGINPATH",
  60: "EMR_ENDPATH",
  62: "EMR_FILLPATH",
  63: "EMR_STROKEANDFILLPATH",
  64: "EMR_STROKEPATH",
  70: "EMR_COMMENT",
  76: "EMR_BITBLT",
  81: "EMR_STRETCHDIBITS",
  84: "EMR_EXTTEXTOUTW",
  85: "EMR_POLYBEZIER16",
  86: "EMR_POLYGON16",
  87: "EMR_POLYLINE16",
  88: "EMR_POLYBEZIERTO16",
  91: "EMR_POLYPOLYGON16"
};
function replayEmfRecords(view, ctx, bounds, canvasW, canvasH, dpiScale = 1, replayOptions = {}) {
  emfLog(
    `replayEmfRecords: bounds=(${bounds.left},${bounds.top})\u2192(${bounds.right},${bounds.bottom}), canvas=${canvasW}\xD7${canvasH}`
  );
  const allDeferredImages = [];
  const emfPlusState = createEmfPlusState();
  const maxRecords = replayOptions.maxRecords ?? MAX_RECORDS_DEFAULT;
  const maxRecordsEmfPlus = replayOptions.maxRecordsEmfPlus ?? MAX_RECORDS_EMFPLUS_DEFAULT;
  const logicalW = bounds.right - bounds.left || 1;
  const logicalH = bounds.bottom - bounds.top || 1;
  const sx = canvasW / logicalW;
  const sy = canvasH / logicalH;
  emfLog(
    `replayEmfRecords: logical=${logicalW}\xD7${logicalH}, scale=(${sx.toFixed(4)},${sy.toFixed(4)})`
  );
  const rCtx = {
    ctx,
    view,
    objectTable: /* @__PURE__ */ new Map(),
    state: { ...defaultState(), fontFamilyMap: replayOptions.fontFamilyMap },
    stateStack: [],
    inPath: false,
    windowOrg: { x: bounds.left, y: bounds.top },
    windowExt: { cx: logicalW, cy: logicalH },
    viewportOrg: { x: 0, y: 0 },
    viewportExt: { cx: canvasW, cy: canvasH },
    useMappingMode: false,
    clipSaveDepth: 0,
    bounds,
    canvasW,
    canvasH,
    sx,
    sy
  };
  let offset = 0;
  const maxOffset = view.byteLength;
  let recordCount = 0;
  let emfPlusCommentCount = 0;
  const gdiRecordTypes = /* @__PURE__ */ new Map();
  while (offset + 8 <= maxOffset && recordCount < maxRecords) {
    const recType = view.getUint32(offset, true);
    const recSize = view.getUint32(offset + 4, true);
    if (recSize < 8 || offset + recSize > maxOffset) {
      break;
    }
    recordCount++;
    const dataOff = offset + 8;
    gdiRecordTypes.set(recType, (gdiRecordTypes.get(recType) ?? 0) + 1);
    if (recType === EMR_COMMENT) {
      if (recSize >= 16) {
        const commentDataSize = view.getUint32(dataOff, true);
        const sig = view.getUint32(dataOff + 4, true);
        if (sig === EMFPLUS_SIGNATURE && commentDataSize > 4) {
          emfPlusCommentCount++;
          emfLog(
            `replayEmfRecords: EMF+ comment #${emfPlusCommentCount} at offset 0x${offset.toString(16)}, dataSize=${commentDataSize}`
          );
          const deferred = replayEmfPlusRecords(
            view,
            dataOff + 8,
            commentDataSize - 4,
            ctx,
            canvasW,
            canvasH,
            emfPlusState,
            dpiScale,
            maxRecordsEmfPlus,
            replayOptions.fontFamilyMap
          );
          emfLog(
            `replayEmfRecords: EMF+ comment #${emfPlusCommentCount} returned ${deferred.length} deferred images`
          );
          allDeferredImages.push(...deferred);
        } else if (sig === EMR_COMMENT_PUBLIC_SIGNATURE) {
          emfLog(
            `replayEmfRecords: EMR_COMMENT_PUBLIC at offset 0x${offset.toString(16)}, size=${commentDataSize}`
          );
        } else {
          emfLog(
            `replayEmfRecords: EMR_COMMENT (sig=0x${sig.toString(16).padStart(8, "0")}) at offset 0x${offset.toString(16)}, size=${commentDataSize}`
          );
        }
      }
      offset += recSize;
      continue;
    }
    if (recType === EMR_EOF) {
      const summary = [];
      for (const [type, count] of gdiRecordTypes) {
        summary.push(`${GDI_NAMES[type] ?? `0x${type.toString(16)}`}:${count}`);
      }
      emfLog(
        `replayEmfRecords: total deferred images = ${allDeferredImages.length}, EMF+ object table size = ${emfPlusState.objectTable.size}`
      );
      break;
    }
    if (recType === EMR_SETBRUSHORGEX || recType === EMR_SETMETARGN || recType === EMR_SETICMMODE || recType === EMR_SETLAYOUT || recType === EMR_HEADER) {
      offset += recSize;
      continue;
    }
    const handled = handleEmfGdiStateRecord(rCtx, recType, offset, dataOff, recSize) || handleEmfGdiDrawRecord(rCtx, recType, offset, dataOff, recSize) || handleEmfGdiPolyPathRecord(rCtx, recType, offset, dataOff, recSize);
    if (!handled) {
      console.warn(`[emf-converter] Unhandled EMR record type: ${recType}`);
    }
    offset += recSize;
  }
  if (recordCount >= maxRecords) {
    console.warn(
      `[emf-converter] EMF record limit reached (${maxRecords}). Output may be incomplete.`
    );
  }
  return allDeferredImages;
}
function handleWmfDrawRecord(wCtx, recType, offset, dataOff, recSize) {
  const { ctx, view, state, coord } = wCtx;
  const { mx, my, mw, mh } = coord;
  switch (recType) {
    case META_MOVETO:
      if (recSize >= 10) {
        state.curY = view.getInt16(dataOff, true);
        state.curX = view.getInt16(dataOff + 2, true);
      }
      return true;
    case META_LINETO:
      if (recSize >= 10) {
        const ly = view.getInt16(dataOff, true);
        const lx = view.getInt16(dataOff + 2, true);
        applyPen(ctx, state);
        ctx.beginPath();
        ctx.moveTo(mx(state.curX), my(state.curY));
        ctx.lineTo(mx(lx), my(ly));
        ctx.stroke();
        state.curX = lx;
        state.curY = ly;
      }
      return true;
    case META_RECTANGLE:
      if (recSize >= 14) {
        const b = view.getInt16(dataOff, true);
        const r = view.getInt16(dataOff + 2, true);
        const t = view.getInt16(dataOff + 4, true);
        const l = view.getInt16(dataOff + 6, true);
        applyBrush(ctx, state);
        ctx.fillRect(mx(l), my(t), mw(r - l), mh(b - t));
        applyPen(ctx, state);
        ctx.strokeRect(mx(l), my(t), mw(r - l), mh(b - t));
      }
      return true;
    case META_ROUNDRECT:
      if (recSize >= 18) {
        const rh = Math.abs(mh(view.getInt16(dataOff, true))) / 2;
        const rw = Math.abs(mw(view.getInt16(dataOff + 2, true))) / 2;
        const b = view.getInt16(dataOff + 4, true);
        const r = view.getInt16(dataOff + 6, true);
        const t = view.getInt16(dataOff + 8, true);
        const l = view.getInt16(dataOff + 10, true);
        const x1 = mx(l), y1 = my(t);
        const w = mw(r - l), h = mh(b - t);
        const radius = Math.min(rw, rh, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x1 + radius, y1);
        ctx.lineTo(x1 + w - radius, y1);
        ctx.arcTo(x1 + w, y1, x1 + w, y1 + radius, radius);
        ctx.lineTo(x1 + w, y1 + h - radius);
        ctx.arcTo(x1 + w, y1 + h, x1 + w - radius, y1 + h, radius);
        ctx.lineTo(x1 + radius, y1 + h);
        ctx.arcTo(x1, y1 + h, x1, y1 + h - radius, radius);
        ctx.lineTo(x1, y1 + radius);
        ctx.arcTo(x1, y1, x1 + radius, y1, radius);
        ctx.closePath();
        applyBrush(ctx, state);
        ctx.fill();
        applyPen(ctx, state);
        ctx.stroke();
      }
      return true;
    case META_ELLIPSE:
      if (recSize >= 14) {
        const b = view.getInt16(dataOff, true);
        const r = view.getInt16(dataOff + 2, true);
        const t = view.getInt16(dataOff + 4, true);
        const l = view.getInt16(dataOff + 6, true);
        ctx.beginPath();
        ctx.ellipse(
          mx((l + r) / 2),
          my((t + b) / 2),
          Math.abs(mw(r - l)) / 2,
          Math.abs(mh(b - t)) / 2,
          0,
          0,
          Math.PI * 2
        );
        applyBrush(ctx, state);
        ctx.fill();
        applyPen(ctx, state);
        ctx.stroke();
      }
      return true;
    case META_ARC:
    case META_PIE:
    case META_CHORD:
      if (recSize >= 22) {
        const endY = view.getInt16(dataOff, true);
        const endX = view.getInt16(dataOff + 2, true);
        const startY = view.getInt16(dataOff + 4, true);
        const startX = view.getInt16(dataOff + 6, true);
        const b = view.getInt16(dataOff + 8, true);
        const r = view.getInt16(dataOff + 10, true);
        const t = view.getInt16(dataOff + 12, true);
        const l = view.getInt16(dataOff + 14, true);
        const cxA = (l + r) / 2;
        const cyA = (t + b) / 2;
        const rxA = Math.abs(r - l) / 2;
        const ryA = Math.abs(b - t) / 2;
        const startAngle = Math.atan2((startY - cyA) / (ryA || 1), (startX - cxA) / (rxA || 1));
        const endAngle = Math.atan2((endY - cyA) / (ryA || 1), (endX - cxA) / (rxA || 1));
        ctx.beginPath();
        if (recType === META_PIE) {
          ctx.moveTo(mx(cxA), my(cyA));
        }
        ctx.ellipse(
          mx(cxA),
          my(cyA),
          Math.abs(mw(rxA)),
          Math.abs(mh(ryA)),
          0,
          startAngle,
          endAngle,
          false
        );
        if (recType === META_PIE || recType === META_CHORD) {
          ctx.closePath();
        }
        if (recType === META_PIE || recType === META_CHORD) {
          applyBrush(ctx, state);
          ctx.fill();
        }
        applyPen(ctx, state);
        ctx.stroke();
      }
      return true;
    // ---- poly ----
    case META_POLYGON:
      if (recSize >= 10) {
        const count = view.getInt16(dataOff, true);
        if (count > 0 && dataOff + 2 + count * 4 <= offset + recSize) {
          ctx.beginPath();
          for (let i = 0; i < count; i++) {
            const px = view.getInt16(dataOff + 2 + i * 4, true);
            const py = view.getInt16(dataOff + 4 + i * 4, true);
            if (i === 0) {
              ctx.moveTo(mx(px), my(py));
            } else {
              ctx.lineTo(mx(px), my(py));
            }
          }
          ctx.closePath();
          applyBrush(ctx, state);
          ctx.fill(state.polyFillMode === 2 ? "nonzero" : "evenodd");
          applyPen(ctx, state);
          ctx.stroke();
        }
      }
      return true;
    case META_POLYLINE:
      if (recSize >= 10) {
        const count = view.getInt16(dataOff, true);
        if (count > 0 && dataOff + 2 + count * 4 <= offset + recSize) {
          ctx.beginPath();
          for (let i = 0; i < count; i++) {
            const px = view.getInt16(dataOff + 2 + i * 4, true);
            const py = view.getInt16(dataOff + 4 + i * 4, true);
            if (i === 0) {
              ctx.moveTo(mx(px), my(py));
            } else {
              ctx.lineTo(mx(px), my(py));
            }
          }
          applyPen(ctx, state);
          ctx.stroke();
        }
      }
      return true;
    case META_POLYPOLYGON:
      if (recSize >= 10) {
        const numPolys = view.getUint16(dataOff, true);
        let polyOff = dataOff + 2;
        const counts = [];
        for (let p = 0; p < numPolys && polyOff + 2 <= offset + recSize; p++) {
          counts.push(view.getInt16(polyOff, true));
          polyOff += 2;
        }
        ctx.beginPath();
        for (const count of counts) {
          if (count > 0 && polyOff + count * 4 <= offset + recSize) {
            for (let i = 0; i < count; i++) {
              const px = view.getInt16(polyOff + i * 4, true);
              const py = view.getInt16(polyOff + i * 4 + 2, true);
              if (i === 0) {
                ctx.moveTo(mx(px), my(py));
              } else {
                ctx.lineTo(mx(px), my(py));
              }
            }
            ctx.closePath();
            polyOff += count * 4;
          }
        }
        applyBrush(ctx, state);
        ctx.fill(state.polyFillMode === 2 ? "nonzero" : "evenodd");
        applyPen(ctx, state);
        ctx.stroke();
      }
      return true;
    // ---- text ----
    case META_TEXTOUT:
      if (recSize >= 12) {
        const nChars = view.getInt16(dataOff, true);
        if (nChars > 0 && dataOff + 2 + nChars <= offset + recSize) {
          let text = "";
          for (let i = 0; i < nChars; i++) {
            const ch = view.getUint8(dataOff + 2 + i);
            if (ch === 0) {
              break;
            }
            text += String.fromCharCode(ch);
          }
          const strBytes = nChars + nChars % 2;
          const txOff = dataOff + 2 + strBytes;
          if (txOff + 4 <= offset + recSize) {
            const ty2 = view.getInt16(txOff, true);
            const txCoord = view.getInt16(txOff + 2, true);
            applyFont(ctx, state, Math.abs(mh(1)));
            ctx.fillStyle = state.textColor;
            ctx.fillText(text, mx(txCoord), my(ty2));
          }
        }
      }
      return true;
    case META_EXTTEXTOUT:
      if (recSize >= 14) {
        const ty2 = view.getInt16(dataOff, true);
        const txCoord = view.getInt16(dataOff + 2, true);
        const nChars = view.getInt16(dataOff + 4, true);
        const hasClipRect = (view.getUint16(dataOff + 6, true) & 4) !== 0;
        const stringOff = dataOff + 8 + (hasClipRect ? 8 : 0);
        if (nChars > 0 && stringOff + nChars <= offset + recSize) {
          let text = "";
          for (let i = 0; i < nChars; i++) {
            const ch = view.getUint8(stringOff + i);
            if (ch === 0) {
              break;
            }
            text += String.fromCharCode(ch);
          }
          applyFont(ctx, state, Math.abs(mh(1)));
          ctx.fillStyle = state.textColor;
          ctx.fillText(text, mx(txCoord), my(ty2));
        }
      }
      return true;
    default:
      return false;
  }
}
function createWmfCoord(windowOrg, windowExt, canvasW, canvasH) {
  return {
    mx: (x) => (x - windowOrg.x) / (windowExt.cx || 1) * canvasW,
    my: (y) => (y - windowOrg.y) / (windowExt.cy || 1) * canvasH,
    mw: (w) => w / (windowExt.cx || 1) * canvasW,
    mh: (h) => h / (windowExt.cy || 1) * canvasH
  };
}
function replayWmfRecords(view, ctx, header, canvasW, canvasH, replayOptions = {}) {
  const logicalW = header.boundsRight - header.boundsLeft || 1;
  const logicalH = header.boundsBottom - header.boundsTop || 1;
  const windowOrg = { x: header.boundsLeft, y: header.boundsTop };
  const windowExt = { cx: logicalW, cy: logicalH };
  const coord = createWmfCoord(windowOrg, windowExt, canvasW, canvasH);
  const objectTable = /* @__PURE__ */ new Map();
  const allocObjectSlot = () => {
    let slot = 0;
    while (objectTable.has(slot)) {
      slot++;
    }
    return slot;
  };
  const state = { ...defaultState(), fontFamilyMap: replayOptions.fontFamilyMap };
  const stateStack = [];
  const wCtx = { view, ctx, state, coord };
  let offset = header.headerSize;
  const maxOffset = view.byteLength;
  const maxRecords = replayOptions.maxRecords ?? MAX_RECORDS_DEFAULT;
  let recordCount = 0;
  while (offset + 6 <= maxOffset && recordCount < maxRecords) {
    const recSizeWords = view.getUint32(offset, true);
    const recType = view.getUint16(offset + 4, true);
    const recSize = recSizeWords * 2;
    if (recSize < 6 || offset + recSize > maxOffset) {
      break;
    }
    if (recType === META_EOF) {
      break;
    }
    recordCount++;
    const dataOff = offset + 6;
    if (handleWmfDrawRecord(wCtx, recType, offset, dataOff, recSize)) {
      offset += recSize;
      continue;
    }
    switch (recType) {
      case META_SETWINDOWORG:
        if (recSize >= 10) {
          windowOrg.y = view.getInt16(dataOff, true);
          windowOrg.x = view.getInt16(dataOff + 2, true);
        }
        break;
      case META_SETWINDOWEXT:
        if (recSize >= 10) {
          windowExt.cy = view.getInt16(dataOff, true);
          windowExt.cx = view.getInt16(dataOff + 2, true);
        }
        break;
      case META_SAVEDC:
        stateStack.push(cloneState(state));
        break;
      case META_RESTOREDC: {
        const restored = stateStack.pop();
        if (restored) {
          Object.assign(state, restored);
        }
        break;
      }
      case META_SETTEXTCOLOR:
        if (recSize >= 10) {
          state.textColor = readColorRef(view, dataOff);
        }
        break;
      case META_SETBKCOLOR:
        if (recSize >= 10) {
          state.bkColor = readColorRef(view, dataOff);
        }
        break;
      case META_SETBKMODE:
        if (recSize >= 8) {
          state.bkMode = view.getUint16(dataOff, true);
        }
        break;
      case META_SETROP2:
        if (recSize >= 8) {
          state.rop2 = view.getUint16(dataOff, true);
        }
        break;
      case META_SETPOLYFILLMODE:
        if (recSize >= 8) {
          state.polyFillMode = view.getUint16(dataOff, true);
        }
        break;
      case META_SETTEXTALIGN:
        if (recSize >= 8) {
          state.textAlign = view.getUint16(dataOff, true);
        }
        break;
      case META_CREATEPENINDIRECT:
        if (recSize >= 16) {
          const slot = allocObjectSlot();
          objectTable.set(slot, {
            kind: "pen",
            style: view.getUint16(dataOff, true) & 255,
            widthX: view.getInt16(dataOff + 2, true),
            color: readColorRef(view, dataOff + 6)
          });
        }
        break;
      case META_CREATEBRUSHINDIRECT:
        if (recSize >= 14) {
          const slot = allocObjectSlot();
          objectTable.set(slot, {
            kind: "brush",
            style: view.getUint16(dataOff, true),
            color: readColorRef(view, dataOff + 2)
          });
        }
        break;
      case META_CREATEFONTINDIRECT:
        if (recSize >= 24) {
          let family = "";
          for (let i = 0; i < 32 && dataOff + 14 + i < offset + recSize; i++) {
            const ch = view.getUint8(dataOff + 14 + i);
            if (ch === 0) {
              break;
            }
            family += String.fromCharCode(ch);
          }
          const slot = allocObjectSlot();
          objectTable.set(slot, {
            kind: "font",
            height: Math.abs(view.getInt16(dataOff, true)),
            weight: view.getInt16(dataOff + 8, true),
            italic: view.getUint8(dataOff + 10) !== 0,
            underline: view.getUint8(dataOff + 11) !== 0,
            strikeOut: view.getUint8(dataOff + 12) !== 0,
            family: family || "sans-serif"
          });
        }
        break;
      case META_SELECTOBJECT:
        if (recSize >= 8) {
          const obj = objectTable.get(view.getUint16(dataOff, true));
          if (obj) {
            switch (obj.kind) {
              case "pen":
                state.penStyle = obj.style;
                state.penWidth = obj.widthX;
                state.penColor = obj.color;
                break;
              case "brush":
                state.brushStyle = obj.style;
                state.brushColor = obj.color;
                break;
              case "font":
                state.fontHeight = obj.height;
                state.fontWeight = obj.weight;
                state.fontItalic = obj.italic;
                state.fontUnderline = obj.underline;
                state.fontStrikeOut = obj.strikeOut;
                state.fontFamily = obj.family;
                break;
            }
          }
        }
        break;
      case META_DELETEOBJECT:
        if (recSize >= 8) {
          objectTable.delete(view.getUint16(dataOff, true));
        }
        break;
    }
    offset += recSize;
  }
  if (recordCount >= maxRecords) {
    console.warn(
      `[emf-converter] WMF record limit reached (${maxRecords}). Output may be incomplete.`
    );
  }
}
var MAX_METAFILE_RECURSION = 3;
async function processDeferredImages(ctx, deferredImages, recursionDepth = 0) {
  emfLog(
    `processDeferredImages: processing ${deferredImages.length} deferred images (recursionDepth=${recursionDepth})...`
  );
  for (let idx = 0; idx < deferredImages.length; idx++) {
    const img = deferredImages[idx];
    emfLog(
      `  Deferred image [${idx}]: isMetafile=${img.isMetafile}, dataLen=${img.imageData.byteLength}, dest=(${img.dx.toFixed(1)},${img.dy.toFixed(1)},${img.dw.toFixed(1)},${img.dh.toFixed(1)}), transform=[${img.transform.map((v) => v.toFixed(3)).join(",")}]`
    );
    try {
      const plainBuffer = new ArrayBuffer(img.imageData.byteLength);
      const dstBytes = new Uint8Array(plainBuffer);
      dstBytes.set(new Uint8Array(img.imageData));
      ctx.setTransform(
        img.transform[0],
        img.transform[1],
        img.transform[2],
        img.transform[3],
        img.transform[4],
        img.transform[5]
      );
      if (img.isMetafile) {
        if (recursionDepth >= MAX_METAFILE_RECURSION) {
          emfWarn(
            `  Deferred image [${idx}]: skipping embedded metafile \u2014 recursion depth ${recursionDepth} >= ${MAX_METAFILE_RECURSION}`
          );
          continue;
        }
        emfLog(`  Deferred image [${idx}]: recursively converting embedded metafile...`);
        const metafileDataUrl = await convertEmfToDataUrl(plainBuffer, void 0, recursionDepth + 1) ?? await convertWmfToDataUrl(plainBuffer, void 0, recursionDepth + 1);
        if (metafileDataUrl) {
          emfLog(
            `  Deferred image [${idx}]: metafile converted, dataUrl length=${metafileDataUrl.length}`
          );
          const byteString = atob(metafileDataUrl.split(",")[1]);
          const mimeMatch = metafileDataUrl.match(/data:([^;]+)/);
          const mime2 = mimeMatch ? mimeMatch[1] : "image/png";
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const metaBlob = new Blob([ab], { type: mime2 });
          emfLog(
            `  Deferred image [${idx}]: creating ImageBitmap from ${metaBlob.size} byte blob (${mime2})...`
          );
          const bitmap = await createImageBitmap(metaBlob);
          emfLog(`  Deferred image [${idx}]: ImageBitmap created ${bitmap.width}\xD7${bitmap.height}`);
          ctx.drawImage(bitmap, img.dx, img.dy, img.dw, img.dh);
          bitmap.close();
        } else {
          emfWarn(`  Deferred image [${idx}]: metafile conversion returned null`);
        }
      } else {
        emfLog(
          `  Deferred image [${idx}]: creating ImageBitmap from ${plainBuffer.byteLength} byte blob...`
        );
        const blob = new Blob([plainBuffer]);
        const bitmap = await createImageBitmap(blob);
        emfLog(`  Deferred image [${idx}]: ImageBitmap created ${bitmap.width}\xD7${bitmap.height}`);
        ctx.drawImage(bitmap, img.dx, img.dy, img.dw, img.dh);
        bitmap.close();
      }
    } catch (imgErr) {
      imgErr instanceof Error ? imgErr.message : String(imgErr);
      console.warn(
        "[emf-converter] Deferred image draw failed:",
        imgErr instanceof Error ? imgErr.message : imgErr,
        `(isMetafile=${img.isMetafile}, dataLen=${img.imageData.byteLength})`
      );
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
async function convertEmfToDataUrl(buffer, options, recursionDepth = 0) {
  if (recursionDepth > MAX_METAFILE_RECURSION) {
    return null;
  }
  const opts = options ?? {};
  const dpiScale = opts.dpiScale ?? DEFAULT_DPI_SCALE;
  const effectiveMaxWidth = opts.maxWidth;
  const effectiveMaxHeight = opts.maxHeight;
  const replayOptions = {
    maxRecords: opts.maxRecords,
    maxRecordsEmfPlus: opts.maxRecords,
    fontFamilyMap: opts.fontFamilyMap
  };
  try {
    emfLog("=== convertEmfToDataUrl START ===");
    emfLog(
      `Input buffer: ${buffer.byteLength} bytes, maxWidth=${effectiveMaxWidth}, maxHeight=${effectiveMaxHeight}, dpiScale=${dpiScale}`
    );
    if (buffer.byteLength >= 16) {
      const hdrBytes = new Uint8Array(buffer, 0, 16);
      emfLog(
        `First 16 bytes: [${Array.from(hdrBytes).map((b) => b.toString(16).padStart(2, "0")).join(" ")}]`
      );
    }
    const view = new DataView(buffer);
    const header = parseEmfHeader(view);
    if (!header) {
      emfLog("convertEmfToDataUrl: parseEmfHeader returned null \u2014 returning null");
      return null;
    }
    const renderBounds = getRenderableEmfBounds(header);
    if (!renderBounds) {
      emfLog("convertEmfToDataUrl: getRenderableEmfBounds returned null \u2014 returning null");
      return null;
    }
    const logicalW = renderBounds.right - renderBounds.left;
    const logicalH = renderBounds.bottom - renderBounds.top;
    emfLog(`convertEmfToDataUrl: logicalSize=${logicalW}\xD7${logicalH}`);
    const setup = createCanvas(
      logicalW,
      logicalH,
      effectiveMaxWidth,
      effectiveMaxHeight,
      dpiScale,
      opts.maxCanvasDimension
    );
    if (!setup) {
      emfLog("convertEmfToDataUrl: createCanvas returned null \u2014 returning null");
      return null;
    }
    const { canvas, ctx } = setup;
    emfLog(
      `convertEmfToDataUrl: canvas created ${canvas.width}\xD7${canvas.height} (dpiScale=${dpiScale})`
    );
    ctx.save();
    emfLog("convertEmfToDataUrl: starting replayEmfRecords...");
    const deferredImages = replayEmfRecords(
      view,
      ctx,
      renderBounds,
      canvas.width,
      canvas.height,
      dpiScale,
      replayOptions
    );
    emfLog(
      `convertEmfToDataUrl: replayEmfRecords returned ${deferredImages.length} deferred images`
    );
    ctx.restore();
    await processDeferredImages(ctx, deferredImages);
    emfLog("convertEmfToDataUrl: exporting canvas to PNG data URL...");
    const result = await exportCanvasToPngDataUrl(canvas);
    if (result) {
      emfLog(`convertEmfToDataUrl: SUCCESS \u2014 data URL length=${result.length}`);
    } else {
      emfWarn("convertEmfToDataUrl: exportCanvasToPngDataUrl returned null");
    }
    emfLog("=== convertEmfToDataUrl END ===");
    return result;
  } catch (err2) {
    emfWarn("convertEmfToDataUrl: EXCEPTION:", err2 instanceof Error ? err2.message : err2);
    console.warn("[pptx-editor] EMF conversion failed:", err2 instanceof Error ? err2.message : err2);
    return null;
  }
}
async function convertWmfToDataUrl(buffer, options, recursionDepth = 0) {
  if (recursionDepth > MAX_METAFILE_RECURSION) {
    return null;
  }
  const opts = options ?? {};
  const dpiScale = opts.dpiScale ?? DEFAULT_DPI_SCALE;
  const effectiveMaxWidth = opts.maxWidth;
  const effectiveMaxHeight = opts.maxHeight;
  const replayOptions = {
    maxRecords: opts.maxRecords,
    fontFamilyMap: opts.fontFamilyMap
  };
  try {
    emfLog(
      "=== convertWmfToDataUrl START ===",
      `buffer=${buffer.byteLength} bytes, dpiScale=${dpiScale}`
    );
    const view = new DataView(buffer);
    const header = parseWmfHeader(view);
    if (!header) {
      emfLog("convertWmfToDataUrl: parseWmfHeader returned null");
      return null;
    }
    const logicalW = header.boundsRight - header.boundsLeft;
    const logicalH = header.boundsBottom - header.boundsTop;
    emfLog(`convertWmfToDataUrl: logicalSize=${logicalW}\xD7${logicalH}`);
    if (logicalW <= 0 || logicalH <= 0) {
      emfLog("convertWmfToDataUrl: invalid dimensions \u2014 returning null");
      return null;
    }
    const setup = createCanvas(
      logicalW,
      logicalH,
      effectiveMaxWidth,
      effectiveMaxHeight,
      dpiScale,
      opts.maxCanvasDimension
    );
    if (!setup) {
      return null;
    }
    const { canvas, ctx } = setup;
    ctx.save();
    replayWmfRecords(view, ctx, header, canvas.width, canvas.height, replayOptions);
    ctx.restore();
    const result = await exportCanvasToPngDataUrl(canvas);
    emfLog(`convertWmfToDataUrl: result=${result ? `dataUrl len=${result.length}` : "null"}`);
    emfLog("=== convertWmfToDataUrl END ===");
    return result;
  } catch (err2) {
    emfWarn("convertWmfToDataUrl: EXCEPTION:", err2 instanceof Error ? err2.message : err2);
    console.warn("[pptx-editor] WMF conversion failed:", err2 instanceof Error ? err2.message : err2);
    return null;
  }
}

// src/modules/question-bank/wmf.ts
var PNG = Buffer.from("89504e470d0a1a0a", "hex");
var adapterQueue = Promise.resolve();
async function withCanvasAdapter(work) {
  const previous = adapterQueue;
  let release;
  adapterQueue = new Promise((resolve2) => {
    release = resolve2;
  });
  await previous;
  const globals = globalThis;
  const saved = /* @__PURE__ */ new Map();
  for (const key of ["document", "HTMLCanvasElement", "Image"]) saved.set(key, { own: Object.prototype.hasOwnProperty.call(globals, key), value: globals[key] });
  try {
    globals.document = { createElement: (tag) => {
      if (tag !== "canvas") throw new Error(`UNSUPPORTED_ADAPTER_ELEMENT:${tag}`);
      return (0, import_canvas.createCanvas)(1, 1);
    } };
    globals.HTMLCanvasElement = import_canvas.Canvas;
    globals.Image = import_canvas.Image;
    return await work();
  } finally {
    for (const [key, state] of saved) state.own ? globals[key] = state.value : delete globals[key];
    release();
  }
}
function pngBytes(dataUrl) {
  if (!dataUrl?.startsWith("data:image/png;base64,")) throw new Error("WMF_CONVERSION_NO_PNG");
  const bytes = Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(PNG)) throw new Error("WMF_CONVERSION_INVALID_PNG");
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (width <= 0 || height <= 0) throw new Error("WMF_CONVERSION_INVALID_DIMENSIONS");
  return bytes;
}
async function deriveComponent(source) {
  if (source.semanticRole !== "REAL_FIGURE" || !source.bytes || !source.mediaPath?.match(/\.(?:wmf|emf)$/i)) return source;
  const format = source.mediaPath.toLowerCase().endsWith(".emf") ? "EMF" : "WMF";
  try {
    const input = source.bytes.buffer.slice(source.bytes.byteOffset, source.bytes.byteOffset + source.bytes.byteLength);
    const url = await (format === "EMF" ? convertEmfToDataUrl(input) : convertWmfToDataUrl(input));
    const bytes = pngBytes(url);
    const hash2 = (0, import_node_crypto5.createHash)("sha256").update(bytes).digest("hex");
    return { ...source, mimeType: "image/png", bytes, derivation: { ...source.derivation, converter: { name: "emf-converter", version: "2.0.2", canvasVersion: "3.2.3" }, derivedAssetId: `${source.id}-png-${hash2.slice(0, 12)}`, derivedFormat: "PNG", derivedMime: "image/png", derivedSha256: hash2, status: "DERIVED" } };
  } catch (error) {
    return { ...source, bytes: void 0, mimeType: void 0, derivation: { ...source.derivation, converter: { name: "emf-converter", version: "2.0.2", canvasVersion: "3.2.3" }, status: "FAILED", error: error instanceof Error ? error.message : String(error) } };
  }
}
var styleNumber = (style, name) => Number.parseFloat(new RegExp(`(?:^|;)${name}:([^;]+)`, "i").exec(style)?.[1] ?? "0");
var vmlElements = (xml2) => [...xml2.matchAll(/<v:(shape|oval|line|rect|arc)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/v:\1>)/gi)].map((match) => ({ tag: match[1].toLowerCase(), attrs: match[2], body: match[3] ?? "", order: match.index })).sort((left, right) => left.order - right.order);
var pair = (values, offset) => [Number(values[offset] || 0), Number(values[offset + 1] || 0)];
function drawVmlPath(ctx, path5, attrs, rect) {
  const coord = (/\bcoordsize="([^"]+)"/i.exec(attrs)?.[1] ?? `${Math.abs(rect.w)},${Math.abs(rect.h)}`).split(",").map(Number);
  const flip = /(?:^|;)flip:([^;]+)/i.exec(/\bstyle="([^"]*)"/i.exec(attrs)?.[1] ?? "")?.[1] ?? "";
  const point = (x, y) => ({ x: rect.x + (flip.includes("x") ? coord[0] - x : x) / (coord[0] || 1) * rect.w, y: rect.y + (flip.includes("y") ? coord[1] - y : y) / (coord[1] || 1) * rect.h });
  let drew = false;
  for (const command of path5.matchAll(/([mlc])([^mlce]*)/gi)) {
    const values = command[2].trim().split(/[ ,]/).filter((_, index, all) => index < all.length).map((value) => value.trim());
    if (command[1].toLowerCase() === "m" && values.length >= 2) {
      const p = point(...pair(values, 0));
      ctx.moveTo(p.x, p.y);
      drew = true;
    } else if (command[1].toLowerCase() === "l" && values.length >= 2) {
      const p = point(...pair(values, 0));
      ctx.lineTo(p.x, p.y);
      drew = true;
    } else if (command[1].toLowerCase() === "c" && values.length >= 6) {
      const a = point(...pair(values, 0)), b = point(...pair(values, 2)), c = point(...pair(values, 4));
      ctx.bezierCurveTo(a.x, a.y, b.x, b.y, c.x, c.y);
      drew = true;
    }
  }
  return drew;
}
async function composeGroup(source, components) {
  if (!source.componentIds?.length || !source.layout || !source.vmlGroupXml) return source;
  const width = source.dimensions?.widthPx ?? 800, height = source.dimensions?.heightPx ?? 600;
  const canvas = (0, import_canvas.createCanvas)(width, height), ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#000099";
  ctx.fillStyle = "white";
  const sx = width / source.layout.width, sy = height / source.layout.height, ox = source.layout.x, oy = source.layout.y;
  const xywh = (attrs) => {
    const style = /\bstyle="([^"]*)"/i.exec(attrs)?.[1] ?? "";
    return { x: (styleNumber(style, "left") - ox) * sx, y: (styleNumber(style, "top") - oy) * sy, w: styleNumber(style, "width") * sx, h: styleNumber(style, "height") * sy, flip: /(?:^|;)flip:([^;]+)/i.exec(style)?.[1] ?? "" };
  };
  for (const element of vmlElements(source.vmlGroupXml)) {
    const r = xywh(element.attrs), imageRid = /<v:imagedata\b[^>]*r:id="([^"]+)"/i.exec(element.body)?.[1];
    if (imageRid) {
      const item = components.get(`figure-${imageRid}`);
      if (!item?.bytes || !isValidPng(item.bytes)) continue;
      const image = await (0, import_canvas.loadImage)(Buffer.from(item.bytes));
      ctx.save();
      ctx.translate(r.x + (r.flip.includes("x") ? r.w : 0), r.y + (r.flip.includes("y") ? r.h : 0));
      ctx.scale(r.flip.includes("x") ? -1 : 1, r.flip.includes("y") ? -1 : 1);
      ctx.drawImage(image, 0, 0, r.w, r.h);
      ctx.restore();
      continue;
    }
    ctx.beginPath();
    if (element.tag === "oval" || element.tag === "arc") ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2, Math.abs(r.w / 2), Math.abs(r.h / 2), 0, 0, Math.PI * 2);
    else if (element.tag === "rect") ctx.rect(r.x, r.y, r.w, r.h);
    else {
      const path5 = /\bpath="([^"]+)"/i.exec(element.attrs)?.[1];
      if (!path5 || !drawVmlPath(ctx, path5, element.attrs, r)) {
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + r.w, r.y + r.h);
      }
    }
    if (!/\bfilled="f"/i.test(element.attrs)) ctx.fill();
    if (!/\bstroked="f"/i.test(element.attrs)) ctx.stroke();
  }
  const bytes = canvas.toBuffer("image/png");
  if (!isValidPng(bytes)) throw new Error("VML_COMPOSITE_INVALID_PNG");
  const hash2 = (0, import_node_crypto5.createHash)("sha256").update(bytes).digest("hex");
  return { ...source, mimeType: "image/png", bytes, dimensions: { ...source.dimensions, widthPx: width, heightPx: height }, derivation: { sourceAssetId: source.id, sourceFormat: "VML_GROUP", sourceMime: "application/vnd.openxmlformats-officedocument.vmlDrawing", semanticRole: "REAL_FIGURE", converter: { name: "emf-converter", version: "2.0.2", canvasVersion: "3.2.3" }, derivedAssetId: `${source.id}-png-${hash2.slice(0, 12)}`, derivedFormat: "PNG", derivedMime: "image/png", derivedSha256: hash2, status: "DERIVED" } };
}
async function deriveBrowserSafeFigures(document2) {
  return withCanvasAdapter(async () => {
    const derived = /* @__PURE__ */ new Map();
    for (const figure of document2.figures) derived.set(figure.id, await deriveComponent(figure));
    const figures = [];
    for (const figure of document2.figures) figures.push(figure.componentIds ? await composeGroup(figure, derived) : derived.get(figure.id));
    return { ...document2, figures };
  });
}
var isValidPng = (bytes) => Boolean(bytes && bytes.length >= 24 && Buffer.from(bytes.subarray(0, 8)).equals(PNG));

// src/modules/question-bank/pipeline.ts
function canonicalizeCompositeAnchors(candidate, document2) {
  const composites = candidate.figureAnchors.map((id) => document2.figures.find((f) => f.id === id)).filter((f) => f?.componentIds?.length);
  const discarded = /* @__PURE__ */ new Set();
  for (const left of composites) for (const right of composites) {
    if (left === right) continue;
    const shared = left.componentIds.filter((id) => right.componentIds.includes(id));
    const sourceIdentityMatch = shared.length / Math.min(left.componentIds.length, right.componentIds.length) >= 0.9;
    if (sourceIdentityMatch) {
      const loser = left.componentIds.length < right.componentIds.length ? left : right;
      discarded.add(loser.id);
    }
  }
  return discarded.size ? { ...candidate, figureAnchors: candidate.figureAnchors.filter((id) => !discarded.has(id)), parseWarnings: [...candidate.parseWarnings, "OVERLAPPING_VML_GROUP_DEDUPLICATED"] } : candidate;
}
function finish(document2) {
  const candidates = segmentQuestions(document2).map((c) => canonicalizeCompositeAnchors(c, document2));
  const questions = candidates.map((c) => normalizeCandidate(c, document2));
  const figureAssociations = associateFigures(document2, questions);
  return { document: document2, candidates, questions, figureAssociations, warnings: [...document2.warnings, ...candidates.flatMap((c) => c.parseWarnings)] };
}
function ingestDocxQuestions(bytes, name) {
  return finish(parseDocx(bytes, name));
}
async function ingestDocxQuestionsForRuntime(bytes, name) {
  return finish(await deriveBrowserSafeFigures(parseDocx(bytes, name, { canonicalVml: true })));
}

// src/modules/question-bank/bankService.ts
function statusQuestion(question2) {
  const structural = validateQuestion2(question2);
  const exam = validateQuestion(toExamQuestion(question2));
  const issueCodes = exam.issues.map((x) => x.code);
  const invalid = structural.some((x) => x.level === "FAIL") || exam.status === "BLOCKED" || exam.status === "NOT_TESTED";
  return { ...question2, schemaVersion: 1, validationStatus: invalid ? "INVALID" : structural.some((x) => x.level === "WARNING") || exam.status === "REVIEW_REQUIRED" ? "REVIEW_REQUIRED" : "VALID", bankStatus: invalid ? "QUARANTINED" : "REVIEW", examQa: { status: exam.status, issueCodes }, warnings: [.../* @__PURE__ */ new Set([...question2.warnings, ...structural.filter((x) => x.level !== "PASS").map((x) => x.code), ...issueCodes])] };
}
var QuestionBankService = class {
  constructor(repository) {
    this.repository = repository;
  }
  importDocx(bytes, name) {
    return this.importPipeline(ingestDocxQuestions(bytes, name));
  }
  async importDocxForRuntime(bytes, name) {
    return this.importPipeline(await ingestDocxQuestionsForRuntime(bytes, name));
  }
  importPipeline(pipeline) {
    const before = this.repository.load();
    const questions = [...before.questions];
    const orphanFigures = [...before.orphanFigures];
    const registry = new AssetRegistry();
    [...questions.flatMap((q) => q.figures), ...orphanFigures].forEach((f) => registry.register(f));
    const imported = [], duplicates = [], diagnostics = [];
    for (const source of pipeline.questions) {
      const question2 = statusQuestion(source);
      const duplicate = detectDuplicate(question2, questions);
      duplicates.push(duplicate);
      if (duplicate.status === "DUPLICATE") {
        diagnostics.push({ code: "DUPLICATE_QUESTION", questionId: question2.id, severity: "INFO", details: { matchedId: duplicate.matchedId } });
        continue;
      }
      question2.duplicateState = duplicate.status;
      if (duplicate.status === "POSSIBLE_DUPLICATE") diagnostics.push({ code: "POSSIBLE_DUPLICATE", questionId: question2.id, severity: "WARNING", details: { matchedId: duplicate.matchedId } });
      question2.figures.forEach((figure) => registry.register(figure));
      if (question2.bankStatus === "QUARANTINED") diagnostics.push({ code: "INVALID_QUESTION_STRUCTURE", questionId: question2.id, severity: "ERROR" });
      questions.push(question2);
      imported.push(question2);
    }
    for (const association of pipeline.figureAssociations.filter((x) => x.status === "UNASSIGNED")) {
      const figure = pipeline.document.figures.find((x) => x.id === association.figureId);
      if (figure && !orphanFigures.some((x) => x.id === figure.id)) {
        registry.register(figure);
        orphanFigures.push(figure);
        diagnostics.push({ code: "UNRESOLVED_FIGURE", severity: "WARNING", details: { figureId: figure.id } });
      }
    }
    const snapshot = { schemaVersion: 1, questions, orphanFigures };
    this.repository.replace(snapshot);
    return { imported, duplicates, diagnostics, snapshot: this.repository.load() };
  }
};

// src/modules/question-bank/assessment.ts
var import_node_crypto6 = require("node:crypto");

// src/modules/question-bank/search.ts
var types = /* @__PURE__ */ new Set(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY", "UNKNOWN"]);
var statuses = /* @__PURE__ */ new Set(["APPROVED", "REVIEW", "QUARANTINED"]);
var sorts = /* @__PURE__ */ new Set(["ID", "INDEX", "SOURCE_DOCUMENT", "TYPE", "STATUS"]);
var duplicateStates = /* @__PURE__ */ new Set(["UNIQUE", "DUPLICATE", "POSSIBLE_DUPLICATE"]);
var render2 = (blocks) => blocks.map((block) => block.type === "text" ? block.value : block.type === "math" ? `${block.math.latex ?? ""} ${block.math.normalized ?? ""} ${block.math.sourceRaw}` : block.type === "figure" ? block.figureId : block.cells.flat().map((cell) => render2([cell])).join(" ")).join(" ");
function searchableQuestionText(question2) {
  return [render2(question2.stem), ...question2.options.map((x) => render2(x.content)), ...question2.trueFalseItems.map((x) => render2(x.content)), ...question2.subquestions.map((x) => render2(x.content)), render2(question2.shortAnswer ?? []), render2(question2.solution ?? []), Object.values(question2.metadata).join(" "), question2.source.document, question2.section ?? ""].join(" ").normalize("NFC").toLocaleLowerCase("vi");
}
function validated(raw) {
  const warnings = [];
  const query = structuredClone(raw);
  const badType = query.types?.some((x) => !types.has(x));
  const badStatus = query.statuses?.some((x) => !statuses.has(x));
  const badDuplicate = query.duplicateStates?.some((x) => !duplicateStates.has(x));
  if (badType || badStatus || badDuplicate) {
    warnings.push({ code: "UNKNOWN_FILTER", message: "One or more filter values are unknown." });
    if (badType) query.types = [];
    if (badStatus) query.statuses = [];
    if (badDuplicate) query.duplicateStates = [];
  }
  if (query.sort && !sorts.has(query.sort.field)) {
    warnings.push({ code: "INVALID_SORT", message: "Unknown sort field; ID ascending was used." });
    query.sort = { field: "ID", direction: "ASC" };
  }
  if (query.offset !== void 0 && (!Number.isInteger(query.offset) || query.offset < 0) || query.limit !== void 0 && (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > 100)) {
    warnings.push({ code: "INVALID_PAGINATION", message: "Pagination must use offset >= 0 and limit 1..100; defaults were used." });
    query.offset = 0;
    query.limit = 50;
  }
  return { query, warnings };
}
function compare(field, a, b) {
  const av = field === "INDEX" ? a.index ?? Number.MAX_SAFE_INTEGER : field === "SOURCE_DOCUMENT" ? a.source.document : field === "TYPE" ? a.type : field === "STATUS" ? a.bankStatus ?? "" : a.id;
  const bv = field === "INDEX" ? b.index ?? Number.MAX_SAFE_INTEGER : field === "SOURCE_DOCUMENT" ? b.source.document : field === "TYPE" ? b.type : field === "STATUS" ? b.bankStatus ?? "" : b.id;
  return typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv), "vi");
}
var QuestionSearchService = class {
  constructor(repository) {
    this.repository = repository;
  }
  getById(id) {
    const found = this.repository.load().questions.find((x) => x.id === id);
    return found && structuredClone(found);
  }
  query(raw = {}) {
    const { query, warnings } = validated(raw);
    const terms = query.text?.normalize("NFC").toLocaleLowerCase("vi").trim().split(/\s+/u).filter(Boolean) ?? [];
    let items = this.repository.load().questions.filter((q) => (query.includeQuarantined || query.statuses?.includes("QUARANTINED") || q.bankStatus !== "QUARANTINED") && (!query.ids?.length || query.ids.includes(q.id)) && (!query.types?.length || query.types.includes(q.type)) && (!query.statuses?.length || q.bankStatus !== void 0 && query.statuses.includes(q.bankStatus)) && (!query.sourceDocuments?.length || query.sourceDocuments.includes(q.source.document)) && (!query.sourceIndices?.length || q.index !== void 0 && query.sourceIndices.includes(q.index)) && (query.hasFigures === void 0 || q.figureAssociations.some((x) => x.status === "CONFIRMED") === query.hasFigures) && (!query.duplicateStates?.length || q.duplicateState !== void 0 && query.duplicateStates.includes(q.duplicateState)) && (!query.metadata || Object.entries(query.metadata).every(([key, value]) => q.metadata[key] === value)) && (!terms.length || terms.every((term) => searchableQuestionText(q).includes(term))));
    const sort = query.sort ?? { field: "ID", direction: "ASC" };
    items = items.map((item, order) => ({ item, order })).sort((a, b) => {
      const value = compare(sort.field, a.item, b.item);
      return (sort.direction === "DESC" ? -value : value) || a.order - b.order || a.item.id.localeCompare(b.item.id);
    }).map((x) => x.item);
    const total = items.length;
    const offset = query.offset ?? 0, limit = query.limit ?? 50;
    items = items.slice(offset, offset + limit).map((x) => structuredClone(x));
    if (!total) warnings.push({ code: "NO_RESULTS", message: "No questions matched the query." });
    return { items, total, query: structuredClone(query), warnings };
  }
  approvedForReuse(query = {}) {
    return this.query({ ...query, statuses: ["APPROVED"], includeQuarantined: false });
  }
};

// src/modules/question-bank/assessment.ts
var hash = (value) => (0, import_node_crypto6.createHash)("sha256").update(JSON.stringify(value)).digest("hex");
var seedNumber = (seed) => Number.parseInt(hash(seed).slice(0, 8), 16) >>> 0;
function shuffled(values, seed) {
  let state = seedNumber(seed) || 1;
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    state = Math.imul(state, 1664525) + 1013904223 >>> 0;
    const j = state % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
var mergeFilters = (globalFilters, localFilters) => ({ ...globalFilters, ...localFilters, metadata: { ...globalFilters?.metadata, ...localFilters?.metadata } });
var validTypes = /* @__PURE__ */ new Set(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY", "UNKNOWN"]);
var validStatuses = /* @__PURE__ */ new Set(["APPROVED", "REVIEW", "QUARANTINED"]);
var validOrders = /* @__PURE__ */ new Set(["FIXED", "SEEDED_SHUFFLE"]);
var validSourcePolicies = /* @__PURE__ */ new Set(["ANY_SOURCE", "DISTINCT_SOURCE_PREFERRED", "DISTINCT_SOURCE_REQUIRED"]);
function validateAssessmentSpec(spec) {
  const diagnostics = [];
  const seedInvalid = typeof spec.seed === "string" ? !spec.seed.trim() : typeof spec.seed !== "number" || !Number.isFinite(spec.seed);
  if (seedInvalid || !Array.isArray(spec.sections) || !spec.sections.length || spec.statuses?.some((status) => !validStatuses.has(status) || status !== "APPROVED")) diagnostics.push({ code: "INVALID_ASSESSMENT_SPEC", message: "A valid seed, APPROVED-only status policy, and at least one section are required." });
  const ids = /* @__PURE__ */ new Set();
  for (const section2 of Array.isArray(spec.sections) ? spec.sections : []) {
    if (!section2.id?.trim() || ids.has(section2.id) || !Number.isInteger(section2.count) || section2.count < 0 || !validTypes.has(section2.questionType) || section2.pointsPerQuestion !== void 0 && (!Number.isFinite(section2.pointsPerQuestion) || section2.pointsPerQuestion < 0) || section2.ordering !== void 0 && !validOrders.has(section2.ordering) || section2.sourcePolicy !== void 0 && !validSourcePolicies.has(section2.sourcePolicy)) diagnostics.push({ code: "INVALID_ASSESSMENT_SPEC", message: "Section identifiers, types, counts, points, ordering, and source policy must be valid.", sectionId: section2.id });
    ids.add(section2.id);
  }
  return diagnostics;
}
function createAssessmentQueryPlan(spec) {
  const statuses2 = spec.statuses ?? ["APPROVED"];
  return spec.sections.map((section2) => ({ sectionId: section2.id, count: section2.count, query: { ...mergeFilters(spec.globalFilters, section2.filters), types: [section2.questionType], statuses: statuses2, duplicateStates: ["UNIQUE"], sort: { field: "ID", direction: "ASC" }, limit: 100 }, ordering: section2.ordering ?? "FIXED", sourcePolicy: section2.sourcePolicy ?? "ANY_SOURCE" }));
}
function selectSources(candidates, count, policy) {
  if (policy === "ANY_SOURCE") return candidates.slice(0, count);
  const distinct = [], repeated = [], seen = /* @__PURE__ */ new Set();
  for (const item of candidates) (seen.has(item.source.document) ? repeated : distinct).push(item), seen.add(item.source.document);
  if (policy === "DISTINCT_SOURCE_REQUIRED" && distinct.length < count) return void 0;
  return [...distinct, ...repeated].slice(0, count);
}
function finalIssues(spec, sections) {
  const refs = sections.flatMap((x) => x.questionRefs);
  const issues = [];
  if (new Set(refs.map((x) => x.questionId)).size !== refs.length || sections.some((section2, i) => section2.questionRefs.length !== spec.sections[i].count || section2.questionRefs.some((ref) => ref.type !== spec.sections[i].questionType || ref.status !== "APPROVED" || !ref.source.document))) issues.push({ code: "ASSESSMENT_FINAL_VALIDATION_FAILED", message: "Selected questions violated count, identity, type, status, or provenance invariants." });
  return issues;
}
var AssessmentService = class {
  constructor(repository) {
    this.repository = repository;
    this.search = new QuestionSearchService(repository);
  }
  generate(spec) {
    const diagnostics = validateAssessmentSpec(spec);
    const queryPlan = diagnostics.length ? [] : createAssessmentQueryPlan(spec);
    if (diagnostics.length) return { ok: false, diagnostics, queryPlan };
    const seed = String(spec.seed);
    const used = /* @__PURE__ */ new Set();
    const sections = [];
    for (let i = 0; i < queryPlan.length; i++) {
      const plan = queryPlan[i], sectionSpec = spec.sections[i];
      const requestedMetadata = plan.query.metadata ?? {};
      const knownMetadata = new Set(this.repository.load().questions.flatMap((q) => Object.keys(q.metadata)));
      const unsupported = Object.keys(requestedMetadata).filter((key) => !knownMetadata.has(key));
      if (unsupported.length) {
        diagnostics.push({ code: "UNSUPPORTED_METADATA_CONSTRAINT", message: "The bank does not contain requested metadata fields.", sectionId: plan.sectionId, details: { fields: unsupported } });
        continue;
      }
      const safe = this.search.approvedForReuse({ ...plan.query, duplicateStates: void 0, limit: 100 });
      const possibleCount = safe.items.filter((q) => q.duplicateState === "POSSIBLE_DUPLICATE").length;
      if (possibleCount) diagnostics.push({ code: "POSSIBLE_DUPLICATE_EXCLUDED", message: "Possible duplicates were excluded from selection.", sectionId: plan.sectionId, details: { excluded: possibleCount } });
      let candidates = safe.items.filter((q) => q.duplicateState !== "DUPLICATE" && q.duplicateState !== "POSSIBLE_DUPLICATE" && !used.has(q.id));
      if (plan.ordering === "SEEDED_SHUFFLE") candidates = shuffled(candidates, `${seed}:${plan.sectionId}`);
      const selected = selectSources(candidates, plan.count, plan.sourcePolicy);
      if (!selected || selected.length !== plan.count) {
        diagnostics.push({ code: selected ? "ASSESSMENT_INSUFFICIENT_CANDIDATES" : "SOURCE_DIVERSITY_UNAVAILABLE", message: "The section cannot be filled without relaxing its constraints.", sectionId: plan.sectionId, details: { requested: plan.count, available: candidates.length, missing: Math.max(0, plan.count - candidates.length), filters: plan.query } });
        continue;
      }
      selected.forEach((q) => used.add(q.id));
      sections.push({ id: sectionSpec.id, title: sectionSpec.title, pointsPerQuestion: sectionSpec.pointsPerQuestion, questionRefs: selected.map((q, index) => ({ questionId: q.id, sectionId: sectionSpec.id, position: index + 1, type: q.type, status: q.bankStatus, source: structuredClone(q.source), points: sectionSpec.pointsPerQuestion })) });
    }
    if (diagnostics.some((x) => x.code !== "POSSIBLE_DUPLICATE_EXCLUDED") || sections.length !== spec.sections.length) return { ok: false, diagnostics, queryPlan };
    diagnostics.push(...finalIssues(spec, sections));
    if (diagnostics.some((x) => x.code === "ASSESSMENT_FINAL_VALIDATION_FAILED")) return { ok: false, diagnostics, queryPlan };
    const selectedIds = sections.flatMap((x) => x.questionRefs.map((ref) => ref.questionId));
    const bankFingerprint = hash(this.repository.load().questions.map((q) => q.id).sort());
    const id = spec.id ?? `assessment-${hash({ spec, seed, selectedIds }).slice(0, 16)}`;
    const assessment = { schemaVersion: 1, id, title: spec.title, seed, spec: structuredClone(spec), sections, bankFingerprint, diagnostics };
    const entries = selectedIds.map((questionId) => this.search.getById(questionId)).filter((q) => q.answer?.length || q.solution?.length).map((q) => ({ questionId: q.id, answer: q.answer && structuredClone(q.answer), solution: q.solution && structuredClone(q.solution) }));
    return { ok: true, assessment, answerManifest: { assessmentId: id, entries }, queryPlan };
  }
  materialize(assessment) {
    return assessment.sections.flatMap((section2) => section2.questionRefs.map((ref) => {
      const question2 = this.search.getById(ref.questionId);
      if (!question2) throw new Error(`ASSESSMENT_QUESTION_NOT_FOUND:${ref.questionId}`);
      return question2;
    }));
  }
};

// src/modules/question-bank/export.ts
var import_node_crypto7 = require("node:crypto");
var import_node_child_process = require("node:child_process");
var import_node_fs3 = require("node:fs");
var import_node_path3 = require("node:path");
var import_node_os2 = require("node:os");

// standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/design-system/color-system/NA_MATH_OUTPUT_COLOR_SYSTEM_V1_0.json
var NA_MATH_OUTPUT_COLOR_SYSTEM_V1_0_default = {
  id: "NA_MATH_OUTPUT_COLOR_SYSTEM_V1_0",
  version: "2.5.0",
  status: "LOCKED",
  source_baseline: "NA-MATH-LAYOUT V1.3 CANONICAL",
  shared_tokens: {
    deep_navy: "#0C2D57",
    teal: "#0C9A94",
    blue: "#1E63B5",
    green: "#2F8F68",
    amber: "#D9911B",
    purple: "#6B4FA3",
    paper: "#FCFCFA",
    ink: "#18212B",
    muted: "#66717D",
    line: "#D8E0E6"
  },
  output_contracts: {
    learning_material: {
      label: "T\xE0i li\u1EC7u h\u1ECDc t\u1EADp",
      primary_accent: "#0C2D57",
      primary_name: "Deep Navy",
      secondary_allowed: [
        "#0C9A94",
        "#1E63B5",
        "#2F8F68",
        "#D9911B",
        "#6B4FA3"
      ],
      usage: "Header/footer/title use Deep Navy; semantic cards may use secondary tokens.",
      forbid_palette_replacement: true
    },
    worksheet: {
      label: "Phi\u1EBFu h\u1ECDc t\u1EADp",
      primary_accent: "#2F8F68",
      primary_name: "Green",
      usage: "Primary header/tag/footer/accent.",
      forbid_palette_replacement: true
    },
    exercise_sheet: {
      label: "Phi\u1EBFu b\xE0i t\u1EADp",
      primary_accent: "#6B4FA3",
      primary_name: "Purple",
      usage: "Primary header/tag/footer/accent.",
      forbid_palette_replacement: true
    },
    video: {
      label: "Video b\xE0i gi\u1EA3ng",
      primary_accent: "#D9911B",
      primary_name: "Amber",
      brand_navy: "#0C2D57",
      usage: "Amber for video identity/progress/highlight; Deep Navy remains for brand/title where defined by V1.3.",
      forbid_palette_replacement: true
    }
  },
  hard_rules: [
    "Do not unify the four output palettes.",
    "Do not replace a locked primary accent without explicit user request.",
    "Preserve paper/ink/muted/line shared tokens.",
    "Semantic card colors inside learning material do not change its primary identity from Deep Navy.",
    "Color changes must not mutate V1.3 layout geometry or component placement."
  ]
};

// standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/design-system/na_math_design_system_v1_3/src/modules/design-system/tokens/tokens.json
var tokens_default = {
  version: "1.0.0",
  color: {
    brand: {
      navy: "#0C2D57",
      teal: "#0C9A94"
    },
    neutral: {
      paper: "#FCFCFA",
      ink: "#18212B",
      muted: "#66717D",
      line: "#D8E0E6"
    },
    semantic: {
      amber: "#D9911B",
      purple: "#6B4FA3",
      green: "#2F8F68",
      blue: "#1E63B5"
    }
  },
  spacing: [
    4,
    8,
    12,
    16,
    24,
    32,
    48
  ],
  radius: {
    small: 6,
    medium: 10,
    large: 14
  },
  typography: {
    body: "Libertinus Serif",
    math: "Libertinus Math",
    ui: "Source Sans 3",
    fallback_vi_serif: "Noto Serif",
    fallback_vi_sans: "Noto Sans"
  },
  layout: {
    a4_margin_mm: 18,
    video_safe_margin_px: 72,
    video_problem_bar_ratio: [
      0.18,
      0.22
    ],
    video_solution_figure_ratio: [
      0.58,
      0.42
    ]
  }
};

// standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/system-lock/NA_MATH_SYSTEM_CORE_LOCK_POLICY_V2_6.json
var NA_MATH_SYSTEM_CORE_LOCK_POLICY_V2_6_default = {
  id: "NA_MATH_SYSTEM_CORE_LOCK_POLICY",
  version: "2.6.0",
  status: "LOCKED",
  baseline_name: "NA-MATH-SYSTEM BASELINE V2.6 \u2014 DESIGN + MATH + GEOMETRY CORE LOCKED",
  locked_layers: [
    {
      id: "layout",
      status: "HARD_LOCK",
      baseline: "NA-MATH-LAYOUT V1.3 CANONICAL",
      mutation: "BLOCKED"
    },
    {
      id: "color_system",
      status: "HARD_LOCK",
      baseline: "NA_MATH_OUTPUT_COLOR_SYSTEM_V1_0",
      mutation: "BLOCKED"
    },
    {
      id: "typography",
      status: "HARD_LOCK",
      body: "Libertinus Serif",
      math: "Libertinus Math",
      ui: "Source Sans 3",
      fallback: [
        "Noto Serif",
        "Noto Sans"
      ],
      mutation: "BLOCKED"
    },
    {
      id: "math_notation",
      status: "HARD_LOCK",
      standard: "GDPT 2018 + K\u1EBFt n\u1ED1i tri th\u1EE9c",
      renderer: "Math Engine",
      raw_unicode_math: "BLOCKED"
    },
    {
      id: "symbol_registry",
      status: "HARD_LOCK",
      baseline: "NA_MATH_KNTT_SYMBOL_STANDARD_V1_0",
      unknown_symbol: "BLOCK_RENDER"
    },
    {
      id: "semantic_geometry",
      status: "HARD_LOCK",
      visual_inference: "FORBIDDEN",
      auto_auxiliary_geometry: "FORBIDDEN"
    },
    {
      id: "approved_geometry_profiles",
      status: "HARD_LOCK_PER_PROFILE",
      new_profile: "REVIEW_REQUIRED",
      approved_profile_mutation: "BLOCKED"
    },
    {
      id: "qa_gates",
      status: "HARD_LOCK",
      gates: [
        "NO_TEXT_OVERFLOW",
        "NO_CONTENT_OVERLAP",
        "MATH_SYMBOL_QA",
        "GEOMETRY_VISIBILITY_QA",
        "LAYOUT_IDENTITY_QA",
        "PALETTE_QA",
        "FONT_QA"
      ]
    }
  ],
  development_policy: {
    NEW_FEATURE: "BLOCKED",
    NEW_GEOMETRY_PROFILE: "REVIEW_REQUIRED",
    BUG_FIX: "ALLOWED",
    QA: "ALLOWED",
    CANONICALIZATION: "ALLOWED",
    DOCUMENTATION: "ALLOWED",
    RELEASE_PACKAGING: "ALLOWED"
  },
  change_control: {
    explicit_user_request_required_for_locked_layer_change: true,
    default_on_violation: "BLOCK_CHANGE",
    preserve_existing_baselines: true
  }
};

// standards/NA_MATH_CANONICAL_LAYOUT_SPEC_V1_0/na-math-canonical-layout.v1.1.json
var na_math_canonical_layout_v1_1_default = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  id: "NA_MATH_CANONICAL_LAYOUT_SPEC_V1_1",
  status: "CANONICAL_LOCKED",
  supersedes: "NA_MATH_CANONICAL_LAYOUT_SPEC_V1",
  sourceOfTruth: "standards/NA_MATH_CANONICAL_LAYOUT_SPEC_V1_0/na-math-canonical-layout.v1.1.json",
  video: {
    canonicalProfileId: "NA_MATH_VIDEO_QSG_V1",
    canonicalLayoutId: "NA-MATH-LAYOUT-V1.3-CANONICAL",
    semanticOrder: ["QUESTION_TOP", "SOLUTION_LEFT", "GEOMETRY_RIGHT"],
    canvas: { width: 1920, height: 1080, aspectRatio: "16:9" },
    macroLayout: {
      questionZone: { anchor: "TOP", heightRatio: 0.26 },
      mainZone: { anchor: "BOTTOM", heightRatio: 0.74 },
      solutionZone: { parent: "MAIN_ZONE", anchor: "LEFT", widthRatio: 0.6 },
      figureZone: { parent: "MAIN_ZONE", anchor: "RIGHT", widthRatio: 0.4 }
    },
    behavior: {
      questionAlwaysVisible: true,
      solutionProgressiveReveal: true,
      figureFixedAnchor: true,
      figureAlwaysVisibleWhenExists: true,
      crossZoneOverflow: false,
      autoSwapColumns: false,
      autoMoveFigure: false,
      autoResizeMacroZones: false,
      autoMutateLayout: false
    }
  }
};

// standards/NA_MATH_VIDEO_VISUAL_LANGUAGE_V1_0/na-math-video-visual-language.v1.0.json
var na_math_video_visual_language_v1_0_default = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  id: "NA_MATH_VIDEO_VISUAL_LANGUAGE_V1.0",
  status: "LOCKED",
  canonical: true,
  approved: true,
  scope: "VIDEO_VISUAL_LANGUAGE_ONLY",
  references: {
    typography: "NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/design-system/na_math_design_system_v1_3/src/modules/design-system/tokens/tokens.json#/typography",
    colors: "NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/design-system/color-system/NA_MATH_OUTPUT_COLOR_SYSTEM_V1_0.json",
    layoutTokens: "NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/design-system/na_math_design_system_v1_3/src/modules/design-system/tokens/tokens.json#/layout",
    geometry: "NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/geometry-engine/NA_MATH_GEOMETRY_RULES_V1_8_GEO8"
  },
  sectionTabs: ["\u0110\u1EC0 B\xC0I", "L\u1EDCI GI\u1EA2I", "H\xCCNH V\u1EBC"],
  icons: { question: "document/problem", solution: "idea/reasoning", figure: "geometry/drawing", styleFamily: "consistent" },
  typographyRoles: ["TITLE_ROLE", "SECTION_HEADER_ROLE", "BODY_ROLE", "MATH_ROLE", "FIGURE_LABEL_ROLE", "CONCLUSION_ROLE"],
  panel: { rounded: true, visibleBoundary: true, safeInternalPadding: true, stableGutter: true, background: "clean_light" },
  colorRoles: ["PRIMARY_UI", "PRIMARY_TEXT", "MATH_DEFAULT", "EMPHASIS", "SUCCESS", "ERROR", "SUBTLE_BORDER"],
  animation: { purpose: "PEDAGOGICAL", cameraStability: true, macroLayoutStability: true, forbidden: ["DECORATIVE_SPIN", "RANDOM_MOTION", "EXCESSIVE_ZOOM"] },
  geometry: { figureBaseAnchor: "FIXED", semanticsMutation: "FORBIDDEN" },
  formula: { noClippedMath: true, noDanglingMathOperator: true, oneActivePrimaryEmphasisPreferred: true },
  conclusion: { preferred: true, location: "INSIDE_SOLUTION_ZONE", compact: true, visuallyDistinct: true }
};

// standards/NA_MATH_VIDEO_GOLDEN_START_MID_END_V1/na-math-video-golden-start-mid-end.v1.json
var na_math_video_golden_start_mid_end_v1_default = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  id: "NA_MATH_VIDEO_GOLDEN_START_MID_END_V1",
  status: "APPROVED",
  locked: true,
  invariant: ["MACRO_LAYOUT", "PANEL_GEOMETRY", "SECTION_HEADER_LANGUAGE", "ICON_LANGUAGE", "TYPOGRAPHY_ROLES", "COLOR_ROLE_SYSTEM", "FIGURE_BASE_ANCHOR"],
  states: {
    START: { question: "VISIBLE", solution: "INITIAL_REASONING", figure: "BASE_STATE_WHEN_PRESENT" },
    MID: { question: "VISIBLE", solution: "PROGRESSIVE", figure: "SAME_BASE_ANCHOR", semanticHighlights: "ALLOWED" },
    END: { question: "VISIBLE", solution: "FINAL_REASONING", conclusion: "VISIBLE_WHEN_APPLICABLE", figure: "SAME_BASE_ANCHOR" }
  },
  evolvable: ["SOLUTION_CONTENT_STATE", "SEMANTIC_HIGHLIGHT", "FORMULA_EMPHASIS", "AUTHORIZED_GEOMETRY_ANNOTATION", "CONCLUSION_STATE"]
};

// registry/pimath-dna-icons.json
var pimath_dna_icons_default = {
  standardId: "PIMATH-DNA-SEMANTIC-ICONS-V1.0",
  version: "1.0.0",
  codeRoot: "PIMATH_DNA_ICONS",
  status: "LOCKED",
  canonical: true,
  approved: true,
  global: true,
  singleSourceOfTruth: true,
  parentBrandId: "PIMATH-DNA-V1.0",
  scope: "ENTIRE_PIMATH",
  style: { family: "MINIMAL_ACADEMIC_LINE", decorative: false, filledDefault: false, monochromeSafe: true, noOwnColorPalette: true, noGradient: true, noEmoji: true, no3d: true },
  colorPolicy: "INHERIT_SEMANTIC_CONTEXT",
  fallbackPolicy: "FAIL_CLOSED",
  roles: {
    QUESTION_SOURCE: { concept: "document/source", resource: "assets/pimath-icons/question-source.svg" },
    SOLUTION_REASONING: { concept: "lightbulb/reasoning", resource: "assets/pimath-icons/solution-reasoning.svg" },
    GEOMETRY_FIGURE: { concept: "geometry/drawing", resource: "assets/pimath-icons/geometry-figure.svg" },
    RESULT_SUCCESS: { concept: "check/result", resource: "assets/pimath-icons/result-success.svg" }
  },
  governance: { parallelIconSystem: false, moduleLocalAuthority: false, silentFallback: false, unregisteredIcon: false }
};

// standards/PIMATH_VIDEO_VISUAL_CANONICAL_V2_0/pimath-video-visual-canonical-v2.0.json
var pimath_video_visual_canonical_v2_0_default = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  id: "PIMATH_VIDEO_VISUAL_CANONICAL_V2.0",
  status: "LOCKED",
  canonical: true,
  approved: true,
  inherits: "PIMATH_DNA_CORE",
  overrideCoreDna: false,
  authorityRuntimeBaseline: "fab0743",
  derivesFrom: ["NA_MATH_VIDEO_QSG_V1", "NA_MATH_VIDEO_VISUAL_LANGUAGE_V1.0", "NA_MATH_VIDEO_GOLDEN_START_MID_END_V1"],
  coreBindings: { typography: "PIMATH-DNA-V1.0.references.typography", color: "PIMATH-DNA-V1.0.references.color", mathematicalNotation: "PIMATH-DNA-V1.0.references.math", semanticGeometry: "PIMATH-DNA-V1.0.references.system", iconLanguage: "PIMATH-DNA-V1.0.references.icons", governanceQa: "PIMATH-DNA-V1.0.references.qa" },
  videoSpec: { resolution: "1920x1080", aspectRatio: "16:9", macroLayout: { QUESTION_TOP: 0.26, MAIN: 0.74 }, mainLayout: { SOLUTION_LEFT: 0.6, GEOMETRY_RIGHT: 0.4 }, figureAnchor: "FIXED", solutionReveal: "PROGRESSIVE", cameraStability: true, macroLayoutStability: true, forbidden: ["AUTO_SWAP_COLUMNS", "AUTO_MOVE_FIGURE", "AUTO_RESIZE_MACRO_ZONES", "AUTO_LAYOUT_MUTATION", "CROSS_ZONE_OVERFLOW", "DECORATIVE_SPIN", "RANDOM_MOTION", "EXCESSIVE_ZOOM"], semanticOrder: ["QUESTION_TOP", "SOLUTION_LEFT", "GEOMETRY_RIGHT"] }
};

// registry/brand-root.json
var brand_root_default = {
  standardId: "PIMATH-DNA-V1.0",
  displayName: "PiDNA",
  version: "PiDNA V1.0",
  codeRoot: "PIMATH_DNA",
  status: "LOCKED",
  canonical: true,
  approved: true,
  global: true,
  singleSourceOfTruth: true,
  authorityScope: "ENTIRE_PIMATH",
  globalBaseline: "PIMATH_DNA_GLOBAL_BASELINE_V1.1",
  architecture: { product: "PIMATH", application: "Math AI Studio", role: "GLOBAL_IDENTITY_ROOT" },
  authorityOrder: ["USER_LOCK", "PIMATH", "PIMATH-DNA-V1.0", "REFERENCED_LOCKED_CHILD_STANDARDS", "OUTPUT_PROFILE", "MODULE_ADAPTER", "RENDERER", "HEURISTIC_AI"],
  governance: { singleBrandSource: true, noParallelDesignSystem: true, noLocalCanonicalBrand: true, noLocalCanonicalColor: true, noLocalCanonicalFont: true, noLocalCanonicalSpacing: true, noLocalCanonicalIconStyle: true, noLocalCanonicalComponentStyle: true, noLocalCanonicalLayoutStyle: true, noLocalCanonicalVideoStyle: true, noLocalCanonicalDocumentStyle: true, noLocalCanonicalGeoGebraStyle: true, noLocalCanonicalFoldStyle: true, noLocalCanonicalGameStyle: true, silentLegacyFallbackAllowed: false, heuristicCanonicalOverrideAllowed: false, rendererCanonicalOverrideAllowed: false, failClosedIfAuthoritativeTokenMissing: true, failureCode: "PIMATH_DNA_AUTHORITATIVE_TOKEN_UNRESOLVED" },
  references: {
    system: "NA_MATH_SYSTEM_BASELINE_V2_6",
    layout: "NA_MATH_LAYOUT_V1_3",
    typography: "NA_MATH_TYPOGRAPHY_STANDARD_V1_0",
    color: "NA_MATH_OUTPUT_COLOR_SYSTEM_V1_0",
    videoLayout: "NA_MATH_CANONICAL_LAYOUT_V1_3",
    videoVisualLanguage: "NA_MATH_VIDEO_VISUAL_LANGUAGE_V1_0",
    videoGolden: "NA_MATH_VIDEO_GOLDEN_START_MID_END_V1",
    geometryFold: "NA_MATH_GEOMETRY_FOLD_VISUAL_STANDARD_V1",
    game: "GAME_01_OLYMPIA_REFERENCE_V1",
    digitalAI: "NA_MATH_DIGITAL_AI_MATRIX_V1_0",
    math: "NA_MATH_SYSTEM_BASELINE_V2_6",
    documents: "NA_MATH_DOCUMENT_ENGINE_CONTRACTS",
    studentWorkspace: "NA_MATH_STUDENT_WORKSPACE_V1_2",
    icons: "PIMATH-DNA-SEMANTIC-ICONS-V1.0",
    components: "NA_MATH_DESIGN_SYSTEM_V1_3",
    geogebra: {
      kind: "ADAPTER_BOUNDARY",
      geometryAuthority: "NA_MATH_GEOMETRY_RULES_V1_8_GEO8",
      authoritySource: "PIMATH_DNA",
      runtimeRole: "ADAPTER_BOUNDARY",
      authoritative: false,
      adapter: "src/modules/geogebra/adapter.ts"
    },
    fold: "NA_MATH_GEOMETRY_FOLD_VISUAL_STANDARD_V1",
    assessment: "NA_MATH_QUESTION_BANK_V1",
    voice: "PIMATH_VOICE_NARRATION_CANONICAL_V1.0",
    motion: "NA_MATH_VIDEO_VISUAL_LANGUAGE_V1_0",
    i18n: "NA_MATH_KNTT_SYMBOL_STANDARD_V1_0",
    accessibility: "PIMATH_ACCESSIBILITY_CANONICAL_V1.0",
    qa: "NA_MATH_SYSTEM_CORE_LOCK_POLICY_V2_6"
  },
  legacyAliases: [{ id: "NA-MATH-EDUCATIONAL-BRAND-SYSTEM-V1.0", action: "COMPATIBILITY_ALIAS_TO_PIMATH_DNA" }],
  legacyBindings: [
    { id: "NA-MATH-BRAND-DRIVEN-GEOGEBRA-UI-SYSTEM-V1.0", classification: "COMPATIBILITY_ALIAS", aliasOf: "PIMATH-DNA-V1.0", authority: false },
    { id: "NA_MATH_GEOMETRY_FOLD_VISUAL_STANDARD_V1", classification: "ADAPTER_BOUNDARY", authority: false, adapter: "src/modules/pattern-fold/geogebra/v3-adapter.ts" }
  ],
  unresolved: [],
  overridePolicy: { allowed: ["output-specific semantic structure", "renderer adapter mapping"], forbidden: ["canonical fonts", "canonical colors", "canonical spacing", "canonical icons", "canonical components", "math semantics", "geometry semantics", "legacy fallback"] },
  consumerTraceability: { app: "src/components", document: "src/modules/document-engine", docx: "src/modules/document-export/docx", assessment: "src/modules/question-bank", video: "server/services/videoPlanner.ts", geogebra: "src/modules/geogebra", fold: "src/modules/fold-3d", game: "src/modules/classroom-game" }
};

// registry/output-profiles.json
var output_profiles_default = {
  schemaVersion: 1,
  id: "PIMATH_DNA_OUTPUT_PROFILE_REGISTRY_V1",
  status: "CANONICAL",
  parentBrandId: "PIMATH-DNA-V1.0",
  profiles: [
    { profileId: "P01_LEARNING_MATERIAL", name: "Learning Material", canonicalReferences: ["NA_MATH_TEXTBOOK_STYLE_V1_0", "NA_MATH_LAYOUT_V1_3"] },
    { profileId: "P02_LESSON_PLAN", name: "Lesson Plan", canonicalReferences: ["NA_MATH_LAYOUT_V1_3"], pedagogicalReferences: ["NA_MATH_DOCUMENT_ENGINE_CONTRACTS"] },
    { profileId: "P03_WORKSHEET", name: "Worksheet", canonicalReferences: ["NA_MATH_STUDENT_WORKSPACE_V1_2"] },
    { profileId: "P04_EXERCISE_SHEET", name: "Exercise Sheet", canonicalReferences: ["NA_MATH_TEXTBOOK_STYLE_V1_0"] },
    { profileId: "P05_TEST", name: "Test", canonicalReferences: ["NA_MATH_LAYOUT_V1_3", "NA_MATH_TYPOGRAPHY_STANDARD_V1_0", "NA_MATH_OUTPUT_COLOR_SYSTEM_V1_0"], semanticReferences: ["NA_MATH_QUESTION_BANK_V1", "NA_MATH_ASSESSMENT_EXAM_QA"] },
    { profileId: "P06_EXAM_SCHOOL", name: "Exam School", inheritedFrom: "PIMATH-DNA-V1.0", semanticReferences: ["NA_MATH_QUESTION_BANK_V1", "NA_MATH_ASSESSMENT_EXAM_QA"], visualReferences: ["PIMATH-DNA-V1.0"], structuralReferences: ["NA_MATH_LAYOUT_V1_3"], answerPagePolicy: { required: true, answersOnly: true, solutions: false } },
    { profileId: "P06_EXAM_THPTQG", name: "Exam THPTQG", inheritedFrom: "PIMATH-DNA-V1.0", semanticReferences: ["NA_MATH_QUESTION_BANK_V1", "NA_MATH_ASSESSMENT_EXAM_QA"], visualReferences: ["PIMATH-DNA-V1.0"], structuralReferences: ["NA_MATH_LAYOUT_V1_3"], answerPagePolicy: { required: true, answersOnly: true, solutions: false, groups: ["PART_I", "PART_II", "PART_III"] }, examSpec: { page: "A4 portrait", marginsMm: { top: 18, right: 18, bottom: 20, left: 15 }, durationMinutes: 90, parts: { PART_I: { type: "MULTIPLE_CHOICE", questions: 12 }, PART_II: { type: "TRUE_FALSE", questions: 4, statementsPerQuestion: 4 }, PART_III: { type: "SHORT_ANSWER", questions: 6 } }, questionCount: 22, promptCount: 34 } },
    { profileId: "P06_EXAM_DGNL", name: "Exam DGNL", inheritedFrom: "PIMATH-DNA-V1.0", semanticReferences: ["NA_MATH_QUESTION_BANK_V1", "NA_MATH_ASSESSMENT_EXAM_QA"], visualReferences: ["PIMATH-DNA-V1.0"], structuralReferences: ["NA_MATH_LAYOUT_V1_3"], answerPagePolicy: { required: true, answersOnly: true, solutions: false, groups: ["61-70", "71-80", "81-90"] }, examSpec: { page: "A4 portrait", columns: 1, accent: "PiMath exercise/test semantic accent", grayscaleSafe: true, section: "PH\u1EA6N 2 \xB7 TO\xC1N H\u1ECCC", questionRange: [61, 90], questionCount: 30, choiceLayout: "A/B/C/D", keepQuestionTogether: true } },
    { profileId: "P06_EXAM_VSAT", name: "Exam VSAT", inheritedFrom: "PIMATH-DNA-V1.0", semanticReferences: ["NA_MATH_QUESTION_BANK_V1", "NA_MATH_ASSESSMENT_EXAM_QA"], visualReferences: ["PIMATH-DNA-V1.0"], structuralReferences: ["NA_MATH_LAYOUT_V1_3"], canonicalReferences: ["NA_MATH_TYPOGRAPHY_STANDARD_V1_0", "NA_MATH_OUTPUT_COLOR_SYSTEM_V1_0"] },
    { profileId: "P06_EXAM_SAT", name: "Exam SAT", inheritedFrom: "PIMATH-DNA-V1.0", semanticReferences: ["NA_MATH_QUESTION_BANK_V1", "NA_MATH_ASSESSMENT_EXAM_QA"], visualReferences: ["PIMATH-DNA-V1.0"], structuralReferences: ["NA_MATH_LAYOUT_V1_3"], answerPagePolicy: { required: true, answersOnly: true, solutions: false, dynamicGroups: ["MODULE 1 / MULTIPLE CHOICE", "MODULE 1 / STUDENT-PRODUCED RESPONSE", "MODULE 2 / MULTIPLE CHOICE", "MODULE 2 / STUDENT-PRODUCED RESPONSE"] }, examSpec: { page: "A4 portrait", section: "MATH", modules: [{ id: "MODULE 1", questions: 22, minutes: 35 }, { id: "MODULE 2", questions: 22, minutes: 35 }], responseTypes: ["MULTIPLE_CHOICE", "STUDENT_PRODUCED_RESPONSE"], mcqChoices: ["A", "B", "C", "D"], sprDedicatedResponseArea: true, preserveQuestionTypeMetadata: true } },
    { profileId: "P07_VIDEO", name: "Video", canonicalReferences: ["NA_MATH_CANONICAL_LAYOUT_V1_3", "NA_MATH_VIDEO_VISUAL_LANGUAGE_V1_0", "NA_MATH_VIDEO_GOLDEN_START_MID_END_V1", "PIMATH-DNA-SEMANTIC-ICONS-V1.0"] },
    { profileId: "PIMATH_VIDEO_VISUAL_CANONICAL_V2.0", name: "PiMath Video Visual Canonical V2.0", status: "LOCKED", canonical: true, approved: true, inheritedFrom: "PIMATH-DNA-V1.0", inherits: "PIMATH_DNA_CORE", overrideCoreDna: false, canonicalReferences: ["NA_MATH_VIDEO_QSG_V1", "NA_MATH_VIDEO_VISUAL_LANGUAGE_V1.0", "NA_MATH_VIDEO_GOLDEN_START_MID_END_V1", "PIMATH-DNA-SEMANTIC-ICONS-V1.0"], profilePath: "standards/PIMATH_VIDEO_VISUAL_CANONICAL_V2_0/pimath-video-visual-canonical-v2.0.json", authorityRuntimeBaseline: "fab0743" },
    { profileId: "P08_GEOGEBRA", name: "GeoGebra", canonicalReferences: ["NA-MATH-BRAND-DRIVEN-GEOGEBRA-UI-SYSTEM-V1.0", "NA_MATH_GEOMETRY_FOLD_VISUAL_STANDARD_V1"], unresolved: ["NA-MATH-BRAND-DRIVEN-GEOGEBRA-UI-SYSTEM-V1.0"] },
    { profileId: "P09_FOLD", name: "Fold", canonicalReferences: ["NA_MATH_GEOMETRY_FOLD_VISUAL_STANDARD_V1"] },
    { profileId: "P10_GAME", name: "Game", canonicalReferences: ["GAME_01_OLYMPIA_REFERENCE_V1"] },
    { profileId: "P11_DIGITAL_AI_LESSON", name: "Digital AI Lesson", canonicalReferences: ["NA_MATH_DIGITAL_AI_MATRIX_V1_0"] },
    { profileId: "P12_APP_UI", name: "App UI", canonicalReferences: ["NA_MATH_LAYOUT_V1_3"] }
  ],
  aliases: { P06_EXAM_THPT: { status: "COMPATIBILITY_ALIAS", aliasOf: "P06_EXAM_THPTQG" } },
  profilePolicy: { allowedOverrides: ["output-specific semantic structure", "renderer adapter"], forbiddenOverrides: ["global canonical tokens", "math semantics", "geometry semantics"] }
};

// standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/geometry-engine/NA_MATH_GEOMETRY_RULES_V1_8_GEO8/geometry.manifest.json
var geometry_manifest_default = {
  name: "NA-MATH-GEOMETRY-RULES",
  version: "1.8.0",
  status: "GEOMETRY_BASELINE_CANDIDATE",
  layout: {
    id: "NA-MATH-LAYOUT-V1.3-CANONICAL",
    status: "LOCKED",
    geometry_may_change_layout: false
  },
  core_pipeline: [
    "given_data",
    "semantic_geometry",
    "derived_relations_with_provenance",
    "view_profile",
    "parallel_projection",
    "edge_visibility_table",
    "label_placement",
    "geometry_qa",
    "render"
  ],
  view_profiles: [
    "TRIANGULAR_PRISM_FRONT_TO_BACK_KNTT",
    "TRAPEZOID_BASE_LARGE_TOP_HORIZONTAL",
    "PYRAMID_ALTITUDE_VERTICAL_IF_PROVEN",
    "PARALLEL_PLANES_SKEW_LINES_CANONICAL"
  ],
  inference_templates: [
    "PERP_SIDE_PLANE_TO_BASE_ALTITUDE",
    "EQUAL_SA_SB_SC_CIRCUMCENTER",
    "RIGHT_ANGLES_TO_CYCLIC_FOOT_PROFILE"
  ],
  fail_closed: true,
  geo_1: {
    task: "Semantic Geometry Schema",
    status: "PASS",
    schema_version: "1.1.0",
    golden_scenes: 4,
    layout_baseline_preserved: true
  },
  next: "GEO-9 \u2014 Integrate Geometry Pipeline into Locked V1.3 Layouts",
  geo_2: {
    task: "View Profile Registry",
    status: "PASS",
    registered_profiles: 7,
    visibility_source: "VIEW_PROFILE_ONLY",
    unknown_profile_policy: "BLOCK_RENDER",
    layout_baseline_preserved: true
  },
  geo_3: {
    task: "Edge Visibility Resolver",
    status: "PASS",
    edge_id_normalization: "PASS",
    visibility_source: "VIEW_PROFILE_ONLY",
    layout_baseline_preserved: true
  },
  geo_4: {
    task: "Label Placement & Collision Solver",
    status: "PASS",
    font_shrink_for_collision: "FORBIDDEN",
    block_on_failed_placement: true,
    layout_baseline_preserved: true
  },
  geo_5: {
    task: "Pyramid Altitude Inference Templates",
    status: "PASS",
    templates: 5,
    golden_and_negative_cases: 9,
    vertical_altitude_only_if_verified: true,
    missing_premise_policy: "NO_INFERENCE",
    visual_inference: "FORBIDDEN",
    layout_baseline_preserved: true
  },
  geo_6: {
    task: "Prism / Box / Trapezoid Canonical Geometry Profiles",
    status: "PASS",
    triangular_prism_profile: "LOCKED",
    generic_prism_N_range: "3..10",
    trapezoid_profile: "LOCKED",
    given_ratio_preservation: true,
    visibility_responsibility: "GEO-3_VIEW_PROFILE",
    layout_baseline_preserved: true
  },
  geo_7: {
    task: "Skew Lines / Parallel Planes / Spatial Relation Profiles",
    status: "PASS",
    spatial_profiles: 7,
    false_intersection_guard: "PASS",
    decorative_connector_guard: "PASS",
    semantic_3d_source_of_truth: true,
    layout_baseline_preserved: true
  },
  geo_8: {
    task: "Golden Geometry QA Corpus & Regression Pack",
    status: "PASS",
    regression_suites: 8,
    golden_negative_cases: 43,
    critical_lock_suite: "PASS",
    layout_baseline_preserved: true
  }
};

// standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/geometry-engine/NA_MATH_GEOMETRY_RULES_V1_8_GEO8/profiles/gdpt2018-kntt-math-notation-policy-v2_3.json
var gdpt2018_kntt_math_notation_policy_v2_3_default = {
  id: "GDPT2018_KNTT_MATH_NOTATION_POLICY",
  version: "2.4.0",
  status: "LOCKED",
  scope: [
    "learning_material",
    "worksheet",
    "exercise_sheet",
    "assessment",
    "video",
    "geometry_figure",
    "solution_steps"
  ],
  curriculum: "GDPT 2018",
  textbook_family: "K\u1EBFt n\u1ED1i tri th\u1EE9c",
  renderer: {
    required: "Math Engine / LaTeX-compatible math renderer",
    raw_unicode_for_math_symbols: "FORBIDDEN",
    plain_text_substitution_for_math_symbols: "FORBIDDEN",
    semantic_math_ast: "REQUIRED_WHEN_AVAILABLE",
    required_math_font: "Libertinus Math",
    body_font: "Libertinus Serif",
    ui_font: "Source Sans 3",
    renderer_bypass: "FORBIDDEN"
  },
  hard_rules: [
    "Preserve source mathematical meaning exactly.",
    "Do not invent notation absent from the problem or proof.",
    "Do not replace mathematical symbols with visually similar glyphs.",
    "Do not mix body-text Unicode math with rendered formulas.",
    "Keep math baseline, size, spacing and font family consistent.",
    "Use Vietnamese KNTT notation conventions where variants exist."
  ],
  canonical_examples: {
    perpendicular: {
      latex: "\\perp",
      raw_unicode: "\u22A5",
      raw_unicode_status: "FORBIDDEN"
    },
    parallel: {
      latex: "\\parallel",
      raw_unicode: "\u2225",
      raw_unicode_status: "FORBIDDEN"
    },
    belongs_to: {
      latex: "\\in",
      raw_unicode: "\u2208",
      raw_unicode_status: "FORBIDDEN"
    },
    not_belongs_to: {
      latex: "\\notin",
      raw_unicode: "\u2209",
      raw_unicode_status: "FORBIDDEN"
    },
    intersection: {
      latex: "\\cap",
      raw_unicode: "\u2229",
      raw_unicode_status: "FORBIDDEN"
    },
    union: {
      latex: "\\cup",
      raw_unicode: "\u222A",
      raw_unicode_status: "FORBIDDEN"
    },
    subset: {
      latex: "\\subset",
      raw_unicode: "\u2282",
      raw_unicode_status: "FORBIDDEN"
    },
    subseteq: {
      latex: "\\subseteq",
      raw_unicode: "\u2286",
      raw_unicode_status: "FORBIDDEN"
    },
    sqrt: {
      latex: "\\sqrt{...}",
      raw_unicode: "\u221A",
      raw_unicode_status: "FORBIDDEN"
    },
    fraction: {
      latex: "\\frac{...}{...}",
      plain_slash_fraction: "DISCOURAGED_IN_DISPLAY_MATH"
    },
    vector: {
      latex: "\\vec{AB}",
      unicode_arrow_substitution: "FORBIDDEN"
    },
    angle: {
      latex: "\\angle ABC",
      raw_unicode: "\u2220",
      raw_unicode_status: "FORBIDDEN"
    },
    degree: {
      latex: "60^\\circ",
      raw_unicode_degree_in_formula: "FORBIDDEN"
    },
    therefore: {
      latex: "\\Rightarrow",
      raw_unicode: "\u21D2",
      raw_unicode_status: "FORBIDDEN"
    },
    equivalent: {
      latex: "\\Leftrightarrow",
      raw_unicode: "\u21D4",
      raw_unicode_status: "FORBIDDEN"
    },
    not_equal: {
      latex: "\\ne",
      raw_unicode: "\u2260",
      raw_unicode_status: "FORBIDDEN"
    },
    less_equal: {
      latex: "\\le",
      raw_unicode: "\u2264",
      raw_unicode_status: "FORBIDDEN"
    },
    greater_equal: {
      latex: "\\ge",
      raw_unicode: "\u2265",
      raw_unicode_status: "FORBIDDEN"
    },
    infinity: {
      latex: "\\infty",
      raw_unicode: "\u221E",
      raw_unicode_status: "FORBIDDEN"
    }
  },
  geometry_notation: {
    line: "Use labels such as a, b, d or two-point names in math mode.",
    plane: "Use (P), (Q), (ABC) in math mode.",
    distance: "d(A,(P)),\\ d(a,b)",
    perpendicular_statement: "SA\\perp(ABCD)",
    parallel_statement: "AB\\parallel CD",
    membership_statement: "H\\in SD",
    angle_statement: "\\angle ABC",
    right_angle_marker: "visual marker must correspond to a verified perpendicular relation"
  },
  canonical_symbol_registry: "NA_MATH_KNTT_SYMBOL_STANDARD_V1_0",
  resolver_contract: "NA_MATH_SYMBOL_RESOLVER_CONTRACT_V2_4"
};

// standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/geometry-engine/NA_MATH_GEOMETRY_RULES_V1_8_GEO8/profiles/view-profile-registry.json
var view_profile_registry_default = {
  version: "2.1.0",
  layout_contract: {
    layout_id: "NA-MATH-LAYOUT-V1.3-CANONICAL",
    status: "LOCKED",
    geometry_may_change_layout: false
  },
  rules: {
    visibility_source: "VIEW_PROFILE_ONLY",
    projection_mode: "PARALLEL_PROJECTION",
    visual_guessing_forbidden: true,
    profile_required_for_3d_render: true,
    unknown_profile_policy: "BLOCK_RENDER"
  },
  profiles: [
    {
      id: "TRIANGULAR_PRISM_FRONT_TO_BACK_KNTT",
      family: "prism",
      object_type: "triangular_prism",
      status: "LOCKED",
      projection: {
        mode: "parallel",
        view_intent: "front-to-back",
        front_vertices: [
          "C",
          "C\u2032"
        ],
        rear_vertices: [
          "A",
          "B",
          "A\u2032",
          "B\u2032"
        ]
      },
      edge_styles: {
        solid: [
          "AC",
          "BC",
          "A\u2032C\u2032",
          "B\u2032C\u2032",
          "CC\u2032",
          "AA\u2032",
          "BB\u2032",
          "A\u2032B\u2032"
        ],
        dashed: [
          "AB"
        ]
      },
      required_relations: [
        "AA\u2032 \u2225 BB\u2032 \u2225 CC\u2032",
        "AB \u2225 A\u2032B\u2032",
        "BC \u2225 B\u2032C\u2032",
        "CA \u2225 C\u2032A\u2032"
      ],
      label_hints: {
        C: "below",
        "C\u2032": "right",
        A: "left",
        B: "right",
        "A\u2032": "upper-left",
        "B\u2032": "upper-right"
      },
      forbidden: [
        "dash_CA",
        "dash_CB",
        "dash_C\u2032A\u2032",
        "dash_C\u2032B\u2032",
        "dash_CC\u2032",
        "guess_visibility"
      ],
      edge_aliases: {
        CB: "BC",
        "C\u2032B\u2032": "B\u2032C\u2032"
      }
    },
    {
      id: "BOX_FRONT_LEFT_ABOVE_KNTT",
      family: "parallelepiped",
      object_type: "box_or_parallelepiped",
      status: "BASELINE",
      projection: {
        mode: "parallel",
        view_intent: "front-left-above",
        front_face: "ABB\u2032A\u2032",
        rear_vertex: "D"
      },
      edge_styles: {
        solid: [
          "AB",
          "BC",
          "CC\u2032",
          "BB\u2032",
          "AA\u2032",
          "A\u2032B\u2032",
          "B\u2032C\u2032",
          "C\u2032D\u2032",
          "A\u2032D\u2032"
        ],
        dashed: [
          "AD",
          "CD",
          "DD\u2032"
        ]
      },
      required_relations: [
        "AB \u2225 CD \u2225 A\u2032B\u2032 \u2225 C\u2032D\u2032",
        "AD \u2225 BC \u2225 A\u2032D\u2032 \u2225 B\u2032C\u2032",
        "AA\u2032 \u2225 BB\u2032 \u2225 CC\u2032 \u2225 DD\u2032"
      ],
      label_hints: {
        A: "below-left",
        B: "below-right",
        C: "right",
        D: "left",
        "A\u2032": "upper-left",
        "B\u2032": "upper-right",
        "C\u2032": "upper-right",
        "D\u2032": "upper-left"
      },
      forbidden: [
        "dash_front_face_edge",
        "guess_hidden_edges"
      ]
    },
    {
      id: "PYRAMID_QUADRILATERAL_FRONT_PROFILE",
      family: "pyramid",
      object_type: "quadrilateral_pyramid",
      status: "TEMPLATE",
      projection: {
        mode: "parallel",
        view_intent: "front-oblique",
        apex: "S",
        rear_base_vertex: "D"
      },
      edge_styles: {
        solid: [
          "AB",
          "BC",
          "AS",
          "BS",
          "CS"
        ],
        dashed: [
          "AD",
          "CD",
          "DS"
        ]
      },
      required_relations: [
        "base cyclic order A-B-C-D",
        "S connected to A,B,C,D"
      ],
      label_hints: {
        S: "above",
        A: "below-left",
        B: "below",
        C: "right",
        D: "left"
      },
      forbidden: [
        "assume_altitude",
        "assume_center_of_base",
        "guess_SD_visibility_outside_profile"
      ],
      deprecated_for_kntt_default: true,
      replacement_profile: "PYRAMID_QUADRILATERAL_FRONT_TO_BACK_KNTT",
      note: "Old fixed hidden-edge profile is not the KNTT default."
    },
    {
      id: "PYRAMID_ALTITUDE_VERTICAL_IF_PROVEN",
      family: "pyramid",
      object_type: "pyramid_with_proven_altitude",
      status: "LOCKED",
      projection: {
        mode: "parallel",
        view_intent: "textbook-altitude",
        altitude_screen_orientation: "vertical",
        activation_condition: "altitude relation VERIFIED"
      },
      edge_styles: {
        solid: [],
        dashed: []
      },
      required_relations: [
        "SH \u27C2 base_plane",
        "H \u2208 base_plane"
      ],
      label_hints: {
        S: "above",
        H: "offset-from-SH"
      },
      forbidden: [
        "vertical_SH_without_verified_altitude",
        "guess_H_position",
        "assume_H_center"
      ]
    },
    {
      id: "TRAPEZOID_BASE_LARGE_TOP_HORIZONTAL",
      family: "planar_base",
      object_type: "trapezoid",
      status: "LOCKED",
      projection: {
        mode: "2d_textbook",
        large_base_orientation: "horizontal",
        large_base_position: "top",
        small_base_position: "below"
      },
      edge_styles: {
        solid: [
          "all_boundary_edges"
        ],
        dashed: []
      },
      required_relations: [
        "large_base \u2225 small_base"
      ],
      label_hints: {},
      forbidden: [
        "auto_isosceles",
        "auto_right_trapezoid",
        "auto_center_small_base"
      ],
      metric_policy: {
        preserve_given_base_ratio: true
      }
    },
    {
      id: "PARALLEL_PLANES_SKEW_LINES_CANONICAL",
      family: "planes",
      object_type: "skew_lines_on_parallel_planes",
      status: "LOCKED",
      projection: {
        mode: "parallel",
        view_intent: "two-separated-parallel-planes",
        same_plane_orientation_family: true
      },
      edge_styles: {
        solid: [
          "plane_outlines",
          "a",
          "b"
        ],
        dashed: []
      },
      required_relations: [
        "(P) \u2225 (Q)",
        "a \u2282 (P)",
        "b \u2282 (Q)",
        "a \u2226 b"
      ],
      label_hints: {
        "(P)": "inside-left",
        "(Q)": "inside-left",
        a: "near-line-end",
        b: "near-line-end"
      },
      forbidden: [
        "decorative_connectors_between_planes",
        "fake_prism_guides",
        "false_intersection_marker",
        "same_projected_direction_for_a_b"
      ]
    },
    {
      id: "PRISM_GENERIC_TRANSLATION_PROFILE",
      family: "prism",
      object_type: "generic_prism",
      status: "TEMPLATE",
      projection: {
        mode: "parallel",
        construction: "second_base = first_base + common_projection_translation"
      },
      edge_styles: {
        solid: [],
        dashed: []
      },
      required_relations: [
        "all_lateral_edges_parallel",
        "corresponding_base_edges_parallel"
      ],
      label_hints: {},
      forbidden: [
        "independent_vertex_offsets",
        "nonparallel_lateral_edges",
        "perspective_distortion"
      ]
    },
    {
      id: "PYRAMID_QUADRILATERAL_FRONT_TO_BACK_KNTT",
      family: "pyramid",
      object_type: "quadrilateral_pyramid",
      status: "LOCKED",
      projection: {
        mode: "parallel",
        view_intent: "front-to-back",
        rear_base_vertex: "A"
      },
      edge_styles: {
        solid: [
          "SD",
          "SC",
          "SB",
          "DC",
          "CB"
        ],
        dashed: [
          "SA",
          "AD",
          "AB"
        ]
      },
      required_relations: [
        "base cyclic order A-B-C-D",
        "S connected to A,B,C,D"
      ],
      label_hints: {},
      forbidden: [
        "auto_H",
        "auto_altitude",
        "auto_right_angle_marker",
        "auto_base_diagonal",
        "visual_center_guess"
      ]
    },
    {
      id: "SKEW_LINES_MINIMAL_KNTT",
      family: "line_line",
      object_type: "skew_lines",
      status: "LOCKED",
      projection: {
        mode: "parallel",
        view_intent: "minimal-skew-lines"
      },
      edge_styles: {
        solid: [
          "a",
          "b"
        ],
        dashed: []
      },
      required_relations: [
        "intersection(a,b)=\u2205",
        "direction(a) \u2226 direction(b)",
        "a,b noncoplanar"
      ],
      label_hints: {},
      forbidden: [
        "auto_plane_P",
        "auto_plane_Q",
        "auto_intersection_point",
        "auto_common_perpendicular",
        "auto_connector"
      ]
    },
    {
      id: "SKEW_LINES_COMMON_PERPENDICULAR_KNTT",
      family: "line_line",
      object_type: "skew_lines_common_perpendicular",
      status: "LOCKED",
      projection: {
        mode: "parallel",
        view_intent: "common-perpendicular-only"
      },
      edge_styles: {
        solid: [
          "a",
          "b",
          "\u0394"
        ],
        dashed: []
      },
      required_relations: [
        "M \u2208 a",
        "N \u2208 b",
        "\u0394 \u27C2 a",
        "\u0394 \u27C2 b"
      ],
      label_hints: {},
      forbidden: [
        "auto_plane_P",
        "auto_plane_Q"
      ]
    },
    {
      id: "PYRAMID_PARALLELOGRAM_FRONT_TO_BACK_KNTT_LOCKED",
      family: "pyramid",
      object_type: "quadrilateral_pyramid_parallelogram_base",
      status: "LOCKED",
      projection: {
        mode: "parallel",
        view_intent: "front-to-back-balanced-wide",
        A_right_of_D: true,
        AB_horizontal: true,
        wide_faces: true,
        avoid_projected_edge_overlap: true
      },
      edge_styles: {
        solid: [
          "SB",
          "SC",
          "SD",
          "BC",
          "CD"
        ],
        dashed: [
          "SA",
          "AB",
          "AD"
        ]
      },
      required_relations: [
        "AB \u2225 CD",
        "AD \u2225 BC",
        "base cyclic order A-B-C-D"
      ],
      forbidden: [
        "auto_H",
        "auto_altitude",
        "auto_right_angle_marker",
        "auto_diagonal",
        "auto_center",
        "auto_auxiliary_plane"
      ]
    }
  ],
  kntt_visual_baseline: "KNTT_VISUAL_DEMO_V2_LOCKED",
  latest_locked_profile: "PYRAMID_PARALLELOGRAM_FRONT_TO_BACK_KNTT_LOCKED"
};

// standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK/geometry-engine/NA_MATH_GEOMETRY_RULES_V1_8_GEO8/symbol-registry/NA_MATH_KNTT_SYMBOL_STANDARD_V1_0.json
var NA_MATH_KNTT_SYMBOL_STANDARD_V1_0_default = {
  id: "NA_MATH_KNTT_SYMBOL_STANDARD_V1_0",
  status: "PROPOSED_CANONICAL",
  curriculum: "GDPT 2018",
  textbook_family: "K\u1EBFt n\u1ED1i tri th\u1EE9c",
  renderer: "Math Engine / LaTeX-compatible renderer",
  global_rules: [
    "All mathematical notation must be rendered by Math Engine.",
    "Do not use raw Unicode mathematical symbols in formulas.",
    "Do not replace a mathematical symbol with a visually similar glyph.",
    "Preserve Vietnamese textbook conventions, including semicolon-separated coordinates.",
    "Do not invent notation not present in the problem or required by the proof."
  ],
  categories: {
    logic_sets: [
      [
        "M\u1EC7nh \u0111\u1EC1 k\xE9o theo",
        "P\\Rightarrow Q",
        "\\Rightarrow"
      ],
      [
        "M\u1EC7nh \u0111\u1EC1 t\u01B0\u01A1ng \u0111\u01B0\u01A1ng",
        "P\\Leftrightarrow Q",
        "\\Leftrightarrow"
      ],
      [
        "V\u1EDBi m\u1ECDi",
        "\\forall x\\in A",
        "\\forall"
      ],
      [
        "T\u1ED3n t\u1EA1i",
        "\\exists x\\in A",
        "\\exists"
      ],
      [
        "Thu\u1ED9c",
        "x\\in A",
        "\\in"
      ],
      [
        "Kh\xF4ng thu\u1ED9c",
        "x\\notin A",
        "\\notin"
      ],
      [
        "T\u1EADp con",
        "A\\subset B",
        "\\subset"
      ],
      [
        "T\u1EADp con ho\u1EB7c b\u1EB1ng",
        "A\\subseteq B",
        "\\subseteq"
      ],
      [
        "H\u1EE3p",
        "A\\cup B",
        "\\cup"
      ],
      [
        "Giao",
        "A\\cap B",
        "\\cap"
      ],
      [
        "Hi\u1EC7u",
        "A\\setminus B",
        "\\setminus"
      ],
      [
        "T\u1EADp r\u1ED7ng",
        "\\varnothing",
        "\\varnothing"
      ],
      [
        "S\u1ED1 t\u1EF1 nhi\xEAn",
        "\\mathbb{N}",
        "\\mathbb{N}"
      ],
      [
        "S\u1ED1 nguy\xEAn",
        "\\mathbb{Z}",
        "\\mathbb{Z}"
      ],
      [
        "S\u1ED1 h\u1EEFu t\u1EC9",
        "\\mathbb{Q}",
        "\\mathbb{Q}"
      ],
      [
        "S\u1ED1 th\u1EF1c",
        "\\mathbb{R}",
        "\\mathbb{R}"
      ],
      [
        "Kho\u1EA3ng m\u1EDF",
        "(a;b)",
        "(a;b)"
      ],
      [
        "\u0110o\u1EA1n",
        "[a;b]",
        "[a;b]"
      ],
      [
        "N\u1EEDa kho\u1EA3ng",
        "[a;b)",
        "[a;b)"
      ]
    ],
    algebra: [
      [
        "C\u0103n b\u1EADc hai",
        "\\sqrt{x}",
        "\\sqrt{x}"
      ],
      [
        "C\u0103n b\u1EADc n",
        "\\sqrt[n]{x}",
        "\\sqrt[n]{x}"
      ],
      [
        "Ph\xE2n s\u1ED1",
        "\\frac{a}{b}",
        "\\frac{a}{b}"
      ],
      [
        "Gi\xE1 tr\u1ECB tuy\u1EC7t \u0111\u1ED1i",
        "|x|",
        "\\lvert x\\rvert"
      ],
      [
        "Kh\xF4ng b\u1EB1ng",
        "a\\ne b",
        "\\ne"
      ],
      [
        "Nh\u1ECF h\u01A1n ho\u1EB7c b\u1EB1ng",
        "a\\le b",
        "\\le"
      ],
      [
        "L\u1EDBn h\u01A1n ho\u1EB7c b\u1EB1ng",
        "a\\ge b",
        "\\ge"
      ],
      [
        "V\xF4 c\u1EF1c",
        "+\\infty,\\ -\\infty",
        "\\infty"
      ],
      [
        "T\u1ED5ng",
        "\\sum_{k=1}^{n}u_k",
        "\\sum"
      ],
      [
        "T\xEDch",
        "\\prod_{k=1}^{n}u_k",
        "\\prod"
      ]
    ],
    plane_geometry: [
      [
        "\u0110o\u1EA1n th\u1EB3ng",
        "AB",
        "AB"
      ],
      [
        "Tia",
        "Ax",
        "Ax"
      ],
      [
        "G\xF3c",
        "\\widehat{ABC}",
        "\\widehat{ABC}"
      ],
      [
        "\u0110\u1ED9",
        "60^\\circ",
        "^\\circ"
      ],
      [
        "Vu\xF4ng g\xF3c",
        "AB\\perp CD",
        "\\perp"
      ],
      [
        "Song song",
        "AB\\parallel CD",
        "\\parallel"
      ],
      [
        "\u0110\u1ED9 d\xE0i vect\u01A1/\u0111o\u1EA1n",
        "AB",
        "AB"
      ]
    ],
    spatial_geometry: [
      [
        "\u0110i\u1EC3m thu\u1ED9c \u0111\u01B0\u1EDDng",
        "H\\in SD",
        "\\in"
      ],
      [
        "\u0110i\u1EC3m thu\u1ED9c m\u1EB7t ph\u1EB3ng",
        "A\\in(P)",
        "\\in"
      ],
      [
        "\u0110\u01B0\u1EDDng thu\u1ED9c m\u1EB7t ph\u1EB3ng",
        "a\\subset(P)",
        "\\subset"
      ],
      [
        "Hai \u0111\u01B0\u1EDDng vu\xF4ng g\xF3c",
        "a\\perp b",
        "\\perp"
      ],
      [
        "\u0110\u01B0\u1EDDng vu\xF4ng g\xF3c m\u1EB7t ph\u1EB3ng",
        "d\\perp(P)",
        "\\perp"
      ],
      [
        "Hai m\u1EB7t ph\u1EB3ng vu\xF4ng g\xF3c",
        "(P)\\perp(Q)",
        "\\perp"
      ],
      [
        "Hai \u0111\u01B0\u1EDDng song song",
        "a\\parallel b",
        "\\parallel"
      ],
      [
        "\u0110\u01B0\u1EDDng song song m\u1EB7t ph\u1EB3ng",
        "d\\parallel(P)",
        "\\parallel"
      ],
      [
        "Hai m\u1EB7t ph\u1EB3ng song song",
        "(P)\\parallel(Q)",
        "\\parallel"
      ],
      [
        "Giao hai \u0111\u01B0\u1EDDng",
        "a\\cap b=\\{M\\}",
        "\\cap"
      ],
      [
        "Giao \u0111\u01B0\u1EDDng v\xE0 m\u1EB7t",
        "d\\cap(P)=\\{H\\}",
        "\\cap"
      ],
      [
        "Giao hai m\u1EB7t ph\u1EB3ng",
        "(P)\\cap(Q)=d",
        "\\cap"
      ],
      [
        "Kho\u1EA3ng c\xE1ch \u0111i\u1EC3m-\u0111\u01B0\u1EDDng",
        "d(M,a)",
        "d(M,a)"
      ],
      [
        "Kho\u1EA3ng c\xE1ch \u0111i\u1EC3m-m\u1EB7t",
        "d(M,(P))",
        "d(M,(P))"
      ],
      [
        "Kho\u1EA3ng c\xE1ch \u0111\u01B0\u1EDDng-m\u1EB7t",
        "d(a,(P))",
        "d(a,(P))"
      ],
      [
        "Kho\u1EA3ng c\xE1ch hai m\u1EB7t",
        "d((P),(Q))",
        "d((P),(Q))"
      ],
      [
        "Kho\u1EA3ng c\xE1ch hai \u0111\u01B0\u1EDDng",
        "d(a,b)",
        "d(a,b)"
      ],
      [
        "V\xED d\u1EE5 chu\u1EA9n h\xECnh ch\xF3p",
        "SA\\perp(ABCD)",
        "SA\\perp(ABCD)"
      ]
    ],
    vectors_coordinates: [
      [
        "Vect\u01A1 AB",
        "\\overrightarrow{AB}",
        "\\overrightarrow{AB}"
      ],
      [
        "Vect\u01A1 a",
        "\\vec{a}",
        "\\vec{a}"
      ],
      [
        "\u0110\u1ED9 d\xE0i vect\u01A1",
        "|\\vec{a}|",
        "\\lvert\\vec{a}\\rvert"
      ],
      [
        "T\xEDch v\xF4 h\u01B0\u1EDBng",
        "\\vec{a}\\cdot\\vec{b}",
        "\\cdot"
      ],
      [
        "\u0110i\u1EC3m trong Oxy",
        "M(x;y)",
        "M(x;y)"
      ],
      [
        "Vect\u01A1 trong Oxy",
        "\\vec{u}=(a;b)",
        "\\vec{u}=(a;b)"
      ],
      [
        "\u0110i\u1EC3m trong Oxyz",
        "M(x;y;z)",
        "M(x;y;z)"
      ],
      [
        "Vect\u01A1 trong Oxyz",
        "\\vec{u}=(a;b;c)",
        "\\vec{u}=(a;b;c)"
      ]
    ],
    functions_calculus: [
      [
        "H\xE0m s\u1ED1",
        "y=f(x)",
        "y=f(x)"
      ],
      [
        "Gi\u1EDBi h\u1EA1n",
        "\\lim_{x\\to x_0}f(x)",
        "\\lim"
      ],
      [
        "Gi\u1EDBi h\u1EA1n v\xF4 c\u1EF1c",
        "\\lim_{x\\to+\\infty}f(x)",
        "\\lim"
      ],
      [
        "\u0110\u1EA1o h\xE0m",
        "f'(x)",
        "f'(x)"
      ],
      [
        "\u0110\u1EA1o h\xE0m c\u1EA5p hai",
        "f''(x)",
        "f''(x)"
      ],
      [
        "Nguy\xEAn h\xE0m",
        "\\int f(x)\\,dx",
        "\\int"
      ],
      [
        "T\xEDch ph\xE2n x\xE1c \u0111\u1ECBnh",
        "\\int_a^b f(x)\\,dx",
        "\\int"
      ]
    ],
    sequences: [
      [
        "D\xE3y s\u1ED1",
        "(u_n)",
        "(u_n)"
      ],
      [
        "C\u1EA5p s\u1ED1 c\u1ED9ng",
        "u_n=u_1+(n-1)d",
        "u_n=u_1+(n-1)d"
      ],
      [
        "C\u1EA5p s\u1ED1 nh\xE2n",
        "u_n=u_1q^{n-1}",
        "u_n=u_1q^{n-1}"
      ]
    ],
    probability_combinatorics: [
      [
        "Ho\xE1n v\u1ECB",
        "P_n=n!",
        "P_n=n!"
      ],
      [
        "Ch\u1EC9nh h\u1EE3p",
        "A_n^k",
        "A_n^k"
      ],
      [
        "T\u1ED5 h\u1EE3p",
        "C_n^k",
        "C_n^k"
      ],
      [
        "Kh\xF4ng gian m\u1EABu",
        "\\Omega",
        "\\Omega"
      ],
      [
        "S\u1ED1 ph\u1EA7n t\u1EED",
        "n(\\Omega),\\ n(A)",
        "n(\\Omega)"
      ],
      [
        "X\xE1c su\u1EA5t",
        "P(A)",
        "P(A)"
      ],
      [
        "X\xE1c su\u1EA5t c\u1ED5 \u0111i\u1EC3n",
        "P(A)=\\frac{n(A)}{n(\\Omega)}",
        "\\frac{}{}"
      ],
      [
        "Bi\u1EBFn c\u1ED1 \u0111\u1ED1i",
        "\\overline{A}",
        "\\overline{A}"
      ],
      [
        "X\xE1c su\u1EA5t c\xF3 \u0111i\u1EC1u ki\u1EC7n",
        "P(A\\mid B)",
        "\\mid"
      ]
    ],
    statistics: [
      [
        "S\u1ED1 trung b\xECnh",
        "\\bar{x}",
        "\\bar{x}"
      ],
      [
        "Trung v\u1ECB",
        "M_e",
        "M_e"
      ],
      [
        "T\u1EE9 ph\xE2n v\u1ECB",
        "Q_1,\\ Q_2,\\ Q_3",
        "Q_1"
      ],
      [
        "Ph\u01B0\u01A1ng sai",
        "s^2",
        "s^2"
      ],
      [
        "\u0110\u1ED9 l\u1EC7ch chu\u1EA9n",
        "s",
        "s"
      ]
    ]
  },
  forbidden_raw_unicode_examples: [
    "\u22A5",
    "\u2225",
    "\u2208",
    "\u2209",
    "\u221A",
    "\u2220",
    "\u21D2",
    "\u21D4",
    "\u2260",
    "\u2264",
    "\u2265",
    "\u221E"
  ],
  kntt_specific_notes: [
    "Coordinates use semicolons: M(x;y) and M(x;y;z).",
    "Combinatorics uses A_n^k and C_n^k; do not normalize to nPk or binomial notation in the main KNTT-style solution.",
    "Spatial planes use parentheses, e.g. (P), (ABC), (ABCD).",
    "A line contained in a plane is written with subset notation, e.g. a\\subset(P), not a\\in(P).",
    "Distance notation follows d(M,a), d(M,(P)), d(a,(P)), d((P),(Q)), d(a,b)."
  ]
};

// src/config/naMathBrandRoot.ts
var PIMATH_DNA = brand_root_default;
var NA_MATH_OUTPUT_PROFILES = output_profiles_default.profiles.map((profile) => ({ ...profile, parentBrandId: output_profiles_default.parentBrandId }));
function fail(message) {
  throw new Error(`PIMATH_DNA_AUTHORITATIVE_TOKEN_UNRESOLVED:${message}`);
}
function resolveBrand() {
  if (PIMATH_DNA.standardId !== "PIMATH-DNA-V1.0" || !PIMATH_DNA.canonical || !PIMATH_DNA.singleSourceOfTruth) fail("root");
  return PIMATH_DNA;
}
function resolveCanonicalReference(name) {
  const value = resolveBrand().references[name];
  return value ?? fail(`reference:${name}`);
}
function resolveMathNotationAuthority() {
  const brand = resolveBrand();
  if (brand.references.math !== "NA_MATH_SYSTEM_BASELINE_V2_6") fail("math:reference");
  return {
    authorityId: "NA_MATH_SYSTEM_BASELINE_V2_6",
    policy: gdpt2018_kntt_math_notation_policy_v2_3_default,
    symbolRegistry: NA_MATH_KNTT_SYMBOL_STANDARD_V1_0_default,
    provenance: { root: brand.standardId, source: "PiMath DNA Core \u2192 Math Notation Authority", binding: "CANONICAL_BINDING" }
  };
}
function resolveSemanticGeometryAuthority() {
  const brand = resolveBrand();
  if (brand.references.math !== "NA_MATH_SYSTEM_BASELINE_V2_6") fail("geometry:reference");
  return {
    authorityId: "NA_MATH_SYSTEM_BASELINE_V2_6",
    standardId: "NA_MATH_GEOMETRY_RULES_V1_8_GEO8",
    manifest: geometry_manifest_default,
    profiles: view_profile_registry_default,
    provenance: { root: brand.standardId, source: "PiMath DNA Core \u2192 Semantic Geometry Authority", binding: "CANONICAL_BINDING" }
  };
}

// src/config/pimathRendererProvenance.ts
function resolveRendererColor(role) {
  if (resolveBrand().references.color !== NA_MATH_OUTPUT_COLOR_SYSTEM_V1_0_default.id) throw new Error("PIMATH_DNA_AUTHORITATIVE_TOKEN_UNRESOLVED:renderer-color");
  return { value: NA_MATH_OUTPUT_COLOR_SYSTEM_V1_0_default.shared_tokens[role], role, authority: resolveCanonicalReference("color"), provenance: "CANONICAL_BINDING" };
}
function resolveRendererTypography(role) {
  if (resolveBrand().references.typography !== "NA_MATH_TYPOGRAPHY_STANDARD_V1_0") throw new Error("PIMATH_DNA_AUTHORITATIVE_TOKEN_UNRESOLVED:renderer-typography");
  return { value: tokens_default.typography[role], role, authority: resolveCanonicalReference("typography"), provenance: "CANONICAL_BINDING" };
}

// src/config/naMathStandardV26.ts
var canonicalVideo = na_math_canonical_layout_v1_1_default.video;
var mathNotationAuthority = resolveMathNotationAuthority();
var semanticGeometryAuthority = resolveSemanticGeometryAuthority();
var NA_MATH_VIDEO_PROFILE = {
  id: pimath_video_visual_canonical_v2_0_default.id,
  canonicalProfileId: pimath_video_visual_canonical_v2_0_default.id,
  canonicalLayoutId: canonicalVideo.canonicalLayoutId,
  semanticOrder: canonicalVideo.semanticOrder,
  canvas: { ...canonicalVideo.canvas, fps: 30 },
  macroLayout: canonicalVideo.macroLayout,
  behavior: canonicalVideo.behavior,
  visualLanguage: na_math_video_visual_language_v1_0_default,
  goldenReference: na_math_video_golden_start_mid_end_v1_default,
  iconAuthority: pimath_dna_icons_default,
  iconRoles: { question: "QUESTION_SOURCE", solution: "SOLUTION_REASONING", figure: "GEOMETRY_FIGURE", result: "RESULT_SUCCESS" },
  colors: {
    background: resolveRendererColor("paper").value,
    video: resolveRendererColor("amber").value,
    panelStroke: tokens_default.color.neutral.line,
    panelFill: tokens_default.color.neutral.paper
  },
  typography: {
    title: "STIX Two Text Bold",
    section: "XCharter",
    body: resolveRendererTypography("body").value,
    question: resolveRendererTypography("body").value,
    math: resolveRendererTypography("math").value,
    label: "XCharter"
  },
  regions: {
    topSafe: [-6.25, 6.25, 2.18, 3.32],
    leftSafe: [-6.35, -0.25, -3.32, 1.08],
    rightSafe: [0.25, 6.35, -3.32, 1.08],
    topPanel: { width: 13.25, height: 1.62, center: [0, 2.78] },
    leftPanel: { width: 6.55, height: 5.35, center: [-3.42, -1.08] },
    rightPanel: { width: 6.55, height: 5.35, center: [3.42, -1.08] },
    problem: { maxWidth: 12.1, maxHeight: 0.98, center: [0, 2.72] },
    solution: { maxWidth: 5.75, maxHeight: 3.9, center: [-3.42, -1.15] },
    visual: { maxWidth: 5.65, maxHeight: 3.9, center: [3.42, -1.15] }
  },
  sizes: {
    panelTitle: 25,
    questionTag: 23,
    body: { min: 24, max: 26 },
    stepTitle: 29,
    math: { min: 27, max: 32 },
    result: 36,
    label: { min: 20, max: 24 }
  },
  spacing: {
    questionBlockGap: 0.12,
    solutionBlockGap: { min: 0.18, max: 0.24 }
  },
  animation: ["Write", "Create", "TransformMatchingTex", "Indicate", "Circumscribe", "Highlight", "light Camera zoom"],
  layout: "approved two-frame teacher-video mapping",
  noVisualPolicy: "KEEP_RIGHT_REGION_EMPTY",
  proseEngine: "Text/VText",
  mathEngine: "MathTex"
};
function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
var canonicalCommands = new Set(
  Object.values(mathNotationAuthority.symbolRegistry.categories).flat().flatMap((entry) => `${entry[1]} ${entry[2]}`.match(/\\[A-Za-z]+/g) ?? [])
);
function validateMathSource(source) {
  const reasons = [];
  const rawSymbols = mathNotationAuthority.symbolRegistry.forbidden_raw_unicode_examples.filter((symbol) => source.includes(symbol));
  if (rawSymbols.length) reasons.push(`RAW_UNICODE_MATH:${rawSymbols.join(",")}`);
  const unknownCommands = [...new Set(source.match(/\\[A-Za-z]+/g) ?? [])].filter(
    (command) => !canonicalCommands.has(command)
  );
  if (unknownCommands.length) reasons.push(`UNKNOWN_CANONICAL_SYMBOL:${unknownCommands.join(",")}`);
  return reasons.length ? { status: "BLOCK_RENDER", reasons } : { status: "PASS", reasons: [] };
}
var NA_MATH_STANDARD_V2_6 = deepFreeze({
  id: "NA_MATH_STANDARD_V2_6",
  baseline: NA_MATH_SYSTEM_CORE_LOCK_POLICY_V2_6_default.baseline_name,
  status: NA_MATH_SYSTEM_CORE_LOCK_POLICY_V2_6_default.status,
  canonicalAssetRoot: "standards/NA_MATH_SYSTEM_BASELINE_V2_6_CORE_LOCK",
  layout: {
    id: semanticGeometryAuthority.profiles.layout_contract.layout_id,
    status: semanticGeometryAuthority.profiles.layout_contract.status,
    tokens: tokens_default.layout
  },
  video: NA_MATH_VIDEO_PROFILE,
  colorSystem: NA_MATH_OUTPUT_COLOR_SYSTEM_V1_0_default,
  typography: tokens_default.typography,
  mathNotation: mathNotationAuthority.policy,
  symbolRegistry: mathNotationAuthority.symbolRegistry,
  semanticGeometry: {
    pipeline: semanticGeometryAuthority.manifest.core_pipeline,
    rules: semanticGeometryAuthority.profiles.rules
  },
  approvedGeometryProfiles: semanticGeometryAuthority.profiles,
  qaContracts: NA_MATH_SYSTEM_CORE_LOCK_POLICY_V2_6_default,
  validateMathSource
});

// src/modules/document-export/docx/types.ts
var DocxRenderError = class extends Error {
  constructor(code, message, causeDetail) {
    super(message);
    this.code = code;
    this.causeDetail = causeDetail;
    this.name = "DocxRenderError";
  }
};

// src/modules/document-export/docx/xml.ts
function escapeXml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

// src/modules/document-export/docx/omml.ts
var entities = {
  perp: "&#x22A5;",
  parallel: "&#x2225;",
  in: "&#x2208;",
  notin: "&#x2209;",
  subset: "&#x2282;",
  subseteq: "&#x2286;",
  cap: "&#x2229;",
  cup: "&#x222A;",
  Rightarrow: "&#x21D2;",
  Leftrightarrow: "&#x21D4;",
  ne: "&#x2260;",
  le: "&#x2264;",
  ge: "&#x2265;",
  infty: "&#x221E;",
  Omega: "&#x03A9;",
  sum: "&#x2211;",
  int: "&#x222B;",
  to: "&#x2192;",
  circ: "&#x00B0;",
  cdot: "&#x22C5;",
  mid: "&#x2223;"
};
function tokenize(source) {
  const tokens = [];
  for (let index = 0; index < source.length; ) {
    const char = source[index];
    if (char === "\\") {
      const match = /^\\([A-Za-z]+|.)/.exec(source.slice(index));
      if (!match) throw new DocxRenderError("OMML_TOKENIZE_FAILED", `Invalid command at ${index}.`);
      tokens.push({ kind: "command", value: match[1] });
      index += match[0].length;
      continue;
    }
    const kinds = { "{": "open", "}": "close", "[": "openBracket", "]": "closeBracket", "^": "sup", "_": "sub" };
    tokens.push({ kind: kinds[char] ?? "char", value: char });
    index++;
  }
  return tokens;
}
var run = (value, entity = false) => `<m:r><m:t>${entity ? value : escapeXml(value)}</m:t></m:r>`;
var OmmlParser = class {
  constructor(tokens) {
    this.tokens = tokens;
    this.index = 0;
  }
  parse(stop) {
    let result = "";
    while (this.index < this.tokens.length && this.tokens[this.index].kind !== stop) result += this.atomWithScripts();
    if (stop) {
      if (this.tokens[this.index]?.kind !== stop) throw new DocxRenderError("OMML_GROUP_UNCLOSED", "Unclosed canonical math group.");
      this.index++;
    }
    return result;
  }
  group(bracket = false) {
    const open = bracket ? "openBracket" : "open";
    const close = bracket ? "closeBracket" : "close";
    if (this.tokens[this.index]?.kind !== open) return this.atomWithScripts();
    this.index++;
    return this.parse(close);
  }
  atomWithScripts() {
    let base = this.atom();
    let sub;
    let sup;
    while (this.tokens[this.index]?.kind === "sub" || this.tokens[this.index]?.kind === "sup") {
      const kind = this.tokens[this.index++].kind;
      const value = this.group();
      if (kind === "sub") sub = value;
      else sup = value;
    }
    if (sub && sup) return `<m:sSubSup><m:e>${base}</m:e><m:sub>${sub}</m:sub><m:sup>${sup}</m:sup></m:sSubSup>`;
    if (sub) return `<m:sSub><m:e>${base}</m:e><m:sub>${sub}</m:sub></m:sSub>`;
    if (sup) return `<m:sSup><m:e>${base}</m:e><m:sup>${sup}</m:sup></m:sSup>`;
    return base;
  }
  atom() {
    const token = this.tokens[this.index++];
    if (!token) return "";
    if (token.kind === "open") return this.parse("close");
    if (token.kind === "openBracket") return run("[") + this.parse("closeBracket") + run("]");
    if (token.kind === "close" || token.kind === "closeBracket") throw new DocxRenderError("OMML_GROUP_UNEXPECTED_CLOSE", "Unexpected canonical math group close.");
    if (token.kind === "char") return run(token.value);
    if (token.kind !== "command") return "";
    if (token.value === "," || token.value === ";" || token.value === " " || token.value === "!") return run(" ");
    if (token.value === "{" || token.value === "}") return run(token.value);
    if (token.value === "frac") return `<m:f><m:num>${this.group()}</m:num><m:den>${this.group()}</m:den></m:f>`;
    if (token.value === "sqrt") {
      const degree = this.tokens[this.index]?.kind === "openBracket" ? this.group(true) : "";
      return `<m:rad><m:radPr><m:degHide m:val="${degree ? 0 : 1}"/></m:radPr>${degree ? `<m:deg>${degree}</m:deg>` : ""}<m:e>${this.group()}</m:e></m:rad>`;
    }
    if (["vec", "overrightarrow", "widehat", "overline"].includes(token.value)) {
      const accents = { vec: "&#x20D7;", overrightarrow: "&#x20D7;", widehat: "&#x0302;", overline: "&#x0305;" };
      return `<m:acc><m:accPr><m:chr m:val="${accents[token.value]}"/></m:accPr><m:e>${this.group()}</m:e></m:acc>`;
    }
    if (token.value === "lim") return run("lim");
    if (token.value === "lvert") return run("|");
    if (token.value === "rvert") return run("|");
    if (token.value === "mathbb") return this.group();
    const entity = entities[token.value];
    if (entity) return run(entity, true);
    throw new DocxRenderError("UNKNOWN_CANONICAL_SYMBOL", `Unsupported canonical OMML command: \\${token.value}`);
  }
};
function serializeMathNodeToOmml(node) {
  const source = node.normalized ?? node.latex ?? (node.sourceType === "LATEX" ? node.sourceRaw : void 0);
  if (!source) throw new DocxRenderError("MATH_SOURCE_UNRESOLVED", `Math source is unresolved at ${node.sourceLocation}.`);
  const validation = NA_MATH_STANDARD_V2_6.validateMathSource(source);
  if (validation.status !== "PASS") throw new DocxRenderError(validation.status, validation.reasons.join("; "));
  return `<m:oMath><m:oMathPr><m:ctrlPr><w:rPr><w:rFonts w:ascii="${escapeXml(NA_MATH_STANDARD_V2_6.typography.math)}" w:hAnsi="${escapeXml(NA_MATH_STANDARD_V2_6.typography.math)}"/></w:rPr></m:ctrlPr></m:oMathPr>${new OmmlParser(tokenize(source)).parse()}</m:oMath>`;
}

// src/modules/question-bank/export.ts
var digest = (value) => (0, import_node_crypto7.createHash)("sha256").update(value).digest("hex");
var stableValue = (value) => value instanceof Uint8Array ? { $type: "Uint8Array", base64: Buffer.from(value).toString("base64") } : Array.isArray(value) ? value.map(stableValue) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, stableValue(item)])) : value;
var stableStringify = (value, space = 2) => JSON.stringify(stableValue(value), null, space);
var cloneBlocks = (value) => value ? structuredClone(value) : void 0;
var validFormats = /* @__PURE__ */ new Set(["JSON", "LATEX", "DOCX", "PDF"]);
var explicitAnswer = (manifest, id) => manifest.entries.find((entry) => entry.questionId === id);
function validateExportSpec(spec) {
  const diagnostics = [];
  if (!spec || !["STUDENT", "TEACHER"].includes(spec.audience) || !Array.isArray(spec.formats) || !spec.formats.length || spec.formats.some((format) => !validFormats.has(format)) || new Set(spec.formats).size !== spec.formats.length || !spec.outputDirectory?.trim() || !(0, import_node_path3.isAbsolute)(spec.outputDirectory) || spec.assetMode !== void 0 && !["REFERENCE", "EMBED"].includes(spec.assetMode) || spec.outputProfile !== void 0 && spec.outputProfile !== "NA_MATH_STANDARD") diagnostics.push({ code: "INVALID_EXPORT_SPEC", message: "Audience, unique supported formats, an absolute output directory, asset mode, and output profile must be valid." });
  if (spec.audience === "STUDENT" && (spec.includeAnswers || spec.includeSolutions)) diagnostics.push({ code: "ANSWER_LEAK_BLOCKED", message: "Student exports cannot include answers or solutions." });
  return diagnostics;
}
function confirmedFigures(question2) {
  const confirmed = new Set(question2.figureAssociations.filter((association) => association.status === "CONFIRMED" && association.questionId === question2.id).map((association) => association.figureId));
  return question2.figures.filter((figure) => confirmed.has(figure.id) && ["REAL_FIGURE", "RASTER_FIGURE"].includes(figure.semanticRole ?? ""));
}
function extension(mimeType) {
  return mimeType === "image/png" ? ".png" : mimeType === "image/jpeg" ? ".jpg" : mimeType === "image/svg+xml" ? ".svg" : mimeType === "image/gif" ? ".gif" : ".bin";
}
function createCanonicalExportPackage(assessment, answerManifest, repository, spec) {
  const diagnostics = validateExportSpec(spec);
  if (answerManifest.assessmentId !== assessment.id) diagnostics.push({ code: "INVALID_EXPORT_SPEC", message: "Answer manifest does not belong to the assessment." });
  if (diagnostics.length) return { ok: false, diagnostics };
  const bank = repository.load();
  const byId = new Map(bank.questions.map((question2) => [question2.id, question2]));
  const assets = /* @__PURE__ */ new Map();
  const sources = {};
  const sections = [];
  for (const section2 of assessment.sections) {
    const specSection = assessment.spec.sections.find((candidate) => candidate.id === section2.id);
    const questions = [];
    for (const ref of section2.questionRefs) {
      const source = byId.get(ref.questionId);
      if (!source) {
        diagnostics.push({ code: "MISSING_QUESTION", message: "Assessment references a missing Question Bank entry.", questionId: ref.questionId });
        continue;
      }
      const figureRefs = [];
      for (const [order, figure] of confirmedFigures(source).entries()) {
        if (!figure.bytes?.length) {
          diagnostics.push({ code: "MISSING_ASSET", message: "A confirmed figure has no source bytes.", questionId: source.id, details: { figureId: figure.id } });
          continue;
        }
        const contentHash = digest(figure.bytes);
        const assetId = `asset-${contentHash.slice(0, 16)}`;
        const existing = assets.get(assetId);
        if (existing) {
          if (!existing.questionIds.includes(source.id)) existing.questionIds.push(source.id);
          if (!existing.sourceRelationships.includes(figure.relationshipId)) existing.sourceRelationships.push(figure.relationshipId);
        } else assets.set(assetId, { id: assetId, contentHash, mimeType: figure.mimeType ?? "application/octet-stream", filename: `${assetId}${extension(figure.mimeType ?? "")}`, sourceRelationships: [figure.relationshipId], questionIds: [source.id], bytes: new Uint8Array(figure.bytes) });
        figureRefs.push({ figureId: figure.id, assetId, relationshipId: figure.relationshipId, order, dimensions: structuredClone(figure.dimensions) });
      }
      const manifest = explicitAnswer(answerManifest, source.id);
      const question2 = { id: source.id, sectionId: section2.id, position: ref.position, type: source.type, stem: structuredClone(source.stem), options: structuredClone(source.options), trueFalseItems: structuredClone(source.trueFalseItems), shortAnswer: cloneBlocks(source.shortAnswer), subquestions: structuredClone(source.subquestions), figures: figureRefs, points: ref.points };
      if (spec.audience === "TEACHER") {
        if (spec.includeAnswers && manifest?.answer?.length) question2.answer = structuredClone(manifest.answer);
        if (spec.includeSolutions && manifest?.solution?.length) question2.solution = structuredClone(manifest.solution);
        if (spec.includeMetadata) question2.metadata = structuredClone(source.metadata);
        if (spec.includeProvenance) question2.provenance = structuredClone(source.source);
        sources[source.id] = structuredClone(source.source);
      }
      questions.push(question2);
    }
    sections.push({ id: section2.id, title: section2.title, questionType: specSection?.questionType ?? questions[0]?.type ?? "UNKNOWN", pointsPerQuestion: section2.pointsPerQuestion, questions: questions.sort((a, b) => a.position - b.position) });
  }
  if (diagnostics.some((entry) => entry.code === "MISSING_QUESTION" || entry.code === "MISSING_ASSET")) return { ok: false, diagnostics };
  const questionRefs = sections.flatMap((section2) => section2.questions.map((question2) => question2.id));
  const answerKey = spec.audience === "TEACHER" && spec.includeAnswers ? questionRefs.map((questionId) => {
    const entry = explicitAnswer(answerManifest, questionId);
    return entry?.answer?.length ? { questionId, status: "EXPLICIT", answer: structuredClone(entry.answer) } : { questionId, status: "UNRESOLVED" };
  }) : void 0;
  const solutions = spec.audience === "TEACHER" && spec.includeSolutions ? questionRefs.map((questionId) => {
    const entry = explicitAnswer(answerManifest, questionId);
    return entry?.solution?.length ? { questionId, status: "EXPLICIT", solution: structuredClone(entry.solution) } : { questionId, status: "UNRESOLVED" };
  }) : void 0;
  const semantic = { assessmentId: assessment.id, audience: spec.audience, questionRefs, answerKey, solutions, assets: [...assets.values()].map(({ bytes, ...asset }) => asset) };
  const id = `export-${digest(stableStringify(semantic, 0)).slice(0, 16)}`;
  return { ok: true, package: { schemaVersion: 1, id, kind: "ASSESSMENT_EXPORT", audience: spec.audience, assessment: { id: assessment.id, title: assessment.title, seed: assessment.seed, bankFingerprint: assessment.bankFingerprint }, sections, questionRefs, assets: [...assets.values()].sort((a, b) => a.id.localeCompare(b.id)), answerKey, solutions, metadata: spec.audience === "TEACHER" && spec.includeMetadata ? structuredClone(assessment.spec.metadata ?? {}) : void 0, provenance: spec.audience === "TEACHER" && spec.includeProvenance ? { assessmentId: assessment.id, bankFingerprint: assessment.bankFingerprint, questionSources: sources } : void 0, diagnostics } };
}
var xml = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
var latexEscape = (value) => value.replace(/\\/g, "\\textbackslash{}").replace(/([#$%&_{}])/g, "\\$1").replace(/~/g, "\\textasciitilde{}").replace(/\^/g, "\\textasciicircum{}");
function plain(blocks) {
  return (blocks ?? []).map((block) => block.type === "text" ? block.value : block.type === "math" ? block.math.latex ?? block.math.sourceRaw : block.type === "figure" ? `[FIGURE:${block.figureId}]` : block.cells.map((cell) => plain(cell)).join(" | ")).join("");
}
function exportLatex(source) {
  return source.trim().replace(/\\right\s*$/, "\\right.");
}
function latexBlocks(blocks) {
  return (blocks ?? []).map((block) => block.type === "text" ? latexEscape(block.value) : block.type === "math" ? `\\(${exportLatex(block.math.latex ?? latexEscape(block.math.sourceRaw))}\\)` : block.type === "figure" ? "" : block.cells.map((cell) => latexBlocks(cell)).join(" & ")).join("");
}
function wordMath(block) {
  const source = block.math.sourceRaw.trim();
  return block.math.sourceType === "OMML" && /^<m:oMath(?:\s|>)/.test(source) ? source : serializeMathNodeToOmml(block.math);
}
function wordRuns(blocks) {
  return (blocks ?? []).map((block) => block.type === "text" ? `<w:r><w:t xml:space="preserve">${xml(block.value)}</w:t></w:r>` : block.type === "math" ? wordMath(block) : block.type === "table" ? `<w:r><w:t>${xml(block.cells.map((cell) => plain(cell)).join(" | "))}</w:t></w:r>` : "").join("");
}
var paragraph = (blocks, prefix = "") => `<w:p><w:r><w:t xml:space="preserve">${xml(prefix)}</w:t></w:r>${wordRuns(blocks)}</w:p>`;
function serializeJsonPackage(pkg, assetMode = "REFERENCE") {
  const value = { ...pkg, assets: pkg.assets.map((asset) => {
    const { bytes, ...reference } = asset;
    return assetMode === "EMBED" ? { ...reference, bytesBase64: Buffer.from(bytes).toString("base64") } : reference;
  }) };
  return stableStringify(value);
}
function renderLatex(pkg) {
  const body = [];
  for (const section2 of pkg.sections) {
    body.push(`\\section*{${latexEscape(section2.title ?? section2.id)}}`);
    for (const question2 of section2.questions) {
      body.push(`\\noindent\\textbf{C\xE2u ${question2.position}.} ${latexBlocks(question2.stem)}\\par`);
      for (const option of question2.options) body.push(`\\noindent ${latexEscape(option.label)}. ${latexBlocks(option.content)}\\par`);
      for (const item of question2.trueFalseItems) body.push(`\\noindent ${latexEscape(item.label)}. ${latexBlocks(item.content)}\\par`);
      for (const sub of question2.subquestions) body.push(`\\noindent ${latexEscape(sub.label)}. ${latexBlocks(sub.content)}\\par`);
      for (const figure of question2.figures) {
        const asset = pkg.assets.find((candidate) => candidate.id === figure.assetId);
        if (asset) body.push(`\\begin{center}\\includegraphics[width=0.42\\linewidth]{assets/${latexEscape(asset.filename)}}\\end{center}`);
      }
      if (pkg.audience === "TEACHER" && question2.answer) body.push(`\\noindent\\textbf{\u0110\xE1p \xE1n:} ${latexBlocks(question2.answer)}\\par`);
      if (pkg.audience === "TEACHER" && question2.solution) body.push(`\\noindent\\textbf{L\u1EDDi gi\u1EA3i:} ${latexBlocks(question2.solution)}\\par`);
      body.push("\\medskip");
    }
  }
  return [`\\documentclass[12pt,a4paper]{article}`, `\\usepackage{fontspec}`, `\\usepackage{amsmath,amssymb,graphicx}`, `\\setlength{\\oddsidemargin}{0pt}`, `\\setlength{\\evensidemargin}{0pt}`, `\\setlength{\\textwidth}{16cm}`, `\\setlength{\\topmargin}{-1cm}`, `\\setlength{\\textheight}{24cm}`, `\\setlength{\\parindent}{0pt}`, `\\begin{document}`, `\\begin{center}\\Large\\textbf{${latexEscape(pkg.assessment.title ?? "Math AI Studio Assessment")}}\\end{center}`, ...body, "\\end{document}", ""].join("\n");
}
function drawing(rid, asset, index) {
  const cx = 2743200, cy = 1828800;
  return `<w:p><w:r><w:drawing><wp:inline><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${index}" name="${xml(asset.filename)}"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="${xml(asset.filename)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}
function renderDocx(pkg) {
  const relationships2 = [], media = {};
  const ridByAsset = /* @__PURE__ */ new Map();
  pkg.assets.forEach((asset, index) => {
    const rid = `rId${index + 1}`;
    ridByAsset.set(asset.id, rid);
    relationships2.push(`<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${xml(asset.filename)}"/>`);
    media[`word/media/${asset.filename}`] = asset.bytes;
  });
  const body = [];
  body.push(`<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>${xml(pkg.assessment.title ?? "Math AI Studio Assessment")}</w:t></w:r></w:p>`);
  let drawingIndex = 1;
  for (const section2 of pkg.sections) {
    body.push(`<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>${xml(section2.title ?? section2.id)}</w:t></w:r></w:p>`);
    for (const question2 of section2.questions) {
      body.push(paragraph(question2.stem, `C\xE2u ${question2.position}. `));
      question2.options.forEach((option) => body.push(paragraph(option.content, `${option.label}. `)));
      question2.trueFalseItems.forEach((item) => body.push(paragraph(item.content, `${item.label}. `)));
      question2.subquestions.forEach((sub) => body.push(paragraph(sub.content, `${sub.label}. `)));
      for (const figure of question2.figures) {
        const rid = ridByAsset.get(figure.assetId), asset = pkg.assets.find((candidate) => candidate.id === figure.assetId);
        if (rid && asset) body.push(drawing(rid, asset, drawingIndex++));
      }
      if (pkg.audience === "TEACHER" && question2.answer) body.push(paragraph(question2.answer, "\u0110\xE1p \xE1n: "));
      if (pkg.audience === "TEACHER" && question2.solution) body.push(paragraph(question2.solution, "L\u1EDDi gi\u1EA3i: "));
    }
  }
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${body.join("")}<w:sectPr/></w:body></w:document>`;
  const rels = `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships2.join("")}</Relationships>`;
  const rootRels = `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
  const types2 = `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="svg" ContentType="image/svg+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
  const enc = new TextEncoder();
  return zipSync({ "[Content_Types].xml": enc.encode(types2), "_rels/.rels": enc.encode(rootRels), "word/document.xml": enc.encode(documentXml), "word/_rels/document.xml.rels": enc.encode(rels), ...media });
}
function sanitizeExportFilename(value) {
  const safe = value.normalize("NFKC").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").replace(/[. ]+$/g, "").replace(/\s+/g, "-").slice(0, 100);
  return safe || "math-ai-studio-export";
}
function inside(root, candidate) {
  const normalizedRoot = (0, import_node_path3.resolve)(root);
  const normalized = (0, import_node_path3.resolve)(candidate);
  return normalized === normalizedRoot || normalized.startsWith(`${normalizedRoot}${import_node_path3.sep}`);
}
function atomicWrite(path5, bytes) {
  (0, import_node_fs3.mkdirSync)((0, import_node_path3.resolve)(path5, ".."), { recursive: true });
  const temporary = `${path5}.${process.pid}.tmp`;
  (0, import_node_fs3.writeFileSync)(temporary, bytes);
  (0, import_node_fs3.renameSync)(temporary, path5);
}
function artifact(format, path5) {
  const bytes = (0, import_node_fs3.readFileSync)(path5);
  if (!bytes.length) throw new Error(`EMPTY_EXPORT_ARTIFACT:${format}`);
  return { format, path: path5, bytes: bytes.length, sha256: digest(bytes) };
}
function writeAssets(directory, assets) {
  (0, import_node_fs3.mkdirSync)(directory, { recursive: true });
  for (const asset of assets) atomicWrite((0, import_node_path3.join)(directory, asset.filename), asset.bytes);
}
function latexEngine() {
  for (const command of ["xelatex", "lualatex"]) {
    if ((0, import_node_child_process.spawnSync)(command, ["--version"], {
      stdio: "ignore",
      windowsHide: true
    }).status === 0) {
      return command;
    }
  }
  return void 0;
}
function latexCompileArguments(outputDirectory, texPath, platform = process.platform) {
  const installerPolicy = platform === "win32" ? ["--disable-installer"] : [];
  return [
    ...installerPolicy,
    "-interaction=nonstopmode",
    "-halt-on-error",
    "-output-directory",
    outputDirectory,
    texPath
  ];
}
var QuestionBankExportService = class {
  deliver(assessment, answerManifest, repository, spec) {
    const created = createCanonicalExportPackage(assessment, answerManifest, repository, spec);
    if ("diagnostics" in created) return { ok: false, diagnostics: created.diagnostics };
    const pkg = created.package;
    const outputRoot = (0, import_node_path3.resolve)(spec.outputDirectory);
    (0, import_node_fs3.mkdirSync)(outputRoot, { recursive: true });
    const base = sanitizeExportFilename(spec.filename ?? assessment.title ?? assessment.id);
    const artifacts = [];
    const temp = (0, import_node_fs3.mkdtempSync)((0, import_node_path3.join)((0, import_node_os2.tmpdir)(), "math-ai-export-"));
    try {
      writeAssets((0, import_node_path3.join)(temp, "assets"), pkg.assets);
      const pending = [];
      for (const format of spec.formats) {
        const extensionName = format === "JSON" ? ".json" : format === "LATEX" ? ".tex" : format === "DOCX" ? ".docx" : ".pdf";
        const finalPath = (0, import_node_path3.join)(outputRoot, `${base}${extensionName}`);
        const temporaryPath = (0, import_node_path3.join)(temp, `export${extensionName}`);
        if (!inside(outputRoot, finalPath)) return { ok: false, diagnostics: [{ code: "INVALID_EXPORT_SPEC", message: "Resolved output path escaped the requested directory." }] };
        try {
          if (format === "JSON") {
            (0, import_node_fs3.writeFileSync)(
              temporaryPath,
              serializeJsonPackage(pkg, spec.assetMode)
            );
          } else if (format === "LATEX") {
            (0, import_node_fs3.writeFileSync)(temporaryPath, renderLatex(pkg));
          } else if (format === "DOCX") {
            (0, import_node_fs3.writeFileSync)(temporaryPath, renderDocx(pkg));
          } else {
            const engine = latexEngine();
            if (!engine) {
              return {
                ok: false,
                diagnostics: [
                  {
                    code: "LATEX_COMPILE_FAILED",
                    message: "XeLaTeX or LuaLaTeX is not available for the authoritative PDF path."
                  }
                ]
              };
            }
            const texPath = (0, import_node_path3.join)(temp, "assessment.tex");
            const texCache = (0, import_node_path3.join)(temp, "tex-cache");
            (0, import_node_fs3.mkdirSync)(texCache, { recursive: true });
            (0, import_node_fs3.writeFileSync)(texPath, renderLatex(pkg), "utf8");
            (0, import_node_child_process.execFileSync)(
              engine,
              latexCompileArguments(temp, texPath),
              {
                cwd: temp,
                stdio: "pipe",
                windowsHide: true,
                env: {
                  ...process.env,
                  TEXMFCACHE: texCache,
                  TEXMFVAR: texCache
                }
              }
            );
            const generated = (0, import_node_path3.join)(temp, "assessment.pdf");
            if (!(0, import_node_fs3.existsSync)(generated) || !(0, import_node_fs3.readFileSync)(generated).subarray(0, 4).equals(Buffer.from("%PDF"))) {
              throw new Error("PDF_SIGNATURE_INVALID");
            }
            (0, import_node_fs3.writeFileSync)(
              temporaryPath,
              (0, import_node_fs3.readFileSync)(generated)
            );
          }
          if (!(0, import_node_fs3.readFileSync)(temporaryPath).length) throw new Error(`EMPTY_EXPORT_ARTIFACT:${format}`);
          pending.push({ format, temporary: temporaryPath, final: finalPath });
        } catch (error) {
          const code = format === "DOCX" ? "DOCX_GENERATION_FAILED" : format === "PDF" ? "PDF_GENERATION_FAILED" : format === "LATEX" ? "LATEX_COMPILE_FAILED" : "INVALID_EXPORT_SPEC";
          const logPath = (0, import_node_path3.join)(temp, "assessment.log");
          const log = (0, import_node_fs3.existsSync)(logPath) ? (0, import_node_fs3.readFileSync)(logPath, "utf8").slice(-4e3) : "";
          return { ok: false, diagnostics: [{ code, message: `${error instanceof Error ? error.message : String(error)}${log ? `
${log}` : ""}` }] };
        }
      }
      for (const item of pending) {
        atomicWrite(item.final, (0, import_node_fs3.readFileSync)(item.temporary));
        artifacts.push(artifact(item.format, item.final));
      }
      if (spec.formats.includes("LATEX")) writeAssets((0, import_node_path3.join)(outputRoot, "assets"), pkg.assets);
      return { ok: true, package: pkg, artifacts };
    } finally {
      (0, import_node_fs3.rmSync)(temp, { recursive: true, force: true });
    }
  }
};

// desktop/jobs/jobManager.ts
var JobManager = class {
  constructor(root) {
    this.root = root;
  }
  async create(sourcePath, outputProfile = "NA_MATH_STANDARD") {
    const inputType = detectInputType(sourcePath);
    if (inputType !== "docx") throw new Error("UNSUPPORTED_FILE: DOCX vertical slice only");
    const p = await ensureWorkspace(this.root);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const job = { jobId: `desktop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, sourcePath, sourceHash: await hashSource(sourcePath), inputType, outputProfile, status: "QUEUED", createdAt: now, localWorkspacePath: import_node_path4.default.join(p.jobs, `desktop-${Date.now()}`), resultPaths: [], publishedPaths: [], issues: [], reviewRequired: false };
    await import_node_fs4.promises.mkdir(job.localWorkspacePath, { recursive: true });
    const persist = async () => import_node_fs4.promises.writeFile(import_node_path4.default.join(p.jobs, `${job.jobId}.json`), JSON.stringify(job, null, 2));
    await persist();
    try {
      const bytes = new Uint8Array(await import_node_fs4.promises.readFile(sourcePath));
      job.status = "ANALYZING";
      await persist();
      const repository = new MemoryQuestionBankRepository();
      const bank = new QuestionBankService(repository);
      const imported = await bank.importDocxForRuntime(bytes, import_node_path4.default.basename(sourcePath));
      if (!imported.imported.length) throw new Error("DOCX_NO_QUESTIONS");
      const ids = imported.imported.map((q) => q.id);
      const snapshot = repository.load();
      for (const q of snapshot.questions) if (ids.includes(q.id)) q.bankStatus = "APPROVED";
      repository.replace(snapshot);
      job.status = "PROCESSING";
      await persist();
      const types2 = [...new Set(imported.imported.map((q) => q.type))];
      const assessment = new AssessmentService(repository).generate({ id: job.jobId, title: import_node_path4.default.basename(sourcePath, import_node_path4.default.extname(sourcePath)), seed: job.sourceHash, sections: types2.map((type, i) => ({ id: `section-${i + 1}`, questionType: type, count: imported.imported.filter((q) => q.type === type).length })) });
      if (assessment.ok !== true) throw new Error(assessment.diagnostics.map((d) => d.message).join(" | "));
      job.status = "EXPORTING";
      await persist();
      const created = new QuestionBankExportService().deliver(assessment.assessment, assessment.answerManifest, repository, { audience: "TEACHER", formats: ["DOCX"], includeAnswers: true, includeSolutions: true, includeMetadata: true, includeProvenance: true, assetMode: "EMBED", outputProfile: "NA_MATH_STANDARD", outputDirectory: job.localWorkspacePath, filename: import_node_path4.default.basename(sourcePath, import_node_path4.default.extname(sourcePath)) });
      if (created.ok !== true) throw new Error(created.diagnostics.map((d) => d.message).join(" | "));
      const staged = created.artifacts[0].path;
      job.resultPaths = [staged];
      const config = JSON.parse(await import_node_fs4.promises.readFile(p.config, "utf8").catch(() => "{}"));
      if (config.outputRoot) job.publishedPaths = [await publishAtomically(staged, config.outputRoot, import_node_path4.default.basename(staged))];
      job.status = "COMPLETED";
      job.completedAt = (/* @__PURE__ */ new Date()).toISOString();
      await persist();
      return job;
    } catch (error) {
      job.status = "FAILED";
      job.issues = [error instanceof Error ? error.message : String(error)];
      await persist();
      throw error;
    }
  }
};

// desktop/platform/windows/open.ts
var import_electron = require("electron");
var openWindowsPath = (target) => import_electron.shell.openPath(target);

// desktop/main/main.ts
var win;
var workspace = appDataRoot();
var jobManager = new JobManager(workspace);
function registerIpc() {
  import_electron2.ipcMain.handle("select-input-files", async () => (await import_electron2.dialog.showOpenDialog(win, { properties: ["openFile", "multiSelections"], filters: [{ name: "PiMath input", extensions: ["docx", "doc", "pdf", "png", "jpg", "jpeg"] }] })).filePaths);
  import_electron2.ipcMain.handle("select-output-root", async () => {
    const result = await import_electron2.dialog.showOpenDialog(win, { properties: ["openDirectory", "createDirectory"] });
    if (result.canceled || !result.filePaths[0]) return null;
    return writeConfiguration({ schemaVersion: 1, outputRoot: result.filePaths[0], updatedAt: (/* @__PURE__ */ new Date()).toISOString() }, workspace).then(() => result.filePaths[0]);
  });
  import_electron2.ipcMain.handle("get-configuration", () => readConfiguration(workspace));
  import_electron2.ipcMain.handle("open-output-folder", async () => {
    const config = await readConfiguration(workspace);
    if (config.outputRoot) await openWindowsPath(config.outputRoot);
  });
  import_electron2.ipcMain.handle("open-result", (_event, resultPath) => typeof resultPath === "string" ? openWindowsPath(resultPath) : Promise.resolve());
  import_electron2.ipcMain.handle("process-job", async (_event, sourcePath, outputProfile) => {
    if (typeof sourcePath !== "string" || !detectInputType(sourcePath)) throw new Error("UNSUPPORTED_FILE");
    return jobManager.create(sourcePath, typeof outputProfile === "string" ? outputProfile : void 0);
  });
}
async function createWindow() {
  await ensureWorkspace(workspace);
  win = new import_electron2.BrowserWindow({ width: 1280, height: 850, webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, preload: import_node_path5.default.join(__dirname, "../preload/preload.cjs") } });
  await win.loadURL(process.env.PIMATH_DESKTOP_URL || "http://127.0.0.1:3000");
}
import_electron2.app.whenReady().then(() => {
  registerIpc();
  return createWindow();
});
import_electron2.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") import_electron2.app.quit();
});
